import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoDiamond, IoShieldCheckmark, IoFlash, IoRocket, IoColorPalette, IoTrendingUp } from "react-icons/io5";
import Link from "next/link";

interface AuthChoiceProps {
  isOpen: boolean;
  onClose: () => void;
}
// Auth choice
const AuthChoice = ({ isOpen, onClose }: AuthChoiceProps) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const buyerBenefits = [
    { icon: <IoDiamond className="text-brand-pink" />, text: "Shop Unique Finds" },
    { icon: <IoFlash className="text-brand-pink" />, text: "Discover New Styles" },
    { icon: <IoShieldCheckmark className="text-brand-pink" />, text: "Safe & Easy Checkout" },
  ];

  const sellerBenefits = [
    { icon: <IoRocket className="text-brand-purple" />, text: "Grow Your Brand" },
    { icon: <IoColorPalette className="text-brand-purple" />, text: "Custom Storefront" },
    { icon: <IoTrendingUp className="text-brand-purple" />, text: "Smart Sales Insights" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
        >
          {/* Silk Backdrop (White Blur) */}
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={onClose}
             className="absolute inset-0 bg-white/80 backdrop-blur-[24px]"
          />

          {/* Ghost Branding Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none text-[16vw] font-black text-black/[0.3] uppercase tracking-[-0.05em] whitespace-nowrap">
             LOOP BAZAR
          </div>

          <div className="relative w-full max-w-6xl z-10 flex flex-col items-center">
            {/* Header */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-center mb-10 md:mb-16 space-y-3"
            >
               <h2 className="text-xs font-bold uppercase tracking-[0.4em] text-gray-400">Curate Your Journey</h2>
               <div className="h-[1px] w-12 bg-gray-200 mx-auto" />
            </motion.div>

            <div className="flex flex-col md:flex-row gap-8 items-stretch justify-center w-full max-w-5xl">
              {/* Card A: Buyer */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.8 }}
                className="group relative w-full max-w-[400px]"
              >
                <div 
                   className="h-full bg-white border border-gray-100 rounded-[3rem] p-8 md:p-10 flex flex-col items-center overflow-hidden cursor-pointer transition-all duration-700 hover:shadow-[0_80px_100px_-40px_rgba(0,0,0,0.08)] hover:-translate-y-2"
                >
                  <div className="relative w-full aspect-square max-w-[260px] mb-10">
                     <div className="absolute inset-0 bg-brand-pink/10 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                     <motion.img 
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        src="/assets/auth/buyer.png" 
                        alt="Buyer" 
                        className="relative z-10 w-full h-full object-contain"
                     />
                  </div>

                  <div className="w-full space-y-6 flex-grow">
                     <div className="space-y-4">
                        {buyerBenefits.map((benefit, i) => (
                          <div key={i} className="flex items-center gap-4 text-gray-500 group-hover:text-black transition-colors">
                            <span className="text-xl">{benefit.icon}</span>
                            <span className="text-xs font-semibold tracking-wide">{benefit.text}</span>
                          </div>
                        ))}
                     </div>
                  </div>

                  <Link 
                    href="/signup?role=buyer"
                    onClick={onClose}
                    className="w-full mt-10 py-5 rounded-2xl bg-gray-900 text-white font-bold text-xs uppercase tracking-widest transition-all hover:bg-black active:scale-95 shadow-xl text-center"
                  >
                     Become a Buyer
                  </Link>
                </div>
              </motion.div>

              {/* Card B: Seller */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="group relative w-full max-w-[400px]"
              >
                <div 
                   className="h-full bg-white border border-gray-100 rounded-[3rem] p-8 md:p-10 flex flex-col items-center overflow-hidden cursor-pointer transition-all duration-700 hover:shadow-[0_80px_100px_-40px_rgba(0,0,0,0.08)] hover:-translate-y-2"
                >
                  <div className="relative w-full aspect-square max-w-[260px] mb-10">
                     <div className="absolute inset-0 bg-brand-purple/10 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                     <motion.img 
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        src="/assets/auth/seller.png" 
                        alt="Seller" 
                        className="relative z-10 w-full h-full object-contain"
                     />
                  </div>

                  <div className="w-full space-y-6 flex-grow">
                     <div className="space-y-4">
                        {sellerBenefits.map((benefit, i) => (
                          <div key={i} className="flex items-center gap-4 text-gray-500 group-hover:text-black transition-colors">
                            <span className="text-xl">{benefit.icon}</span>
                            <span className="text-xs font-semibold tracking-wide">{benefit.text}</span>
                          </div>
                        ))}
                     </div>
                  </div>

                  <Link 
                    href="/signup?role=seller"
                    onClick={onClose}
                    className="w-full mt-10 py-5 rounded-2xl bg-gradient-to-r from-brand-pink to-brand-purple text-black font-bold text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-xl text-center"
                  >
                     Become a Seller
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Nav Link */}
            <motion.button
               onClick={onClose}
               whileHover={{ x: -10 }}
               className="mt-12 flex items-center gap-4 text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:text-black transition-all underline underline-offset-8 decoration-gray-200 hover:decoration-brand-pink"
            >
               Return to Boutique
            </motion.button>
          </div>

          {/* Close */}
          <button 
             onClick={onClose}
             className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-400 hover:text-black transition-all group shadow-sm hover:shadow-md"
          >
             <IoClose className="text-2xl transition-transform group-hover:scale-110" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthChoice;