'use client';

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import SellerBadge from '@/components/seller/SellerBadge';
import SellerButton from '@/components/seller/SellerButton';
import SellerCard from '@/components/seller/SellerCard';
import SellerErrorState from '@/components/seller/SellerErrorState';
import SellerLoader from '@/components/seller/SellerLoader';
import SellerPageHeader from '@/components/seller/SellerPageHeader';
import SellerSelect from '@/components/seller/SellerSelect';
import SellerTable from '@/components/seller/SellerTable';
import {
  useGetSellerOrdersQuery,
  useUpdateSellerOrderStatusMutation,
  type SellerOrder,
  type SellerStatusUpdate,
} from '@/store/sellerApi';
import { formatCurrency, formatDateTime, normalizeApiError } from '@/utils/sellerUtils';

interface OrderDraftState {
  status: SellerStatusUpdate;
  trackingId: string;
}

const statusOptions = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
];

const toEditableStatus = (status: string): SellerStatusUpdate => {
  if (status === 'packed' || status === 'shipped') {
    return status;
  }
  return 'confirmed';
};

const getOrderTone = (status: string) => {
  if (status === 'delivered' || status === 'shipped') {
    return 'success' as const;
  }
  if (status === 'cancelled' || status === 'returned') {
    return 'danger' as const;
  }
  if (status === 'pending' || status === 'processing') {
    return 'warning' as const;
  }
  return 'default' as const;
};

const renderAddress = (order: SellerOrder) => {
  const address = order.shippingAddress;
  if (!address) {
    return 'No address';
  }

  const parts = [address.street, address.city, address.state, address.country, address.zipCode].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'No address';
};

const OrdersManagementPage = () => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, OrderDraftState>>({});

  const {
    data: ordersResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetSellerOrdersQuery();

  const [updateOrderStatus, { isLoading: updatingStatus }] = useUpdateSellerOrderStatusMutation();

  const orders = useMemo(() => ordersResponse?.data ?? [], [ordersResponse?.data]);

  const getDraft = (order: SellerOrder): OrderDraftState => {
    return (
      drafts[order._id] ?? {
        status: toEditableStatus(order.status),
        trackingId: order.trackingId ?? '',
      }
    );
  };

  const setDraft = (orderId: string, next: Partial<OrderDraftState>) => {
    setDrafts((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] ?? { status: 'confirmed', trackingId: '' }),
        ...next,
      },
    }));
  };

  const handleSave = async (order: SellerOrder) => {
    const draft = getDraft(order);

    try {
      await updateOrderStatus({
        id: order._id,
        status: draft.status,
        trackingId: draft.trackingId,
      }).unwrap();

      toast.success(`Order ${order._id.slice(-6)} updated`);
    } catch (requestError) {
      toast.error(normalizeApiError(requestError, 'Failed to update order status.'));
    }
  };

  return (
    <div className="space-y-8">
      <SellerPageHeader
        title="Orders Management"
        description="Review buyer details, inspect item breakdowns, and update shipment status with tracking IDs."
      />

      {isError ? (
        <SellerErrorState
          message={normalizeApiError(error, 'Unable to load orders.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {isLoading ? (
        <SellerLoader label="Loading seller orders..." />
      ) : (
        <SellerCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black tracking-tight text-black">Order List</h2>
            <p className="text-xs font-semibold text-zinc-500">
              {orders.length} order(s) {isFetching ? 'refreshing...' : 'loaded'}
            </p>
          </div>

          {orders.length === 0 ? (
            <p className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-6 text-sm font-semibold text-zinc-500">
              No orders yet. New purchases will appear here.
            </p>
          ) : (
            <SellerTable
              headers={['Order', 'Buyer', 'Items', 'Address', 'Status', 'Tracking', 'Update']}
            >
              {orders.map((order) => {
                const draft = getDraft(order);
                const isExpanded = expandedOrderId === order._id;

                return (
                  <React.Fragment key={order._id}>
                    <tr>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                        >
                          <p className="text-sm font-black text-zinc-900">#{order._id.slice(-8)}</p>
                          <p className="mt-1 text-xs font-semibold text-zinc-500">{formatDateTime(order.createdAt)}</p>
                          <p className="mt-1 text-sm font-black text-zinc-700">{formatCurrency(order.total)}</p>
                        </button>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-black text-zinc-800">{order.buyer?.name || 'Unknown buyer'}</p>
                        <p className="mt-1 text-xs text-zinc-500">{order.buyer?.email || '--'}</p>
                        <p className="mt-1 text-xs text-zinc-500">{order.buyer?.phoneNumber || '--'}</p>
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-zinc-700">
                        {order.items.length} item(s)
                      </td>

                      <td className="px-4 py-4 text-xs font-semibold text-zinc-600">{renderAddress(order)}</td>

                      <td className="px-4 py-4">
                        <SellerBadge label={order.status.replace('_', ' ')} tone={getOrderTone(order.status)} />
                      </td>

                      <td className="px-4 py-4">
                        <input
                          type="text"
                          value={draft.trackingId}
                          onChange={(event) => setDraft(order._id, { trackingId: event.target.value })}
                          placeholder="Tracking ID"
                          className="w-36 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <SellerSelect
                            label="Status"
                            value={draft.status}
                            onChange={(event) => {
                              setDraft(order._id, { status: event.target.value as SellerStatusUpdate });
                            }}
                            options={statusOptions}
                          />
                          <SellerButton
                            label="Save"
                            className="w-full px-3 py-2"
                            loading={updatingStatus}
                            onClick={() => {
                              void handleSave(order);
                            }}
                          />
                        </div>
                      </td>
                    </tr>

                    {isExpanded ? (
                      <tr>
                        <td colSpan={7} className="bg-zinc-50/50 px-4 py-4">
                          <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-400">Order Items</p>
                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            {order.items.map((item) => {
                              const productData =
                                typeof item.product === 'object' && item.product !== null ? item.product : null;

                              return (
                                <div key={item._id} className="rounded-2xl border border-zinc-100 bg-white p-4">
                                  <p className="text-sm font-black text-zinc-900">
                                    {productData?.productName || 'Product unavailable'}
                                  </p>
                                  <p className="mt-1 text-xs text-zinc-500">SKU: {productData?.skuCode || '--'}</p>
                                  <p className="mt-1 text-xs text-zinc-500">Quantity: {item.quantity}</p>
                                  <p className="mt-1 text-xs text-zinc-500">
                                    Unit Price: {formatCurrency(item.priceAtPurchase)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </SellerTable>
          )}
        </SellerCard>
      )}
    </div>
  );
};

export default OrdersManagementPage;
