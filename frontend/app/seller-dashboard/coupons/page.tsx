'use client';

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { 
  IoSearchOutline, 
  IoTicketOutline,
  IoStatsChartOutline,
  IoGiftOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoPricetagOutline
} from 'react-icons/io5';
import SellerBadge from '@/components/seller/SellerBadge';
import SellerButton from '@/components/seller/SellerButton';
import SellerCard from '@/components/seller/SellerCard';
import SellerErrorState from '@/components/seller/SellerErrorState';
import SellerInput from '@/components/seller/SellerInput';
import SellerLoader from '@/components/seller/SellerLoader';
import SellerModal from '@/components/seller/SellerModal';
import SellerPageHeader from '@/components/seller/SellerPageHeader';
import SellerSelect from '@/components/seller/SellerSelect';
import SellerTable from '@/components/seller/SellerTable';
import {
  useCreateSellerCouponMutation,
  useDeleteSellerCouponMutation,
  useGetSellerCouponsQuery,
  useUpdateSellerCouponMutation,
  type SellerCoupon,
  type SellerCouponPayload,
} from '@/store/sellerApi';
import { formatCurrency, formatDate, normalizeApiError } from '@/utils/sellerUtils';

interface CouponFormState {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: string;
  minOrderAmount: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const getInitialForm = (): CouponFormState => ({
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '0',
  startDate: '',
  endDate: '',
  isActive: true,
});

const toDateInputValue = (value: string) => {
  return value.slice(0, 10);
};

const CouponManagementPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<SellerCoupon | null>(null);
  const [formState, setFormState] = useState<CouponFormState>(getInitialForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: couponsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetSellerCouponsQuery();

  const [createCoupon, { isLoading: creating }] = useCreateSellerCouponMutation();
  const [updateCoupon, { isLoading: updating }] = useUpdateSellerCouponMutation();
  const [deleteCoupon, { isLoading: deleting }] = useDeleteSellerCouponMutation();

  const coupons = useMemo(() => couponsResponse?.data ?? [], [couponsResponse?.data]);
  const submitting = creating || updating;

  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => c.code.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [coupons, searchQuery]);

  const stats = useMemo(() => {
    const active = coupons.filter(c => c.isActive).length;
    const total = coupons.length;
    const avgDiscount = coupons.length > 0 
      ? coupons.reduce((sum, c) => sum + c.discountValue, 0) / coupons.length 
      : 0;
    return { active, total, avgDiscount };
  }, [coupons]);

