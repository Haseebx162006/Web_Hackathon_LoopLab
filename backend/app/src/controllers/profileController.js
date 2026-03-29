const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const User = require('../models/User');
const { sellerProfileUpdateSchema, sellerPasswordChangeSchema } = require('../utils/validators');
const { uploadImage } = require('../utils/cloudinary');

const hasCloudinaryConfig = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
};

const resolveFileExtension = (file) => {
  const nameExt = path.extname(file.originalname || '').toLowerCase();
  if (nameExt) {
    return nameExt;
  }

  if (file.mimetype === 'image/png') {
    return '.png';
  }

  return '.jpg';
};

const saveStoreLogoLocally = async (file, req) => {
  const ext = resolveFileExtension(file);
  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'store-logos');
  const filePath = path.join(uploadsDir, fileName);

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(filePath, file.buffer);

  const origin = `${req.protocol}://${req.get('host')}`;
  return `${origin}/uploads/store-logos/${fileName}`;
};

const persistStoreLogo = async (file, req) => {
  if (!file?.buffer) {
    throw new Error('Invalid store logo upload');
  }

  if (hasCloudinaryConfig()) {
    try {
      const uploadedUrl = await uploadImage(file.buffer, 'store-logos');
      if (uploadedUrl) {
        return uploadedUrl;
      }
    } catch (err) {
      // In production, don't fall back to local storage (ephemeral filesystem)
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Image upload failed. Please try again later.');
      }
    }
  }

  // Local fallback only in development
  return saveStoreLogoLocally(file, req);
};

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

const parseStoreFaqs = (raw) => {
  if (raw == null || raw === '') return undefined;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
};

const updateProfile = async (req, res, next) => {
  try {
    const body = {
      storeName: req.body.storeName,
      ownerName: req.body.ownerName,
      storeDescription: req.body.storeDescription,
      storeFaqs: parseStoreFaqs(req.body.storeFaqs),
      contactDetails: parseContactDetails(req.body.contactDetails),
      bankDetails: req.body.bankDetails,
      bankAccountHolderName: req.body.bankAccountHolderName,
      bankName: req.body.bankName,
      bankIBAN: req.body.bankIBAN,
      businessAddress: req.body.businessAddress,
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

    if (parsed.storeFaqs !== undefined) {
      user.storeFaqs = parsed.storeFaqs;
    }

    if (parsed.storeName !== undefined) {
      user.storeName = parsed.storeName;
    }

    if (parsed.ownerName !== undefined) {
      user.ownerName = parsed.ownerName;
    }

    if (parsed.bankDetails !== undefined) {
      user.bankDetails = parsed.bankDetails;
    }

    if (parsed.bankAccountHolderName !== undefined) {
      user.bankAccountHolderName = parsed.bankAccountHolderName;
    }

    if (parsed.bankName !== undefined) {
      user.bankName = parsed.bankName;
    }

    if (parsed.bankIBAN !== undefined) {
      user.bankIBAN = parsed.bankIBAN;
    }

    if (parsed.businessAddress !== undefined) {
      user.businessAddress = parsed.businessAddress;
    }

    if (parsed.contactDetails !== undefined) {
      if (!user.contactDetails) user.contactDetails = {};
      if (parsed.contactDetails.phone !== undefined) {
        user.contactDetails.phone = parsed.contactDetails.phone;
        user.phoneNumber = parsed.contactDetails.phone;
      }
      if (parsed.contactDetails.email !== undefined) {
        user.contactDetails.email =
          parsed.contactDetails.email === '' ? undefined : parsed.contactDetails.email;
      }
    }

    if (req.file) {
      user.storeLogo = await persistStoreLogo(req.file, req);
    }

    // Check if profile is complete
    if (user.role === 'seller') {
      const isComplete = Boolean(
        user.storeName &&
        user.ownerName &&
        user.phoneNumber &&
        user.businessAddress &&
        user.bankAccountHolderName &&
        user.bankName &&
        user.bankIBAN
      );
      user.profileCompleted = isComplete;
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
