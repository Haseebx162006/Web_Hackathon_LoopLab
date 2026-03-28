import React from 'react';

interface AdminErrorStateProps {
  message: string;
  onRetry?: () => void;
}

const AdminErrorState = ({ message, onRetry }: AdminErrorStateProps) => {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-5 text-rose-700">
      <p className="text-sm font-bold">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-rose-700"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
};

export default AdminErrorState;
