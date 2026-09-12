const { query } = require("../config/db");
const settingsService = require("../config/settingsService");
const { sendEmailTemplate } = require("./mailService");
const { ACTIVITY_TYPES, createActivity } = require("./adminActivityService");

/**
 * Abandoned Cart & Recovery system (manual-only reminders).
 *
 * Tracks incomplete user activities for LOGGED-IN users only (rows always have
 * a user_id). Recovery candidates are ONLY created after a configurable period
 * of inactivity (given real timestamps — cart item activity), never immediately.
 *
 * Reminders are MANUAL (admin-triggered), exactly 2 per record maximum. There
 * is no scheduled/automatic reminder engine and no recovery window: a record
 * stays open until the admin sends both reminders, the cart is emptied, or the
 * customer completes a real purchase (at which point it becomes Recovered).
 *
 * All Admin-display timestamps are returned as IST-formatted text strings built
 * in SQL from the stored wall-clock values (never re-interpreted through JS
 * timezone math), so dates always read "10 Sep 2026, 7:31 PM" as stored.
 *
 * Extensible: `activityType` is a first-class column. `CART` is the only real
 * logged-in activity currently discovered; other incomplete journeys can use
 * the same engine by adding a detector + completion hook.
 */

const RECOVERY_STATUSES = Object.freeze({
  ABANDONED: "abandoned",
  REMINDER_SENT: "reminder_sent",
  RECOVERED: "recovered",
  NOT_RECOVERED: "not_recovered",
  RECOVERED_LATE: "recovered_late",
});

const ACTIVITY_LABELS = Object.freeze({
  CART: "Cart",
  DEMO_BOOKING: "Demo Booking",
  SMART_HOME_PLANNING: "Smart Home Planning",
});

const TEMPLATE_KEY = "abandoned_cart";
const DEFAULT_CURRENCY = "INR";

/** Hard ceiling — a recovery record may NEVER receive more than 3 reminders. */
const MAX_REMINDERS = 3;

const SETTING_KEYS = {
  enabled: "abandonedCart.enabled",
  thresholdMinutes: "abandonedCart.thresholdMinutes",
  firstReminderHours: "abandonedCart.firstReminderHours",
  secondReminderHours: "abandonedCart.secondReminderHours",
  maxReminders: "abandonedCart.maxReminders",
  recoveryWindowHours: "abandonedCart.recoveryWindowHours",
  stopRemindersOnRecovery: "abandonedCart.stopRemindersOnRecovery",
};

const DEFAULT_SETTINGS = {
  enabled: true,
  thresholdMinutes: 60,
  firstReminderHours: 2,
  secondReminderHours: 24,
  maxReminders: MAX_REMINDERS,
  recoveryWindowHours: 24,
  stopRemindersOnRecovery: true,
};

const noZero = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** Clamp the "maximum reminders" setting to the 1..MAX_REMINDERS range. */
const clampMaxReminders = (value, fallback = MAX_REMINDERS) =>
  Math.max(1, Math.min(MAX_REMINDERS, noZero(value, fallback)));

/** ₹-formatted amount (Indian locale) for email variables / UI strings. */
const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

/** IST display format used by the frontend: "10 Sep 2026, 7:31 PM". */
const IST_DATETIME_FMT = "%d %b %Y, %l:%i %p";
const IST_DATE_FMT = "%d %b %Y";

/** Read the current admin-configurable recovery settings (legacy timing keys retained for storage). */
const getRecoverySettings = async () => {
  const enabled = await settingsService.getBool(SETTING_KEYS.enabled);
  return {
    enabled,
    thresholdMinutes: noZero(
      await settingsService.get(SETTING_KEYS.thresholdMinutes),
      DEFAULT_SETTINGS.thresholdMinutes
    ),
    firstReminderHours: noZero(
      await settingsService.get(SETTING_KEYS.firstReminderHours),
      DEFAULT_SETTINGS.firstReminderHours
    ),
    secondReminderHours: noZero(
      await settingsService.get(SETTING_KEYS.secondReminderHours),
      DEFAULT_SETTINGS.secondReminderHours
    ),
    maxReminders: clampMaxReminders(
      await settingsService.get(SETTING_KEYS.maxReminders),
      DEFAULT_SETTINGS.maxReminders
    ),
    recoveryWindowHours: noZero(
      await settingsService.get(SETTING_KEYS.recoveryWindowHours),
      DEFAULT_SETTINGS.recoveryWindowHours
    ),
    stopRemindersOnRecovery: await settingsService.getBool(SETTING_KEYS.stopRemindersOnRecovery),
  };
};

