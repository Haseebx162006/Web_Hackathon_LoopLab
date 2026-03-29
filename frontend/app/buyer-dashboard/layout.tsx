import type { Metadata } from 'next';
import BuyerDashboardShell from '@/components/buyer/BuyerDashboardShell';

export const metadata: Metadata = {
  title: 'Buyer Dashboard | LoopBazar',
  description: 'Track orders, message sellers, and manage your wishlist and profile.',
};

export default function BuyerDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <BuyerDashboardShell>{children}</BuyerDashboardShell>;
}
