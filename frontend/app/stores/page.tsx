'use client';

import React, { useMemo, useState } from 'react';
import { IoSearchOutline, IoStorefrontOutline } from 'react-icons/io5';
import {
  useGetPublicStoresQuery,
} from '@/store/buyerApi';
import BuyerErrorState from '@/components/buyer/BuyerErrorState';
import BuyerLoader from '@/components/buyer/BuyerLoader';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import BuyerStoreCard from '@/components/buyer/BuyerStoreCard';
import { normalizeApiError } from '@/utils/buyerUtils';

const StoreListingPage = () => {
  const {
    data: storesResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetPublicStoresQuery();

  const [searchQuery, setSearchQuery] = useState('');

  const stores = storesResponse?.data ?? [];

  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return stores;
    const term = searchQuery.toLowerCase();
    return stores.filter(
      (s) =>
        s.storeName.toLowerCase().includes(term) ||
        (s.storeDescription && s.storeDescription.toLowerCase().includes(term))
    );
  }, [searchQuery, stores]);

  return (
    <BuyerPageShell>
      <section className="relative space-y-12 pb-16 pt-6 animate-fade-in-up">
        {/* Hero Section */}
        <div className="glass relative overflow-hidden rounded-[3rem] p-10 md:p-20 text-center">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-zinc-100/30 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-36 -right-24 h-80 w-80 rounded-full bg-black/[0.03] blur-[110px]" />

          <div className="relative z-10 space-y-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white shadow-2xl shadow-black/20">
              <IoStorefrontOutline className="text-3xl" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-extralight tracking-tight text-zinc-900 sm:text-7xl">
                Boutique <span className="font-thin text-zinc-400">Directory</span>
              </h1>
              
            </div>

            {/* Search Bar */}
            <div className="mx-auto w-full max-w-2xl pt-4">
              <div className="group relative flex items-center transition-all">
                <div className="absolute left-6 text-zinc-400 transition-colors group-focus-within:text-black">
                  <IoSearchOutline className="text-xl" />
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find a specific store..."
                  className="w-full rounded-[2rem] border-none bg-black/[0.03] py-5 pl-14 pr-8 text-sm font-light text-black placeholder:text-zinc-400 transition-all focus:bg-white focus:shadow-2xl focus:outline-none focus:ring-1 focus:ring-zinc-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-[10px] font-light uppercase tracking-widest text-white shadow-xl">
                <span className="h-1 w-1 rounded-full bg-white opacity-40" />
                {stores.length} Registered Brands
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-100 bg-white px-4 py-2 text-[10px] font-light uppercase tracking-widest text-zinc-500 shadow-sm">
                Active Marketplace
              </div>
            </div>
          </div>
        </div>

        {/* Stores Grid */}
        <div className="space-y-8">
          {isLoading ? (
            <BuyerLoader label="Curating boutiques..." />
          ) : isError ? (
            <BuyerErrorState
              message={normalizeApiError(error, 'Unable to load stores.')}
              onRetry={() => { void refetch(); }}
            />
          ) : (
            <>
              {filteredStores.length > 0 ? (
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredStores.map((store, index) => (
                    <BuyerStoreCard
                      key={store._id}
                      store={store}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-zinc-200 bg-white/50 py-20 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-300">
                    <IoStorefrontOutline className="text-3xl" />
                  </div>
                  <h3 className="text-xl font-extralight text-zinc-900">No stores found</h3>
                  <p className="mt-2 text-sm font-light text-zinc-400">Try adjusting your search terms or browsing all categories.</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-6 text-[11px] font-light uppercase tracking-widest text-black underline underline-offset-8 transition-all hover:text-zinc-600"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </BuyerPageShell>
  );
};

export default StoreListingPage;
