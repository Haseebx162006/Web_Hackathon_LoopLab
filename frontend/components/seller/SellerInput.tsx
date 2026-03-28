import React from 'react';

interface SellerInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

const SellerInput = ({ label, hint, error, className = '', id, ...props }: SellerInputProps) => {
  const inputId = id || props.name;

  return (
    <label className="block space-y-2" htmlFor={inputId}>
      <span className="block text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">{label}</span>
      <input
        id={inputId}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none transition focus:ring-2 focus:ring-black/10 ${
          error ? 'border-rose-300' : 'border-zinc-200'
        } ${className}`}
        {...props}
      />
      {error ? <p className="text-xs font-bold text-rose-600">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </label>
  );
};

export default SellerInput;
