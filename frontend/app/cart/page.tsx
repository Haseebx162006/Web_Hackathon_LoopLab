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
        <section className="space-y-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-zinc-400">Checkout Journey</p>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">Shopping Cart</h1>
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4 rounded-[2rem] border border-zinc-100 bg-white/85 p-5 shadow-[0_14px_35px_-22px_rgba(0,0,0,0.25)]">
                {visibleItems.map((item) => {
                  const product = resolveProduct(item.product);
                  const productId = resolveProductId(item.product);
                  if (!product || !productId) {
                    return null;
                  }

                  return (
                    <article key={item._id || productId} className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 sm:flex-row sm:items-center">
                      <img
                        src={getPrimaryProductImage(product)}
                        alt={product.productName}
                        className="h-24 w-24 rounded-xl object-cover"
                      />

                      <div className="min-w-0 flex-1 space-y-1">
                        <h2 className="truncate text-lg font-black tracking-tight text-zinc-900">{product.productName}</h2>
                        <p className="text-xs font-black uppercase tracking-[0.15em] text-zinc-400">{product.category || 'Product'}</p>
                        <p className="text-sm font-bold text-zinc-600">{formatCurrency(getEffectivePrice(product))}</p>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                        <BuyerQuantityControl
                          value={item.quantity}
                          min={1}
                          max={Math.max(1, getStockValue(product))}
                          disabled={updatingQuantity}
                          onChange={(next) => {
                            void handleQuantityChange(productId, next);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            void handleRemove(productId);
                          }}
                          disabled={removingItem}
                          className="text-xs font-black uppercase tracking-[0.15em] text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <aside className="h-fit rounded-[2rem] border border-zinc-100 bg-white/85 p-5 shadow-[0_14px_35px_-22px_rgba(0,0,0,0.25)]">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Order Summary</p>
                <div className="mt-4 space-y-3 text-sm font-semibold text-zinc-600">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span>{estimatedShipping === 0 ? 'Free' : formatCurrency(estimatedShipping)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tax</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="border-t border-zinc-100 pt-3 text-base font-black text-zinc-900">
                    <div className="flex items-center justify-between">
                      <span>Total</span>
                      <span>{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <Link
                    href="/checkout"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
                  >
                    Proceed to checkout
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
                  >
                    Continue shopping
                  </Link>
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
