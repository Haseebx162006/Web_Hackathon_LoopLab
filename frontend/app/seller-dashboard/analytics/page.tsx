'use client';

import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import toast from 'react-hot-toast';
import SellerButton from '@/components/seller/SellerButton';
import SellerCard from '@/components/seller/SellerCard';
import SellerErrorState from '@/components/seller/SellerErrorState';
import SellerInput from '@/components/seller/SellerInput';
import SellerLoader from '@/components/seller/SellerLoader';
import SellerPageHeader from '@/components/seller/SellerPageHeader';
import SellerSelect from '@/components/seller/SellerSelect';
import SellerStatCard from '@/components/seller/SellerStatCard';
import SellerTable from '@/components/seller/SellerTable';
import { useGetSellerAnalyticsQuery, type SellerAnalyticsQuery } from '@/store/sellerApi';
import {
  dateDaysAgoIso,
  formatCurrency,
  formatNumber,
  normalizeApiError,
  todayIso,
} from '@/utils/sellerUtils';

const AnalyticsPage = () => {
  const [pendingFilters, setPendingFilters] = useState<SellerAnalyticsQuery>({
    startDate: dateDaysAgoIso(30),
    endDate: todayIso(),
    groupBy: 'day',
  });

  const [filters, setFilters] = useState<SellerAnalyticsQuery>(pendingFilters);

  const {
    data: analyticsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetSellerAnalyticsQuery(filters);

  const analytics = analyticsResponse?.data;

  const chartData = useMemo(() => {
    return (analytics?.salesGraphData ?? []).map((row) => ({
      period: row.period,
      revenue: row.revenue,
      orders: row.ordersCount,
    }));
  }, [analytics?.salesGraphData]);

  const applyFilters = () => {
    if (new Date(pendingFilters.endDate).getTime() < new Date(pendingFilters.startDate).getTime()) {
      toast.error('End date must be on or after start date.');
      return;
    }

    setFilters({ ...pendingFilters });
  };

  return (
    <div className="space-y-8">
      <SellerPageHeader
        title="Sales Analytics"
        description="Analyze revenue trends, monitor order volume, and identify top-selling products by date range."
      />

      <SellerCard>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_220px_auto] md:items-end">
          <SellerInput
            label="Start Date"
            type="date"
            value={pendingFilters.startDate}
            onChange={(event) =>
              setPendingFilters((prev) => ({
                ...prev,
                startDate: event.target.value,
              }))
            }
          />
          <SellerInput
            label="End Date"
            type="date"
            value={pendingFilters.endDate}
            onChange={(event) =>
              setPendingFilters((prev) => ({
                ...prev,
                endDate: event.target.value,
              }))
            }
          />
          <SellerSelect
            label="Group By"
            value={pendingFilters.groupBy}
            onChange={(event) =>
              setPendingFilters((prev) => ({
                ...prev,
                groupBy: event.target.value as 'day' | 'week' | 'month',
              }))
            }
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
            ]}
          />
          <SellerButton label="Apply Filters" onClick={applyFilters} />
        </div>
      </SellerCard>

      {isError ? (
        <SellerErrorState
          message={normalizeApiError(error, 'Unable to load analytics data.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SellerStatCard
          title="Revenue"
          value={formatCurrency(analytics?.revenue ?? 0)}
          hint={isFetching ? 'Updating...' : 'Selected range'}
        />
        <SellerStatCard
          title="Orders"
          value={formatNumber(analytics?.ordersCount ?? 0)}
          hint={analytics?.groupBy ? `Grouped by ${analytics.groupBy}` : 'Selected range'}
        />
        <SellerStatCard
          title="Top Products"
          value={formatNumber(analytics?.topProducts.length ?? 0)}
          hint="Ranked by units sold"
        />
      </div>

      {isLoading ? (
        <SellerLoader label="Loading analytics charts..." />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SellerCard>
            <h2 className="text-xl font-light tracking-tight text-black">Revenue Trend</h2>
            <p className="mt-1 text-sm font-light text-zinc-500">Total revenue in selected period.</p>

            {chartData.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-5 text-sm font-semibold text-zinc-500">
                No chart data available for this range.
              </p>
            ) : (
              <div className="mt-4 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#111827" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#111827" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                    <XAxis dataKey="period" stroke="#71717a" fontSize={12} />
                    <YAxis
                      stroke="#71717a"
                      fontSize={12}
                      tickFormatter={(value) => {
                        const numeric = Number(value);
                        if (numeric >= 1000) return `$${Math.round(numeric / 1000)}k`;
                        return `$${numeric}`;
                      }}
                    />
                    <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                    <Area type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={2} fill="url(#revenueFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </SellerCard>

          <SellerCard>
            <h2 className="text-xl font-light tracking-tight text-black">Order Count Trend</h2>
            <p className="mt-1 text-sm font-light text-zinc-500">Order volume over the selected period.</p>

            {chartData.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-5 text-sm font-semibold text-zinc-500">
                No order trend data available.
              </p>
            ) : (
              <div className="mt-4 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                    <XAxis dataKey="period" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} />
                    <Tooltip formatter={(value) => formatNumber(Number(value ?? 0))} />
                    <Bar dataKey="orders" fill="#111827" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SellerCard>
        </div>
      )}

      <SellerCard>
        <h2 className="text-xl font-light tracking-tight text-black">Top-Selling Products</h2>
        <p className="mt-1 text-sm font-light text-zinc-500">Products sorted by units sold in the selected date range.</p>

        {(analytics?.topProducts.length ?? 0) === 0 ? (
          <p className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-6 text-sm font-semibold text-zinc-500">
            No top-selling products in this range.
          </p>
        ) : (
          <div className="mt-4">
            <SellerTable headers={['Product', 'SKU', 'Units Sold', 'Revenue']} compact>
              {analytics?.topProducts.map((product) => (
                <tr key={product.productId} className="group hover:bg-zinc-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-light text-zinc-800">
                    {product.productName || 'Unnamed product'}
                  </td>
                  <td className="px-4 py-3 text-[11px] font-light uppercase tracking-widest text-zinc-400">
                    {product.skuCode || '--'}
                  </td>
                  <td className="px-4 py-3 text-sm font-light text-zinc-600">{formatNumber(product.unitsSold)}</td>
                  <td className="px-4 py-3 text-sm font-light text-zinc-700">{formatCurrency(product.revenue)}</td>
                </tr>
              ))}
            </SellerTable>
          </div>
        )}
      </SellerCard>
    </div>
  );
};

export default AnalyticsPage;
