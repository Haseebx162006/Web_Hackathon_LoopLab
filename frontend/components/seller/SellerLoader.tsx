import React from 'react';

interface SellerLoaderProps {
  label?: string;
  compact?: boolean;
}

const SellerLoader = ({ label = 'Loading seller data...', compact = false }: SellerLoaderProps) => {
  return (
    <div
      className={`flex items-center justify-center gap-3 rounded-2xl border border-zinc-100 bg-white/70 ${
        compact ? 'p-4' : 'p-8'
      }`}
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-700" />
      <span className="text-sm font-bold text-zinc-500">{label}</span>
    </div>
  );
};

export default SellerLoader;
