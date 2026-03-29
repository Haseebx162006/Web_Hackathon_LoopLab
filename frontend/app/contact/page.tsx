'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IoMailOutline, IoCallOutline, IoLocationOutline, IoSendOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('https://formspree.io/f/meepazwe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Message sent successfully! We will get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <IoMailOutline className="text-2xl" />,
      label: 'Email Us',
      value: 'support@loopbazar.com',
      sub: 'Replies within 24 hours',
    },
    {
      icon: <IoCallOutline className="text-2xl" />,
      label: 'Call Us',
      value: '+92 318 1792848',
      sub: 'Mon - Fri, 9am - 6pm',
    },
    {
      icon: <IoLocationOutline className="text-2xl" />,
      label: 'Visit Us',
      value: 'DHA Phase 6, Lahore',
      sub: 'Pakistan',
    },
  ];

  return (
    <BuyerPageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-5xl font-thin tracking-tight text-zinc-900 sm:text-7xl lg:text-8xl"
          >
            Connect With <span className="text-zinc-400">Loop Bazar</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto max-w-2xl text-lg font-extralight leading-relaxed tracking-wide text-zinc-500"
          >
            Have questions about our artisanal collection or need assistance with your order? 
            Our dedicated team is here to provide exceptional support.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          {/* Contact Info Cards */}
          <div className="space-y-6">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="glass group flex items-start gap-6 rounded-[2.5rem] p-8 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:bg-white/40"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-black/5 text-zinc-400 transition-all duration-500 group-hover:bg-black group-hover:text-white group-hover:shadow-lg">
                  {info.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-400">
                    {info.label}
                  </h3>
                  <p className="text-xl font-extralight tracking-tight text-zinc-900">
                    {info.value}
                  </p>
                  <p className="text-xs font-light text-zinc-400">
                    {info.sub}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass relative overflow-hidden rounded-[3rem] p-8 shadow-2xl sm:p-12"
          >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FFB7CE]/10 blur-[90px]" />
            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#D4A5FF]/10 blur-[100px]" />

            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full rounded-2xl border-none bg-black/[0.03] py-4 px-6 text-sm font-light text-black placeholder:text-zinc-300 transition-all focus:bg-white focus:shadow-xl focus:outline-none focus:ring-1 focus:ring-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="w-full rounded-2xl border-none bg-black/[0.03] py-4 px-6 text-sm font-light text-black placeholder:text-zinc-300 transition-all focus:bg-white focus:shadow-xl focus:outline-none focus:ring-1 focus:ring-zinc-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">
                  Subject
                </label>
                <input
                  required
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What is this about?"
                  className="w-full rounded-2xl border-none bg-black/[0.03] py-4 px-6 text-sm font-light text-black placeholder:text-zinc-300 transition-all focus:bg-white focus:shadow-xl focus:outline-none focus:ring-1 focus:ring-zinc-100"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">
                  Message
                </label>
                <textarea
                  required
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us what's on your mind..."
                  className="w-full resize-none rounded-3xl border-none bg-black/[0.03] py-4 px-6 text-sm font-light text-black placeholder:text-zinc-300 transition-all focus:bg-white focus:shadow-xl focus:outline-none focus:ring-1 focus:ring-zinc-100"
                />
              </div>

              <button
                disabled={isSubmitting}
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-black py-5 transition-all hover:bg-zinc-800 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : (
                  <>
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Send Message</span>
                    <IoSendOutline className="text-lg text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </BuyerPageShell>
  );
};

export default ContactPage;
