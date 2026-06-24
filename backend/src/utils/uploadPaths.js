const fs = require("node:fs");
const path = require("node:path");

const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");
const productUploadsDir = path.join(uploadsDir, "products");
const uploadsUrlPrefix = "/uploads";
const productUploadsUrlPrefix = `${uploadsUrlPrefix}/products`;

const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const allowedImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const ensureDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[UPLOADS] Created uploads directory: ${dir}`);
  }
  return dir;
};

const ensureUploadsDir = () => {
  ensureDirectory(uploadsDir);
  ensureDirectory(productUploadsDir);
  return uploadsDir;
};

const ensureProductUploadsDir = () => {
  ensureUploadsDir();
  return productUploadsDir;
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

const imageUrlForFilename = (filename, target = "product") => {
  const prefix = target === "product" ? productUploadsUrlPrefix : uploadsUrlPrefix;
  return `${prefix}/${path.basename(filename)}`;
};

const normalizeSlashes = (value) => {
  if (typeof value !== "string") return value;
  const protocolMatch = value.match(/^([a-zA-Z]+:)(\/\/+)/);
  if (!protocolMatch) return value.replace(/\/\/+/g, "/");
  const [, protocol, separator] = protocolMatch;
  const rest = value.slice(protocolMatch[0].length).replace(/\/\/+/g, "/");
  return `${protocol}${separator}${rest}`;
};

const normalizeImageUrl = (value) => {
  if (!value || typeof value !== "string") return null;

  const cleaned = normalizeSlashes(value.trim().replace(/\\/g, "/"));
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
    return imageUrlForFilename(cleaned, "product");
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
  ensureProductUploadsDir,
  ensureUploadsDir,
  imageUrlForFilename,
  normalizeImageUrl,
  productUploadsDir,
  uploadsDir,
  withNormalizedImageUrl,
};
