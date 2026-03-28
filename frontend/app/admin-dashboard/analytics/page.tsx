'use client';

import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RootState } from '@/store/store';
import { useGetAdminAnalyticsQuery } from '@/store/adminApi';
import AdminCard from '@/components/admin/AdminCard';
import AdminErrorState from '@/components/admin/AdminErrorState';
import AdminLoader from '@/components/admin/AdminLoader';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatCard from '@/components/admin/AdminStatCard';
import {
  formatCurrency,
  formatNumber,
  isAdminAuthenticated,
  normalizeApiError,
} from '@/utils/adminUtils';

const PlatformAnalyticsPage = () => {
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isAdmin = (role === 'admin' && isAuthenticated) || isAdminAuthenticated();

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const {
    data: analyticsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAdminAnalyticsQuery({ period }, { skip: !isAdmin });

  const analytics = analyticsResponse?.data;

  const totals = useMemo(() => {
    const revenueTotal = (analytics?.revenueChart ?? []).reduce((sum, row) => sum + row.revenue, 0);
    const orderTotal = (analytics?.orderTrends ?? []).reduce((sum, row) => sum + row.orders, 0);
    const topCategory =
      (analytics?.topCategories ?? []).length > 0
        ? [...(analytics?.topCategories ?? [])].sort((a, b) => b.totalSales - a.totalSales)[0]
        : null;

    return {
      revenueTotal,
      orderTotal,
      topCategory,
      activeBuyers: analytics?.activeUsers.buyers ?? 0,
      activeSellers: analytics?.activeUsers.sellers ?? 0,
    };
  }, [analytics?.activeUsers.buyers, analytics?.activeUsers.sellers, analytics?.orderTrends, analytics?.revenueChart, analytics?.topCategories]);

  const chartBusy = isLoading || isFetching;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Platform Analytics"
        description="Analyze revenue velocity, order growth, category traction, and active user behavior."
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
          message={normalizeApiError(error, 'Unable to fetch analytics data')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard title="Revenue Total" value={formatCurrency(totals.revenueTotal)} hint={period} tone="success" />
        <AdminStatCard title="Orders Total" value={formatNumber(totals.orderTotal)} hint={period} />
        <AdminStatCard title="Active Buyers" value={formatNumber(totals.activeBuyers)} hint="30 days" tone="success" />
        <AdminStatCard title="Active Sellers" value={formatNumber(totals.activeSellers)} hint="30 days" tone="warning" />
        <AdminStatCard
          title="Top Category"
          value={totals.topCategory?.category || '--'}
          hint={totals.topCategory ? `${formatNumber(totals.topCategory.totalSales)} sold` : 'No data'}
        />
      </div>

      {chartBusy ? <AdminLoader label="Loading analytics visualizations..." /> : null}

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <AdminCard>
          <h2 className="text-xl font-black tracking-tight text-black">Revenue Timeline</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-500">Captured payment values over the chosen period.</p>

          {!chartBusy && (analytics?.revenueChart.length ?? 0) === 0 ? (
            <p className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
              Revenue data is not available yet.
            </p>
          ) : null}

          {!chartBusy && (analytics?.revenueChart.length ?? 0) > 0 ? (
            <div className="mt-5 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.revenueChart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111827" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#111827" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
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
                  <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#111827"
                    strokeWidth={3}
                    fill="url(#adminRevenueFill)"
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </AdminCard>

        <AdminCard>
          <h2 className="text-xl font-black tracking-tight text-black">Order Activity</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-500">Order traffic progression for platform demand monitoring.</p>

          {!chartBusy && (analytics?.orderTrends.length ?? 0) === 0 ? (
            <p className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
              Order trend data is not available yet.
            </p>
          ) : null}

          {!chartBusy && (analytics?.orderTrends.length ?? 0) > 0 ? (
            <div className="mt-5 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.orderTrends} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#16a34a' }}
                    activeDot={{ r: 6 }}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </AdminCard>
      </div>

      <AdminCard>
        <h2 className="text-xl font-black tracking-tight text-black">Top Categories by Sales</h2>
        <p className="mt-1 text-sm font-semibold text-zinc-500">Category contribution using ordered quantities.</p>

        {!chartBusy && (analytics?.topCategories.length ?? 0) === 0 ? (
          <p className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
            Top categories will appear after category-level order data is available.
          </p>
        ) : null}

        {!chartBusy && (analytics?.topCategories.length ?? 0) > 0 ? (
          <div className="mt-5 h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.topCategories} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                <XAxis dataKey="category" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip />
                <Bar dataKey="totalSales" name="Units Sold" fill="#111827" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </AdminCard>
    </div>
  );
};

export default PlatformAnalyticsPage;
