"use client";

import React from "react";
import { motion } from "framer-motion";

const Subscribe = () => {
  return (
    <section className="relative py-40 px-6 overflow-hidden bg-brand-offwhite">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(212,165,255,0.05)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 60 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
           className="relative bg-gradient-to-r from-[#FFB7CE]/40 via-white/40 to-[#D4A5FF]/40 backdrop-blur-3xl rounded-[4rem] p-12 md:p-24 border border-white/60 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col md:flex-row items-center gap-16"
        >
          {/* Internal Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-pink/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-purple/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

          {/* Left Side: 3D Visual */}
          <div className="relative group w-full max-w-[300px]">
             <motion.div
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [0, 5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
             >
                <img 
                  src="/assets/subscribe/man.png" 
                  alt="Subscription Reward" 
                  className="w-full h-auto drop-shadow-[0_30px_50px_rgba(0,0,0,0.15)]"
                />
             </motion.div>
             {/* Deep Shadow */}
             <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-40 h-6 bg-black/5 blur-xl rounded-full" />
          </div>

          {/* Right Side: Content & Form */}
          <div className="flex-1 space-y-8 text-center md:text-left">
             <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.8em] text-brand-purple">Insider Access</span>
                <h2 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-[0.9] uppercase italic">
                   Join The <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-pink via-brand-purple to-brand-pink">Circle</span>
                </h2>
                <p className="text-gray-500 font-bold text-sm uppercase tracking-widest leading-relaxed">
                   Subscribe for exclusive drops, <br />
                   limited collections & member pricing.
                </p>
             </div>

             <form className="relative flex flex-col sm:flex-row gap-4 max-w-md">
                <div className="flex-1 relative">
                   <input 
                      type="email" 
                      placeholder="YOUR@EMAIL.COM"
                      className="w-full bg-white/80 border border-gray-100 rounded-2xl py-5 px-8 text-xs font-black tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all placeholder:text-gray-300"
                   />
                </div>
                <motion.button
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   className="bg-gray-900 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all"
                >
                   Join
                </motion.button>
             </form>
             
             <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" className="w-full h-full object-cover" />
                     </div>
                   ))}
                </div>
                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">+2k members joined this week</span>
             </div>
          </div>
        </motion.div>
      </div>

  
    </section>
  );
};


export default Subscribe;