/** Persist validated recovery settings (partial updates allowed). */
const saveRecoverySettings = async (input = {}) => {
  const current = await getRecoverySettings();
  const parsed = {
    enabled:
      input.enabled !== undefined
        ? Boolean(input.enabled)
        : current.enabled,
    thresholdMinutes: noZero(
      input.thresholdMinutes ?? current.thresholdMinutes,
      DEFAULT_SETTINGS.thresholdMinutes
    ),
    firstReminderHours: noZero(
      input.firstReminderHours ?? current.firstReminderHours,
      DEFAULT_SETTINGS.firstReminderHours
    ),
    secondReminderHours: noZero(
      input.secondReminderHours ?? current.secondReminderHours,
      DEFAULT_SETTINGS.secondReminderHours
    ),
    maxReminders: clampMaxReminders(
      input.maxReminders ?? current.maxReminders,
      DEFAULT_SETTINGS.maxReminders
    ),
    recoveryWindowHours: noZero(
      input.recoveryWindowHours ?? current.recoveryWindowHours,
      DEFAULT_SETTINGS.recoveryWindowHours
    ),
    stopRemindersOnRecovery:
      input.stopRemindersOnRecovery !== undefined
        ? Boolean(input.stopRemindersOnRecovery)
        : current.stopRemindersOnRecovery,
  };

  await settingsService.set(SETTING_KEYS.enabled, String(parsed.enabled));
  await settingsService.set(SETTING_KEYS.thresholdMinutes, String(parsed.thresholdMinutes));
  await settingsService.set(SETTING_KEYS.firstReminderHours, String(parsed.firstReminderHours));
  await settingsService.set(SETTING_KEYS.secondReminderHours, String(parsed.secondReminderHours));
  await settingsService.set(SETTING_KEYS.maxReminders, String(parsed.maxReminders));
  await settingsService.set(SETTING_KEYS.recoveryWindowHours, String(parsed.recoveryWindowHours));
  await settingsService.set(SETTING_KEYS.stopRemindersOnRecovery, String(parsed.stopRemindersOnRecovery));

  return parsed;
};

// ─────────────────────────────────────────────────────────────
// Time helpers.
// The DB server stores datetimes in its own session wall clock (the pool's
// `timezone: "Z"` only affects client-side parsing, not the server clock).
// Everything is kept in that same wall clock so server-side comparisons
// (NOW() vs stored timestamps) stay consistent. Display-ready IST strings are
// produced by MySQL DATE_FORMAT from the raw stored values — no JS timezone
// math, so "10 Sep 2026, 7:31 PM" always matches what the DB actually stored.
// ─────────────────────────────────────────────────────────────

/** Server wall-clock "now" as YYYY-MM-DD HH:MM:SS (matches NOW()). */
const getServerNow = async () => {
  const [row] = await query("SELECT NOW() AS n");
  const value = row?.n instanceof Date ? row.n : new Date(row?.n || Date.now());
  return toSql(value) || "";
};

const addHours = (date, hours) => {
  const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  d.setTime(d.getTime() + Number(hours) * 3600 * 1000);
  return d;
};

const toSql = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace("T", " ");
};

