'use client';

import Link from 'next/link';
import React, { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';

const OrderConfirmationPage = () => {
  const searchParams = useSearchParams();

  const orders = useMemo(() => {
    const value = searchParams.get('orders');
    if (!value) {
      return [] as string[];
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [searchParams]);

  const paymentState = searchParams.get('payment') || 'success';

  return (
    <BuyerPageShell>
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-zinc-100 bg-white/85 p-8 text-center shadow-[0_14px_35px_-22px_rgba(0,0,0,0.25)]">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-zinc-400">Order Complete</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-zinc-900">Thank you for your purchase.</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm font-semibold text-zinc-500">
          Your order has been placed successfully. Keep this page for your order references.
        </p>

        <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-left">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Payment status</p>
          <p className="mt-1 text-sm font-bold text-zinc-700">{paymentState === 'cod' ? 'Cash on delivery selected' : 'Payment confirmed'}</p>

          <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Order IDs</p>
          {orders.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {orders.map((orderId) => (
                <li key={orderId} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-zinc-600">
                  {orderId}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm font-semibold text-zinc-500">No order IDs found in URL.</p>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/buyer-dashboard"
            className="rounded-xl bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
          >
            Go to dashboard
          </Link>
          <Link
            href="/products"
            className="rounded-xl border border-zinc-200 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
          >
            Continue shopping
          </Link>
        </div>
      </section>
    </BuyerPageShell>
  );
};

export default OrderConfirmationPage;
