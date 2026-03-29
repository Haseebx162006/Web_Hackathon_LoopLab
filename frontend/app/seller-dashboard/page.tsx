'use client';

import React, { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
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
    isFetching,
    isError,
    error,
    refetch,
  } = useGetSellerDashboardQuery();

  const {
    data: analyticsResponse,
    isLoading: analyticsLoading,
    isFetching: analyticsFetching,
    isError: analyticsError,
    error: analyticsErrorObject,
    refetch: refetchAnalytics,
  } = useGetSellerAnalyticsQuery({
    startDate: monthStart,
    endDate: today,
    groupBy: 'month',
  });

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

  const chartData = chartRange === 'weekly' ? weeklySeries : monthlySeries;
  const chartBusy = chartRange === 'weekly' ? isLoading || isFetching : analyticsLoading || analyticsFetching;

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
        />
        <SellerStatCard
          title="Total Orders"
          value={formatNumber(dashboard?.totalOrders ?? 0)}
          hint="All time"
        />
        <SellerStatCard
          title="Pending Orders"
          value={formatNumber(dashboard?.pendingOrders ?? 0)}
          hint="Needs action"
        />
        <SellerStatCard
          title="Low Stock Alerts"
          value={formatNumber(dashboard?.lowStock.length ?? 0)}
          hint="Under threshold"
          tone={(dashboard?.lowStock.length ?? 0) > 0 ? 'danger' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
        <SellerCard className="2xl:col-span-2">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-light tracking-tight text-black">Sales Overview</h2>
              <p className="text-sm font-light text-zinc-500">Weekly or monthly revenue trend from live orders.</p>
            </div>
            <div className="inline-flex rounded-2xl bg-zinc-100/50 p-1 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setChartRange('weekly')}
                className={`rounded-xl px-4 py-2 text-xs font-light uppercase tracking-widest transition-all duration-300 ${
                  chartRange === 'weekly' ? 'bg-black text-white shadow-lg' : 'text-zinc-500 hover:text-black'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setChartRange('monthly')}
                className={`rounded-xl px-4 py-2 text-xs font-light uppercase tracking-widest transition-all duration-300 ${
                  chartRange === 'monthly' ? 'bg-black text-white shadow-lg' : 'text-zinc-500 hover:text-black'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {chartBusy ? <SellerLoader compact label="Loading sales chart..." /> : null}

          {!chartBusy && chartData.length === 0 ? (
            <p className="rounded-2xl border border-zinc-100 bg-white/40 backdrop-blur-sm p-6 text-sm font-light text-zinc-500">
              No sales data available for the selected range.
            </p>
          ) : null}

          {!chartBusy && chartData.length > 0 ? (
            <div className="h-[320px] animate-fade-in-up">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} dy={10} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => {
                      const numeric = Number(value);
                      if (numeric >= 1000) {
                        return `$${Math.round(numeric / 1000)}k`;
                      }
                      return `$${numeric}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#000', fontSize: '12px', fontWeight: 300 }}
                    labelStyle={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}
                    formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#000"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#000', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#000', strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {chartRange === 'monthly' && analyticsError ? (
            <div className="mt-4">
              <SellerErrorState
                message={normalizeApiError(analyticsErrorObject, 'Failed to load monthly analytics.')}
                onRetry={() => {
                  void refetchAnalytics();
                }}
              />
            </div>
          ) : null}
        </SellerCard>

        <SellerCard>
          <h2 className="text-xl font-light tracking-tight text-black">Low Stock Alerts</h2>
          <p className="mt-1 text-sm font-light text-zinc-500">Products currently below configured inventory threshold.</p>

          {isLoading ? <div className="mt-5"><SellerLoader compact label="Checking stock levels..." /></div> : null}

          {!isLoading && (dashboard?.lowStock.length ?? 0) === 0 ? (
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/30 backdrop-blur-sm p-5 text-center">
              <p className="text-sm font-light text-emerald-700">
                Great job. No low-stock products right now.
              </p>
            </div>
          ) : null}

          {!isLoading && (dashboard?.lowStock.length ?? 0) > 0 ? (
            <ul className="mt-5 space-y-4">
              {dashboard?.lowStock.map((item) => (
                <li key={item._id} className="group rounded-2xl border border-rose-100 bg-rose-50/20 p-4 transition-all hover:bg-rose-50/40">
                  <p className="text-sm font-light text-zinc-800">{item.productName}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[11px] font-light text-zinc-400 uppercase tracking-wider">Stock: {item.stockQuantity}</p>
                    <p className="text-[11px] font-light text-rose-500 uppercase tracking-wider">{formatCurrency(item.price)}</p>
                  </div>
                </li>
              ))}
            </ul>
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
