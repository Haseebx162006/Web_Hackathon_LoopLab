const { z } = require('zod');

const baseSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
});

const signupSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('buyer'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
  }),
  z.object({
    role: z.literal('seller'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    storeName: z.string().min(2, 'Store name is required'),
    ownerName: z.string().min(2, 'Owner name is required'),
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    businessAddress: z.string().min(5, 'Business address is required'),
    bankDetails: z.string().min(5, 'Bank details are required'),
  }),
]).superRefine((val, ctx) => {
  if (val.password !== val.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords don't match",
      path: ['confirmPassword'],
    });
  }
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const sellerLoginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or Phone is required'),
  password: z.string().min(1, 'Password is required'),
});

const variantEntrySchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

const productCreateSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().nonnegative('Price must be >= 0'),
  discountPrice: z.number().nonnegative().nullable().optional(),
  variants: z.array(variantEntrySchema).optional().default([]),
  skuCode: z.string().min(1, 'SKU is required'),
  stockQuantity: z.number().int().nonnegative(),
  productImages: z.array(z.string().min(1)).optional().default([]),
});

const productUpdateSchema = z.object({
  productName: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  discountPrice: z.number().nonnegative().nullable().optional(),
  variants: z.array(variantEntrySchema).optional(),
  skuCode: z.string().min(1).optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  productImages: z.array(z.string().min(1)).optional(),
});

const productBulkRowSchema = productCreateSchema;

const inventoryUpdateSchema = z.object({
  stockQuantity: z.number().int().nonnegative(),
});

const bulkInventoryItemSchema = z.object({
  skuCode: z.string().min(1),
  newStockQuantity: z.number().int().nonnegative(),
});

const bulkInventoryBodySchema = z.object({
  items: z.array(bulkInventoryItemSchema).min(1, 'At least one item is required'),
});

module.exports = {
  baseSignupSchema,
  signupSchema,
  loginSchema,
  sellerLoginSchema,
  productCreateSchema,
  productUpdateSchema,
  productBulkRowSchema,
  inventoryUpdateSchema,
  bulkInventoryBodySchema,
};
