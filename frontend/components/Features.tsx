"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

interface Feature {
  image: string;
  title: string;
  desc: string;
  color: string;
  accent: string;
  btnColor: string;
  blobColor: string;
}

const features: Feature[] = [
  {
    image: "/assets/features/truck.png",
    title: "Free Shipping",
    desc: "Experience the luxury of zero-cost delivery. We bring our products to your doorstep with unmatched speed and care, ensuring a premium journey on every order over $100.",
    color: "bg-[#D4A5FF]/20", 
    accent: "text-[#B066FF]",
    btnColor: "bg-[#B066FF]",
    blobColor: "bg-[#D4A5FF]",
  },
  {
    image: "/assets/features/prize.png",
    title: "Daily Surprises",
    desc: "Unbox something extraordinary every day. Our curated selection of surprise offers brings you exclusive savings up to 25%, making luxury more accessible than ever.",
    color: "bg-[#FFB7CE]/20",
    accent: "text-[#FF70A1]",
    btnColor: "bg-[#FF70A1]",
    blobColor: "bg-[#FFB7CE]",
  },
  {
    image: "/assets/features/price.png",
    title: "Factory Pricing",
    desc: "Craftsmanship meets value. By cutting out the middleman, we deliver factory-direct prices without compromising on the high-end quality you expect from Loop.",
    color: "bg-[#D4A5FF]/20",
    accent: "text-[#B066FF]",
    btnColor: "bg-[#B066FF]",
    blobColor: "bg-[#D4A5FF]",
  },
  {
    image: "/assets/features/secure.png",
    title: "Secure Checkout",
    desc: "Your peace of mind is our priority. Our bank-grade encryption and 100% protected payment gateway ensure that every transaction is as safe as it is seamless.",
    color: "bg-[#FFB7CE]/20",
    accent: "text-[#FF70A1]",
    btnColor: "bg-[#FF70A1]",
    blobColor: "bg-[#FFB7CE]",
  },
];

const FeatureCard = ({
  feature,
  index,
  scrollYProgress,
  isMobile,
}: {
  feature: Feature;
  index: number;
  scrollYProgress: MotionValue<number>;
  isMobile: boolean;
}) => {
  const targetScale = 1 - (features.length - index) * 0.05;
  const range = [index * 0.25, (index + 1) * 0.25];
  
  const scale = useTransform(scrollYProgress, range, [1, targetScale]);
  const y = useTransform(scrollYProgress, range, [index === 0 ? 0 : 500, 0]);

  if (isMobile) {
    return (
      <div className={`relative overflow-hidden rounded-[2rem] p-6 flex flex-col items-center text-center gap-6 border border-gray-100 shadow-xl z-10 ${feature.color.replace('/20', '/40')}`}>
        <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full blur-[40px] opacity-20 ${feature.blobColor}`} />
        
        <div className="space-y-3 z-10">
          <div className={`text-[10px] font-black uppercase tracking-widest ${feature.accent}`}>
            Module 0{index + 1}
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">
            {feature.title}
          </h2>
          <p className="text-xs font-bold text-gray-600/80 leading-relaxed line-clamp-3">
            {feature.desc}
          </p>
        </div>

        <div className="relative z-10 w-full max-w-[150px]">
          <img 
            src={feature.image} 
            alt={feature.title}
            className="w-full h-auto drop-shadow-xl"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-20 h-[80vh] flex items-center justify-center p-4 md:p-8">
      
      <motion.div
        style={{ 
          scale, 
          y: index === 0 ? 0 : y,
        }}
        className={`relative h-full w-full max-w-5xl rounded-[4rem] bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden flex flex-col md:flex-row items-center p-8 md:p-16 gap-12 transition-colors z-10 ${feature.color.replace('/20', '/40')}`}
      >
        <div className={`absolute -right-20 -top-20 h-[500px] w-[500px] rounded-full blur-[60px] opacity-20 ${feature.blobColor}`} />
        <div className={`absolute -left-20 -bottom-20 h-[400px] w-[400px] rounded-full blur-[70px] opacity-15 ${feature.blobColor}`} />
        
        <div className="flex-1 space-y-8 z-10 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-sm font-black uppercase tracking-[0.6em] ${feature.accent}`}
          >
            Module 0{index + 1}
          </motion.div>
          
          <h2 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-[1.05]">
            {feature.title.split(' ')[0]} <br/> 
            <span className={feature.accent}>{feature.title.split(' ')[1]}</span>
          </h2>
          
          <p className="text-lg font-bold text-gray-600/80 leading-relaxed max-w-md">
            {feature.desc}
          </p>
        </div>

        <div className="flex-1 relative z-10 w-full max-w-[450px]">
          <motion.div
            whileInView={{ 
              y: [0, -25, 0],
              rotate: [0, 4, 0],
              scale: [1, 1.05, 1]
            }}
            viewport={{ once: false }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full relative group"
          >
            <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-40 h-6 bg-black/5 blur-xl rounded-full" />
            <img 
              src={feature.image} 
              alt={feature.title}
              className="w-full h-auto drop-shadow-[0_40px_60px_rgba(0,0,0,0.18)] transition-transform duration-700 group-hover:scale-110"
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

const Features = () => {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 996);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section ref={containerRef} className={`relative ${isMobile ? 'h-auto py-20 pb-32' : 'h-[400vh] pb-[50vh]'} bg-brand-offwhite`}>
      {/* Background Decorative Text */}
      <div className={`absolute ${isMobile ? 'top-10 text-[10vw] opacity-10' : 'top-24 text-[16vw] opacity-20'} left-1/2 -translate-x-1/2 whitespace-nowrap font-black text-black pointer-events-none select-none uppercase tracking-tighter z-0`}>
        FEATURES
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 pt-32 mb-20">
        <div className="flex flex-col md:flex-row items-end justify-between gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
                <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: 80 }}
                    className="h-[2px] bg-brand-purple"
                />
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-[0.85] uppercase italic">
               Core <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-pink via-brand-purple to-brand-pink drop-shadow-[0_2px_10px_rgba(212,165,255,0.3)]">Features</span>
            </h2>
          </div>
        </div>
      </div>

      <div className={isMobile ? "max-w-7xl mx-auto px-4 grid grid-cols-2 gap-4" : ""}>
        {features.map((feature, index) => (
            <FeatureCard 
                key={index} 
                feature={feature} 
                index={index} 
                scrollYProgress={scrollYProgress}
                isMobile={isMobile}
            />
        ))}
      </div>

        {/* Section Outro */}
        {!isMobile && <div className="absolute bottom-0 left-0 w-full h-[20vh] bg-gradient-to-t from-white to-transparent pointer-events-none" />}
    </section>
  );
};

export default Features;
