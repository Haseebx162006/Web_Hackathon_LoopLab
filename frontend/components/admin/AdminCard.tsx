import React from 'react';

interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
}

const AdminCard = ({ children, className = '' }: AdminCardProps) => {
  return <section className={`glass rounded-[2rem] p-6 md:p-8 ${className}`}>{children}</section>;
};

export default AdminCard;
