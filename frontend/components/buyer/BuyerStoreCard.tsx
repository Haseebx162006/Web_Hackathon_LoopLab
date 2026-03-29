'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { IoStorefrontOutline, IoArrowForwardOutline } from 'react-icons/io5';
import type { BuyerStore } from '@/store/buyerApi';

interface BuyerStoreCardProps {
  store: BuyerStore;
  index: number;
}

const BuyerStoreCard: React.FC<BuyerStoreCardProps> = ({ store, index }) => {
  const storeInitial = store.storeName ? store.storeName.charAt(0).toUpperCase() : 'S';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative h-full"
    >
      <div className="relative h-full overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/30 p-8 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:bg-white/50 hover:shadow-2xl">
        {/* Background Accents */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-black/5 blur-[50px] transition-all group-hover:bg-black/10" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-zinc-100/50 blur-[60px] transition-all group-hover:bg-zinc-200/50" />

        <div className="relative flex flex-col h-full items-center text-center">
          {/* Store Logo/Initial */}
          <div className="relative mb-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white shadow-lg ring-1 ring-zinc-100 transition-transform duration-500 group-hover:scale-110">
              {store.storeLogo ? (
                <img
                  src={store.storeLogo}
                  alt={store.storeName}
                  className="h-full w-full rounded-[2rem] object-cover"
                />
              ) : (
                <span className="text-3xl font-thin text-zinc-900">{storeInitial}</span>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow-lg ring-4 ring-white">
              <IoStorefrontOutline className="text-sm" />
            </div>
          </div>

          {/* Store Info */}
          <div className="mb-8 flex-1">
            <h3 className="mb-3 text-2xl font-extralight tracking-tight text-zinc-900 line-clamp-1">
              {store.storeName}
            </h3>
            <p className="mb-4 text-xs font-light tracking-widest text-zinc-400 uppercase">
              {store.productCount} {store.productCount === 1 ? 'Product' : 'Products'}
            </p>
            {store.storeDescription && (
              <p className="text-sm font-light leading-relaxed text-zinc-500 line-clamp-2 italic px-2">
                "{store.storeDescription}"
              </p>
            )}
          </div>

          {/* Action Link */}
          <Link
            href={`/stores/${store._id}`}
            className="group/btn relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-black px-6 py-4 transition-all hover:bg-zinc-800"
          >
            <span className="text-[11px] font-light uppercase tracking-[0.3em] text-white">Visit Store</span>
            <IoArrowForwardOutline className="text-lg text-white transition-transform duration-300 group-hover/btn:translate-x-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default BuyerStoreCard;
