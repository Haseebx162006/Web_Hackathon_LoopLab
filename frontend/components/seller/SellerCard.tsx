import React from 'react';

interface SellerCardProps {
  children: React.ReactNode;
  className?: string;
}

const SellerCard = ({ children, className = '' }: SellerCardProps) => {
  return <section className={`glass rounded-[2rem] p-6 md:p-8 ${className}`}>{children}</section>;
};

export default SellerCard;
