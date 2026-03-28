'use client';

import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RootState } from '@/store/store';
import {
  useGetAdminAnalyticsQuery,
  useGetAdminDashboardQuery,
} from '@/store/adminApi';
import AdminCard from '@/components/admin/AdminCard';
import AdminErrorState from '@/components/admin/AdminErrorState';
import AdminLoader from '@/components/admin/AdminLoader';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatCard from '@/components/admin/AdminStatCard';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminTable from '@/components/admin/AdminTable';
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  isAdminAuthenticated,
  normalizeApiError,
} from '@/utils/adminUtils';

const AdminDashboardHomePage = () => {
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isAdmin = (role === 'admin' && isAuthenticated) || isAdminAuthenticated();

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const {
    data: dashboardResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAdminDashboardQuery(undefined, { skip: !isAdmin });

  const {
    data: analyticsResponse,
    isLoading: analyticsLoading,
    isFetching: analyticsFetching,
    isError: analyticsError,
    error: analyticsErrorObject,
    refetch: refetchAnalytics,
  } = useGetAdminAnalyticsQuery({ period }, { skip: !isAdmin });

  const dashboard = dashboardResponse?.data;
  const analytics = analyticsResponse?.data;

  const revenueSeries = useMemo(() => {
    return analytics?.revenueChart ?? [];
  }, [analytics?.revenueChart]);

  const orderSeries = useMemo(() => {
    return analytics?.orderTrends ?? [];
  }, [analytics?.orderTrends]);

  const topCategories = useMemo(() => {
    return (analytics?.topCategories ?? []).slice(0, 6);
  }, [analytics?.topCategories]);

  const chartBusy = analyticsLoading || analyticsFetching;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Admin Dashboard"
        description="Track platform health in real-time across users, orders, payments, and category performance."
        action={
          <div className="inline-flex rounded-2xl bg-zinc-100 p-1">
            {(['daily', 'weekly', 'monthly'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition ${
                  period === value ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        }
      />

      {isError ? (
        <AdminErrorState
          message={normalizeApiError(error, 'Unable to load dashboard metrics.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          title="Total Users"
          value={formatNumber(dashboard?.totalUsers ?? 0)}
          hint="All roles"
        />
        <AdminStatCard
          title="Buyers"
          value={formatNumber(dashboard?.totalBuyers ?? 0)}
          hint="Accounts"
          tone="success"
        />
        <AdminStatCard
          title="Sellers"
          value={formatNumber(dashboard?.totalSellers ?? 0)}
          hint="Accounts"
          tone="warning"
        />
        <AdminStatCard
          title="Orders"
          value={formatNumber(dashboard?.totalOrders ?? 0)}
          hint="Lifetime"
        />
        <AdminStatCard
          title="Delivered Revenue"
          value={formatCurrency(dashboard?.totalRevenue ?? 0)}
          hint="Delivered"
          tone="success"
        />
      </div>

      {isLoading || isFetching ? <AdminLoader label="Loading dashboard overview..." /> : null}

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
        <AdminCard className="2xl:col-span-2">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight text-black">Revenue Trend</h2>
              <p className="text-sm font-semibold text-zinc-500">Payments captured successfully over the selected period.</p>
            </div>
            <p className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              {period} view
            </p>
          </div>

          {chartBusy ? <AdminLoader compact label="Loading revenue chart..." /> : null}

          {!chartBusy && revenueSeries.length === 0 ? (
            <p className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6 text-sm font-semibold text-zinc-500">
              No revenue entries yet for this time window.
            </p>
          ) : null}

          {!chartBusy && revenueSeries.length > 0 ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueSeries} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                  <YAxis
                    stroke="#71717a"
                    fontSize={12}
                    tickFormatter={(value) => {
                      const numeric = Number(value);
                      if (numeric >= 1000) {
                        return `$${Math.round(numeric / 1000)}k`;
                      }
                      return `$${numeric}`;
                    }}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                    labelStyle={{ color: '#111827', fontWeight: 700 }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#111827"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#111827' }}
                    activeDot={{ r: 6 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {analyticsError ? (
            <div className="mt-4">
              <AdminErrorState
                message={normalizeApiError(analyticsErrorObject, 'Unable to load analytics chart.')}
                onRetry={() => {
                  void refetchAnalytics();
                }}
              />
            </div>
          ) : null}
        </AdminCard>

        <AdminCard>
          <h2 className="text-xl font-black tracking-tight text-black">Top Categories</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-500">Most purchased categories by quantity.</p>

          {chartBusy ? <div className="mt-5"><AdminLoader compact label="Computing categories..." /></div> : null}

          {!chartBusy && topCategories.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
              Category analytics will appear once orders are placed.
            </p>
          ) : null}

          {!chartBusy && topCategories.length > 0 ? (
            <ul className="mt-5 space-y-3">
              {topCategories.map((category, index) => (
                <li key={`${category.category}-${index}`} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-zinc-800">{category.category || 'Uncategorized'}</p>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                      {formatNumber(category.totalSales)} sold
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-6 rounded-2xl border border-zinc-100 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Active users in 30 days</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-zinc-500">Buyers</p>
                <p className="text-2xl font-black tracking-tight text-zinc-900">
                  {formatNumber(analytics?.activeUsers.buyers ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500">Sellers</p>
                <p className="text-2xl font-black tracking-tight text-zinc-900">
                  {formatNumber(analytics?.activeUsers.sellers ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </AdminCard>
      </div>

      <AdminCard>
        <h2 className="text-xl font-black tracking-tight text-black">Order Volume Trend</h2>
        <p className="mt-1 text-sm font-semibold text-zinc-500">Platform-wide order count movement over time.</p>

        {chartBusy ? <div className="mt-5"><AdminLoader compact label="Loading order trend..." /></div> : null}

        {!chartBusy && orderSeries.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
            No order trend data is available yet.
          </p>
        ) : null}

        {!chartBusy && orderSeries.length > 0 ? (
          <div className="mt-5 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderSeries} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip />
                <Bar dataKey="orders" name="Orders" fill="#111827" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </AdminCard>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <AdminCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black tracking-tight text-black">Recent Users</h2>
            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
            >
              Refresh
            </button>
          </div>

          <AdminTable headers={['User', 'Role', 'Status', 'Joined']} minWidthClassName="min-w-[700px]">
            {(dashboard?.recentUsers ?? []).map((item) => (
              <tr key={item._id} className="align-top">
                <td className="px-4 py-3">
                  <p className="text-sm font-black text-zinc-900">{item.name || item.storeName || item.email}</p>
                  <p className="text-xs font-semibold text-zinc-500">{item.email}</p>
                </td>
                <td className="px-4 py-3">
                  <AdminStatusBadge status={item.role} />
                </td>
                <td className="px-4 py-3">
                  <AdminStatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-zinc-600">{formatDateTime(item.createdAt)}</td>
              </tr>
            ))}
          </AdminTable>
        </AdminCard>

        <AdminCard>
          <h2 className="text-xl font-black tracking-tight text-black">Recent Orders</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-500">Latest order activity from across all sellers.</p>

          <div className="mt-4">
            <AdminTable headers={['Order', 'Buyer', 'Status', 'Amount']} minWidthClassName="min-w-[700px]">
              {(dashboard?.recentOrders ?? []).map((order) => {
                const buyer = typeof order.buyerId === 'string' ? order.buyerId : order.buyerId?.email || 'Buyer';

                return (
                  <tr key={order._id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="text-sm font-black text-zinc-900">#{order._id.slice(-8)}</p>
                      <p className="text-xs font-semibold text-zinc-500">{formatDateTime(order.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-zinc-700">{buyer}</td>
                    <td className="px-4 py-3">
                      <AdminStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-sm font-black text-zinc-900">{formatCurrency(order.totalAmount)}</td>
                  </tr>
                );
              })}
            </AdminTable>
          </div>
        </AdminCard>
      </div>
    </div>
  );
};

export default AdminDashboardHomePage;
