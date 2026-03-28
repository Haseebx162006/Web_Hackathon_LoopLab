const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { adminLoginSchema } = require('../utils/validators');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret_key', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = adminLoginSchema.parse(req.body);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    if (user.role !== 'admin') {
      res.status(403);
      return next(new Error('Access denied. Admin resources only.'));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  adminLogin,
};