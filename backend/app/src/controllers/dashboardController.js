const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const {
  buyerProfileUpdateSchema,
  buyerAddressSchema,
} = require('../utils/validators');

const getBuyerOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { buyerId: req.user._id };
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('sellerId', 'storeName')
        .populate('items.product', 'productName productImages price discountPrice category stockQuantity')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
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
    if (!user) {
      res.status(404);
      return next(new Error('Buyer profile not found'));
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const updateBuyerProfile = async (req, res, next) => {
  try {
    const parsed = buyerProfileUpdateSchema.parse(req.body || {});

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('Buyer profile not found'));
    }

    if (parsed.name !== undefined) {
      user.name = parsed.name;
    }

    if (parsed.phoneNumber !== undefined) {
      user.phoneNumber = parsed.phoneNumber;
    }

    await user.save();

    const fresh = await User.findById(user._id).select('-password');
    res.status(200).json({ success: true, data: fresh });
  } catch (err) {
    next(err);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const parsed = buyerAddressSchema.parse(req.body || {});

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('Buyer profile not found'));
    }

    if (!Array.isArray(user.addresses)) {
      user.addresses = [];
    }

    const nextAddress = {
      label: parsed.label || 'Home',
      street: parsed.street,
      city: parsed.city,
      state: parsed.state || '',
      country: parsed.country || 'Pakistan',
      zipCode: parsed.zipCode || '',
      lat: parsed.lat,
      lng: parsed.lng,
      isDefault: Boolean(parsed.isDefault),
    };

    if (user.addresses.length === 0) {
      nextAddress.isDefault = true;
    }

    if (nextAddress.isDefault) {
      user.addresses.forEach((address) => {
        address.isDefault = false;
      });
    }

    user.addresses.push(nextAddress);

    if (!user.addresses.some((address) => address.isDefault) && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(201).json({ success: true, data: user.addresses });
  } catch (err) {
    next(err);
  }
};

const removeAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid address id'));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('Buyer profile not found'));
    }

    const index = user.addresses.findIndex((address) => String(address._id) === id);
    if (index < 0) {
      res.status(404);
      return next(new Error('Address not found'));
    }

    const wasDefault = user.addresses[index].isDefault;
    user.addresses.splice(index, 1);

    if (wasDefault && user.addresses.length > 0 && !user.addresses.some((address) => address.isDefault)) {
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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid address id'));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('Buyer profile not found'));
    }

    const target = user.addresses.id(id);
    if (!target) {
      res.status(404);
      return next(new Error('Address not found'));
    }

    user.addresses.forEach((address) => {
      address.isDefault = false;
    });
    target.isDefault = true;

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
