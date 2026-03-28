const bcrypt = require('bcrypt');
const User = require('../models/User');
const { sellerProfileUpdateSchema, sellerPasswordChangeSchema } = require('../utils/validators');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const parseContactDetails = (raw) => {
  if (raw == null || raw === '') return undefined;
  if (typeof raw === 'object' && raw !== null) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const updateProfile = async (req, res, next) => {
  try {
    const body = {
      storeDescription: req.body.storeDescription,
      contactDetails: parseContactDetails(req.body.contactDetails),
    };

    const cleaned = Object.fromEntries(
      Object.entries(body).filter(([, v]) => v !== undefined)
    );

    const parsed = sellerProfileUpdateSchema.parse(cleaned);

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (parsed.storeDescription !== undefined) {
      user.storeDescription = parsed.storeDescription;
    }

    if (parsed.contactDetails !== undefined) {
      if (!user.contactDetails) user.contactDetails = {};
      if (parsed.contactDetails.phone !== undefined) {
        user.contactDetails.phone = parsed.contactDetails.phone;
      }
      if (parsed.contactDetails.email !== undefined) {
        user.contactDetails.email =
          parsed.contactDetails.email === '' ? undefined : parsed.contactDetails.email;
      }
    }

    if (req.file) {
      const publicPath = `/uploads/store-logos/${req.file.filename}`;
      user.storeLogo = publicPath;
    }

    await user.save();

    const fresh = await User.findById(user._id).select('-password');

    res.status(200).json({ success: true, data: fresh });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const body = sellerPasswordChangeSchema.parse(req.body);

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !user.password) {
      res.status(400);
      return next(
        new Error('Password change is not available for this account')
      );
    }

    const match = await bcrypt.compare(body.currentPassword, user.password);
    if (!match) {
      res.status(400);
      return next(new Error('Current password is incorrect'));
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(body.newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
