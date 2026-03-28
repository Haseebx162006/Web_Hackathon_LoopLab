'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { IoSend } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { useSendBuyerSupportMessageMutation } from '@/store/buyerApi';
import { normalizeApiError } from '@/utils/buyerUtils';

interface SupportMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface BuyerSupportChatProps {
  enabled: boolean;
}

const BuyerSupportChat = ({ enabled }: BuyerSupportChatProps) => {
  const [sendMessage, { isLoading }] = useSendBuyerSupportMessageMutation();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi there. I can help with shipping, returns, refunds, and order updates.',
    },
  ]);

  const hasConversation = useMemo(() => messages.length > 1, [messages.length]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim();
    if (!value || !enabled) {
      return;
    }

    const userMessage: SupportMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: value,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const response = await sendMessage({ message: value }).unwrap();
      const assistantMessage: SupportMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: response.data.reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (response.data.escalate) {
        toast('Support escalation recommended. Contact support@marketplace.com.');
      }
    } catch (error) {
      toast.error(normalizeApiError(error, 'Unable to send support message.'));
    }
  };

  return (
    <section className="rounded-[2rem] border border-zinc-100 bg-white/85 p-5 shadow-[0_14px_35px_-22px_rgba(0,0,0,0.25)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Buyer Support</p>
          <h3 className="text-xl font-black tracking-tight text-zinc-900">AI Concierge</h3>
        </div>
      </div>

      {!enabled ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          Please login as a buyer to use support chat.
          <Link href="/login" className="ml-2 font-black uppercase tracking-[0.12em] text-zinc-900 underline-offset-4 hover:underline">
            Login
          </Link>
        </div>
      ) : (
        <>
          <div className="max-h-72 space-y-3 overflow-y-auto rounded-2xl bg-zinc-50 p-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm font-medium ${
                  message.role === 'user'
                    ? 'ml-auto bg-black text-white'
                    : 'mr-auto bg-white text-zinc-700 shadow-sm'
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          {!hasConversation ? (
            <p className="mt-3 text-xs font-semibold text-zinc-400">
              Ask about delivery ETA, return windows, refund status, or order help.
            </p>
          ) : null}

          <form onSubmit={onSubmit} className="mt-4 flex items-center gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={1000}
              placeholder="Type your message"
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              aria-label="Send support message"
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <IoSend className="text-lg" />
              )}
            </button>
          </form>
        </>
      )}
    </section>
  );
};

export default BuyerSupportChat;
