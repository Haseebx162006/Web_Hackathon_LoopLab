import React from 'react';
import BuyerHeader from './BuyerHeader';
import Footer from '@/components/Footer';

interface BuyerPageShellProps {
  children: React.ReactNode;
  withFooter?: boolean;
}

const BuyerPageShell = ({ children, withFooter = true }: BuyerPageShellProps) => {
  return (
    <div className="min-h-screen bg-brand-bg">
      <BuyerHeader />
      <main className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[420px] bg-[radial-gradient(circle_at_top_right,rgba(212,165,255,0.26),transparent_60%),radial-gradient(circle_at_top_left,rgba(255,183,206,0.3),transparent_55%)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">{children}</div>
      </main>
      {withFooter ? <Footer /> : null}
    </div>
  );
};

export default BuyerPageShell;
