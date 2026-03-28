import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SellerSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
}

const SellerSelect = ({ label, options, error, className = '', id, ...props }: SellerSelectProps) => {
  const inputId = id || props.name;

  return (
    <label className="block space-y-2" htmlFor={inputId}>
      <span className="block text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">{label}</span>
      <select
        id={inputId}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none transition focus:ring-2 focus:ring-black/10 ${
          error ? 'border-rose-300' : 'border-zinc-200'
        } ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs font-bold text-rose-600">{error}</p> : null}
    </label>
  );
};

export default SellerSelect;
