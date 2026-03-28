'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { IoSearchOutline } from 'react-icons/io5';
import type { RootState } from '@/store/store';
import {
  type BuyerProduct,
  useAddToBuyerCartMutation,
  useAddToBuyerWishlistMutation,
  useGetBuyerHomeDataQuery,
  useGetBuyerProductsQuery,
  useGetBuyerWishlistQuery,
  useLazyGetAutocompleteSuggestionsQuery,
  useRemoveFromBuyerWishlistMutation,
} from '@/store/buyerApi';
import BuyerErrorState from '@/components/buyer/BuyerErrorState';
import BuyerLoader from '@/components/buyer/BuyerLoader';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import BuyerProductCard from '@/components/buyer/BuyerProductCard';
import {
  isBuyerAuthenticated,
  normalizeApiError,
} from '@/utils/buyerUtils';

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
] as const;

const ProductListingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const isBuyer = (role === 'buyer' && isAuthenticated) || isBuyerAuthenticated();

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = (searchParams.get('sort') || 'newest') as 'newest' | 'price_asc' | 'price_desc';
  const page = Number(searchParams.get('page') || '1');

  const [searchInput, setSearchInput] = useState(search);

  const queryArgs = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
      page,
      limit: 12,
    }),
    [category, maxPrice, minPrice, page, search, sort]
  );

  const {
    data: productsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetBuyerProductsQuery(queryArgs);

  const { data: homeResponse } = useGetBuyerHomeDataQuery();
  const categories = homeResponse?.data?.categories ?? [];

  const { data: wishlistResponse } = useGetBuyerWishlistQuery(undefined, { skip: !isBuyer });

  const [triggerAutocomplete, { data: autocompleteResponse }] = useLazyGetAutocompleteSuggestionsQuery();

  const [addToCart] = useAddToBuyerCartMutation();
  const [addToWishlist] = useAddToBuyerWishlistMutation();
  const [removeFromWishlist] = useRemoveFromBuyerWishlistMutation();

  const wishedIds = useMemo(() => {
    const items = wishlistResponse?.data?.items ?? [];
    return new Set(
      items
        .map((item) => (typeof item === 'string' ? item : item._id))
        .filter((id): id is string => Boolean(id))
    );
  }, [wishlistResponse?.data?.items]);

  const products = productsResponse?.data?.products ?? [];
  const pagination = productsResponse?.data?.pagination;

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const term = searchInput.trim();
    if (!term || term.length < 2) {
      return;
    }

    const timeout = setTimeout(() => {
      void triggerAutocomplete(term);
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchInput, triggerAutocomplete]);

  const updateQuery = (updates: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    if (!('page' in updates)) {
      params.set('page', '1');
    }

    const next = params.toString();
    router.push(next ? `/products?${next}` : '/products');
  };

  const askLogin = () => {
    toast.error('Please login as a buyer first.');
    router.push('/login');
  };

  const handleAddToCart = async (product: BuyerProduct) => {
    if (!isBuyer) {
      askLogin();
      return;
    }

    try {
      await addToCart({ productId: product._id, quantity: 1 }).unwrap();
      toast.success(`${product.productName} added to cart.`);
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to add product to cart.'));
    }
  };

  const handleToggleWishlist = async (product: BuyerProduct) => {
    if (!isBuyer) {
      askLogin();
      return;
    }

    try {
      if (wishedIds.has(product._id)) {
        await removeFromWishlist(product._id).unwrap();
        toast.success('Removed from wishlist.');
      } else {
        await addToWishlist({ productId: product._id }).unwrap();
        toast.success('Added to wishlist.');
      }
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to update wishlist.'));
    }
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateQuery({ search: searchInput.trim() || null });
  };

  return (
    <BuyerPageShell>
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-zinc-100 bg-white/85 p-5 shadow-[0_14px_35px_-22px_rgba(0,0,0,0.25)] md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Marketplace Catalog</p>
              <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">Product Listing</h1>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xl">
              <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2">
                <IoSearchOutline className="text-lg text-zinc-400" />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by product name or category"
                  className="w-full border-0 bg-transparent text-sm font-medium text-zinc-700 outline-none placeholder:text-zinc-400"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-black px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
                >
                  Search
                </button>
              </div>

              {searchInput.trim().length >= 2 && autocompleteResponse?.data?.products?.length ? (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                  {autocompleteResponse.data.products.slice(0, 6).map((item) => (
                    <button
                      key={`${item.productName}-${item.category}`}
                      type="button"
                      onClick={() => {
                        setSearchInput(item.productName);
                        updateQuery({ search: item.productName, category: item.category || null });
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-zinc-100"
                    >
                      <span className="text-sm font-semibold text-zinc-700">{item.productName}</span>
                      <span className="text-xs font-black uppercase tracking-[0.1em] text-zinc-400">{item.category || 'Product'}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </form>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <select
              value={sort}
              onChange={(event) => updateQuery({ sort: event.target.value })}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              value={minPrice}
              onChange={(event) => updateQuery({ minPrice: event.target.value || null })}
              placeholder="Min price"
              inputMode="numeric"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none"
            />
            <input
              value={maxPrice}
              onChange={(event) => updateQuery({ maxPrice: event.target.value || null })}
              placeholder="Max price"
              inputMode="numeric"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                router.push('/products');
              }}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
            >
              Clear filters
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((categoryValue) => (
              <button
                key={categoryValue}
                type="button"
                onClick={() => updateQuery({ category: categoryValue })}
                className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] transition ${
                  category === categoryValue
                    ? 'bg-black text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                {categoryValue}
              </button>
            ))}
          </div>
        </div>

        {isLoading || isFetching ? <BuyerLoader label="Loading products..." /> : null}

        {isError ? (
          <BuyerErrorState
            message={normalizeApiError(error, 'Unable to load products.')}
            onRetry={() => {
              void refetch();
            }}
          />
        ) : null}

        {!isLoading && !isError ? (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {products.map((product) => (
                <BuyerProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  wished={wishedIds.has(product._id)}
                />
              ))}
            </div>

            {products.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-white/70 p-8 text-center">
                <p className="text-sm font-semibold text-zinc-500">No products match your filters.</p>
              </div>
            ) : null}

            {pagination && pagination.pages > 1 ? (
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQuery({ page: Math.max(1, pagination.page - 1) })}
                  disabled={pagination.page <= 1}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-black uppercase tracking-[0.15em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="rounded-xl bg-zinc-100 px-3 py-2 text-xs font-black uppercase tracking-[0.15em] text-zinc-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuery({ page: Math.min(pagination.pages, pagination.page + 1) })}
                  disabled={pagination.page >= pagination.pages}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-black uppercase tracking-[0.15em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </BuyerPageShell>
  );
};

export default ProductListingPage;
