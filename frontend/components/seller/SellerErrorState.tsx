import React from 'react';

interface SellerErrorStateProps {
  message: string;
  onRetry?: () => void;
}

const SellerErrorState = ({ message, onRetry }: SellerErrorStateProps) => {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-5 text-rose-700">
      <p className="text-sm font-bold">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-rose-700"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
};

export default SellerErrorState;
