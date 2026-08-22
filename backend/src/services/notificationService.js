const { query } = require("../config/db");

const NOTIFICATION_TYPES = Object.freeze({
  ORDER_PLACED: "ORDER_PLACED",
  ORDER_CONFIRMED: "ORDER_CONFIRMED",
  ORDER_PROCESSING: "ORDER_PROCESSING",
  ORDER_SHIPPED: "ORDER_SHIPPED",
  ORDER_OUT_FOR_DELIVERY: "ORDER_OUT_FOR_DELIVERY",
  ORDER_DELIVERED: "ORDER_DELIVERED",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  WISHLIST: "WISHLIST",
  OFFER: "OFFER",
  PRICE_DROP: "PRICE_DROP",
  BACK_IN_STOCK: "BACK_IN_STOCK",
  SYSTEM: "SYSTEM",
  NEW_PRODUCT: "NEW_PRODUCT",
  PRODUCT_UPDATE: "PRODUCT_UPDATE",
  PRODUCT_UNAVAILABLE: "PRODUCT_UNAVAILABLE",
  NEW_CATEGORY: "NEW_CATEGORY",
  SMART_HOME: "SMART_HOME",
});

const createNotification = async ({ userId, type, title, message, data = {}, actionUrl = null, eventKey = null, priority = "NORMAL", entityType = null, entityId = null }) => {
  if (!userId || !type || !title || !message) return null;
  const result = await query(
    `INSERT INTO notifications (user_id, type, title, message, data, action_url, event_key, priority, entity_type, entity_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [userId, type, title, message, JSON.stringify(data), actionUrl, eventKey, priority, entityType, entityId],
  );
  const [notification] = await query("SELECT * FROM notifications WHERE id = ?", [result.insertId]);
  return notification || null;
};

const createBulkNotifications = async (notifications) => {
  const created = [];
  for (const notification of notifications || []) {
    const result = await createNotification(notification);
    if (result) created.push(result);
  }
  return created;
};

const notifyUsers = async ({ userIds, ...notification }) => {
  const uniqueUserIds = [...new Set((userIds || []).map(Number).filter((id) => Number.isInteger(id) && id > 0))];
  for (const userId of uniqueUserIds) await createNotification({ ...notification, userId });
  return uniqueUserIds.length;
};

const getActiveUserIds = async () => {
  const rows = await query("SELECT u.id FROM users u WHERE (u.role IN ('user', 'customer') OR u.role IS NULL OR u.role = '') AND NOT EXISTS (SELECT 1 FROM admins a WHERE a.email COLLATE utf8mb4_unicode_ci = u.email COLLATE utf8mb4_unicode_ci)");
  return rows.map((row) => row.id);
};

const getInterestedUserIds = async (productId) => {
  const rows = await query(
    `SELECT user_id FROM wishlist WHERE product_id = ?
     UNION
     SELECT user_id FROM recently_viewed_products WHERE product_id = ?`,
    [productId, productId],
  );
  return rows.map((row) => row.user_id);
};

const getUserNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false, type = null } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
  const offset = (safePage - 1) * safeLimit;
  const filters = ["user_id = ?"];
  const params = [userId];
  if (unreadOnly) filters.push("is_read = 0");
  if (type) {
    if (type === "ORDER") {
      filters.push("type LIKE ?");
      params.push("ORDER_%");
    } else if (type === "PRODUCTS") {
      filters.push("(type LIKE ? OR type IN (?, ?))");
      params.push("PRODUCT_%", "PRICE_DROP", "BACK_IN_STOCK");
    } else {
      filters.push("type = ?");
      params.push(type);
    }
  }
  const where = filters.join(" AND ");
  const [[countRow], notifications] = await Promise.all([
    query(`SELECT COUNT(*) AS count FROM notifications WHERE ${where}`, params),
    query(`SELECT id, user_id, type, title, message, data, action_url, is_read, read_at, created_at, updated_at
           FROM notifications WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`, [...params, safeLimit, offset]),
  ]);
  return {
    notifications: notifications.map((item) => ({ ...item, data: typeof item.data === "string" ? JSON.parse(item.data || "{}") : item.data })),
    pagination: { total: Number(countRow.count), page: safePage, limit: safeLimit, pages: Math.ceil(Number(countRow.count) / safeLimit) },
  };
};

const getUnreadCount = async (userId) => {
  const [row] = await query("SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0", [userId]);
  return Number(row?.count || 0);
};

const markAsRead = async (userId, notificationId) => {
  const result = await query(
    "UPDATE notifications SET is_read = 1, read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id = ? AND user_id = ?",
    [notificationId, userId],
  );
  return result.affectedRows > 0;
};

const markAllAsRead = async (userId) => {
  await query("UPDATE notifications SET is_read = 1, read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE user_id = ? AND is_read = 0", [userId]);
  return getUnreadCount(userId);
};

const deleteNotification = async (userId, notificationId) => {
  const result = await query("DELETE FROM notifications WHERE id = ? AND user_id = ?", [notificationId, userId]);
  return result.affectedRows > 0;
};

const clearNotifications = (userId) => query("DELETE FROM notifications WHERE user_id = ?", [userId]);

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  createBulkNotifications,
  notifyUsers,
  getActiveUserIds,
  getInterestedUserIds,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
};