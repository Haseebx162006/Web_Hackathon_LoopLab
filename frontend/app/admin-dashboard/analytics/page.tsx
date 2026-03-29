'use client';

import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
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
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Package } from 'lucide-react';

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

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#6366f1'];

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

  const categoryPieData = useMemo(() => {
    return (analytics?.topCategories ?? []).map((cat) => ({
      name: cat.category,
      value: cat.totalSales,
    }));
  }, [analytics?.topCategories]);

  const userDistributionData = useMemo(() => {
    return [
      {
        name: 'Buyers',
        value: totals.activeBuyers,
        fill: '#3b82f6',
      },
      {
        name: 'Sellers',
        value: totals.activeSellers,
        fill: '#8b5cf6',
      },
    ];
  }, [totals.activeBuyers, totals.activeSellers]);

  const radialData = useMemo(() => {
    const total = totals.revenueTotal;
    const orderCount = totals.orderTotal;
    return [
      {
        name: 'Revenue',
        value: total > 0 ? 100 : 0,
        fill: '#10b981',
      },
      {
        name: 'Orders',
        value: orderCount > 0 ? (orderCount / (orderCount + 50)) * 100 : 0,
        fill: '#3b82f6',
      },
    ];
  }, [totals.revenueTotal, totals.orderTotal]);

  const chartBusy = isLoading || isFetching;

  return (
    <>
    
    <div className="space-y-8">
      <AdminPageHeader
        title="Platform Analytics"
        description="Analyze revenue velocity, order growth, category traction, and active user behavior."
        action={
          <div className="inline-flex rounded-2xl bg-gradient-to-r from-zinc-100 to-zinc-200 p-1 shadow-sm">
            {(['daily', 'weekly', 'monthly'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition ${
                  period === value 
                    ? 'bg-gradient-to-r from-black to-zinc-800 text-white shadow-lg' 
                    : 'text-zinc-600 hover:text-black'
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
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm transition hover:shadow-lg">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-10 -translate-y-10 rounded-full bg-emerald-500/10"></div>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Revenue Total</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-zinc-900">{formatCurrency(totals.revenueTotal)}</p>
          <p className="mt-1 text-xs font-semibold text-zinc-500">{period}</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm transition hover:shadow-lg">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-10 -translate-y-10 rounded-full bg-blue-500/10"></div>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Orders Total</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-zinc-900">{formatNumber(totals.orderTotal)}</p>
          <p className="mt-1 text-xs font-semibold text-zinc-500">{period}</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-purple-50 to-white p-6 shadow-sm transition hover:shadow-lg">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-10 -translate-y-10 rounded-full bg-purple-500/10"></div>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-600">Active Buyers</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-zinc-900">{formatNumber(totals.activeBuyers)}</p>
          <p className="mt-1 text-xs font-semibold text-zinc-500">30 days</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm transition hover:shadow-lg">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-10 -translate-y-10 rounded-full bg-amber-500/10"></div>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Active Sellers</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-zinc-900">{formatNumber(totals.activeSellers)}</p>
          <p className="mt-1 text-xs font-semibold text-zinc-500">30 days</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm transition hover:shadow-lg">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-10 -translate-y-10 rounded-full bg-rose-500/10"></div>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-600">Top Category</p>
          <p className="mt-2 text-lg font-black tracking-tight text-zinc-900">{totals.topCategory?.category || '--'}</p>
          <p className="mt-1 text-xs font-semibold text-zinc-500">
            {totals.topCategory ? `${formatNumber(totals.topCategory.totalSales)} sold` : 'No data'}
          </p>
        </div>
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
          {!chartBusy && (analytics?.orderTrends.length ?? 0) === 0 ? (
            <p className="mt-5 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-sm font-semibold text-zinc-500">
              Order trend data is not available yet.
            </p>
          ) : null}

          {!chartBusy && (analytics?.orderTrends.length ?? 0) > 0 ? (
            <div className="mt-5 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.orderTrends} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} fontWeight={600} />
                  <YAxis stroke="#71717a" fontSize={12} fontWeight={600} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7 }}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </AdminCard>

        <AdminCard>
          <div className="mb-5 flex items-center justify-between border-b border-zinc-200 pb-4">
            <div>
              <h2 className="text-xl font-black tracking-tight text-black">Category Distribution</h2>
              <p className="mt-1 text-sm font-semibold text-zinc-500">Sales by product category</p>
            </div>
            <Package className="h-8 w-8 text-rose-600" />
          </div>

          {!chartBusy && categoryPieData.length === 0 ? (
            <p className="mt-5 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-sm font-semibold text-zinc-500">
              Category data is not available yet.
            </p>
          ) : null}

          {!chartBusy && categoryPieData.length > 0 ? (
            <div className="mt-5 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
label={({ name, percent }) =>
  `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
}                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </AdminCard>
      </div>

      <AdminCard>
        <div className="mb-5 flex items-center justify-between border-b border-zinc-200 pb-4">
          <div>
            <h2 className="text-xl font-black tracking-tight text-black">Top Categories by Sales Volume</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-500">Category contribution using ordered quantities.</p>
          </div>
          <TrendingUp className="h-8 w-8 text-zinc-600" />
        </div>

        {!chartBusy && (analytics?.topCategories.length ?? 0) === 0 ? (
          <p className="mt-5 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-sm font-semibold text-zinc-500">
            Top categories will appear after category-level order data is available.
          </p>
        ) : null}

        {!chartBusy && (analytics?.topCategories.length ?? 0) > 0 ? (
          <div className="mt-5 h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.topCategories} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" stroke="#71717a" fontSize={12} fontWeight={600} />
                <YAxis stroke="#71717a" fontSize={12} fontWeight={600} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #e5e7eb', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="totalSales" name="Units Sold" fill="url(#colorBar)" radius={[8, 8, 0, 0]} />
</BarChart>
</ResponsiveContainer>
</div>
) : null}
</AdminCard>
    </div>
    </>
  );
};

export default PlatformAnalyticsPage;
