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
import { 
  IoTrendingUpOutline, 
  IoCartOutline, 
  IoStarOutline,
  IoCalendarOutline,
  IoFilterOutline,
  IoCubeOutline,
  IoCashOutline
} from 'react-icons/io5';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa6';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import SellerButton from '@/components/seller/SellerButton';
import SellerCard from '@/components/seller/SellerCard';
import SellerErrorState from '@/components/seller/SellerErrorState';
import SellerInput from '@/components/seller/SellerInput';
import SellerLoader from '@/components/seller/SellerLoader';
import SellerPageHeader from '@/components/seller/SellerPageHeader';
import SellerSelect from '@/components/seller/SellerSelect';
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

  const PURPLE = '#B066FF';
  const PINK = '#FF70A1';

  const handleExportExcel = () => {
    if (!analytics || chartData.length === 0) {
      toast.error('No analytics data to export');
      return;
    }

    const summaryData = [{
      'Metric': 'Total Revenue',
      'Value': formatCurrency(analytics.revenue)
    }, {
      'Metric': 'Total Orders',
      'Value': formatNumber(analytics.ordersCount)
    }, {
      'Metric': 'Top Products Count',
      'Value': formatNumber(analytics.topProducts.length)
    }];

    const trendData = chartData.map(row => ({
      'Period': row.period,
      'Revenue': formatCurrency(row.revenue),
      'Orders': row.orders
    }));

    const topProductsData = analytics.topProducts.map(p => ({
      'Product Name': p.productName || 'Unnamed',
      'SKU': p.skuCode || '--',
      'Units Sold': p.unitsSold,
      'Revenue': formatCurrency(p.revenue)
    }));

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    const trendSheet = XLSX.utils.json_to_sheet(trendData);
    const productsSheet = XLSX.utils.json_to_sheet(topProductsData);

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    XLSX.utils.book_append_sheet(workbook, trendSheet, 'Trends');
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Top Products');

    XLSX.writeFile(workbook, `seller_analytics_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Excel report generated');
  };

  const handleExportPDF = () => {
    if (!analytics || chartData.length === 0) {
      toast.error('No analytics data to export');
      return;
    }

    const doc = new jsPDF();
    
    doc.text('Sales Analytics Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 14, 22);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    // Summary
    doc.setFontSize(12);
    doc.text('Summary', 14, 38);
    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', formatCurrency(analytics.revenue)],
        ['Total Orders', formatNumber(analytics.ordersCount)],
        ['Top Products', formatNumber(analytics.topProducts.length)]
      ],
      startY: 42,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], fontSize: 9 },
      styles: { fontSize: 8 }
    });

    // Top Products
    const finalY = (doc as any).lastAutoTable.finalY || 70;
    doc.text('Top Selling Products', 14, finalY + 10);
    autoTable(doc, {
      head: [['Product', 'SKU', 'Units Sold', 'Revenue']],
      body: analytics.topProducts.slice(0, 10).map(p => [
        p.productName || 'Unnamed',
        p.skuCode || '--',
        p.unitsSold,
        formatCurrency(p.revenue)
      ]),
      startY: finalY + 14,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], fontSize: 9 },
      styles: { fontSize: 8 }
    });

    doc.save(`seller_analytics_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('PDF report generated');
  };

  return (
    <div className="space-y-8">
      <SellerPageHeader
        title="Sales Analytics"
        description="Analyze revenue trends, monitor order volume, and identify top-selling products by date range."
      />

      {/* Filter Controls */}
      <SellerCard className="bg-white/80 border border-white/60">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-zinc-100/50 -m-6 lg:-m-8">
          <div className="flex-1 p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <IoCalendarOutline className="absolute left-4 top-[42px] text-zinc-400 text-lg pointer-events-none z-10" />
                <SellerInput
                  label="Start Date"
                  type="date"
                  className="!pl-12"
                  value={pendingFilters.startDate}
                  onChange={(event) =>
                    setPendingFilters((prev) => ({
                      ...prev,
                      startDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="relative">
                <IoCalendarOutline className="absolute left-4 top-[42px] text-zinc-400 text-lg pointer-events-none z-10" />
                <SellerInput
                  label="End Date"
                  type="date"
                  className="!pl-12"
                  value={pendingFilters.endDate}
                  onChange={(event) =>
                    setPendingFilters((prev) => ({
                      ...prev,
                      endDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="relative">
                <IoFilterOutline className="absolute left-4 top-[42px] text-zinc-400 text-lg pointer-events-none z-10" />
                <SellerSelect
                  label="Group By"
                  className="!pl-12"
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
              </div>
            </div>
          </div>
          
          <div className="flex-initial p-6 lg:p-8 flex items-end gap-2">
            <SellerButton 
              label="Apply Filters" 
              onClick={applyFilters}
              className="h-12 px-8 !rounded-2xl"
              loading={isFetching}
            />
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white border border-zinc-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all font-semibold text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
              title="Export Excel"
            >
              <FaFileExcel className="text-lg" />
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white border border-zinc-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all font-semibold text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
              title="Export PDF"
            >
              <FaFilePdf className="text-lg" />
            </button>
          </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="relative group">
           <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-200 to-teal-100 rounded-4xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
           <SellerCard className="relative bg-white/80 backdrop-blur-xl border border-white/60">
              <div className="flex items-start justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Total Revenue</p>
                    <p className="mt-2 text-3xl font-light tracking-tight text-black">{formatCurrency(analytics?.revenue ?? 0)}</p>
                 </div>
                 <div className="h-10 w-10 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100/50">
                    <IoCashOutline className="text-emerald-400 text-lg" />
                 </div>
              </div>
              <p className="mt-4 text-[10px] font-medium text-emerald-600 flex items-center gap-1.5 uppercase tracking-wider">
                 <span className="h-1 w-1 rounded-full bg-emerald-400"></span>
                 {isFetching ? 'Updating...' : 'Selected range'}
              </p>
           </SellerCard>
        </div>

        <div className="relative group">
           <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-200 to-purple-100 rounded-4xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
           <SellerCard className="relative bg-white/80 backdrop-blur-xl border border-white/60">
              <div className="flex items-start justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Total Orders</p>
                    <p className="mt-2 text-3xl font-light tracking-tight text-black">{formatNumber(analytics?.ordersCount ?? 0)}</p>
                 </div>
                 <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100/50">
                    <IoCartOutline className="text-indigo-400 text-lg" />
                 </div>
              </div>
              <p className="mt-4 text-[10px] font-medium text-indigo-600 flex items-center gap-1.5 uppercase tracking-wider">
                 <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
                 {analytics?.groupBy ? `Grouped by ${analytics.groupBy}` : 'Selected range'}
              </p>
           </SellerCard>
        </div>

        <div className="relative group">
           <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-200 to-orange-100 rounded-4xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
           <SellerCard className="relative bg-white/80 border border-white/60">
              <div className="flex items-start justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Top Products</p>
                    <p className="mt-2 text-3xl font-light tracking-tight text-amber-600">{formatNumber(analytics?.topProducts.length ?? 0)}</p>
                 </div>
                 <div className="h-10 w-10 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100/50">
                    <IoStarOutline className="text-amber-400 text-lg" />
                 </div>
              </div>
              <p className="mt-4 text-[10px] font-medium text-amber-600 flex items-center gap-1.5 uppercase tracking-wider">
                 <span className="h-1 w-1 rounded-full bg-amber-400"></span>
                 Ranked by units sold
              </p>
           </SellerCard>
        </div>
      </div>

      {isLoading ? (
        <SellerLoader label="Loading analytics charts..." />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Revenue Chart */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-100 to-pink-50 rounded-[2.5rem] blur opacity-10"></div>
            <SellerCard className="relative bg-purple-50/30 border border-white/60">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-light tracking-tight text-gray-900">Revenue Performance</h2>
                  <p className="mt-1 text-sm font-light text-zinc-500">Total revenue in selected period.</p>
                </div>
                <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center border border-purple-100 shadow-sm">
                  <IoTrendingUpOutline className="text-brand-purple text-xl" />
                </div>
              </div>

              {chartData.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center rounded-3xl border border-purple-100/50 bg-white/40 backdrop-blur-sm">
                  <p className="text-sm font-light text-zinc-400 italic">No chart data available for this range.</p>
                </div>
              ) : (
                <div className="h-[300px] animate-fade-in-up relative">
                  {isFetching ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10 rounded-2xl">
                      <div className="h-4 w-4 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
                    </div>
                  ) : null}
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PURPLE} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={PURPLE} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={10}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `${val >= 1000 ? Math.round(val / 1000) + 'k' : val}`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }}
                        formatter={(value) => formatCurrency(Number(value ?? 0))}
                      />
                      <Area type="monotone" dataKey="revenue" stroke={PURPLE} strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SellerCard>
          </div>

          {/* Orders Chart */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-100 to-rose-50 rounded-[2.5rem] blur opacity-10"></div>
            <SellerCard className="relative bg-pink-50/30 border border-white/60">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-light tracking-tight text-gray-900">Order Volume</h2>
                  <p className="mt-1 text-sm font-light text-zinc-500">Order count over the selected period.</p>
                </div>
                <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center border border-pink-100 shadow-sm">
                  <IoCartOutline className="text-pink-500 text-xl" />
                </div>
              </div>

              {chartData.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center rounded-3xl border border-pink-100/50 bg-white/40 backdrop-blur-sm">
                  <p className="text-sm font-light text-zinc-400 italic">No order trend data available.</p>
                </div>
              ) : (
                <div className="h-[300px] animate-fade-in-up relative">
                  {isFetching ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10 rounded-2xl">
                      <div className="h-4 w-4 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
                    </div>
                  ) : null}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }} 
                        contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }}
                        formatter={(value) => formatNumber(Number(value ?? 0))}
                      />
                      <Bar dataKey="orders" fill={PINK} radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SellerCard>
          </div>
        </div>
      )}

      {/* Top Products Table */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-linear-to-b from-zinc-100 to-transparent rounded-[2.5rem] blur opacity-10"></div>
        <SellerCard className="relative bg-white/80 border border-white/60 overflow-hidden" noPadding>
          <div className="p-6 lg:p-8 flex items-center justify-between border-b border-zinc-50 bg-zinc-50/30">
            <div>
              <h2 className="text-xl font-light tracking-tight text-black flex items-center gap-3">
                Top-Selling Products
                <span className="text-[10px] font-bold bg-zinc-100 text-zinc-400 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  {analytics?.topProducts.length ?? 0} Items
                </span>
              </h2>
              <p className="mt-1 text-sm font-light text-zinc-500">Products sorted by units sold in the selected date range.</p>
            </div>
            <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center border border-zinc-100 shadow-sm">
              <IoCubeOutline className="text-zinc-400 text-xl" />
            </div>
          </div>

          {(analytics?.topProducts.length ?? 0) === 0 ? (
            <div className="p-20 text-center">
              <IoCubeOutline className="text-4xl text-zinc-200 mx-auto mb-4" />
              <p className="text-sm font-light text-zinc-400">No top-selling products in this range.</p>
            </div>
          ) : (
            <SellerTable headers={['Product Name', 'SKU Code', 'Units Sold', 'Revenue Generated']}>
              {analytics?.topProducts.map((product) => (
                <tr key={product.productId} className="group hover:bg-black/2 transition-colors border-b border-zinc-50 last:border-0">
                  <td className="px-6 py-5 font-light">
                    <p className="text-sm font-light text-black">{product.productName || 'Unnamed product'}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-3 py-1 rounded-lg">
                      {product.skuCode || '--'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-400"></div>
                      <span className="text-sm font-light text-zinc-600">{formatNumber(product.unitsSold)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-light text-emerald-600">{formatCurrency(product.revenue)}</span>
                  </td>
                </tr>
              ))}
            </SellerTable>
          )}
        </SellerCard>
      </div>
    </div>
  );
};

export default AnalyticsPage;
