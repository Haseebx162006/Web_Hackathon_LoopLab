'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import type { RootState } from '@/store/store';
import {
  type AdminProductSummary,
  type TopProductByOrders,
  useApproveAdminProductMutation,
  useFlagAdminProductMutation,
  useGetAdminProductByIdQuery,
  useGetAdminProductsQuery,
  useGetAdminTopProductsQuery,
  useRejectAdminProductMutation,
  useToggleAdminFeaturedProductMutation,
} from '@/store/adminApi';
import AdminCard from '@/components/admin/AdminCard';
import AdminErrorState from '@/components/admin/AdminErrorState';
import AdminLoader from '@/components/admin/AdminLoader';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminTable from '@/components/admin/AdminTable';
import Link from 'next/link';
import { formatCurrency, formatDateTime, isAdminAuthenticated, normalizeApiError, toSentenceCase } from '@/utils/adminUtils';
import { FileDown, FileSpreadsheet, StarIcon } from 'lucide-react';

const PAGE_SIZE = 12;

const ProductModerationPage = () => {
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isAdmin = (role === 'admin' && isAuthenticated) || isAdminAuthenticated();

  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | ''>('');
  const [flagFilter, setFlagFilter] = useState<'all' | 'flagged' | 'clean'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);

  const {
    data: productsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAdminProductsQuery(
    {
      page,
      limit: PAGE_SIZE,
      status: statusFilter || undefined,
      isFlagged: flagFilter === 'all' ? undefined : flagFilter === 'flagged',
      search: searchValue || undefined,
    },
    { skip: !isAdmin }
  );

  const {
    data: selectedProductResponse,
    isLoading: selectedProductLoading,
    isError: selectedProductError,
    error: selectedProductErrorObject,
    refetch: refetchSelectedProduct,
  } = useGetAdminProductByIdQuery(selectedProductId || '', {
    skip: !isAdmin || !selectedProductId,
  });

  const [approveProduct, { isLoading: approving }] = useApproveAdminProductMutation();
  const [rejectProduct, { isLoading: rejecting }] = useRejectAdminProductMutation();
  const [flagProduct, { isLoading: flagging }] = useFlagAdminProductMutation();
  const [toggleFeatured, { isLoading: togglingFeatured }] = useToggleAdminFeaturedProductMutation();

  const {
    data: topProductsResponse,
    isLoading: topProductsLoading,
    refetch: refetchTopProducts,
  } = useGetAdminTopProductsQuery(undefined, { skip: !isAdmin });

  const products = useMemo(() => productsResponse?.data?.products ?? [], [productsResponse?.data?.products]);
  const pagination = productsResponse?.data?.pagination;
  const selectedProduct = selectedProductResponse?.data;
  const topProducts = useMemo(() => topProductsResponse?.data ?? [], [topProductsResponse?.data]);

  const summary = useMemo(() => {
    return products.reduce(
      (acc, product) => {
        if (product.status === 'pending') acc.pending += 1;
        if (product.status === 'approved') acc.approved += 1;
        if (product.status === 'rejected') acc.rejected += 1;
        if (product.isFlagged) acc.flagged += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0, flagged: 0 }
    );
  }, [products]);

  const isMutating = approving || rejecting || flagging;

  const exportToPDF = () => {
    try {
      const headers = ['Product Name', 'SKU', 'Seller', 'Price', 'Stock', 'Category', 'Status', 'Flagged'];
      const rows = products.map(product => {
        const sellerName = typeof product.sellerId === 'string'
          ? product.sellerId
          : product.sellerId?.storeName || product.sellerId?.email || '--';
        
        return [
          product.productName,
          product.skuCode,
          sellerName,
          formatCurrency(product.price),
          product.stockQuantity.toString(),
          product.category,
          toSentenceCase(product.status),
          product.isFlagged ? 'Yes' : 'No'
        ];
      });

      let content = `Product Moderation Report\nGenerated: ${new Date().toLocaleString()}\n\n`;
      content += headers.join(' | ') + '\n';
      content += '-'.repeat(120) + '\n';
      rows.forEach(row => {
        content += row.join(' | ') + '\n';
      });

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const exportToExcel = () => {
    try {
      const headers = ['Product Name', 'SKU', 'Seller', 'Price', 'Discount Price', 'Stock', 'Category', 'Status', 'Flagged', 'Created At'];
      const rows = products.map(product => {
        const sellerName = typeof product.sellerId === 'string'
          ? product.sellerId
          : product.sellerId?.storeName || product.sellerId?.email || '--';
        
        return [
          product.productName,
          product.skuCode,
          sellerName,
          product.price.toString(),
          (product.discountPrice || 0).toString(),
          product.stockQuantity.toString(),
          product.category,
          toSentenceCase(product.status),
          product.isFlagged ? 'Yes' : 'No',
          formatDateTime(product.createdAt)
        ];
      });

      let csv = headers.join(',') + '\n';
      rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported to CSV successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveProduct(id).unwrap();
      toast.success('Product approved');
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to approve product'));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectProduct(id).unwrap();
      toast.success('Product rejected');
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to reject product'));
    }
  };

  const handleToggleFlag = async (product: AdminProductSummary) => {
    try {
      await flagProduct({ id: product._id, isFlagged: !product.isFlagged }).unwrap();
      toast.success(product.isFlagged ? 'Flag removed from product' : 'Product flagged for review');
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to update product flag'));
    }
  };

  const handleToggleFeatured = async (product: TopProductByOrders) => {
    try {
      await toggleFeatured({ id: product._id, isFeatured: !product.isFeatured }).unwrap();
      toast.success(product.isFeatured ? 'Removed from Featured' : 'Added to Featured Products!');
      void refetchTopProducts();
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to update featured status'));
    }
  };

  const handleViewProduct = (productId: string) => {
    if (selectedProductId === productId) {
      void refetchSelectedProduct();
    } else {
      setSelectedProductId(productId);
    }

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Featured Products Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">Featured Products</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              Top 8 products by order volume. Toggle star to feature them on the homepage.
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700">
                {topProducts.filter(p => p.isFeatured).length}/8 featured
              </span>
            </p>
          </div>
        </div>

        {topProductsLoading ? (
          <AdminLoader label="Loading top products..." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {topProducts.length === 0 ? (
              <div className="col-span-full rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
                <p className="text-sm font-semibold text-zinc-500">No orders found yet. Products will appear here once orders are placed.</p>
              </div>
            ) : (
              topProducts.map((product) => (
                <div
                  key={product._id}
                  className={`relative overflow-hidden rounded-2xl border-2 p-4 shadow-sm transition hover:shadow-md ${
                    product.isFeatured
                      ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-white'
                      : 'border-zinc-200 bg-white'
                  }`}
                >
                  {product.isFeatured && (
                    <div className="absolute right-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow">
                      Featured
                    </div>
                  )}

                  <Link href={`/products/${product._id}`} target="_blank" className="block group">
                    <div className="mb-3 aspect-square w-full overflow-hidden rounded-xl bg-zinc-100">
                      {product.productImages?.[0] ? (
                        <img
                          src={product.productImages[0]}
                          alt={product.productName}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-400 text-xs font-semibold">No Image</div>
                      )}
                    </div>
                    <p className="text-sm font-black leading-snug text-zinc-900 group-hover:text-amber-600 transition line-clamp-2">
                      {product.productName}
                    </p>
                  </Link>

                  <p className="mt-1 text-xs font-semibold text-zinc-500">{product.category}</p>
                  <p className="mt-1 text-sm font-black text-zinc-900">{formatCurrency(product.price)}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Orders:</span>
                    <span className="text-[10px] font-black text-zinc-700">{product.orderCount}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => { void handleToggleFeatured(product); }}
                    disabled={togglingFeatured}
                    className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[10px] font-black uppercase tracking-widest transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      product.isFeatured
                        ? 'bg-amber-400 text-white hover:bg-amber-500'
                        : 'border-2 border-zinc-200 bg-white text-zinc-700 hover:border-amber-400 hover:text-amber-600'
                    }`}
                  >
                    <StarIcon className={`h-3.5 w-3.5 ${product.isFeatured ? 'fill-white' : ''}`} />
                    {product.isFeatured ? 'Remove Featured' : 'Add to Featured'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <hr className="border-zinc-200" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <AdminPageHeader
          title="Product Moderation"
          description="Approve listings, reject policy violations, and flag suspicious products for deeper review."
        />
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportToPDF}
            disabled={products.length === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-xs font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </button>
          <button
            type="button"
            onClick={exportToExcel}
            disabled={products.length === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-xs font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-700 hover:to-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-amber-50 p-5 shadow-sm transition hover:shadow-md">
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-amber-500/10"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Pending</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-amber-700">{summary.pending}</p>
          <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-amber-500 to-amber-600"></div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-emerald-50 p-5 shadow-sm transition hover:shadow-md">
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-emerald-500/10"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Approved</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-emerald-700">{summary.approved}</p>
          <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-rose-50 p-5 shadow-sm transition hover:shadow-md">
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-rose-500/10"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-600">Rejected</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-rose-700">{summary.rejected}</p>
          <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-rose-500 to-rose-600"></div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-orange-50 p-5 shadow-sm transition hover:shadow-md">
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-orange-500/10"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">Flagged</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{summary.flagged}</p>
          <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600"></div>
        </div>
      </div>

      <AdminCard>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_auto_auto_auto]">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">Search Products</span>
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Product name..."
              className="w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">Status Filter</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value as 'pending' | 'approved' | 'rejected' | '');
              }}
              className="w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">Flag Filter</span>
            <select
              value={flagFilter}
              onChange={(event) => {
                setPage(1);
                setFlagFilter(event.target.value as 'all' | 'flagged' | 'clean');
              }}
              className="w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All products</option>
              <option value="flagged">Flagged only</option>
              <option value="clean">Unflagged only</option>
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setSearchValue(searchInput.trim());
              }}
              className="rounded-xl bg-gradient-to-r from-black to-zinc-800 px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg transition hover:from-zinc-800 hover:to-black"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setStatusFilter('');
                setFlagFilter('all');
                setSearchInput('');
                setSearchValue('');
              }}
              className="rounded-xl border-2 border-zinc-300 px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-zinc-700 transition hover:border-zinc-900 hover:bg-zinc-50 hover:text-zinc-900"
            >
              Reset
            </button>
          </div>
        </div>
      </AdminCard>

      {isLoading || isFetching ? <AdminLoader label="Loading products..." /> : null}

      {isError ? (
        <AdminErrorState
          message={normalizeApiError(error, 'Unable to load products')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.65fr_1fr]">
        <AdminCard>
          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <AdminTable headers={['Product', 'Seller', 'Price', 'Status', 'Flag', 'Actions']}>
              {products.map((product) => {
                const sellerName =
                  typeof product.sellerId === 'string'
                    ? product.sellerId
                    : product.sellerId?.storeName || product.sellerId?.email || '--';

                return (
                  <tr key={product._id} className="align-top transition hover:bg-zinc-50">
                    <td className="px-4 py-4">
                      <p className="text-sm font-black text-zinc-900">{product.productName}</p>
                      <p className="mt-0.5 text-xs font-semibold text-zinc-500">SKU: {product.skuCode}</p>
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-zinc-700">{sellerName}</td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-black text-zinc-900">{formatCurrency(product.price)}</p>
                      {typeof product.discountPrice === 'number' && product.discountPrice > 0 ? (
                        <p className="mt-0.5 text-xs font-semibold text-emerald-700">Disc: {formatCurrency(product.discountPrice)}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <AdminStatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-4">
                      <AdminStatusBadge status={product.isFlagged ? 'flagged' : 'clean'} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedProductId === product._id ? (
                          <button
                            type="button"
                            onClick={() => handleViewProduct(product._id)}
                            className="rounded-lg border-2 border-zinc-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-900"
                          >
                            Viewing
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleViewProduct(product._id)}
                            className="rounded-lg border-2 border-zinc-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-700 transition hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
                          >
                            View
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            void handleApprove(product._id);
                          }}
                          disabled={isMutating}
                          className="rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-sm transition hover:from-emerald-700 hover:to-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void handleReject(product._id);
                          }}
                          disabled={isMutating}
                          className="rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-sm transition hover:from-rose-700 hover:to-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void handleToggleFlag(product);
                          }}
                          disabled={isMutating}
                          className="rounded-lg bg-gradient-to-r from-zinc-800 to-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-sm transition hover:from-black hover:to-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {product.isFlagged ? 'Unflag' : 'Flag'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </AdminTable>
          </div>

          {products.length === 0 && !isLoading && !isError ? (
            <p className="mt-4 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-sm font-semibold text-zinc-500">
              No products matched the selected filters.
            </p>
          ) : null}

          {pagination ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-semibold text-zinc-600">
              <p>
                Showing page {pagination.page} of {Math.max(pagination.pages, 1)} • Total: {pagination.total} products
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border-2 border-zinc-300 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-700 shadow-sm transition hover:border-zinc-900 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => (prev < pagination.pages ? prev + 1 : prev))}
                  disabled={pagination.page >= pagination.pages}
                  className="rounded-lg border-2 border-zinc-300 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-700 shadow-sm transition hover:border-zinc-900 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          ) : null}
        </AdminCard>

        <AdminCard>
          <div ref={detailPanelRef}>
            <div className="mb-5 border-b border-zinc-200 pb-4">
              <h2 className="text-xl font-black tracking-tight text-black">Product Details</h2>
              <p className="mt-1 text-sm font-semibold text-zinc-500">Select a product row to review moderation context.</p>
            </div>

            {!selectedProductId ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8 text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
                  <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-zinc-500">No product selected yet</p>
                <p className="mt-1 text-xs text-zinc-400">Click "View" on any product to see details</p>
              </div>
            ) : null}

            {selectedProductLoading ? (
              <div className="mt-5">
                <AdminLoader compact label="Loading product details..." />
              </div>
            ) : null}

            {selectedProductId && selectedProductError ? (
              <div className="mt-5">
                <AdminErrorState
                  message={normalizeApiError(selectedProductErrorObject, 'Unable to load selected product')}
                  onRetry={() => {
                    void refetchSelectedProduct();
                  }}
                />
              </div>
            ) : null}

            {selectedProduct ? (
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm">
                  <div className="mb-4">
                    <p className="text-lg font-black text-zinc-900">{selectedProduct.productName}</p>
                    <p className="mt-1 text-xs font-semibold text-zinc-500">SKU: {selectedProduct.skuCode}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Status</p>
                      <div className="mt-2">
                        <AdminStatusBadge status={selectedProduct.status} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Flag Status</p>
                      <div className="mt-2">
                        <AdminStatusBadge status={selectedProduct.isFlagged ? 'flagged' : 'clean'} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5">
                  <div className="border-b border-zinc-100 pb-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Description</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-700">{selectedProduct.description || '--'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-b border-zinc-100 pb-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Category</p>
                      <p className="mt-1 text-sm font-semibold text-zinc-700">{selectedProduct.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Stock Quantity</p>
                      <p className="mt-1 text-sm font-semibold text-zinc-700">{selectedProduct.stockQuantity}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-b border-zinc-100 pb-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Price</p>
                      <p className="mt-1 text-sm font-black text-zinc-900">{formatCurrency(selectedProduct.price)}</p>
                    </div>
                    {typeof selectedProduct.discountPrice === 'number' && selectedProduct.discountPrice > 0 ? (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Discount Price</p>
                        <p className="mt-1 text-sm font-black text-emerald-700">{formatCurrency(selectedProduct.discountPrice)}</p>
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Created At</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-700">{formatDateTime(selectedProduct.createdAt)}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </AdminCard>
      </div>
    </div>
  );
};

export default ProductModerationPage;
