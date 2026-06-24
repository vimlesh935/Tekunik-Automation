const fs = require("node:fs");
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/adminMiddleware');
const {
  productImageUpload,
  handleProductImageUploadError,
  logProductImageUploadPayload,
} = require("../middleware/productImageUpload");
const {
  ensureProductUploadsDir,
  imageUrlForFilename,
} = require("../utils/uploadPaths");

ensureProductUploadsDir();

// POST /api/admin/upload - Upload image endpoint with admin auth
router.post('/', requireAdmin, productImageUpload.single('image'), handleProductImageUploadError, logProductImageUploadPayload, (req, res) => {
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
    const imageUrl = imageUrlForFilename(req.file.filename, "product");
    
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