/** Parse a DB datetime (Date object or 'YYYY-MM-DD HH:MM:SS' UTC string). */
const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)) {
    return new Date(`${text.replace(" ", "T")}Z`);
  }
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatFriendlyDate = (value) => {
  const d = toDate(value);
  if (!d) return "";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─────────────────────────────────────────────────────────────
// DETECTION — create recovery records for real abandoned carts.
// Only carts that BELONG to a logged-in user (carts.user_id NOT NULL) qualify.
// A cart is only "abandoned" after `thresholdMinutes` of inactivity.
// ─────────────────────────────────────────────────────────────

const OPEN_STATUSES = [RECOVERY_STATUSES.ABANDONED, RECOVERY_STATUSES.REMINDER_SENT];

const detectAndCreateRecoveries = async () => {
  const settings = await getRecoverySettings();
  if (!settings.enabled) return 0;

  const candidates = await query(
    `SELECT c.user_id, c.id AS cart_id,
            u.email AS user_email,
            CONCAT_WS(' ', up.first_name, up.last_name) AS user_name,
            up.phone AS user_phone,
            COUNT(ci.id) AS item_count,
            SUM(p.price * ci.quantity) AS cart_value,
            MAX(ci.updated_at) AS last_activity
     FROM carts c
     JOIN cart_items ci ON ci.cart_id = c.id
     JOIN products p ON p.id = ci.product_id
     JOIN users u ON u.id = c.user_id
     LEFT JOIN user_profiles up ON up.user_id = c.user_id
     WHERE c.user_id IS NOT NULL
       AND ci.updated_at <= DATE_SUB(NOW(), INTERVAL ? MINUTE)
       AND NOT EXISTS (
         SELECT 1 FROM orders o
         WHERE o.user_id = c.user_id AND o.created_at > ci.updated_at
       )
     GROUP BY c.user_id, c.id
     HAVING item_count > 0`,
    [settings.thresholdMinutes]
  );

  let created = 0;
  for (const cart of Array.isArray(candidates) ? candidates : []) {
    try {
      await createOrReopenRecord(cart);
      created += 1;
    } catch (error) {
      console.warn("[RECOVERY] Failed to create recovery record:", error.message);
    }
  }
  return created;
};

const createOrReopenRecord = async (cart) => {
  const thresholdMinutes =
    noZero(await settingsService.get(SETTING_KEYS.thresholdMinutes), DEFAULT_SETTINGS.thresholdMinutes);

  const lastName = cart.user_name || null;
  const lastActivity = toDate(cart.last_activity || new Date());
  // Abandonment is dated at the moment inactivity crossed the threshold.
  const abandonedAt = addHours(lastActivity, thresholdMinutes / 60);

  const products = await query(
    `SELECT p.id, p.name, p.price, ci.quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = ?
     ORDER BY ci.updated_at DESC
     LIMIT 6`,
    [cart.cart_id]
  );
  const snapshot = (Array.isArray(products) ? products : []).map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price || 0),
    quantity: Number(p.quantity || 1),
  }));

  const lastActivityStr = toSql(lastActivity);
  const abandonedAtStr = toSql(abandonedAt);
  const value = Number(cart.cart_value || 0).toFixed(2);
  const itemCount = Number(cart.item_count || 0);

  // Look for ANY existing record for this activity (userId + activityType +
  // referenceId). A record is only revisited when the user is genuinely active
  // again (newer cart activity) — passive re-detection of an idle cart must
  // never reopen a closed record or reset reminders already sent.
  const [existing] = await query(
    `SELECT id, status, last_activity_at FROM recovery_records
     WHERE user_id = ? AND activity_type = 'CART' AND reference_id = ?
     LIMIT 1`,
    [cart.user_id, String(cart.cart_id)]
  );

  const isOpen =
    existing &&
    (existing.status === RECOVERY_STATUSES.ABANDONED ||
      existing.status === RECOVERY_STATUSES.REMINDER_SENT);

  const reactivated =
    existing && toDate(lastActivity).getTime() > toDate(existing.last_activity_at).getTime();

  if (existing && isOpen) {
    if (!reactivated) {
      // Same inactivity window — nothing changed, keep the cycle as-is.
      return { id: existing.id, reopened: false };
    }
    // The user became active again after abandonment → defer and start a fresh
    // inactivity window so reminders never fire mid-session.
    await query(
      `UPDATE recovery_records
       SET last_activity_at = ?,
           abandoned_at = ?,
           recovery_deadline = NULL,
           value = ?,
           item_count = ?,
           product_snapshot = ?,
           reminder_count = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        lastActivityStr,
        abandonedAtStr,
        value,
        itemCount,
        JSON.stringify(snapshot),
        existing.id,
      ]
    );
    return { id: existing.id, reopened: false };
  }

  if (existing && !isOpen) {
    if (!reactivated) {
      // Closed/pinned record (Not Recovered / Recovered) with no new activity
      // — never resurrect it. The detection is idempotent for this cart.
      return { id: existing.id, reopened: false, already_closed: true };
    }
    // Real reactivation → reopen as a brand-new cycle.
    await query(
      `UPDATE recovery_records
       SET started_at = ?, last_activity_at = ?, abandoned_at = ?,
           status = 'abandoned', value = ?, item_count = ?, product_snapshot = ?,
           reminder_count = 0, recovery_deadline = NULL,
           recovered_at = NULL, recovery_value = NULL,
           completion_reference = NULL, completion_details = NULL,
           cycle_count = cycle_count + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status IN (?, ?, ?)`,
      [
        abandonedAtStr,
        lastActivityStr,
        abandonedAtStr,
        value,
        itemCount,
        JSON.stringify(snapshot),
        existing.id,
        RECOVERY_STATUSES.NOT_RECOVERED,
        RECOVERY_STATUSES.RECOVERED,
        RECOVERY_STATUSES.RECOVERED_LATE,
      ]
    );
    return { id: existing.id, reopened: true };
  }

  const result = await query(
    `INSERT INTO recovery_records
      (user_id, activity_type, reference_id, started_at, last_activity_at, abandoned_at,
       status, value, currency, item_count, product_snapshot, reminder_count, cycle_count, recovery_deadline)
     VALUES (?, 'CART', ?, ?, ?, ?, 'abandoned', ?, ?, ?, ?, 0, 1, NULL)`,
    [
      cart.user_id,
      String(cart.cart_id),
      abandonedAtStr,
      lastActivityStr,
      abandonedAtStr,
      value,
      DEFAULT_CURRENCY,
      itemCount,
      JSON.stringify(snapshot),
    ]
  );
  const recordId = result.insertId;

  try {
    await createActivity({
      userId: cart.user_id,
      activityType: ACTIVITY_TYPES.CART_ABANDONED,
      entityType: "cart",
      entityId: cart.cart_id,
      metadata: {
        cartId: cart.cart_id,
        itemCount,
        cartValue: Number(value),
        lastActivity: lastActivityStr,
        abandonedAt: abandonedAtStr,
        userName: lastName,
        products: snapshot,
      },
      eventKey: `RECOVERY:${cart.user_id}:${cart.cart_id}:${String(abandonedAt).slice(0, 10)}`,
    });
  } catch (activityError) {
    console.warn("[RECOVERY] CART_ABANDONED activity log failed:", activityError.message);
  }

  return { id: recordId, reopened: false };
};

// ─────────────────────────────────────────────────────────────
// MANUAL REMINDER — admin-triggered send with a fresh DB re-check.
// Exactly 2 sends maximum per recovery record. Races (double clicks /
// concurrent tabs) are absorbed by the emailKey dedup + INSERT IGNORE below.
// ─────────────────────────────────────────────────────────────

const cartHasItems = async (cartId) => {
  const [row] = await query(
    "SELECT COUNT(*) AS count FROM cart_items WHERE cart_id = ?",
    [cartId]
  );
  return Number(row?.count || 0) > 0;
};

const getUserForRecord = async (record) => {
  const rows = await query(
    `SELECT u.id, u.email, CONCAT_WS(' ', up.first_name, up.last_name) AS user_name, up.phone
     FROM users u
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE u.id = ? LIMIT 1`,
    [record.user_id]
  );
  return rows[0] || null;
};

/** Dynamic variables the Abandoned Cart template can use (only real data). */
const buildReminderEmailVars = ({ record, user, serverNow, frontendUrl }) => {
  const baseUrl = frontendUrl || process.env.FRONTEND_URL || "http://localhost:5173";
  const snapshot = parseJson(record?.product_snapshot, []);
  const names = (Array.isArray(snapshot) ? snapshot.map((p) => p?.name).filter(Boolean) : []);
  const shown = names.slice(0, 3).join(", ");
  const productName = names.length > 3 ? `${shown} +${names.length - 3} more` : (shown || "");
  const cartLink = record?.activity_type === "CART" ? `${baseUrl}/cart` : `${baseUrl}/contact`;

  return {
    user_name: ((user?.user_name || "").trim() || user?.email || ""),
    user_email: user?.email || "",
    cart_link: cartLink,
    product_name: productName,
    cart_total: formatINR(record?.value),
    date: formatFriendlyDate(serverNow),
  };
};

/** Mark a record Not Recovered (terminal unless the customer later purchases). */
const markNotRecovered = async (recordId, reason) => {
  await query(
    `UPDATE recovery_records
     SET status = ?, updated_at = CURRENT_TIMESTAMP, completion_details = ?
     WHERE id = ? AND status IN (?, ?)`,
    [
      RECOVERY_STATUSES.NOT_RECOVERED,
      JSON.stringify({ reason }),
      recordId,
      RECOVERY_STATUSES.ABANDONED,
      RECOVERY_STATUSES.REMINDER_SENT,
    ]
  );
};

const sendManualReminder = async ({ recordId }) => {
  const rows = await query("SELECT * FROM recovery_records WHERE id = ? LIMIT 1", [recordId]);
  const record = rows[0];
  if (!record) {
    return { sent: false, error: "RECORD_NOT_FOUND", message: "Recovery record not found." };
  }

  const settings = await getRecoverySettings();
  const maxReminders = settings.maxReminders;

  // A completed purchase (tracked on the order creation hook) means the
  // customer already recovered — never email them again.
  if (
    record.status === RECOVERY_STATUSES.RECOVERED ||
    record.status === RECOVERY_STATUSES.RECOVERED_LATE
  ) {
    return { sent: false, error: "ALREADY_RECOVERED", message: "This customer has already completed the purchase." };
  }

  // Fresh-state re-check: the reminder limit is enforced on the CURRENT
  // reminder_count, so a stale double-click can never send more than the cap.
  const reminderNumber = Number(record.reminder_count || 0) + 1;
  if (reminderNumber > maxReminders) {
    return { sent: false, error: "REMINDER_LIMIT", message: "Reminder limit reached" };
  }

  // A cart that no longer has items is not recoverable — close it out.
  if (record.activity_type === "CART") {
    const hasItems = await cartHasItems(record.reference_id);
    if (!hasItems) {
      await markNotRecovered(record.id, "cart_emptied");
      return { sent: false, error: "CART_EMPTIED", message: "This cart is now empty." };
    }
  }

  const user = await getUserForRecord(record);
  if (!user || !user.email) {
    return { sent: false, error: "NO_EMAIL", message: "No email available for this customer." };
  }

  // Fresh DB check — nothing that already happened may be replayed.
  const [priorRow] = await query(
    `SELECT id FROM recovery_reminders
     WHERE recovery_record_id = ? AND reminder_number = ? AND status IN ('sent','skipped','failed')
     LIMIT 1`,
    [record.id, reminderNumber]
  );
  if (priorRow?.id) {
    return { sent: false, error: "ALREADY_SENT", message: "Reminder already sent for this schedule" };
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const serverNow = await getServerNow();
  const emailKey = `RECOVERY_REMINDER:${record.id}:${reminderNumber}`;
  const sendResult = await sendEmailTemplate({
    templateKey: TEMPLATE_KEY,
    emailKey,
    to: user.email,
    variables: buildReminderEmailVars({ record, user, serverNow, frontendUrl }),
  });

  if (sendResult?.sent !== true) {
    const message =
      sendResult?.skipped === true
        ? "Reminder already sent for this schedule"
        : "Failed to send the reminder email. Please try again.";
    return { sent: false, error: "SEND_FAILED", message };
  }

  const insertResult = await query(
    `INSERT IGNORE INTO recovery_reminders
      (recovery_record_id, reminder_number, scheduled_at, sent_at, status, template_key)
     VALUES (?, ?, NULL, ?, 'sent', ?)`,
    [record.id, reminderNumber, serverNow, TEMPLATE_KEY]
  );
  const rowInserted = Number(insertResult?.affectedRows || 0) > 0;

  if (!rowInserted) {
    return { sent: false, error: "ALREADY_SENT", message: "Reminder already sent for this schedule" };
  }

  // After the configured maximum there is no more manual reminder; a record
  // with the max count and no purchase is pinned as Not Recovered.
  const nextStatus =
    reminderNumber >= maxReminders ? RECOVERY_STATUSES.NOT_RECOVERED : RECOVERY_STATUSES.REMINDER_SENT;

  await query(
    `UPDATE recovery_records
     SET status = ?, reminder_count = ?, recovery_deadline = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [nextStatus, reminderNumber, record.id]
  );

  const ordinal =
    reminderNumber === 1 ? "First" : reminderNumber === 2 ? "Second" : reminderNumber === 3 ? "Third" : `Reminder ${reminderNumber}`;
  return {
    sent: true,
    recordId: record.id,
    reminder_number: reminderNumber,
    message: `${ordinal} reminder sent to ${user.email}.`,
  };
};

