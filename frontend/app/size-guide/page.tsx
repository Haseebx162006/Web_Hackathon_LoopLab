'use client';

import React from 'react';
import { motion } from 'framer-motion';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import { IoResizeOutline, IoAnalyticsOutline, IoColorPaletteOutline } from 'react-icons/io5';

const SizeGuidePage = () => {
  const mensSizes = [
    { size: 'S', chest: '36-38"', waist: '30-32"', sleeve: '32-33"' },
    { size: 'M', chest: '39-41"', waist: '33-35"', sleeve: '33-34"' },
    { size: 'L', chest: '42-44"', waist: '36-38"', sleeve: '34-35"' },
    { size: 'XL', chest: '45-47"', waist: '39-41"', sleeve: '35-36"' },
  ];

  const womensSizes = [
    { size: 'XS', bust: '32-34"', waist: '24-26"', hips: '34-36"' },
    { size: 'S', bust: '35-37"', waist: '27-29"', hips: '37-39"' },
    { size: 'M', bust: '38-40"', waist: '30-32"', hips: '40-42"' },
    { size: 'L', bust: '41-43"', waist: '33-35"', hips: '43-45"' },
  ];

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
              <IoResizeOutline className="text-3xl" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-5xl font-thin tracking-tight text-zinc-900 sm:text-7xl lg:text-8xl"
          >
            Perfect <span className="text-zinc-400">Dimensions</span>
          </motion.h1>
          <p className="mx-auto max-w-2xl text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">
            Specialized sizing for artisanal collections
          </p>
        </div>

        {/* Introduction Section */}
        <div className="glass p-12 rounded-[4rem] max-w-5xl mx-auto mb-32 space-y-12 bg-white/50">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                 <h2 className="text-4xl font-thin tracking-tight text-zinc-900">Craftsmanship Sizing</h2>
                 <p className="text-sm font-light leading-relaxed text-zinc-500">
                    Because many of our boutiques offer unique, handcrafted items, sizing may vary significantly between designers. 
                    We recommend referring to the specific size chart provided on each individual product page for the most accurate metrics.
                 </p>
                 <div className="flex items-center gap-6 pt-4">
                    <IoAnalyticsOutline className="text-3xl text-zinc-300" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Precision Metric System</p>
                 </div>
              </div>
              <div className="space-y-4 bg-black/5 p-8 rounded-[2.5rem]">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-900 mb-4">Measurement Technique</h4>
                 <ul className="text-xs font-light text-zinc-500 space-y-4">
                    <li className="flex gap-4">
                       <span className="font-bold text-zinc-900">01</span>
                       <span><span className="text-zinc-900 uppercase font-black tracking-widest text-[9px]">Chest:</span> Measure around the fullest part of your chest, keeping the tape horizontal.</span>
                    </li>
                    <li className="flex gap-4">
                       <span className="font-bold text-zinc-900">02</span>
                       <span><span className="text-zinc-900 uppercase font-black tracking-widest text-[9px]">Waist:</span> Measure around the narrowest part (typically where your body bends side to side).</span>
                    </li>
                    <li className="flex gap-4">
                       <span className="font-bold text-zinc-900">03</span>
                       <span><span className="text-zinc-900 uppercase font-black tracking-widest text-[9px]">Hips:</span> Measure around the fullest part of your hips while standing with feet together.</span>
                    </li>
                 </ul>
              </div>
           </div>
        </div>

        {/* Sizing Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto mb-32">
            {/* Mens Table */}
            <div className="space-y-8">
               <h3 className="text-2xl font-thin tracking-tight text-zinc-900 px-6">Men's Standard Range</h3>
               <div className="glass overflow-hidden rounded-[3rem] border border-zinc-50">
                  <table className="w-full text-left bg-white/30">
                     <thead className="bg-black/5">
                        <tr>
                           <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-zinc-500">Size</th>
                           <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-zinc-500">Chest</th>
                           <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-zinc-500">Waist</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-50">
                        {mensSizes.map((row, idx) => (
                           <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                              <td className="px-8 py-6 text-lg font-thin text-zinc-900">{row.size}</td>
                              <td className="px-8 py-6 text-sm font-light text-zinc-400">{row.chest}</td>
                              <td className="px-8 py-6 text-sm font-light text-zinc-400">{row.waist}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Womens Table */}
            <div className="space-y-8">
               <h3 className="text-2xl font-thin tracking-tight text-zinc-900 px-6">Women's Standard Range</h3>
               <div className="glass overflow-hidden rounded-[3rem] border border-zinc-50">
                  <table className="w-full text-left bg-white/30">
                     <thead className="bg-black/5">
                        <tr>
                           <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-zinc-500">Size</th>
                           <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-zinc-500">Bust</th>
                           <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-zinc-500">Waist</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-50">
                        {womensSizes.map((row, idx) => (
                           <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                              <td className="px-8 py-6 text-lg font-thin text-zinc-900">{row.size}</td>
                              <td className="px-8 py-6 text-sm font-light text-zinc-400">{row.bust}</td>
                              <td className="px-8 py-6 text-sm font-light text-zinc-400">{row.waist}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
        </div>

        {/* Custom Sizing Branding */}
        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           className="rounded-[4rem] bg-zinc-900 p-16 text-center lg:p-32 text-white"
        >
           <IoColorPaletteOutline className="mx-auto mb-8 text-4xl text-zinc-700" />
           <h3 className="text-3xl font-thin tracking-tight mb-8">Bespoke Precision Sizing</h3>
           <p className="max-w-xl mx-auto text-sm font-light text-zinc-400 leading-relaxed mb-10 italic">
             "Our verified boutiques often provide custom tailoring. Use the chat feature to send your literal dimensions directly to the creator."
           </p>
           <button className="px-8 py-4 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Start Bespoke Journey</button>
        </motion.div>
      </div>
    </BuyerPageShell>
  );
};

export default SizeGuidePage;
