import React from 'react';

interface SellerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  loading?: boolean;
  tone?: 'primary' | 'secondary' | 'danger';
}

const toneClasses: Record<NonNullable<SellerButtonProps['tone']>, string> = {
  primary: 'bg-black text-white hover:bg-zinc-800',
  secondary: 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
};

const SellerButton = ({
  label,
  loading = false,
  tone = 'primary',
  className = '',
  disabled,
  ...props
}: SellerButtonProps) => {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-xs font-light uppercase tracking-[0.2em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-black/5 active:scale-95 ${toneClasses[tone]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Working...
        </span>
      ) : (
        label
      )}
    </button>
  );
};

export default SellerButton;
