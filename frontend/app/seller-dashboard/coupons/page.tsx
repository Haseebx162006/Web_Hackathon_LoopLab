'use client';

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
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
      ) : (
        <SellerCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black tracking-tight text-black">Coupon List</h2>
            <p className="text-xs font-semibold text-zinc-500">
              {coupons.length} coupon(s) {isFetching ? 'refreshing...' : 'available'}
            </p>
          </div>

          {coupons.length === 0 ? (
            <p className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-6 text-sm font-semibold text-zinc-500">
              No coupons yet. Create a promotion to boost conversion.
            </p>
          ) : (
            <SellerTable
              headers={['Code', 'Type', 'Value', 'Minimum Order', 'Date Range', 'State', 'Actions']}
            >
              {coupons.map((coupon) => (
                <tr key={coupon._id}>
                  <td className="px-4 py-4 text-sm font-black uppercase tracking-wider text-zinc-800">{coupon.code}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-zinc-700">{coupon.discountType}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-zinc-700">
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}%`
                      : formatCurrency(coupon.discountValue)}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-zinc-700">
                    {formatCurrency(coupon.minOrderAmount)}
                  </td>
                  <td className="px-4 py-4 text-xs font-semibold text-zinc-600">
                    {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}
                  </td>
                  <td className="px-4 py-4">
                    <SellerBadge label={coupon.isActive ? 'Active' : 'Inactive'} tone={coupon.isActive ? 'success' : 'default'} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <SellerButton
                        label="Edit"
                        tone="secondary"
                        className="px-3 py-2"
                        onClick={() => openEdit(coupon)}
                      />
                      <SellerButton
                        label="Delete"
                        tone="danger"
                        className="px-3 py-2"
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
      )}

      <SellerModal
        title={editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          resetForm();
        }}
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SellerInput
              label="Coupon Code"
              value={formState.code}
              onChange={(event) => setFormState((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
              required
            />

            <SellerSelect
              label="Discount Type"
              value={formState.discountType}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  discountType: event.target.value as 'percentage' | 'flat',
                }))
              }
              options={[
                { value: 'percentage', label: 'Percentage' },
                { value: 'flat', label: 'Flat' },
              ]}
            />

            <SellerInput
              label="Discount Value"
              type="number"
              min="0"
              step="0.01"
              value={formState.discountValue}
              onChange={(event) => setFormState((prev) => ({ ...prev, discountValue: event.target.value }))}
              required
            />

            <SellerInput
              label="Minimum Order"
              type="number"
              min="0"
              step="0.01"
              value={formState.minOrderAmount}
              onChange={(event) => setFormState((prev) => ({ ...prev, minOrderAmount: event.target.value }))}
              required
            />

            <SellerInput
              label="Start Date"
              type="date"
              value={formState.startDate}
              onChange={(event) => setFormState((prev) => ({ ...prev, startDate: event.target.value }))}
              required
            />

            <SellerInput
              label="End Date"
              type="date"
              value={formState.endDate}
              onChange={(event) => setFormState((prev) => ({ ...prev, endDate: event.target.value }))}
              required
            />
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <input
              type="checkbox"
              checked={formState.isActive}
              onChange={(event) => setFormState((prev) => ({ ...prev, isActive: event.target.checked }))}
              className="h-4 w-4 accent-black"
            />
            <span className="text-sm font-semibold text-zinc-700">Coupon is active</span>
          </label>

          {formError ? <SellerErrorState message={formError} /> : null}

          <div className="flex flex-wrap justify-end gap-3">
            <SellerButton
              label="Cancel"
              tone="secondary"
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
            />
            <SellerButton
              label={editingCoupon ? 'Save Changes' : 'Create Coupon'}
              type="submit"
              loading={submitting}
            />
          </div>
        </form>
      </SellerModal>
    </div>
  );
};

export default CouponManagementPage;
