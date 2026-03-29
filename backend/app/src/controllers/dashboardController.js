const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');

const getBuyerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id })
      .populate('sellerId', 'storeName')
      .populate('items.product', 'productName productImages price discountPrice category stockQuantity')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

const requestOrderReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid order id'));
    }

    const order = await Order.findOne({ _id: id, buyerId: req.user._id });
    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    if (order.status !== 'delivered') {
      res.status(400);
      return next(new Error('Only delivered orders can be returned'));
    }

    order.status = 'return_requested';
    await order.save();

    res.status(200).json({ success: true, message: 'Return requested successfully', data: order });
  } catch (err) {
    next(err);
  }
};

const getBuyerProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const updateBuyerProfile = async (req, res, next) => {
  try {
    const { name, phoneNumber } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }
    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const newAddress = { ...req.body };
    if (newAddress.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    } else if (user.addresses.length === 0) {
      newAddress.isDefault = true;
    }
    user.addresses.push(newAddress);
    await user.save();
    res.status(200).json({ success: true, data: user.addresses });
  } catch (err) {
    next(err);
  }
};

const removeAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter((addr) => addr._id.toString() !== req.params.id);
    if (user.addresses.length > 0 && !user.addresses.some((addr) => addr.isDefault)) {
      user.addresses[0].isDefault = true;
    }
    await user.save();
    res.status(200).json({ success: true, data: user.addresses });
  } catch (err) {
    next(err);
  }
};

const setDefaultAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === req.params.id;
    });
    await user.save();
    res.status(200).json({ success: true, data: user.addresses });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBuyerOrders,
  requestOrderReturn,
  getBuyerProfile,
  updateBuyerProfile,
  addAddress,
  removeAddress,
  setDefaultAddress,
};