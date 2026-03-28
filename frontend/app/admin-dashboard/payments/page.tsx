'use client';

import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import {
  type AdminPaymentSummary,
  useGetAdminPaymentByIdQuery,
  useGetAdminPaymentsQuery,
  useGetAdminRefundLogsQuery,
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
  formatNumber,
  isAdminAuthenticated,
  normalizeApiError,
} from '@/utils/adminUtils';

const PAGE_SIZE = 12;

const PaymentsManagementPage = () => {
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isAdmin = (role === 'admin' && isAuthenticated) || isAdminAuthenticated();

  const [activeTab, setActiveTab] = useState<'payments' | 'refunds'>('payments');
  const [statusFilter, setStatusFilter] = useState<'success' | 'failed' | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentPage, setPaymentPage] = useState(1);
  const [refundPage, setRefundPage] = useState(1);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const {
    data: paymentsResponse,
    isLoading: paymentsLoading,
    isFetching: paymentsFetching,
    isError: paymentsError,
    error: paymentsErrorObject,
    refetch: refetchPayments,
  } = useGetAdminPaymentsQuery(
    {
      page: paymentPage,
      limit: PAGE_SIZE,
      status: statusFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
    { skip: !isAdmin }
  );

  const {
    data: refundsResponse,
    isLoading: refundsLoading,
    isFetching: refundsFetching,
    isError: refundsError,
    error: refundsErrorObject,
    refetch: refetchRefunds,
  } = useGetAdminRefundLogsQuery(
    {
      page: refundPage,
      limit: PAGE_SIZE,
    },
    { skip: !isAdmin }
  );

  const {
    data: selectedPaymentResponse,
    isLoading: selectedPaymentLoading,
    isError: selectedPaymentError,
    error: selectedPaymentErrorObject,
    refetch: refetchSelectedPayment,
  } = useGetAdminPaymentByIdQuery(selectedPaymentId || '', {
    skip: !isAdmin || !selectedPaymentId,
  });

  const payments = useMemo(() => paymentsResponse?.data?.payments ?? [], [paymentsResponse?.data?.payments]);
  const refunds = useMemo(() => refundsResponse?.data?.refunds ?? [], [refundsResponse?.data?.refunds]);
  const activeRows = activeTab === 'payments' ? payments : refunds;

  const activePagination = activeTab === 'payments'
    ? paymentsResponse?.data?.pagination
    : refundsResponse?.data?.pagination;

  const summary = useMemo(() => {
    return payments.reduce(
      (acc, payment) => {
        acc.totalAmount += payment.amount;
        if (payment.status === 'success') acc.success += 1;
        if (payment.status === 'failed') acc.failed += 1;
        if (payment.refundStatus !== 'none') acc.refundMarked += 1;
        return acc;
      },
      { totalAmount: 0, success: 0, failed: 0, refundMarked: 0 }
    );
  }, [payments]);

  const activeLoading = activeTab === 'payments'
    ? paymentsLoading || paymentsFetching
    : refundsLoading || refundsFetching;

  const selectedPayment = selectedPaymentResponse?.data;

  const renderActor = (row: AdminPaymentSummary) => {
    if (!row.userId || typeof row.userId === 'string') {
      return '--';
    }

    return row.userId.email || row.userId.name || '--';
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Payments and Refund Logs"
        description="Track payment outcomes, inspect transactions, and audit refund activity records."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-100 bg-white/85 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Page Volume</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-zinc-900">{formatNumber(payments.length)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white/85 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Success</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-emerald-700">{formatNumber(summary.success)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white/85 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Failed</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-rose-700">{formatNumber(summary.failed)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white/85 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Volume</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-zinc-900">{formatCurrency(summary.totalAmount)}</p>
        </div>
      </div>

      <AdminCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="inline-flex rounded-2xl bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition ${
                activeTab === 'payments' ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'
              }`}
            >
              Payments
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('refunds')}
              className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition ${
                activeTab === 'refunds' ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'
              }`}
            >
              Refund Logs
            </button>
          </div>

          {activeTab === 'payments' ? (
            <>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setPaymentPage(1);
                    setStatusFilter(event.target.value as 'success' | 'failed' | '');
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none transition focus:border-black"
                >
                  <option value="">All</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Start</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setPaymentPage(1);
                    setStartDate(event.target.value);
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none transition focus:border-black"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">End</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    setPaymentPage(1);
                    setEndDate(event.target.value);
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none transition focus:border-black"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setPaymentPage(1);
                  setStatusFilter('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
              >
                Reset
              </button>
            </>
          ) : null}
        </div>
      </AdminCard>

      {activeLoading ? <AdminLoader label={activeTab === 'payments' ? 'Loading payments...' : 'Loading refunds...'} /> : null}

      {activeTab === 'payments' && paymentsError ? (
        <AdminErrorState
          message={normalizeApiError(paymentsErrorObject, 'Unable to load payments')}
          onRetry={() => {
            void refetchPayments();
          }}
        />
      ) : null}

      {activeTab === 'refunds' && refundsError ? (
        <AdminErrorState
          message={normalizeApiError(refundsErrorObject, 'Unable to load refund logs')}
          onRetry={() => {
            void refetchRefunds();
          }}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.65fr_1fr]">
        <AdminCard>
          <AdminTable headers={['Transaction', 'Actor', 'Method', 'Statuses', 'Amount', 'Actions']}>
            {activeRows.map((row) => (
              <tr key={row._id} className="align-top">
                <td className="px-4 py-3">
                  <p className="text-sm font-black text-zinc-900">{row.transactionId || `PAY-${row._id.slice(-8)}`}</p>
                  <p className="text-xs font-semibold text-zinc-500">{formatDateTime(row.createdAt)}</p>
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-zinc-700">{renderActor(row)}</td>
                <td className="px-4 py-3">
                  <AdminStatusBadge status={row.paymentMethod} />
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    <AdminStatusBadge status={row.status} />
                    <AdminStatusBadge status={row.refundStatus} />
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-black text-zinc-900">{formatCurrency(row.amount)}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentId(row._id)}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </AdminTable>

          {activeRows.length === 0 && !activeLoading ? (
            <p className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
              No {activeTab} records found.
            </p>
          ) : null}

          {activePagination ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-zinc-500">
              <p>
                Showing page {activePagination.page} of {Math.max(activePagination.pages, 1)}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'payments') {
                      setPaymentPage((prev) => Math.max(1, prev - 1));
                    } else {
                      setRefundPage((prev) => Math.max(1, prev - 1));
                    }
                  }}
                  disabled={activePagination.page <= 1}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'payments') {
                      setPaymentPage((prev) => (prev < activePagination.pages ? prev + 1 : prev));
                    } else {
                      setRefundPage((prev) => (prev < activePagination.pages ? prev + 1 : prev));
                    }
                  }}
                  disabled={activePagination.page >= activePagination.pages}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </AdminCard>

        <AdminCard>
          <h2 className="text-xl font-black tracking-tight text-black">Payment Details</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-500">Select a row to inspect transaction metadata and linked order info.</p>

          {!selectedPaymentId ? (
            <p className="mt-5 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
              No transaction selected yet.
            </p>
          ) : null}

          {selectedPaymentLoading ? <div className="mt-5"><AdminLoader compact label="Loading payment details..." /></div> : null}

          {selectedPaymentId && selectedPaymentError ? (
            <div className="mt-5">
              <AdminErrorState
                message={normalizeApiError(selectedPaymentErrorObject, 'Unable to load selected transaction')}
                onRetry={() => {
                  void refetchSelectedPayment();
                }}
              />
            </div>
          ) : null}

          {selectedPayment ? (
            <div className="mt-5 space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Transaction</p>
                <p className="text-sm font-black text-zinc-900">{selectedPayment.transactionId || selectedPayment._id}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Amount</p>
                <p className="text-sm font-black text-zinc-900">{formatCurrency(selectedPayment.amount)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Payment Status</p>
                  <div className="mt-1">
                    <AdminStatusBadge status={selectedPayment.status} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Refund Status</p>
                  <div className="mt-1">
                    <AdminStatusBadge status={selectedPayment.refundStatus} />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Method</p>
                <p className="text-sm font-semibold text-zinc-700">{selectedPayment.paymentMethod.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Created</p>
                <p className="text-sm font-semibold text-zinc-700">{formatDateTime(selectedPayment.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Order Reference</p>
                <p className="text-sm font-semibold text-zinc-700">
                  {typeof selectedPayment.orderId === 'string' ? selectedPayment.orderId : selectedPayment.orderId?._id || '--'}
                </p>
              </div>
            </div>
          ) : null}
        </AdminCard>
      </div>
    </div>
  );
};

export default PaymentsManagementPage;
