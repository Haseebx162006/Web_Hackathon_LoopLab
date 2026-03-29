'use client';

import React from 'react';
import { motion } from 'framer-motion';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import { IoLockClosedOutline, IoKeyOutline, IoEyeOffOutline } from 'react-icons/io5';

const PrivacyPage = () => {
  const sections = [
    { title: 'Information We Curate', desc: 'To provide a premium marketplace experience, we curate only the necessary data — including profile identifiers, verified address strings, and transaction history — to facilitate secure journeys.' },
    { title: 'Vanguard Security', desc: 'We employ industry-leading AES-256 encryption to protect your financial data and profile information within our digital vault. Your privacy is our technical foundation.' },
    { title: 'Zero Sharing Policy', desc: 'Your data is exclusively yours. We never share your personal information with third-party advertisers, unauthorized entities, or analytics harvesters without your document-level consent.' },
    { title: 'User Digital Rights', desc: 'You maintain absolute control over your digital footprint. You can request a full data export or permanent deletion of your profile history directly through the dashboard.' },
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
              <IoLockClosedOutline className="text-3xl" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-5xl font-thin tracking-tight text-zinc-900 sm:text-7xl lg:text-8xl"
          >
            Data <span className="text-zinc-400">Sanctity</span>
          </motion.h1>
          <p className="mx-auto max-w-2xl text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">
            Privacy Protocols and Security Safeguards
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
              className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-12 items-start"
            >
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-zinc-300">Protocol 0{idx + 1}</span>
                    <div className="h-[1px] w-8 bg-zinc-100"></div>
                 </div>
                 <h3 className="text-3xl font-thin tracking-tight text-zinc-900 leading-tight">{sec.title}</h3>
              </div>
              <p className="text-base font-light leading-relaxed text-zinc-500 italic max-w-2xl">
                 "{sec.desc}"
              </p>
            </motion.div>
          ))}
        </div>

        {/* Security Summary Cards */}
        <div className="mt-32 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="glass p-10 rounded-[3rem] space-y-4 text-center">
               <IoKeyOutline className="text-4xl text-zinc-300 mx-auto" />
               <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Encrypted Transactions</h4>
               <p className="text-xs font-light text-zinc-400 leading-relaxed max-w-xs mx-auto">
                  Every interaction within Loop Bazar is protected by advanced cryptographic layers.
               </p>
            </div>
            <div className="glass p-10 rounded-[3rem] space-y-4 text-center">
               <IoEyeOffOutline className="text-4xl text-zinc-300 mx-auto" />
               <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Anonymized Insights</h4>
               <p className="text-xs font-light text-zinc-400 leading-relaxed max-w-xs mx-auto">
                  We collect marketplace trends without ever revealing specific user identities or habits.
               </p>
            </div>
        </div>
      </div>
    </BuyerPageShell>
  );
};

export default PrivacyPage;
