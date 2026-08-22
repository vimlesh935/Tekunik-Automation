const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const notificationService = require("../services/notificationService");

const parseId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new AppError("Invalid notification ID", 400, "VALIDATION_ERROR");
  return id;
};

const list = asyncHandler(async (req, res) => success(res, "Notifications fetched", await notificationService.getUserNotifications(req.user.id, {
  page: req.query.page,
  limit: req.query.limit,
  unreadOnly: String(req.query.unread || "").toLowerCase() === "true" || req.query.unread === "1",
  type: req.query.type || null,
})));

const unreadCount = asyncHandler(async (req, res) => success(res, "Unread count fetched", { count: await notificationService.getUnreadCount(req.user.id) }));

const markRead = asyncHandler(async (req, res) => {
  if (!await notificationService.markAsRead(req.user.id, parseId(req.params.id))) throw new AppError("Notification not found", 404, "NOT_FOUND");
  return success(res, "Notification marked as read", { count: await notificationService.getUnreadCount(req.user.id) });
});

const markAllRead = asyncHandler(async (req, res) => success(res, "Notifications marked as read", { count: await notificationService.markAllAsRead(req.user.id) }));

const remove = asyncHandler(async (req, res) => {
  if (!await notificationService.deleteNotification(req.user.id, parseId(req.params.id))) throw new AppError("Notification not found", 404, "NOT_FOUND");
  return success(res, "Notification deleted", { count: await notificationService.getUnreadCount(req.user.id) });
});

const clear = asyncHandler(async (req, res) => {
  await notificationService.clearNotifications(req.user.id);
  return success(res, "Notifications cleared", { count: 0 });
});

module.exports = { list, unreadCount, markRead, markAllRead, remove, clear };