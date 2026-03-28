"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { IoArrowBack, IoMail, IoLockClosed, IoPerson, IoStorefront, IoCall, IoLocation, IoCard, IoChevronForward, IoSparkles } from "react-icons/io5";
import toast from "react-hot-toast";
import Link from "next/link";
import { useSignupMutation } from "../../store/apiSlice";
import { div } from "framer-motion/client";

const SignupForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
   const [role, setRole] = useState<'buyer' | 'seller' | null>(null);

  const [signup, { isLoading: isSigningUp }] = useSignupMutation();

  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "buyer" || r === "seller") {
      setRole(r);
    } else {
      router.push("/");
    }
  }, [searchParams, router]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "", // Buyer only
    storeName: "", // Seller only
    ownerName: "", // Seller only
    phoneNumber: "", // Seller only
    businessAddress: "", // Seller only
    bankDetails: "", // Seller only
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

      if (!role) {
         toast.error("Please choose a valid signup role");
         setIsLoading(false);
         return;
      }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        role,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        ...(role === "buyer" ? { name: formData.name } : {
          storeName: formData.storeName,
          ownerName: formData.ownerName,
          phoneNumber: formData.phoneNumber,
          businessAddress: formData.businessAddress,
          bankDetails: formData.bankDetails,
        })
      };

      const data = await signup(payload).unwrap();

      if (data.success) {
        toast.success(`Welcome to the Store, ${role === 'buyer' ? formData.name : formData.storeName}!`);
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        router.push(data.role === 'seller' ? "/seller-dashboard" : "/profile");
      }
    } catch (err: any) {
      // RTK Query throws the rejected response
      toast.error(err?.data?.message || "Failed to connect to the server");
    } finally {
      setIsLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex selection:bg-amber-500/30">
      {/* Left Column: Extreme Aesthetic Visual */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-zinc-900 shadow-2xl"
      >
        {/* Artistic Overlay - Extreme Contrast Gradient */}
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
                  {role === 'buyer' ? 'Step into' : 'Build Your'} <br/>
                  <span className="text bg-clip-text bg-linear-to-r from-brand-pink to-brand-purple ">Excellence.</span>
               </motion.h2 >
               <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="text-white text-base font-bold max-w-md leading-relaxed tracking-wide drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
               >
                  {role === 'buyer' 
                     ? "Experience the vanguard of digital commerce. Curated collections, seamless integration, and a community of high-end collectors."
                     : "Launch your boutique store on the most exclusive marketplace. Global reach, precision analytics, and a sanctuary for high-end sellers."
                  }
               </motion.p>
            </div>

            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 1.2 }}
               className="flex items-center gap-10"
            >
               <div className="h-px w-28 bg-white/40 shadow-sm" />
               <span className="text-white/40 text-[11px] uppercase font-black tracking-[0.9em] drop-shadow-md">The Gallery Experience</span>
            </motion.div>
         </div>
         </motion.div>

      {/* Right Form Side - Pure Seamless Boutique */}
      <div className="flex-1 flex flex-col items-center bg-[#FFF9FA] relative">
         {/* Navigation */}
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
               <span className="text-[9px] uppercase font-black tracking-widest text-gray-300">Path Choice</span>
               <span className={`text-[11px] uppercase font-black tracking-[0.2em] font-bold ${role === 'buyer' ? 'text-brand-pink' : 'text-brand-purple'}`}>
                  {role} Account
               </span>
            </div>
         </nav>

         <main className="flex-1 flex items-center justify-center p-8 md:p-12 w-full lg:max-w-xl">
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, ease: "easeOut" }}
               className="w-full"
            >
               {/* Seamless Vanguard Layout - Direct Integration */}
               <div className="flex flex-col items-center w-full px-4 md:px-0">
                  <div className="text-center mb-16 space-y-5">
                     <h1 className="text-6xl font-black tracking-tight text-gray-950 leading-none">
                        {role === 'buyer' ? 'Become a Collector.' : 'Join the Vanguard.'}
                     </h1>
                     <p className="text-gray-400 text-[12px] uppercase font-black tracking-[0.8em] pt-1">
                        Secure Lifestyle Integration
                     </p>
                  </div>

                  <form onSubmit={handleSubmit} className="w-full space-y-6">
                     <div className="grid grid-cols-1 gap-6">
                        {/* Interactive Form Fields */}
                        {role === 'buyer' ? (
                           <div className="relative group">
                              <IoPerson className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-pink transition-colors text-xl" />
                              <input 
                                 type="text" 
                                 name="name"
                                 required
                                 placeholder="Full Name"
                                 value={formData.name}
                                 onChange={handleChange}
                                 className="w-full bg-white border border-gray-100/50 py-6 pl-16 pr-8 rounded-[2rem] text-sm font-bold shadow-[0_4px_30px_-10px_rgba(0,0,0,0.03)] focus:border-brand-pink/40 transition-all outline-none"
                              />
                           </div>
                        ) : (
                           <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="relative group">
                                    <IoStorefront className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-purple transition-colors text-xl" />
                                    <input 
                                       type="text" 
                                       name="storeName"
                                       required
                                       placeholder="Store Name"
                                       value={formData.storeName}
                                       onChange={handleChange}
                                       className="w-full bg-white border border-gray-100/50 py-6 pl-16 pr-8 rounded-[2rem] text-sm font-bold shadow-[0_4px_30px_-10px_rgba(0,0,0,0.03)] focus:border-brand-purple/40 transition-all outline-none"
                                    />
                                 </div>
                                 <div className="relative group">
                                    <IoPerson className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-purple transition-colors text-xl" />
                                    <input 
                                       type="text" 
                                       name="ownerName"
                                       required
                                       placeholder="Owner Name"
                                       value={formData.ownerName}
                                       onChange={handleChange}
                                       className="w-full bg-white border border-gray-100/50 py-6 pl-16 pr-8 rounded-[2rem] text-sm font-bold shadow-[0_4px_30px_-10px_rgba(0,0,0,0.03)] focus:border-brand-purple/40 transition-all outline-none"
                                    />
                                 </div>
                              </div>
                              <div className="relative group">
                                 <IoCall className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-purple transition-colors text-xl" />
                                 <input 
                                    type="tel" 
                                    name="phoneNumber"
                                    required
                                    placeholder="Phone Number (+1 234...)"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-gray-100/50 py-6 pl-16 pr-8 rounded-[2rem] text-sm font-bold shadow-[0_4px_30px_-10px_rgba(0,0,0,0.03)] focus:border-brand-purple/40 transition-all outline-none"
                                 />
                              </div>
                              <div className="relative group">
                                 <IoLocation className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-purple transition-colors text-xl" />
                                 <input 
                                    type="text"
                                    name="businessAddress"
                                    required
                                    placeholder="Business Address"
                                    value={formData.businessAddress}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-gray-100/50 py-6 pl-16 pr-8 rounded-[2rem] text-sm font-bold shadow-[0_4px_30px_-10px_rgba(0,0,0,0.03)] focus:border-brand-purple/40 transition-all outline-none"
                                 />
                              </div>
                              <div className="relative group">
                                 <IoCard className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-purple transition-colors text-xl" />
                                 <input 
                                    type="text" 
                                    name="bankDetails"
                                    required
                                    placeholder="Bank Details (IBAN / Account Number)"
                                    value={formData.bankDetails}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-gray-100/50 py-6 pl-16 pr-8 rounded-[2rem] text-sm font-bold shadow-[0_4px_30px_-10px_rgba(0,0,0,0.03)] focus:border-brand-purple/40 transition-all outline-none"
                                 />
                              </div>
                           </>
                        )}

                        <div className="relative group">
                           <IoMail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-pink transition-colors text-xl" />
                           <input 
                              type="email" 
                              name="email"
                              required
                              placeholder="Email Address"
                              value={formData.email}
                              onChange={handleChange}
                              className="w-full bg-white border border-gray-100/50 py-6 pl-16 pr-8 rounded-[2rem] text-sm font-bold shadow-[0_4px_30px_-10px_rgba(0,0,0,0.03)] focus:border-brand-pink/40 transition-all outline-none"
                           />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="relative group">
                              <IoLockClosed className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-pink transition-colors text-xl" />
                              <input 
                                 type="password" 
                                 name="password"
                                 required
                                 placeholder="Password"
                                 value={formData.password}
                                 onChange={handleChange}
                                 className="w-full bg-white border border-gray-100/50 py-6 pl-16 pr-8 rounded-[2rem] text-sm font-bold shadow-[0_4px_30px_-10px_rgba(0,0,0,0.03)] focus:border-brand-pink/40 transition-all outline-none"
                              />
                           </div>
                           <div className="relative group">
                              <IoLockClosed className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-pink transition-colors text-xl" />
                              <input 
                                 type="password" 
                                 name="confirmPassword"
                                 required
                                 placeholder="Confirm Password"
                                 value={formData.confirmPassword}
                                 onChange={handleChange}
                                 className="w-full bg-white border border-gray-100/50 py-6 pl-16 pr-8 rounded-[2rem] text-sm font-bold shadow-[0_4px_30px_-10px_rgba(0,0,0,0.03)] focus:border-brand-pink/40 transition-all outline-none"
                              />
                           </div>
                        </div>
                     </div>

                     <button 
                        disabled={isLoading}
                        type="submit"
                        className="group w-full py-7 rounded-[2.5rem] bg-gray-950 hover:bg-black text-white font-bold text-xs uppercase tracking-[0.6em] shadow-2xl hover:shadow-brand-pink/10 transition-all flex items-center justify-center gap-4 disabled:opacity-50 mt-10"
                     >
                        <span>{isLoading ? 'Establishing...' : 'Complete Registry'}</span>
                        {!isLoading && <IoChevronForward className="text-xl group-hover:translate-x-2 transition-transform duration-500" />}
                     </button>
                  </form>

                  <div className="mt-16 text-center pb-12 border-t border-solid border-gray-100 pt-12 w-full max-w-md">
                     <p className="text-[11px] uppercase font-bold tracking-[0.4em] text-gray-400">
                        Already in the collection? <Link href="/login" className="text-black font-black hover:underline underline-offset-[16px] decoration-brand-pink decoration-2 transition-all ml-4 uppercase tracking-[0.2em] hover:text-brand-pink">Sign in mode</Link>
                     </p>
                  </div>
               </div>
            </motion.div>
         </main>


      </div>
    </div>
  );
};

const SignupPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF9FA] flex flex-col items-center justify-center font-black uppercase tracking-[0.5em] text-xs text-gray-300 animate-pulse">
        Establishing Vanguard Connection...
      </div>}>
      <SignupForm />
    </Suspense>
  );
};

export default SignupPage;
