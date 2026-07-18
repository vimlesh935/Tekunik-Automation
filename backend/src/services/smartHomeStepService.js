const { query } = require("../config/db");
const { generateProposalNumber } = require("./smartHomeProposalService");

const createOrUpdateStep = async (sessionId, step, data) => {
  if (!sessionId) {
    const proposal_number = await generateProposalNumber();
    const result = await query(
      `INSERT INTO smart_home_proposals
        (proposal_number, full_name, email, phone, city, home_type, rooms_json, devices_json, estimated_products_json, wizard_status, additional_notes, current_step)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'In Progress', ?, ?)`,
      [
        proposal_number,
        data.full_name || null,
        data.email || null,
        data.phone || null,
        data.city || null,
        data.home_type || null,
        data.rooms_json ? JSON.stringify(data.rooms_json) : null,
        data.devices_json ? JSON.stringify(data.devices_json) : null,
        data.estimated_products_json ? JSON.stringify(data.estimated_products_json) : null,
        data.notes || null,
        step || 1,
      ]
    );
    return { id: result.insertId, isNew: true };
  }

  const fields = [];
  const values = [];

  if (step === 1 && data) {
    if (data.full_name !== undefined) { fields.push("full_name = ?"); values.push(data.full_name); }
    if (data.email !== undefined) { fields.push("email = ?"); values.push(data.email); }
    if (data.phone !== undefined) { fields.push("phone = ?"); values.push(data.phone); }
    if (data.city !== undefined) { fields.push("city = ?"); values.push(data.city); }
  }

  if (step === 2 && data) {
    if (data.home_type !== undefined) { fields.push("home_type = ?"); values.push(data.home_type); }
  }

  if (step === 3 && data) {
    if (data.rooms_json !== undefined) {
      fields.push("rooms_json = ?");
      values.push(typeof data.rooms_json === "string" ? data.rooms_json : JSON.stringify(data.rooms_json));
      const rooms = typeof data.rooms_json === "string" ? JSON.parse(data.rooms_json) : data.rooms_json;
      fields.push("total_rooms = ?");
      values.push(Array.isArray(rooms) ? rooms.length : 0);
    }
  }

  if (step === 4 && data) {
    if (data.devices_json !== undefined) {
      fields.push("devices_json = ?");
      values.push(typeof data.devices_json === "string" ? data.devices_json : JSON.stringify(data.devices_json));
      // Also update rooms_json since device configs are embedded in room objects
      fields.push("rooms_json = ?");
      values.push(typeof data.devices_json === "string" ? data.devices_json : JSON.stringify(data.devices_json));
      const rooms = typeof data.devices_json === "string" ? JSON.parse(data.devices_json) : data.devices_json;
      fields.push("total_rooms = ?");
      values.push(Array.isArray(rooms) ? rooms.length : 0);
    }
    if (data.estimated_products_json !== undefined) {
      fields.push("estimated_products_json = ?");
      values.push(typeof data.estimated_products_json === "string" ? data.estimated_products_json : JSON.stringify(data.estimated_products_json));
    }
  }

  if (step === 5 && data) {
    if (data.notes !== undefined) { fields.push("additional_notes = ?"); values.push(data.notes); }
  }

  // Always update current_step and wizard_status
  fields.push("current_step = ?");
  values.push(step);

  if (step === 5) {
    fields.push("wizard_status = ?");
    values.push("Completed");
  } else {
    fields.push("wizard_status = ?");
    values.push("In Progress");
  }

  if (fields.length === 0) return { id: sessionId };

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(sessionId);

  await query(
    `UPDATE smart_home_proposals SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  return { id: sessionId, isNew: false };
};

const getSession = async (sessionId) => {
  if (!sessionId) return null;
  const rows = await query("SELECT * FROM smart_home_proposals WHERE id = ?", [sessionId]);
  return rows[0] || null;
};

const findSessionByEmail = async (email) => {
  if (!email) return null;
  const rows = await query(
    "SELECT id, full_name, email, phone, city, home_type, total_rooms, current_step, wizard_status, rooms_json, devices_json, additional_notes, created_at, updated_at FROM smart_home_proposals WHERE email = ? AND (wizard_status IN ('Draft', 'In Progress') OR wizard_status IS NULL) ORDER BY updated_at DESC LIMIT 1",
    [email]
  );
  return rows[0] || null;
};

module.exports = {
  createOrUpdateStep,
  getSession,
  findSessionByEmail,
};
