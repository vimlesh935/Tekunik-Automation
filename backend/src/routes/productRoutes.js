const express = require("express");
const { requireAdmin } = require("../middleware/adminMiddleware");
const {
  productImageUpload,
  productGalleryUpload,
  handleProductImageUploadError,
  logProductImageUploadPayload,
} = require("../middleware/productImageUpload");
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductColor,
  deleteProductColor,
  createProductSize,
  deleteProductSize,
  uploadGalleryImage,
  deleteGalleryImage,
  setPrimaryImage,
  reorderGalleryImages,
  getProductsByApplication,
  getApplicationCounts,
} = require("../controllers/productController");

const router = express.Router();

// Admin routes
router.get("/api/admin/products", requireAdmin, listProducts);
router.get("/api/admin/products/:id", requireAdmin, getProduct);
router.post(
  "/api/admin/products",
  requireAdmin,
  productGalleryUpload,
  handleProductImageUploadError,
  logProductImageUploadPayload,
  createProduct
);
router.put(
  "/api/admin/products/:id",
  requireAdmin,
  productGalleryUpload,
  handleProductImageUploadError,
  logProductImageUploadPayload,
  updateProduct
);
router.delete("/api/admin/products/:id", requireAdmin, deleteProduct);

// Gallery images
router.post(
  "/api/admin/products/:id/gallery",
  requireAdmin,
  productImageUpload.single("image"),
  handleProductImageUploadError,
  logProductImageUploadPayload,
  uploadGalleryImage
);
router.delete("/api/admin/products/:id/gallery/:imageId", requireAdmin, deleteGalleryImage);
router.put("/api/admin/products/:id/gallery/:imageId/primary", requireAdmin, setPrimaryImage);
router.put("/api/admin/products/:id/gallery/reorder", requireAdmin, reorderGalleryImages);

// Colors
router.post("/api/admin/products/:id/colors", requireAdmin, createProductColor);
router.delete("/api/admin/products/:id/colors/:colorId", requireAdmin, deleteProductColor);

// Sizes
router.post("/api/admin/products/:id/sizes", requireAdmin, createProductSize);
router.delete("/api/admin/products/:id/sizes/:sizeId", requireAdmin, deleteProductSize);

// Public routes
router.get("/api/products/applications/counts", getApplicationCounts);
router.get("/api/products/application/:application", getProductsByApplication);

module.exports = router;
