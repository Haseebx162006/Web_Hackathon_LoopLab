'use client';

import React from 'react';
import { motion } from 'framer-motion';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import { IoAirplaneOutline, IoShieldCheckmarkOutline, IoCubeOutline } from 'react-icons/io5';

const ShippingPage = () => {
  const shippingInfo = [
    { title: 'Global Coverage', desc: 'Domestic shipping across Pakistan and limited international delivery to over 20 countries.', zone: 'International' },
    { title: 'Standard Delivery', desc: 'Typical transit times range from 3-5 business days via our premium courier network.', zone: 'Domestic' },
    { title: 'Processing Order', desc: 'Every premium order is verified and processed within 24-48 hours by our lead curation team.', zone: 'Internal' },
    { title: 'Artisanal Handling', desc: 'Handcrafted items require specialized handling and may have specific crafting timelines.', zone: 'Boutique' },
  ];

  const deliveryZones = [
    { name: 'Lahore & Karachi', time: '2-3 Business Days', rate: 'Premium' },
    { name: 'Punjab & Sindh', time: '3-4 Business Days', rate: 'Standard' },
    { name: 'KPK & Balochistan', time: '4-6 Business Days', rate: 'Standard' },
    { name: 'International (UAE, UK, US)', time: '7-12 Business Days', rate: 'Global Luxe' },
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
              <IoAirplaneOutline className="text-3xl" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-5xl font-thin tracking-tight text-zinc-900 sm:text-7xl lg:text-8xl"
          >
            Seamless <span className="text-zinc-400">Logistics</span>
          </motion.h1>
          <p className="mx-auto max-w-2xl text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">
            Premium delivery and handling protocols
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-32">
          {shippingInfo.map((info, idx) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="glass p-12 rounded-[3.5rem] space-y-6 border border-zinc-100/50 hover:bg-white transition-all duration-500 hover:shadow-2xl"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">{info.zone}</span>
              <h3 className="text-2xl font-thin tracking-tight text-zinc-900">{info.title}</h3>
              <p className="text-sm font-light leading-relaxed text-zinc-500 italic">"{info.desc}"</p>
            </motion.div>
          ))}
        </div>

        {/* Delivery Zones Table */}
        <div className="mb-32 max-w-5xl mx-auto">
          <div className="mb-12">
             <h2 className="text-2xl font-thin tracking-tight text-zinc-900 uppercase tracking-[0.2em] text-center text-sm">Delivery Zones & Timelines</h2>
          </div>
          <div className="glass overflow-hidden rounded-[3rem] border border-zinc-50">
             <table className="w-full text-left">
                <thead className="bg-black/5">
                   <tr>
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Regional Domain</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Estimated Timeline</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Rate Class</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                   {deliveryZones.map((zone, idx) => (
                     <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-10 py-8 text-lg font-thin tracking-tight text-zinc-900">{zone.name}</td>
                        <td className="px-10 py-8 text-sm font-light text-zinc-500">{zone.time}</td>
                        <td className="px-10 py-8">
                           <span className="text-[9px] font-black uppercase tracking-widest text-zinc-900 bg-white border border-zinc-100 px-3 py-1 rounded-full">{zone.rate}</span>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>

        {/* Packaging Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
               <div className="flex items-center gap-4">
                  <IoCubeOutline className="text-4xl text-zinc-300" />
                  <h2 className="text-3xl font-thin tracking-tight text-zinc-900">Packaging Excellence</h2>
               </div>
               <p className="text-sm font-light text-zinc-500 leading-relaxed max-w-md">
                 Our 100% biodegradable and zero-plastic mandate ensures your premium order arrives safely 
                 without leaving a digital-physical footprint on the environment.
               </p>
               <div className="flex items-center gap-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                     <IoShieldCheckmarkOutline className="text-2xl" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tamper-Proof Luxury Seal</p>
               </div>
            </div>
            <div className="glass aspect-video rounded-[3.5rem] bg-zinc-50 flex items-center justify-center opacity-40">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Logistics Visualization</p>
            </div>
        </div>
      </div>
    </BuyerPageShell>
  );
};

export default ShippingPage;
