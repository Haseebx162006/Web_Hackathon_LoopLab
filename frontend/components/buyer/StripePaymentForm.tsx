'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';

interface StripePaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  amount: number;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ onSuccess, onCancel, amount }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error('Stripe has not initialized yet.');
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // You do NOT want to specify a return_url here if we want to stay on the same page and handle success synchronously.
          // Wait, Stripe default confirmPayment redirects. If we want synchronous (no redirect), we must use redirect: 'if_required' 
        },
        redirect: 'if_required'
      });

      if (error) {
        toast.error(error.message || 'An unexpected error occurred.');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment verified successfully!');
        // Trigger the backend checkout logic
        onSuccess();
      } else {
        toast('Payment status is: ' + paymentIntent?.status);
        setIsProcessing(false);
      }
    } catch (err) {
      toast.error('Payment processing failed.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <PaymentElement />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 rounded-xl border border-zinc-200 bg-white py-3.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex flex-[2] relative items-center justify-center overflow-hidden rounded-xl bg-black py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-zinc-800 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
};

export default StripePaymentForm;
