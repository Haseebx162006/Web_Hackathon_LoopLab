'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import type { RootState } from '@/store/store';
import { 
  useCheckoutBuyerCartMutation, 
  useGetBuyerCartQuery, 
  useGetBuyerProfileQuery,
  useUpdateBuyerProfileMutation,
  useAddBuyerAddressMutation,
  useUploadPaymentProofMutation,
  type BuyerAddress
} from '@/store/buyerApi';
import BuyerAuthGate from '@/components/buyer/BuyerAuthGate';
import BuyerEmptyState from '@/components/buyer/BuyerEmptyState';
import BuyerErrorState from '@/components/buyer/BuyerErrorState';
import BuyerLoader from '@/components/buyer/BuyerLoader';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import { formatCurrency, isBuyerAuthenticated, normalizeApiError } from '@/utils/buyerUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoShieldCheckmarkOutline, 
  IoLocationOutline, 
  IoCardOutline, 
  IoChevronBackOutline,
  IoPersonOutline,
  IoAddOutline,
  IoMapOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoCloudUploadOutline,
  IoDiamondOutline,
  IoWalletOutline
} from 'react-icons/io5';

// Dynamic import for Map to avoid SSR issues
const LocationPicker = dynamic(() => import('@/components/maps/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] w-full items-center justify-center rounded-[2rem] bg-zinc-50 border border-zinc-100">
      <BuyerLoader compact label="Loading Map..." />
    </div>
  ),
});

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

  const {
    data: profileResponse,
    isLoading: loadingProfile,
  } = useGetBuyerProfileQuery(undefined, { skip: !isBuyer });

  const [checkoutCart, { isLoading: placingOrder }] = useCheckoutBuyerCartMutation();
  const [updateProfile] = useUpdateBuyerProfileMutation();
  const [addAddress, { isLoading: addingAddress }] = useAddBuyerAddressMutation();

  const user = profileResponse?.data;

  // Checkout Stages
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Multi-step State
  const [name, setName] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<BuyerAddress>>({
    label: 'Home',
    country: 'Pakistan',
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card' | 'wallet' | 'boutique_account' | 'stripe'>('card');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentProofFiles, setPaymentProofFiles] = useState<Record<string, File>>({});

  const [uploadProof, { isLoading: uploadingProof }] = useUploadPaymentProofMutation();

  // Sync profile data once loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
      if (defaultAddr && !selectedAddressId) {
        setSelectedAddressId(defaultAddr._id);
      }
    }
  }, [user]);

  const subtotal = cartResponse?.data?.subtotal ?? 0;

  const validItemCount = useMemo(
    () => (cartResponse?.data?.cart?.items ?? []).filter((item) => item.product).length,
    [cartResponse?.data?.cart?.items]
  );

  const estimatedShipping = subtotal > 120 ? 0 : 9.99;
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + estimatedShipping + tax;

  const handleNextStep = async () => {
    if (!name.trim()) {
      toast.error('Identity required.');
      return;
    }

    if (!selectedAddressId) {
      toast.error('Logistics destination required.');
      return;
    }

    try {
      // Sync name if changed
      if (name !== user?.name) {
        await updateProfile({ name }).unwrap();
      }
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(normalizeApiError(err, 'Failed to update profile.'));
    }
  };

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.city) {
      toast.error('Precise address required.');
      return;
    }

    try {
      const response = await addAddress(newAddress).unwrap();
      const savedAddress = response.data[response.data.length - 1]; // Newest
      setSelectedAddressId(savedAddress._id);
      setIsAddingNew(false);
      toast.success('Address saved to profile.');
    } catch (err) {
      toast.error(normalizeApiError(err, 'Failed to save address.'));
    }
  };

  const executeCheckout = async (proofUrls?: Record<string, string>) => {
    const finalAddress = user?.addresses.find(a => a._id === selectedAddressId);
    if (!finalAddress) {
      toast.error('Invalid shipping selection.');
      return;
    }

    try {
      const response = await checkoutCart({
        shippingAddress: {
          street: finalAddress.street,
          city: finalAddress.city,
          state: finalAddress.state,
          country: finalAddress.country,
          zipCode: finalAddress.zipCode,
        },
        paymentMethod,
        paymentProof: proofUrls || null,
      }).unwrap();

      const orderIds = response.data.orders || [];
      sessionStorage.setItem('lastOrderIds', JSON.stringify(orderIds));

      if (paymentMethod === 'cod') {
        router.push(`/order-confirmation?orders=${encodeURIComponent(orderIds.join(','))}&payment=cod`);
      } else if (paymentMethod === 'boutique_account') {
        router.push(`/order-confirmation?orders=${encodeURIComponent(orderIds.join(','))}&payment=boutique_account&status=pending_verification`);
      } else {
        router.push(`/payment?orders=${encodeURIComponent(orderIds.join(','))}&method=${paymentMethod}`);
      }
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Authorization failed.'));
    }
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const uniqueSellers = Array.from(new Set(cartResponse?.data?.cart?.items.map(item => item.product?.sellerId).filter(id => !!id)));
    if (uniqueSellers.some(sellerId => !paymentProofFiles[sellerId as string])) {
      toast.error('All transaction screenshots are required.');
      return;
    }

    try {
      const proofUrls: Record<string, string> = {};
      
      // Upload proofs in parallel
      const uploadPromises = uniqueSellers.map(async (sellerId) => {
         const file = paymentProofFiles[sellerId as string];
         const uploadRes = await uploadProof(file).unwrap();
         proofUrls[sellerId as string] = uploadRes.data;
      });
      
      await Promise.all(uploadPromises);
      await executeCheckout(proofUrls);
      setIsVerifyingPayment(false);
    } catch (err) {
      toast.error(normalizeApiError(err, 'Upload failed.'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validItemCount === 0) {
      toast.error('Manifest is empty.');
      return;
    }

    if (paymentMethod === 'boutique_account') {
      setIsVerifyingPayment(true);
      return;
    }

    await executeCheckout();
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
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">
                    Step {step} of 2: {step === 1 ? 'Logistics Selection' : 'Payment Authorization'}
                  </p>
               </motion.div>
               <h1 className="text-5xl font-thin tracking-tight text-zinc-900 sm:text-7xl lg:text-8xl">
                 Secure <span className="text-zinc-400">Checkout</span>
               </h1>
            </div>
            {step === 2 && (
               <button 
                 onClick={() => setStep(1)}
                 className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] hover:text-zinc-500 transition-colors"
               >
                 <IoChevronBackOutline className="group-hover:-translate-x-1 transition-transform" />
                 Back to Logistics
               </button>
            )}
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
              <div className="space-y-10">
                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-12"
                    >
                      {/* Identity Card */}
                      <section className="space-y-8 rounded-[3rem] border border-zinc-100/50 bg-white/40 p-8 md:p-12 backdrop-blur-2xl shadow-[0_40px_80px_-40px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white">
                            <IoPersonOutline className="text-sm" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900">Boutique Identity</p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Full Legal Name</label>
                              <input 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-2xl border border-zinc-100 bg-white/50 px-5 py-4 text-sm font-semibold text-zinc-700 outline-none focus:border-zinc-900"
                                placeholder="Your Name"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Verified Email</label>
                              <div className="w-full rounded-2xl border border-zinc-100 bg-zinc-100/30 px-5 py-4 text-sm font-semibold text-zinc-400 cursor-not-allowed">
                                 {user?.email || 'Authentication pending...'}
                              </div>
                           </div>
                        </div>
                      </section>

                      {/* Logistics Card */}
                      <section className="space-y-8 rounded-[3rem] border border-zinc-100/50 bg-white/40 p-8 md:p-12 backdrop-blur-2xl shadow-[0_40px_80px_-40px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white">
                              <IoLocationOutline className="text-sm" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900">Shipping Destinations</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                           {user?.addresses.map((addr) => (
                              <button 
                                key={addr._id}
                                onClick={() => setSelectedAddressId(addr._id)}
                                className={`group flex items-start gap-4 rounded-3xl border p-5 text-left transition-all ${selectedAddressId === addr._id ? 'border-zinc-900 bg-zinc-950 text-white shadow-2xl scale-[1.02]' : 'border-zinc-100 bg-white hover:border-zinc-300'}`}
                              >
                                 <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selectedAddressId === addr._id ? 'border-white/50 bg-white/10' : 'border-zinc-200 bg-zinc-50'}`}>
                                    {selectedAddressId === addr._id ? <IoCheckmarkCircleOutline /> : <IoMapOutline className="text-zinc-400" />}
                                 </div>
                                 <div className="min-w-0">
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${selectedAddressId === addr._id ? 'text-zinc-400' : 'text-zinc-400'}`}>{addr.label || 'Static Location'}</p>
                                    <p className="mt-1 truncate text-xs font-bold">{addr.street}</p>
                                    <p className={`text-[10px] opacity-60 ${selectedAddressId === addr._id ? 'text-white' : 'text-zinc-500'}`}>{addr.city}, {addr.state}</p>
                                 </div>
                              </button>
                           ))}
                           <button 
                             onClick={() => setIsAddingNew(true)}
                             className="flex items-center justify-center h-full min-h-[100px] rounded-3xl border-2 border-dashed border-zinc-100 bg-zinc-50/50 p-5 transition-all hover:border-zinc-300 hover:bg-zinc-50"
                           >
                              <div className="flex flex-col items-center gap-2">
                                 <IoAddOutline className="text-2xl text-zinc-300" />
                                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">New Destination</p>
                              </div>
                           </button>
                        </div>

                        <div className="pt-6">
                           <button 
                             onClick={handleNextStep}
                             className="flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-6 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all hover:bg-black hover:scale-[1.02] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.4)]"
                           >
                              Proceed to Payment Authorization
                           </button>
                        </div>
                      </section>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onSubmit={handleSubmit}
                      className="space-y-10 rounded-[3rem] border border-zinc-100/50 bg-white/40 p-8 md:p-12 backdrop-blur-2xl shadow-[0_40px_80px_-40px_rgba(0,0,0,0.1)]"
                    >
                      <div className="space-y-8">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white">
                            <IoCardOutline className="text-sm" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900">Protocol Select</p>
                        </div>
                        
                        <div className="space-y-4">
                           {[
                             { id: 'card', label: 'Stripe Payment Gateway', desc: 'Secure encryption enabled', icon: <IoCardOutline /> },
                             { id: 'boutique_account', label: 'Boutique Account Transfer', desc: 'Direct Bank / JazzCash Verification', icon: <IoDiamondOutline /> },
                             { id: 'cod', label: 'Cash on Delivery', desc: 'Verify on arrival', icon: <IoCheckmarkCircleOutline /> }
                           ].map((method) => (
                             <button 
                               key={method.id}
                               type="button"
                               onClick={() => setPaymentMethod(method.id as any)}
                               className={`w-full flex items-center justify-between rounded-2xl border p-5 transition-all ${paymentMethod === method.id ? 'border-zinc-900 bg-zinc-900 text-white shadow-xl scale-[1.01]' : 'border-zinc-100 bg-white hover:border-zinc-300'}`}
                             >
                               <div className="flex items-center gap-4">
                                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${paymentMethod === method.id ? 'bg-white/10 text-white' : 'bg-zinc-50 text-zinc-400'}`}>
                                     {method.icon}
                                  </div>
                                  <div className="text-left">
                                     <p className="text-sm font-bold">{method.label}</p>
                                     <p className={`text-[9px] uppercase tracking-widest ${paymentMethod === method.id ? 'text-zinc-400' : 'text-zinc-400'}`}>{method.desc}</p>
                                  </div>
                               </div>
                               <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id ? 'border-white bg-white/10' : 'border-zinc-200'}`}>
                                  {paymentMethod === method.id && <div className="h-2 w-2 rounded-full bg-white" />}
                               </div>
                             </button>
                           ))}
                        </div>
                      </div>

                      <div className="pt-6">
                        <button
                          type="submit"
                          disabled={placingOrder}
                          className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-black px-6 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all hover:bg-zinc-800 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:bg-zinc-300"
                        >
                          {placingOrder ? 'Authenticating...' : paymentMethod === 'cod' ? 'Confirm & Place Order' : 'Authorize Final Transaction'}
                        </button>
                        <div className="mt-6 flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-widest text-zinc-400">
                          <IoShieldCheckmarkOutline className="text-xs" />
                          Secure Multi-Stage Authorization Protocol Active
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              <aside className="sticky top-24 h-fit space-y-8 rounded-[3rem] border border-zinc-100/50 bg-white/40 p-8 backdrop-blur-3xl shadow-[0_40px_80px_-40px_rgba(0,0,0,0.1)]">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Boutique Summary</p>
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

                {/* Final Selection Reveal */}
                <div className="bg-zinc-50/50 rounded-2xl p-6 space-y-4 border border-zinc-100">
                   <div className="flex items-center justify-between">
                      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 transition-all">Items Manifest ({validItemCount})</p>
                      <button onClick={() => setStep(1)} className="text-[7px] font-black uppercase tracking-widest text-zinc-900 hover:opacity-50 transition-opacity">Edit</button>
                   </div>
                   <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {cartResponse?.data?.cart?.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-4 group">
                            <div className="h-10 w-10 shrink-0 rounded-xl bg-white overflow-hidden border border-zinc-100 transition-transform group-hover:scale-105">
                                <img src={item.product?.productImages?.[0]} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-black text-zinc-900 truncate uppercase tracking-wider">{item.product?.productName}</p>
                                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">Verified Unit • Qty: {item.quantity}</p>
                            </div>
                          </div>
                      ))}
                   </div>
                </div>
                
                {selectedAddressId && (
                   <div className="bg-zinc-50/50 rounded-2xl p-6 space-y-2 border border-zinc-100">
                      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Verified Destination</p>
                      <p className="text-[10px] font-bold text-zinc-800 line-clamp-2 uppercase leading-relaxed">
                         {user?.addresses.find(a => a._id === selectedAddressId)?.street}, {user?.addresses.find(a => a._id === selectedAddressId)?.city}
                      </p>
                   </div>
                )}
              </aside>
            </div>
          ) : null}

          {/* New Destination Modal (Map Selection) */}
          <AnimatePresence>
            {isAddingNew && (
              <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsAddingNew(false)}
                  className="absolute inset-0 bg-black/40 backdrop-blur-md"
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  className="relative w-full max-w-2xl overflow-hidden rounded-[3rem] bg-white shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 px-8 py-6">
                    <h3 className="text-2xl font-thin tracking-tight text-zinc-900 uppercase">New Destination</h3>
                    <button
                      onClick={() => setIsAddingNew(false)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 transition hover:bg-zinc-100"
                    >
                      <IoCloseOutline className="text-xl" />
                    </button>
                  </div>

                  <div className="max-h-[80vh] overflow-y-auto p-8 space-y-8">
                    {/* Map Section */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Selection via Map</p>
                      <LocationPicker
                        onLocationSelect={(lat, lng, details) => {
                          setNewAddress(prev => ({
                            ...prev,
                            lat,
                            lng,
                            street: details?.road || details?.suburb || details?.neighbourhood || prev.street || '',
                            city: details?.city || details?.town || details?.village || prev.city || '',
                            zipCode: details?.postcode || prev.zipCode || '',
                            state: details?.state || prev.state || '',
                          }));
                        }}
                      />
                    </div>

                    <form onSubmit={handleAddNewAddress} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-2">Location Identifier</label>
                          <input
                            value={newAddress.label}
                            onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                            className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 px-5 py-4 text-sm font-semibold text-zinc-700 outline-none focus:border-black"
                            required
                            placeholder="Home, Office, etc"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-2">City</label>
                          <input
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                            className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 px-5 py-4 text-sm font-semibold text-zinc-700 outline-none focus:border-black"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-2">Precise Street Identity</label>
                        <textarea
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          className="w-full min-h-[100px] rounded-2xl border border-zinc-100 bg-zinc-50 px-5 py-4 text-sm font-semibold text-zinc-700 outline-none focus:border-black resize-none"
                          required
                        />
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsAddingNew(false)}
                          className="flex-1 rounded-2xl border border-zinc-100 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 transition hover:bg-zinc-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={addingAddress}
                          className="flex-1 rounded-2xl bg-black py-4 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-zinc-800 disabled:opacity-50"
                        >
                          {addingAddress ? 'Saving Identity...' : 'Confirm & Save'}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          {/* Payment Proof Modal using Portal to overlay everything */}
          {isMounted && createPortal(
            <AnimatePresence>
              {isVerifyingPayment && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
                   <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setIsVerifyingPayment(false)}
                     className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                   />
                   <motion.div
                     initial={{ scale: 0.95, opacity: 0, y: 40 }}
                     animate={{ scale: 1, opacity: 1, y: 0 }}
                     exit={{ scale: 0.95, opacity: 0, y: 40 }}
                     transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
                     className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl shadow-black/40 ring-1 ring-zinc-200"
                   >
                     <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-8 py-6 backdrop-blur-sm">
                        <div className="space-y-1">
                           <h3 className="text-2xl font-semibold tracking-tight text-zinc-900">Transfer Verification</h3>
                           <p className="text-xs font-medium text-zinc-500">Secure manual payment gateway for LoopLab</p>
                        </div>
                        <button onClick={() => setIsVerifyingPayment(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-100 hover:ring-zinc-300 transition-all text-zinc-500">
                           <IoCloseOutline className="text-xl" />
                        </button>
                     </div>

                     <div className="max-h-[75vh] overflow-y-auto px-8 py-6 custom-scrollbar">
                        <div className="space-y-8">
                           {/* Bank Details Section */}
                           <div className="space-y-5">
                              <h4 className="flex items-center gap-2 text-sm font-bold tracking-tight text-zinc-900">
                                 <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] text-zinc-600">1</span>
                                 Authorized Bank Credentials
                              </h4>
                              <div className="grid gap-4 sm:grid-cols-2">
                                 {/* Group by Unique Sellers */}
                                 {Array.from(new Set(cartResponse?.data?.cart?.items.map(item => item.product?.sellerId).filter(id => !!id))).map((sellerId, idx) => {
                                    const sellerProduct = cartResponse?.data?.cart?.items.find(item => item.product?.sellerId === sellerId)?.product;
                                    if (!sellerProduct) return null;
                                    
                                    const sellerObj = typeof sellerProduct.sellerId === 'string' ? { _id: sellerProduct.sellerId } : sellerProduct.sellerId as any;
                                    const storeLabel = sellerObj?.storeName || sellerObj?._id?.toString().slice(-6).toUpperCase() || 'HUB';
                                    
                                    // Parse legacy vs new bank fields
                                    const hasNewFields = sellerObj?.bankName || sellerObj?.bankIBAN;
                                    const legacyBankDetails = sellerObj?.bankDetails || '';
                                    
                                    // Fallbacks
                                    const bankName = sellerObj?.bankName || (legacyBankDetails ? legacyBankDetails.split(',')[0] || 'Unknown Bank' : 'Bank details pending');
                                    const accountHolder = sellerObj?.bankAccountHolderName || storeLabel;
                                    const bankIban = sellerObj?.bankIBAN || legacyBankDetails || 'No details provided';

                                    return (
                                       <div key={idx} className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md">
                                          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rounded-full bg-zinc-50 transition-transform group-hover:scale-150"></div>
                                          <div className="relative">
                                             <div className="mb-4 inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                                                <IoDiamondOutline /> {storeLabel}
                                             </div>
                                             <div className="space-y-3">
                                                {!hasNewFields && legacyBankDetails ? (
                                                   // Legacy merged display
                                                   <div className="pt-2">
                                                      <p className="text-[10px] font-semibold uppercase text-zinc-400">Banking Information</p>
                                                      <div className="mt-1 flex items-center justify-between gap-2">
                                                         <p className="text-xs font-medium text-zinc-800 break-words leading-snug">{legacyBankDetails}</p>
                                                         <button onClick={() => {
                                                            navigator.clipboard.writeText(legacyBankDetails);
                                                            toast.success("Copied to clipboard!");
                                                         }} className="shrink-0 rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600 hover:bg-zinc-200 transition-colors">COPY</button>
                                                      </div>
                                                   </div>
                                                ) : (
                                                   // Granular display
                                                   <>
                                                      <div>
                                                         <p className="text-[10px] font-semibold uppercase text-zinc-400">Bank Name</p>
                                                         <p className="text-sm font-bold text-zinc-900">{bankName}</p>
                                                      </div>
                                                      <div>
                                                         <p className="text-[10px] font-semibold uppercase text-zinc-400">Account Holder</p>
                                                         <p className="text-sm font-bold text-zinc-900">{accountHolder}</p>
                                                      </div>
                                                      <div className="pt-2 border-t border-zinc-100">
                                                         <p className="text-[10px] font-semibold uppercase text-zinc-400">IBAN / Account #</p>
                                                         <div className="mt-1 flex items-center justify-between gap-2">
                                                            <p className="text-sm font-mono font-bold tracking-widest text-zinc-800 break-all leading-tight">{bankIban}</p>
                                                            {bankIban !== 'No details provided' && (
                                                               <button onClick={() => {
                                                                  navigator.clipboard.writeText(bankIban);
                                                                  toast.success("Copied to clipboard!");
                                                               }} className="shrink-0 rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600 hover:bg-zinc-200 transition-colors">COPY</button>
                                                            )}
                                                         </div>
                                                      </div>
                                                   </>
                                                )}
                                             </div>
                                          </div>
                                       </div>
                                    )
                                 })}
                              </div>
                           </div>

                           {/* Evidence Submission Section */}
                           <div className="space-y-5">
                              <h4 className="flex items-center gap-2 text-sm font-bold tracking-tight text-zinc-900">
                                 <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] text-zinc-600">2</span>
                                 Evidence Submission
                              </h4>
                              
                              <div className="grid gap-4 sm:grid-cols-2">
                                 {Array.from(new Set(cartResponse?.data?.cart?.items.map(item => item.product?.sellerId).filter(id => !!id))).map((sellerId, idx) => {
                                    const sellerProduct = cartResponse?.data?.cart?.items.find(item => item.product?.sellerId === sellerId)?.product;
                                    if (!sellerProduct) return null;
                                    
                                    const sellerObj = typeof sellerProduct.sellerId === 'string' ? { _id: sellerProduct.sellerId } : sellerProduct.sellerId as any;
                                    const storeLabel = sellerObj?.storeName || sellerObj?._id?.toString().slice(-6).toUpperCase() || 'HUB';
                                    const file = paymentProofFiles[sellerId as string];

                                    return (
                                      <div key={idx} className="relative group overflow-hidden rounded-2xl">
                                         <input 
                                           type="file" 
                                           accept="image/*"
                                           onChange={(e) => {
                                             const selected = e.target.files?.[0] || null;
                                             if (selected) {
                                                setPaymentProofFiles(prev => ({ ...prev, [sellerId as string]: selected }));
                                             }
                                           }}
                                           className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                                         />
                                         <div className={`flex h-full flex-col items-center justify-center gap-3 border-2 border-dashed p-6 transition-all ${file ? 'border-emerald-500 bg-emerald-50/50' : 'border-zinc-200 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100'}`}>
                                            {file ? (
                                               <>
                                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
                                                     <IoCheckmarkCircleOutline className="text-2xl" />
                                                  </div>
                                                  <div className="text-center w-full px-2">
                                                     <p className="text-sm font-bold text-emerald-900 truncate">{file.name}</p>
                                                     <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-widest mt-1">Store Verified</p>
                                                  </div>
                                               </>
                                            ) : (
                                               <>
                                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] text-zinc-400 transition-transform group-hover:-translate-y-1">
                                                     <IoCloudUploadOutline className="text-xl" />
                                                  </div>
                                                  <div className="text-center w-full px-2">
                                                     <p className="text-sm font-bold text-zinc-900">Upload Receipt</p>
                                                     <p className="text-[10px] font-medium text-zinc-400 mt-1">{storeLabel}</p>
                                                  </div>
                                               </>
                                            )}
                                         </div>
                                      </div>
                                    );
                                 })}
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="border-t border-zinc-100 bg-white p-6">
                        <div className="flex gap-3">
                           <button onClick={() => setIsVerifyingPayment(false)} className="flex-1 rounded-xl border border-zinc-200 bg-white py-3.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 shadow-sm">
                              Cancel
                           </button>
                           <button 
                             onClick={handleProofSubmit}
                             disabled={
                               uploadingProof || 
                               placingOrder || 
                               Array.from(new Set(cartResponse?.data?.cart?.items.map(i => i.product?.sellerId).filter(id => !!id))).length !== Object.keys(paymentProofFiles).length
                             }
                             className="flex flex-[2] relative items-center justify-center overflow-hidden rounded-xl bg-black py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-black group"
                           >
                              <span className="relative z-10 flex items-center gap-2">
                                 {uploadingProof ? 'Uploading...' : placingOrder ? 'Finalizing...' : 'Submit All & Place Order'}
                              </span>
                           </button>
                        </div>
                     </div>
                   </motion.div>
                 </div>
               )}
            </AnimatePresence>,
            document.body
          )}
        </section>
      )}
    </BuyerPageShell>
  );
};

export default CheckoutPage;
