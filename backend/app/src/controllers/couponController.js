const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
const { couponCreateSchema, couponUpdateSchema } = require('../utils/validators');

const sellerId = (req) => req.user._id;

const normalizeCode = (code) => String(code).trim().toUpperCase();

const createCoupon = async (req, res, next) => {
  try {
    const body = couponCreateSchema.parse(req.body);
    const code = normalizeCode(body.code);

    const coupon = await Coupon.create({
      sellerId: sellerId(req),
      code,
      discountType: body.discountType,
      discountValue: body.discountValue,
      minOrderAmount: body.minOrderAmount,
      startDate: body.startDate,
      endDate: body.endDate,
      isActive: body.isActive,
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400);
      return next(new Error('A coupon with this code already exists'));
    }
    next(err);
  }
};

const listCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({ sellerId: sellerId(req) }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: coupons });
  } catch (err) {
    next(err);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid coupon id'));
    }

    const body = couponUpdateSchema.parse(req.body);
    const coupon = await Coupon.findOne({ _id: id, sellerId: sellerId(req) });
    if (!coupon) {
      res.status(404);
      return next(new Error('Coupon not found'));
    }

    if (body.code !== undefined) coupon.code = normalizeCode(body.code);
    if (body.discountType !== undefined) coupon.discountType = body.discountType;
    if (body.discountValue !== undefined) coupon.discountValue = body.discountValue;
    if (body.minOrderAmount !== undefined) coupon.minOrderAmount = body.minOrderAmount;
    if (body.startDate !== undefined) coupon.startDate = body.startDate;
    if (body.endDate !== undefined) coupon.endDate = body.endDate;
    if (body.isActive !== undefined) coupon.isActive = body.isActive;

    const start = coupon.startDate;
    const end = coupon.endDate;
    if (end < start) {
      res.status(400);
      return next(new Error('endDate must be on or after startDate'));
    }

    if (coupon.discountType === 'percentage' && coupon.discountValue > 100) {
      res.status(400);
      return next(new Error('Percentage discount cannot exceed 100'));
    }

    await coupon.save();
    res.status(200).json({ success: true, data: coupon });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400);
      return next(new Error('A coupon with this code already exists'));
    }
    next(err);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid coupon id'));
    }

    const deleted = await Coupon.findOneAndDelete({ _id: id, sellerId: sellerId(req) });
    if (!deleted) {
      res.status(404);
      return next(new Error('Coupon not found'));
    }

    res.status(200).json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCoupon,
  listCoupons,
  updateCoupon,
  deleteCoupon,
};
