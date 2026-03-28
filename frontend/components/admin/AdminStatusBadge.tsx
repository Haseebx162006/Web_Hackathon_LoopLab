import React from 'react';
import { toSentenceCase } from '@/utils/adminUtils';

interface AdminStatusBadgeProps {
  status?: string | null;
}

const getStatusClasses = (status?: string | null) => {
  if (!status) {
    return 'bg-zinc-100 text-zinc-600';
  }

  const value = status.toLowerCase();

  if (['active', 'approved', 'success', 'delivered', 'completed', 'shipped', 'confirmed', 'packed'].includes(value)) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (['pending', 'processing', 'requested'].includes(value)) {
    return 'bg-amber-100 text-amber-700';
  }

  if (['rejected', 'blocked', 'failed', 'cancelled', 'suspended', 'returned'].includes(value)) {
    return 'bg-rose-100 text-rose-700';
  }

  return 'bg-zinc-100 text-zinc-600';
};

const AdminStatusBadge = ({ status }: AdminStatusBadgeProps) => {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getStatusClasses(
        status
      )}`}
    >
      {status ? toSentenceCase(status) : '--'}
    </span>
  );
};

export default AdminStatusBadge;
