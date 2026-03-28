import React from 'react';

interface SellerTableProps {
  headers: string[];
  children: React.ReactNode;
  compact?: boolean;
}

const SellerTable = ({ headers, children, compact = false }: SellerTableProps) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-white/70">
      <table className="w-full min-w-[780px] text-left">
        <thead className="bg-zinc-50/80">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className={`px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 ${
                  compact ? 'text-[9px]' : ''
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">{children}</tbody>
      </table>
    </div>
  );
};

export default SellerTable;
