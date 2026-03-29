'use client';

import { useMemo, useState } from 'react';
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

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

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

  const categoryPieData = useMemo(() => {
    return topCategories.map((cat) => ({
      name: cat.category || 'Uncategorized',
      value: cat.totalSales,
    }));
  }, [topCategories]);

  const chartBusy = analyticsLoading || analyticsFetching;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Admin Dashboard"
        description="Track platform health in real-time across users, orders, payments, and category performance."
        action={
          <div className="inline-flex rounded-2xl bg-white border border-zinc-200 p-1 shadow-sm">
            {(['daily', 'weekly', 'monthly'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-xl px-4 py-2 text-[10px] font-light uppercase tracking-[0.2em] transition-all ${
                  period === value 
                    ? 'bg-black text-white shadow-md' 
                    : 'text-zinc-500 hover:text-black hover:bg-zinc-50'
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
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-[2rem] blur opacity-30"></div>
          <AdminStatCard
            title="Total Users"
            value={formatNumber(dashboard?.totalUsers ?? 0)}
            hint="All roles"
          />
        </div>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-[2rem] blur opacity-30"></div>
          <AdminStatCard
            title="Buyers"
            value={formatNumber(dashboard?.totalBuyers ?? 0)}
            hint="Accounts"
            tone="success"
          />
        </div>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-100 to-orange-100 rounded-[2rem] blur opacity-30"></div>
          <AdminStatCard
            title="Sellers"
            value={formatNumber(dashboard?.totalSellers ?? 0)}
            hint="Accounts"
            tone="warning"
          />
        </div>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-[2rem] blur opacity-30"></div>
          <AdminStatCard
            title="Orders"
            value={formatNumber(dashboard?.totalOrders ?? 0)}
            hint="Lifetime"
          />
        </div>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-100 to-green-100 rounded-[2rem] blur opacity-30"></div>
          <AdminStatCard
            title="Revenue"
            value={formatCurrency(dashboard?.totalRevenue ?? 0)}
            tone="success"
          />
        </div>
      </div>

      {isLoading || isFetching ? <AdminLoader label="Loading dashboard overview..." /> : null}

      {/* Modern SaaS Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-[2.5rem] blur opacity-20"></div>
          <AdminCard className="relative bg-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-light text-zinc-900">Revenue Overview</h3>
                <p className="text-2xl font-light text-black mt-1">{formatCurrency(dashboard?.totalRevenue ?? 0)}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {!chartBusy && revenueSeries.length > 0 ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueSeries} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => {
                        const numeric = Number(value);
                        if (numeric >= 1000) return `$${Math.round(numeric / 1000)}k`;
                        return `$${numeric}`;
                      }}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : chartBusy ? (
              <div className="h-[240px] flex items-center justify-center">
                <AdminLoader compact label="Loading..." />
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-sm text-zinc-400">
                No data available
              </div>
            )}
          </AdminCard>
        </div>

        {/* Order Volume Chart */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-[2.5rem] blur opacity-20"></div>
          <AdminCard className="relative bg-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-light text-zinc-900">Total Orders</h3>
                <p className="text-2xl font-light text-black mt-1">{formatNumber(dashboard?.totalOrders ?? 0)}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>

            {!chartBusy && orderSeries.length > 0 ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderSeries} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="orders" 
                      fill="#10b981" 
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : chartBusy ? (
              <div className="h-[240px] flex items-center justify-center">
                <AdminLoader compact label="Loading..." />
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-sm text-zinc-400">
                No data available
              </div>
            )}
          </AdminCard>
        </div>

        {/* User Growth Chart */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-[2.5rem] blur opacity-20"></div>
          <AdminCard className="relative bg-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-light text-zinc-900">User Distribution</h3>
                <p className="text-2xl font-light text-black mt-1">{formatNumber(dashboard?.totalUsers ?? 0)}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>

            <div className="h-[240px] flex items-center justify-center">
              <div className="w-full max-w-[280px]">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Buyers', value: dashboard?.totalBuyers ?? 0, color: '#8b5cf6' },
                        { name: 'Sellers', value: dashboard?.totalSellers ?? 0, color: '#ec4899' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#ec4899" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-xs text-zinc-600">Buyers ({formatNumber(dashboard?.totalBuyers ?? 0)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                    <span className="text-xs text-zinc-600">Sellers ({formatNumber(dashboard?.totalSellers ?? 0)})</span>
                  </div>
                </div>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* Top Categories Chart */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-100 to-orange-100 rounded-[2.5rem] blur opacity-20"></div>
          <AdminCard className="relative bg-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-light text-zinc-900">Top Categories</h3>
                <p className="text-sm font-light text-zinc-500 mt-1">Best performing categories</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>

            {!chartBusy && topCategories.length > 0 ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={topCategories} 
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis 
                      type="number" 
                      stroke="#94a3b8" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="category" 
                      stroke="#94a3b8" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar 
                      dataKey="totalSales" 
                      fill="#f59e0b" 
                      radius={[0, 6, 6, 0]}
                      maxBarSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : chartBusy ? (
              <div className="h-[240px] flex items-center justify-center">
                <AdminLoader compact label="Loading..." />
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-sm text-zinc-400">
                No data available
              </div>
            )}
          </AdminCard>
        </div>
      </div>

      {/* Active Users Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-[2rem] blur opacity-20"></div>
          <AdminCard className="relative bg-white">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-light text-zinc-500">Active Buyers</p>
                <p className="text-2xl font-light text-black">{formatNumber(analytics?.activeUsers.buyers ?? 0)}</p>
              </div>
            </div>
          </AdminCard>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-[2rem] blur opacity-20"></div>
          <AdminCard className="relative bg-white">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-light text-zinc-500">Active Sellers</p>
                <p className="text-2xl font-light text-black">{formatNumber(analytics?.activeUsers.sellers ?? 0)}</p>
              </div>
            </div>
          </AdminCard>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-[2rem] blur opacity-20"></div>
          <AdminCard className="relative bg-white">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-light text-zinc-500">Pending Orders</p>
                <p className="text-2xl font-light text-black">{formatNumber(dashboard?.pendingOrders ?? 0)}</p>
              </div>
            </div>
          </AdminCard>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-100 to-pink-100 rounded-[2rem] blur opacity-20"></div>
          <AdminCard className="relative bg-white">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-light text-zinc-500">Growth Rate</p>
                <p className="text-2xl font-light text-black">+12.5%</p>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-100 to-zinc-100 rounded-[2.5rem] blur opacity-20"></div>
          <AdminCard className="relative bg-white">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-light tracking-tight text-black">Recent Users</h2>
              <button
                type="button"
                onClick={() => {
                  void refetch();
                }}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-light uppercase tracking-[0.2em] text-zinc-700 transition hover:bg-black hover:text-white hover:border-black"
              >
                Refresh
              </button>
            </div>

            <AdminTable headers={['User', 'Role', 'Status', 'Joined']} minWidthClassName="min-w-[700px]">
              {(dashboard?.recentUsers ?? []).map((item) => (
                <tr key={item._id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="text-sm font-light text-zinc-900">{item.name || item.storeName || item.email}</p>
                    <p className="text-xs font-light text-zinc-500">{item.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge status={item.role} />
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-xs font-light text-zinc-600">{formatDateTime(item.createdAt)}</td>
                </tr>
              ))}
            </AdminTable>
          </AdminCard>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-100 to-zinc-100 rounded-[2.5rem] blur opacity-20"></div>
          <AdminCard className="relative bg-white">
            <h2 className="text-lg font-light tracking-tight text-black mb-1">Recent Orders</h2>
            <p className="text-sm font-light text-zinc-500 mb-4">Latest order activity from across all sellers.</p>

            <AdminTable headers={['Order', 'Buyer', 'Status', 'Amount']} minWidthClassName="min-w-[700px]">
              {(dashboard?.recentOrders ?? []).map((order) => {
                const buyer = typeof order.buyerId === 'string' ? order.buyerId : order.buyerId?.email || 'Buyer';

                return (
                  <tr key={order._id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="text-sm font-light text-zinc-900">#{order._id.slice(-8)}</p>
                      <p className="text-xs font-light text-zinc-500">{formatDateTime(order.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-light text-zinc-700">{buyer}</td>
                    <td className="px-4 py-3">
                      <AdminStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-sm font-light text-zinc-900">{formatCurrency(order.totalAmount)}</td>
                  </tr>
                );
              })}
            </AdminTable>
          </AdminCard>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHomePage;
