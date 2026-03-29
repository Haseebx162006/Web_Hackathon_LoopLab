'use client';

import React, { useSyncExternalStore, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import {
  IoLogOutOutline,
  IoPersonOutline,
  IoShieldCheckmarkOutline,
  IoLocationOutline,
  IoAddOutline,
  IoTrashOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoMapOutline,
} from 'react-icons/io5';
import type { RootState, AppDispatch } from '@/store/store';
import { logout } from '@/store/authSlice';
import BuyerAuthGate from '@/components/buyer/BuyerAuthGate';
import { isBuyerAuthenticated, normalizeApiError } from '@/utils/buyerUtils';
import {
  useGetBuyerProfileQuery,
  useUpdateBuyerProfileMutation,
  useAddBuyerAddressMutation,
  useRemoveBuyerAddressMutation,
  useSetBuyerDefaultAddressMutation,
  type BuyerAddress,
} from '@/store/buyerApi';
import BuyerLoader from '@/components/buyer/BuyerLoader';

// Dynamic import for Map to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('@/components/maps/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] w-full items-center justify-center rounded-4xl bg-zinc-50 border border-zinc-100">
      <BuyerLoader compact label="Loading Map..." />
    </div>
  ),
});

const hydrationSubscribe = () => () => {};
const getHydratedClientSnapshot = () => true;
const getHydratedServerSnapshot = () => false;

