'use client';

import React from 'react';
import { motion } from 'framer-motion';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import { IoLeafOutline, IoRocketOutline, IoPeopleOutline } from 'react-icons/io5';

const SustainabilityPage = () => {
  const commitments = [
    { title: 'Eco-Forward Crafting', desc: 'Prioritizing artisanal methods that minimize environmental footprint through traditional, low-energy processes.' },
    { title: 'Conscious Packaging', desc: '100% biodegradable and recycled materials for all digital-physical bridges, zero plastic mandate.' },
    { title: 'Ethical Sourcing', desc: 'Ensuring every boutique adheres to fair trade and transparent sourcing laws across all supply chains.' },
  ];

  const roadmap = [
    { year: '2024', goal: 'Zero-Waste Digital Operations', status: 'In Progress' },
    { year: '2025', goal: '100% Sustainable Artisanal Chain', status: 'Planned' },
    { year: '2026', goal: 'Carbon-Negative Marketplace', status: 'Vision' },
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
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white shadow-2xl shadow-emerald-500/10">
              <IoLeafOutline className="text-3xl" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-5xl font-thin tracking-tight text-zinc-900 sm:text-7xl lg:text-8xl"
          >
            Ethical <span className="text-emerald-500/40">Future</span>
          </motion.h1>
          <p className="mx-auto max-w-2xl text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">
            Our commitment to the environment and humanity
          </p>
        </div>

        {/* Core Commitments Section */}
        <div className="mb-32 space-y-12 max-w-4xl mx-auto">
          {commitments.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="glass p-10 rounded-[3rem] border border-zinc-100 flex flex-col md:flex-row gap-8 items-center"
            >
              <div className="text-6xl font-thin text-zinc-100">0{idx + 1}</div>
              <div className="space-y-3">
                <h3 className="text-3xl font-thin text-zinc-900 tracking-tight">{item.title}</h3>
                <p className="text-sm font-light leading-relaxed text-zinc-500">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Roadmap Section */}
        <div className="mb-32">
          <div className="mb-12 flex items-center justify-center gap-4 text-center flex-col">
             <IoRocketOutline className="text-zinc-400 text-3xl" />
             <h2 className="text-2xl font-thin tracking-tight text-zinc-900">The 2024-2026 Roadmap</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {roadmap.map((item, idx) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + idx * 0.1 }}
                className="glass p-8 rounded-[2.5rem] border border-zinc-50 text-center"
              >
                <span className="text-sm font-black uppercase tracking-[0.3em] text-zinc-300 block mb-4">{item.year}</span>
                <h4 className="text-lg font-light tracking-tight text-zinc-900 mb-4">{item.goal}</h4>
                <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">{item.status}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Partners Section */}
        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           className="rounded-[4rem] bg-zinc-900 p-16 text-center lg:p-32"
        >
           <IoPeopleOutline className="mx-auto mb-8 text-4xl text-zinc-700" />
           <h3 className="text-3xl font-thin tracking-tight mb-8 text-white">Partners In <span className="text-zinc-500">Green</span></h3>
           <p className="max-w-xl mx-auto text-sm font-light text-zinc-400 leading-relaxed">
             We collaborate with global artisanal networks that share our vision of a more sustainable digital-first marketplace.
           </p>
        </motion.div>
      </div>
    </BuyerPageShell>
  );
};

export default SustainabilityPage;
