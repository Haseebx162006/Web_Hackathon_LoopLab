'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { FormEvent, useMemo, useState, useSyncExternalStore } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { IoCartOutline, IoHeartOutline, IoLogOutOutline, IoPersonCircleOutline, IoSearchOutline } from 'react-icons/io5';
import { logout } from '@/store/authSlice';
import type { AppDispatch, RootState } from '@/store/store';
import { useGetBuyerCartQuery, useGetBuyerWishlistQuery } from '@/store/buyerApi';
import { isBuyerAuthenticated } from '@/utils/buyerUtils';

const links = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/cart', label: 'Cart' },
  { href: '/buyer-dashboard', label: 'Dashboard' },
] as const;

const BuyerHeader = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [search, setSearch] = useState('');

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const isBuyer = useMemo(() => {
    if (!isClient) {
      return false;
    }

    if (role) {
      return role === 'buyer' && isAuthenticated;
    }
    return isBuyerAuthenticated();
  }, [isAuthenticated, isClient, role]);

  const { data: cartResponse } = useGetBuyerCartQuery(undefined, { skip: !isBuyer });
  const { data: wishlistResponse } = useGetBuyerWishlistQuery(undefined, { skip: !isBuyer });

  const cartCount = useMemo(() => {
    const items = cartResponse?.data?.cart?.items ?? [];
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartResponse?.data?.cart?.items]);

  const wishlistCount = useMemo(() => {
    return wishlistResponse?.data?.items?.length ?? 0;
  }, [wishlistResponse?.data?.items]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = search.trim();
    router.push(trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : '/products');
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <img src="/assets/logo/logo.png" alt="LoopBazar" className="h-10 w-10 object-contain" />
          <div className="hidden sm:block">
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-400">LoopBazar</p>
            <p className="text-sm font-black tracking-tight text-zinc-900">Buyer Hub</p>
          </div>
        </Link>

        <form onSubmit={handleSearch} className="hidden flex-1 items-center gap-2 rounded-2xl border border-zinc-100 bg-white px-3 py-2 shadow-sm md:flex">
          <IoSearchOutline className="text-lg text-zinc-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products, categories, trends"
            className="w-full border-0 bg-transparent text-sm font-medium text-zinc-700 outline-none placeholder:text-zinc-400"
          />
        </form>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition ${
                  active ? 'bg-black text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/wishlist" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 transition hover:bg-zinc-900 hover:text-white">
            <IoHeartOutline className="text-lg" />
            {wishlistCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-black text-white">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            ) : null}
          </Link>

          <Link href="/cart" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 transition hover:bg-zinc-900 hover:text-white">
            <IoCartOutline className="text-lg" />
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-black text-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            ) : null}
          </Link>

          {isBuyer ? (
            <>
              <Link
                href="/buyer-dashboard"
                className="hidden items-center gap-1 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-700 transition hover:bg-zinc-900 hover:text-white sm:inline-flex"
              >
                <IoPersonCircleOutline className="text-base" />
                Account
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 transition hover:bg-rose-600 hover:text-white"
                aria-label="Logout"
              >
                <IoLogOutOutline className="text-lg" />
              </button>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
              >
                Login
              </Link>
              <Link
                href="/signup?role=buyer"
                className="rounded-xl bg-black px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
              >
                Signup
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-100 px-4 py-3 md:hidden">
        <form onSubmit={handleSearch} className="flex items-center gap-2 rounded-2xl border border-zinc-100 bg-white px-3 py-2 shadow-sm">
          <IoSearchOutline className="text-lg text-zinc-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products"
            className="w-full border-0 bg-transparent text-sm font-medium text-zinc-700 outline-none placeholder:text-zinc-400"
          />
        </form>
      </div>
    </header>
  );
};

export default BuyerHeader;
