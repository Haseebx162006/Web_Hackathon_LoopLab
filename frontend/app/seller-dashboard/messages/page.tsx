'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import MarketplaceChatPanel from '@/components/chat/MarketplaceChatPanel';

const SellerMessagesPage = () => {
  const [isSeller] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    return Boolean(token && storedRole === 'seller');
  });

  if (!isSeller) {
    return (
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-zinc-100 bg-white/85 p-8 text-center shadow-[0_14px_35px_-22px_rgba(0,0,0,0.25)]">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">Protected Area</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-900">Seller messages are protected</h1>
        <p className="mt-3 text-sm font-medium text-zinc-500">
          Login with a seller account to access buyer conversations.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-black px-4 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
          >
            Login
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
          >
            Home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <MarketplaceChatPanel
      role="seller"
      title="Buyer Conversations"
      description="Respond to buyer questions fast, share context images, and close conversations when issues are resolved."
      allowResolve
    />
  );
};

export default SellerMessagesPage;
