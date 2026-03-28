'use client';

import Link from 'next/link';
import React from 'react';
import { IoCartOutline, IoHeartOutline, IoStar } from 'react-icons/io5';
import type { BuyerProduct } from '@/store/buyerApi';
import {
  formatCurrency,
  getDiscountPercent,
  getEffectivePrice,
  getPrimaryProductImage,
  getStockValue,
} from '@/utils/buyerUtils';

interface BuyerProductCardProps {
  product: BuyerProduct;
  onAddToCart?: (product: BuyerProduct) => void;
  onToggleWishlist?: (product: BuyerProduct) => void;
  wished?: boolean;
  compact?: boolean;
}

const BuyerProductCard = ({
  product,
  onAddToCart,
  onToggleWishlist,
  wished = false,
  compact = false,
}: BuyerProductCardProps) => {
  const effectivePrice = getEffectivePrice(product);
  const discountPercent = getDiscountPercent(product);
  const stock = getStockValue(product);
  const rating = typeof product.rating === 'number' ? product.rating : 0;

  return (
    <article className="group relative overflow-hidden rounded-[2.4rem] border border-zinc-100 bg-white/90 p-4 shadow-[0_18px_42px_-24px_rgba(0,0,0,0.4)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_54px_-26px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-[#D4A5FF]/30 blur-[75px] transition group-hover:bg-[#FFB7CE]/35" />
      <div className="pointer-events-none absolute -bottom-20 -right-16 h-44 w-44 rounded-full bg-[#FFB7CE]/20 blur-[80px]" />

      <div className={`relative overflow-hidden rounded-[1.9rem] ${compact ? 'h-44' : 'h-64'} bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.95),rgba(244,244,245,0.82)_60%,rgba(228,228,231,0.7))]`}>
        <img
          src={getPrimaryProductImage(product)}
          alt={product.productName}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />

        {discountPercent > 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-black px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
            {discountPercent}% Off
          </span>
        ) : null}

        {onToggleWishlist ? (
          <button
            type="button"
            onClick={() => onToggleWishlist(product)}
            className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/60 transition ${
              wished
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-200'
                : 'bg-white/90 text-zinc-600 hover:bg-zinc-900 hover:text-white'
            }`}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <IoHeartOutline className="text-base" />
          </button>
        ) : null}

        <p className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700 shadow-sm">
          {product.category || 'Product'}
        </p>
      </div>

      <div className="relative mt-4 space-y-4 px-1">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/products/${product._id}`}
            className={`line-clamp-2 font-black uppercase italic leading-[0.92] tracking-tight text-zinc-900 transition hover:text-zinc-600 ${compact ? 'text-xl' : 'text-2xl'}`}
          >
            {product.productName}
          </Link>
          <div className="rounded-xl bg-zinc-100 px-2.5 py-1 text-xs font-black text-zinc-600">
            <span className="inline-flex items-center gap-1">
              <IoStar className="text-amber-500" />
              {rating.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-2xl font-black tracking-tight text-zinc-900">{formatCurrency(effectivePrice)}</p>
            {product.discountPrice && product.discountPrice < product.price ? (
              <p className="text-xs font-bold text-zinc-400 line-through">{formatCurrency(product.price)}</p>
            ) : null}
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
              stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {stock > 0 ? `${stock} in stock` : 'Out of stock'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/products/${product._id}`}
            className={`inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 ${
              onAddToCart ? '' : 'col-span-2'
            }`}
          >
            Details
          </Link>

          {onAddToCart ? (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={stock <= 0}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-black px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              <IoCartOutline className="text-sm" />
              Add to Bag
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default BuyerProductCard;
