const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const smartHomeProposalService = require("../services/smartHomeProposalService");

const create = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const payload = {
    ...req.body,
    user_id: userId,
  };
  const proposal = await smartHomeProposalService.createProposal(payload);
  return success(res, "Smart Home Proposal created successfully", proposal, 201);
});

const listAll = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status || "",
    search: req.query.search || "",
    home_type: req.query.home_type || "",
    assigned_admin: req.query.assigned_admin || "",
    date_from: req.query.date_from || "",
    date_to: req.query.date_to || "",
    page: req.query.page || 1,
    limit: req.query.limit || 20,
    sort: req.query.sort || "latest",
  };
  const result = await smartHomeProposalService.getAllProposals(filters);
  return success(res, "Proposals retrieved successfully", result);
});

const getDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const proposal = await smartHomeProposalService.getProposalById(id);
  if (!proposal) throw new AppError("Proposal not found", 404, "NOT_FOUND");

  const statusHistory = await smartHomeProposalService.getStatusHistory(id);
  return success(res, "Proposal retrieved successfully", { proposal, statusHistory });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const changedBy = req.admin ? req.admin.id : null;
  const proposal = await smartHomeProposalService.updateProposal(id, req.body, changedBy);
  if (!proposal) throw new AppError("Proposal not found", 404, "NOT_FOUND");
  return success(res, "Proposal updated successfully", proposal);
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await smartHomeProposalService.deleteProposal(id);
  return success(res, "Proposal deleted successfully");
});

const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  if (!status) throw new AppError("Status is required", 400, "VALIDATION_ERROR");

  const changedBy = req.admin ? req.admin.id : null;
  const proposal = await smartHomeProposalService.updateProposal(id, { status, status_change_notes: notes || null }, changedBy);
  if (!proposal) throw new AppError("Proposal not found", 404, "NOT_FOUND");
  return success(res, "Proposal status updated successfully", proposal);
});

const convert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await smartHomeProposalService.convertProposalToOrder(id);
  return success(res, "Proposal converted to order successfully", result);
});

const getStats = asyncHandler(async (req, res) => {
  const stats = await smartHomeProposalService.getDashboardStats();
  return success(res, "Dashboard stats retrieved", stats);
});

module.exports = {
  create,
  listAll,
  getDetail,
  update,
  remove,
  updateStatus,
  convert,
  getStats,
};