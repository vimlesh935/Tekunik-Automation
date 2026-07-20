const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const {
  imageUrlForFilename,
  createUploadFilename,
  ensureProductUploadsDir,
} = require("../utils/uploadPaths");
const path = require("node:path");
const fs = require("node:fs");
const XLSX = require("xlsx");
const AdmZip = require("adm-zip");

const parseBooleanFlag = (value) => {
  if (value === true || value === 1 || value === "1") return 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["1", "true", "yes", "on"].includes(normalized) ? 1 : 0;
  }
  return value ? 1 : 0;
};

const parseFeatures = (value) => {
  if (!value || typeof value !== "string") return null;
  return value
    .split(/[|\n]/)
    .map((f) => f.trim())
    .filter(Boolean)
    .join("\n");
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** POST /api/admin/products/bulk-import */
const bulkImport = asyncHandler(async (req, res) => {
  try {
    const importFile = req.files?.file?.[0];
    if (!importFile) {
      throw new AppError("No import file provided", 400, "VALIDATION_ERROR");
    }

    const ext = path.extname(importFile.originalname || importFile.filename || "").toLowerCase();
    if (![".csv", ".xlsx"].includes(ext)) {
      throw new AppError("Invalid file format. Only .csv and .xlsx files are allowed.", 400, "VALIDATION_ERROR");
    }

    if (importFile.size > MAX_FILE_SIZE) {
      throw new AppError("File too large. Maximum size is 50MB.", 400, "VALIDATION_ERROR");
    }

    const duplicateAction = req.body.duplicate_action || "skip";
    const filePath = importFile.path;

    // Parse the file
    const workbook = XLSX.readFile(filePath, { type: "file", raw: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows || rows.length === 0) {
      throw new AppError("No data found in the file", 400, "VALIDATION_ERROR");
    }

    // Extract ZIP if provided
    let imageMap = {};
    if (req.files && req.files.zip) {
      const zipFile = Array.isArray(req.files.zip) ? req.files.zip[0] : req.files.zip;
      try {
        const zip = new AdmZip(zipFile.path || zipFile.filepath);
        const zipEntries = zip.getEntries();
        for (const entry of zipEntries) {
          if (!entry.isDirectory) {
            const entryName = path.basename(entry.entryName).toLowerCase();
            imageMap[entryName] = entry;
          }
        }
      } catch (zipErr) {
        console.error("[BULK IMPORT] ZIP extraction error:", zipErr);
      }
    }

    const results = {
      total: rows.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      duplicates: 0,
      missingImages: 0,
      invalidCategories: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const name = String(row.product_name || "").trim();
        if (!name) {
          results.skipped++;
          results.errors.push({ row: rowNum, message: "Product name is required" });
          continue;
        }

        const price = parseFloat(row.price);
        if (isNaN(price) || price < 0) {
          results.skipped++;
          results.errors.push({ row: rowNum, message: `Invalid price: "${row.price}"` });
          continue;
        }

        const stock = Math.max(0, parseInt(row.stock) || 0);

        const categoryName = String(row.category || "").trim();
        if (!categoryName) {
          results.skipped++;
          results.invalidCategories++;
          results.errors.push({ row: rowNum, message: "Category is required" });
          continue;
        }

        const [category] = await query(
          "SELECT id FROM product_categories WHERE name = ?",
          [categoryName]
        );
        if (!category) {
          results.skipped++;
          results.invalidCategories++;
          results.errors.push({ row: rowNum, message: `Category "${categoryName}" not found` });
          continue;
        }

        const validStatuses = ["active", "inactive", "draft"];
        const status = validStatuses.includes(String(row.status || "").trim().toLowerCase())
          ? String(row.status).trim().toLowerCase()
          : "active";

        const featured = parseBooleanFlag(row.featured);
        const brand = String(row.brand || "").trim();
        const description = String(row.description || "").trim() || null;
        const features = parseFeatures(row.features);

        // Check for duplicate
        const [existingProduct] = await query(
          "SELECT id FROM products WHERE name = ?",
          [String(row.product_name || "").trim()]
        );

        if (existingProduct) {
          if (duplicateAction === "skip") {
            results.skipped++;
            results.duplicates++;
            results.errors.push({ row: rowNum, message: `Duplicate product: "${String(row.product_name).trim()}"` });
            continue;
          } else if (duplicateAction === "update") {
            const imageFilename = String(row.image || "").trim().toLowerCase();
            let imageUrl = null;
            if (imageFilename && imageMap[imageFilename]) {
              try {
                const entry = imageMap[imageFilename];
                const imgExt = path.extname(entry.entryName).toLowerCase();
                if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(imgExt)) {
                  const uploadDir = ensureProductUploadsDir();
                  const tempFilename = createUploadFilename({
                    originalname: entry.entryName,
                    mimetype: `image/${imgExt.replace(".", "")}`,
                  });
                  const outputPath = path.join(uploadDir, tempFilename);
                  fs.writeFileSync(outputPath, entry.getData());
                  imageUrl = imageUrlForFilename(tempFilename, "product");
                }
              } catch (imgErr) {
                console.warn(`[BULK IMPORT] Image upload error for "${imageFilename}":`, imgErr.message);
              }
            }

            await query(
              `UPDATE products SET description = ?, price = ?, stock = ?, stock_quantity = ?,
               category_id = ?, image_url = COALESCE(?, image_url), status = ?, featured = ?, brand = ?, features = ?, updated_at = NOW()
               WHERE id = ?`,
              [
                description,
                price,
                stock,
                stock,
                category.id,
                imageUrl,
                status,
                featured,
                brand,
                features,
                existingProduct.id,
              ]
            );
            results.imported++;
            continue;
          }
        }

        // Handle image from ZIP
        const imageFilename = String(row.image || "").trim().toLowerCase();
        let imageUrl = null;
        if (imageFilename) {
          if (imageMap[imageFilename]) {
            try {
              const entry = imageMap[imageFilename];
              const imgExt = path.extname(entry.entryName).toLowerCase();
              if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(imgExt)) {
                const uploadDir = ensureProductUploadsDir();
                const tempFilename = createUploadFilename({
                  originalname: entry.entryName,
                  mimetype: `image/${imgExt.replace(".", "")}`,
                });
                const outputPath = path.join(uploadDir, tempFilename);
                fs.writeFileSync(outputPath, entry.getData());
                imageUrl = imageUrlForFilename(tempFilename, "product");
              }
            } catch (imgErr) {
              console.warn(`[BULK IMPORT] Image upload error for "${imageFilename}":`, imgErr.message);
            }
          } else {
            results.missingImages++;
          }
        }

        // Create product using same logic as manual Add Product
        const slug =
          name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") +
          "-" +
          Date.now().toString(36) +
          "-" +
          i;

        const result = await query(
          `INSERT INTO products
           (name, slug, description, short_description, price, sale_price, discount_percent,
            stock, stock_quantity, category_id, subcategory_id, image_url, sku, status, featured, brand, features, applications, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            name,
            slug,
            description,
            null,
            price,
            null,
            null,
            stock,
            stock,
            category.id,
            null,
            imageUrl,
            null,
            status,
            featured,
            brand,
            features,
            JSON.stringify([]),
          ]
        );

        results.imported++;
      } catch (err) {
        results.failed++;
        results.errors.push({ row: rowNum, message: err.message || "Unknown error" });
      }
    }

    // Clean up uploaded files
    try {
      if (importFile.path && fs.existsSync(importFile.path)) fs.unlinkSync(importFile.path);
      if (req.files?.zip?.[0]?.path && fs.existsSync(req.files.zip[0].path)) {
        fs.unlinkSync(req.files.zip[0].path);
      }
    } catch (cleanupErr) {
      console.warn("[BULK IMPORT] Cleanup error:", cleanupErr);
    }

    return success(res, "Bulk import completed", { results });
  } catch (error) {
    console.error("[BULK IMPORT ERROR]", error);
    if (error.statusCode) throw error;
    throw new AppError(error.message || "Bulk import failed", 500, "BULK_IMPORT_ERROR");
  }
});

/** GET /api/admin/products/download-template */
const downloadTemplate = asyncHandler(async (req, res) => {
  try {
    const format = req.query.format || "xlsx";
    const headers = [
      "product_name",
      "description",
      "price",
      "stock",
      "category",
      "brand",
      "features",
      "status",
      "featured",
      "image",
    ];

    const sampleData = [
      ["Smart Thermostat Pro", "Advanced smart thermostat with WiFi", "199.99", "50", "Smart Home", "Tekunik", "WiFi Enabled|Voice Control|Mobile App", "active", "1", "thermostat.jpg"],
      ["Security Camera", "HD security camera with night vision", "89.99", "100", "Smart Home", "Tekunik", "HD Video|Night Vision|Motion Detection", "active", "1", "camera.png"],
      ["Smart Sensor", "Motion and temperature sensor", "29.99", "200", "Smart Home", "Tekunik", "Motion Detection|Temperature Sensor|Battery Powered", "active", "0", "sensor.webp"],
    ];

    const wsData = [headers, ...sampleData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws["!cols"] = [
      { wch: 30 }, { wch: 40 }, { wch: 10 }, { wch: 8 },
      { wch: 20 }, { wch: 15 }, { wch: 40 }, { wch: 10 }, { wch: 8 }, { wch: 20 },
    ];

    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=product-import-template.csv");
      return res.send(csv);
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=product-import-template.xlsx");
    return res.send(buffer);
  } catch (error) {
    console.error("[DOWNLOAD TEMPLATE ERROR]", error);
    if (error.statusCode) throw error;
    throw new AppError(error.message || "Failed to download template", 500, "TEMPLATE_ERROR");
  }
});

module.exports = {
  bulkImport,
  downloadTemplate,
};
