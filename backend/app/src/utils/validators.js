const { z } = require('zod');

const baseSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
});

const signupSchema = z.discriminatedUnion('role', [
  // Buyer Schema
  z.object({
    role: z.literal('buyer'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters')
  }),
  // Seller Schema
  z.object({
    role: z.literal('seller'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    storeName: z.string().min(2, 'Store name is required'),
    ownerName: z.string().min(2, 'Owner name is required'),
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    businessAddress: z.string().min(5, 'Business address is required'),
    bankDetails: z.string().min(5, 'Bank details are required')
  })
]).superRefine((val, ctx) => {
  if (val.password !== val.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords don't match",
      path: ["confirmPassword"]
    });
  }
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const sellerLoginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or Phone is required'),
  password: z.string().min(1, 'Password is required')
});

module.exports = {
  signupSchema,
  loginSchema,
  sellerLoginSchema
};
