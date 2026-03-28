'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import type { RootState } from '@/store/store';
import { useProcessBuyerPaymentWebhookMutation } from '@/store/buyerApi';
import BuyerAuthGate from '@/components/buyer/BuyerAuthGate';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import { isBuyerAuthenticated, normalizeApiError } from '@/utils/buyerUtils';

const PaymentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isBuyer = (role === 'buyer' && isAuthenticated) || isBuyerAuthenticated();

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const [processWebhook, { isLoading }] = useProcessBuyerPaymentWebhookMutation();

  const orderIds = useMemo(() => {
    const fromQuery = searchParams.get('orders');
    if (fromQuery) {
      return fromQuery
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    }
    return [] as string[];
  }, [searchParams]);

  const paymentMethod = (searchParams.get('method') || 'card') as 'card' | 'wallet';

  useEffect(() => {
    if (orderIds.length > 0 || typeof window === 'undefined') {
      return;
    }

    const fromSession = sessionStorage.getItem('lastOrderIds');
    if (!fromSession) {
      return;
    }

    try {
      const parsed = JSON.parse(fromSession) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        router.replace(`/payment?orders=${encodeURIComponent(parsed.join(','))}&method=${paymentMethod}`);
      }
    } catch {
      // noop
    }
  }, [orderIds.length, paymentMethod, router]);

  const handlePay = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (orderIds.length === 0) {
      toast.error('No pending orders found for payment.');
      router.push('/checkout');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardNumber.trim() || !cardName.trim() || !expiry.trim() || !cvv.trim()) {
        toast.error('Please complete card details.');
        return;
      }
    }

    try {
      await processWebhook({
        orderIds,
        paymentStatus: 'success',
      }).unwrap();

      sessionStorage.removeItem('lastOrderIds');
      router.push(`/order-confirmation?orders=${encodeURIComponent(orderIds.join(','))}&payment=success`);
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Payment processing failed.'));
    }
  };

  return (
    <BuyerPageShell>
      {!isBuyer ? (
        <BuyerAuthGate title="Payment is for buyers" description="Login with your buyer account to complete payment." />
      ) : (
        <section className="mx-auto max-w-3xl space-y-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-zinc-400">Secure Payment</p>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">Simulated Payment Gateway</h1>
          </div>

          <form onSubmit={handlePay} className="space-y-4 rounded-[2rem] border border-zinc-100 bg-white/85 p-6 shadow-[0_14px_35px_-22px_rgba(0,0,0,0.25)]">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-sm font-semibold text-zinc-600">
              Processing {orderIds.length} order(s) via {paymentMethod.toUpperCase()}.
            </div>

            {paymentMethod === 'card' ? (
              <>
                <input
                  value={cardName}
                  onChange={(event) => setCardName(event.target.value)}
                  placeholder="Cardholder name"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none"
                />
                <input
                  value={cardNumber}
                  onChange={(event) => setCardNumber(event.target.value)}
                  placeholder="Card number"
                  inputMode="numeric"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={expiry}
                    onChange={(event) => setExpiry(event.target.value)}
                    placeholder="MM/YY"
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none"
                  />
                  <input
                    value={cvv}
                    onChange={(event) => setCvv(event.target.value)}
                    placeholder="CVV"
                    inputMode="numeric"
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none"
                  />
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-sm font-semibold text-zinc-600">
                Wallet payment selected. Click confirm to simulate successful payment webhook.
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-xl bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                {isLoading ? 'Processing...' : 'Confirm payment'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/checkout')}
                className="rounded-xl border border-zinc-200 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
              >
                Back to checkout
              </button>
            </div>
          </form>
        </section>
      )}
    </BuyerPageShell>
  );
};

export default PaymentPage;
