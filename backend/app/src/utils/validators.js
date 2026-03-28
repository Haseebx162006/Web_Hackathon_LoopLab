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

const sellerOrderStatusSchema = z.object({
  status: z.enum(['confirmed', 'packed', 'shipped']),
  trackingId: z.string().trim().max(200).optional().nullable(),
});

const couponCreateSchema = z
  .object({
    code: z.string().min(2, 'Code is required').max(64),
    discountType: z.enum(['percentage', 'flat']),
    discountValue: z.number().nonnegative(),
    minOrderAmount: z.number().nonnegative().default(0),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isActive: z.boolean().optional().default(true),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  })
  .superRefine((d, ctx) => {
    if (d.discountType === 'percentage' && d.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Percentage discount cannot exceed 100',
        path: ['discountValue'],
      });
    }
  });

const couponUpdateSchema = z
  .object({
    code: z.string().min(2).max(64).optional(),
    discountType: z.enum(['percentage', 'flat']).optional(),
    discountValue: z.number().nonnegative().optional(),
    minOrderAmount: z.number().nonnegative().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).some((k) => data[k] !== undefined), {
    message: 'At least one field is required',
  });

const analyticsQuerySchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  });

const sellerProfileUpdateSchema = z.object({
  storeDescription: z.string().max(10000).optional(),
  contactDetails: z
    .object({
      phone: z.string().max(50).optional(),
      email: z.union([z.string().email(), z.literal('')]).optional(),
    })
    .optional(),
});

const sellerPasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmNewPassword: z.string().min(1, 'Confirm your new password'),
  })
  .superRefine((val, ctx) => {
    if (val.newPassword !== val.confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New passwords don't match",
        path: ['confirmNewPassword'],
      });
    }
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
  sellerOrderStatusSchema,
  couponCreateSchema,
  couponUpdateSchema,
  analyticsQuerySchema,
  sellerProfileUpdateSchema,
  sellerPasswordChangeSchema,
};
