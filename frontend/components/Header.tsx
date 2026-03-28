"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AuthChoice from "./AuthChoice";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

const getProfileRoute = (role: "buyer" | "seller" | "admin" | null) => {
  if (role === "admin") return "/admin-dashboard";
  if (role === "seller") return "/seller-dashboard";
  if (role === "buyer") return "/buyer-dashboard";
  return "/buyer-dashboard";
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [storedToken, setStoredToken] = useState<string | null>(null);
  const [storedRole, setStoredRole] = useState<"buyer" | "seller" | "admin" | null>(null);

  const { isAuthenticated, token, role } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const syncAuthFromStorage = () => {
      const tokenFromStorage = localStorage.getItem("token");
      const roleFromStorage = localStorage.getItem("role");

      setStoredToken(tokenFromStorage);
      setStoredRole(
        roleFromStorage === "buyer" || roleFromStorage === "seller" || roleFromStorage === "admin"
          ? roleFromStorage
          : null,
      );
    };

    syncAuthFromStorage();
    window.addEventListener("storage", syncAuthFromStorage);

    return () => window.removeEventListener("storage", syncAuthFromStorage);
  }, []);

  const isLoggedIn = hasMounted && (isAuthenticated || Boolean(token) || Boolean(storedToken));
  const profileRoute = getProfileRoute(role || storedRole);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-6 left-0 right-0 z-50 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 transition-all duration-500">
      <nav 
        className={`glass flex items-center justify-between rounded-full px-8 py-2.5 transition-all duration-500 ${
            isScrolled ? "shadow-lg ring-1 ring-black/5" : "shadow-brand"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative h-8 w-28 transition-transform duration-500 group-hover:scale-105">
              <img 
                src="/assets/logo/logo.png" 
                alt="LoopBazar" 
                className="h-full w-full object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center gap-10">
          {["Home", "Products", "Events","Contact", "FAQ", "About"].map((item) => (
            <Link
              key={item}
              href={`/${item.toLowerCase() === "home" ? "" : item.toLowerCase()}`}
              className="text-[13px] font-semibold tracking-wide text-gray-500 transition-all hover:text-black"
            >
              {item}
            </Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          {!isLoggedIn && (
            <>
              <button
                 onClick={() => setIsAuthOpen(true)}
                 className="hidden cursor-pointer sm:flex px-6 py-2.5 rounded-full bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-gray-800 active:scale-95 shadow-xl"
              >
                 Signup
              </button>

              <Link href="/login">
                <button className="hidden cursor-pointer sm:flex px-6 py-2.5 rounded-full bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-black hover:text-white active:scale-95 shadow-xl">
                  Login
                </button>
              </Link>
            </>
          )}

          {isLoggedIn && (
            <>
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-black/5 transition-all duration-300 hover:bg-black hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white ring-2 ring-white">
                  3
                </span>
              </button>

              <Link
                href={profileRoute}
                aria-label="Profile"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-black/5 transition-all duration-300 hover:bg-black hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>
            </>
          )}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex lg:hidden h-10 w-10 items-center justify-center rounded-xl bg-gray-100 transition-all hover:bg-black hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isMenuOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 12h16M4 6h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="glass mt-4 flex flex-col items-center gap-6 rounded-3xl py-10 shadow-xl lg:hidden animate-fade-in-up">
          {["Home", "Products", "Events", "Contact", "FAQ", "About"].map((item) => (
            <Link
              key={item}
              href={`/${item.toLowerCase() === "home" ? "" : item.toLowerCase()}`}
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-bold text-gray-700 hover:text-black"
            >
              {item}
            </Link>
          ))}
          {!isLoggedIn && (
            <>
              <button
                 onClick={() => { setIsAuthOpen(true); setIsMenuOpen(false); }}
                 className="w-[80%] py-4 rounded-2xl bg-black text-white text-xs font-black uppercase tracking-[0.3em] shadow-xl"
              >
                 Signup
              </button>

              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="w-[80%] py-4 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-[0.3em] shadow-xl text-center"
              >
                Login
              </Link>
            </>
          )}

          {isLoggedIn && (
            <Link
              href={profileRoute}
              onClick={() => setIsMenuOpen(false)}
              className="w-[80%] py-4 rounded-2xl bg-black text-white text-xs font-black uppercase tracking-[0.3em] shadow-xl text-center"
            >
              Profile
            </Link>
          )}
        </div>
      )}

      {/* Auth Choice Modal */}
      <AuthChoice isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </header>
  );
};

export default Header;
