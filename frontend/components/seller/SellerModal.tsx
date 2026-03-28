import React from 'react';

interface SellerModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const SellerModal = ({ title, open, onClose, children }: SellerModalProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close modal" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">
        <div className="mb-5 flex items-center justify-between border-b border-zinc-100 pb-4">
          <h2 className="text-xl font-black tracking-tight text-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600"
          >
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default SellerModal;
