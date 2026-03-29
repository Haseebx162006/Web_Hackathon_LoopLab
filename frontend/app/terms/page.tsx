'use client';

import React from 'react';
import { motion } from 'framer-motion';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import { IoShieldCheckmarkOutline, IoDocumentTextOutline, IoScaleOutline } from 'react-icons/io5';

const TermsPage = () => {
  const sections = [
    { title: 'Platform Governance', desc: 'By accessing Loop Bazar, you agree to adhere to our premium code of conduct. We are a marketplace for artisanal boutiques, and we expect all users to interact with professional integrity.' },
    { title: 'Intellectual Property', desc: 'All designs, cinematic images, and brand identifiers on this platform are the property of their respective boutiques and are protected under international copyright law.' },
    { title: 'Verified Marketplace', desc: 'While we facilitate the transition between buyers and sellers, individual boutique policies apply to all transactions. We ensure a baseline of manual verification for all participants.' },
    { title: 'User Obligations', desc: 'Users must provide accurate profile data and maintain the security of their digital vault. Any violation of our safety protocols may result in permanent exclusion from the vanguard.' },
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
              <IoShieldCheckmarkOutline className="text-3xl" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-5xl font-thin tracking-tight text-zinc-900 sm:text-7xl lg:text-8xl"
          >
            Digital <span className="text-zinc-400">Governance</span>
          </motion.h1>
          <p className="mx-auto max-w-2xl text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">
            Terms of Service and Marketplace Rules
          </p>
        </div>

        {/* Content Section */}
        <div className="glass p-16 rounded-[4rem] max-w-5xl mx-auto space-y-16 bg-white/50 border border-zinc-100">
          {sections.map((sec, idx) => (
            <motion.div
              key={sec.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10 items-start"
            >
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-zinc-300">Section {idx + 1}</span>
                    <div className="h-[1px] w-8 bg-zinc-100"></div>
                 </div>
                 <h3 className="text-3xl font-thin tracking-tight text-zinc-900">{sec.title}</h3>
              </div>
              <p className="text-base font-light leading-relaxed text-zinc-500 italic max-w-2xl">
                 "{sec.desc}"
              </p>
            </motion.div>
          ))}
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-32 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="glass p-10 rounded-[3rem] space-y-4">
               <IoDocumentTextOutline className="text-3xl text-zinc-300" />
               <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Document Integrity</h4>
               <p className="text-xs font-light text-zinc-400 leading-relaxed">
                  These terms are subject to change as our ecosystem evolves. Users will be notified of significant amendments via their dashboard.
               </p>
            </div>
            <div className="glass p-10 rounded-[3rem] space-y-4">
               <IoScaleOutline className="text-3xl text-zinc-300" />
               <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Jurisdiction</h4>
               <p className="text-xs font-light text-zinc-400 leading-relaxed">
                  Transactional disputes are governed by federal commerce laws, ensuring a document-first approach to all resolutions.
               </p>
            </div>
        </div>
      </div>
    </BuyerPageShell>
  );
};

export default TermsPage;
