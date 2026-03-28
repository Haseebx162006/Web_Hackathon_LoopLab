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
      <AdminPageHeader
        title="User Management"
        description="Review buyers and sellers, inspect account details, and enforce access status changes."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-100 bg-white/85 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Buyers on page</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-zinc-900">{summary.buyers}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white/85 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Sellers on page</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-zinc-900">{summary.sellers}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white/85 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Blocked</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-rose-700">{summary.blocked}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white/85 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Suspended</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-amber-700">{summary.suspended}</p>
        </div>
      </div>

      <AdminCard>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Search</span>
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Name, email, store"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none transition focus:border-black"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Role</span>
            <select
              value={roleFilter}
              onChange={(event) => {
                setPage(1);
                setRoleFilter(event.target.value as 'buyer' | 'seller' | 'admin' | '');
              }}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none transition focus:border-black"
            >
              <option value="">All roles</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value as UserStatus | '');
              }}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none transition focus:border-black"
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
              className="rounded-xl bg-black px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800"
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
              className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
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
          <AdminTable headers={['User', 'Role', 'Status', 'Last Login', 'Actions']}>
            {users.map((user) => (
              <tr key={user._id} className="align-top">
                <td className="px-4 py-3">
                  <p className="text-sm font-black text-zinc-900">{user.name || user.storeName || user.email}</p>
                  <p className="text-xs font-semibold text-zinc-500">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <AdminStatusBadge status={user.role} />
                </td>
                <td className="px-4 py-3">
                  <AdminStatusBadge status={user.status} />
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-zinc-600">{formatDateTime(user.lastLogin)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedUserId(user._id)}
                      className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleStatusUpdate(user, 'active');
                      }}
                      disabled={updatingStatus || user.role === 'admin'}
                      className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Activate
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleStatusUpdate(user, 'suspended');
                      }}
                      disabled={updatingStatus || user.role === 'admin'}
                      className="rounded-lg bg-amber-600 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Suspend
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleStatusUpdate(user, 'blocked');
                      }}
                      disabled={updatingStatus || user.role === 'admin'}
                      className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Block
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>

          {users.length === 0 && !isLoading && !isError ? (
            <p className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
              No users found for the selected filters.
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
          <h2 className="text-xl font-black tracking-tight text-black">User Details</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-500">Select a user to inspect profile and account metadata.</p>

          {!selectedUserId ? (
            <p className="mt-5 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
              No user selected yet.
            </p>
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
            <div className="mt-5 space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Name</p>
                <p className="text-sm font-black text-zinc-900">{selectedUser.name || selectedUser.storeName || '--'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Email</p>
                <p className="text-sm font-semibold text-zinc-700">{selectedUser.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Role</p>
                  <div className="mt-1">
                    <AdminStatusBadge status={selectedUser.role} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Status</p>
                  <div className="mt-1">
                    <AdminStatusBadge status={selectedUser.status} />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Created</p>
                <p className="text-sm font-semibold text-zinc-700">{formatDateTime(selectedUser.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Last Login</p>
                <p className="text-sm font-semibold text-zinc-700">{formatDateTime(selectedUser.lastLogin)}</p>
              </div>
              {selectedUser.storeName ? (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Store Name</p>
                  <p className="text-sm font-semibold text-zinc-700">{selectedUser.storeName}</p>
                </div>
              ) : null}
              {selectedUser.phoneNumber ? (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Phone</p>
                  <p className="text-sm font-semibold text-zinc-700">{selectedUser.phoneNumber}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </AdminCard>
      </div>
    </div>
  );
};

export default UsersManagementPage;
