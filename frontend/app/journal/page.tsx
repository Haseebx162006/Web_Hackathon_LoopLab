'use client';

import React from 'react';
import { motion } from 'framer-motion';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import { IoBookOutline, IoTimeOutline, IoChevronForwardOutline } from 'react-icons/io5';

const JournalPage = () => {
  const articles = [
    { title: 'The Rise of Artisanal Commerce', date: 'October 12, 2023', excerpt: 'How small boutiques are reclaiming their space in the digital landscape through authentic storytelling and premium craft.', readTime: '5 min read', category: 'Culture' },
    { title: 'Cinematic Design in E-Commerce', date: 'November 05, 2023', excerpt: 'Exploring the boundary between luxury galleries and modern marketplaces using high-depth visual aesthetics.', readTime: '8 min read', category: 'Design' },
    { title: 'The LOOPVERSE Journey', date: 'December 20, 2023', excerpt: 'Deep diving into the hackathon that birthed Loop Bazar and the technical innovation behind our verified-first model.', readTime: '6 min read', category: 'Engineering' },
  ];

  const featuredStory = {
    title: 'Defining the Modern Digital Vanguard',
    excerpt: 'An in-depth look at how Loop Bazar is curating high-performance lifestyles for the contemporary era.',
    date: 'January 15, 2024',
    readTime: '12 min read'
  };

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
              <IoBookOutline className="text-3xl" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-5xl font-thin tracking-tight text-zinc-900 sm:text-7xl lg:text-8xl"
          >
            The <span className="text-zinc-400">Journal</span>
          </motion.h1>
          <p className="mx-auto max-w-2xl text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">
            Insights, Stories, and the Future of LoopBazar
          </p>
        </div>

        {/* Featured Story */}
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="mb-32 relative overflow-hidden rounded-[4rem] group cursor-pointer"
        >
           <div className="glass p-16 lg:p-32 space-y-8 bg-zinc-900 text-black transition-transform duration-700 group-hover:scale-[1.02]">
              <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-zinc-500">
                  <span>{featuredStory.date}</span>
                  <span className="h-1 w-8 bg-zinc-800"></span>
                  <span>{featuredStory.readTime}</span>
              </div>
              <h2 className="text-4xl font-thin tracking-tight sm:text-6xl max-w-2xl">{featuredStory.title}</h2>
              <p className="text-lg font-light text-zinc-400 max-w-xl italic leading-relaxed">"{featuredStory.excerpt}"</p>
              <div className="pt-10">
                 <button className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] hover:gap-6 transition-all group-hover:text-emerald-400">
                    Read Featured <IoChevronForwardOutline className="text-lg" />
                 </button>
              </div>
           </div>
        </motion.div>

        {/* Categories Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {articles.map((art, idx) => (
            <motion.div
              key={art.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="glass aspect-[16/10] rounded-[2.5rem] mb-6 overflow-hidden relative border border-zinc-100/50">
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-0 group-hover:scale-100 transition-transform duration-500 z-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900 bg-white px-6 py-3 rounded-full shadow-2xl shadow-black/20">Read Full Article</span>
                </div>
                <div className="absolute top-6 left-6">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">{art.category}</span>
                </div>
              </div>
              <div className="space-y-4 px-4">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <IoTimeOutline /> {art.readTime}
                </div>
                <h3 className="text-2xl font-thin tracking-tight text-zinc-900 group-hover:text-zinc-500 transition-colors uppercase">{art.title}</h3>
                <p className="text-xs font-light text-zinc-500 leading-relaxed italic">"{art.excerpt}"</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Subscribe Hint */}
        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           className="mt-40 text-center py-20 border-t border-zinc-100"
        >
           <h3 className="text-2xl font-thin tracking-tighter mb-4">Stay Curated</h3>
           <p className="text-xs font-light text-zinc-400 mb-8 uppercase tracking-widest">Receive monthly digital narratives directly to your inbox.</p>
           <button className="px-12 py-5 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:-translate-y-1 transition-all">Join the Newsletter</button>
        </motion.div>
      </div>
    </BuyerPageShell>
  );
};

export default JournalPage;
