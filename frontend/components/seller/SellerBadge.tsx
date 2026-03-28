import React from 'react';

interface SellerBadgeProps {
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}

const toneClassMap: Record<NonNullable<SellerBadgeProps['tone']>, string> = {
  default: 'bg-zinc-100 text-zinc-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
};

const SellerBadge = ({ label, tone = 'default' }: SellerBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${toneClassMap[tone]}`}
    >
      {label}
    </span>
  );
};

export default SellerBadge;
