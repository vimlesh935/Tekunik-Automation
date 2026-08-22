const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const smartHomeProposalService = require("../services/smartHomeProposalService");
const { NOTIFICATION_TYPES, createNotification } = require("../services/notificationService");
const { ACTIVITY_TYPES, createActivity } = require("../services/adminActivityService");

const notifyProposalUpdate = async (proposal, previousStatus) => {
  if (!proposal?.user_id || !proposal.status || proposal.status === previousStatus) return;
  try {
    await createNotification({
      userId: proposal.user_id,
      type: NOTIFICATION_TYPES.SMART_HOME,
      title: "Your Smart Home Request Was Updated",
      message: `Your request ${proposal.proposal_number} is now ${proposal.status}.`,
      data: { proposalId: proposal.id, proposalNumber: proposal.proposal_number, status: proposal.status },
      actionUrl: "/dashboard",
      eventKey: `SMART_HOME:PROPOSAL_${proposal.id}:${proposal.status}`,
      entityType: "smart_home_proposal",
      entityId: proposal.id,
    });
  } catch (error) {
    console.warn("[NOTIFICATION] Smart home event failed:", error.message);
  }
};

const create = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const payload = {
    ...req.body,
    user_id: userId,
  };
  const proposal = await smartHomeProposalService.createProposal(payload);
  
  // Admin activity: smart home request created (HIGH priority)
  try {
    await createActivity({
      userId,
      activityType: ACTIVITY_TYPES.SMART_HOME_REQUEST_CREATED,
      entityType: "smart_home_proposal",
      entityId: proposal?.id,
      metadata: {
        proposalId: proposal?.id,
        proposalNumber: proposal?.proposal_number,
        fullName: proposal?.full_name,
        email: proposal?.email,
        homeType: proposal?.home_type,
        city: proposal?.city,
        status: proposal?.status,
      },
      eventKey: `SMART_HOME_CREATED:${proposal?.id}`,
    });
  } catch (activityError) {
    console.warn("[ACTIVITY] Smart home request activity failed:", activityError.message);
  }

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
  const before = await smartHomeProposalService.getProposalById(id);
  const changedBy = req.admin ? req.admin.id : null;
  const proposal = await smartHomeProposalService.updateProposal(id, req.body, changedBy);
  if (!proposal) throw new AppError("Proposal not found", 404, "NOT_FOUND");
  await notifyProposalUpdate(proposal, before?.status);

  // Admin activity: smart home request updated
  try {
    await createActivity({
      userId: proposal?.user_id,
      activityType: ACTIVITY_TYPES.SMART_HOME_REQUEST_UPDATED,
      entityType: "smart_home_proposal",
      entityId: proposal.id,
      metadata: {
        proposalId: proposal.id,
        proposalNumber: proposal.proposal_number,
        status: proposal.status,
        previousStatus: before?.status,
      },
      eventKey: `SMART_HOME_UPDATED:${proposal.id}:${proposal.status}`,
    });
  } catch (activityError) {
    console.warn("[ACTIVITY] Smart home update activity failed:", activityError.message);
  }

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

  const before = await smartHomeProposalService.getProposalById(id);
  const changedBy = req.admin ? req.admin.id : null;
  const proposal = await smartHomeProposalService.updateProposal(id, { status, status_change_notes: notes || null }, changedBy);
  if (!proposal) throw new AppError("Proposal not found", 404, "NOT_FOUND");
  await notifyProposalUpdate(proposal, before?.status);

  // Admin activity: smart home request status updated
  try {
    await createActivity({
      userId: proposal?.user_id,
      activityType: ACTIVITY_TYPES.SMART_HOME_REQUEST_UPDATED,
      entityType: "smart_home_proposal",
      entityId: proposal.id,
      metadata: {
        proposalId: proposal.id,
        proposalNumber: proposal.proposal_number,
        status: proposal.status,
        previousStatus: before?.status,
      },
      eventKey: `SMART_HOME_UPDATED:${proposal.id}:${proposal.status}`,
    });
  } catch (activityError) {
    console.warn("[ACTIVITY] Smart home status activity failed:", activityError.message);
  }

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