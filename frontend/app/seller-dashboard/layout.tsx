import type { Metadata } from 'next';
import SellerShell from '@/components/seller/SellerShell';

export const metadata: Metadata = {
  title: 'Seller Dashboard | LoopBazar',
  description: 'Manage products, orders, inventory, coupons, and analytics.',
};

export default function SellerDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SellerShell>{children}</SellerShell>;
}