const BuyerDashboardProfilePage = () => {
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const isHydrated = useSyncExternalStore(
    hydrationSubscribe,
    getHydratedClientSnapshot,
    getHydratedServerSnapshot
  );

  const isBuyer = isHydrated && ((role === 'buyer' && isAuthenticated) || isBuyerAuthenticated());

  const { data: profileResponse, isLoading: loadingProfile } = useGetBuyerProfileQuery(undefined, {
    skip: !isBuyer,
  });
  const user = profileResponse?.data;

  const [updateProfile] = useUpdateBuyerProfileMutation();
  const [addAddress, { isLoading: addingAddress }] = useAddBuyerAddressMutation();
  const [removeAddress] = useRemoveBuyerAddressMutation();
  const [setDefaultAddress] = useSetBuyerDefaultAddressMutation();

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<BuyerAddress>>({
    label: 'Home',
    country: 'Pakistan',
    isDefault: false,
  });

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    toast.success('Successfully logged out');
    router.push('/');
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.city) {
      toast.error('Please fill in required address fields.');
      return;
    }

    try {
      await addAddress(newAddress).unwrap();
      toast.success('Address added successfully.');
      setIsAddressModalOpen(false);
      setNewAddress({ label: 'Home', country: 'Pakistan', isDefault: false });
    } catch (err) {
      toast.error(normalizeApiError(err, 'Failed to add address.'));
    }
  };

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  if (loadingProfile) {
    return <BuyerLoader label="Loading your profile..." />;
  }

  return (
    <>
      {!isBuyer ? (
        <BuyerAuthGate
          title="Profile is for buyers"
          description="Login with your buyer account to manage your profile and shipping addresses."
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-12"
        >
          {/* Header Section */}
          <header className="flex flex-col gap-10 border-b border-zinc-100 pb-12 md:flex-row md:items-center">
            <div className="flex h-36 w-36 items-center justify-center rounded-[2.5rem] bg-zinc-50 text-5xl font-thin text-zinc-900 shadow-2xl shadow-zinc-200 ring-1 ring-zinc-100">
              {initials}
            </div>
            <div className="space-y-5 md:flex-1">
              <div>
                <p className="text-[10px] font-light uppercase tracking-[0.5em] text-zinc-400">Personal Hub</p>
                <h1 className="text-4xl font-extralight tracking-tight text-zinc-900 sm:text-6xl">
                  {user?.name || 'Valued Customer'}
                </h1>
                <p className="mt-3 text-sm font-light tracking-widest text-zinc-400">
                  {user?.email || 'Premium Member'}
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/50 px-4 py-1.5 text-[10px] font-light uppercase tracking-widest text-emerald-600">
                  <IoShieldCheckmarkOutline className="text-sm" />
                  Verified Profile
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-zinc-100 bg-zinc-50 px-4 py-1.5 text-[10px] font-light uppercase tracking-widest text-zinc-500">
                  Tier 1 Member
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="group flex items-center gap-3 rounded-2xl border border-rose-100 bg-white px-8 py-4 text-[11px] font-light uppercase tracking-[0.25em] text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
              >
                <IoLogOutOutline className="text-lg transition-transform group-hover:translate-x-1" />
                Sign Out
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-12 xl:grid-cols-2">
            {/* Account Details */}
            <section className="space-y-8 rounded-[3rem] border border-zinc-100 bg-white/40 p-10 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-900 shadow-sm border border-zinc-100">
                    <IoPersonOutline className="text-xl font-light" />
                  </div>
                  <h2 className="text-2xl font-extralight tracking-tight text-zinc-900">Information</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2 rounded-3xl border border-zinc-50 bg-white/50 p-6 transition-all hover:bg-white hover:shadow-sm">
                  <p className="text-[9px] font-light uppercase tracking-[0.3em] text-zinc-400">Membership Name</p>
                  <p className="text-sm font-light text-zinc-800">{user?.name || 'Guest User'}</p>
                </div>
                <div className="space-y-2 rounded-3xl border border-zinc-50 bg-white/50 p-6 transition-all hover:bg-white hover:shadow-sm">
                  <p className="text-[9px] font-light uppercase tracking-[0.3em] text-zinc-400">Contact Email</p>
                  <p className="text-sm font-light text-zinc-800">{user?.email || 'No email set'}</p>
                </div>
                <div className="space-y-2 rounded-3xl border border-zinc-50 bg-white/50 p-6 transition-all hover:bg-white hover:shadow-sm">
                  <p className="text-[9px] font-light uppercase tracking-[0.3em] text-zinc-400">Access Role</p>
                  <p className="text-sm font-light uppercase tracking-widest text-zinc-800">{role || 'Buyer'}</p>
                </div>
                <div className="space-y-2 rounded-3xl border border-zinc-50 bg-white/50 p-6 transition-all hover:bg-white hover:shadow-sm">
                  <p className="text-[9px] font-light uppercase tracking-[0.3em] text-zinc-400">Reference ID</p>
                  <p className="truncate text-sm font-light text-zinc-600">#{user?._id?.slice(-8) || '---'}</p>
                </div>
              </div>
            </section>

            {/* Address Management */}
            <section className="space-y-8 rounded-[3rem] border border-zinc-100 bg-white/40 p-10 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-900 shadow-sm border border-zinc-100">
                    <IoLocationOutline className="text-xl font-light" />
                  </div>
                  <h2 className="text-2xl font-extralight tracking-tight text-zinc-900">Shipping</h2>
                </div>
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-xl transition-all hover:scale-110 active:scale-95"
                >
                  <IoAddOutline className="text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                {user?.addresses && user.addresses.length > 0 ? (
                  user.addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className="group flex items-center gap-4 rounded-3xl border border-zinc-50 bg-white/50 p-5 transition-all hover:bg-white hover:shadow-md"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${addr.isDefault ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-400'}`}>
                        <IoMapOutline className="text-lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-light uppercase tracking-widest text-zinc-400">{addr.label || 'Static Address'}</p>
                          {addr.isDefault && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-light uppercase tracking-widest text-emerald-600">Default</span>
                          )}
                        </div>
                        <p className="truncate text-sm font-light text-zinc-800">{addr.street}, {addr.city}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        {!addr.isDefault && (
                          <button
                            onClick={() => setDefaultAddress(addr._id)}
                            className="p-2 text-zinc-400 hover:text-black transition-colors"
                            title="Set as default"
                          >
                            <IoCheckmarkCircleOutline className="text-lg" />
                          </button>
                        )}
                        <button
                          onClick={() => removeAddress(addr._id)}
                          className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"
                          title="Remove address"
                        >
                          <IoTrashOutline className="text-lg" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 opacity-50">
                    <p className="text-sm font-light text-zinc-400 tracking-wide">
                      No shipping locations saved. Add your first address to accelerate checkout.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </motion.div>
      )}

      {/* Add Address Modal */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddressModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[3rem] bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-50 px-8 py-6">
                <h3 className="text-2xl font-extralight tracking-tight text-zinc-900">Add Destination</h3>
                <button
                  onClick={() => setIsAddressModalOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 transition hover:bg-zinc-100"
                >
                  <IoCloseOutline className="text-xl" />
                </button>
              </div>

              <div className="max-h-[80vh] overflow-y-auto p-8 space-y-8">
                {/* Map Section */}
                <div className="space-y-4">
                  <p className="text-[10px] font-light uppercase tracking-[0.3em] text-zinc-400">Precise Location Selection</p>
                  <LocationPicker
                    onLocationSelect={(lat, lng, addressDetails) => {
                      setNewAddress((prev) => ({
                        ...prev,
                        lat,
                        lng,
                        street: addressDetails?.road || addressDetails?.suburb || addressDetails?.neighbourhood || prev.street || '',
                        city: addressDetails?.city || addressDetails?.town || addressDetails?.village || prev.city || '',
                        zipCode: addressDetails?.postcode || prev.zipCode || '',
                        state: addressDetails?.state || prev.state || '',
                      }));
                    }}
                    initialLocation={
                      newAddress.lat && newAddress.lng
                        ? { lat: newAddress.lat, lng: newAddress.lng }
                        : undefined
                    }
                  />
                </div>

                {/* Form Section */}
                <form onSubmit={handleAddAddress} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-light uppercase tracking-widest text-zinc-400 pl-2">Save as (e.g. Home/Work)</label>
                      <input
                        type="text"
                        value={newAddress.label}
                        onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                        className="w-full rounded-2xl border border-zinc-100 bg-zinc-50/50 px-5 py-3.5 text-sm font-light outline-none focus:border-black transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-light uppercase tracking-widest text-zinc-400 pl-2">City</label>
                      <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full rounded-2xl border border-zinc-100 bg-zinc-50/50 px-5 py-3.5 text-sm font-light outline-none focus:border-black transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-light uppercase tracking-widest text-zinc-400 pl-2">Exact Street Address</label>
                    <textarea
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      className="w-full min-h-[100px] rounded-2xl border border-zinc-100 bg-zinc-50/50 px-5 py-3.5 text-sm font-light outline-none focus:border-black transition-colors"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-light uppercase tracking-widest text-zinc-400 pl-2">Zip Code</label>
                      <input
                        type="text"
                        value={newAddress.zipCode}
                        onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                        className="w-full rounded-2xl border border-zinc-100 bg-zinc-50/50 px-5 py-3.5 text-sm font-light outline-none focus:border-black transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-6 pl-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={newAddress.isDefault}
                        onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                        className="h-4 w-4 rounded border-zinc-200 accent-black"
                      />
                      <label htmlFor="isDefault" className="text-xs font-light tracking-wide text-zinc-600 cursor-pointer">Set as primary address</label>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(false)}
                      className="flex-1 rounded-2xl border border-zinc-100 py-4 text-[11px] font-light uppercase tracking-widest text-zinc-500 transition hover:bg-zinc-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingAddress}
                      className="flex-1 rounded-2xl bg-black py-4 text-[11px] font-light uppercase tracking-widest text-white transition hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {addingAddress ? 'Saving...' : 'Confirm Destination'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BuyerDashboardProfilePage;
