"use client";

import React from "react";
import { motion } from "framer-motion";

interface Category {
  id: string;
  name: string;
  label: string;
  image: string;
  color: string;
  accent: string;
  className: string;
  assetClass: string;
}

const categories: Category[] = [
  {
    id: "01",
    name: "Cyber Audio",
    label: "Electronics",
    image: "/assets/categories/headphone.png",
    color: "bg-[#D4A5FF]/20",
    accent: "text-[#B066FF]",
    className: "w-full md:w-[58%] h-[500px]",
    assetClass: "w-[80%]",
  },
  {
    id: "02",
    name: "Noir Fashion",
    label: "Style",
    image: "/assets/categories/bag.png",
    color: "bg-[#FFB7CE]/20",
    accent: "text-[#FF70A1]",
    className: "w-full md:w-[38%] h-[350px] md:mt-24",
    assetClass: "w-[70%]",
  },
  {
    id: "03",
    name: "Mod Living",
    label: "Home",
    image: "/assets/categories/chair.png",
    color: "bg-blue-100/40",
    accent: "text-blue-500",
    className: "w-full md:w-[35%] h-[450px] md:-mt-12",
    assetClass: "w-[75%]",
  },
  {
    id: "04",
    name: "Nano Gear",
    label: "Accessories",
    image: "/assets/categories/watch.png",
    color: "bg-emerald-100/30",
    accent: "text-emerald-500",
    className: "w-full md:w-[60%] h-[400px]",
    assetClass: "w-[65%]",
  },
];

const CategoryCard = ({ category, index }: { category: Category; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ 
        delay: index * 0.1, 
        duration: 1, 
        ease: [0.23, 1, 0.32, 1] 
      }}
      className={`relative group ${category.className} rounded-[4rem] overflow-hidden p-8 flex flex-col justify-between border border-white/50 shadow-2xl shadow-black/5 hover:shadow-brand-purple/10 transition-all duration-700 ${category.color} backdrop-blur-xl`}
    >
      {/* Dynamic Background Blob */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/20 blur-[100px] rounded-full group-hover:bg-white/40 transition-colors duration-700" />
      
      {/* Text Content */}
      <div className="relative z-20 pointer-events-none">
        <div className="flex items-center gap-3 mb-2">
            <span className={`text-[10px] font-black uppercase tracking-[0.6em] ${category.accent}`}>
                SEC. {category.id}
            </span>
            <div className="h-[1px] w-8 bg-black/10" />
        </div>
        <h3 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tighter leading-[0.9] italic uppercase">
          {category.name.split(' ')[0]} <br />
          <span className="opacity-40">{category.name.split(' ')[1]}</span>
        </h3>
      </div>

      {/* Floating 3D Asset */}
      <div className="absolute inset-0 flex items-center justify-end p-6 z-10 pointer-events-none">
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, 3, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 5 + index, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className={`${category.assetClass} max-h-full flex items-center justify-center`}
        >
          <img
            src={category.image}
            alt={category.name}
            className="w-full h-auto object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.15)] group-hover:scale-110 group-hover:rotate-[-5deg] transition-all duration-700"
          />
        </motion.div>
      </div>

      {/* Action Area */}
      <div className="relative z-20 flex justify-between items-end">
         <div className="space-y-1">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{category.label}</div>
            <div className={`h-1 w-12 rounded-full ${category.accent.replace('text-', 'bg-')} opacity-30 group-hover:w-20 transition-all duration-500`} />
         </div>
         
         <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            className="w-12 h-12 rounded-2xl bg-white/80 border border-white shadow-lg flex items-center justify-center text-xl font-light text-gray-400 hover:text-gray-900 hover:bg-white transition-all"
         >
            +
         </motion.button>
      </div>

      {/* Glass Scanline Overlay */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_50%,transparent_50%)] bg-[length:100%_4px]" />
    </motion.div>
  );
};

const Categories = () => {
  return (
    <section className="relative py-32 px-6 md:px-12 bg-brand-offwhite overflow-hidden">
      {/* Background Decorative Text */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 whitespace-nowrap text-[15vw] font-black text-black/[0.2] pointer-events-none select-none uppercase tracking-tighter">
        CATEGORIES
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-12 mb-32 relative z-10">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
                <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: 80 }}
                    className="h-[2px] bg-brand-purple"
                />
            </div>
            <h2 className="text-6xl md:text-7xl font-black text-gray-900 tracking-tighter leading-[0.85] uppercase italic">
               Shop <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-pink via-brand-purple to-brand-pink drop-shadow-[0_2px_10px_rgba(212,165,255,0.3)]">Categories</span>
            </h2>
          </div>
          
         
        </div>

        {/* Randomized Masonry Flow */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-x-12 md:gap-y-20 relative z-10">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.id} category={cat} index={i} />
          ))}
        </div>
      </div>

      {/* Floating Particles in Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <motion.div 
            animate={{ y: [0, -100, 0], x: [0, 50, 0] }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute top-1/2 right-[10%] w-64 h-64 bg-brand-pink/20 blur-[120px] rounded-full"
         />
         <motion.div 
            animate={{ y: [0, 100, 0], x: [0, -50, 0] }}
            transition={{ duration: 30, repeat: Infinity }}
            className="absolute bottom-0 left-[5%] w-96 h-96 bg-brand-purple/20 blur-[150px] rounded-full"
         />
      </div>
    </section>
  );
};

export default Categories;
