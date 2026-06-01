const fs = require("node:fs");
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireAdmin } = require('../middleware/adminMiddleware');
const {
  allowedImageExtensions,
  allowedImageMimeTypes,
  createUploadFilename,
  ensureUploadsDir,
  imageUrlForFilename,
} = require("../utils/uploadPaths");

ensureUploadsDir();

// Set up storage engine with detailed logging
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const uploadDir = ensureUploadsDir();
      console.log(`[MULTER] Uploading file to: ${uploadDir}`);
      cb(null, uploadDir);
    } catch (error) {
      console.error(`[MULTER] Failed to prepare uploads directory:`, error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    try {
      const filename = createUploadFilename(file);
      console.log(`[MULTER] Generated filename: ${filename} (original: ${file.originalname})`);
      cb(null, filename);
    } catch (error) {
      console.error(`[MULTER] Filename generation error:`, error);
      cb(error);
    }
  }
});

// Configure multer with strict validation
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    console.log(`[MULTER] File validation - mimetype: ${file.mimetype}, originalname: ${file.originalname}`);
    
    const extension = path.extname(file.originalname || "").toLowerCase();
    const mimeAllowed = allowedImageMimeTypes.has(file.mimetype);
    const extensionAllowed = allowedImageExtensions.has(extension);

    if (mimeAllowed && extensionAllowed) {
      console.log(`[MULTER] ✅ File type accepted: ${file.mimetype}`);
      cb(null, true);
    } else {
      const error = new Error(`Invalid image format. Allowed: JPEG, PNG, WebP, GIF. Received: ${file.mimetype || "unknown"}`);
      console.error(`[MULTER] ❌ ${error.message}`);
      cb(error, false);
    }
  }
});

// Upload middleware with error handling wrapper
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error(`[MULTER ERROR] ${err.code}: ${err.message}`);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File too large. Maximum size is 5MB.' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: `Upload error: ${err.message}` 
    });
  } else if (err) {
    console.error(`[UPLOAD ERROR] ${err.message}`);
    return res.status(400).json({ 
      success: false, 
      message: err.message || 'Upload failed' 
    });
  }
  next();
};

// POST /api/admin/upload - Upload image endpoint with admin auth
router.post('/', requireAdmin, upload.single('image'), handleMulterError, (req, res) => {
  try {
    console.log(`[UPLOAD] Starting upload handler...`);
    console.log(`[UPLOAD] File object exists: ${!!req.file}`);
    
    if (!req.file) {
      console.error(`[UPLOAD] ❌ No file received in request`);
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided. Please select an image.' 
      });
    }
    
    console.log(`[UPLOAD] File details:`, {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });
    
    // Verify file was actually saved to disk
    const filePath = req.file.path;
    if (!fs.existsSync(filePath)) {
      console.error(`[UPLOAD] ❌ File not found on disk at: ${filePath}`);
      return res.status(500).json({ 
        success: false, 
        message: 'File upload failed - file not saved to disk' 
      });
    }
    
    console.log(`[UPLOAD] ✅ File saved successfully at: ${filePath}`);
    
    // Return the public URL that will be stored in the database.
    const imageUrl = imageUrlForFilename(req.file.filename);
    
    console.log(`[UPLOAD] ✅ Upload successful. URL: ${imageUrl}`);
    
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: { 
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size
      }
    });
    
  } catch (error) {
    console.error(`[UPLOAD] ❌ Unexpected error during upload:`, error);
    res.status(500).json({ 
      success: false, 
      message: `Upload error: ${error.message}` 
    });
  }
});

module.exports = router;
