const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const service = require("../services/adminActivityService");
const priceDropService = require("../services/priceDropService");

const list = asyncHandler(async (req, res) => success(res, "Admin activity fetched", await service.getActivities(req.query)));
const recent = asyncHandler(async (req, res) => success(res, "Recent admin activity fetched", { activities: await service.getRecent(req.query.limit) }));
const count = asyncHandler(async (req, res) => success(res, "Admin activity count fetched", { count: await service.unreadCount() }));
const markRead = asyncHandler(async (req, res) => { await service.markRead(req.params.id); return success(res, "Activity marked as read", { count: await service.unreadCount() }); });
const markAllRead = asyncHandler(async (req, res) => success(res, "Activity marked as read", { count: await service.markAllRead() }));
const remove = asyncHandler(async (req, res) => { await service.remove(req.params.id); return success(res, "Activity deleted"); });
const customer = asyncHandler(async (req, res) => success(res, "Customer activity fetched", await service.getCustomerActivity(req.params.userId, req.query)));
const product = asyncHandler(async (req, res) => success(res, "Product activity fetched", await service.getProductActivity(req.params.productId, req.query)));
const dashboardSummary = asyncHandler(async (req, res) => success(res, "Dashboard summary fetched", await service.getDashboardSummary()));
const needsAttention = asyncHandler(async (req, res) => success(res, "Needs attention fetched", await service.getNeedsAttention()));
const priceDropAnalytics = asyncHandler(async (req, res) => success(res, "Price drop analytics fetched", await priceDropService.getPriceDropAnalytics({ days: req.query.days })));

module.exports = { list, recent, count, markRead, markAllRead, remove, customer, product, dashboardSummary, needsAttention, priceDropAnalytics };
