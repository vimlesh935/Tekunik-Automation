const express = require("express");
const { requireAdmin } = require("../middleware/adminMiddleware");
const { listUsers, getUser, toggleUser, getDuplicateReport, mergeDuplicateUser } = require("../controllers/userAdminController");

const router = express.Router();

router.get("/api/admin/users", requireAdmin, listUsers);
router.get("/api/admin/users/duplicate-report", requireAdmin, getDuplicateReport);
router.post("/api/admin/users/merge", requireAdmin, mergeDuplicateUser);
router.get("/api/admin/users/:id", requireAdmin, getUser);
router.patch("/api/admin/users/:id/toggle", requireAdmin, toggleUser);

module.exports = router;
