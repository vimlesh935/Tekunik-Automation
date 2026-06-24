const express = require("express");
const { requireAdmin } = require("../middleware/adminMiddleware");
const {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  deleteSubcategory,
} = require("../controllers/categoryController");

const router = express.Router();

router.get("/api/admin/categories", requireAdmin, listCategories);
router.get("/api/admin/categories/:id", requireAdmin, getCategory);
router.post("/api/admin/categories", requireAdmin, createCategory);
router.put("/api/admin/categories/:id", requireAdmin, updateCategory);
router.delete("/api/admin/categories/:id", requireAdmin, deleteCategory);
router.post("/api/admin/categories/:id/subcategories", requireAdmin, createSubcategory);
router.delete("/api/admin/subcategories/:id", requireAdmin, deleteSubcategory);

module.exports = router;
