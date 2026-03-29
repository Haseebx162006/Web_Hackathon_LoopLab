'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { IoChatbubbleEllipsesOutline, IoHeartOutline, IoStar } from 'react-icons/io5';
import type { RootState } from '@/store/store';
import {
  type BuyerProduct,
  useAddBuyerReviewMutation,
  useAddToBuyerCartMutation,
  useAddToBuyerWishlistMutation,
  useGetBuyerProductDetailsQuery,
  useGetBuyerProductsQuery,
  useGetBuyerWishlistQuery,
  useGetBuyerOrdersQuery,
  useRemoveFromBuyerWishlistMutation,
} from '@/store/buyerApi';
import {
  type SellerStoreFaq,
  useGetSellerProfileQuery,
  useUpdateSellerProfileMutation,
} from '@/store/sellerApi';
import BuyerErrorState from '@/components/buyer/BuyerErrorState';
import BuyerLoader from '@/components/buyer/BuyerLoader';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import BuyerProductCard from '@/components/buyer/BuyerProductCard';
import BuyerQuantityControl from '@/components/buyer/BuyerQuantityControl';
import {
  formatCurrency,
  formatDateTime,
  getDiscountPercent,
  getEffectivePrice,
  getProductImages,
  getStockValue,
  isBuyerAuthenticated,
  normalizeApiError,
} from '@/utils/buyerUtils';

const normalizeStoreFaqs = (storeFaqs: Array<Partial<SellerStoreFaq>> | undefined): SellerStoreFaq[] => {
  if (!Array.isArray(storeFaqs)) {
    return [];
  }

  return storeFaqs
    .map((faq) => ({
      _id: faq._id,
      question: String(faq.question ?? '').trim(),
      answer: String(faq.answer ?? '').trim(),
    }))
    .filter((faq) => faq.question.length > 0 && faq.answer.length > 0);
};

