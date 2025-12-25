const cloudinary = require("cloudinary").v2; 
const fs = require("fs");
const uploadToCloudinaryMiddleware = async (req, res, next) => {
  cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
  try {
    if (!req.file) return next();

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'lifelong_uploads',
      resource_type: 'auto',
    });

    req.fileUrl = result.secure_url;
    req.filePublicId = result.public_id;

    next();
  } catch (error) {
    return res.status(500).json({
      message: 'Cloudinary upload failed',
      error: error.message,
    });
  }
};

module.exports = { uploadToCloudinaryMiddleware };

