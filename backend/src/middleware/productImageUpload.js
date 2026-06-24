const fs = require("node:fs");
const multer = require("multer");
const path = require("node:path");
const {
  allowedImageExtensions,
  allowedImageMimeTypes,
  createUploadFilename,
  ensureProductUploadsDir,
} = require("../utils/uploadPaths");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    try {
      const uploadDir = ensureProductUploadsDir();
      console.log(`[MULTER] Uploading product image to: ${uploadDir}`);
      cb(null, uploadDir);
    } catch (error) {
      console.error("[MULTER] Failed to prepare product uploads directory:", error);
      cb(error);
    }
  },
  filename(req, file, cb) {
    try {
      const filename = createUploadFilename(file);
      console.log(`[MULTER] Generated product filename: ${filename} (original: ${file.originalname})`);
      cb(null, filename);
    } catch (error) {
      console.error("[MULTER] Product filename generation error:", error);
      cb(error);
    }
  },
});

const PRODUCT_IMAGE_FIELD = "image";
const PRODUCT_IMAGES_FIELD = "images";
const LEGACY_PRODUCT_IMAGES_FIELD = "gallery";
const MAX_PRODUCT_IMAGES = 10;

const PRODUCT_GALLERY_FIELDS = [
  { name: PRODUCT_IMAGES_FIELD, maxCount: MAX_PRODUCT_IMAGES },
  { name: LEGACY_PRODUCT_IMAGES_FIELD, maxCount: MAX_PRODUCT_IMAGES },
  { name: PRODUCT_IMAGE_FIELD, maxCount: 1 },
];

const productImageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    console.log("[MULTER] Product image validation:", {
      mimetype: file.mimetype,
      originalname: file.originalname,
    });

    const extension = path.extname(file.originalname || "").toLowerCase();
    const mimeAllowed = allowedImageMimeTypes.has(file.mimetype);
    const extensionAllowed = allowedImageExtensions.has(extension);

    if (mimeAllowed && extensionAllowed) {
      console.log(`[MULTER] Product image accepted: ${file.mimetype}`);
      cb(null, true);
      return;
    }

    const error = new Error(
      `Invalid image format. Allowed: JPEG, PNG, WebP, GIF. Received: ${file.mimetype || "unknown"}`
    );
    console.error(`[MULTER] ${error.message}`);
    cb(error, false);
  },
});

const summarizeFiles = (files) => files.map((file) => ({
  fieldname: file.fieldname,
  filename: file.filename,
  originalname: file.originalname,
  mimetype: file.mimetype,
  size: file.size,
  path: file.path,
}));

const flattenUploadedFiles = (files) => {
  if (!files) return [];
  if (Array.isArray(files)) return files;
  return Object.values(files).flat();
};

const productGalleryUpload = (req, res, next) => {
  productImageUpload.fields(PRODUCT_GALLERY_FIELDS)(req, res, (err) => {
    if (err) return next(err);

    const filesByField = req.files || {};
    const files = flattenUploadedFiles(filesByField);
    if (files.length > MAX_PRODUCT_IMAGES) {
      return next(new multer.MulterError("LIMIT_FILE_COUNT", PRODUCT_IMAGES_FIELD));
    }

    req.uploadedFilesByField = filesByField;
    req.files = files;
    req.file = req.files[0] || null;

    next();
  });
};

const handleProductImageUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error(`[MULTER ERROR] ${err.code}: ${err.message}`, {
      unexpectedField: err.field,
      expectedFields: PRODUCT_GALLERY_FIELDS.map((field) => field.name),
      body: req.body,
    });
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: `Upload error: Unexpected field "${err.field}". Expected one of: ${PRODUCT_IMAGES_FIELD}, ${LEGACY_PRODUCT_IMAGES_FIELD}, ${PRODUCT_IMAGE_FIELD}.`,
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  if (err) {
    console.error(`[UPLOAD ERROR] ${err.message}`);
    return res.status(400).json({
      success: false,
      message: err.message || "Upload failed",
    });
  }

  next(err);
};

const logProductImageUploadPayload = (req, res, next) => {
  if (req.file) {
    const saved = fs.existsSync(req.file.path);
    console.log("[UPLOAD DEBUG] Uploaded file received:", {
      fieldname: req.file.fieldname,
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      saved,
    });
  }

  if (req.files) {
    console.log("[UPLOAD DEBUG] Uploaded files received:", summarizeFiles(flattenUploadedFiles(req.files)));
  }

  console.log("[UPLOAD DEBUG] Request body:", req.body || {});

  next();
};

module.exports = {
  handleProductImageUploadError,
  logProductImageUploadPayload,
  productGalleryUpload,
  productImageUpload,
  PRODUCT_IMAGE_FIELD,
  PRODUCT_IMAGES_FIELD,
  LEGACY_PRODUCT_IMAGES_FIELD,
};
