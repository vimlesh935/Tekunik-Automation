const express = require("express");
const multer = require("multer");
const path = require("node:path");
const fs = require("node:fs");
const { requireAdmin } = require("../middleware/adminMiddleware");
const { bulkImport, downloadTemplate } = require("../controllers/bulkImportController");

const router = express.Router();

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const bulkImportStorage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(__dirname, "..", "..", "uploads", "temp");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_"));
  },
});

const bulkImportUpload = multer({
  storage: bulkImportStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if ([".csv", ".xlsx", ".zip"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Only .csv, .xlsx, and .zip files are allowed."), false);
    }
  },
});

// POST /api/admin/products/bulk-import
router.post(
  "/api/admin/products/bulk-import",
  requireAdmin,
  bulkImportUpload.fields([
    { name: "file", maxCount: 1 },
    { name: "zip", maxCount: 1 },
  ]),
  (err, req, res, next) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Upload failed",
      });
    }
    next();
  },
  bulkImport
);

// GET /api/admin/products/download-template
router.get("/api/admin/products/download-template", requireAdmin, downloadTemplate);

module.exports = router;
