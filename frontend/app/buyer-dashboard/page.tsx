'use client';

import Link from 'next/link';
import React, { useMemo, useSyncExternalStore } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import type { RootState } from '@/store/store';
import {
  type BuyerOrder,
  useGetBuyerOrdersQuery,
  useRequestBuyerOrderReturnMutation,
  useConfirmBuyerOrderReceivedMutation,
} from '@/store/buyerApi';
import BuyerAuthGate from '@/components/buyer/BuyerAuthGate';
import BuyerErrorState from '@/components/buyer/BuyerErrorState';
import BuyerLoader from '@/components/buyer/BuyerLoader';
import BuyerOrderStatusBadge from '@/components/buyer/BuyerOrderStatusBadge';
import {
  formatCurrency,
  formatDateTime,
  isBuyerAuthenticated,
  normalizeApiError,
  toSentenceCase,
} from '@/utils/buyerUtils';

const hydrationSubscribe = () => () => {};
const getHydratedClientSnapshot = () => true;
const getHydratedServerSnapshot = () => false;

const BuyerDashboardPage = () => {
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isHydrated = useSyncExternalStore(
    hydrationSubscribe,
    getHydratedClientSnapshot,
    getHydratedServerSnapshot
  );

  const isBuyer = isHydrated && ((role === 'buyer' && isAuthenticated) || isBuyerAuthenticated());

  const {
    data: ordersResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetBuyerOrdersQuery(undefined, {
    skip: !isBuyer,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const [requestReturn, { isLoading: requestingReturn }] = useRequestBuyerOrderReturnMutation();
  const [confirmReceived, { isLoading: confirmingReceived }] = useConfirmBuyerOrderReceivedMutation();

  const orders = useMemo(() => ordersResponse?.data ?? [], [ordersResponse?.data]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const delivered = orders.filter((order) => order.status === 'delivered').length;
    const pending = orders.filter((order) => ['pending', 'processing', 'confirmed', 'packed', 'shipped'].includes(order.status)).length;
    const totalSpend = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    return { totalOrders, delivered, pending, totalSpend };
  }, [orders]);

  const handleReturnRequest = async (order: BuyerOrder) => {
    try {
      await requestReturn(order._id).unwrap();
      toast.success('Return requested successfully.');
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to request return.'));
    }
  };

  const handleConfirmReceived = async (order: BuyerOrder) => {
    try {
      await confirmReceived(order._id).unwrap();
      toast.success('Order marked as received! You can now leave a review.');
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to confirm order.'));
    }
  };

  return (
    <>
      {!isBuyer ? (
        <BuyerAuthGate title="Buyer dashboard is protected" description="Login with your buyer account to track orders and request support." />
      ) : (
        <section className="space-y-6">
          <div>
            <p className="text-[10px] font-light uppercase tracking-[0.32em] text-zinc-400">Buyer Dashboard</p>
            <h1 className="text-3xl font-light tracking-tight text-zinc-900 sm:text-4xl">Orders and Support</h1>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-zinc-100 bg-white/85 p-4">
              <p className="text-[10px] font-light uppercase tracking-[0.16em] text-zinc-400">Total orders</p>
              <p className="mt-1 text-2xl font-light tracking-tight text-zinc-900">{stats.totalOrders}</p>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-white/85 p-4">
              <p className="text-[10px] font-light uppercase tracking-[0.16em] text-zinc-400">Pending</p>
              <p className="mt-1 text-2xl font-light tracking-tight text-zinc-900">{stats.pending}</p>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-white/85 p-4">
              <p className="text-[10px] font-light uppercase tracking-[0.16em] text-zinc-400">Delivered</p>
              <p className="mt-1 text-2xl font-light tracking-tight text-zinc-900">{stats.delivered}</p>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-white/85 p-4">
              <p className="text-[10px] font-light uppercase tracking-[0.16em] text-zinc-400">Total spend</p>
              <p className="mt-1 text-2xl font-light tracking-tight text-zinc-900">{formatCurrency(stats.totalSpend)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4 rounded-[2rem] border border-zinc-100 bg-white/85 p-5 shadow-[0_14px_35px_-22px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-light tracking-tight text-zinc-900">Order History</h2>
                <button
                  type="button"
                  onClick={() => {
                    void refetch();
                  }}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-[10px] font-light uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
                >
                  Refresh
                </button>
              </div>

              {isLoading ? <BuyerLoader compact label="Loading orders..." /> : null}

              {isError ? (
                <BuyerErrorState
                  message={normalizeApiError(error, 'Unable to load orders.')}
                  onRetry={() => {
                    void refetch();
                  }}
                />
              ) : null}

              {!isLoading && !isError && orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-center">
                  <p className="text-sm font-light text-zinc-500">No orders yet. Start shopping to build your order history.</p>
                  <Link
                    href="/products"
                    className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 text-xs font-light uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
                  >
                    Shop now
                  </Link>
                </div>
              ) : null}

              {!isLoading && !isError && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const legacySeller = (order as BuyerOrder & {
                      seller?: string | { _id?: string };
                    }).seller;

                    const sellerChatId =
                      typeof order.sellerId === 'string'
                        ? order.sellerId
                        : order.sellerId?._id ||
                          (typeof legacySeller === 'string' ? legacySeller : legacySeller?._id);

                    return (
                    <article key={order._id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[10px] font-light uppercase tracking-[0.2em] text-zinc-400">Order #{order._id.slice(-8)}</p>
                          <p className="text-sm font-light text-zinc-500">Placed on {formatDateTime(order.createdAt)}</p>
                        </div>
                        <BuyerOrderStatusBadge status={order.status} />
                      </div>

                      <div className="mt-3 space-y-2">
                        {order.items.map((item) => {
                          if (!item.product || typeof item.product === 'string') {
                            return null;
                          }

                          return (
                            <div key={item._id || `${order._id}-${item.product._id}`} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3">
                              <div>
                                <p className="text-sm font-light text-zinc-800">{item.product.productName}</p>
                                <p className="text-xs font-light text-zinc-500">Qty: {item.quantity}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-light text-zinc-800">{formatCurrency(item.priceAtPurchase * item.quantity)}</p>
                                <Link href={`/products/${item.product._id}`} className="text-xs font-light uppercase tracking-[0.12em] text-zinc-500 hover:text-zinc-900">
                                  View product
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-light text-zinc-800">Total: {formatCurrency(order.totalAmount)}</div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={
                              sellerChatId
                                ? `/buyer-dashboard/messages?receiverId=${sellerChatId}&orderId=${order._id}`
                                : '/buyer-dashboard/messages'
                            }
                            className="rounded-xl border border-zinc-300 px-3 py-2 text-[10px] font-light uppercase tracking-[0.15em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
                          >
                            {sellerChatId ? 'Message seller' : 'Open chats'}
                          </Link>

                          {['processing', 'confirmed', 'packed', 'shipped'].includes(order.status) ? (
                            <button
                              type="button"
                              onClick={() => { void handleConfirmReceived(order); }}
                              disabled={confirmingReceived}
                              className="rounded-xl bg-black px-3 py-2 text-[10px] font-light uppercase tracking-[0.15em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              ✓ Mark as Received
                            </button>
                          ) : null}

                          {order.status === 'delivered' ? (
                            <>
                              <Link
                                href={(() => {
                                  const firstProduct = order.items.find(item => item.product && typeof item.product !== 'string');
                                  if (firstProduct && firstProduct.product !== null && typeof firstProduct.product === 'object') {
                                    return `/products/${firstProduct.product._id}`;
                                  }
                                  return '/products';
                                })()}
                                className="rounded-xl border border-zinc-900 bg-white px-3 py-2 text-[10px] font-light uppercase tracking-[0.15em] text-zinc-900 transition hover:bg-zinc-100"
                              >
                                ★ Leave a Review
                              </Link>
                              <button
                                type="button"
                                onClick={() => { void handleReturnRequest(order); }}
                                disabled={requestingReturn}
                                className="rounded-xl border border-zinc-300 px-3 py-2 text-[10px] font-light uppercase tracking-[0.15em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Request return
                              </button>
                            </>
                          ) : null}

                          {order.returnStatus && order.returnStatus !== 'none' ? (
                            <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-light uppercase tracking-[0.15em] text-orange-700">
                              Return: {toSentenceCase(order.returnStatus)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </article>
                    );
                  })}
                </div>
              ) : null}
            </div>

          </div>
        </section>
      )}
    </>
  );
};

export default BuyerDashboardPage;
