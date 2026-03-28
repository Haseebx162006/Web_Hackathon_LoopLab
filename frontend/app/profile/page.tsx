"use client";

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store/store";
import { logout } from "../../store/authSlice";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    toast.success("Successfully logged out");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-brand-bg selection:bg-black/5">
      <Header />
      
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-12"
        >
          <div className="flex flex-col md:flex-row items-center gap-8 border-b border-gray-100 pb-12">
            <div className="h-32 w-32 rounded-full bg-black/5 flex items-center justify-center text-4xl font-black text-black ring-8 ring-white shadow-xl">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black">
                {user?.name || "Premium Member"}
              </h1>
              <p className="text-gray-400 font-bold uppercase tracking-[0.4em] text-xs">
                {user?.email || "Exclusive Access Tier"}
              </p>
              <button 
                onClick={handleLogout}
                className="mt-4 px-6 py-2.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all active:scale-95 shadow-lg"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <section className="glass rounded-[2.5rem] p-10 space-y-8">
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-4">
                  Recent Orders
                  <span className="h-1.5 w-1.5 rounded-full bg-black shrink-0" />
                </h2>
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-black/5 flex items-center justify-center border border-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-400"
                    >
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <path d="M3 6h18" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-bold text-sm">Your order history is being curated.</p>
                </div>
              </section>

              <section className="glass rounded-[2.5rem] p-10 space-y-8">
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-4">
                  Shipping Addresses
                  <span className="h-1.5 w-1.5 rounded-full bg-black shrink-0" />
                </h2>
                <button className="w-full py-6 rounded-2xl border-2 border-dashed border-gray-100 text-gray-400 font-black uppercase tracking-widest text-xs hover:border-black hover:text-black transition-all">
                  + Add New Address
                </button>
              </section>
            </div>

            <div className="space-y-8">
              <section className="glass rounded-[2.5rem] p-10 space-y-8">
                <h2 className="text-xl font-black tracking-tight">Account Stats</h2>
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white/50 p-4 rounded-2xl">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">Points</span>
                    <span className="font-black text-lg">2,450</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/50 p-4 rounded-2xl">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">Status</span>
                    <span className="font-black text-xs uppercase tracking-widest bg-black text-white px-3 py-1.5 rounded-full">Elite</span>
                  </div>
                </div>
              </section>

              <div className="bg-black rounded-[2.5rem] p-10 text-white space-y-6 shadow-2xl overflow-hidden relative group">
                <div className="absolute -top-10 -right-10 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                <h3 className="text-xl font-black">Need assistance?</h3>
                <p className="text-white/60 text-sm font-bold leading-relaxed">Your dedicated concierge is always available for personal shopping assistance.</p>
                <button className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all">
                  Contact Concierge
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
