'use client';

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { IoAddOutline, IoReloadOutline, IoTrashOutline } from 'react-icons/io5';
import SellerButton from '@/components/seller/SellerButton';
import SellerCard from '@/components/seller/SellerCard';
import SellerErrorState from '@/components/seller/SellerErrorState';
import SellerInput from '@/components/seller/SellerInput';
import SellerLoader from '@/components/seller/SellerLoader';
import SellerPageHeader from '@/components/seller/SellerPageHeader';
import SellerTextarea from '@/components/seller/SellerTextarea';
import {
  type SellerStoreFaq,
  useGetSellerProfileQuery,
  useUpdateSellerProfileMutation,
} from '@/store/sellerApi';
import { normalizeApiError } from '@/utils/sellerUtils';

const MAX_STORE_FAQS = 30;

const normalizeStoreFaqs = (faqs: SellerStoreFaq[] | undefined): SellerStoreFaq[] => {
  if (!Array.isArray(faqs)) {
    return [];
  }

  return faqs
    .map((faq) => ({
      _id: faq._id,
      question: String(faq.question ?? '').trim(),
      answer: String(faq.answer ?? '').trim(),
    }))
    .filter((faq) => faq.question.length > 0 && faq.answer.length > 0);
};

const stringifyFaqs = (faqs: SellerStoreFaq[]) =>
  JSON.stringify(faqs.map((faq) => ({ _id: faq._id, question: faq.question, answer: faq.answer })));

const SellerFaqsPage = () => {
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [draftFaqs, setDraftFaqs] = useState<SellerStoreFaq[] | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    data: profileResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetSellerProfileQuery();

  const [updateProfile, { isLoading: savingFaqs }] = useUpdateSellerProfileMutation();

  const persistedFaqs = useMemo(
    () => normalizeStoreFaqs(profileResponse?.data?.storeFaqs),
    [profileResponse?.data?.storeFaqs]
  );

  const activeFaqs = draftFaqs ?? persistedFaqs;
  const hasUnsavedChanges = stringifyFaqs(activeFaqs) !== stringifyFaqs(persistedFaqs);

  const handleAddFaq = () => {
    const question = faqQuestion.trim();
    const answer = faqAnswer.trim();

    if (!question || !answer) {
      toast.error('Please provide both FAQ question and answer.');
      return;
    }

    if (activeFaqs.length >= MAX_STORE_FAQS) {
      toast.error(`Maximum ${MAX_STORE_FAQS} FAQs are allowed.`);
      return;
    }

    setDraftFaqs([...activeFaqs, { question, answer }]);
    setFaqQuestion('');
    setFaqAnswer('');
    setSaveError(null);
    toast.success('FAQ added to draft. Save to publish it.');
  };

  const handleDeleteFaq = (index: number) => {
    setDraftFaqs(activeFaqs.filter((_, faqIndex) => faqIndex !== index));
    setSaveError(null);
    toast.success('FAQ removed from draft. Save to apply.');
  };

  const handleDiscardDraft = () => {
    setDraftFaqs(null);
    setFaqQuestion('');
    setFaqAnswer('');
    setSaveError(null);
    toast.success('Draft changes discarded.');
  };

  const handleSaveFaqs = async () => {
    setSaveError(null);

    try {
      await updateProfile({ storeFaqs: activeFaqs }).unwrap();
      setDraftFaqs(null);
      toast.success('Store FAQs saved successfully.');
      void refetch();
    } catch (requestError) {
      setSaveError(normalizeApiError(requestError, 'Failed to save store FAQs.'));
    }
  };

  return (
    <div className="space-y-8">
      <SellerPageHeader
        title="Store FAQs"
        description="Create and manage the frequently asked questions shown to buyers on your product pages."
        action={
          <div className="flex items-center gap-3">
            {hasUnsavedChanges ? (
              <SellerButton
                type="button"
                tone="secondary"
                label="Discard"
                onClick={handleDiscardDraft}
                className="h-11"
              />
            ) : null}
            <SellerButton
              type="button"
              label={hasUnsavedChanges ? 'Save FAQs' : 'Saved'}
              onClick={handleSaveFaqs}
              loading={savingFaqs}
              disabled={!hasUnsavedChanges}
              className="h-11"
            />
          </div>
        }
      />

      {isError ? (
        <SellerErrorState
          message={normalizeApiError(error, 'Unable to load store FAQs.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {isLoading ? <SellerLoader label="Loading store FAQs..." /> : null}

      {!isLoading ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SellerCard className="bg-white/80 border border-white/60">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-light tracking-tight text-zinc-900">Published FAQs</h2>
                  <p className="mt-1 text-sm font-light text-zinc-500">
                    Buyers see these answers before contacting your store.
                  </p>
                </div>
                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
                  {activeFaqs.length}/{MAX_STORE_FAQS}
                </span>
              </div>

              {activeFaqs.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/60 p-6 text-center">
                  <p className="text-sm font-light text-zinc-500">
                    No FAQs yet. Add your first one from the panel on the right.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeFaqs.map((faq, index) => (
                    <article key={faq._id ?? `${faq.question}-${index}`} className="rounded-2xl border border-zinc-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Question</p>
                          <p className="mt-1 text-sm font-semibold text-zinc-800">{faq.question}</p>

                          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Answer</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-zinc-600">
                            {faq.answer}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(index)}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-200 text-rose-600 transition hover:bg-rose-50"
                          aria-label="Delete FAQ"
                        >
                          <IoTrashOutline className="text-lg" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </SellerCard>

          <SellerCard className="bg-white/80 border border-white/60">
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-light tracking-tight text-zinc-900">Add New FAQ</h2>
                <p className="mt-1 text-sm font-light text-zinc-500">
                  Keep answers concise and useful for buyers.
                </p>
              </div>

              <SellerInput
                label="FAQ Question"
                value={faqQuestion}
                onChange={(event) => setFaqQuestion(event.target.value)}
                placeholder="Example: How fast do you ship orders?"
                maxLength={200}
              />

              <SellerTextarea
                label="FAQ Answer"
                value={faqAnswer}
                onChange={(event) => setFaqAnswer(event.target.value)}
                placeholder="Example: We ship within 24 hours and delivery usually takes 3-5 business days."
                rows={5}
                maxLength={1200}
              />

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleAddFaq}
                  disabled={activeFaqs.length >= MAX_STORE_FAQS}
                  className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  <IoAddOutline className="text-base" />
                  Add FAQ
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFaqQuestion('');
                    setFaqAnswer('');
                    setSaveError(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 transition hover:bg-zinc-50"
                >
                  <IoReloadOutline className="text-base" />
                  Clear
                </button>
              </div>

              {saveError ? <SellerErrorState message={saveError} /> : null}

              {isFetching ? (
                <p className="text-xs font-semibold text-zinc-400">Syncing latest profile data...</p>
              ) : (
                <p className="text-xs font-semibold text-zinc-400">
                  Tip: after add/delete, click Save FAQs to publish changes.
                </p>
              )}
            </div>
          </SellerCard>
        </div>
      ) : null}
    </div>
  );
};

export default SellerFaqsPage;
