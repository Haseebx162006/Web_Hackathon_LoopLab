import React from 'react';

interface SellerCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  style?: React.CSSProperties;
}

const SellerCard = ({ children, className = '', noPadding = false, style = {} }: SellerCardProps) => {
  const hasBg = /\bbg-/.test(className);
  const styleRecord = style as Record<string, unknown>;
  const hasInlineBackground =
    styleRecord.backgroundColor != null ||
    styleRecord.background != null ||
    styleRecord['background-color'] != null;

  return (
    <section 
      style={style}
      className={`glass rounded-[2.5rem] backdrop-blur-3xl border border-white/60 shadow-brand/5 ${
        !hasBg && !hasInlineBackground ? 'bg-white/70' : ''
      } ${
        noPadding ? 'p-0 overflow-hidden' : 'p-6 md:p-8'
      } ${className}`}
    >
      {children}
    </section>
  );
};

export default SellerCard;
