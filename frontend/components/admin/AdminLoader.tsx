import React from 'react';

interface AdminLoaderProps {
  label?: string;
  compact?: boolean;
}

const AdminLoader = ({ label = 'Loading admin data...', compact = false }: AdminLoaderProps) => {
  return (
    <div
      className={`flex items-center justify-center gap-3 rounded-2xl border border-zinc-100 bg-white/75 ${
        compact ? 'p-4' : 'p-8'
      }`}
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-700" />
      <span className="text-sm font-bold text-zinc-500">{label}</span>
    </div>
  );
};

export default AdminLoader;
