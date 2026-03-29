'use client';

import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SellerCard from '@/components/seller/SellerCard';
import SellerErrorState from '@/components/seller/SellerErrorState';
import SellerLoader from '@/components/seller/SellerLoader';
import SellerPageHeader from '@/components/seller/SellerPageHeader';
import SellerStatCard from '@/components/seller/SellerStatCard';
import {
  useGetSellerAnalyticsQuery,
  useGetSellerDashboardQuery,
  useGetSellerProductsQuery,
} from '@/store/sellerApi';
import {
  dateMonthsAgoIso,
  formatCurrency,
  formatDate,
  formatNumber,
  normalizeApiError,
  todayIso,
} from '@/utils/sellerUtils';

const DashboardHomePage = () => {
  const [chartRange, setChartRange] = useState<'weekly' | 'monthly'>('weekly');

  const today = todayIso();
  const monthStart = dateMonthsAgoIso(5);

  const {
    data: dashboardResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetSellerDashboardQuery();

  const {
    data: analyticsResponse,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = useGetSellerAnalyticsQuery({
    startDate: monthStart,
    endDate: today,
    groupBy: 'month',
  });

  const { data: productsResponse } = useGetSellerProductsQuery();
  const productsData = productsResponse?.data;
  const dashboard = dashboardResponse?.data;
  const monthlyAnalytics = analyticsResponse?.data;

  const weeklySeries = useMemo(() => {
    const salesMap = new Map(dashboard?.salesGraphData?.map((point) => [point._id, point.amount]) ?? []);

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const isoDate = date.toISOString().slice(0, 10);

      return {
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: salesMap.get(isoDate) ?? 0,
      };
    });
  }, [dashboard?.salesGraphData]);

  const monthlySeries = useMemo(() => {
    return (monthlyAnalytics?.salesGraphData ?? []).map((point) => ({
      label: point.period,
      sales: point.revenue,
      orders: point.ordersCount,
    }));
  }, [monthlyAnalytics?.salesGraphData]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    (productsData || []).forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [productsData]);

  const topProductsData = useMemo(() => {
    return (monthlyAnalytics?.topProducts ?? []).slice(0, 5).map((p) => ({
      name: p.productName || 'Product',
      revenue: p.revenue,
      units: p.unitsSold,
    }));
  }, [monthlyAnalytics?.topProducts]);

  const PINK = '#FF70A1';
  const PURPLE = '#B066FF';
  const SOFT_PURPLE = '#D4A5FF';
  const CHART_COLORS = [PURPLE, PINK, '#818CF8', '#F472B6', SOFT_PURPLE];

  const stockEffectiveness = useMemo(() => {
    const total = (productsData || []).length || 1;
    const low = dashboard?.lowStock.length || 0;
    const healthy = total - low;
    const percent = Math.round((healthy / total) * 100);
    return [{ name: 'Healthy', value: percent, fill: PURPLE }];
  }, [productsData, dashboard?.lowStock]);

  const chartData = chartRange === 'weekly' ? weeklySeries : monthlySeries;

  return (
    <div className="space-y-8">
      <SellerPageHeader
        title="Seller Dashboard"
        description="Track sales performance, monitor order flow, and react early to low-stock risks from one central workspace."
      />

      {isError ? (
        <SellerErrorState
          message={normalizeApiError(error, 'Unable to load dashboard metrics.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SellerStatCard
          title="Total Sales"
          value={formatCurrency(dashboard?.totalSales ?? 0)}
          hint="Delivered"
          style={{ backgroundColor: 'rgba(216, 180, 254, 0.15)' }}
        />
        <SellerStatCard
          title="Total Orders"
          value={formatNumber(dashboard?.totalOrders ?? 0)}
          hint="All time"
          style={{ backgroundColor: 'rgba(244, 114, 182, 0.15)' }}
        />
        <SellerStatCard
          title="Pending Orders"
          value={formatNumber(dashboard?.pendingOrders ?? 0)}
          hint="Needs action"
          style={{ backgroundColor: 'rgba(186, 230, 253, 0.15)' }}
        />
        <SellerStatCard
          title="Low Stock Alerts"
          value={formatNumber(dashboard?.lowStock.length ?? 0)}
          hint="Under threshold"
          tone={(dashboard?.lowStock.length ?? 0) > 0 ? 'danger' : 'default'}
          style={{ backgroundColor: 'rgba(251, 113, 133, 0.15)' }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SellerCard className="xl:col-span-2 bg-purple-50/30">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-light tracking-tight text-gray-900">Revenue Performance</h2>
              <p className="text-sm font-light text-zinc-500">Real-time sales trajectory and growth metrics.</p>
            </div>
            <div className="inline-flex rounded-2xl bg-white/50 p-1 shadow-inner border border-white">
              <button
                type="button"
                onClick={() => setChartRange('weekly')}
                className={`rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  chartRange === 'weekly' ? 'bg-white text-brand-purple shadow-sm' : 'text-zinc-400 hover:text-gray-600'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setChartRange('monthly')}
                className={`rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  chartRange === 'monthly' ? 'bg-white text-brand-purple shadow-sm' : 'text-zinc-400 hover:text-gray-600'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          <div className="h-[350px] animate-fade-in-up relative">
            {chartRange === 'monthly' && analyticsLoading ? (
               <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10 rounded-2xl">
                 <SellerLoader compact label="Loading metrics..." />
               </div>
            ) : null}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PURPLE} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={PURPLE} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `$${val >= 1000 ? Math.round(val / 1000) + 'k' : val}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }}
                />
                <Area type="monotone" dataKey="sales" stroke={PURPLE} strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SellerCard>

        <SellerCard className="flex flex-col justify-between bg-indigo-50/30">
          <div>
            <h2 className="text-xl font-light tracking-tight text-gray-900">Inventory Health</h2>
            <p className="mt-1 text-sm font-light text-zinc-500">Stock availability ratio.</p>
          </div>
          <div className="relative h-[250px] w-full flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                   cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" 
                   barSize={20} data={stockEffectiveness} startAngle={180} endAngle={0}
                >
                   <RadialBar background dataKey="value" cornerRadius={15} />
                </RadialBarChart>
             </ResponsiveContainer>
             <div className="absolute top-[60%] flex flex-col items-center">
                <span className="text-4xl font-extralight text-brand-purple">{stockEffectiveness[0].value}%</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Stable</span>
             </div>
          </div>
          <div className="space-y-4">
             <div className="flex items-center justify-between text-xs font-light">
                <span className="text-zinc-500">In Stock</span>
                <span className="text-gray-900">{(productsData?.length || 0) - (dashboard?.lowStock.length || 0)} Units</span>
             </div>
             <div className="h-px w-full bg-gray-100" />
             <div className="flex items-center justify-between text-xs font-light">
                <span className="text-zinc-500">Total Products</span>
                <span className="text-gray-900">{productsData?.length || 0} Units</span>
             </div>
          </div>
        </SellerCard>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <SellerCard className="bg-pink-50/30">
          <h2 className="text-xl font-light tracking-tight text-gray-900">Market Reach</h2>
          <p className="mt-1 text-sm font-light text-zinc-500">Category sales penetration.</p>
          <div className="mt-6 h-[250px] relative">
            {chartRange === 'monthly' && analyticsLoading ? (
               <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[2px] z-10 rounded-2xl">
                 <div className="h-4 w-4 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
               </div>
            ) : null}
            {!analyticsLoading && categoryData.length === 0 ? (
               <div className="flex h-full items-center justify-center text-xs font-light text-zinc-400 italic">
                 No category data available.
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} innerRadius={65} outerRadius={90} paddingAngle={8} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SellerCard>

        <SellerCard className="bg-rose-50/30">
          <h2 className="text-xl font-light tracking-tight text-gray-900">Order Pulse</h2>
          <p className="mt-1 text-sm font-light text-zinc-500">Daily transaction volume.</p>
          <div className="mt-6 h-[250px] relative">
            {isLoading ? (
               <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[2px] z-10 rounded-2xl">
                 <div className="h-4 w-4 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
               </div>
            ) : null}
            {!isLoading && weeklySeries.length === 0 ? (
               <div className="flex h-full items-center justify-center text-xs font-light text-zinc-400 italic">
                 No inventory data available.
               </div>
            ) : (
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklySeries}>
                     <Bar dataKey="sales" fill={PINK} radius={[10, 10, 0, 0]} />
                     <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                  </BarChart>
               </ResponsiveContainer>
            )}
          </div>
        </SellerCard>

        <SellerCard className="bg-orange-50/30">
           <h2 className="text-xl font-light tracking-tight text-gray-900">Top Categories</h2>
           <div className="mt-6 space-y-6">
              {categoryData.slice(0, 4).map((cat, i) => (
                <div key={cat.name} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-light">
                    <span className="text-zinc-500 uppercase tracking-tighter">{cat.name}</span>
                    <span className="text-gray-900">{cat.value} items</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100/50 overflow-hidden text-[0px]">
                    <div 
                      className="h-full rounded-full" 
                      style={{ width: `${(cat.value / (productsData?.length || 1)) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} 
                    />
                  </div>
                </div>
              ))}
           </div>
        </SellerCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SellerCard className="xl:col-span-2 bg-blue-50/30">
          <h2 className="text-xl font-light tracking-tight text-gray-900">Best Performing Assets</h2>
          <p className="mt-1 text-sm font-light text-zinc-500">Revenue generation by individual SKU.</p>
          <div className="mt-8 h-[300px] relative">
            {chartRange === 'monthly' && analyticsLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[2px] z-10 rounded-2xl">
                <div className="h-4 w-4 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
              </div>
            ) : null}
            {!analyticsLoading && topProductsData.length === 0 ? (
               <div className="flex h-full items-center justify-center text-xs font-light text-zinc-400 italic">
                 No product performance data.
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none' }} />
                  <Bar dataKey="revenue" fill={PURPLE} radius={[0, 15, 15, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SellerCard>

        <SellerCard className="bg-emerald-50/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-light tracking-tight text-gray-900">Critical Alerts</h2>
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          </div>

          {isLoading ? <SellerLoader compact label="Scanning..." /> : null}

          {!isLoading && (dashboard?.lowStock.length ?? 0) === 0 ? (
            <div className="rounded-4xl bg-emerald-100/30 p-8 text-center border border-emerald-200/50">
              <p className="text-sm font-light text-emerald-700">All systems optimal.</p>
            </div>
          ) : null}

          {!isLoading && (dashboard?.lowStock.length ?? 0) > 0 ? (
            <div className="space-y-4">
              {dashboard?.lowStock.slice(0, 5).map((item) => (
                <div key={item._id} className="flex items-center gap-4 rounded-3xl border border-rose-100/50 bg-white/60 p-4 transition-all hover:bg-rose-50/40">
                  <div className="h-10 w-10 shrink-0 rounded-2xl bg-rose-500/10 flex items-center justify-center text-xs font-bold text-rose-500 shadow-sm border border-rose-100">
                    {item.stockQuantity}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-light text-gray-900">{item.productName}</p>
                    <p className="text-[10px] font-bold text-rose-500/60 uppercase tracking-widest mt-0.5">Critical Stock</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </SellerCard>
      </div>

      <SellerCard>
        <div className="flex flex-wrap items-center gap-6 text-sm font-light text-zinc-400">
          <span className="rounded-full bg-zinc-100/50 px-4 py-1.5 text-[10px] font-light uppercase tracking-[0.2em] text-zinc-500 backdrop-blur-sm border border-zinc-100/10">
            Realtime Status
          </span>
          <span className="tracking-wide">Dashboard data synchronizes automatically with store activity.</span>
          <span className="ml-auto text-[11px] uppercase tracking-widest text-zinc-300">Sync: {formatDate(new Date())}</span>
        </div>
      </SellerCard>
    </div>
  );
};

export default DashboardHomePage;
