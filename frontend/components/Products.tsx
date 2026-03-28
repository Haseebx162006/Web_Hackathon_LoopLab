"use client";

import React from "react";
import { motion } from "framer-motion";

const products = [
  {
    id: 1,
    name: "Loop Watch S1",
    price: "$299",
    category: "Accessories",
    image: "/assets/products/watch.png",
    color: "bg-[#D4A5FF]/10",
    accent: "text-[#B066FF]",
    btnColor: "bg-[#B066FF]",
    className: "md:col-span-2 md:row-span-2 h-[500px]",
  },
  {
    id: 2,
    name: "Aura Speaker",
    price: "$450",
    category: "Electronics",
    image: "/assets/products/speaker.png",
    color: "bg-[#FFB7CE]/10",
    accent: "text-[#FF70A1]",
    btnColor: "bg-[#FF70A1]",
    className: "md:col-span-1 md:row-span-1 h-[350px]",
  },
  {
    id: 3,
    name: "Vesta Chair",
    price: "$890",
    category: "Home Decor",
    image: "/assets/products/chair.png",
    color: "bg-blue-50",
    accent: "text-blue-500",
    btnColor: "bg-blue-500",
    className: "md:col-span-1 md:row-span-2 h-[450px]",
  },
  {
    id: 4,
    name: "Nebula Sneakers",
    price: "$180",
    category: "Fashion",
    image: "/assets/products/sneakers.png",
    color: "bg-emerald-50",
    accent: "text-emerald-500",
    btnColor: "bg-emerald-500",
    className: "md:col-span-1 md:row-span-1 h-[380px]",
  },
  {
    id: 5,
    name: "Prism Lamp",
    price: "$220",
    category: "Home Decor",
    image: "/assets/products/lamp.png",
    color: "bg-amber-50",
    accent: "text-amber-500",
    btnColor: "bg-amber-500",
    className: "md:col-span-1 md:row-span-1 h-[350px]",
  },
  {
    id: 6,
    name: "Apex Backpack",
    price: "$150",
    category: "Accessories",
    image: "/assets/products/backpack.png",
    color: "bg-slate-100/50",
    accent: "text-slate-600",
    btnColor: "bg-slate-600",
    className: "md:col-span-1 md:row-span-1 h-[350px]",
  },
  {
    id: 7,
    name: "Zen Vase",
    price: "$95",
    category: "Home Decor",
    image: "/assets/products/vase.png",
    color: "bg-stone-50",
    accent: "text-stone-500",
    btnColor: "bg-stone-500",
    className: "md:col-span-1 md:row-span-1 h-[350px]",
  },
  {
    id: 8,
    name: "Lumina Audio",
    price: "$550",
    category: "Electronics",
    image: "/assets/products/lumina.png",
    color: "bg-indigo-50",
    accent: "text-indigo-500",
    btnColor: "bg-indigo-500",
    className: "md:col-span-1 md:row-span-1 h-[350px]",
  },
];

const ProductCard = ({ product, index }: { product: any; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.8 }}
      className={`relative group ${product.className} rounded-[3rem] overflow-hidden ${product.color} border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-700 flex flex-col p-8`}
    >
      <div className="flex justify-between items-start z-10 transition-transform duration-500 group-hover:-translate-y-2">
        <div className="space-y-1">
          <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${product.accent}`}>
            {product.category}
          </span>
          <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">
            {product.name}
          </h3>
        </div>
        <div className="text-xl font-black text-gray-900/60 tracking-tighter">
          {product.price}
        </div>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center pointer-events-none">
        <motion.div
           animate={{ 
             y: [0, -10, 0],
             rotate: [0, 2, 0]
           }}
           transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
           className="w-full h-full flex items-center justify-center"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-[85%] h-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-700"
          />
        </motion.div>
      </div>

      {/* Hover Action Area */}
      <div className="absolute inset-x-0 bottom-0 p-6 flex gap-3 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-white/90 to-transparent pt-12">
         <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-4 rounded-xl bg-white/80 backdrop-blur-md text-gray-900 font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg border border-white/50 transition-all hover:bg-white"
         >
            Details
         </motion.button>
         <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-[1.5] py-4 rounded-xl ${product.btnColor} text-white font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all hover:brightness-110 flex items-center justify-center gap-2 `}
         >
            Add to Bag <span>+</span>
         </motion.button>
      </div>

      <div className={`absolute -right-20 -bottom-20 w-64 h-64 blur-[120px] rounded-full opacity-20 ${product.color.replace('/10', '/30')}`} />
    </motion.div>
  );
};

const Products = () => {
  return (
    <section className="relative py-32 px-6 md:px-12 bg-white overflow-hidden">
      <div className="absolute top-24 left-1/2 -translate-x-1/2 whitespace-nowrap text-[16vw] font-black text-black/[0.2] pointer-events-none select-none uppercase tracking-tighter z-0">
        PRODUCTS
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between gap-12 mb-32">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
                <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: 80 }}
                    className="h-[2px] bg-brand-purple"
                />
            </div>
            <h2 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[0.85] uppercase italic">
               Featured <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-pink via-brand-purple to-brand-pink drop-shadow-[0_2px_10px_rgba(212,165,255,0.3)]">Products</span>
            </h2>
          </div>
          
         
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {products.map((product, i) => (
             <ProductCard key={product.id} product={product} index={i} />
           ))}
        </div>
      </div>
    </section>
  );
};

export default Products;
