'use client';

import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import type { RootState } from '@/store/store';
import {
  type AdminProductSummary,
  useApproveAdminProductMutation,
  useFlagAdminProductMutation,
  useGetAdminProductsQuery,
  useRejectAdminProductMutation,
} from '@/store/adminApi';
import AdminCard from '@/components/admin/AdminCard';
import AdminErrorState from '@/components/admin/AdminErrorState';
import AdminLoader from '@/components/admin/AdminLoader';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminTable from '@/components/admin/AdminTable';
import {
  formatCurrency,
  formatDateTime,
  isAdminAuthenticated,
  normalizeApiError,
} from '@/utils/adminUtils';

const PAGE_SIZE = 12;

const ProductModerationPage = () => {
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isAdmin = (role === 'admin' && isAuthenticated) || isAdminAuthenticated();

  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | ''>('');
  const [flagFilter, setFlagFilter] = useState<'all' | 'flagged' | 'clean'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<AdminProductSummary | null>(null);

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

  const [approveProduct, { isLoading: approving }] = useApproveAdminProductMutation();
  const [rejectProduct, { isLoading: rejecting }] = useRejectAdminProductMutation();
  const [flagProduct, { isLoading: flagging }] = useFlagAdminProductMutation();

  const products = useMemo(() => productsResponse?.data?.products ?? [], [productsResponse?.data?.products]);
  const pagination = productsResponse?.data?.pagination;

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

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Product Moderation"
        description="Approve listings, reject policy violations, and flag suspicious products for deeper review."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-100 bg-white/85 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Pending</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-amber-700">{summary.pending}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white/85 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Approved</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-emerald-700">{summary.approved}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white/85 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Rejected</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-rose-700">{summary.rejected}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white/85 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Flagged</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-zinc-900">{summary.flagged}</p>
        </div>
      </div>

      <AdminCard>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Search</span>
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Product name"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none transition focus:border-black"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value as 'pending' | 'approved' | 'rejected' | '');
              }}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none transition focus:border-black"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Flag</span>
            <select
              value={flagFilter}
              onChange={(event) => {
                setPage(1);
                setFlagFilter(event.target.value as 'all' | 'flagged' | 'clean');
              }}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none transition focus:border-black"
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
              className="rounded-xl bg-black px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800"
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
              className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
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
          <AdminTable headers={['Product', 'Seller', 'Price', 'Status', 'Flag', 'Actions']}>
            {products.map((product) => {
              const sellerName =
                typeof product.sellerId === 'string'
                  ? product.sellerId
                  : product.sellerId?.storeName || product.sellerId?.email || '--';

              return (
                <tr key={product._id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="text-sm font-black text-zinc-900">{product.productName}</p>
                    <p className="text-xs font-semibold text-zinc-500">SKU: {product.skuCode}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-zinc-700">{sellerName}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-black text-zinc-900">{formatCurrency(product.price)}</p>
                    {typeof product.discountPrice === 'number' && product.discountPrice > 0 ? (
                      <p className="text-xs font-semibold text-emerald-700">Discount: {formatCurrency(product.discountPrice)}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge status={product.status} />
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge status={product.isFlagged ? 'flagged' : 'clean'} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleApprove(product._id);
                        }}
                        disabled={isMutating}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleReject(product._id);
                        }}
                        disabled={isMutating}
                        className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleToggleFlag(product);
                        }}
                        disabled={isMutating}
                        className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {product.isFlagged ? 'Unflag' : 'Flag'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </AdminTable>

          {products.length === 0 && !isLoading && !isError ? (
            <p className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
              No products matched the selected filters.
            </p>
          ) : null}

          {pagination ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-zinc-500">
              <p>
                Showing page {pagination.page} of {Math.max(pagination.pages, 1)}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => (prev < pagination.pages ? prev + 1 : prev))}
                  disabled={pagination.page >= pagination.pages}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </AdminCard>

        <AdminCard>
          <h2 className="text-xl font-black tracking-tight text-black">Product Details</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-500">Select a product row to review moderation context.</p>

          {!selectedProduct ? (
            <p className="mt-5 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
              No product selected yet.
            </p>
          ) : null}

          {selectedProduct ? (
            <div className="mt-5 space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Name</p>
                <p className="text-sm font-black text-zinc-900">{selectedProduct.productName}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Description</p>
                <p className="text-sm font-semibold text-zinc-700">{selectedProduct.description || '--'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Category</p>
                  <p className="text-sm font-semibold text-zinc-700">{selectedProduct.category}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Stock</p>
                  <p className="text-sm font-semibold text-zinc-700">{selectedProduct.stockQuantity}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Status</p>
                  <div className="mt-1">
                    <AdminStatusBadge status={selectedProduct.status} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Flag</p>
                  <div className="mt-1">
                    <AdminStatusBadge status={selectedProduct.isFlagged ? 'flagged' : 'clean'} />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Created</p>
                <p className="text-sm font-semibold text-zinc-700">{formatDateTime(selectedProduct.createdAt)}</p>
              </div>
            </div>
          ) : null}
        </AdminCard>
      </div>
    </div>
  );
};

export default ProductModerationPage;
