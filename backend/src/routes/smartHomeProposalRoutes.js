const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/authMiddleware");
const {
  create,
  listAll,
  getDetail,
  update,
  remove,
  updateStatus,
  convert,
  getStats,
} = require("../controllers/smartHomeProposalController");

// Public/customer: create proposal
router.post("/", create);

// Admin: dashboard stats
router.get("/stats", requireAdmin, getStats);

// Admin: list all proposals (with pagination, filters, search)
router.get("/", requireAdmin, listAll);

// Admin: get proposal detail with status history
router.get("/:id", requireAdmin, getDetail);

// Admin: update proposal
router.put("/:id", requireAdmin, update);

// Admin: update proposal status only
router.patch("/:id/status", requireAdmin, updateStatus);

// Admin: delete proposal
router.delete("/:id", requireAdmin, remove);

// Admin: convert proposal to order
router.post("/:id/convert-order", requireAdmin, convert);

module.exports = router;