import React from 'react';

interface SellerStatCardProps {
  title: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'danger';
}

const SellerStatCard = ({ title, value, hint, tone = 'default' }: SellerStatCardProps) => {
  return (
    <div
      className={`glass rounded-3xl p-6 space-y-4 border ${
        tone === 'danger' ? 'border-rose-100 bg-rose-50/40' : 'border-white/40'
      }`}
    >
      <p className="text-[10px] font-light uppercase tracking-[0.3em] text-gray-400">{title}</p>
      <div className="flex items-end justify-between gap-4">
        <p className="text-2xl md:text-3xl font-light tracking-tight text-black">{value}</p>
        {hint ? (
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-light uppercase tracking-wider text-zinc-500">
            {hint}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default SellerStatCard;
