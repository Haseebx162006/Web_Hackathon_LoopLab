'use client';

import Link from 'next/link';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import type { RootState } from '@/store/store';
import {
  type BuyerProduct,
  useGetBuyerCartQuery,
  useRemoveFromBuyerCartMutation,
  useUpdateBuyerCartQuantityMutation,
} from '@/store/buyerApi';
import BuyerAuthGate from '@/components/buyer/BuyerAuthGate';
import BuyerEmptyState from '@/components/buyer/BuyerEmptyState';
import BuyerErrorState from '@/components/buyer/BuyerErrorState';
import BuyerLoader from '@/components/buyer/BuyerLoader';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import BuyerQuantityControl from '@/components/buyer/BuyerQuantityControl';
import {
  formatCurrency,
  getEffectivePrice,
  getPrimaryProductImage,
  getStockValue,
  isBuyerAuthenticated,
  normalizeApiError,
} from '@/utils/buyerUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { IoBagHandleOutline, IoTrashOutline, IoChevronBackOutline } from 'react-icons/io5';

const CartPage = () => {
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isBuyer = (role === 'buyer' && isAuthenticated) || isBuyerAuthenticated();

  const {
    data: cartResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetBuyerCartQuery(undefined, { skip: !isBuyer });

  const [updateQuantity, { isLoading: updatingQuantity }] = useUpdateBuyerCartQuantityMutation();
  const [removeFromCart, { isLoading: removingItem }] = useRemoveFromBuyerCartMutation();

  const subtotal = cartResponse?.data?.subtotal ?? 0;

  const visibleItems = useMemo(() => {
    return (cartResponse?.data?.cart?.items ?? []).filter((item) => item.product);
  }, [cartResponse?.data?.cart?.items]);

  const estimatedShipping = subtotal > 120 ? 0 : 9.99;
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + estimatedShipping + tax;

  const resolveProduct = (product: BuyerProduct | string | null) => {
    if (!product || typeof product === 'string') {
      return null;
    }
    return product;
  };

  const resolveProductId = (product: BuyerProduct | string | null) => {
    if (!product) {
      return null;
    }
    if (typeof product === 'string') {
      return product;
    }
    return product._id;
  };

  const handleQuantityChange = async (productId: string, quantity: number) => {
    try {
      await updateQuantity({ productId, quantity }).unwrap();
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to update cart quantity.'));
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await removeFromCart(productId).unwrap();
      toast.success('Item removed from cart.');
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to remove cart item.'));
    }
  };

  return (
    <BuyerPageShell>
      {!isBuyer ? (
        <BuyerAuthGate title="Cart is for buyers" description="Login with a buyer account to add products to cart." />
      ) : (
        <section className="space-y-12">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-100 pb-10">
            <div>
               <motion.div 
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="flex items-center gap-2 mb-4"
               >
                  <span className="h-px w-8 bg-zinc-300"></span>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Curated Collection</p>
               </motion.div>
               <h1 className="text-5xl font-thin tracking-tight text-zinc-900 sm:text-7xl lg:text-8xl">
                 Your <span className="text-zinc-400">Boutique</span> Cart
               </h1>
            </div>
            <Link 
              href="/products" 
              className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] hover:text-zinc-500 transition-colors"
            >
              <IoChevronBackOutline className="group-hover:-translate-x-1 transition-transform" />
              Continue Selection
            </Link>
          </div>

          {isLoading ? <BuyerLoader label="Loading cart..." /> : null}

          {isError ? (
            <BuyerErrorState
              message={normalizeApiError(error, 'Unable to load cart.')}
              onRetry={() => {
                void refetch();
              }}
            />
          ) : null}

          {!isLoading && !isError && visibleItems.length === 0 ? (
            <BuyerEmptyState
              title="Your cart is empty"
              description="Browse products and add your favorites to start checkout."
              actionLabel="Explore products"
              actionHref="/products"
            />
          ) : null}

          {!isLoading && !isError && visibleItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_400px]">
              {/* Item List */}
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {visibleItems.map((item, idx) => {
                    const product = resolveProduct(item.product);
                    const productId = resolveProductId(item.product);
                    if (!product || !productId) return null;

                    return (
                      <motion.article
                        key={item._id || productId}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group relative flex flex-col gap-6 rounded-[2.5rem] border border-zinc-100/50 bg-white/40 p-6 backdrop-blur-2xl transition-all hover:bg-white/60 sm:flex-row sm:items-center"
                      >
                        <div className="relative aspect-square h-32 w-32 shrink-0 overflow-hidden rounded-3xl bg-zinc-100 ring-1 ring-black/5">
                          <img
                            src={getPrimaryProductImage(product)}
                            alt={product.productName}
                            className="h-full w-full object-cover grayscale-[0.5] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110"
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                             <span className="h-1 w-1 bg-zinc-300 rounded-full"></span>
                             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">{product.category || 'Collection'}</p>
                          </div>
                          <h2 className="truncate text-2xl font-thin tracking-tight text-zinc-900 uppercase">{product.productName}</h2>
                          <p className="text-lg font-bold text-zinc-900">{formatCurrency(getEffectivePrice(product))}</p>
                        </div>

                        <div className="flex items-center justify-between gap-6 sm:flex-col sm:items-end">
                          <BuyerQuantityControl
                            value={item.quantity}
                            min={1}
                            max={Math.max(1, getStockValue(product))}
                            disabled={updatingQuantity}
                            onChange={(next) => void handleQuantityChange(productId, next)}
                          />
                          <button
                            type="button"
                            onClick={() => void handleRemove(productId)}
                            disabled={removingItem}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 transition hover:text-rose-600 disabled:opacity-50"
                          >
                            <IoTrashOutline className="text-sm" />
                            Remove
                          </button>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Summary Sidebar */}
              <aside className="sticky top-24 h-fit space-y-8 rounded-[3rem] border border-zinc-100/50 bg-white/40 p-8 backdrop-blur-3xl shadow-[0_40px_80px_-40px_rgba(0,0,0,0.1)]">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Order Summary</p>
                  <div className="h-px w-12 bg-zinc-200"></div>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                    <span>Selection Subtotal</span>
                    <span className="text-zinc-900">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                    <span>Shipping <span className="text-[8px] opacity-40 ml-1">Curated Logistics</span></span>
                    <span className={estimatedShipping === 0 ? "text-emerald-500" : "text-zinc-900"}>
                      {estimatedShipping === 0 ? 'COMPLIMENTARY' : formatCurrency(estimatedShipping)}
                    </span>
                  </div>

                  {estimatedShipping > 0 && (
                    <div className="space-y-2">
                      <div className="h-0.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black transition-all duration-700" 
                          style={{ width: `${Math.min(100, (subtotal / 120) * 100)}%` }} 
                        />
                      </div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">
                        Add {formatCurrency(120 - subtotal)} more for complimentary shipping
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                    <span>Tax Estimate</span>
                    <span className="text-zinc-900">{formatCurrency(tax)}</span>
                  </div>

                  <div className="border-t border-zinc-100 pt-6">
                    <div className="flex items-end justify-between">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Total Valuation</span>
                      <span className="text-4xl font-thin tracking-tighter text-zinc-900">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-4">
                  <Link
                    href="/checkout"
                    className="flex w-full items-center justify-center rounded-2xl bg-black px-6 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all hover:bg-zinc-800 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Proceed to Checkout
                  </Link>
                  <p className="text-center text-[8px] font-bold uppercase tracking-widest text-zinc-400">
                    Secure 256-bit Encrypted Transaction
                  </p>
                </div>
              </aside>
            </div>
          ) : null}
        </section>
      )}
    </BuyerPageShell>
  );
};

export default CartPage;
