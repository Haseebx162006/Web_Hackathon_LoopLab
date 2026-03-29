import { apiSlice, type UserRole } from './apiSlice';

export interface AdminUserSummary {
  _id: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'blocked';
  name?: string;
  storeName?: string;
  ownerName?: string;
  phoneNumber?: string;
  businessAddress?: string;
  bankDetails?: string;
  bankAccountHolderName?: string;
  bankName?: string;
  bankIBAN?: string;
  profileCompleted?: boolean;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminProductSummary {
  _id: string;
  sellerId?: {
    _id?: string;
    email?: string;
    storeName?: string;
  } | string;
  productName: string;
  description?: string;
  category: string;
  price: number;
  discountPrice?: number | null;
  skuCode: string;
  stockQuantity: number;
  productImages?: string[];
  status: 'pending' | 'approved' | 'rejected';
  isFlagged: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminOrderItem {
  _id?: string;
  product?: {
    _id?: string;
    productName?: string;
    skuCode?: string;
    productImages?: string[];
  } | string | null;
  quantity: number;
  priceAtPurchase: number;
}

export interface AdminOrderSummary {
  _id: string;
  buyerId?: {
    _id?: string;
    name?: string;
    email?: string;
  } | string;
  sellerId?: {
    _id?: string;
    storeName?: string;
    email?: string;
  } | string;
  items: AdminOrderItem[];
  totalAmount: number;
  status:
    | 'pending'
    | 'processing'
    | 'confirmed'
    | 'packed'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'return_requested'
    | 'returned';
  trackingId?: string | null;
  returnStatus?: 'none' | 'requested' | 'approved' | 'rejected';
  refundStatus?: 'none' | 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface AdminPaymentSummary {
  _id: string;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: UserRole;
  } | string;
  orderId?: {
    _id?: string;
    totalAmount?: number;
    status?: string;
  } | string;
  amount: number;
  paymentMethod: 'card' | 'wallet' | 'cod';
  status: 'success' | 'failed';
  transactionId?: string | null;
  refundStatus: 'none' | 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface PaginationData {
  total: number;
  page: number;
  pages: number;
}

export interface AdminDashboardData {
  totalUsers: number;
  totalBuyers: number;
  totalSellers: number;
  totalOrders: number;
  pendingOrders?: number;
  totalRevenue: number;
  recentOrders: AdminOrderSummary[];
  recentUsers: AdminUserSummary[];
}

export interface AdminAnalyticsData {
  revenueChart: Array<{
    date: string;
    revenue: number;
  }>;
  orderTrends: Array<{
    date: string;
    orders: number;
  }>;
  topCategories: Array<{
    category: string;
    totalSales: number;
  }>;
  activeUsers: {
    buyers: number;
    sellers: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AdminUsersResponse {
  users: AdminUserSummary[];
  pagination: PaginationData;
}

export interface AdminProductsResponse {
  products: AdminProductSummary[];
  pagination: PaginationData;
}

export interface AdminOrdersResponse {
  orders: AdminOrderSummary[];
  pagination: PaginationData;
}

export interface AdminPaymentsResponse {
  payments: AdminPaymentSummary[];
  pagination: PaginationData;
}

export interface AdminRefundsResponse {
  refunds: AdminPaymentSummary[];
  pagination: PaginationData;
}

export interface AdminUserQuery {
  role?: UserRole;
  status?: 'active' | 'suspended' | 'blocked';
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminProductQuery {
  status?: 'pending' | 'approved' | 'rejected';
  isFlagged?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminOrderQuery {
  status?: AdminOrderSummary['status'];
  returnStatus?: 'none' | 'requested' | 'approved' | 'rejected';
  refundStatus?: 'none' | 'pending' | 'completed';
  page?: number;
  limit?: number;
}

export interface AdminPaymentQuery {
  page?: number;
  limit?: number;
  status?: 'success' | 'failed';
  startDate?: string;
  endDate?: string;
}

const withQuery = <T extends object>(query?: T) => {
  if (!query) {
    return undefined;
  }

  const params: Record<string, string> = {};

  Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params[key] = String(value);
  });

  return params;
};

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query<ApiResponse<AdminDashboardData>, void>({
      query: () => '/admin/dashboard',
      providesTags: ['AdminDashboard'],
    }),

    getAdminUsers: builder.query<ApiResponse<AdminUsersResponse>, AdminUserQuery | undefined>({
      query: (query) => ({
        url: '/admin/users',
        params: withQuery(query),
      }),
      providesTags: (result) => {
        if (!result?.data?.users) {
          return [{ type: 'AdminUser' as const, id: 'LIST' }];
        }

        return [
          ...result.data.users.map((user) => ({ type: 'AdminUser' as const, id: user._id })),
          { type: 'AdminUser' as const, id: 'LIST' },
        ];
      },
    }),

    getAdminUserById: builder.query<ApiResponse<AdminUserSummary>, string>({
      query: (id) => `/admin/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'AdminUser', id }],
    }),

    updateAdminUserStatus: builder.mutation<
      ApiResponse<{ id: string; status: 'active' | 'suspended' | 'blocked' }>,
      { id: string; status: 'active' | 'suspended' | 'blocked' }
    >({
      query: ({ id, status }) => ({
        url: `/admin/users/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'AdminUser', id: arg.id },
        { type: 'AdminUser', id: 'LIST' },
        'AdminDashboard',
      ],
    }),

    getAdminProducts: builder.query<ApiResponse<AdminProductsResponse>, AdminProductQuery | undefined>({
      query: (query) => ({
        url: '/admin/products',
        params: withQuery(query),
      }),
      providesTags: (result) => {
        if (!result?.data?.products) {
          return [{ type: 'AdminProduct' as const, id: 'LIST' }];
        }

        return [
          ...result.data.products.map((product) => ({ type: 'AdminProduct' as const, id: product._id })),
          { type: 'AdminProduct' as const, id: 'LIST' },
        ];
      },
    }),

    getAdminProductById: builder.query<ApiResponse<AdminProductSummary>, string>({
      query: (id) => `/admin/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'AdminProduct', id }],
    }),

    approveAdminProduct: builder.mutation<ApiResponse<{ id: string; status: string }>, string>({
      query: (id) => ({
        url: `/admin/products/${id}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'AdminProduct', id },
        { type: 'AdminProduct', id: 'LIST' },
        'AdminDashboard',
      ],
    }),

