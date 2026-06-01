const fs = require("node:fs");
const path = require("node:path");

const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");
const uploadsUrlPrefix = "/uploads";

const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const allowedImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const ensureUploadsDir = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`[UPLOADS] Created uploads directory: ${uploadsDir}`);
  }
  return uploadsDir;
};

const getSafeUploadExtension = (file) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (allowedImageExtensions.has(ext)) return ext === ".jpeg" ? ".jpg" : ext;

  const mimeExtensions = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };

  return mimeExtensions[file.mimetype] || "";
};

const createUploadFilename = (file) => {
  const ext = getSafeUploadExtension(file);
  const baseName = path
    .basename(file.originalname || "image", path.extname(file.originalname || ""))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "image";

  return `${Date.now()}-${Math.round(Math.random() * 1e9)}-${baseName}${ext}`;
};

const imageUrlForFilename = (filename) => `${uploadsUrlPrefix}/${path.basename(filename)}`;

const normalizeImageUrl = (value) => {
  if (!value || typeof value !== "string") return null;

  const cleaned = value.trim().replace(/\\/g, "/");
  if (!cleaned || cleaned === "null" || cleaned === "undefined") return null;
  if (/^(https?:|data:|blob:)/i.test(cleaned)) return cleaned;

  const uploadsIndex = cleaned.toLowerCase().lastIndexOf("/uploads/");
  if (uploadsIndex >= 0) return cleaned.slice(uploadsIndex);

  if (cleaned.toLowerCase().startsWith("uploads/")) {
    return `/${cleaned}`;
  }

  if (cleaned.startsWith(uploadsUrlPrefix)) {
    return cleaned;
  }

  const ext = path.extname(cleaned).toLowerCase();
  if (allowedImageExtensions.has(ext)) {
    return imageUrlForFilename(cleaned);
  }

  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
};

const withNormalizedImageUrl = (row) => {
  if (!row || typeof row !== "object") return row;
  return {
    ...row,
    image_url: normalizeImageUrl(row.image_url),
  };
};

module.exports = {
  allowedImageMimeTypes,
  allowedImageExtensions,
  createUploadFilename,
  ensureUploadsDir,
  imageUrlForFilename,
  normalizeImageUrl,
  uploadsDir,
  withNormalizedImageUrl,
};
