'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import { IoGridOutline, IoTrendingUpOutline, IoLayersOutline } from 'react-icons/io5';

const categories = [
  { name: 'Fashion', desc: 'Bespoke apparel and artisanal clothing, where every stitch tells a story of creative passion.', path: '/products?category=fashion' },
  { name: 'Home Decor', desc: 'Handcrafted furniture and designer accents designed to elevate your living spaces.', path: '/products?category=home-decor' },
  { name: 'Jewelry', desc: 'Exquisite gems and handmade ornaments created by master craftsmen for timeless elegance.', path: '/products?category=jewelry' },
  { name: 'Leather Goods', desc: 'Premium crafted bags and accessories using the finest sustainably sourced materials.', path: '/products?category=leather' },
  { name: 'Art & Collectibles', desc: 'Unique digital-physical masterpieces that redefine the modern collector’s vision.', path: '/products?category=art' },
  { name: 'Lifestyle', desc: 'A curation of high-performance items designed for the modern, discerning individual.', path: '/products?category=lifestyle' },
];

const trendingTags = ['Handcrafted', 'Sustainable Luxe', 'Modular Design', 'Heritage Series', 'Digital Art'];

const CategoriesPage = () => {
  return (
    <BuyerPageShell>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-20 text-center lg:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex justify-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white shadow-2xl">
              <IoGridOutline className="text-3xl" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-5xl font-thin tracking-tight text-zinc-900 sm:text-7xl lg:text-8xl"
          >
            Browse <span className="text-zinc-400">By Domain</span>
          </motion.h1>
          <p className="mx-auto max-w-2xl text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">
            Navigation through artisanal expertise
          </p>
        </div>

        {/* Trending Categories Section */}
        <div className="mb-32">
          <div className="mb-12 flex items-center gap-4">
             <IoTrendingUpOutline className="text-zinc-400 text-xl" />
             <h2 className="text-sm font-black uppercase tracking-[0.4em] text-zinc-900">Trending Now</h2>
          </div>
          <div className="flex flex-wrap gap-4">
            {trendingTags.map((tag, idx) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="px-8 py-4 rounded-full border border-black/5 bg-white text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:bg-black hover:text-white transition-all duration-300 cursor-pointer"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Main Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="group"
            >
              <Link href={cat.path}>
                <div className="glass p-12 rounded-[3.5rem] h-full space-y-8 transition-all duration-500 hover:-translate-y-4 hover:bg-black hover:text-white group-hover:shadow-2xl">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-500">Domain 0{idx + 1}</span>
                    <div className="h-10 w-10 rounded-full border border-black/5 flex items-center justify-center group-hover:border-white/20 transition-all group-hover:rotate-45">
                        <svg className="w-5 h-5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-thin tracking-tight">{cat.name}</h3>
                    <p className="text-sm font-light leading-relaxed group-hover:text-zinc-400 transition-colors uppercase italic">"{cat.desc}"</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Curation Footer */}
        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           className="mt-40 rounded-[4rem] bg-zinc-50 p-16 text-center lg:p-32"
        >
           <IoLayersOutline className="mx-auto mb-8 text-4xl text-zinc-300" />
           <h3 className="text-3xl font-thin tracking-tight mb-6">Expert Curation</h3>
           <p className="max-w-xl mx-auto text-sm font-light text-zinc-500 leading-relaxed">
             Our curators continuously scout the globe for boutiques that exemplify these core domains, 
             ensuring that every category on Loop Bazar represents the pinnacle of its craft.
           </p>
        </motion.div>
      </div>
    </BuyerPageShell>
  );
};

export default CategoriesPage;
