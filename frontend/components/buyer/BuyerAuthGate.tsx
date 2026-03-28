'use client';

import Link from 'next/link';
import React from 'react';

interface BuyerAuthGateProps {
  title?: string;
  description?: string;
}

const BuyerAuthGate = ({
  title = 'Buyer login required',
  description = 'Please login with a buyer account to access this area.',
}: BuyerAuthGateProps) => {
  return (
    <section className="mx-auto max-w-2xl rounded-[2rem] border border-zinc-100 bg-white/85 p-8 text-center shadow-[0_14px_35px_-22px_rgba(0,0,0,0.25)]">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">Protected Area</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-900">{title}</h2>
      <p className="mt-3 text-sm font-medium text-zinc-500">{description}</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          href="/login"
          className="rounded-xl bg-black px-4 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Login
        </Link>
        <Link
          href="/signup?role=buyer"
          className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
        >
          Signup
        </Link>
      </div>
    </section>
  );
};

export default BuyerAuthGate;
