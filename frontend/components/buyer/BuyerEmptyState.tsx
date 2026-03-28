import Link from 'next/link';
import React from 'react';

interface BuyerEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

const BuyerEmptyState = ({ title, description, actionLabel, actionHref }: BuyerEmptyStateProps) => {
  return (
    <section className="rounded-[2rem] border border-dashed border-zinc-200 bg-white/70 p-8 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">Buyer Workspace</p>
      <h3 className="mt-3 text-2xl font-black tracking-tight text-zinc-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-zinc-500">{description}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex rounded-xl bg-black px-4 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
};

export default BuyerEmptyState;
