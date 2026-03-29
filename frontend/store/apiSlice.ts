import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getApiBaseUrl } from '@/utils/apiConfig';

export type UserRole = 'buyer' | 'seller' | 'admin';

export interface AuthUser {
  _id?: string;
  name?: string;
  storeName?: string;
  email?: string;
}

export interface AuthResponse {
  success?: boolean;
  token: string;
  role: UserRole;
  _id?: string;
  name?: string;
  storeName?: string;
  email?: string;
}

export interface SignupRequest {
  role: 'buyer' | 'seller';
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
  storeName?: string;
  ownerName?: string;
  phoneNumber?: string;
  businessAddress?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SellerLoginRequest {
  emailOrPhone: string;
  password: string;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  tagTypes: [
    'SellerDashboard',
    'SellerProduct',
    'SellerInventory',
    'SellerOrder',
    'SellerCoupon',
    'SellerAnalytics',
    'SellerProfile',
    'BuyerProduct',
    'BuyerSellerSummary',
    'BuyerCart',
    'BuyerWishlist',
    'BuyerOrder',
    'AdminDashboard',
    'AdminUser',
    'AdminProduct',
    'AdminOrder',
    'AdminPayment',
    'AdminAnalytics',
    'ChatConversation',
    'ChatMessage',
    'BuyerProfile',
  ],
  baseQuery: fetchBaseQuery({
    baseUrl: getApiBaseUrl(),
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as { auth?: { token?: string | null } };
      const tokenFromState = state.auth?.token;
      const tokenFromStorage = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const token = tokenFromState || tokenFromStorage;

      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    signup: builder.mutation<AuthResponse, SignupRequest>({
      query: (userData) => ({
        url: '/auth/signup',
        method: 'POST',
        body: userData,
      }),
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    sellerLogin: builder.mutation<AuthResponse, SellerLoginRequest>({
      query: (credentials) => ({
        url: '/auth/seller-login',
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
});

export const { useSignupMutation, useLoginMutation, useSellerLoginMutation } = apiSlice;
