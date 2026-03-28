import React from 'react';

interface BuyerLoaderProps {
  label?: string;
  compact?: boolean;
}

const BuyerLoader = ({ label = 'Loading buyer data...', compact = false }: BuyerLoaderProps) => {
  return (
    <div className={`flex items-center justify-center gap-3 rounded-2xl border border-zinc-100 bg-white/80 ${compact ? 'p-4' : 'p-8'}`}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-black" />
      <span className="text-sm font-bold text-zinc-500">{label}</span>
    </div>
  );
};

export default BuyerLoader;
