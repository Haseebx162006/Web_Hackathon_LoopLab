'use client';

import React from 'react';
import { motion } from 'framer-motion';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import { IoLayersOutline, IoSparklesOutline, IoTimeOutline } from 'react-icons/io5';

const CollectionsPage = () => {
  const currentCollections = [
    { title: 'The Artisanal Series', desc: 'Handcrafted excellence by master creators, focusing on raw materials and traditional techniques.', volume: 'Vol. 01', items: '12 Pieces' },
    { title: 'Modern Vanguard', desc: 'Minimalist aesthetics for the contemporary era, where function meets high-end digital art.', volume: 'Vol. 04', items: '08 Pieces' },
  ];

  const archivedCollections = [
    { title: 'Heritage Edition', desc: 'Time-honored designs reimagined for the modern collector.', year: '2023' },
    { title: 'Monochrome Luxe', desc: 'A deep exploration into the power of simplicity in black and white.', year: '2022' },
    { title: 'Neon Nomad', desc: 'Vibrant textures inspired by the future of urban exploration.', year: '2022' },
  ];

  return (
    <BuyerPageShell>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-20 text-center lg:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex justify-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white shadow-2xl shadow-black/20">
              <IoLayersOutline className="text-3xl" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-5xl font-thin tracking-tight text-zinc-900 sm:text-7xl lg:text-8xl"
          >
            Curated <span className="text-zinc-400">Collections</span>
          </motion.h1>
          <p className="mx-auto max-w-2xl text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">
            Exploration of specialized digital galleries
          </p>
        </div>

        {/* Current Collections */}
        <div className="mb-32">
          <div className="mb-12 flex items-center gap-4">
             <IoSparklesOutline className="text-zinc-400 text-xl" />
             <h2 className="text-2xl font-thin tracking-tight text-zinc-900 uppercase tracking-[0.2em] text-sm">Seasonal Highlights</h2>
          </div>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {currentCollections.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="glass group relative overflow-hidden rounded-[4rem] p-12 transition-all duration-700 hover:-translate-y-4 hover:shadow-2xl hover:bg-white/50"
              >
                <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{item.volume}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 bg-zinc-100 px-3 py-1 rounded-full">{item.items}</span>
                  </div>
                  <h3 className="text-4xl font-thin tracking-tight text-zinc-900">{item.title}</h3>
                  <p className="text-base font-light leading-relaxed text-zinc-500 max-w-md">{item.desc}</p>
                  <div className="pt-8">
                    <button className="text-[11px] font-black uppercase tracking-[0.3em] text-black underline underline-offset-8 decoration-zinc-200 hover:decoration-black transition-all">Explore Series</button>
                  </div>
                </div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-black/5 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-150 blur-3xl" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Archived Collections */}
        <div className="mb-20">
          <div className="mb-12 flex items-center gap-4">
             <IoTimeOutline className="text-zinc-400 text-xl" />
             <h2 className="text-2xl font-thin tracking-tight text-zinc-900 uppercase tracking-[0.2em] text-sm">The Archives</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
             {archivedCollections.map((item, idx) => (
               <motion.div
                 key={item.title}
                 initial={{ opacity: 0, scale: 0.95 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.1 + idx * 0.1 }}
                 className="glass p-8 rounded-[3rem] border border-zinc-100/50 hover:bg-zinc-50 transition-colors"
               >
                 <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-4 block">{item.year}</span>
                 <h4 className="text-xl font-thin tracking-tight text-zinc-900 mb-2">{item.title}</h4>
                 <p className="text-xs font-light text-zinc-400 leading-relaxed">{item.desc}</p>
               </motion.div>
             ))}
          </div>
        </div>

        {/* Vision Quote */}
        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           className="mt-40 text-center py-20 border-t border-zinc-100"
        >
           <p className="text-3xl font-thin italic tracking-tight text-zinc-400 max-w-3xl mx-auto leading-tight">
             "A collection is not just a group of products, but a narrative arc that explores the intersection of human hands and digital perfection."
           </p>
        </motion.div>
      </div>
    </BuyerPageShell>
  );
};

export default CollectionsPage;
