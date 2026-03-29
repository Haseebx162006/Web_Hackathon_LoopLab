import { apiSlice } from './apiSlice';

export type SellerOrderStatus =
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned';

export type SellerStatusUpdate = 'confirmed' | 'packed' | 'shipped';

export type SellerPaymentStatus = 'unpaid' | 'pending_verification' | 'paid' | 'failed' | 'refunded';

export interface SellerVariant {
  key: string;
  value: string;
}

export interface SellerProduct {
  _id: string;
  sellerId: string;
  productName: string;
  description: string;
  category: string;
  price: number;
  discountPrice: number | null;
  variants: SellerVariant[];
  skuCode: string;
  stockQuantity: number;
  productImages: string[];
  status: 'pending' | 'approved' | 'rejected';
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SellerLowStockItem {
  _id: string;
  productName: string;
  stockQuantity: number;
  price: number;
}

export interface SellerDashboardPoint {
  _id: string;
  amount: number;
}

export interface SellerDashboardData {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  lowStock: SellerLowStockItem[];
  salesGraphData: SellerDashboardPoint[];
}

export interface SellerAnalyticsPoint {
  period: string;
  revenue: number;
  ordersCount: number;
}

export interface SellerAnalyticsTopProduct {
  productId: string;
  productName?: string;
  skuCode?: string;
  unitsSold: number;
  revenue: number;
}

export interface SellerAnalyticsData {
  revenue: number;
  ordersCount: number;
  topProducts: SellerAnalyticsTopProduct[];
  salesGraphData: SellerAnalyticsPoint[];
  groupBy: 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
}

export interface SellerOrderBuyer {
  _id?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
}

export interface SellerOrderItemProduct {
  _id?: string;
  productName?: string;
  skuCode?: string;
  productImages?: string[];
  price?: number;
  discountPrice?: number | null;
}

export interface SellerOrderItem {
  _id: string;
  product: SellerOrderItemProduct | string | null;
  quantity: number;
  priceAtPurchase: number;
}

export interface SellerShippingAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface SellerOrder {
  _id: string;
  buyer?: SellerOrderBuyer;
  items: SellerOrderItem[];
  totalAmount: number;
  total: number;
  status: SellerOrderStatus;
  paymentMethod: 'cod' | 'card' | 'wallet' | 'boutique_account' | 'stripe';
  paymentStatus: SellerPaymentStatus;
  paymentProof: string | null;
  trackingId: string | null;
  returnStatus?: 'none' | 'requested' | 'approved' | 'rejected';
  refundStatus?: 'none' | 'pending' | 'completed';
  shippingAddress?: SellerShippingAddress;
  createdAt: string;
  updatedAt: string;
}

export interface SellerCoupon {
  _id: string;
  sellerId: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SellerProfile {
  _id: string;
  email: string;
  role: 'seller' | 'buyer' | 'admin';
  storeName?: string;
  ownerName?: string;
  phoneNumber?: string;
  businessAddress?: string;
  bankDetails?: string;
  bankAccountHolderName?: string;
  bankName?: string;
  bankIBAN?: string;
  profileCompleted?: boolean;
  storeLogo?: string;
  storeDescription?: string;
  contactDetails?: {
    phone?: string;
    email?: string;
  };
  storeFaqs?: SellerStoreFaq[];
}

export interface SellerStoreFaq {
  _id?: string;
  question: string;
  answer: string;
}

export interface SellerProductPayload {
  productName: string;
  description: string;
  category: string;
  price: number;
  discountPrice?: number | null;
  variants?: SellerVariant[];
  skuCode: string;
  stockQuantity: number;
  productImages?: string[];
}

export type SellerProductUpdatePayload = Partial<SellerProductPayload>;

export interface InventoryItem {
  productName: string;
  skuCode: string;
  stockQuantity: number;
  lowStock: boolean;
}

export interface InventoryListResponse {
  success: boolean;
  threshold: number;
  data: InventoryItem[];
}

export interface BulkInventoryUpdateItem {
  skuCode: string;
  newStockQuantity: number;
}

export interface BulkInventoryResponse {
  success: boolean;
  updated: number;
  products: SellerProduct[];
}

export interface SellerCouponPayload {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export type SellerCouponUpdatePayload = Partial<SellerCouponPayload>;

export interface SellerAnalyticsQuery {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface SellerProfileUpdatePayload {
  storeName?: string;
  ownerName?: string;
  storeDescription?: string;
  storeFaqs?: SellerStoreFaq[];
  bankDetails?: string;
  bankAccountHolderName?: string;
  bankName?: string;
  bankIBAN?: string;
  businessAddress?: string;
  contactDetails?: {
    phone?: string;
    email?: string;
  };
  storeLogo?: File | null;
}

export interface SellerPasswordChangePayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface ApiDataResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  message?: string;
}

export interface BulkProductsResponse {
  success: boolean;
  summary: {
    totalRows: number;
    created: number;
    failed: number;
    warned?: number;
  };
  created: SellerProduct[];
  warnings?: Array<{
    row: number;
    column?: string;
    field?: string;
    productName?: string;
    autoValue?: string | number | null;
    message: string;
  }>;
  errors: Array<{
    row: number;
    column?: string;
    field?: string;
    productName?: string;
    message: string;
  }>;
}

const buildProductImagesFormData = (files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });
  return formData;
};

const buildProfileFormData = (payload: SellerProfileUpdatePayload) => {
  const formData = new FormData();

  if (payload.storeName !== undefined) {
    formData.append('storeName', payload.storeName);
  }
  if (payload.ownerName !== undefined) {
    formData.append('ownerName', payload.ownerName);
  }
  if (payload.storeDescription !== undefined) {
    formData.append('storeDescription', payload.storeDescription);
  }
  if (payload.storeFaqs !== undefined) {
    formData.append('storeFaqs', JSON.stringify(payload.storeFaqs));
  }
  if (payload.bankDetails !== undefined) {
    formData.append('bankDetails', payload.bankDetails);
  }
  if (payload.bankAccountHolderName !== undefined) {
    formData.append('bankAccountHolderName', payload.bankAccountHolderName);
  }
  if (payload.bankName !== undefined) {
    formData.append('bankName', payload.bankName);
  }
  if (payload.bankIBAN !== undefined) {
    formData.append('bankIBAN', payload.bankIBAN);
  }
  if (payload.businessAddress !== undefined) {
    formData.append('businessAddress', payload.businessAddress);
  }
  if (payload.contactDetails !== undefined) {
    formData.append('contactDetails', JSON.stringify(payload.contactDetails));
  }
  if (payload.storeLogo) {
    formData.append('storeLogo', payload.storeLogo);
  }

  return formData;
};

export const sellerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSellerDashboard: builder.query<ApiDataResponse<SellerDashboardData>, void>({
      query: () => '/seller/dashboard',
      providesTags: ['SellerDashboard'],
    }),

