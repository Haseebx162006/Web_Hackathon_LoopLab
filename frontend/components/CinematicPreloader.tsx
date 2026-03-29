"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CinematicPreloaderProps {
  onComplete: () => void;
}

const CinematicPreloader: React.FC<CinematicPreloaderProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<"drop" | "expand" | "welcome" | "exit">("drop");

  useEffect(() => {
    // 6.5-second choreography
    const t1 = setTimeout(() => setStage("expand"), 2000);
    const t2 = setTimeout(() => setStage("welcome"), 4000);
    const t3 = setTimeout(() => setStage("exit"), 6000);
    const t4 = setTimeout(() => onComplete(), 7000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1 } }}
      className="fixed inset-0 z-100 flex items-center justify-center bg-zinc-950 overflow-hidden pointer-events-none"
    >
      {/* 1. The Ball / Background Layer */}
      <motion.div
        initial={{ y: "-100vh", scale: 1, borderRadius: "50%" }}
        animate={{ 
          y: stage === "drop" ? "0vh" : "0vh",
          scale: stage === "expand" || stage === "welcome" || stage === "exit" ? 150 : 1,
          borderRadius: stage === "expand" || stage === "welcome" || stage === "exit" ? "0%" : "50%",
        }}
        transition={{ 
          y: { duration: 2, ease: [0.34, 1.56, 0.64, 1] }, // Bouncy drop
          scale: { duration: 2, ease: [0.8, 0, 0.2, 1] }, // Powerful expansion
          borderRadius: { duration: 1.5 }
        }}
        className="absolute w-24 h-24 bg-linear-to-br from-pink-300 via-white to-purple-400 shadow-[0_0_50px_rgba(255,255,255,0.5)] flex items-center justify-center"
      >
        {/* Inner white glow focus */}
        {stage === "drop" && (
           <div className="w-12 h-12 bg-white rounded-full blur-xl opacity-80" />
        )}
      </motion.div>

      {/* 2. Welcome Messaging Layer */}
      <AnimatePresence>
        {(stage === "welcome" || stage === "exit") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative z-20 text-center px-6"
          >
            <h1 className="text-4xl md:text-7xl font-thin tracking-[0.4em] uppercase text-zinc-900 drop-shadow-sm">
              Welcome to
            </h1>
            <motion.div
               initial={{ width: 0 }}
               animate={{ width: "100%" }}
               transition={{ duration: 1.5, delay: 0.5 }}
               className="h-px bg-zinc-900/10 mx-auto my-8"
            />
            <h2 className="text-5xl md:text-9xl font-black tracking-[0.8em] uppercase text-zinc-950 ml-[0.8em]">
              Loop Bazar
            </h2>
            <p className="mt-12 text-[10px] uppercase tracking-[1em] text-zinc-600 font-light italic">
               The Future of Curated Luxury
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Atmospheric Shimmer on the Gradient Background */}
      {(stage === "expand" || stage === "welcome" || stage === "exit") && (
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 0.2 }}
           className="absolute inset-0 z-10 pointer-events-none mix-blend-soft-light bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_70%)]"
        />
      )}
    </motion.div>
  );
};

export default CinematicPreloader;
