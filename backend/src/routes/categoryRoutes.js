const express = require("express");
const { requireAdmin } = require("../middleware/adminMiddleware");
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const router = express.Router();

router.get("/api/admin/categories", requireAdmin, listCategories);
router.post("/api/admin/categories", requireAdmin, createCategory);
router.put("/api/admin/categories/:id", requireAdmin, updateCategory);
router.delete("/api/admin/categories/:id", requireAdmin, deleteCategory);

module.exports = router;
