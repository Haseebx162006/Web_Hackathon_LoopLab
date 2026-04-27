'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
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

const ProductListingPageContent = () => {
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
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);

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
  const totalProducts = pagination?.total ?? products.length;
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (search) count += 1;
    if (category) count += 1;
    if (minPrice) count += 1;
    if (maxPrice) count += 1;
    if (sort !== 'newest') count += 1;

    return count;
  }, [category, maxPrice, minPrice, search, sort]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    setMinPriceInput(minPrice);
    setMaxPriceInput(maxPrice);
  }, [maxPrice, minPrice]);

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

  const handleApplyPrice = () => {
    const min = minPriceInput.trim();
    const max = maxPriceInput.trim();
    
    // Validate that inputs are numbers
    if (min && isNaN(Number(min))) {
      toast.error('Minimum price must be a valid number');
      return;
    }
    if (max && isNaN(Number(max))) {
      toast.error('Maximum price must be a valid number');
      return;
    }
    
    // Validate that min is not greater than max
    if (min && max && Number(min) > Number(max)) {
      toast.error('Minimum price cannot be greater than maximum price');
      return;
    }
    
    updateQuery({
      minPrice: min || null,
      maxPrice: max || null,
    });
  };
  const blobColors = ['#FF70A1', '#D4A5FF', '#FFB7CE', '#70D6FF', '#FFD670', '#A5FFD6'];
  const getBlobColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return blobColors[Math.abs(hash) % blobColors.length];
  };

  return (
    <BuyerPageShell>
      <section className="relative space-y-10 pb-16 pt-6 animate-fade-in-up">
        <div className="glass relative overflow-hidden rounded-[2.5rem] p-7 md:p-14">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#FFB7CE]/30 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-[#D4A5FF]/35 blur-[100px]" />

          <div className="relative z-10 flex flex-col items-center justify-center space-y-8 text-center">
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-2xl">
              <div className="group relative flex items-center transition-all">
                <div className="absolute left-5 text-zinc-400 transition-colors group-focus-within:text-black">
                  <IoSearchOutline className="text-xl" />
                </div>
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search for items..."
                  className="w-full rounded-2xl border-none bg-black/[0.03] py-4 pl-14 pr-32 text-sm font-semibold text-black placeholder:text-zinc-400 transition-all focus:bg-white focus:shadow-xl focus:outline-none focus:ring-0"
                />
                <button
                  type="submit"
                  className="absolute right-2 rounded-xl bg-black px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-white transition-all hover:bg-zinc-800 active:scale-95"
                >
                  Search
                </button>
              </div>
              
              {searchInput.trim().length >= 2 && autocompleteResponse?.data?.products?.length ? (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-2xl border border-zinc-200 bg-white p-2 text-left shadow-xl">
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

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <div className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-zinc-200">
                <span className="h-1 w-1 rounded-full bg-white opacity-50" />
                {totalProducts} products
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-100 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-500 shadow-sm">
                {activeFilterCount} active filters
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-100 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-500 shadow-sm">
                {category ? category : 'All categories'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
          <aside className="glass h-fit rounded-[2rem] p-5 xl:sticky xl:top-28">
            <div className="space-y-3">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Filter Deck</p>
                <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-900">Tune Feed</h2>
              </div>
              <p className="text-xs font-semibold leading-relaxed text-zinc-500">Refine by category, price, and sorting.</p>
            </div>

            <div className="mt-5 space-y-3">
              <select
                value={sort}
                onChange={(event) => updateQuery({ sort: event.target.value })}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <input
                  value={minPriceInput}
                  onChange={(event) => setMinPriceInput(event.target.value)}
                  placeholder="Min"
                  inputMode="numeric"
                  className="rounded-xl border border-zinc-100 bg-white/50 px-3 py-2.5 text-sm font-bold text-zinc-700 outline-none transition focus:border-black"
                />
                <input
                  value={maxPriceInput}
                  onChange={(event) => setMaxPriceInput(event.target.value)}
                  placeholder="Max"
                  inputMode="numeric"
                  className="rounded-xl border border-zinc-100 bg-white/50 px-3 py-2.5 text-sm font-bold text-zinc-700 outline-none transition focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleApplyPrice}
                  className="rounded-xl bg-black px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setMinPriceInput('');
                    setMaxPriceInput('');
                    router.push('/products');
                  }}
                  className="rounded-xl border border-transparent bg-zinc-100 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Categories</p>
              <div className="mt-3 flex max-h-64 flex-wrap gap-2 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => updateQuery({ category: null })}
                  className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                    category === ''
                      ? 'bg-black text-white shadow-lg shadow-black/20'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-black hover:text-white'
                  }`}
                >
                  All
                </button>
                {categories.map((categoryValue) => (
                  <button
                    key={categoryValue}
                    type="button"
                    onClick={() => updateQuery({ category: categoryValue })}
                    className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                      category === categoryValue
                        ? 'bg-black text-white shadow-lg shadow-black/20'
                        : 'bg-zinc-100 text-zinc-500 hover:bg-black hover:text-white'
                    }`}
                  >
                    {categoryValue}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div id="products-catalog" className="space-y-6">
            {isLoading ? <BuyerLoader label="Loading products..." /> : null}

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
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                  {products.map((product) => (
                    <BuyerProductCard
                      key={product._id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onToggleWishlist={handleToggleWishlist}
                      wished={wishedIds.has(product._id)}
                      blobColor={getBlobColor(product._id)}
                    />
                  ))}
                </div>

                {products.length === 0 ? (
                  <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-white/70 p-8 text-center">
                    <p className="text-sm font-semibold text-zinc-500">No products match your filters.</p>
                  </div>
                ) : null}

                {pagination && pagination.pages > 1 ? (
                  <div className="flex flex-col items-center gap-6 pt-12">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQuery({ page: Math.max(1, pagination.page - 1) })}
                        disabled={pagination.page <= 1}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-100 transition hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-zinc-900"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <div className="flex items-center gap-1 rounded-[1.4rem] bg-white/50 p-1 backdrop-blur-sm ring-1 ring-zinc-100">
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                          .filter(p => {
                            if (pagination.pages <= 5) return true;
                            if (p === 1 || p === pagination.pages) return true;
                            return Math.abs(p - pagination.page) <= 1;
                          })
                          .map((p, index, array) => (
                            <React.Fragment key={p}>
                              {index > 0 && array[index - 1] !== p - 1 ? (
                                <span className="px-2 font-black text-zinc-300">...</span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => updateQuery({ page: p })}
                                className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black transition-all ${
                                  pagination.page === p
                                    ? 'bg-black text-white shadow-lg'
                                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                                }`}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => updateQuery({ page: Math.min(pagination.pages, pagination.page + 1) })}
                        disabled={pagination.page >= pagination.pages}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-100 transition hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-zinc-900"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                      Showing Page {pagination.page} of {pagination.pages}
                    </p>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </section>
    </BuyerPageShell>
  );
};

const ProductListingPageFallback = () => (
  <BuyerPageShell>
    <BuyerLoader label="Loading products..." />
  </BuyerPageShell>
);

const ProductListingPage = () => (
  <Suspense fallback={<ProductListingPageFallback />}>
    <ProductListingPageContent />
  </Suspense>
);

export default ProductListingPage;
