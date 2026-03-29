'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { logout } from '@/store/authSlice';
import toast from 'react-hot-toast';
import {
  IoArchiveOutline,
  IoBagHandleOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('seller_sidebar_collapsed');
    if (savedState !== null) {
      setIsSidebarCollapsed(savedState === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('seller_sidebar_collapsed', String(newState));
  };

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
    <div className="min-h-screen bg-brand-bg selection:bg-black/5 mesh-bg">
      <div className="flex">
        <aside 
          className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-zinc-100 bg-white/60 px-4 py-6 backdrop-blur-2xl transition-all duration-500 lg:flex ${
            isSidebarCollapsed ? 'w-24' : 'w-72'
          }`}
        >
          <div className="mb-10 flex items-center justify-between px-2">
            <Link href="/" className="flex items-center gap-3 overflow-hidden">
              <img src="/assets/logo/logo.png" alt="LoopBazar" className="h-9 w-9 shrink-0 object-contain" />
              {!isSidebarCollapsed && (
                <div className="space-y-0.5 animate-fade-in-up">
                  <p className="text-[10px] font-light uppercase tracking-[0.4em] text-zinc-400">LoopBazar</p>
                  <p className="text-sm font-light tracking-tight text-black">Seller Dashboard</p>
                </div>
              )}
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActiveItem(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all duration-300 ${
                    active
                      ? 'bg-black text-white shadow-xl shadow-black/10'
                      : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-black'
                  }`}
                >
                  <Icon className={`text-xl transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {!isSidebarCollapsed && (
                    <span className="text-[13px] font-light tracking-wide animate-fade-in-up">{item.label}</span>
                  )}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-4 hidden rounded-lg bg-black px-3 py-2 text-xs font-light text-white group-hover:block">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 border-t border-zinc-100/50 pt-5">
            <Link
              href="/"
              className="group relative flex items-center gap-4 rounded-2xl px-4 py-3.5 text-zinc-500 transition-all duration-300 hover:bg-zinc-100/50 hover:text-black"
            >
              <IoHomeOutline className="text-xl group-hover:scale-110 transition-transform" />
              {!isSidebarCollapsed && <span className="text-[13px] font-light tracking-wide animate-fade-in-up">Back to Home</span>}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="group relative flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-rose-500 transition-all duration-300 hover:bg-rose-50/50"
            >
              <IoLogOutOutline className="text-xl group-hover:scale-110 transition-transform" />
              {!isSidebarCollapsed && <span className="text-[13px] font-light tracking-wide animate-fade-in-up">Logout</span>}
            </button>
          </div>

          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white border border-zinc-100 shadow-md transition-all hover:bg-zinc-50 lg:flex"
          >
            {isSidebarCollapsed ? (
              <IoChevronForwardOutline className="text-[10px]" />
            ) : (
              <IoChevronBackOutline className="text-[10px]" />
            )}
          </button>
        </aside>

        <div className="min-w-0 flex-1 flex flex-col min-h-screen">
          <header className="sticky top-0 z-40 bg-white/60 px-4 py-4 backdrop-blur-2xl md:px-6 lg:px-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white shadow-lg"
                >
                  <IoMenuOutline className="text-xl" />
                </button>
                <p className="text-xs font-light uppercase tracking-[0.2em] text-zinc-500">Seller Console</p>
              </div>

              <div className="hidden lg:block animate-fade-in-up">
                <p className="text-[10px] font-light uppercase tracking-[0.35em] text-zinc-400">Active Store</p>
                <h2 className="text-lg font-light tracking-tight text-black">
                  {user?.storeName || 'Seller Workspace'}
                </h2>
              </div>

              <div className="ml-auto flex items-center gap-4 rounded-2xl glass bg-white/60 px-4 py-2 border-white/20">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-light uppercase tracking-[0.2em] text-zinc-400">Merchant Account</p>
                  <p className="text-xs font-light uppercase tracking-[0.12em] text-zinc-700">
                    {user?.name || user?.storeName || 'Seller'}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-light text-white shadow-lg shadow-black/10">
                  {initials}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 animate-fade-in-up">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 h-full w-[85%] max-w-xs bg-white/90 backdrop-blur-3xl px-6 py-8 shadow-2xl animate-fade-in-up">
            <div className="mb-10 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                <img src="/assets/logo/logo.png" alt="LoopBazar" className="h-9 w-9 object-contain" />
                <span className="text-[10px] font-light uppercase tracking-[0.3em] text-zinc-400">LoopBazar</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100/50"
              >
                <IoCloseOutline className="text-xl" />
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActiveItem(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-4 rounded-2xl px-4 py-4 transition-all duration-300 ${
                      active
                        ? 'bg-black text-white shadow-xl shadow-black/10'
                        : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-black'
                    }`}
                  >
                    <Icon className="text-xl" />
                    <span className="text-sm font-light tracking-wide">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 space-y-2 border-t border-zinc-100/50 pt-8">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-4 rounded-2xl px-4 py-4 text-zinc-500 transition-all duration-300 hover:bg-zinc-100/50 hover:text-black"
              >
                <IoHomeOutline className="text-xl" />
                <span className="text-sm font-light tracking-wide">Back to Home</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left text-rose-500 transition-all duration-300 hover:bg-rose-50/50"
              >
                <IoLogOutOutline className="text-xl" />
                <span className="text-sm font-light tracking-wide">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default SellerShell;
