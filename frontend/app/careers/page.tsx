'use client';

import React from 'react';
import { motion } from 'framer-motion';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import { IoBriefcaseOutline, IoHeartOutline, IoSparklesOutline } from 'react-icons/io5';

const CareersPage = () => {
  const openPositions = [
    { title: 'Digital Architect', role: 'Engineering', location: 'Remote / Lahore', desc: 'Developing the future of digital-first artisanal marketplaces using Next.js and Redux.' },
    { title: 'Brand Storyteller', role: 'Marketing', location: 'Remote', desc: 'Crafting the cinematic narratives of our boutiques and the vision of Loop Bazar.' },
    { title: 'Customer Experience Lead', role: 'Support', location: 'Lahore', desc: 'Mastering the transition between premium boutiques and discerning consumers.' },
  ];

  const benefits = [
    { title: 'Freedom First', desc: 'Unparalleled remote work flexibility for the digital vanguard.' },
    { title: 'Creative Health', desc: 'Comprehensive health and wellness packages to maintain peak creativity.' },
    { title: 'Premium Gear', desc: 'Every architect receives the latest digital gear and an artisanal workstation setup.' },
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
              <IoBriefcaseOutline className="text-3xl" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-5xl font-thin tracking-tight text-zinc-900 sm:text-7xl lg:text-8xl"
          >
            Join the <span className="text-zinc-400">Vanguard</span>
          </motion.h1>
          <p className="mx-auto max-w-2xl text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">
            Build the future of digital boutique commerce
          </p>
        </div>

        {/* Culture Section */}
        <div className="mb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:items-center">
            <motion.div
               initial={{ opacity: 0, x: -20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="space-y-6"
            >
               <h2 className="text-3xl font-thin tracking-tight text-zinc-900">Our Digital Culture</h2>
               <p className="text-sm font-light text-zinc-500 leading-relaxed max-w-xl">
                 At Loop Bazar, we’re not just an engineering team; we’re architects of a new cinematic economy. 
                 We believe in radical ownership, high-end aesthetics, and the power of artisanal craftsmanship.
               </p>
               <div className="flex items-center gap-4 py-4">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-900"><IoHeartOutline /> Passion-Led</span>
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-900"><IoSparklesOutline /> Aesthetic-Driven</span>
               </div>
            </motion.div>
            <div className="glass p-1 aspect-[4/3] rounded-[3.5rem] overflow-hidden">
                <div className="h-full w-full bg-zinc-50 flex items-center justify-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Culture Visual Placeholder</p>
                </div>
            </div>
        </div>

        {/* Positions Section */}
        <div className="mb-32">
          <div className="mb-12">
             <h2 className="text-2xl font-thin tracking-tight text-zinc-900 uppercase tracking-[0.2em] text-center text-sm">Open Domains</h2>
          </div>
          <div className="space-y-6 max-w-5xl mx-auto">
            {openPositions.map((pos, idx) => (
              <motion.div
                key={pos.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="glass p-8 rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-center group hover:bg-black hover:text-white transition-all duration-500"
              >
                <div className="text-center sm:text-left space-y-2 lg:max-w-md">
                  <h3 className="text-2xl font-thin tracking-tight">{pos.title}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-500 transition-colors">{pos.role}</p>
                  <p className="text-xs font-light text-zinc-400 group-hover:text-zinc-500 transition-colors line-clamp-1">{pos.desc}</p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-6">
                  <span className="text-xs font-light text-zinc-400 group-hover:text-zinc-300">{pos.location}</span>
                  <button className="px-6 py-2.5 rounded-full border border-black/5 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                    Apply Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-32 bg-zinc-900 rounded-[4rem] p-16 lg:p-32 text-white">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {benefits.map((ben, idx) => (
                <div key={idx} className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">{ben.title}</h4>
                  <p className="text-sm font-light leading-relaxed text-zinc-400">{ben.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </BuyerPageShell>
  );
};

export default CareersPage;
