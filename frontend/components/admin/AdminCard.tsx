import React from 'react';

interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
}

const AdminCard = ({ children, className = '' }: AdminCardProps) => {
  return <section className={`glass rounded-[2.5rem] backdrop-blur-3xl border border-white/60 shadow-brand/5 bg-white/70 p-6 md:p-8 ${className}`}>{children}</section>;
};

export default AdminCard;
