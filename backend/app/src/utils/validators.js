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

const sellerFaqEntrySchema = z.object({
  question: z.string().trim().min(1, 'FAQ question is required').max(200),
  answer: z.string().trim().min(1, 'FAQ answer is required').max(1200),
});

const sellerProfileUpdateSchema = z.object({
  storeName: z.string().max(120).optional(),
  ownerName: z.string().max(120).optional(),
  storeDescription: z.string().max(10000).optional(),
  storeFaqs: z.array(sellerFaqEntrySchema).max(30, 'Maximum 30 FAQs are allowed').optional(),
  bankDetails: z.string().max(500).optional(),
  bankAccountHolderName: z.string().max(200).optional(),
  bankName: z.string().max(200).optional(),
  bankIBAN: z.string().max(100).optional(),
  businessAddress: z.string().max(500).optional(),
  contactDetails: z
    .object({
      phone: z.string().max(50).optional(),
      email: z.union([z.string().email(), z.literal('')]).optional(),
    })
    .optional(),
});

const buyerProfileUpdateSchema = z
  .object({
    name: z.string().max(120).optional(),
    phoneNumber: z.string().max(50).optional(),
  })
  .refine((data) => Object.keys(data).some((key) => data[key] !== undefined), {
    message: 'At least one field is required',
  });

const buyerAddressSchema = z.object({
  label: z.string().max(100).optional(),
  street: z.string().min(1, 'Street is required').max(300),
  city: z.string().min(1, 'City is required').max(120),
  state: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  zipCode: z.string().max(30).optional(),
  lat: z.number().finite().optional(),
  lng: z.number().finite().optional(),
  isDefault: z.boolean().optional(),
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

const checkoutSchema = z.object({
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    zipCode: z.string().min(1),
  }),
  paymentMethod: z.enum(['cod', 'card', 'wallet', 'boutique_account', 'stripe']),
  paymentProof: z.union([z.string(), z.record(z.string())]).optional().nullable(),
});

const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const adminUpdateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'blocked']),
});

const adminUpdateProductSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  isFlagged: z.boolean().optional(),
});

const adminPaymentsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['success', 'failed']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) return data.endDate >= data.startDate;
  return true;
}, { message: 'endDate must be on or after startDate', path: ['endDate'] });
const adminAnalyticsQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily'),
});

const autocompleteQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Query too long').trim(),
});

const pricingSuggestionSchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(200),
  category: z.string().min(1, 'Category is required').max(120),
  inputPrice: z.coerce.number().nonnegative().optional(),
  price: z.coerce.number().nonnegative().optional(),
  costPrice: z.coerce.number().nonnegative().optional(),
  stockQuantity: z.coerce.number().int().nonnegative().optional(),
}).refine((data) => data.inputPrice !== undefined || data.price !== undefined || data.costPrice !== undefined, {
  message: 'At least one of inputPrice, price, or costPrice is required',
  path: ['inputPrice'],
});

const objectIdPattern = /^[a-fA-F0-9]{24}$/;

const queryBooleanSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  return value;
}, z.boolean().optional());

const chatConversationParamSchema = z.object({
  conversationId: z.string().min(1, 'conversationId is required').max(200),
});

const chatConversationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  resolved: queryBooleanSchema,
});

const chatMessageHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const chatSendMessageSchema = z
  .object({
    receiverId: z
      .string()
      .regex(objectIdPattern, 'Invalid receiverId')
      .optional(),
    conversationId: z.string().min(1, 'conversationId is required').max(200).optional(),
    orderId: z
      .string()
      .regex(objectIdPattern, 'Invalid orderId')
      .optional(),
    productId: z
      .string()
      .regex(objectIdPattern, 'Invalid productId')
      .optional(),
    message: z.string().max(2000, 'Message too long').optional(),
    imageUrls: z
      .array(
        z
          .string()
          .trim()
          .min(1, 'Image URL is required')
          .refine((value) => /^https?:\/\//i.test(value) || /^\/uploads\//i.test(value), {
            message: 'Invalid image URL',
          })
      )
      .max(5, 'Maximum 5 images are allowed')
      .optional(),
  })
  .superRefine((data, ctx) => {
    const hasConversation = Boolean(data.conversationId?.trim());
    const hasReceiver = Boolean(data.receiverId?.trim());
    const hasText = Boolean(data.message?.trim());
    const hasImages = Array.isArray(data.imageUrls) && data.imageUrls.length > 0;

    if (!hasConversation && !hasReceiver) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['receiverId'],
        message: 'receiverId is required when conversationId is not provided',
      });
    }

    if (!hasText && !hasImages) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['message'],
        message: 'Message text or at least one image is required',
      });
    }
  });

const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long').trim(),
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
  buyerProfileUpdateSchema,
  buyerAddressSchema,
  sellerPasswordChangeSchema,
  checkoutSchema,
  adminLoginSchema,
  adminUpdateUserStatusSchema,
  adminUpdateProductSchema,
  adminPaymentsQuerySchema,
  adminAnalyticsQuerySchema,
  autocompleteQuerySchema,
  pricingSuggestionSchema,
  chatConversationParamSchema,
  chatConversationQuerySchema,
  chatMessageHistoryQuerySchema,
  chatSendMessageSchema,
  chatMessageSchema,
};
