"use client";

import React, { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { IoArrowBack, IoMail, IoLockClosed, IoChevronForward, IoSparkles } from "react-icons/io5";
import toast from "react-hot-toast";
import Link from "next/link";

const LoginForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Welcome back, ${data.name || data.storeName || 'Member'}!`);
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        router.push("/");
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch (err) {
      toast.error("Failed to connect to the server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FFF9FA] overflow-hidden flex flex-col items-center justify-center p-6 md:p-12">
      {/* Subtle Pink Auras */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden text-center">
         <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.4, 0.3]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full bg-brand-pink/20" 
         />
      </div>

      {/* Modern Navigation */}
      <nav className="fixed top-0 left-0 right-0 p-8 flex justify-between items-center z-50">
         <Link href="/" className="group flex items-center gap-4 text-black transition-all">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all group-active:scale-95">
               <IoArrowBack className="text-lg" />
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] uppercase font-black tracking-[0.3em] text-gray-400 group-hover:text-black transition-colors">Return to</span>
               <span className="text-[10px] uppercase font-black tracking-widest font-bold">Home</span>
            </div>
         </Link>
      </nav>

      {/* Clean Login Card */}
      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
         className="relative z-10 w-full max-w-[440px]"
      >
         <div className="bg-white border border-gray-100 p-8 md:p-14 rounded-[3.5rem] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.04)] flex flex-col items-center">
            
            {/* Form Header */}
            <div className="text-center mb-10 space-y-3">
               <div className="w-14 h-14 rounded-2xl bg-brand-pink/10 flex items-center justify-center mx-auto mb-4">
                  <IoLockClosed className="text-brand-pink text-xl" />
               </div>
               <h1 className="text-3xl font-black tracking-tight text-gray-900 leading-none">
                  Welcome back.
               </h1>
               <p className="text-gray-400 text-[9px] uppercase font-black tracking-[0.4em] pt-1">
                  Private Boutique Access
               </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
               <div className="grid grid-cols-1 gap-4">
                  <div className="relative group">
                     <IoMail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-pink transition-colors text-lg" />
                     <input 
                        type="email" 
                        name="email"
                        required
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-transparent py-4 pl-14 pr-7 rounded-2xl text-sm font-bold focus:bg-white focus:border-gray-200 transition-all outline-none"
                     />
                  </div>

                  <div className="relative group">
                     <IoLockClosed className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-pink transition-colors text-lg" />
                     <input 
                        type="password" 
                        name="password"
                        required
                        placeholder="Secret password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-transparent py-4 pl-14 pr-7 rounded-2xl text-sm font-bold focus:bg-white focus:border-gray-200 transition-all outline-none"
                     />
                  </div>
               </div>

               <button 
                  disabled={isLoading}
                  type="submit"
                  className="group w-full py-5 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
               >
                  <span>{isLoading ? 'Decrypting...' : 'Enter Boutique'}</span>
                  {!isLoading && <IoChevronForward className="text-lg group-hover:translate-x-1 transition-transform" />}
               </button>
            </form>

            <div className="mt-10 text-center">
               <p className="text-[10px] uppercase font-bold tracking-widest text-gray-300 mb-4">
                  New to the gallery?
               </p>
               <Link 
                  href="/" 
                  className="inline-flex items-center justify-center gap-2 text-[11px] uppercase font-black tracking-widest text-black hover:opacity-70 transition-opacity"
               >
                  Select Your Path <IoSparkles className="text-brand-pink" />
               </Link>
            </div>
         </div>
      </motion.div>

      {/* Boutique Footer Branding */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 pointer-events-none flex justify-center z-50">
         <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase font-black tracking-[0.5em] text-gray-200">LoopBazar Security &copy; 2024</span>
         </div>
      </footer>
    </div>
  );
};

const LoginPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF9FA] flex items-center justify-center font-black uppercase tracking-[0.5em] text-xs text-gray-300 animate-pulse">Establishing Secure Connection...</div>}>
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;
