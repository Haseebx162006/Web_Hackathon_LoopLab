'use client';

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { IoChatbubbleEllipsesOutline, IoCloseOutline, IoSend } from 'react-icons/io5';
import toast from 'react-hot-toast';
import type { RootState } from '@/store/store';
import { useSendBuyerSupportMessageMutation } from '@/store/buyerApi';
import { isBuyerAuthenticated, normalizeApiError } from '@/utils/buyerUtils';

interface SupportMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const hydrationSubscribe = () => () => {};
const getHydratedClientSnapshot = () => true;
const getHydratedServerSnapshot = () => false;

const BuyerSupportChat = () => {
  const router = useRouter();
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isHydrated = useSyncExternalStore(hydrationSubscribe, getHydratedClientSnapshot, getHydratedServerSnapshot);
  const isBuyer = isHydrated && ((role === 'buyer' && isAuthenticated) || isBuyerAuthenticated());

  const [sendMessage, { isLoading }] = useSendBuyerSupportMessageMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi there. I can help with shipping, returns, refunds, and order updates.',
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const hasConversation = useMemo(() => messages.length > 1, [messages.length]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isOpen, messages]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim();
    if (!value) {
      return;
    }

    if (!isBuyer) {
      toast.error('Please login as a buyer to use support chat.');
      router.push('/login');
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
      const assistantReply = response?.data?.reply?.trim() || 'I could not generate a reply right now. Please try again.';
      const assistantMessage: SupportMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: assistantReply,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (response?.data?.escalate) {
        toast('Support escalation recommended. Contact support@marketplace.com.');
      }
    } catch (error) {
      toast.error(normalizeApiError(error, 'Unable to send support message.'));
    }
  };

  return (
    <>
      {isOpen ? (
        <section className="fixed bottom-20 right-4 left-4 sm:left-auto sm:bottom-24 sm:right-8 z-[70] w-auto sm:w-[calc(100vw-2rem)] sm:max-w-sm overflow-hidden rounded-[1.6rem] border border-zinc-100 bg-white/95 shadow-[0_24px_48px_-28px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Buyer Support</p>
              <h3 className="text-base font-black tracking-tight text-zinc-900">AI Concierge</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 transition hover:bg-zinc-900 hover:text-white"
              aria-label="Close support chat"
            >
              <IoCloseOutline className="text-lg" />
            </button>
          </div>

          <div className="p-4">
            {!isBuyer ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                Please login as a buyer to use support chat.
                <Link
                  href="/login"
                  className="ml-2 font-black uppercase tracking-[0.12em] text-zinc-900 underline-offset-4 hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              </div>
            ) : (
              <>
                <div className="max-h-60 sm:max-h-72 space-y-3 overflow-y-auto rounded-2xl bg-zinc-50 p-3">
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
                  <div ref={messagesEndRef} />
                </div>

                {!hasConversation ? (
                  <p className="mt-3 text-[10px] sm:text-xs font-semibold text-zinc-400">
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
          </div>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[70] inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black text-white shadow-[0_20px_34px_-20px_rgba(0,0,0,0.8)] transition hover:scale-105 hover:bg-zinc-800"
        aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
      >
        {isOpen ? <IoCloseOutline className="text-xl sm:text-2xl" /> : <IoChatbubbleEllipsesOutline className="text-xl sm:text-2xl" />}
      </button>
    </>
  );
};

export default BuyerSupportChat;
