const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const {
  getProfile,
  updateProfile,
  changePassword,
} = require('../controllers/profileController');

const uploadDir = path.join(__dirname, '../../uploads/store-logos');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);
    if (ok) return cb(null, true);
    cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed for store logo'));
  },
});

const router = express.Router();

router.get('/profile', getProfile);
router.put('/profile/password', changePassword);
router.put(
  '/profile',
  (req, res, next) => {
    upload.single('storeLogo')(req, res, (err) => {
      if (err) {
        res.status(400);
        return next(err);
      }
      next();
    });
  },
  updateProfile
);

module.exports = router;
