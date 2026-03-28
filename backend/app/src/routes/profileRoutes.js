const express = require('express');
const {
  getProfile,
  updateProfile,
  changePassword,
} = require('../controllers/profileController');
const uploadImageMiddleware = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/profile', getProfile);
router.put('/profile/password', changePassword);
router.put(
  '/profile',
  (req, res, next) => {
    uploadImageMiddleware.single('storeLogo')(req, res, (err) => {
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
