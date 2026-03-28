"use client";

import React, { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IoArrowBack, IoMail, IoCall, IoLockClosed, IoChevronForward } from "react-icons/io5";
import toast from "react-hot-toast";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { useLoginMutation, useSellerLoginMutation } from "../../store/apiSlice";
import { setCredentials } from "../../store/authSlice";
import type { AppDispatch } from "../../store/store";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

const getRedirectPathByRole = (role: string) => {
  if (role === "admin") return "/admin-dashboard";
  if (role === "seller") return "/seller-dashboard";
  return "/profile";
};

const LoginForm = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [login] = useLoginMutation();
  const [sellerLogin] = useSellerLoginMutation();

  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailOrPhone = formData.emailOrPhone.trim();
    const password = formData.password;

    if (!emailOrPhone || !password) {
      toast.error("Email/Phone and password are required");
      return;
    }

    const isEmailInput = emailOrPhone.includes("@");

    if (isEmailInput && !EMAIL_REGEX.test(emailOrPhone)) {
      toast.error("Enter a valid email address");
      return;
    }

    if (!isEmailInput && !PHONE_REGEX.test(emailOrPhone)) {
      toast.error("Enter a valid phone number in international format");
      return;
    }

    setIsLoading(true);

    try {
      const data = isEmailInput
        ? await login({ email: emailOrPhone.toLowerCase(), password }).unwrap()
        : await sellerLogin({ emailOrPhone, password }).unwrap();

      dispatch(
        setCredentials({
          token: data.token,
          role: data.role,
          user: {
            _id: data._id,
            name: data.name,
            storeName: data.storeName,
            email: data.email,
          },
        }),
      );

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      toast.success(`Welcome back, ${data.name || data.storeName || "Member"}!`);
      router.push(getRedirectPathByRole(data.role));
    } catch (err: any) {
      toast.error(err?.data?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex selection:bg-amber-500/30">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-zinc-900 shadow-2xl"
      >
        <div className="absolute inset-0 bg-linear-to-r from-black/98 via-black/40 to-transparent" />

        <div className="relative z-10 p-24 flex flex-col justify-between h-full w-full">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-6"
          >
            <img src="/assets/logo/logo.png" alt="LoopBazar" className="w-14 h-14 object-contain brightness-0 invert" />
            <span className="text-white font-black tracking-[0.6em] uppercase text-xs drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">Loop Bazar</span>
          </motion.div>

          <div className="space-y-12">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-white text-8xl font-black tracking-tighter leading-[0.75] drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
            >
              Return to <br />
              <span className="text bg-clip-text bg-linear-to-r from-brand-pink to-brand-purple">Excellence.</span>
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-white text-base font-bold max-w-md leading-relaxed tracking-wide drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
            >
              Sign in to continue your premium marketplace journey with secure access, streamlined checkout, and role-aware insights.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center gap-10"
          >
            <div className="h-px w-28 bg-white/40 shadow-sm" />
            <span className="text-white/40 text-[11px] uppercase font-black tracking-[0.9em] drop-shadow-md">Private Access Portal</span>
          </motion.div>
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col items-center bg-[#FFF9FA] relative">
        <nav className="w-full p-8 flex justify-between items-center z-50">
          <Link href="/" className="group flex items-center gap-4 text-black transition-all">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all group-active:scale-95">
              <IoArrowBack className="text-lg" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-black tracking-[0.3em] text-gray-400 group-hover:text-black transition-colors">Return to</span>
              <span className="text-[10px] uppercase font-black tracking-widest font-bold">Home</span>
            </div>
          </Link>

          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase font-black tracking-widest text-gray-300">Access Layer</span>
            <span className="text-[11px] uppercase font-black tracking-[0.2em] font-bold text-brand-pink">Login Mode</span>
          </div>
        </nav>

        <main className="flex-1 flex items-center justify-center p-8 md:p-12 w-full lg:max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full"
          >
            <div className="flex flex-col items-center w-full px-4 md:px-0">
              <div className="text-center mb-16 space-y-5">
                <h1 className="text-6xl font-black tracking-tight text-gray-950 leading-none">Access your account.</h1>
                <p className="text-gray-400 text-[12px] uppercase font-black tracking-[0.8em] pt-1">Secure Lifestyle Integration</p>
              </div>

              <form onSubmit={handleSubmit} className="w-full space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="relative group">
                    {formData.emailOrPhone.includes("@") ? (
                      <IoMail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-pink transition-colors text-xl" />
                    ) : (
                      <IoCall className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-pink transition-colors text-xl" />
                    )}
                    <input
                      type="text"
                      name="emailOrPhone"
                      required
                      autoComplete="username"
                      placeholder="Email or Phone Number"
                      value={formData.emailOrPhone}
                      onChange={handleChange}
                      className="w-full bg-white border border-gray-100/50 py-6 pl-16 pr-8 rounded-[2rem] text-sm font-bold shadow-[0_4px_30px_-10px_rgba(0,0,0,0.03)] focus:border-brand-pink/40 transition-all outline-none"
                    />
                  </div>

                  <div className="relative group">
                    <IoLockClosed className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-pink transition-colors text-xl" />
                    <input
                      type="password"
                      name="password"
                      required
                      autoComplete="current-password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-white border border-gray-100/50 py-6 pl-16 pr-8 rounded-[2rem] text-sm font-bold shadow-[0_4px_30px_-10px_rgba(0,0,0,0.03)] focus:border-brand-pink/40 transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  disabled={isLoading}
                  type="submit"
                  className="group w-full py-7 rounded-[2.5rem] bg-gray-950 hover:bg-black text-white font-bold text-xs uppercase tracking-[0.6em] shadow-2xl hover:shadow-brand-pink/10 transition-all flex items-center justify-center gap-4 disabled:opacity-50 mt-10"
                >
                  {isLoading ? (
                    <>
                      <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Boutique</span>
                      <IoChevronForward className="text-xl group-hover:translate-x-2 transition-transform duration-500" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-16 text-center pb-12 border-t border-solid border-gray-100 pt-12 w-full max-w-md">
                <p className="text-[11px] uppercase font-bold tracking-[0.4em] text-gray-400">
                  New to the collection?
                  <Link href="/" className="text-black font-black hover:underline underline-offset-[16px] decoration-brand-pink decoration-2 transition-all ml-4 uppercase tracking-[0.2em] hover:text-brand-pink">
                    Select signup path
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

const LoginPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFF9FA] flex flex-col items-center justify-center font-black uppercase tracking-[0.5em] text-xs text-gray-300 animate-pulse">
          Establishing Vanguard Connection...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;
