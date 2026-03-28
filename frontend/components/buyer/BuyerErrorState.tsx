import React from 'react';

interface BuyerErrorStateProps {
  message: string;
  onRetry?: () => void;
}

const BuyerErrorState = ({ message, onRetry }: BuyerErrorStateProps) => {
  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
      <p className="text-sm font-bold text-rose-700">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-rose-700"
        >
          Retry
        </button>
      ) : null}
    </section>
  );
};

export default BuyerErrorState;
