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
import { motion } from 'framer-motion';
import { IoShieldCheckmarkOutline, IoLocationOutline, IoCardOutline, IoChevronBackOutline } from 'react-icons/io5';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';

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
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Final Verification</p>
               </motion.div>
               <h1 className="text-5xl font-thin tracking-tight text-zinc-900 sm:text-7xl lg:text-8xl">
                 Secure <span className="text-zinc-400">Checkout</span>
               </h1>
            </div>
            <Link
              href="/cart" 
              className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] hover:text-zinc-500 transition-colors"
            >
              <IoChevronBackOutline className="group-hover:-translate-x-1 transition-transform" />
              Return to Cart
            </Link>
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
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_400px]">
              <motion.form 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit} 
                className="space-y-10 rounded-[3rem] border border-zinc-100/50 bg-white/40 p-8 md:p-12 backdrop-blur-2xl shadow-[0_40px_80px_-40px_rgba(0,0,0,0.1)]"
              >
                {/* Shipping Identity Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white">
                      <IoLocationOutline className="text-sm" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900">Shipping Identity</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Street Address</label>
                      <input
                        name="street"
                        value={formValues.street}
                        onChange={handleInputChange}
                        required
                        placeholder="House No, Street Name"
                        className="w-full rounded-2xl border border-zinc-100 bg-white/50 px-5 py-4 text-sm font-semibold text-zinc-700 outline-none transition-all focus:border-zinc-900 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">City</label>
                      <input
                        name="city"
                        value={formValues.city}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. New York"
                        className="w-full rounded-2xl border border-zinc-100 bg-white/50 px-5 py-4 text-sm font-semibold text-zinc-700 outline-none transition-all focus:border-zinc-900 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">State / Province</label>
                      <input
                        name="state"
                        value={formValues.state}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. NY"
                        className="w-full rounded-2xl border border-zinc-100 bg-white/50 px-5 py-4 text-sm font-semibold text-zinc-700 outline-none transition-all focus:border-zinc-900 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Country</label>
                      <input
                        name="country"
                        value={formValues.country}
                        onChange={handleInputChange}
                        required
                        placeholder="United States"
                        className="w-full rounded-2xl border border-zinc-100 bg-white/50 px-5 py-4 text-sm font-semibold text-zinc-700 outline-none transition-all focus:border-zinc-900 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Postal Code</label>
                      <input
                        name="zipCode"
                        value={formValues.zipCode}
                        onChange={handleInputChange}
                        required
                        placeholder="10001"
                        className="w-full rounded-2xl border border-zinc-100 bg-white/50 px-5 py-4 text-sm font-semibold text-zinc-700 outline-none transition-all focus:border-zinc-900 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Selection Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white">
                      <IoCardOutline className="text-sm" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900">Payment Selection</p>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Method</label>
                    <select
                      name="paymentMethod"
                      value={formValues.paymentMethod}
                      onChange={handleInputChange}
                      className="w-full appearance-none rounded-2xl border border-zinc-100 bg-white/50 px-5 py-4 text-sm font-semibold text-zinc-700 outline-none transition-all focus:border-zinc-900 focus:bg-white"
                    >
                      <option value="card">Digital Debit/Credit Card</option>
                      <option value="wallet">Boutique Wallet</option>
                      <option value="cod">Cash on Complimentary Delivery</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={placingOrder}
                    className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-black px-6 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all hover:bg-zinc-800 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:bg-zinc-300 disabled:scale-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)]"
                  >
                    <AnimatePresence mode="wait">
                      {placingOrder ? (
                        <motion.span 
                          key="placing"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          Authentication...
                        </motion.span>
                      ) : (
                        <motion.span 
                          key="place"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2"
                        >
                          Confirm & Authorize Order
                          <span className="opacity-40 group-hover:translate-x-1 transition-transform">{">"}</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                  <div className="mt-6 flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-widest text-zinc-400">
                    <IoShieldCheckmarkOutline className="text-xs" />
                    Encrypted Protocol Active
                  </div>
                </div>
              </motion.form>

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
                     <span>Shipping</span>
                     <span className={estimatedShipping === 0 ? "text-emerald-500" : "text-zinc-900"}>
                       {estimatedShipping === 0 ? 'COMPLIMENTARY' : formatCurrency(estimatedShipping)}
                     </span>
                  </div>

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

                <div className="bg-zinc-50 rounded-2xl p-4 space-y-3">
                   <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Items Manifest ({validItemCount})</p>
                   {cartResponse?.data?.cart?.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-lg bg-white overflow-hidden border border-zinc-100">
                            <img src={item.product?.productImages?.[0]} className="h-full w-full object-cover" />
                         </div>
                         <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold text-zinc-800 truncate uppercase">{item.product?.productName}</p>
                            <p className="text-[8px] text-zinc-400 uppercase tracking-tighter">Qty: {item.quantity}</p>
                         </div>
                      </div>
                   ))}
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
