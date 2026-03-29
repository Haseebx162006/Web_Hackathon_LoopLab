const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const { signupSchema, loginSchema, sellerLoginSchema } = require('../utils/validators');

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signup = async (req, res, next) => {
  try {
    const validatedData = signupSchema.parse(req.body);
    const normalizedEmail = validatedData.email.toLowerCase().trim();

    const userExists = await User.findOne({ email: normalizedEmail }).select('_id').lean();
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    const userData = {
      email: normalizedEmail,
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
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.role),
      role: user.role
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      return res.status(400).json({ 
         success: false, 
         message: issue?.message || 'Validation failed', 
         path: issue?.path 
      });
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const normalizedEmail = validatedData.email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail })
      .select('_id name email role status password')
      .select('+password');
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

    User.updateOne({ _id: user._id }, { lastLogin: new Date() }).catch(() => {});

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
         message: error.issues[0]?.message || 'Validation failed' 
       });
    }
    next(error);
  }
};

const sellerLogin = async (req, res, next) => {
  try {
    const validatedData = sellerLoginSchema.parse(req.body);
    const normalizedCredential = validatedData.emailOrPhone.trim();
    const isEmail = EMAIL_REGEX.test(normalizedCredential);

    const sellerFilter = isEmail
      ? { email: normalizedCredential.toLowerCase(), role: 'seller' }
      : { phoneNumber: normalizedCredential, role: 'seller' };

    const user = await User.findOne(sellerFilter)
      .select('_id storeName email role status password')
      .select('+password');

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

    User.updateOne({ _id: user._id }, { lastLogin: new Date() }).catch(() => {});

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
        message: error.issues[0]?.message || 'Validation failed'
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
