const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  getUserOrders,
  getUserOrder,
} = require("../controllers/userController");

const router = express.Router();

router.get("/api/user/profile", requireAuth, getProfile);
router.put("/api/user/profile", requireAuth, updateProfile);
router.get("/api/user/orders", requireAuth, getUserOrders);
router.get("/api/user/orders/:id", requireAuth, getUserOrder);

module.exports = router;