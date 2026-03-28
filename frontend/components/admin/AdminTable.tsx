import React from 'react';

interface AdminTableProps {
  headers: string[];
  children: React.ReactNode;
  minWidthClassName?: string;
}

const AdminTable = ({ headers, children, minWidthClassName = 'min-w-[920px]' }: AdminTableProps) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-white/75">
      <table className={`w-full text-left ${minWidthClassName}`}>
        <thead className="bg-zinc-50/90">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
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

export default AdminTable;
