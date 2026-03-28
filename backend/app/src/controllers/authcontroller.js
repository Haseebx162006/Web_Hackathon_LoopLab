const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const { signupSchema, loginSchema, sellerLoginSchema } = require('../utils/validators');

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });

const signup = async (req, res, next) => {
  try {
    const validatedData = signupSchema.parse(req.body);

    const userExists = await User.findOne({ email: validatedData.email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    const userData = {
      email: validatedData.email,
      password: hashedPassword,
      role: validatedData.role,
      oauthProvider: null,
    };

    // Buyer specific 
    if (validatedData.role === 'buyer') {
      userData.name = validatedData.name;
    } 
    // Seller specific
    else if (validatedData.role === 'seller') {
      userData.storeName = validatedData.storeName;
      userData.ownerName = validatedData.ownerName;
      userData.phoneNumber = validatedData.phoneNumber;
      userData.businessAddress = validatedData.businessAddress;
      userData.bankDetails = validatedData.bankDetails;
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.role),
      role: user.role
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
         success: false, 
         message: error.errors[0].message, 
         path: error.errors[0].path 
      });
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validatedData.email }).select('+password');
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    if (user.status === 'blocked') {
      res.status(403);
      throw new Error('Your account has been blocked.');
    }

    if (!user.password) {
      res.status(401);
      throw new Error('This account uses social login. Sign in with your provider.');
    }

    const isMatch = await bcrypt.compare(validatedData.password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    await User.updateOne({ _id: user._id }, { lastLogin: new Date() });

    res.status(200).json({
      success: true,
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
       return res.status(400).json({ 
         success: false, 
         message: error.errors[0].message 
       });
    }
    next(error);
  }
};

const sellerLogin = async (req, res, next) => {
  try {
    const validatedData = sellerLoginSchema.parse(req.body);

    // Finding user by email OR phone number where role is 'seller'
    const user = await User.findOne({
      $or: [{ email: validatedData.emailOrPhone }, { phoneNumber: validatedData.emailOrPhone }],
      role: 'seller'
    }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials or not a seller account');
    }

    if (user.status === 'blocked') {
      res.status(403);
      throw new Error('Your account has been blocked.');
    }

    if (!user.password) {
      res.status(401);
      throw new Error('This account uses social login. Sign in with your provider.');
    }

    const isMatch = await bcrypt.compare(validatedData.password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid credentials or not a seller account');
    }

    await User.updateOne({ _id: user._id }, { lastLogin: new Date() });

    res.status(200).json({
      success: true,
      _id: user.id,
      storeName: user.storeName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message
      });
    }
    next(error);
  }
};

const oauthSuccess = async (req, res) => {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
  await User.updateOne({ _id: req.user._id }, { lastLogin: new Date() });
  const token = generateToken(req.user._id, req.user.role);
  const url = new URL('/auth/callback', frontend);
  url.searchParams.set('token', token);
  url.searchParams.set('role', req.user.role);
  res.redirect(url.toString());
};

const oauthFailure = (req, res) => {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
  const url = new URL('/auth/callback', frontend);
  url.searchParams.set('error', 'oauth_failed');
  res.redirect(url.toString());
};

module.exports = {
  signup,
  login,
  sellerLogin,
  oauthSuccess,
  oauthFailure,
  generateToken,
};
