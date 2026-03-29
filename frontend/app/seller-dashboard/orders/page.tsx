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
          <div className="mb-4 flex items-center justify-between gap-3 animate-fade-in-up">
            <h2 className="text-xl font-light tracking-tight text-black">Order List</h2>
            <p className="text-xs font-light uppercase tracking-widest text-zinc-400">
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
                    <tr className="group hover:bg-zinc-50/50 transition-colors">
                      <td className="px-4 py-5 font-light">
                        <button
                          type="button"
                          className="text-left group/btn"
                          onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                        >
                          <p className="text-sm font-light text-zinc-900 group-hover/btn:text-black transition-colors">#{order._id.slice(-8)}</p>
                          <p className="mt-1 text-[10px] font-light uppercase tracking-widest text-zinc-400">{formatDateTime(order.createdAt)}</p>
                          <p className="mt-1.5 text-sm font-light text-zinc-800">{formatCurrency(order.total)}</p>
                        </button>
                      </td>

                      <td className="px-4 py-5 font-light">
                        <p className="text-sm font-light text-zinc-800">{order.buyer?.name || 'Unknown buyer'}</p>
                        <p className="mt-1 text-xs font-light text-zinc-400">{order.buyer?.email || '--'}</p>
                        <p className="mt-0.5 text-xs font-light text-zinc-400">{order.buyer?.phoneNumber || '--'}</p>
                      </td>

                      <td className="px-4 py-5 text-sm font-light text-zinc-600">
                        {order.items.length} item(s)
                      </td>

                      <td className="px-4 py-5 text-[11px] font-light text-zinc-400 leading-relaxed uppercase tracking-wider">{renderAddress(order)}</td>

                      <td className="px-4 py-4">
                        <SellerBadge label={order.status.replace('_', ' ')} tone={getOrderTone(order.status)} />
                      </td>

                      <td className="px-4 py-5">
                        <input
                          type="text"
                          value={draft.trackingId}
                          onChange={(event) => setDraft(order._id, { trackingId: event.target.value })}
                          placeholder="Tracking ID"
                          className="w-36 rounded-xl border border-zinc-100 bg-white/50 backdrop-blur-sm px-4 py-2.5 text-xs font-light transition-all focus:ring-1 focus:ring-black/5"
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
                        <td colSpan={7} className="bg-zinc-50/30 backdrop-blur-sm px-6 py-6 border-y border-zinc-100/50">
                          <p className="text-[10px] font-light uppercase tracking-[0.25em] text-zinc-400">Detailed Item Breakdown</p>
                          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {order.items.map((item) => {
                              const productData =
                                typeof item.product === 'object' && item.product !== null ? item.product : null;

                              return (
                                <div key={item._id} className="rounded-2xl border border-white/40 bg-white/60 p-4 shadow-sm backdrop-blur-sm transition-all hover:bg-white/80">
                                  <p className="text-sm font-light text-zinc-900 line-clamp-1">
                                    {productData?.productName || 'Product unavailable'}
                                  </p>
                                  <div className="mt-3 flex items-center justify-between">
                                    <p className="text-[10px] font-light text-zinc-400 uppercase tracking-widest">SKU: {productData?.skuCode || '--'}</p>
                                    <p className="text-[10px] font-light text-zinc-500 uppercase tracking-widest">Qty: {item.quantity}</p>
                                  </div>
                                  <p className="mt-2 text-xs font-light text-zinc-700">
                                    {formatCurrency(item.priceAtPurchase)}
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
