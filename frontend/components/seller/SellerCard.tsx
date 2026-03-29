import React from 'react';

interface SellerCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  style?: React.CSSProperties;
}

const SellerCard = ({ children, className = '', noPadding = false, style = {} }: SellerCardProps) => {
  const hasBg = /\bbg-/.test(className);
  return (
    <section 
      style={style}
      className={`glass rounded-[2.5rem] backdrop-blur-3xl border border-white/60 shadow-brand/5 ${
        !hasBg && !style.backgroundColor && !style.background ? 'bg-white/70' : ''
      } ${
        noPadding ? 'p-0 overflow-hidden' : 'p-6 md:p-8'
      } ${className}`}
    >
      {children}
    </section>
  );
};

export default SellerCard;
