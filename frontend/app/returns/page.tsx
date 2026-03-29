'use client';

import React from 'react';
import { motion } from 'framer-motion';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import { IoSyncOutline, IoWarningOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';

const ReturnsPage = () => {
  const steps = [
    { title: 'Easy Initiation', desc: 'Request your return within 7 days of delivery from your order history panel. Instant digital confirmation provided.', phase: '01' },
    { title: 'Quality Assurance', desc: 'Once initiated, we’ll arrange a premium pickup or provide a specialized location to return the artisanal item.', phase: '02' },
    { title: 'Rapid Inspection', desc: 'Our team will inspect the item’s condition within 48 hours of receipt to ensure it meets our quality standards.', phase: '03' },
    { title: 'Swift Refund', desc: 'Expect your refund within 7-10 business days after a successful inspection, directly to your original payment method.', phase: '04' },
  ];

  const nonReturnable = [
    'Bespoke & Custom-Made Masterpieces',
    'Personalized Engravings or Monograms',
    'Final Sale Archival Collections',
    'Artisanal Fragrances & Perishables',
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
              <IoSyncOutline className="text-3xl" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-5xl font-thin tracking-tight text-zinc-900 sm:text-7xl lg:text-8xl"
          >
            Assured <span className="text-zinc-400">Exchanges</span>
          </motion.h1>
          <p className="mx-auto max-w-2xl text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">
            Returns, Exchanges, and Refund Assurance
          </p>
        </div>

        {/* Phase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto mb-32">
          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="glass p-12 rounded-[4rem] border border-zinc-100 flex flex-col gap-6 group hover:translate-x-2' transition-all duration-500 hover:shadow-2xl"
            >
              <div className="flex items-center gap-4">
                 <span className="text-sm font-black uppercase tracking-[0.4em] text-zinc-300">Phase {step.phase}</span>
                 <div className="h-[1px] w-12 bg-zinc-100 group-hover:w-20 transition-all"></div>
              </div>
              <h3 className="text-3xl font-thin tracking-tight text-zinc-900">{step.title}</h3>
              <p className="text-sm font-light leading-relaxed text-zinc-500 italic">"{step.desc}"</p>
            </motion.div>
          ))}
        </div>

        {/* Non-Returnable Section */}
        <div className="max-w-4xl mx-auto mb-32">
            <div className="glass p-16 rounded-[4rem] bg-zinc-900 text-white relative overflow-hidden">
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8 text-center lg:text-left">
                        <div className="flex items-center gap-4 justify-center lg:justify-start">
                           <IoWarningOutline className="text-4xl text-zinc-500" />
                           <h2 className="text-3xl font-thin tracking-tight">Non-Returnable Items</h2>
                        </div>
                        <p className="text-sm font-light leading-relaxed text-zinc-400 italic">
                          "Due to the specialized nature of artisanal craftsmanship, certain items are considered final sale artifacts."
                        </p>
                    </div>
                    <ul className="space-y-4">
                        {nonReturnable.map(item => (
                            <li key={item} className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-zinc-400 group">
                                <IoCheckmarkCircleOutline className="text-zinc-600 transition-colors group-hover:text-white" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="absolute -right-20 -bottom-20 h-64 w-64 bg-zinc-800 rounded-full blur-[100px] opacity-20 pointer-events-none" />
            </div>
        </div>

        {/* Refund Timeline Hint */}
        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           className="text-center py-20 border-t border-zinc-100"
        >
           <h3 className="text-2xl font-thin tracking-tighter mb-4">Refund Timeline Expectation</h3>
           <div className="max-w-2xl mx-auto grid grid-cols-3 gap-8 mt-12">
               <div className="space-y-2">
                   <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Step 01</p>
                   <p className="text-xs font-light text-zinc-900 italic">Initiation (24h)</p>
               </div>
               <div className="space-y-2">
                   <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Step 02</p>
                   <p className="text-xs font-light text-zinc-900 italic">Transit (3-5d)</p>
               </div>
               <div className="space-y-2">
                   <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Step 03</p>
                   <p className="text-xs font-light text-zinc-900 italic">Refund (7-10d)</p>
               </div>
           </div>
        </motion.div>
      </div>
    </BuyerPageShell>
  );
};

export default ReturnsPage;
