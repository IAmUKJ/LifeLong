const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinaryMiddleware = async (req, res, next) => {
  try {
    // ============================
    // CASE 1: upload.single()
    // ============================
    if (req.file) {
      console.log("📤 Uploading single file to Cloudinary");

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "lifelong_uploads",
        resource_type: "auto",
      });

      req.fileUrl = result.secure_url;

      fs.unlinkSync(req.file.path); // cleanup
      return next();
    }

    // ============================
    // CASE 2: upload.fields()
    // ============================
    if (req.files && Object.keys(req.files).length > 0) {
      console.log("📤 Uploading multiple files to Cloudinary");

      // License document
      if (req.files.licenseDocument?.[0]) {
        console.log("➡️ Uploading license document");

        const license = await cloudinary.uploader.upload(
          req.files.licenseDocument[0].path,
          { folder: "lifelong_uploads/licenses" }
        );

        req.licenseDocumentUrl = license.secure_url;
        fs.unlinkSync(req.files.licenseDocument[0].path);
      }

      // Profile picture
      if (req.files.profilePicture?.[0]) {
        console.log("➡️ Uploading profile picture");

        const profile = await cloudinary.uploader.upload(
          req.files.profilePicture[0].path,
          { folder: "lifelong_uploads/profile_pictures" }
        );

        req.profilePictureUrl = profile.secure_url;
        fs.unlinkSync(req.files.profilePicture[0].path);
      }

      return next();
    }

    console.log("⚠️ No files received for Cloudinary upload");
    next();
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    return res.status(500).json({
      message: "Cloudinary upload failed",
      error: error.message,
    });
  }
};

module.exports = { uploadToCloudinaryMiddleware };
