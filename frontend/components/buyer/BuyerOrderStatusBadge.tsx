import React from 'react';
import type { BuyerOrderStatus } from '@/store/buyerApi';
import { toSentenceCase } from '@/utils/buyerUtils';

interface BuyerOrderStatusBadgeProps {
  status: BuyerOrderStatus;
}

const toneByStatus: Record<BuyerOrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-sky-100 text-sky-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  packed: 'bg-violet-100 text-violet-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
  return_requested: 'bg-orange-100 text-orange-700',
  returned: 'bg-zinc-200 text-zinc-700',
};

const BuyerOrderStatusBadge = ({ status }: BuyerOrderStatusBadgeProps) => {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${toneByStatus[status]}`}>
      {toSentenceCase(status)}
    </span>
  );
};

export default BuyerOrderStatusBadge;
