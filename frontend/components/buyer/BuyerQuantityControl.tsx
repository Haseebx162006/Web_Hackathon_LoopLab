import React from 'react';

interface BuyerQuantityControlProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const BuyerQuantityControl = ({
  value,
  min = 1,
  max,
  onChange,
  disabled = false,
}: BuyerQuantityControlProps) => {
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && (typeof max !== 'number' || value < max);

  const update = (next: number) => {
    if (disabled) {
      return;
    }

    if (next < min) {
      onChange(min);
      return;
    }

    if (typeof max === 'number' && next > max) {
      onChange(max);
      return;
    }

    onChange(next);
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-1">
      <button
        type="button"
        onClick={() => update(value - 1)}
        disabled={!canDecrease}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-lg font-black text-zinc-700 transition hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-300"
        aria-label="Decrease quantity"
      >
        -
      </button>
      <span className="min-w-8 text-center text-sm font-black text-zinc-700">{value}</span>
      <button
        type="button"
        onClick={() => update(value + 1)}
        disabled={!canIncrease}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-lg font-black text-zinc-700 transition hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-300"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
};

export default BuyerQuantityControl;