const ProductDetailPage = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { role, isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const isBuyer = (role === 'buyer' && isAuthenticated) || isBuyerAuthenticated();
  const isSellerSession = role === 'seller' && isAuthenticated;

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [storeFaqs, setStoreFaqs] = useState<SellerStoreFaq[]>([]);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  const {
    data: detailsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetBuyerProductDetailsQuery(productId, { skip: !productId });

  const product = detailsResponse?.data?.product;
  const productImages = getProductImages(product);
  const reviews = detailsResponse?.data?.reviews ?? [];
  const avgRating = detailsResponse?.data?.avgRating || product?.rating || 0;

  const { data: relatedResponse } = useGetBuyerProductsQuery(
    {
      category: product?.category,
      page: 1,
      limit: 4,
      sort: 'newest',
    },
    { skip: !product?.category }
  );

  const { data: wishlistResponse } = useGetBuyerWishlistQuery(undefined, { skip: !isBuyer });
  const { data: ordersResponse } = useGetBuyerOrdersQuery(undefined, { skip: !isBuyer });
  const { data: sellerProfileResponse } = useGetSellerProfileQuery(undefined, {
    skip: !isSellerSession,
  });

  const [addToCart, { isLoading: addingToCart }] = useAddToBuyerCartMutation();
  const [addToWishlist] = useAddToBuyerWishlistMutation();
  const [removeFromWishlist] = useRemoveFromBuyerWishlistMutation();
  const [addReview, { isLoading: submittingReview }] = useAddBuyerReviewMutation();
  const [updateSellerProfile, { isLoading: updatingStoreProfile }] = useUpdateSellerProfileMutation();

  const sellerInfo = useMemo(() => {
    if (!product || typeof product.sellerId !== 'object' || !product.sellerId) {
      return null;
    }

    return product.sellerId as {
      _id?: string;
      storeName?: string;
      storeLogo?: string;
      storeFaqs?: SellerStoreFaq[];
    };
  }, [product]);

  const productSellerId =
    sellerInfo?._id ?? (typeof product?.sellerId === 'string' ? product.sellerId : undefined);
  const viewerSellerId = user?._id || sellerProfileResponse?.data?._id;
  const isStoreOwner = Boolean(
    isSellerSession && productSellerId && viewerSellerId && productSellerId === viewerSellerId
  );

  useEffect(() => {
    const nextFaqs = normalizeStoreFaqs(sellerInfo?.storeFaqs);

    setStoreFaqs((previousFaqs) => {
      const previousSnapshot = JSON.stringify(
        previousFaqs.map((faq) => ({ _id: faq._id, question: faq.question, answer: faq.answer }))
      );
      const nextSnapshot = JSON.stringify(
        nextFaqs.map((faq) => ({ _id: faq._id, question: faq.question, answer: faq.answer }))
      );

      return previousSnapshot === nextSnapshot ? previousFaqs : nextFaqs;
    });
  }, [sellerInfo?.storeFaqs]);

  const wishedIds = useMemo(() => {
    const items = wishlistResponse?.data?.items ?? [];
    return new Set(
      items
        .map((item) => (typeof item === 'string' ? item : item._id))
        .filter((id): id is string => Boolean(id))
    );
  }, [wishlistResponse?.data?.items]);

  const relatedProducts = useMemo(() => {
    const items = relatedResponse?.data?.products ?? [];
    return items.filter((item) => item._id !== productId).slice(0, 4);
  }, [productId, relatedResponse?.data?.products]);

  const isEligibleForReview = useMemo(() => {
    if (!isBuyer || !ordersResponse?.data) return false;
    return ordersResponse.data.some(
      (order) =>
        order.status === 'delivered' &&
        order.items.some((item) => {
          const itemProdId = typeof item.product === 'object' ? item.product?._id : item.product;
          return itemProdId === productId;
        })
    );
  }, [isBuyer, ordersResponse?.data, productId]);

  const askLogin = () => {
    toast.error('Please login as a buyer first.');
    router.push('/login');
  };

  const handleAddToCart = async (target: BuyerProduct, nextQuantity = quantity) => {
    if (!isBuyer) {
      askLogin();
      return;
    }

    try {
      await addToCart({ productId: target._id, quantity: nextQuantity }).unwrap();
      toast.success(`${target.productName} added to cart.`);
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to add product to cart.'));
    }
  };

  const handleToggleWishlist = async (target: BuyerProduct) => {
    if (!isBuyer) {
      askLogin();
      return;
    }

    try {
      if (wishedIds.has(target._id)) {
        await removeFromWishlist(target._id).unwrap();
        toast.success('Removed from wishlist.');
      } else {
        await addToWishlist({ productId: target._id }).unwrap();
        toast.success('Added to wishlist.');
      }
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to update wishlist.'));
    }
  };

  const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isBuyer) {
      askLogin();
      return;
    }

    if (!productId) {
      return;
    }

    try {
      await addReview({
        productId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      }).unwrap();
      toast.success('Review submitted successfully.');
      setReviewComment('');
      setReviewRating(5);
      void refetch();
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to submit review.'));
    }
  };

  const handleChat = () => {
    if (!isBuyer) {
      askLogin();
      return;
    }

    if (!product) {
      toast.error('Product details are not available yet.');
      return;
    }

    if (!productSellerId) {
      toast.error('Unable to identify store owner.');
      return;
    }

    router.push(`/buyer-dashboard/messages?receiverId=${productSellerId}&productId=${product._id}`);
  };

  const persistStoreFaqs = async (nextFaqs: SellerStoreFaq[], successMessage: string) => {
    if (!isStoreOwner) {
      toast.error('Only this store owner can edit these FAQs.');
      return false;
    }

    if (nextFaqs.length > 30) {
      toast.error('You can add up to 30 FAQs only.');
      return false;
    }

    try {
      await updateSellerProfile({ storeFaqs: nextFaqs }).unwrap();
      setStoreFaqs(nextFaqs);
      toast.success(successMessage);
      void refetch();
      return true;
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to update store FAQs.'));
      return false;
    }
  };

  const handleAddStoreFaq = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const question = faqQuestion.trim();
    const answer = faqAnswer.trim();

    if (!question || !answer) {
      toast.error('Please provide both a question and an answer.');
      return;
    }

    const nextFaqs: SellerStoreFaq[] = [...storeFaqs, { question, answer }];
    const updated = await persistStoreFaqs(nextFaqs, 'Store FAQ added.');

    if (updated) {
      setFaqQuestion('');
      setFaqAnswer('');
    }
  };

  const handleDeleteStoreFaq = async (index: number) => {
    const nextFaqs = storeFaqs.filter((_, faqIndex) => faqIndex !== index);
    await persistStoreFaqs(nextFaqs, 'Store FAQ deleted.');
  };

  if (isLoading) {
    return (
      <BuyerPageShell>
        <BuyerLoader label="Loading product details..." />
      </BuyerPageShell>
    );
  }

  if (isError || !product) {
    return (
      <BuyerPageShell>
        <BuyerErrorState
          message={normalizeApiError(error, 'Unable to load product details.')}
          onRetry={() => {
            void refetch();
          }}
        />
      </BuyerPageShell>
    );
  }

  const effectivePrice = getEffectivePrice(product);
  const discountPercent = getDiscountPercent(product);
  const stock = getStockValue(product);
  const isWished = wishedIds.has(product._id);
  const storeHref = productSellerId ? `/stores/${productSellerId}` : '/stores';

  return (
    <BuyerPageShell>
      <div className="relative mx-auto max-w-7xl pt-12 md:pt-16 lg:pt-20">
        <div className="pointer-events-none absolute -left-20 top-8 h-56 w-56 rounded-full bg-amber-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-40 h-56 w-56 rounded-full bg-emerald-100/70 blur-3xl" />
        {/* Main Product Section: Asymmetrical Layout */}
        <section className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start group/main">
          {/* Left Side: Sophisticated Gallery Stage */}
          <div className="relative flex flex-col-reverse gap-4 md:flex-row lg:sticky lg:top-36">
            {/* Vertical Thumbnails (Desktop) */}
            <div className="hide-scrollbar flex gap-3 overflow-x-auto md:w-20 md:flex-col md:overflow-y-auto">
              {(productImages.length ? productImages : ['/assets/logo/logo.png']).map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-2xl transition-all duration-500 md:w-full ${
                    activeImage === index 
                      ? 'ring-2 ring-black ring-offset-2' 
                      : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
                  }`}
                >
                  <img src={image} alt="Thumbnail" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Stage */}
            <div className="relative flex-1 overflow-hidden rounded-[2.5rem] bg-zinc-50/80 p-8 transition-transform duration-700 group-hover/main:scale-[1.01]">
              <div className="absolute left-6 top-6 z-10 flex flex-col gap-2">
                <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-900 border border-zinc-100 backdrop-blur-md shadow-sm">
                  {product.category || 'Collection'}
                </span>
                {discountPercent > 0 && (
                  <span className="inline-flex items-center rounded-full bg-black px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg">
                    -{discountPercent}%
                  </span>
                )}
              </div>
              <img
                src={productImages[activeImage] || '/assets/logo/logo.png'}
                alt={product.productName}
                className="aspect-square w-full object-contain mix-blend-multiply transition-all duration-700 hover:scale-105"
              />
            </div>
          </div>

          {/* Right Side: Product Details Pane */}
          <div className="space-y-10 py-6 lg:py-0">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">Verified Product</p>
              <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tighter text-zinc-900 sm:text-6xl lg:text-7xl">
                {product.productName}
              </h1>
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-1.5 text-zinc-900">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <IoStar key={i} className={i < Math.round(avgRating) ? 'fill-current' : 'text-zinc-200'} />
                    ))}
                  </div>
                  <span className="text-xs font-black">{avgRating.toFixed(1)}</span>
                </div>
                <div className="h-1 w-1 rounded-full bg-zinc-300" />
                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  {reviews.length} Customer Reviews
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-4">
                <span className="text-5xl font-black tracking-tighter text-zinc-900">
                  {formatCurrency(effectivePrice)}
                </span>
                {product.discountPrice && product.discountPrice < product.price && (
                  <span className="text-xl font-bold text-zinc-300 line-through">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                {stock > 0 ? `In Stock • ${stock} Available` : 'Currently Out of Stock'}
              </p>
            </div>

            <div className="space-y-6">
              <p className="max-w-md text-sm font-semibold leading-relaxed text-zinc-500">
                {product.description || 'This premium artifact awaits its new owner. Experience the pinnacle of design and craftsmanship.'}
              </p>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <BuyerQuantityControl 
                    value={quantity} 
                    onChange={setQuantity} 
                    max={stock > 0 ? stock : 1} 
                    disabled={stock <= 0} 
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddToCart(product, quantity)}
                  disabled={stock <= 0 || addingToCart}
                  className="flex-[2] rounded-2xl bg-black py-5 text-[11px] font-black uppercase tracking-[0.25em] text-white shadow-2xl transition hover:bg-zinc-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  {addingToCart ? 'Syncing...' : 'Add to Bag'}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleWishlist(product)}
                  className={`group flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 ${
                    isWished
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-200'
                      : 'bg-white border border-zinc-100 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900'
                  }`}
                >
                  <IoHeartOutline className={`text-2xl transition-transform group-hover:scale-125 ${isWished ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Boutique Information */}
            <div className="glass group/store rounded-[2.5rem] p-6 transition-all border border-zinc-100 bg-white/50">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-zinc-50 border border-zinc-100">
                    {sellerInfo?.storeLogo ? (
                      <img
                        src={sellerInfo.storeLogo}
                        alt="Store Logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-black text-zinc-300 uppercase">
                        {sellerInfo?.storeName?.[0] || 'S'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Brand Boutique</p>
                    <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">
                      {sellerInfo?.storeName || 'Verified Store'}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={storeHref}
                    className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-900 transition hover:bg-black hover:text-white"
                  >
                    Visit Store
                  </Link>
                  <button
                    type="button"
                    onClick={handleChat}
                    className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-900 transition hover:bg-zinc-900 hover:text-white"
                  >
                    <IoChatbubbleEllipsesOutline className="text-lg" />
                    Chat
                  </button>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2.5rem] border border-zinc-100 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.9)]">
              <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-amber-200/70 blur-3xl" />
              <div className="pointer-events-none absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-emerald-200/70 blur-3xl" />

              <div className="relative space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.28em] text-zinc-500">Store FAQs</p>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Ask Before You Buy</h3>
                  </div>
                  <span className="rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                    {storeFaqs.length} {storeFaqs.length === 1 ? 'Answer' : 'Answers'}
                  </span>
                </div>

                {storeFaqs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/70 p-4">
                    <p className="text-xs font-semibold leading-relaxed text-zinc-500">
                      This store has not added FAQs yet. You can still message the seller for specific details.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {storeFaqs.map((faq, index) => (
                      <article
                        key={faq._id ?? `${faq.question}-${index}`}
                        className="rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-black leading-snug text-zinc-900">
                            <span className="mr-1 text-emerald-600">Q.</span>
                            {faq.question}
                          </p>
                          {isStoreOwner && (
                            <button
                              type="button"
                              onClick={() => {
                                void handleDeleteStoreFaq(index);
                              }}
                              disabled={updatingStoreProfile}
                              className="shrink-0 rounded-lg border border-rose-200 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-rose-700 transition hover:bg-rose-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="mt-2 text-xs font-semibold leading-relaxed text-zinc-600">
                          <span className="mr-1 font-black text-amber-600">A.</span>
                          {faq.answer}
                        </p>
                      </article>
                    ))}
                  </div>
                )}

                {isStoreOwner && (
                  <form onSubmit={handleAddStoreFaq} className="space-y-3 rounded-2xl border border-zinc-200 bg-white/80 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Manage your store FAQs for this product page
                    </p>
                    <input
                      type="text"
                      value={faqQuestion}
                      onChange={(event) => setFaqQuestion(event.target.value)}
                      placeholder="FAQ question"
                      maxLength={200}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 outline-none transition focus:border-zinc-400"
                    />
                    <textarea
                      value={faqAnswer}
                      onChange={(event) => setFaqAnswer(event.target.value)}
                      placeholder="FAQ answer"
                      rows={3}
                      maxLength={1200}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 outline-none transition focus:border-zinc-400"
                    />
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[10px] font-bold text-zinc-500">{storeFaqs.length}/30 FAQs used</p>
                      <button
                        type="submit"
                        disabled={updatingStoreProfile || storeFaqs.length >= 30}
                        className="rounded-xl bg-zinc-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                      >
                        {updatingStoreProfile ? 'Saving...' : 'Add FAQ'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Details & Reviews Section */}
        <div className="mt-32 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_0.7fr]">
          <section className="space-y-10">
            <div className="space-y-4">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-zinc-900">Customer Reviews</h2>
              <p className="text-sm font-semibold text-zinc-500">Read what our community has to say about this product.</p>
            </div>

            {reviews.length === 0 ? (
              <div className="glass rounded-[2rem] p-12 text-center border border-dashed border-zinc-200 bg-zinc-50/50">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                  <IoStar className="text-4xl" />
                </div>
                <p className="text-lg font-black uppercase tracking-tight text-zinc-900">No Reviews Yet</p>
                <p className="text-xs font-semibold text-zinc-500">Be the first to share your thoughts on this product.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review._id} className="glass rounded-[2rem] p-8 space-y-4 transition-all hover:translate-x-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-zinc-100 border border-zinc-200" />
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight text-zinc-900">
                            {typeof review.buyerId === 'object' ? (review.buyerId as any).name || 'Guardian' : 'Guardian'}
                          </p>
                          <p className="text-[10px] font-bold text-zinc-400">{formatDateTime(review.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-black px-3 py-1 text-[10px] font-black text-white">
                        <IoStar />
                        {review.rating}
                      </div>
                    </div>
                    <p className="text-sm font-semibold leading-relaxed text-zinc-600">
                      {review.comment || 'The user was impressed by the artifact but left no testimonial.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-8">
            {isEligibleForReview ? (
              <div className="glass sticky top-36 space-y-8 rounded-[3rem] p-8 md:p-10 border border-zinc-100 shadow-xl shadow-zinc-100/50">
                <div className="space-y-2 text-center">
                  <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-900">Write a Review</h2>
                  <p className="text-xs font-semibold text-zinc-500">Tell us your thoughts on your latest purchase.</p>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Score Rating</label>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all ${
                            reviewRating >= star ? 'bg-amber-100 text-amber-500' : 'bg-zinc-50 text-zinc-300'
                          }`}
                        >
                          <IoStar className="text-xl" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Testimonial</label>
                    <textarea
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      rows={4}
                      placeholder="Describe your artifacts encounter..."
                      className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-xs font-semibold text-zinc-700 outline-none transition-all focus:bg-white focus:shadow-xl focus:ring-0 placeholder:text-zinc-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full rounded-2xl bg-black py-5 text-[11px] font-black uppercase tracking-[0.25em] text-white shadow-2xl transition hover:bg-zinc-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-300"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="glass sticky top-36 flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-zinc-200 p-12 text-center bg-zinc-50/50">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-300">
                  <IoStar className="text-2xl" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-black uppercase tracking-tight text-zinc-400">Review Locked</p>
                  <p className="text-[10px] font-semibold text-zinc-500 leading-relaxed px-4">Only customers who have received this product can share a verified review.</p>
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Related Artifacts */}
        {relatedProducts.length > 0 && (
          <section className="mt-40 space-y-12 pb-20">
            <div className="flex items-end justify-between">
              <div className="space-y-2">
                <h2 className="text-4xl font-black uppercase tracking-tighter text-zinc-900">Related Products</h2>
                <p className="text-sm font-semibold text-zinc-500">You might also be interested in these products.</p>
              </div>
              <Link
                href={product.category ? `/products?category=${encodeURIComponent(product.category)}` : '/products'}
                className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-zinc-900"
              >
                View Collection
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 transition-all group-hover:bg-black group-hover:text-white group-hover:translate-x-2">
                  →
                </div>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((related) => (
                <BuyerProductCard
                  key={related._id}
                  product={related}
                  onAddToCart={(item: any) => handleAddToCart(item, 1)}
                  onToggleWishlist={(item: any) => handleToggleWishlist(item)}
                  wished={wishedIds.has(related._id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </BuyerPageShell>
  );
};

export default ProductDetailPage;