    getSellerProducts: builder.query<ApiListResponse<SellerProduct>, void>({
      query: () => '/seller/products',
      providesTags: (result) => {
        if (!result?.data) {
          return [{ type: 'SellerProduct' as const, id: 'LIST' }];
        }
        return [
          ...result.data.map((product) => ({ type: 'SellerProduct' as const, id: product._id })),
          { type: 'SellerProduct' as const, id: 'LIST' },
        ];
      },
    }),

    createSellerProduct: builder.mutation<ApiDataResponse<SellerProduct>, SellerProductPayload>({
      query: (body) => ({
        url: '/seller/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'SellerProduct', id: 'LIST' }, 'SellerInventory', 'SellerDashboard'],
    }),

    updateSellerProduct: builder.mutation<
      ApiDataResponse<SellerProduct>,
      { id: string; body: SellerProductUpdatePayload }
    >({
      query: ({ id, body }) => ({
        url: `/seller/products/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'SellerProduct', id: arg.id },
        { type: 'SellerProduct', id: 'LIST' },
        'SellerInventory',
        'SellerDashboard',
      ],
    }),

    deleteSellerProduct: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/seller/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'SellerProduct', id: 'LIST' }, 'SellerInventory', 'SellerDashboard'],
    }),

    bulkUploadProducts: builder.mutation<BulkProductsResponse, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: '/seller/products/bulk',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: [{ type: 'SellerProduct', id: 'LIST' }, 'SellerInventory', 'SellerDashboard'],
    }),

    uploadProductImages: builder.mutation<
      ApiDataResponse<SellerProduct>,
      { productId: string; files: File[] }
    >({
      query: ({ productId, files }) => ({
        url: `/seller/products/${productId}/images`,
        method: 'POST',
        body: buildProductImagesFormData(files),
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'SellerProduct', id: arg.productId },
        { type: 'SellerProduct', id: 'LIST' },
      ],
    }),

    getSellerInventory: builder.query<InventoryListResponse, { threshold?: number } | void>({
      query: (arg) => ({
        url: '/seller/inventory',
        params: arg?.threshold !== undefined ? { threshold: String(arg.threshold) } : undefined,
      }),
      providesTags: ['SellerInventory'],
    }),

    updateSellerInventoryStock: builder.mutation<
      ApiDataResponse<SellerProduct>,
      { id: string; stockQuantity: number }
    >({
      query: ({ id, stockQuantity }) => ({
        url: `/seller/inventory/${id}`,
        method: 'PUT',
        body: { stockQuantity },
      }),
      invalidatesTags: ['SellerInventory', 'SellerProduct', 'SellerDashboard'],
    }),

    bulkUpdateSellerInventory: builder.mutation<BulkInventoryResponse, BulkInventoryUpdateItem[]>({
      query: (items) => ({
        url: '/seller/inventory/bulk',
        method: 'PUT',
        body: { items },
      }),
      invalidatesTags: ['SellerInventory', 'SellerProduct', 'SellerDashboard'],
    }),

    getSellerOrders: builder.query<ApiListResponse<SellerOrder>, void>({
      query: () => '/seller/orders',
      providesTags: ['SellerOrder'],
    }),

    updateSellerOrderStatus: builder.mutation<
      ApiDataResponse<SellerOrder>,
      { id: string; status: SellerStatusUpdate; trackingId?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/seller/orders/${id}/status`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['SellerOrder', 'SellerDashboard', 'SellerAnalytics'],
    }),

    getSellerCoupons: builder.query<ApiListResponse<SellerCoupon>, void>({
      query: () => '/seller/coupons',
      providesTags: ['SellerCoupon'],
    }),

    createSellerCoupon: builder.mutation<ApiDataResponse<SellerCoupon>, SellerCouponPayload>({
      query: (body) => ({
        url: '/seller/coupons',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SellerCoupon'],
    }),

    updateSellerCoupon: builder.mutation<
      ApiDataResponse<SellerCoupon>,
      { id: string; body: SellerCouponUpdatePayload }
    >({
      query: ({ id, body }) => ({
        url: `/seller/coupons/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['SellerCoupon'],
    }),

    deleteSellerCoupon: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/seller/coupons/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SellerCoupon'],
    }),

    getSellerAnalytics: builder.query<ApiDataResponse<SellerAnalyticsData>, SellerAnalyticsQuery>({
      query: (queryArgs) => {
        const params: Record<string, string> = {
          startDate: queryArgs.startDate,
          endDate: queryArgs.endDate,
        };
        if (queryArgs.groupBy) {
          params.groupBy = queryArgs.groupBy;
        }

        return {
          url: '/seller/analytics',
          params,
        };
      },
      providesTags: ['SellerAnalytics'],
    }),

    getSellerProfile: builder.query<ApiDataResponse<SellerProfile>, void>({
      query: () => '/seller/profile',
      providesTags: ['SellerProfile'],
    }),

    updateSellerProfile: builder.mutation<ApiDataResponse<SellerProfile>, SellerProfileUpdatePayload>({
      query: (payload) => ({
        url: '/seller/profile',
        method: 'PUT',
        body: buildProfileFormData(payload),
      }),
      invalidatesTags: ['SellerProfile', 'BuyerSellerSummary', 'BuyerProduct'],
    }),

    changeSellerPassword: builder.mutation<{ success: boolean; message: string }, SellerPasswordChangePayload>(
      {
        query: (body) => ({
          url: '/seller/profile/password',
          method: 'PUT',
          body,
        }),
      }
    ),

    verifySellerPayment: builder.mutation<
      ApiDataResponse<SellerOrder>,
      { orderId: string; action: 'approve' | 'reject' }
    >({
      query: ({ orderId, action }) => ({
        url: `/checkout/${orderId}/verify-payment`,
        method: 'PATCH',
        body: { action },
      }),
      invalidatesTags: ['SellerOrder', 'SellerDashboard'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSellerDashboardQuery,
  useGetSellerProductsQuery,
  useCreateSellerProductMutation,
  useUpdateSellerProductMutation,
  useDeleteSellerProductMutation,
  useBulkUploadProductsMutation,
  useUploadProductImagesMutation,
  useGetSellerInventoryQuery,
  useUpdateSellerInventoryStockMutation,
  useBulkUpdateSellerInventoryMutation,
  useGetSellerOrdersQuery,
  useUpdateSellerOrderStatusMutation,
  useGetSellerCouponsQuery,
  useCreateSellerCouponMutation,
  useUpdateSellerCouponMutation,
  useDeleteSellerCouponMutation,
  useGetSellerAnalyticsQuery,
  useGetSellerProfileQuery,
  useUpdateSellerProfileMutation,
  useChangeSellerPasswordMutation,
  useVerifySellerPaymentMutation,
} = sellerApi;
