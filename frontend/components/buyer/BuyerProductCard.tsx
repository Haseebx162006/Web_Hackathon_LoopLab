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
    <article className="group relative overflow-hidden rounded-[2rem] border border-zinc-100 bg-white/80 p-4 shadow-[0_14px_35px_-18px_rgba(0,0,0,0.25)] transition hover:-translate-y-1 hover:shadow-[0_22px_45px_-22px_rgba(0,0,0,0.35)]">
      <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full bg-brand-pink/20 blur-3xl transition group-hover:bg-brand-purple/25" />

      <div className={`relative overflow-hidden rounded-[1.5rem] bg-zinc-50 ${compact ? 'h-40' : 'h-52'}`}>
        <img
          src={getPrimaryProductImage(product)}
          alt={product.productName}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

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
      </div>

      <div className="relative mt-4 space-y-3">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">{product.category || 'Uncategorized'}</p>
          <Link href={`/products/${product._id}`} className="line-clamp-2 text-lg font-black leading-tight tracking-tight text-zinc-900 transition hover:text-zinc-600">
            {product.productName}
          </Link>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-lg font-black tracking-tight text-zinc-900">{formatCurrency(effectivePrice)}</p>
            {product.discountPrice && product.discountPrice < product.price ? (
              <p className="text-xs font-bold text-zinc-400 line-through">{formatCurrency(product.price)}</p>
            ) : null}
          </div>
          <div className="rounded-xl bg-zinc-100 px-2.5 py-1 text-xs font-black text-zinc-600">
            <span className="inline-flex items-center gap-1">
              <IoStar className="text-amber-500" />
              {rating.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
              stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {stock > 0 ? `${stock} in stock` : 'Out of stock'}
          </span>

          {onAddToCart ? (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={stock <= 0}
              className="inline-flex items-center gap-1 rounded-xl bg-black px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              <IoCartOutline className="text-sm" />
              Add
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default BuyerProductCard;
