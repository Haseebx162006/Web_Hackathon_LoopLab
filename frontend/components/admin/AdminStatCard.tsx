import React from 'react';

interface AdminStatCardProps {
  title: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}

const toneClasses: Record<NonNullable<AdminStatCardProps['tone']>, string> = {
  default: 'border-white/40',
  success: 'border-emerald-100 bg-emerald-50/50',
  warning: 'border-amber-100 bg-amber-50/50',
  danger: 'border-rose-100 bg-rose-50/50',
};

const AdminStatCard = ({ title, value, hint, tone = 'default' }: AdminStatCardProps) => {
  return (
    <div className={`glass rounded-3xl border p-6 ${toneClasses[tone]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">{title}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="text-2xl font-black tracking-tight text-black md:text-3xl">{value}</p>
        {hint ? (
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
            {hint}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default AdminStatCard;
