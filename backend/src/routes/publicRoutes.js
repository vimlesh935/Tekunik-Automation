const express = require("express");
const {
  getPublicCategories,
} = require("../controllers/publicCategoryController");
const {
  listProducts,
  getProduct,
} = require("../controllers/productController");
const { submitContactForm } = require("../controllers/contactController");

const router = express.Router();

/** GET /api/categories - Public categories endpoint */
router.get("/api/categories", getPublicCategories);

/**
 * GET /api/products - Public product listing (active products only)
 * Injects status=active so visitors never see draft/inactive products.
 */
router.get("/api/products", (req, res, next) => {
  const request = {
    ...req,
    query: {
      ...(req.query || {}),
      status: "active",
    },
  };
  return listProducts(request, res, next);
});

/**
 * GET /api/products/featured - Public featured products (active only)
 */
router.get("/api/products/featured", (req, res, next) => {
  const request = {
    ...req,
    query: {
      ...(req.query || {}),
      status: "active",
      featured: "1",
      featured_fallback: "true",
      limit: req.query?.limit || "8",
    },
  };
  return listProducts(request, res, next);
});

/**
 * GET /api/products/:id - Public single product (active only)
 * Delegates to the shared getProduct handler.
 */
router.get("/api/products/:id", getProduct);

/**
 * POST /api/contact - Public contact form submission
 */
router.post("/api/contact", submitContactForm);

module.exports = router;
