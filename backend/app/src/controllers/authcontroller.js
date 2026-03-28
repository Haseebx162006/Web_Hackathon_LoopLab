const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { signupSchema, loginSchema } = require('../utils/validators');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

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

    const user = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      role: validatedData.role || 'buyer'
    });

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    if (error.name === 'invalid_type' || error.name === 'ZodError') res.status(400);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(validatedData.password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    if (error.name === 'ZodError') res.status(400);
    next(error);
  }
};

module.exports = {
  signup,
  login
};