const multer = require('multer');

// Configure multer to use memory storage, which provides a buffer instead of saving to disk
const storage = multer.memoryStorage();

// File filter to allow only image files (jpeg/jpg/png)
const fileFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Only JPEG and PNG are allowed.'), false);
  }
};

// Set multer with storage, filter, and limits (e.g., max 5MB)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5 MB
});

module.exports = upload;
