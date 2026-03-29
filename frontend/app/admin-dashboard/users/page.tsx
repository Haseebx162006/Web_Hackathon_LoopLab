'use client';

import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import type { RootState } from '@/store/store';
import {
  type AdminUserSummary,
  useGetAdminUserByIdQuery,
  useGetAdminUsersQuery,
  useUpdateAdminUserStatusMutation,
} from '@/store/adminApi';
import AdminCard from '@/components/admin/AdminCard';
import AdminErrorState from '@/components/admin/AdminErrorState';
import AdminLoader from '@/components/admin/AdminLoader';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminTable from '@/components/admin/AdminTable';
import {
  formatDateTime,
  isAdminAuthenticated,
  normalizeApiError,
  toSentenceCase,
} from '@/utils/adminUtils';
import { FileDown, FileSpreadsheet } from 'lucide-react';

const PAGE_SIZE = 12;

type UserStatus = 'active' | 'suspended' | 'blocked';

const UsersManagementPage = () => {
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isAdmin = (role === 'admin' && isAuthenticated) || isAdminAuthenticated();

  const [roleFilter, setRoleFilter] = useState<'buyer' | 'seller' | 'admin' | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const {
    data: usersResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAdminUsersQuery(
    {
      page,
      limit: PAGE_SIZE,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      search: searchValue || undefined,
    },
    { skip: !isAdmin }
  );

  const {
    data: userResponse,
    isLoading: userLoading,
    isError: userError,
    error: userErrorObject,
    refetch: refetchUser,
  } = useGetAdminUserByIdQuery(selectedUserId || '', {
    skip: !isAdmin || !selectedUserId,
  });

  const [updateStatus, { isLoading: updatingStatus }] = useUpdateAdminUserStatusMutation();

  const users = useMemo(() => usersResponse?.data?.users ?? [], [usersResponse?.data?.users]);
  const pagination = usersResponse?.data?.pagination;

  const selectedUser = userResponse?.data;

  const summary = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        if (user.role === 'buyer') acc.buyers += 1;
        if (user.role === 'seller') acc.sellers += 1;
        if (user.status === 'blocked') acc.blocked += 1;
        if (user.status === 'suspended') acc.suspended += 1;
        return acc;
      },
      { buyers: 0, sellers: 0, blocked: 0, suspended: 0 }
    );
  }, [users]);

  const exportToPDF = () => {
    try {
      const headers = ['Name', 'Email', 'Role', 'Status', 'Last Login', 'Created At'];
      const rows = users.map(user => [
        user.name || user.storeName || user.email,
        user.email,
        toSentenceCase(user.role),
        toSentenceCase(user.status),
        formatDateTime(user.lastLogin),
        formatDateTime(user.createdAt)
      ]);

      let content = `User Management Report\nGenerated: ${new Date().toLocaleString()}\n\n`;
      content += headers.join(' | ') + '\n';
      content += '-'.repeat(100) + '\n';
      rows.forEach(row => {
        content += row.join(' | ') + '\n';
      });

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-report-${new Date().toISOString().split('T')[0]}.txt`;
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
      const headers = ['Name', 'Email', 'Role', 'Status', 'Last Login', 'Created At', 'Phone', 'Store Name'];
      const rows = users.map(user => [
        user.name || user.storeName || user.email,
        user.email,
        toSentenceCase(user.role),
        toSentenceCase(user.status),
        formatDateTime(user.lastLogin),
        formatDateTime(user.createdAt),
        (user as any).phoneNumber || '',
        (user as any).storeName || ''
      ]);

      let csv = headers.join(',') + '\n';
      rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported to CSV successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleStatusUpdate = async (user: AdminUserSummary, status: UserStatus) => {
    if (user.role === 'admin') {
      toast.error('Cannot modify another admin account');
      return;
    }

    try {
      await updateStatus({ id: user._id, status }).unwrap();
      toast.success(`Status updated to ${toSentenceCase(status)}`);
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to update user status'));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <AdminPageHeader
          title="User Management"
          description="Review buyers and sellers, inspect account details, and enforce access status changes."
        />
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportToPDF}
            disabled={users.length === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-xs font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </button>
          <button
            type="button"
            onClick={exportToExcel}
            disabled={users.length === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-xs font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-700 hover:to-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm transition hover:shadow-md">
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-blue-500/10"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Buyers on page</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{summary.buyers}</p>
          <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-purple-50 p-5 shadow-sm transition hover:shadow-md">
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-purple-500/10"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-600">Sellers on page</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{summary.sellers}</p>
          <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"></div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-rose-50 p-5 shadow-sm transition hover:shadow-md">
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-rose-500/10"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-600">Blocked</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-rose-700">{summary.blocked}</p>
          <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-rose-500 to-rose-600"></div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-amber-50 p-5 shadow-sm transition hover:shadow-md">
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-amber-500/10"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Suspended</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-amber-700">{summary.suspended}</p>
          <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-amber-500 to-amber-600"></div>
        </div>
      </div>

      <AdminCard>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">Search Users</span>
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Name, email, store..."
              className="w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">Role Filter</span>
            <select
              value={roleFilter}
              onChange={(event) => {
                setPage(1);
                setRoleFilter(event.target.value as 'buyer' | 'seller' | 'admin' | '');
              }}
              className="w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All roles</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">Status Filter</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value as UserStatus | '');
              }}
              className="w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="blocked">Blocked</option>
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
                setRoleFilter('');
                setStatusFilter('');
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

      {isLoading || isFetching ? <AdminLoader label="Loading users..." /> : null}

      {isError ? (
        <AdminErrorState
          message={normalizeApiError(error, 'Unable to fetch users')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.6fr_1fr]">
        <AdminCard>
          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <AdminTable headers={['User', 'Role', 'Status', 'Last Login', 'Actions']}>
              {users.map((user) => (
                <tr key={user._id} className="align-top transition hover:bg-zinc-50">
                  <td className="px-4 py-4">
                    <p className="text-sm font-black text-zinc-900">{user.name || user.storeName || user.email}</p>
                    <p className="mt-0.5 text-xs font-semibold text-zinc-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <AdminStatusBadge status={user.role} />
                  </td>
                  <td className="px-4 py-4">
                    <AdminStatusBadge status={user.status} />
                  </td>
                  <td className="px-4 py-4 text-xs font-semibold text-zinc-600">{formatDateTime(user.lastLogin)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(user._id)}
                        className="rounded-lg border-2 border-zinc-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-700 transition hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleStatusUpdate(user, 'active');
                        }}
                        disabled={updatingStatus || user.role === 'admin'}
                        className="rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-sm transition hover:from-emerald-700 hover:to-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Activate
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleStatusUpdate(user, 'suspended');
                        }}
                        disabled={updatingStatus || user.role === 'admin'}
                        className="rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-sm transition hover:from-amber-700 hover:to-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Suspend
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleStatusUpdate(user, 'blocked');
                        }}
                        disabled={updatingStatus || user.role === 'admin'}
                        className="rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-sm transition hover:from-rose-700 hover:to-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Block
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>
{users.length === 0 && !isLoading && !isError ? (
  <p className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
    No users found for the selected filters.
  </p>
) : null}

{pagination ? (
  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-semibold text-zinc-600">
    <p>
      Showing page {pagination.page} of {Math.max(pagination.pages, 1)} • Total: {pagination.total} users
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
        onClick={() => setPage((prev) =>
          prev < pagination.pages ? prev + 1 : prev
        )}
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
          <div className="mb-5 border-b border-zinc-200 pb-4">
            <h2 className="text-xl font-black tracking-tight text-black">User Details</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-500">Select a user to inspect profile and account metadata.</p>
          </div>

          {!selectedUserId ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
                <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-500">No user selected yet</p>
              <p className="mt-1 text-xs text-zinc-400">Click "View" on any user to see details</p>
            </div>
          ) : null}

          {userLoading ? <div className="mt-5"><AdminLoader compact label="Loading user details..." /></div> : null}

          {selectedUserId && userError ? (
            <div className="mt-5">
              <AdminErrorState
                message={normalizeApiError(userErrorObject, 'Failed to load selected user')}
                onRetry={() => {
                  void refetchUser();
                }}
              />
            </div>
          ) : null}

          {selectedUser ? (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-lg font-black text-white shadow-lg">
                    {(selectedUser.name || selectedUser.storeName || selectedUser.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-black text-zinc-900">{selectedUser.name || selectedUser.storeName || '--'}</p>
                    <p className="text-xs font-semibold text-zinc-500">{selectedUser.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Role</p>
                    <div className="mt-2">
                      <AdminStatusBadge status={selectedUser.role} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Status</p>
                    <div className="mt-2">
                      <AdminStatusBadge status={selectedUser.status} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="border-b border-zinc-100 pb-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Account Created</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-700">{formatDateTime(selectedUser.createdAt)}</p>
                </div>
                <div className="border-b border-zinc-100 pb-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Last Login</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-700">{formatDateTime(selectedUser.lastLogin)}</p>
                </div>
                {selectedUser.storeName ? (
                  <div className="border-b border-zinc-100 pb-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Store Name</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-700">{selectedUser.storeName}</p>
                  </div>
                ) : null}
                {selectedUser.phoneNumber ? (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Phone Number</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-700">{selectedUser.phoneNumber}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </AdminCard>
      </div>
    </div>
  );
};

export default UsersManagementPage;
