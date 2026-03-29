'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChevronDownOutline, IoSearchOutline, IoHelpCircleOutline } from 'react-icons/io5';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';

const faqData = [
  {
    category: 'The Collection',
    questions: [
      {
        id: 'q1',
        question: 'Are the products authentic and original?',
        answer: 'Absolutely. Every boutique on Loop Bazar undergoes a rigorous verification process. We ensure that only genuine, high-quality artisanal and premium brand products are listed on our platform.',
      },
      {
        id: 'q2',
        question: 'How do I know my size for artisanal clothing?',
        answer: 'Each product listing includes a specialized size guide tailored to that specific designer. For custom-made pieces, you can chat directly with the seller to provide your exact measurements.',
      },
      {
        id: 'q3',
        question: 'Can I request a custom-made item?',
        answer: 'Many of our sellers offer Bespoke services. Use the "Chat with Seller" button on the product detail page to discuss customization possibilities for existing items or completely new designs.',
      },
    ],
  },
  {
    category: 'Verified Sellers',
    questions: [
      {
        id: 'q4',
        question: 'What does the "Verified" badge mean?',
        answer: 'The "Verified Brand Store" badge indicates that we have manually inspected the seller’s identity, business registration, and previous customer feedback to ensure a safe shopping experience.',
      },
      {
        id: 'q5',
        question: 'How do I contact a seller directly?',
        answer: 'You can reach out to any seller using our real-time messaging system. Go to the product page and click "Chat with Seller" to start a conversation about products, shipping, or customizations.',
      },
    ],
  },
  {
    category: 'Shipping & Delivery',
    questions: [
      {
        id: 'q6',
        question: 'How long will it take to receive my order?',
        answer: 'Standard shipping inside Pakistan takes 3-5 business days. For artisanal or custom-made pieces, the "Crafting Time" is usually listed on the product page, which may add an additional 7-10 days.',
      },
      {
        id: 'q7',
        question: 'Do you offer international shipping?',
        answer: 'Currently, Loop Bazar primarily serves customers within Pakistan. However, certain sellers do ship internationally. Please chat with the seller directly to inquire about global delivery options.',
      },
      {
        id: 'q8',
        question: 'How can I track my premium order?',
        answer: 'Once your order is shipped, you will receive a Tracking ID. You can track your package directly through your Buyer Dashboard under the "Order History" section.',
      },
    ],
  },
  {
    category: 'Returns & Support',
    questions: [
      {
        id: 'q9',
        question: 'What is your return policy for artisanal items?',
        answer: 'We offer a 7-day return policy for most items. However, custom-made or personalized pieces are non-returnable unless defective. Please review the "Seller Policy" on each individual product page.',
      },
      {
        id: 'q10',
        question: 'How do I request a refund?',
        answer: 'Navigate to your "Order History" in the Buyer Dashboard, select the order, and click "Request Return". Once the seller receives and inspects the item, your refund will be processed to your original payment method.',
      },
    ],
  },
];

const FaqItem = ({ question, answer, isOpen, onToggle }: any) => {
  return (
    <div className="group border-b border-zinc-100 last:border-none">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-6 text-left transition-all sm:py-8"
      >
        <span className={`text-lg font-extralight tracking-tight transition-all duration-300 sm:text-2xl ${isOpen ? 'text-black' : 'text-zinc-500 group-hover:text-zinc-800'}`}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${isOpen ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100'}`}
        >
          <IoChevronDownOutline className="text-xl" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="pb-8 pr-12 text-sm font-light leading-relaxed tracking-wide text-zinc-500 sm:text-base">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FaqPage = () => {
  const [openId, setOpenId] = useState<string | null>('q1');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFaq = faqData.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <BuyerPageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-16 text-center lg:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex justify-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white shadow-2xl shadow-black/20">
              <IoHelpCircleOutline className="text-3xl" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-5xl font-thin tracking-tight text-zinc-900 sm:text-7xl lg:text-8xl"
          >
            Your Questions <span className="text-zinc-400">Answered</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-2xl text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400"
          >
            Deep insights into the Loop Bazar shopping experience
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mb-20 w-full max-w-2xl"
        >
          <div className="group relative flex items-center transition-all">
            <div className="absolute left-6 text-zinc-400 transition-colors group-focus-within:text-black">
              <IoSearchOutline className="text-xl" />
            </div>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for answers..."
              className="w-full rounded-[2rem] border-none bg-black/[0.03] py-5 pl-14 pr-8 text-sm font-light text-black placeholder:text-zinc-400 transition-all focus:bg-white focus:shadow-2xl focus:outline-none focus:ring-1 focus:ring-zinc-100"
            />
          </div>
        </motion.div>

        {/* FAQ Content */}
        <div className="space-y-24">
          {filteredFaq.length > 0 ? (
            filteredFaq.map((category, catIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + catIndex * 0.1 }}
                className="grid grid-cols-1 gap-12 lg:grid-cols-[300px_1fr]"
              >
                <div className="space-y-4">
                  <h2 className="text-3xl font-thin tracking-tighter text-zinc-900 sm:text-4xl">
                    {category.category}
                  </h2>
                  <div className="h-1 w-12 bg-black/5" />
                  <p className="text-xs font-light tracking-wide text-zinc-400">
                    Everything you need to know about {category.category.toLowerCase()}.
                  </p>
                </div>

                <div className="glass rounded-[3rem] p-8 shadow-sm sm:p-12">
                  {category.questions.map((q) => (
                    <FaqItem
                      key={q.id}
                      question={q.question}
                      answer={q.answer}
                      isOpen={openId === q.id}
                      onToggle={() => setOpenId(openId === q.id ? null : q.id)}
                    />
                  ))}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center">
              <p className="text-lg font-extralight text-zinc-400">No results found for your search.</p>
            </div>
          )}
        </div>

        {/* Footer Help Card */}
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-32 rounded-[3.5rem] bg-black p-10 text-center sm:p-20"
          >
            <h3 className="mb-6 text-3xl font-thin tracking-tight text-white sm:text-5xl">
              Still Have <span className="text-zinc-500">Persisting</span> Questions?
            </h3>
            <p className="mx-auto mb-10 max-w-xl text-sm font-light leading-relaxed tracking-wide text-zinc-400 sm:text-base">
              If our deep-dive FAQ didn't provide exactly what you need, our team is standing by to assist you through a personal connection.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/contact"
                className="inline-flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-[11px] font-black uppercase tracking-[0.3em] text-black transition-all hover:bg-zinc-200 active:scale-95"
              >
                Send a Message
              </a>
              <a
                href="/buyer-dashboard/messages"
                className="inline-flex items-center gap-3 rounded-2xl border border-zinc-800 bg-transparent px-8 py-4 text-[11px] font-black uppercase tracking-[0.3em] text-white transition-all hover:bg-white/5 active:scale-95"
              >
                Live Support Chat
              </a>
            </div>
          </motion.div>
      </div>
    </BuyerPageShell>
  );
};

export default FaqPage;