// ─────────────────────────────────────────────────────────────
// RECOVERY — driven by REAL completion events.
// hook: called right after a logged-in user's order is created.
// Matches the order's products against the abandoned cart snapshot so an
// unrelated later purchase never marks a recovery. Idempotent.
// A purchase at ANY time (even after both reminders / Not Recovered) is a
// Recovered record. There is no "Recovered Late" classification in the new flow.
// ─────────────────────────────────────────────────────────────

const markRecoveredForOrder = async ({ userId, orderId, orderNumber, totalAmount, items = [] }) => {
  if (!userId) return null;
  if (!orderId) return null;

  const orderedProductIds = new Set(
    (Array.isArray(items) ? items : [])
      .map((item) => Number(item?.product_id || item?.productId))
      .filter(Boolean)
  );

  const records = await query(
    `SELECT * FROM recovery_records
     WHERE user_id = ? AND activity_type = 'CART'
       AND status IN (?, ?, ?)
       AND (recovered_at IS NULL OR recovered_at = '')
     ORDER BY abandoned_at DESC
     LIMIT 5`,
    [userId, RECOVERY_STATUSES.ABANDONED, RECOVERY_STATUSES.REMINDER_SENT, RECOVERY_STATUSES.NOT_RECOVERED]
  );

  if (!Array.isArray(records) || records.length === 0) return null;

  let matched = null;
  for (const record of records) {
    const cartLinked = String(record.reference_id || "");
    const [cart] = await query("SELECT id FROM carts WHERE id = ? AND user_id = ?", [cartLinked, userId]);
    // Cart linkage is the reliable identifier and works for ALL statuses — the
    // cart row survives checkout (only its items are cleared).
    if (cart && cart.id) {
      matched = record;
      break;
    }
    // Product overlap is only a fallback for still-open records. Not Recovered
    // records must never be linked to an unrelated later purchase.
    if (record.status === RECOVERY_STATUSES.NOT_RECOVERED) continue;
    if (orderedProductIds.size === 0) {
      matched = record;
      break;
    }
    const snapshot = parseJson(record.product_snapshot, []);
    const snapshotIds = new Set(snapshot.map((p) => Number(p.id)).filter(Boolean));
    const overlap = [...orderedProductIds].some((id) => snapshotIds.has(id));
    if (overlap) {
      matched = record;
      break;
    }
  }

  if (!matched) return null;

  const targetStatus = RECOVERY_STATUSES.RECOVERED;

  const completionDetails = JSON.stringify({
    orderId,
    orderNumber,
    recoveredProducts: (Array.isArray(items) ? items : []).map((i) => ({
      product_id: i?.product_id || i?.productId || null,
      name: i?.product_name || i?.name || null,
      quantity: i?.quantity || 1,
    })),
  });

  await query(
    `UPDATE recovery_records
     SET status = ?, recovered_at = NOW(), recovery_value = ?,
         completion_reference = ?, completion_details = ?, recovery_deadline = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND status IN (?, ?, ?)`,
    [
      targetStatus,
      Number(totalAmount || 0).toFixed(2),
      orderNumber || null,
      completionDetails,
      matched.id,
      RECOVERY_STATUSES.ABANDONED,
      RECOVERY_STATUSES.REMINDER_SENT,
      RECOVERY_STATUSES.NOT_RECOVERED,
    ]
  );

  return { recordId: matched.id, status: targetStatus, wasLate: false };
};

