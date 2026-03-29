'use client';

import React from 'react';
import { motion } from 'framer-motion';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import { IoDocumentTextOutline, IoBusinessOutline, IoJournalOutline } from 'react-icons/io5';

const LegalPage = () => {
  const compliancePoints = [
    { title: 'Registered Entity', desc: 'Loop Bazar is a registered digital marketplace platform operating under the commerce laws of Pakistan.' },
    { title: 'Tax Obligations', desc: 'All displayed product values include necessary federal and provincial duties as mandated by tax authorities.' },
    { title: 'Fair Trade Protocol', desc: 'We mandate that all boutiques on our platform adhere to strict ethical labor and fair pricing standards.' },
    { title: 'Dispute Resolution', desc: 'In any interaction discrepancy, our dedicated arbitration team provides a document-first, fair resolution.' },
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
              <IoDocumentTextOutline className="text-3xl" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-5xl font-thin tracking-tight text-zinc-900 sm:text-7xl lg:text-8xl"
          >
            Legal <span className="text-zinc-400">Framework</span>
          </motion.h1>
          <p className="mx-auto max-w-2xl text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">
            Compliance and Regulatory Transparency
          </p>
        </div>

        {/* Compliance Section */}
        <div className="max-w-5xl mx-auto mb-32">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {compliancePoints.map((point, idx) => (
                    <motion.div
                      key={point.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="glass p-12 rounded-[4rem] border border-zinc-100/50 hover:bg-white transition-all duration-500 hover:shadow-2xl"
                    >
                      <h3 className="text-2xl font-thin tracking-tight text-zinc-900 mb-4">{point.title}</h3>
                      <p className="text-sm font-light leading-relaxed text-zinc-500 italic max-w-xs">
                         "{point.desc}"
                      </p>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* Corporate Identity Section */}
        <div className="max-w-4xl mx-auto">
            <div className="glass p-16 rounded-[4rem] bg-zinc-900 text-white space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <div className="space-y-6">
                       <h2 className="text-3xl font-thin tracking-tight">Corporate Identity</h2>
                       <p className="text-sm font-light text-zinc-400 leading-relaxed italic">
                         "Loop Bazar exists as a digital vanguard, bridging the gap between handcrafted heritage and modern commerce laws."
                       </p>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <IoBusinessOutline className="text-2xl text-zinc-700" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Registration</h4>
                            <p className="text-[9px] font-light text-zinc-600">SEC Registry #LB-2024</p>
                        </div>
                        <div className="space-y-2">
                            <IoJournalOutline className="text-2xl text-zinc-700" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Contact</h4>
                            <p className="text-[9px] font-light text-zinc-600">legal@loopbazar.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Disclosure */}
        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           className="mt-40 text-center py-20 border-t border-zinc-100"
        >
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300">Certified Digital Marketplace 2024</p>
        </motion.div>
      </div>
    </BuyerPageShell>
  );
};

export default LegalPage;
