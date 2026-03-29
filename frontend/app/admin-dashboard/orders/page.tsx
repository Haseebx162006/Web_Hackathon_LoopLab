'use client';

import React, { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import {
  type AdminOrderSummary,
  useGetAdminOrderByIdQuery,
  useGetAdminOrdersQuery,
} from '@/store/adminApi';
import AdminCard from '@/components/admin/AdminCard';
import AdminErrorState from '@/components/admin/AdminErrorState';
import AdminLoader from '@/components/admin/AdminLoader';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminTable from '@/components/admin/AdminTable';
import {
  formatCurrency,
  formatDateTime,
  isAdminAuthenticated,
  normalizeApiError,
} from '@/utils/adminUtils';

const PAGE_SIZE = 12;

const ORDER_STATUSES: AdminOrderSummary['status'][] = [
  'pending',
  'processing',
  'confirmed',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
];

const RETURN_STATUSES: Array<'none' | 'requested' | 'approved' | 'rejected'> = [
  'none',
  'requested',
  'approved',
  'rejected',
];

const REFUND_STATUSES: Array<'none' | 'pending' | 'completed'> = ['none', 'pending', 'completed'];

const OrderManagementPage = () => {
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isAdmin = (role === 'admin' && isAuthenticated) || isAdminAuthenticated();

  const [statusFilter, setStatusFilter] = useState<AdminOrderSummary['status'] | ''>('');
  const [returnFilter, setReturnFilter] = useState<'none' | 'requested' | 'approved' | 'rejected' | ''>('');
  const [refundFilter, setRefundFilter] = useState<'none' | 'pending' | 'completed' | ''>('');
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);

  const {
    data: ordersResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAdminOrdersQuery(
    {
      page,
      limit: PAGE_SIZE,
      status: statusFilter || undefined,
      returnStatus: returnFilter || undefined,
      refundStatus: refundFilter || undefined,
    },
    { skip: !isAdmin }
  );

  const {
    data: selectedOrderResponse,
    isLoading: selectedOrderLoading,
    isError: selectedOrderError,
    error: selectedOrderErrorObject,
    refetch: refetchSelectedOrder,
  } = useGetAdminOrderByIdQuery(selectedOrderId || '', {
    skip: !isAdmin || !selectedOrderId,
  });

  const orders = ordersResponse?.data?.orders ?? [];
  const pagination = ordersResponse?.data?.pagination;
  const selectedOrder = selectedOrderResponse?.data;

  const handleViewOrder = (orderId: string) => {
    if (selectedOrderId === orderId) {
      void refetchSelectedOrder();
    } else {
      setSelectedOrderId(orderId);
    }

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Order Management"
        description="Monitor order lifecycle and review return/refund workflows across the platform."
      />

      <AdminCard>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[auto_auto_auto_auto]">
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Order Status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value as AdminOrderSummary['status'] | '');
              }}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none transition focus:border-black"
            >
              <option value="">All</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Return</span>
            <select
              value={returnFilter}
              onChange={(event) => {
                setPage(1);
                setReturnFilter(event.target.value as 'none' | 'requested' | 'approved' | 'rejected' | '');
              }}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none transition focus:border-black"
            >
              <option value="">All</option>
              {RETURN_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Refund</span>
            <select
              value={refundFilter}
              onChange={(event) => {
                setPage(1);
                setRefundFilter(event.target.value as 'none' | 'pending' | 'completed' | '');
              }}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none transition focus:border-black"
            >
              <option value="">All</option>
              {REFUND_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setStatusFilter('');
                setReturnFilter('');
                setRefundFilter('');
              }}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
            >
              Reset
            </button>
          </div>
        </div>
      </AdminCard>

      {isLoading || isFetching ? <AdminLoader label="Loading orders..." /> : null}

      {isError ? (
        <AdminErrorState
          message={normalizeApiError(error, 'Unable to fetch orders')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.65fr_1fr]">
        <AdminCard>
          <AdminTable headers={['Order', 'Buyer / Seller', 'Status', 'Return / Refund', 'Amount', 'Actions']}>
            {orders.map((order) => {
              const buyer = typeof order.buyerId === 'string' ? order.buyerId : order.buyerId?.email || '--';
              const seller = typeof order.sellerId === 'string' ? order.sellerId : order.sellerId?.email || '--';

              return (
                <tr key={order._id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="text-sm font-black text-zinc-900">#{order._id.slice(-8)}</p>
                    <p className="text-xs font-semibold text-zinc-500">{formatDateTime(order.createdAt)}</p>
                    <p className="text-xs font-semibold text-zinc-500">Items: {order.items.length}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-zinc-700">
                    <p>Buyer: {buyer}</p>
                    <p className="mt-1">Seller: {seller}</p>
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <AdminStatusBadge status={order.returnStatus || 'none'} />
                      <AdminStatusBadge status={order.refundStatus || 'none'} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-black text-zinc-900">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3">
                    {selectedOrderId === order._id ? (
                      <button
                        type="button"
                        onClick={() => handleViewOrder(order._id)}
                        className="rounded-lg border border-zinc-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-900"
                      >
                        Viewing
                      </button>
                    ) : (
                    <button
                      type="button"
                      onClick={() => handleViewOrder(order._id)}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
                    >
                      View
                    </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </AdminTable>

          {orders.length === 0 && !isLoading && !isError ? (
            <p className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
              No orders found for selected filters.
            </p>
          ) : null}

          {pagination ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-zinc-500">
              <p>
                Showing page {pagination.page} of {Math.max(pagination.pages, 1)}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => (prev < pagination.pages ? prev + 1 : prev))}
                  disabled={pagination.page >= pagination.pages}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </AdminCard>

        <AdminCard>
          <div ref={detailPanelRef}>
            <h2 className="text-xl font-black tracking-tight text-black">Order Detail</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-500">Select an order to review item details. Order updates are managed by the store owner (seller).</p>

            {!selectedOrderId ? (
              <p className="mt-5 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
                No order selected yet.
              </p>
            ) : null}

            {selectedOrderLoading ? <div className="mt-5"><AdminLoader compact label="Loading order details..." /></div> : null}

            {selectedOrderId && selectedOrderError ? (
              <div className="mt-5">
                <AdminErrorState
                  message={normalizeApiError(selectedOrderErrorObject, 'Unable to load selected order')}
                  onRetry={() => {
                    void refetchSelectedOrder();
                  }}
                />
              </div>
            ) : null}

            {selectedOrder ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                  <p className="text-sm font-black text-zinc-900">Order #{selectedOrder._id.slice(-8)}</p>
                  <p className="mt-1 text-xs font-semibold text-zinc-500">Created: {formatDateTime(selectedOrder.createdAt)}</p>
                  <p className="mt-1 text-xs font-semibold text-zinc-500">Tracking: {selectedOrder.trackingId || '--'}</p>
                  <p className="mt-1 text-xs font-semibold text-zinc-500">Total: {formatCurrency(selectedOrder.totalAmount)}</p>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-white p-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.14em] text-zinc-500">Items</h3>
                  <ul className="mt-3 space-y-2">
                    {selectedOrder.items.map((item) => {
                      const productName =
                        typeof item.product === 'string' || !item.product
                          ? 'Product'
                          : item.product.productName || item.product.skuCode || 'Product';

                      return (
                        <li key={item._id || `${selectedOrder._id}-${productName}`} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                          <p className="text-sm font-black text-zinc-900">{productName}</p>
                          <p className="text-xs font-semibold text-zinc-500">
                            Qty: {item.quantity} · Line total: {formatCurrency(item.quantity * item.priceAtPurchase)}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Order Status Snapshot</p>
                  <p className="text-xs font-semibold text-zinc-500">
                    Admin access is read-only for order status changes. Sellers control order, return, and refund updates.
                  </p>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="space-y-1 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Order</p>
                      <AdminStatusBadge status={selectedOrder.status} />
                    </div>
                    <div className="space-y-1 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Return</p>
                      <AdminStatusBadge status={selectedOrder.returnStatus || 'none'} />
                    </div>
                    <div className="space-y-1 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Refund</p>
                      <AdminStatusBadge status={selectedOrder.refundStatus || 'none'} />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </AdminCard>
      </div>
    </div>
  );
};

export default OrderManagementPage;
