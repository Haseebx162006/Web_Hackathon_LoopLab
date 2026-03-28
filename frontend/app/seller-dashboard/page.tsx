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
              <h2 className="text-xl font-black tracking-tight text-black">Sales Overview</h2>
              <p className="text-sm text-zinc-500">Weekly or monthly revenue trend from live orders.</p>
            </div>
            <div className="inline-flex rounded-2xl bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() => setChartRange('weekly')}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                  chartRange === 'weekly' ? 'bg-black text-white' : 'text-zinc-500'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setChartRange('monthly')}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                  chartRange === 'monthly' ? 'bg-black text-white' : 'text-zinc-500'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {chartBusy ? <SellerLoader compact label="Loading sales chart..." /> : null}

          {!chartBusy && chartData.length === 0 ? (
            <p className="rounded-2xl border border-zinc-100 bg-white/70 p-6 text-sm font-semibold text-zinc-500">
              No sales data available for the selected range.
            </p>
          ) : null}

          {!chartBusy && chartData.length > 0 ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                  <XAxis dataKey="label" stroke="#71717a" fontSize={12} />
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
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#111827"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#111827' }}
                    activeDot={{ r: 6 }}
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
          <h2 className="text-xl font-black tracking-tight text-black">Low Stock Alerts</h2>
          <p className="mt-1 text-sm text-zinc-500">Products currently below configured inventory threshold.</p>

          {isLoading ? <div className="mt-5"><SellerLoader compact label="Checking stock levels..." /></div> : null}

          {!isLoading && (dashboard?.lowStock.length ?? 0) === 0 ? (
            <p className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              Great job. No low-stock products right now.
            </p>
          ) : null}

          {!isLoading && (dashboard?.lowStock.length ?? 0) > 0 ? (
            <ul className="mt-5 space-y-3">
              {dashboard?.lowStock.map((item) => (
                <li key={item._id} className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4">
                  <p className="text-sm font-black text-zinc-800">{item.productName}</p>
                  <p className="mt-1 text-xs font-semibold text-zinc-500">Stock left: {item.stockQuantity}</p>
                  <p className="mt-1 text-xs font-semibold text-zinc-500">Price: {formatCurrency(item.price)}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </SellerCard>
      </div>

      <SellerCard>
        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-zinc-600">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-zinc-500">
            Data freshness
          </span>
          <span>Dashboard data refreshes automatically after CRUD actions and order updates.</span>
          <span className="text-zinc-400">Last render: {formatDate(new Date())}</span>
        </div>
      </SellerCard>
    </div>
  );
};

export default DashboardHomePage;
