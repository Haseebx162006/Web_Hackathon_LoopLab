import { apiSlice } from './apiSlice';

export type BuyerOrderStatus =
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned';

export interface BuyerSellerSummary {
  _id?: string;
  storeName?: string;
  storeLogo?: string;
  storeFaqs?: BuyerStoreFaq[];
}

export interface BuyerStoreFaq {
  _id?: string;
  question: string;
  answer: string;
}

export interface BuyerStore {
  _id: string;
  storeName: string;
  storeLogo?: string;
  storeDescription?: string;
  productCount: number;
  createdAt: string;
}

export interface BuyerProduct {
  _id: string;
  productName: string;
  description?: string;
  category?: string;
  price: number;
  discountPrice?: number | null;
  productImages?: string[];
  images?: string[];
  stockQuantity?: number;
  stock?: number;
  skuCode?: string;
  status?: 'pending' | 'approved' | 'rejected';
  sellerId?: string | BuyerSellerSummary;
  rating?: number;
  totalReviews?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BuyerReview {
  _id: string;
  product: string;
  buyerId:
    | string
    | {
        _id?: string;
        name?: string;
      };
  rating: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BuyerHomeData {
  featuredProducts: BuyerProduct[];
  categories: string[];
  banners: string[];
}

export interface BuyerPagination {
  total: number;
  page: number;
  pages: number;
}

export interface BuyerSearchData {
  products: BuyerProduct[];
  pagination: BuyerPagination;
}

export interface BuyerProductDetailsData {
  product: BuyerProduct;
  store?: BuyerSellerSummary | null;
  reviews: BuyerReview[];
  avgRating: number;
}

export interface BuyerAutocompleteProduct {
  productName: string;
  category?: string;
  score?: number;
}

export interface BuyerAutocompleteData {
  products: BuyerAutocompleteProduct[];
  categories: string[];
  popularSearches: Array<{
    query: string;
    count: number;
  }>;
}

export interface BuyerCartItem {
  _id?: string;
  product: BuyerProduct | string | null;
  quantity: number;
}

export interface BuyerCart {
  _id?: string;
  buyerId?: string;
  items: BuyerCartItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BuyerCartData {
  cart: BuyerCart;
  subtotal: number;
}

export interface BuyerWishlist {
  _id?: string;
  buyerId?: string;
  items: Array<BuyerProduct | string>;
}

export interface BuyerShippingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface BuyerAddress extends BuyerShippingAddress {
  _id: string;
  label?: string;
  isDefault: boolean;
  lat?: number;
  lng?: number;
}

export interface BuyerProfile {
  _id: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  addresses: BuyerAddress[];
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerOrderItem {
  _id?: string;
  product: BuyerProduct | string | null;
  quantity: number;
  priceAtPurchase: number;
}

export interface BuyerOrder {
  _id: string;
  buyerId?: string;
  sellerId?:
    | string
    | {
        _id?: string;
        storeName?: string;
      };
  items: BuyerOrderItem[];
  totalAmount: number;
  status: BuyerOrderStatus;
  trackingId?: string | null;
  returnStatus?: 'none' | 'requested' | 'approved' | 'rejected';
  refundStatus?: 'none' | 'pending' | 'completed';
  shippingAddress?: BuyerShippingAddress;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerCheckoutPayload {
  shippingAddress: BuyerShippingAddress;
  paymentMethod: 'cod' | 'card' | 'wallet' | 'boutique_account' | 'stripe';
  paymentProof?: string | Record<string, string> | null;
}

export interface BuyerCheckoutResult {
  message: string;
  orders: string[];
}

export interface BuyerPaymentWebhookPayload {
  orderIds: string[];
  paymentStatus: 'success' | 'failed';
}

export interface BuyerPaymentWebhookResult {
  success: boolean;
  message: string;
}

export interface BuyerReviewPayload {
  productId: string;
  rating: number;
  comment?: string;
}

export interface BuyerSupportReply {
  reply: string;
  escalate: boolean;
}

export interface BuyerSupportPayload {
  message: string;
}

export interface BuyerProductsQuery {
  search?: string;
  category?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const toQueryParams = (query: BuyerProductsQuery) => {
  const params: Record<string, string> = {};

  if (query.search) {
    params.search = query.search;
  }
  if (query.category) {
    params.category = query.category;
  }
  if (query.sellerId) {
    params.sellerId = query.sellerId;
  }
  if (typeof query.minPrice === 'number') {
    params.minPrice = String(query.minPrice);
  }
  if (typeof query.maxPrice === 'number') {
    params.maxPrice = String(query.maxPrice);
  }
  if (query.sort && query.sort !== 'newest') {
    params.sort = query.sort;
  }
  if (typeof query.page === 'number') {
    params.page = String(query.page);
  }
  if (typeof query.limit === 'number') {
    params.limit = String(query.limit);
  }

  return params;
};

export const buyerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBuyerHomeData: builder.query<ApiResponse<BuyerHomeData>, void>({
      query: () => '/public/home',
      providesTags: [{ type: 'BuyerProduct', id: 'HOME' }],
    }),

    getPublicStores: builder.query<ApiResponse<BuyerStore[]>, void>({
      query: () => '/public/stores',
      providesTags: [{ type: 'BuyerSellerSummary', id: 'LIST' }],
    }),

    getBuyerProducts: builder.query<ApiResponse<BuyerSearchData>, BuyerProductsQuery | void>({
      query: (query) => ({
        url: '/public/products',
        params: toQueryParams(query ?? {}),
      }),
      providesTags: (result) => {
        if (!result?.data?.products) {
          return [{ type: 'BuyerProduct' as const, id: 'LIST' }];
        }

        return [
          ...result.data.products.map((product) => ({ type: 'BuyerProduct' as const, id: product._id })),
          { type: 'BuyerProduct' as const, id: 'LIST' },
        ];
      },
    }),

    getBuyerProductDetails: builder.query<ApiResponse<BuyerProductDetailsData>, string>({
      query: (id) => `/public/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'BuyerProduct', id }],
    }),

    getAutocompleteSuggestions: builder.query<ApiResponse<BuyerAutocompleteData>, string>({
      query: (q) => ({
        url: '/search/autocomplete',
        params: { q },
      }),
    }),

    getBuyerCart: builder.query<ApiResponse<BuyerCartData>, void>({
      query: () => '/cart',
      providesTags: ['BuyerCart'],
    }),

    addToBuyerCart: builder.mutation<ApiResponse<BuyerCart>, { productId: string; quantity?: number }>({
      query: ({ productId, quantity = 1 }) => ({
        url: '/cart/add',
        method: 'POST',
        body: { productId, quantity },
      }),
      invalidatesTags: ['BuyerCart'],
    }),

    updateBuyerCartQuantity: builder.mutation<ApiResponse<BuyerCart>, { productId: string; quantity: number }>({
      query: ({ productId, quantity }) => ({
        url: '/cart/update',
        method: 'PUT',
        body: { productId, quantity },
      }),
      invalidatesTags: ['BuyerCart'],
    }),

    removeFromBuyerCart: builder.mutation<ApiResponse<BuyerCart>, string>({
      query: (productId) => ({
        url: `/cart/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BuyerCart'],
    }),

    getBuyerWishlist: builder.query<ApiResponse<BuyerWishlist>, void>({
      query: () => '/wishlist',
      providesTags: ['BuyerWishlist'],
    }),

    addToBuyerWishlist: builder.mutation<ApiResponse<BuyerWishlist>, { productId: string }>({
      query: ({ productId }) => ({
        url: '/wishlist/add',
        method: 'POST',
        body: { productId },
      }),
      invalidatesTags: ['BuyerWishlist'],
    }),

    removeFromBuyerWishlist: builder.mutation<ApiResponse<BuyerWishlist>, string>({
      query: (productId) => ({
        url: `/wishlist/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BuyerWishlist'],
    }),

    checkoutBuyerCart: builder.mutation<ApiResponse<BuyerCheckoutResult>, BuyerCheckoutPayload>({
      query: (body) => ({
        url: '/checkout/checkout',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'BuyerOrder', id: 'LIST' }, 'BuyerCart'],
    }),

    processBuyerPaymentWebhook: builder.mutation<BuyerPaymentWebhookResult, BuyerPaymentWebhookPayload>({
      query: (body) => ({
        url: '/checkout/payment-webhook',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        ...arg.orderIds.map((orderId) => ({ type: 'BuyerOrder' as const, id: orderId })),
        { type: 'BuyerOrder' as const, id: 'LIST' },
      ],
    }),

    getBuyerOrders: builder.query<ApiResponse<BuyerOrder[]>, void>({
      query: () => '/buyer/orders',
      providesTags: (result) => {
        if (!result?.data) {
          return [{ type: 'BuyerOrder' as const, id: 'LIST' }];
        }

        return [
          ...result.data.map((order) => ({ type: 'BuyerOrder' as const, id: order._id })),
          { type: 'BuyerOrder' as const, id: 'LIST' },
        ];
      },
    }),

    requestBuyerOrderReturn: builder.mutation<ApiResponse<BuyerOrder>, string>({
      query: (orderId) => ({
        url: `/buyer/orders/${orderId}/return`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, orderId) => [
        { type: 'BuyerOrder', id: orderId },
        { type: 'BuyerOrder', id: 'LIST' },
      ],
    }),

    addBuyerReview: builder.mutation<ApiResponse<BuyerReview>, BuyerReviewPayload>({
      query: ({ productId, rating, comment }) => ({
        url: `/reviews/${productId}`,
        method: 'POST',
        body: { rating, comment },
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'BuyerProduct', id: arg.productId }],
    }),

    sendBuyerSupportMessage: builder.mutation<ApiResponse<BuyerSupportReply>, BuyerSupportPayload>({
      query: (body) => ({
        url: '/support/chat',
        method: 'POST',
        body,
      }),
    }),

    getBuyerProfile: builder.query<ApiResponse<BuyerProfile>, void>({
      query: () => '/buyer/profile',
      providesTags: ['BuyerProfile'],
    }),

    updateBuyerProfile: builder.mutation<ApiResponse<BuyerProfile>, Partial<BuyerProfile>>({
      query: (body) => ({
        url: '/buyer/profile',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['BuyerProfile'],
    }),

    addBuyerAddress: builder.mutation<ApiResponse<BuyerAddress[]>, Partial<BuyerAddress>>({
      query: (body) => ({
        url: '/buyer/addresses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['BuyerProfile'],
    }),

    removeBuyerAddress: builder.mutation<ApiResponse<BuyerAddress[]>, string>({
      query: (id) => ({
        url: `/buyer/addresses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BuyerProfile'],
    }),

    setBuyerDefaultAddress: builder.mutation<ApiResponse<BuyerAddress[]>, string>({
      query: (id) => ({
        url: `/buyer/addresses/${id}/default`,
        method: 'PATCH',
      }),
      invalidatesTags: ['BuyerProfile'],
    }),

    uploadPaymentProof: builder.mutation<ApiResponse<string>, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('image', file);
        return {
          url: '/checkout/upload-proof',
          method: 'POST',
          body: formData,
        };
      },
    }),

    createPaymentIntent: builder.mutation<ApiResponse<{ clientSecret: string }>, void>({
      query: () => ({
        url: '/checkout/create-payment-intent',
        method: 'POST',
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetBuyerHomeDataQuery,
  useGetBuyerProductsQuery,
  useGetBuyerProductDetailsQuery,
  useGetAutocompleteSuggestionsQuery,
  useLazyGetAutocompleteSuggestionsQuery,
  useGetBuyerCartQuery,
  useAddToBuyerCartMutation,
  useUpdateBuyerCartQuantityMutation,
  useRemoveFromBuyerCartMutation,
  useGetBuyerWishlistQuery,
  useAddToBuyerWishlistMutation,
  useRemoveFromBuyerWishlistMutation,
  useCheckoutBuyerCartMutation,
  useProcessBuyerPaymentWebhookMutation,
  useGetBuyerOrdersQuery,
  useRequestBuyerOrderReturnMutation,
  useAddBuyerReviewMutation,
  useSendBuyerSupportMessageMutation,
  useGetBuyerProfileQuery,
  useUpdateBuyerProfileMutation,
  useAddBuyerAddressMutation,
  useRemoveBuyerAddressMutation,
  useSetBuyerDefaultAddressMutation,
  useUploadPaymentProofMutation,
  useCreatePaymentIntentMutation,
  useGetPublicStoresQuery,
} = buyerApi;
