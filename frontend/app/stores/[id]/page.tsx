'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { IoArrowBack, IoStorefront } from 'react-icons/io5';
import type { RootState } from '@/store/store';
import {
  useGetBuyerProductsQuery,
  useGetBuyerWishlistQuery,
} from '@/store/buyerApi';
import BuyerErrorState from '@/components/buyer/BuyerErrorState';
import BuyerLoader from '@/components/buyer/BuyerLoader';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import BuyerProductCard from '@/components/buyer/BuyerProductCard';
import { isBuyerAuthenticated, normalizeApiError } from '@/utils/buyerUtils';

const StorePage = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sellerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const page = Number(searchParams.get('page') || '1');

  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isBuyer = (role === 'buyer' && isAuthenticated) || isBuyerAuthenticated();

  const queryArgs = useMemo(
    () => ({
      sellerId,
      page,
      limit: 12,
      sort: 'newest' as const,
    }),
    [sellerId, page]
  );

  const {
    data: productsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetBuyerProductsQuery(queryArgs, { skip: !sellerId });

  const { data: wishlistResponse } = useGetBuyerWishlistQuery(undefined, { skip: !isBuyer });

  const products = productsResponse?.data?.products ?? [];
  const pagination = productsResponse?.data?.pagination;

  const storeInfo = useMemo(() => {
    if (products.length > 0 && typeof products[0].sellerId === 'object') {
      return products[0].sellerId as any;
    }
    return null;
  }, [products]);

  const wishedIds = useMemo(() => {
    const items = wishlistResponse?.data?.items ?? [];
    return new Set(
      items
        .map((item) => (typeof item === 'string' ? item : item._id))
        .filter((id): id is string => Boolean(id))
    );
  }, [wishlistResponse?.data?.items]);

  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(searchParams.toString());
    current.set('page', String(newPage));
    router.push(`/stores/${sellerId}?${current.toString()}`);
  };

  if (isLoading) {
    return (
      <BuyerPageShell>
        <BuyerLoader label="Opening Store..." />
      </BuyerPageShell>
    );
  }

  if (isError) {
    return (
      <BuyerPageShell>
        <BuyerErrorState
          message={normalizeApiError(error, 'Unable to load store products.')}
          onRetry={() => refetch()}
        />
      </BuyerPageShell>
    );
  }

  return (
    <BuyerPageShell>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        {/* Navigation & Header */}
        <div className="mb-12 space-y-8">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 transition hover:text-black"
          >
            <IoArrowBack className="transition-transform group-hover:-translate-x-1" />
            Back to Discovery
          </button>

          <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-end">
            <div className="flex items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[2rem] bg-zinc-50 border border-zinc-100 shadow-xl shadow-zinc-100/50">
                {storeInfo?.storeLogo ? (
                  <img
                    src={storeInfo.storeLogo}
                    alt="Store Logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <IoStorefront className="text-4xl text-zinc-200" />
                )}
              </div>
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                  <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                  Verified Brand Boutique
                </span>
                <h1 className="text-4xl font-black uppercase tracking-tighter text-zinc-900 sm:text-6xl">
                  {storeInfo?.storeName || 'Official Store'}
                </h1>
                <p className="text-sm font-semibold text-zinc-400">
                  Discover the complete collection of high-end artifacts.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 md:items-end">
              <span className="text-3xl font-black tracking-tighter text-zinc-900">
                {pagination?.total || 0}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                Premium Creations
              </span>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="space-y-16">
            <div className={`grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-opacity duration-300 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
              {products.map((product) => (
                <BuyerProductCard
                  key={product._id}
                  product={product}
                  wished={wishedIds.has(product._id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4 border-t border-zinc-100 pt-12">
                <button
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="rounded-xl border border-zinc-200 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-900 transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Previous
                </button>
                <div className="flex h-10 items-center gap-2 px-4">
                  {[...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`h-2 w-2 rounded-full transition-all duration-300 ${
                        page === i + 1 ? 'w-8 bg-black' : 'bg-zinc-200 hover:bg-zinc-400'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => handlePageChange(Math.min(pagination.pages, page + 1))}
                  disabled={page >= pagination.pages}
                  className="rounded-xl border border-zinc-200 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-900 transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-zinc-200 bg-zinc-50/30 py-32 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-zinc-100">
              <IoStorefront className="text-3xl text-zinc-200" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Boutique is Empty</h2>
            <p className="mt-2 text-sm font-semibold text-zinc-400">This store hasn't released any products yet.</p>
          </div>
        )}
      </div>
    </BuyerPageShell>
  );
};

export default StorePage;
