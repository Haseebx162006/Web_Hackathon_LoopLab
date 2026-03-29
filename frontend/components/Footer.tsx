"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Explore",
      links: [
        { label: "Collections", path: "/collections" },
        { label: "Categories", path: "/categories" },
        { label: "Featured", path: "/products?sort=featured" },
        { label: "Sale", path: "/products?sort=sale" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Our Story", path: "/about" },
        { label: "Sustainability", path: "/sustainability" },
        { label: "Careers", path: "/careers" },
        { label: "Journal", path: "/journal" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Shipping", path: "/shipping" },
        { label: "Returns", path: "/returns" },
        { label: "Size Guide", path: "/size-guide" },
        { label: "FAQs", path: "/faq" },
      ],
    },
  ];

  return (
    <footer className="relative pt-40 pb-20 px-6 bg-white overflow-hidden">
      {/* Ghost Branding Background */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap text-[16vw] font-black text-black/[0.07] pointer-events-none select-none uppercase tracking-tighter leading-none">
        LOOP BAZAR
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-40">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-8 text-center md:text-left">
            <div className="space-y-6">
                <div className="flex justify-center md:justify-start">
                   <img src="/assets/logo/logo.png" alt="LoopBazar Logo" className="h-20 w-auto object-contain" />
                </div>
                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest leading-relaxed max-w-sm mx-auto md:mx-0">
                    The intersection of luxury & digital vanguard. <br />
                    Curating high-performance lifestyles for the modern era.
                </p>
            </div>
            
            <div className="flex items-center gap-6 justify-center md:justify-start">
                {['Instagram', 'Twitter', 'Pinterest'].map((social) => (
                    <motion.a
                        key={social}
                        href="#"
                        whileHover={{ y: -5, scale: 1.1 }}
                        className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-brand-purple transition-all"
                    >
                        {social}
                    </motion.a>
                ))}
            </div>
          </div>

          {/* Link Columns */}
          {footerLinks.map((col) => (
            <div key={col.title} className="space-y-8 text-center md:text-left">
                <h4 className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-900">{col.title}</h4>
                <ul className="space-y-4">
                    {col.links.map((link) => (
                        <li key={link.label}>
                            <Link
                                href={link.path}
                                className="text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-all block"
                            >
                                <motion.span
                                    whileHover={{ x: 5 }}
                                    className="inline-block"
                                >
                                    {link.label}
                                </motion.span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 border-t border-gray-50">
           <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                © {currentYear} LoopLab
           </div>
           
           <div className="flex items-center gap-8">
                {[
                    { label: 'Terms', path: '/terms' },
                    { label: 'Privacy', path: '/privacy' },
                    { label: 'Legal', path: '/legal' }
                ].map(item => (
                    <Link 
                        key={item.label} 
                        href={item.path} 
                        className="text-[10px] font-bold text-gray-300 hover:text-gray-900 uppercase tracking-widest transition-all"
                    >
                        {item.label}
                    </Link>
                ))}
           </div>

          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
