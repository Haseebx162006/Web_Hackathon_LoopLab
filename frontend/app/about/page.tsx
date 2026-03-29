'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { IoGlobeOutline, IoCodeSlashOutline, IoSparklesOutline, IoHeartOutline } from 'react-icons/io5';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';

const AboutPage = () => {
  const developers = [
    {
      name: 'Visionary Architect',
      role: 'Full Stack Developer',
      image: '/assets/about/developer-1.jpeg',
    },
    {
      name: 'Creative Engineer',
      role: 'Full Stack Developer',
      image: '/assets/about/developer-1.jpeg',
    },
  ];

  const features = [
    {
      icon: <IoGlobeOutline className="text-2xl" />,
      title: 'Global Vision',
      desc: 'Bringing artisanal and premium crafts to the worldwide digital market.',
    },
    {
      icon: <IoCodeSlashOutline className="text-2xl" />,
      title: 'Modern Stack',
      desc: 'Engineered with Next.js, Redux, and Node.js for ultra-smooth performance.',
    },
    {
      icon: <IoSparklesOutline className="text-2xl" />,
      title: 'Bespoke Design',
      desc: 'Meticulously crafted with a focus on cinematic aesthetics and depth.',
    },
    {
      icon: <IoHeartOutline className="text-2xl" />,
      title: 'Market Integrity',
      desc: 'Dedicated to verified seller profiles and verified product authenticity.',
    },
  ];

  return (
    <BuyerPageShell>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-32 text-center lg:mb-48">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/50 px-6 py-2 shadow-sm backdrop-blur-md"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-black"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
              Project for LOOPVERSE Web Hackathon
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 text-6xl font-thin tracking-tighter text-zinc-900 sm:text-8xl lg:text-9xl"
          >
            Crafting the <span className="text-zinc-400">Next Horizon</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mx-auto max-w-3xl text-lg font-extralight leading-relaxed tracking-wide text-zinc-500 sm:text-xl"
          >
            Loop Bazar is a labor of passion, specifically engineered for the LOOPVERSE Web Hackathon. 
            We're redefining the standard for artisanal and premium boutique marketplaces.
          </motion.p>
        </div>

        {/* Narrative Section */}
        <div className="mb-32 grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-4xl font-thin tracking-tight text-zinc-900 sm:text-5xl">
                The Vision <span className="text-zinc-400">Behind</span> Loop Bazar
              </h2>
              <div className="h-1 w-20 bg-black"></div>
            </div>
            <p className="text-lg font-light leading-relaxed text-zinc-600">
              Our mission was to build a platform that didn't just sell products, but showcased the craftsmanship 
              of boutiques. We've combined cinematic aesthetics with a robust, verified-first technical foundation
              to ensure every boutique's story is told beautifully.
            </p>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {features.map((feat, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400">
                    {feat.icon}
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-900">{feat.title}</h4>
                  <p className="text-sm font-light leading-relaxed text-zinc-400">{feat.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass relative aspect-[4/5] overflow-hidden rounded-[3.5rem] p-1 shadow-2xl"
          >
            <img 
              src="/assets/logo/logo.png" 
              alt="Project Branding" 
              className="h-full w-full object-contain p-10 invert opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-50/50 to-transparent"></div>
          </motion.div>
        </div>

        {/* Developers Section */}
        <div className="mb-32">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-4xl font-thin tracking-tight text-zinc-900 sm:text-6xl">
              Meet the <span className="text-zinc-400">Creators</span>
            </h2>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-zinc-400">Driving the technical innovation</p>
          </div>

          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:gap-20 max-w-5xl mx-auto">
            {developers.map((dev, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="group relative"
              >
                <div className="glass overflow-hidden rounded-[3rem] p-4 transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:bg-white/40">
                  <div className="aspect-[3/4] overflow-hidden rounded-[2.2rem] bg-zinc-100 ring-1 ring-black/5">
                    <img
                      src={dev.image}
                      alt={dev.name}
                      className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110"
                    />
                  </div>
                  <div className="mt-8 pb-4 text-center">
                    <h3 className="text-3xl font-thin tracking-tight text-zinc-900 mb-2">{dev.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">{dev.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer Vision */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="rounded-[4rem] bg-zinc-900 px-10 py-24 text-center text-white"
        >
          <h2 className="mb-8 text-4xl font-thin tracking-tight sm:text-6xl">
            Beyond the <span className="text-zinc-500">Code</span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg font-extralight leading-relaxed tracking-wide text-zinc-400">
            For us, Loop Bazar is more than a hackathon project. It's an exploration of how high-end design can intersect 
            with modern commerce technology to create meaningful experiences for both artisans and consumers.
          </p>
          <div className="mt-12">
             <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-900">
                <IoHeartOutline className="text-2xl" />
             </div>
          </div>
        </motion.div>
      </div>
    </BuyerPageShell>
  );
};

export default AboutPage;
