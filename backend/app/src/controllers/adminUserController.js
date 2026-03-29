const { z } = require('zod');
const User = require('../models/User');
const { adminUpdateUserStatusSchema } = require('../utils/validators');
const logger = require('../utils/logger');

const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { storeName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-password');

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = adminUpdateUserStatusSchema.parse(req.body);

    const user = await User.findById(id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }
    
    if (user.role === 'admin') {
      res.status(403);
      return next(new Error('Cannot change status of another admin'));
    }

    user.status = validatedData.status;
    await user.save();
    
    // Simulating audit logging (if needed could be written to a DB collection later)
    logger.info(`[AUDIT] Admin ${req.user.email} changed user ${user.email} status to ${validatedData.status}`);

    res.status(200).json({
      success: true,
      message: `User status updated to ${validatedData.status}`,
      data: {
        id: user._id,
        status: user.status,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: err.errors[0].message });
    }
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus,
};