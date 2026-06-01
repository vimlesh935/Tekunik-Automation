const express = require("express");
const { getPublicCategories } = require("../controllers/publicCategoryController");

const router = express.Router();

/** GET /api/categories - Public categories endpoint */
router.get("/api/categories", getPublicCategories);

module.exports = router;