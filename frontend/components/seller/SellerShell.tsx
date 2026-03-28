'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { logout } from '@/store/authSlice';
import toast from 'react-hot-toast';
import {
  IoArchiveOutline,
  IoBagHandleOutline,
  IoCloseOutline,
  IoGridOutline,
  IoHomeOutline,
  IoLogOutOutline,
  IoMenuOutline,
  IoPricetagOutline,
  IoSettingsOutline,
  IoStatsChartOutline,
  IoStorefrontOutline,
} from 'react-icons/io5';

interface SellerShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/seller-dashboard', label: 'Dashboard', icon: IoGridOutline },
  { href: '/seller-dashboard/products', label: 'Products', icon: IoStorefrontOutline },
  { href: '/seller-dashboard/inventory', label: 'Inventory', icon: IoArchiveOutline },
  { href: '/seller-dashboard/orders', label: 'Orders', icon: IoBagHandleOutline },
  { href: '/seller-dashboard/coupons', label: 'Coupons', icon: IoPricetagOutline },
  { href: '/seller-dashboard/analytics', label: 'Analytics', icon: IoStatsChartOutline },
  { href: '/seller-dashboard/settings', label: 'Settings', icon: IoSettingsOutline },
] as const;

const isActiveItem = (pathname: string, href: string) => {
  if (href === '/seller-dashboard') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};

const SellerShell = ({ children }: SellerShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.storeName
    ? user.storeName.charAt(0).toUpperCase()
    : user?.name
      ? user.name.charAt(0).toUpperCase()
      : 'S';

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    toast.success('Successfully logged out');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-brand-bg selection:bg-black/5">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-zinc-100 bg-white/85 px-5 py-6 backdrop-blur-xl lg:flex">
          <Link href="/" className="mb-8 flex items-center gap-3 px-2">
            <img src="/assets/logo/logo.png" alt="LoopBazar" className="h-10 w-10 object-contain" />
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400">LoopBazar</p>
              <p className="text-sm font-black tracking-tight text-black">Seller Console</p>
            </div>
          </Link>

          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActiveItem(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black tracking-tight transition ${
                    active
                      ? 'bg-black text-white shadow-lg shadow-black/20'
                      : 'text-zinc-500 hover:bg-zinc-100 hover:text-black'
                  }`}
                >
                  <Icon className="text-lg" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 border-t border-zinc-100 pt-5">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black tracking-tight text-zinc-500 transition hover:bg-zinc-100 hover:text-black"
            >
              <IoHomeOutline className="text-lg" />
              Back to Home
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-black tracking-tight text-rose-600 transition hover:bg-rose-50"
            >
              <IoLogOutOutline className="text-lg" />
              Logout
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/80 px-4 py-4 backdrop-blur-xl md:px-6 lg:px-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white"
                >
                  <IoMenuOutline className="text-xl" />
                </button>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Seller Console</p>
              </div>

              <div className="hidden lg:block">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">Active Store</p>
                <h2 className="text-lg font-black tracking-tight text-black">
                  {user?.storeName || 'Seller Workspace'}
                </h2>
              </div>

              <div className="ml-auto flex items-center gap-3 rounded-2xl bg-zinc-50 px-3 py-2">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Signed in as</p>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-700">
                    {user?.name || user?.storeName || 'Seller'}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-sm font-black text-white">
                  {initials}
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 md:px-6 lg:px-10 lg:py-8">{children}</main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 h-full w-[85%] max-w-xs bg-white px-5 py-6 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                <img src="/assets/logo/logo.png" alt="LoopBazar" className="h-9 w-9 object-contain" />
                <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">LoopBazar</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100"
              >
                <IoCloseOutline className="text-xl" />
              </button>
            </div>

            <nav className="space-y-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActiveItem(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black tracking-tight transition ${
                      active
                        ? 'bg-black text-white shadow-lg shadow-black/20'
                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-black'
                    }`}
                  >
                    <Icon className="text-lg" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 space-y-2 border-t border-zinc-100 pt-5">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black tracking-tight text-zinc-500 transition hover:bg-zinc-100 hover:text-black"
              >
                <IoHomeOutline className="text-lg" />
                Back to Home
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-black tracking-tight text-rose-600 transition hover:bg-rose-50"
              >
                <IoLogOutOutline className="text-lg" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
};

export default SellerShell;
