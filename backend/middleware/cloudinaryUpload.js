const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and common file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('application/');

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

const uploadToCloudinaryMiddleware = async (req, res, next) => {
  if (req.file) {
    try {
      // For now, use local storage instead of Cloudinary
      const fileUrl = `/uploads/${req.file.filename}`;
      req.fileUrl = fileUrl;
      req.filePublicId = req.file.filename;
      next();
    } catch (error) {
      return res.status(500).json({ message: 'File upload failed', error: error.message });
    }
  } else {
    next();
  }
};

module.exports = { upload, uploadToCloudinaryMiddleware };