// ─────────────────────────────────────────────────────────────
// Main automation cycle — used by the server scheduler.
// DETECTION ONLY: reminders are manual, there is no expiry sweep.
// ─────────────────────────────────────────────────────────────

const runRecoveryCycle = async () => {
  const created = await detectAndCreateRecoveries();
  if (created > 0) console.log(`[RECOVERY] Created ${created} abandoned recovery record(s)`);
  return { created, sentReminders: 0, skippedReminders: 0, failedReminders: 0, expired: 0 };
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const parseJson = (value, fallback) => {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  if (typeof value === "string" && value) {
    try {
      const parsed = JSON.parse(value);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

// ─────────────────────────────────────────────────────────────
// ADMIN READ APIs
// ─────────────────────────────────────────────────────────────

/** IST display text for datetime fields — built in SQL from stored wall-clock. */
const IST_COLUMNS = `
  DATE_FORMAT(r.abandoned_at, '${IST_DATETIME_FMT}') AS abandoned_at_ist,
  DATE_FORMAT(r.last_activity_at, '${IST_DATETIME_FMT}') AS last_activity_at_ist,
  DATE_FORMAT(r.started_at, '${IST_DATETIME_FMT}') AS started_at_ist,
  DATE_FORMAT(r.created_at, '${IST_DATETIME_FMT}') AS record_created_at_ist,
  DATE_FORMAT(r.recovered_at, '${IST_DATETIME_FMT}') AS recovered_at_ist,
  DATE_FORMAT(u.created_at, '${IST_DATE_FMT}') AS registered_at_ist,
  DATE_FORMAT(r.recovered_at, '${IST_DATE_FMT}') AS recovered_date_ist`;

const RECORD_SELECT = `
  SELECT r.*,
         u.email AS user_email,
         u.username,
         u.gender,
         u.state,
         u.country,
         u.pincode AS user_pincode,
         u.date_of_birth,
         u.created_at AS registered_at,
         CONCAT_WS(' ', up.first_name, up.last_name) AS user_name,
         up.first_name,
         up.last_name,
         up.phone AS user_phone,
         up.address,
         up.city,
         up.pincode AS profile_pincode,
         r.user_id AS user_id,
         ${IST_COLUMNS}
  FROM recovery_records r
  JOIN users u ON u.id = r.user_id
  LEFT JOIN user_profiles up ON up.user_id = r.user_id
`;

const getStatusFilter = (status, maxReminders = MAX_REMINDERS) => {
  const value = String(status || "").trim().toLowerCase();
  if (value === "pending" || value === "pending_recovery") {
    return { clause: "r.status IN (?, ?)", params: [RECOVERY_STATUSES.ABANDONED, RECOVERY_STATUSES.REMINDER_SENT] };
  }
  if (value === "needs_action" || value === "needs_reminder") {
    // Records the Admin can still act on within the configured reminder limit.
    return {
      clause: `(r.status IN (?, ?) AND r.reminder_count < ?)`,
      params: [RECOVERY_STATUSES.ABANDONED, RECOVERY_STATUSES.REMINDER_SENT, maxReminders],
    };
  }
  if (value === "recovered") {
    return { clause: "r.status IN (?, ?)", params: [RECOVERY_STATUSES.RECOVERED, RECOVERY_STATUSES.RECOVERED_LATE] };
  }
  if (value === "abandoned" || value === "reminder_sent" || value === "not_recovered") {
    return { clause: "r.status = ?", params: [value] };
  }
  return null;
};

const fetchReminderMap = async (recordIds) => {
  const ids = Array.isArray(recordIds) ? recordIds.map(String) : [];
  const map = new Map();
  if (ids.length === 0) return map;
  const placeholders = ids.map(() => "?").join(",");
  const rows = await query(
    `SELECT recovery_record_id, reminder_number, sent_at,
            DATE_FORMAT(sent_at, '${IST_DATETIME_FMT}') AS sent_at_ist
     FROM recovery_reminders
     WHERE recovery_record_id IN (${placeholders}) AND status = 'sent'
     ORDER BY recovery_record_id, reminder_number ASC`,
    ids
  );
  for (const row of Array.isArray(rows) ? rows : []) {
    const key = String(row.recovery_record_id);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ reminder_number: Number(row.reminder_number), sent_at: row.sent_at, sent_at_ist: row.sent_at_ist });
  }
  return map;
};

const listRecords = async ({ page = 1, limit = 20, status = "", search = "", activityType = "", from = "", to = "" } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (safePage - 1) * safeLimit;
  const settings = await getRecoverySettings();
  const maxReminders = settings.maxReminders;

  const filters = ["1=1"];
  const params = [];

  const statusFilter = getStatusFilter(status, maxReminders);
  if (statusFilter) {
    filters.push(statusFilter.clause);
    params.push(...statusFilter.params);
  }
  if (activityType) {
    filters.push("r.activity_type = ?");
    params.push(activityType);
  }
  if (search) {
    filters.push(
      `(u.email LIKE ? OR CONCAT_WS(' ', up.first_name, up.last_name) LIKE ? OR u.username LIKE ? OR r.product_snapshot LIKE ?)`
    );
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (from) {
    filters.push("r.abandoned_at >= ?");
    params.push(from);
  }
  if (to) {
    filters.push("r.abandoned_at <= ?");
    params.push(to);
  }

  const where = filters.join(" AND ");
  const [[countRow], rows] = await Promise.all([
    query(`SELECT COUNT(*) AS count FROM recovery_records r JOIN users u ON u.id = r.user_id LEFT JOIN user_profiles up ON up.user_id = r.user_id WHERE ${where}`, params),
    query(
      `${RECORD_SELECT}
       WHERE ${where}
       ORDER BY r.abandoned_at, r.id ASC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    ),
  ]);

  const rawRows = Array.isArray(rows) ? rows : [];
  const reminderMap = await fetchReminderMap(rawRows.map((r) => r.id));

  return {
    records: rawRows.map((record) => normalizeRecord(record, reminderMap.get(String(record.id)) || [], maxReminders)),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: Number(countRow?.count || 0),
      pages: Math.ceil(Number(countRow?.count || 0) / safeLimit),
    },
  };
};

const isOpenStatus = (status) =>
  status === RECOVERY_STATUSES.ABANDONED || status === RECOVERY_STATUSES.REMINDER_SENT;

const REMINDER_LABELS = [
  "Not Sent",
  "First Reminder Sent",
  "Second Reminder Sent",
  "Third Reminder Sent",
];

const reminderLabel = (reminderCount) => {
  const count = Math.min(REMINDER_LABELS.length - 1, Number(reminderCount || 0));
  return REMINDER_LABELS[count] || "Not Sent";
};

const normalizeRecord = (record, sentReminders = [], maxReminders = MAX_REMINDERS) => {
  const status = record.status;
  const reminderCount = Number(record.reminder_count || 0);
  const canSendReminder =
    status !== RECOVERY_STATUSES.RECOVERED &&
    status !== RECOVERY_STATUSES.RECOVERED_LATE &&
    Boolean(record.user_email) &&
    reminderCount < maxReminders;

  const reminderByNumber = (sentReminders || []).reduce((acc, r) => {
    acc[r.reminder_number] = r;
    return acc;
  }, {});

  const reminderField = (n) => {
    const r = reminderByNumber[n];
    return { at: r?.sent_at || null, ist: r?.sent_at_ist || null };
  };
  const r1 = reminderField(1);
  const r2 = reminderField(2);
  const r3 = reminderField(3);

  return {
    ...record,
    product_snapshot: parseJson(record.product_snapshot, []),
    completion_details: parseJson(record.completion_details, null),
    activity_label: ACTIVITY_LABELS[record.activity_type] || record.activity_type,
    recovery_time_seconds: recoveryTimeSeconds(status, record.recovered_at, record.abandoned_at),
    reminder_limit: maxReminders,
    needs_action: canSendReminder,
    can_send_reminder: canSendReminder,
    reminders_remaining: Math.max(0, maxReminders - reminderCount),
    is_recovery: status === RECOVERY_STATUSES.RECOVERED || status === RECOVERY_STATUSES.RECOVERED_LATE,
    recovery_status_label: statusLabel(status),
    reminder_status_label: reminderLabel(reminderCount),
    action_label: canSendReminder
      ? reminderCount === 0
        ? "Send Reminder"
        : reminderCount === 1
          ? "Send Second Reminder"
          : "Send Third Reminder"
      : null,
    reminder_1_at: r1.at,
    reminder_1_at_ist: r1.ist,
    reminder_2_at: r2.at,
    reminder_2_at_ist: r2.ist,
    reminder_3_at: r3.at,
    reminder_3_at_ist: r3.ist,
    customer: buildCustomer(record),
  };
};

const statusLabel = (status) => {
  switch (status) {
    case RECOVERY_STATUSES.ABANDONED:
      return "Abandoned";
    case RECOVERY_STATUSES.REMINDER_SENT:
      return "Reminder Sent";
    case RECOVERY_STATUSES.RECOVERED:
      return "Recovered";
    case RECOVERY_STATUSES.NOT_RECOVERED:
      return "Not Recovered";
    case RECOVERY_STATUSES.RECOVERED_LATE:
      return "Recovered";
    default:
      return status || "Unknown";
  }
};

/** Non-sensitive customer registration/profile information (real DB data). */
const buildCustomer = (record) => {
  const pick = (value) => (value === null || value === undefined || String(value).trim() === "" ? null : value);
  return {
    full_name: pick([record.first_name, record.last_name].filter(Boolean).join(" ").trim() || record.user_name),
    first_name: pick(record.first_name),
    last_name: pick(record.last_name),
    email: pick(record.user_email),
    phone: pick(record.user_phone),
    username: pick(record.username),
    address: pick(record.address),
    city: pick(record.city),
    state: pick(record.state),
    country: pick(record.country),
    pincode: pick(record.profile_pincode) || pick(record.user_pincode),
    gender: pick(record.gender),
    date_of_birth: pick(record.date_of_birth),
    registered_at: pick(record.registered_at),
    registered_at_ist: pick(record.registered_at_ist),
  };
};

const recoveryTimeSeconds = (status, recoveredAt, abandonedAt) => {
  if (status !== RECOVERY_STATUSES.RECOVERED && status !== RECOVERY_STATUSES.RECOVERED_LATE) return null;
  const abandoned = toDate(abandonedAt);
  const recovered = toDate(recoveredAt);
  if (!abandoned || !recovered) return null;
  return Math.max(0, Math.round((recovered.getTime() - abandoned.getTime()) / 1000));
};

const getRecordDetail = async (id) => {
  const rows = await query(`${RECORD_SELECT} WHERE r.id = ? LIMIT 1`, [id]);
  const record = rows[0];
  if (!record) return null;

  const settings = await getRecoverySettings();
  const maxReminders = settings.maxReminders;

  const reminders = await query(
    `SELECT id, reminder_number, sent_at, status, template_key, error_message, created_at,
            DATE_FORMAT(sent_at, '${IST_DATETIME_FMT}') AS sent_at_ist
     FROM recovery_reminders
     WHERE recovery_record_id = ? AND status = 'sent'
     ORDER BY reminder_number ASC`,
    [record.id]
  );
  const sentReminders = Array.isArray(reminders) ? reminders : [];

  const normalized = normalizeRecord(record, sentReminders, maxReminders);
  normalized.reminder_1_at_ist = normalized.reminder_1_at_ist || sentReminders[0]?.sent_at_ist || null;
  normalized.reminder_2_at_ist = normalized.reminder_2_at_ist || sentReminders[1]?.sent_at_ist || null;
  normalized.reminder_3_at_ist = normalized.reminder_3_at_ist || sentReminders[2]?.sent_at_ist || null;
  normalized.last_reminder =
    sentReminders.length > 0
      ? { reminder_number: sentReminders[sentReminders.length - 1].reminder_number, sent_at_ist: sentReminders[sentReminders.length - 1].sent_at_ist }
      : null;

  return {
    ...normalized,
    reminders: sentReminders.map((r) => ({
      ...r,
      sent_at_ist: r.sent_at_ist || null,
    })),
  };
};

const getSummary = async () => {
  const settings = await getRecoverySettings();
  const [row] = await query(
    `SELECT
       COUNT(*) AS total_abandoned,
       SUM(CASE WHEN status IN ('abandoned','reminder_sent') THEN 1 ELSE 0 END) AS pending_recovery,
       SUM(CASE WHEN status IN ('recovered','recovered_late') THEN 1 ELSE 0 END) AS recovered,
       SUM(CASE WHEN status = 'not_recovered' THEN 1 ELSE 0 END) AS not_recovered,
       SUM(CASE WHEN status IN ('recovered','recovered_late') THEN recovery_value ELSE 0 END) AS recovered_value,
       SUM(CASE WHEN status IN ('abandoned','reminder_sent') AND reminder_count < ? THEN 1 ELSE 0 END) AS needs_reminder
     FROM recovery_records`,
    [settings.maxReminders]
  );

  const [reminderRow] = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END), 0) AS reminders_sent,
       COUNT(*) AS reminders_total
     FROM recovery_reminders`
  );

  const recovered = Number(row?.recovered || 0);
  const notRecovered = Number(row?.not_recovered || 0);
  const eligible = recovered + notRecovered;
  const recoveryRate = eligible > 0 ? Math.round((recovered / eligible) * 10000) / 100 : 0;

  return {
    total_abandoned: Number(row?.total_abandoned || 0),
    pending_recovery: Number(row?.pending_recovery || 0),
    needs_reminder: Number(row?.needs_reminder || 0),
    recovered,
    not_recovered: notRecovered,
    recovered_value: Number(row?.recovered_value || 0),
    recovery_rate: recoveryRate,
    eligible_abandoned: eligible,
    reminders_sent: Number(reminderRow?.reminders_sent || 0),
    reminders_total: Number(reminderRow?.reminders_total || 0),
    activity_types: Object.keys(ACTIVITY_LABELS),
    settings: {
      enabled: settings.enabled,
      thresholdMinutes: settings.thresholdMinutes,
      maxReminders: settings.maxReminders,
    },
  };
};

module.exports = {
  RECOVERY_STATUSES,
  ACTIVITY_LABELS,
  DEFAULT_SETTINGS,
  MAX_REMINDERS,
  getRecoverySettings,
  saveRecoverySettings,
  detectAndCreateRecoveries,
  sendManualReminder,
  markRecoveredForOrder,
  runRecoveryCycle,
  listRecords,
  getRecordDetail,
  getSummary,
};