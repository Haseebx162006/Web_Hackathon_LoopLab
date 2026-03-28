'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { IoHeartOutline, IoStar } from 'react-icons/io5';
import type { RootState } from '@/store/store';
import {
  type BuyerProduct,
  useAddBuyerReviewMutation,
  useAddToBuyerCartMutation,
  useAddToBuyerWishlistMutation,
  useGetBuyerProductDetailsQuery,
  useGetBuyerProductsQuery,
  useGetBuyerWishlistQuery,
  useRemoveFromBuyerWishlistMutation,
} from '@/store/buyerApi';
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

const ProductDetailPage = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isBuyer = (role === 'buyer' && isAuthenticated) || isBuyerAuthenticated();

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

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

  const [addToCart, { isLoading: addingToCart }] = useAddToBuyerCartMutation();
  const [addToWishlist] = useAddToBuyerWishlistMutation();
  const [removeFromWishlist] = useRemoveFromBuyerWishlistMutation();
  const [addReview, { isLoading: submittingReview }] = useAddBuyerReviewMutation();

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

  return (
    <BuyerPageShell>
      <section className="grid grid-cols-1 gap-8 rounded-[2rem] border border-zinc-100 bg-white/85 p-5 shadow-[0_14px_35px_-22px_rgba(0,0,0,0.25)] lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[1.6rem] bg-zinc-50">
            <img
              src={productImages[activeImage] || '/assets/logo/logo.png'}
              alt={product.productName}
              className="h-[420px] w-full object-cover"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {(productImages.length ? productImages : ['/assets/logo/logo.png']).slice(0, 4).map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveImage(index)}
                className={`overflow-hidden rounded-xl border transition ${
                  activeImage === index ? 'border-black' : 'border-zinc-200 hover:border-zinc-400'
                }`}
              >
                <img src={image} alt={`${product.productName} preview ${index + 1}`} className="h-20 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Product Detail</p>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-zinc-900 sm:text-4xl">{product.productName}</h1>
          <p className="text-sm font-semibold text-zinc-500">{product.description || 'No product description available yet.'}</p>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-700">
              <IoStar className="text-amber-500" />
              {Number(avgRating).toFixed(1)}
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-zinc-600">
              {reviews.length} reviews
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
                stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {stock > 0 ? `${stock} available` : 'Out of stock'}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tight text-zinc-900">{formatCurrency(effectivePrice)}</p>
            {product.discountPrice && product.discountPrice < product.price ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-400 line-through">{formatCurrency(product.price)}</span>
                <span className="rounded-full bg-black px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                  {discountPercent}% off
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <BuyerQuantityControl value={quantity} onChange={setQuantity} max={stock > 0 ? stock : 1} disabled={stock <= 0} />
            <button
              type="button"
              onClick={() => handleAddToCart(product, quantity)}
              disabled={stock <= 0 || addingToCart}
              className="rounded-xl bg-black px-4 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {addingToCart ? 'Adding...' : 'Add to cart'}
            </button>
            <button
              type="button"
              onClick={() => handleToggleWishlist(product)}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition ${
                isWished
                  ? 'bg-rose-600 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-900 hover:text-white'
              }`}
              aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <IoHeartOutline className="text-lg" />
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-xs font-semibold text-zinc-500">
            Sold by: <span className="font-black text-zinc-700">{typeof product.sellerId === 'object' ? product.sellerId.storeName || 'Verified Seller' : 'Verified Seller'}</span>
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-[2rem] border border-zinc-100 bg-white/85 p-5 shadow-[0_12px_28px_-20px_rgba(0,0,0,0.25)]">
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">Customer Reviews</h2>

          {reviews.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-zinc-500">No reviews yet. Be the first one to review this product.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {reviews.map((review) => (
                <div key={review._id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-zinc-700">
                      {typeof review.buyerId === 'object' ? review.buyerId.name || 'Buyer' : 'Buyer'}
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-200 px-2 py-1 text-[10px] font-black text-zinc-700">
                      <IoStar className="text-amber-500" />
                      {review.rating}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-zinc-600">{review.comment || 'No written comment.'}</p>
                  <p className="mt-2 text-[11px] font-semibold text-zinc-400">{formatDateTime(review.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-[2rem] border border-zinc-100 bg-white/85 p-5 shadow-[0_12px_28px_-20px_rgba(0,0,0,0.25)]">
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">Write a Review</h2>
          <p className="mt-2 text-sm font-semibold text-zinc-500">Only delivered purchases can be reviewed.</p>

          <form onSubmit={handleSubmitReview} className="mt-4 space-y-3">
            <select
              value={reviewRating}
              onChange={(event) => setReviewRating(Number(event.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none"
            >
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Good</option>
              <option value={3}>3 - Average</option>
              <option value={2}>2 - Poor</option>
              <option value={1}>1 - Very poor</option>
            </select>

            <textarea
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Share your experience"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 outline-none placeholder:text-zinc-400"
            />

            <button
              type="submit"
              disabled={submittingReview}
              className="rounded-xl bg-black px-4 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {submittingReview ? 'Submitting...' : 'Submit review'}
            </button>
          </form>
        </article>
      </section>

      {relatedProducts.length ? (
        <section className="mt-8 space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">Related Products</h2>
            <Link
              href={product.category ? `/products?category=${encodeURIComponent(product.category)}` : '/products'}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
            >
              Explore category
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((related) => (
              <BuyerProductCard
                key={related._id}
                product={related}
                onAddToCart={(item) => {
                  void handleAddToCart(item, 1);
                }}
                onToggleWishlist={handleToggleWishlist}
                wished={wishedIds.has(related._id)}
                compact
              />
            ))}
          </div>
        </section>
      ) : null}
    </BuyerPageShell>
  );
};

export default ProductDetailPage;
