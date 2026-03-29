import React from 'react';
import BuyerSupportChat from './BuyerSupportChat';
import Footer from '@/components/Footer';
import Header from '../Header';

interface BuyerPageShellProps {
  children: React.ReactNode;
  withFooter?: boolean;
}

const BuyerPageShell = ({ children, withFooter = true }: BuyerPageShellProps) => {
  return (
    <div className="min-h-screen bg-brand-bg">
      <Header />
      <main className="relative">
        <div className="pointer-events-none fixed inset-0 z-0 h-screen w-full overflow-hidden">
          <div className="absolute -left-[10%] -top-[10%] h-[60%] w-[60%] rounded-full bg-[#FFB7CE]/20 blur-[130px]" />
          <div className="absolute -right-[10%] top-[20%] h-[50%] w-[50%] rounded-full bg-[#D4A5FF]/15 blur-[120px]" />
          <div className="absolute -bottom-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#D4A5FF]/10 blur-[110px]" />
          <div className="absolute bottom-[10%] right-[0%] h-[45%] w-[45%] rounded-full bg-[#FFB7CE]/15 blur-[125px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">{children}</div>
      </main>
      {withFooter ? <Footer /> : null}
      <BuyerSupportChat />
    </div>
  );
};

export default BuyerPageShell;
