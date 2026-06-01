const express = require("express");
const { requireAdmin } = require("../middleware/adminMiddleware");
const { listUsers, getUser, toggleUser } = require("../controllers/userAdminController");

const router = express.Router();

router.get("/api/admin/users", requireAdmin, listUsers);
router.get("/api/admin/users/:id", requireAdmin, getUser);
router.patch("/api/admin/users/:id/toggle", requireAdmin, toggleUser);

module.exports = router;
