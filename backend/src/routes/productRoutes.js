const express = require("express");
const { requireAdmin } = require("../middleware/adminMiddleware");
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const router = express.Router();

router.get("/api/admin/products", requireAdmin, listProducts);
router.get("/api/admin/products/:id", requireAdmin, getProduct);
router.post("/api/admin/products", requireAdmin, createProduct);
router.put("/api/admin/products/:id", requireAdmin, updateProduct);
router.delete("/api/admin/products/:id", requireAdmin, deleteProduct);

module.exports = router;
