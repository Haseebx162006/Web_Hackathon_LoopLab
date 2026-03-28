import React from 'react';

interface SellerPageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

const SellerPageHeader = ({ title, description, action }: SellerPageHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">Seller Workspace</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black">{title}</h1>
        <p className="max-w-2xl text-sm font-medium text-zinc-500">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
};

export default SellerPageHeader;
