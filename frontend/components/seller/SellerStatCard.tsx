import React from 'react';

interface SellerStatCardProps {
  title: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'danger';
}

const SellerStatCard = ({ title, value, hint, tone = 'default', className = '', style = {} }: SellerStatCardProps & { className?: string; style?: React.CSSProperties }) => {
  const hasBg = /\bbg-/.test(className);
  return (
    <div
      style={style}
      className={`glass rounded-[2.5rem] p-7 space-y-5 border backdrop-blur-2xl transition-all duration-500 hover:shadow-brand-hover/10 ${
        tone === 'danger' ? 'border-rose-100/50 bg-rose-50/30' : `${!hasBg && !style.backgroundColor && !style.background ? 'bg-white/80' : ''} border-white/80 shadow-sm`
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-gray-400/80">{title}</p>
        <div className="h-1.5 w-1.5 rounded-full bg-brand-purple/40 animate-pulse" />
      </div>
      
      <div className="flex items-end justify-between gap-4">
        <div>
           <p className="text-3xl md:text-4xl font-light tracking-tight text-gray-900">{value}</p>
           {hint ? (
             <p className="mt-1 text-[10px] font-light uppercase tracking-widest text-zinc-400">
               {hint}
             </p>
           ) : null}
        </div>
        
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-offwhite/80 border border-white/50 shadow-inner">
           <span className="text-xs text-brand-purple">→</span>
        </div>
      </div>
    </div>
  );
};

export default SellerStatCard;
