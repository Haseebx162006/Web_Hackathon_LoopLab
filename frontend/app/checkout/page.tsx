'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import type { RootState } from '@/store/store';
import { useCheckoutBuyerCartMutation, useGetBuyerCartQuery } from '@/store/buyerApi';
import BuyerAuthGate from '@/components/buyer/BuyerAuthGate';
import BuyerEmptyState from '@/components/buyer/BuyerEmptyState';
import BuyerErrorState from '@/components/buyer/BuyerErrorState';
import BuyerLoader from '@/components/buyer/BuyerLoader';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import { formatCurrency, isBuyerAuthenticated, normalizeApiError } from '@/utils/buyerUtils';

const CheckoutPage = () => {
  const router = useRouter();
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isBuyer = (role === 'buyer' && isAuthenticated) || isBuyerAuthenticated();

  const {
    data: cartResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetBuyerCartQuery(undefined, { skip: !isBuyer });

  const [checkoutCart, { isLoading: placingOrder }] = useCheckoutBuyerCartMutation();

  const [formValues, setFormValues] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    paymentMethod: 'card' as 'cod' | 'card' | 'wallet',
  });

  const subtotal = cartResponse?.data?.subtotal ?? 0;

  const validItemCount = useMemo(
    () => (cartResponse?.data?.cart?.items ?? []).filter((item) => item.product).length,
    [cartResponse?.data?.cart?.items]
  );

  const estimatedShipping = subtotal > 120 ? 0 : 9.99;
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + estimatedShipping + tax;

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (validItemCount === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    try {
      const response = await checkoutCart({
        shippingAddress: {
          street: formValues.street,
          city: formValues.city,
          state: formValues.state,
          country: formValues.country,
          zipCode: formValues.zipCode,
        },
        paymentMethod: formValues.paymentMethod,
      }).unwrap();

      const orderIds = response.data.orders || [];
      sessionStorage.setItem('lastOrderIds', JSON.stringify(orderIds));

      if (formValues.paymentMethod === 'cod') {
        router.push(`/order-confirmation?orders=${encodeURIComponent(orderIds.join(','))}&payment=cod`);
      } else {
        router.push(`/payment?orders=${encodeURIComponent(orderIds.join(','))}&method=${formValues.paymentMethod}`);
      }
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to place order.'));
    }
  };

  return (
    <BuyerPageShell>
      {!isBuyer ? (
        <BuyerAuthGate title="Checkout is for buyers" description="Login with your buyer account to place an order." />
      ) : (
        <section className="space-y-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-zinc-400">Checkout</p>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">Shipping and Payment</h1>
          </div>

          {isLoading ? <BuyerLoader label="Loading checkout..." /> : null}

          {isError ? (
            <BuyerErrorState
              message={normalizeApiError(error, 'Unable to load checkout data.')}
              onRetry={() => {
                void refetch();
              }}
            />
          ) : null}

          {!isLoading && !isError && validItemCount === 0 ? (
            <BuyerEmptyState
              title="No items to checkout"
              description="Add products to cart before checkout."
              actionLabel="Go to products"
              actionHref="/products"
            />
          ) : null}

          {!isLoading && !isError && validItemCount > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
              <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-zinc-100 bg-white/85 p-5 shadow-[0_14px_35px_-22px_rgba(0,0,0,0.25)]">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Shipping Address</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    name="street"
                    value={formValues.street}
                    onChange={handleInputChange}
                    required
                    placeholder="Street"
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none"
                  />
                  <input
                    name="city"
                    value={formValues.city}
                    onChange={handleInputChange}
                    required
                    placeholder="City"
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none"
                  />
                  <input
                    name="state"
                    value={formValues.state}
                    onChange={handleInputChange}
                    required
                    placeholder="State"
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none"
                  />
                  <input
                    name="country"
                    value={formValues.country}
                    onChange={handleInputChange}
                    required
                    placeholder="Country"
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none"
                  />
                  <input
                    name="zipCode"
                    value={formValues.zipCode}
                    onChange={handleInputChange}
                    required
                    placeholder="Zip code"
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none sm:col-span-2"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Payment Method</p>
                  <select
                    name="paymentMethod"
                    value={formValues.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none"
                  >
                    <option value="card">Card</option>
                    <option value="wallet">Wallet</option>
                    <option value="cod">Cash on delivery</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={placingOrder}
                  className="rounded-xl bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  {placingOrder ? 'Placing order...' : 'Place order'}
                </button>
              </form>

              <aside className="h-fit rounded-[2rem] border border-zinc-100 bg-white/85 p-5 shadow-[0_14px_35px_-22px_rgba(0,0,0,0.25)]">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Order Summary</p>
                <div className="mt-4 space-y-3 text-sm font-semibold text-zinc-600">
                  <div className="flex items-center justify-between">
                    <span>Items</span>
                    <span>{validItemCount}</span>
                  </div>
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
              </aside>
            </div>
          ) : null}
        </section>
      )}
    </BuyerPageShell>
  );
};

export default CheckoutPage;