    rejectAdminProduct: builder.mutation<ApiResponse<{ id: string; status: string }>, string>({
      query: (id) => ({
        url: `/admin/products/${id}/reject`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'AdminProduct', id },
        { type: 'AdminProduct', id: 'LIST' },
      ],
    }),

    flagAdminProduct: builder.mutation<ApiResponse<{ id: string; isFlagged: boolean }>, { id: string; isFlagged: boolean }>(
      {
        query: ({ id, isFlagged }) => ({
          url: `/admin/products/${id}/flag`,
          method: 'PATCH',
          body: { isFlagged },
        }),
        invalidatesTags: (_result, _error, arg) => [
          { type: 'AdminProduct', id: arg.id },
          { type: 'AdminProduct', id: 'LIST' },
        ],
      }
    ),

    getAdminOrders: builder.query<ApiResponse<AdminOrdersResponse>, AdminOrderQuery | undefined>({
      query: (query) => ({
        url: '/admin/orders',
        params: withQuery(query),
      }),
      providesTags: (result) => {
        if (!result?.data?.orders) {
          return [{ type: 'AdminOrder' as const, id: 'LIST' }];
        }

        return [
          ...result.data.orders.map((order) => ({ type: 'AdminOrder' as const, id: order._id })),
          { type: 'AdminOrder' as const, id: 'LIST' },
        ];
      },
    }),

    getAdminOrderById: builder.query<ApiResponse<AdminOrderSummary>, string>({
      query: (id) => `/admin/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'AdminOrder', id }],
    }),

    getAdminPayments: builder.query<ApiResponse<AdminPaymentsResponse>, AdminPaymentQuery | undefined>({
      query: (query) => ({
        url: '/admin/payments',
        params: withQuery(query),
      }),
      providesTags: (result) => {
        if (!result?.data?.payments) {
          return [{ type: 'AdminPayment' as const, id: 'LIST' }];
        }

        return [
          ...result.data.payments.map((payment) => ({ type: 'AdminPayment' as const, id: payment._id })),
          { type: 'AdminPayment' as const, id: 'LIST' },
        ];
      },
    }),

    getAdminPaymentById: builder.query<ApiResponse<AdminPaymentSummary>, string>({
      query: (id) => `/admin/payments/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'AdminPayment', id }],
    }),

    getAdminRefundLogs: builder.query<ApiResponse<AdminRefundsResponse>, { page?: number; limit?: number } | undefined>({
      query: (query) => ({
        url: '/admin/refunds',
        params: withQuery(query),
      }),
      providesTags: ['AdminPayment'],
    }),

    getAdminAnalytics: builder.query<ApiResponse<AdminAnalyticsData>, { period?: 'daily' | 'weekly' | 'monthly' } | undefined>({
      query: (query) => ({
        url: '/admin/analytics',
        params: withQuery(query),
      }),
      providesTags: ['AdminAnalytics'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAdminDashboardQuery,
  useGetAdminUsersQuery,
  useGetAdminUserByIdQuery,
  useUpdateAdminUserStatusMutation,
  useGetAdminProductsQuery,
  useGetAdminProductByIdQuery,
  useApproveAdminProductMutation,
  useRejectAdminProductMutation,
  useFlagAdminProductMutation,
  useGetAdminOrdersQuery,
  useGetAdminOrderByIdQuery,
  useGetAdminPaymentsQuery,
  useGetAdminPaymentByIdQuery,
  useGetAdminRefundLogsQuery,
  useGetAdminAnalyticsQuery,
} = adminApi;