  const resetForm = () => {
    setEditingCoupon(null);
    setFormState(getInitialForm());
    setFormError(null);
  };

  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (coupon: SellerCoupon) => {
    setEditingCoupon(coupon);
    setFormState({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderAmount: String(coupon.minOrderAmount),
      startDate: toDateInputValue(coupon.startDate),
      endDate: toDateInputValue(coupon.endDate),
      isActive: coupon.isActive,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const buildPayload = (): SellerCouponPayload | null => {
    const discountValue = Number(formState.discountValue);
    const minOrderAmount = Number(formState.minOrderAmount);

    if (!formState.code.trim()) {
      setFormError('Coupon code is required.');
      return null;
    }
    if (!formState.startDate || !formState.endDate) {
      setFormError('Start date and end date are required.');
      return null;
    }
    if (Number.isNaN(discountValue) || discountValue < 0) {
      setFormError('Discount value must be a number greater than or equal to 0.');
      return null;
    }
    if (formState.discountType === 'percentage' && discountValue > 100) {
      setFormError('Percentage discount cannot exceed 100.');
      return null;
    }
    if (Number.isNaN(minOrderAmount) || minOrderAmount < 0) {
      setFormError('Minimum order amount must be a number greater than or equal to 0.');
      return null;
    }
    if (new Date(formState.endDate).getTime() < new Date(formState.startDate).getTime()) {
      setFormError('End date must be on or after start date.');
      return null;
    }

    return {
      code: formState.code.trim(),
      discountType: formState.discountType,
      discountValue,
      minOrderAmount,
      startDate: formState.startDate,
      endDate: formState.endDate,
      isActive: formState.isActive,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const payload = buildPayload();
    if (!payload) {
      return;
    }

    try {
      if (editingCoupon) {
        await updateCoupon({ id: editingCoupon._id, body: payload }).unwrap();
        toast.success('Coupon updated');
      } else {
        await createCoupon(payload).unwrap();
        toast.success('Coupon created');
      }

      setIsFormOpen(false);
      resetForm();
    } catch (requestError) {
      setFormError(normalizeApiError(requestError, 'Failed to save coupon.'));
    }
  };

  const handleDelete = async (coupon: SellerCoupon) => {
    const confirmed = window.confirm(`Delete coupon ${coupon.code}?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteCoupon(coupon._id).unwrap();
      toast.success('Coupon deleted');
    } catch (requestError) {
      toast.error(normalizeApiError(requestError, 'Failed to delete coupon'));
    }
  };

  return (
    <div className="space-y-8">
      <SellerPageHeader
        title="Promotions & Coupons"
        description="Create and manage discount campaigns with date windows, activation toggles, and order thresholds."
        action={<SellerButton label="Create Coupon" onClick={openCreate} />}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="relative group">
           <div className="absolute -inset-0.5 bg-linear-to-r from-indigo-200 to-purple-100 rounded-4xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
           <SellerCard className="relative bg-white/80 backdrop-blur-xl border border-white/60">
              <div className="flex items-start justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Active Promotions</p>
                    <p className="mt-2 text-3xl font-light tracking-tight text-black">{stats.active}</p>
                 </div>
                 <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100/50">
                    <IoCheckmarkCircleOutline className="text-indigo-400 text-lg" />
                 </div>
              </div>
              <p className="mt-4 text-[10px] font-medium text-indigo-600 flex items-center gap-1.5 uppercase tracking-wider">
                 <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
                 Live campaigns
              </p>
           </SellerCard>
        </div>

        <div className="relative group">
           <div className="absolute -inset-0.5 bg-linear-to-r from-rose-200 to-pink-100 rounded-4xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
           <SellerCard className="relative bg-white/80 backdrop-blur-xl border border-white/60">
              <div className="flex items-start justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Avg. Discount</p>
                    <p className="mt-2 text-3xl font-light tracking-tight text-black">{stats.avgDiscount.toFixed(1)}%</p>
                 </div>
                 <div className="h-10 w-10 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100/50">
                    <IoGiftOutline className="text-rose-400 text-lg" />
                 </div>
              </div>
              <p className="mt-4 text-[10px] font-medium text-rose-600 flex items-center gap-1.5 uppercase tracking-wider">
                 <span className="h-1 w-1 rounded-full bg-rose-400"></span>
                 Incentive value
              </p>
           </SellerCard>
        </div>

        <div className="relative group">
           <div className="absolute -inset-0.5 bg-linear-to-r from-zinc-200 to-zinc-100 rounded-4xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
           <SellerCard className="relative bg-white/80 border border-white/60">
              <div className="flex items-start justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Total Coupons</p>
                    <p className="mt-2 text-3xl font-light tracking-tight text-zinc-800">{stats.total}</p>
                 </div>
                 <div className="h-10 w-10 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100/50">
                    <IoTicketOutline className="text-zinc-400 text-lg" />
                 </div>
              </div>
              <p className="mt-4 text-[10px] font-medium text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
                 <span className="h-1 w-1 rounded-full bg-zinc-300"></span>
                 Program historical
              </p>
           </SellerCard>
        </div>
      </div>

      <SellerCard className="bg-white/80 border border-white/60">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-zinc-100/50 -m-6 lg:-m-8">
           <div className="flex-1 p-6 lg:p-8">
              <div className="relative group">
                <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg transition-colors group-focus-within:text-black" />
                <input 
                  type="text" 
                  placeholder="Filter by Coupon Code..."
                  className="w-full bg-zinc-50/50 border border-zinc-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-light outline-none transition-all focus:bg-white focus:ring-1 focus:ring-black/5"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
           </div>
        </div>
      </SellerCard>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-linear-to-b from-zinc-100 to-transparent rounded-[2.5rem] blur opacity-10"></div>
        <SellerCard className="relative bg-white/80 border border-white/60 overflow-hidden" noPadding>
          <div className="p-6 lg:p-8 flex items-center justify-between border-b border-zinc-50 bg-zinc-50/30">
            <h2 className="text-lg font-light tracking-tight text-black flex items-center gap-3">
              Coupon Repository
              <span className="text-[10px] font-bold bg-zinc-100 text-zinc-400 px-2 py-0.5 rounded-full uppercase tracking-widest">{filteredCoupons.length} Active Items</span>
            </h2>
            <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <div className={`h-1.5 w-1.5 rounded-full ${isFetching ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              {isFetching ? 'Synchronizing...' : 'Live System'}
            </div>
          </div>

          {filteredCoupons.length === 0 ? (
            <div className="p-20 text-center">
               <IoSearchOutline className="text-4xl text-zinc-200 mx-auto mb-4" />
               <p className="text-sm font-light text-zinc-400">No matching coupons found.</p>
            </div>
          ) : (
            <SellerTable
              headers={['Marketing Code', 'Discount Method', 'Valuation', 'Lower Bound', 'Validity Period', 'Current State', 'Actions']}
            >
              {filteredCoupons.map((coupon) => (
                <tr key={coupon._id} className="group hover:bg-black/2 transition-colors border-b border-zinc-50 last:border-0">
                  <td className="px-6 py-6 font-light">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 bg-black/[0.03] rounded-lg flex items-center justify-center">
                          <IoPricetagOutline className="text-zinc-400 text-xs" />
                       </div>
                       <span className="text-sm font-bold text-black uppercase tracking-widest">{coupon.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                     <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{coupon.discountType}</span>
                  </td>
                  <td className="px-6 py-6">
                    <p className="text-sm font-light text-indigo-600">
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}%`
                        : formatCurrency(coupon.discountValue)}
                    </p>
                  </td>
                  <td className="px-6 py-6 text-sm font-light text-zinc-500">
                    {formatCurrency(coupon.minOrderAmount)}
                  </td>
                  <td className="px-6 py-6">
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        <IoCalendarOutline />
                        {formatDate(coupon.startDate)} — {formatDate(coupon.endDate)}
                     </div>
                  </td>
                  <td className="px-6 py-6">
                    <SellerBadge label={coupon.isActive ? 'Active' : 'Archived'} tone={coupon.isActive ? 'success' : 'default'} />
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2">
                      <SellerButton
                        label="Configure"
                        tone="secondary"
                        className="h-10 px-4 !rounded-xl text-[10px] font-black uppercase tracking-widest"
                        onClick={() => openEdit(coupon)}
                      />
                      <SellerButton
                        label="Purge"
                        tone="danger"
                        className="h-10 px-4 !rounded-xl text-[10px] font-black uppercase tracking-widest"
                        loading={deleting}
                        onClick={() => {
                          void handleDelete(coupon);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </SellerTable>
          )}
        </SellerCard>
      </div>

      <SellerModal
        title={editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          resetForm();
        }}
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <SellerInput
              label="Marketing Code"
              className="uppercase font-bold tracking-widest"
              value={formState.code}
              onChange={(event) => setFormState((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
              required
            />

            <SellerSelect
              label="Incentive Strategy"
              value={formState.discountType}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  discountType: event.target.value as 'percentage' | 'flat',
                }))
              }
              options={[
                { value: 'percentage', label: 'Percentage' },
                { value: 'flat', label: 'Flat Amount' },
              ]}
            />

            <SellerInput
              label="Discount Magnitude"
              type="number"
              min="0"
              step="0.01"
              value={formState.discountValue}
              onChange={(event) => setFormState((prev) => ({ ...prev, discountValue: event.target.value }))}
              required
            />

            <SellerInput
              label="Lower Bound Threshold"
              type="number"
              min="0"
              step="0.01"
              value={formState.minOrderAmount}
              onChange={(event) => setFormState((prev) => ({ ...prev, minOrderAmount: event.target.value }))}
              required
            />

            <SellerInput
              label="Campaign Start"
              type="date"
              value={formState.startDate}
              onChange={(event) => setFormState((prev) => ({ ...prev, startDate: event.target.value }))}
              required
            />

            <SellerInput
              label="Campaign Termination"
              type="date"
              value={formState.endDate}
              onChange={(event) => setFormState((prev) => ({ ...prev, endDate: event.target.value }))}
              required
            />
          </div>

          <label className="flex items-center gap-3 rounded-3xl border border-zinc-100 bg-zinc-50/50 px-6 py-5 backdrop-blur-sm transition-all hover:bg-zinc-50/80 group/check cursor-pointer">
            <div className="relative flex items-center justify-center">
               <input
                 type="checkbox"
                 checked={formState.isActive}
                 onChange={(event) => setFormState((prev) => ({ ...prev, isActive: event.target.checked }))}
                 className="peer h-5 w-5 appearance-none rounded-lg border-2 border-zinc-200 checked:bg-black checked:border-black transition-all cursor-pointer"
               />
               <IoCheckmarkCircleOutline className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity text-xs" />
            </div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Promotion is currently live and active</span>
          </label>

          {formError ? <SellerErrorState message={formError} /> : null}

          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-zinc-50">
            <SellerButton
              label="Discard"
              tone="secondary"
              type="button"
              className="h-12 px-8 !rounded-2xl text-[10px] font-black uppercase tracking-widest"
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
            />
            <SellerButton
              label={editingCoupon ? 'Finalize Changes' : 'Launch Promotion'}
              type="submit"
              className="h-12 px-8 !rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/5"
              loading={submitting}
            />
          </div>
        </form>
      </SellerModal>

      {isError ? (
        <SellerErrorState
          message={normalizeApiError(error, 'Unable to load coupons.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {isLoading ? (
        <SellerLoader label="Loading coupons..." />
      ) : null}
    </div>
  );
};

export default CouponManagementPage;
