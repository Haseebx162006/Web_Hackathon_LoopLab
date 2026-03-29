'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoTrashOutline, IoBagAddOutline, IoHeartOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import {
  useGetBuyerWishlistQuery,
  useRemoveFromBuyerWishlistMutation,
  useAddToBuyerCartMutation,
  type BuyerProduct,
} from '@/store/buyerApi';
import { formatCurrency, getPrimaryProductImage, getEffectivePrice, normalizeApiError } from '@/utils/buyerUtils';
import BuyerLoader from './BuyerLoader';

interface BuyerWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BuyerWishlistModal = ({ isOpen, onClose }: BuyerWishlistModalProps) => {
  const { data: wishlistResponse, isLoading, isError } = useGetBuyerWishlistQuery(undefined, {
    skip: !isOpen,
  });
  const [removeFromWishlist] = useRemoveFromBuyerWishlistMutation();
  const [addToCart] = useAddToBuyerCartMutation();

  const wishlistItems = wishlistResponse?.data?.items ?? [];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist(productId).unwrap();
      toast.success('Removed from wishlist');
    } catch (err) {
      toast.error(normalizeApiError(err, 'Failed to remove item'));
    }
  };

  const handleMoveToCart = async (product: BuyerProduct) => {
    try {
      await addToCart({ productId: product._id, quantity: 1 }).unwrap();
      await removeFromWishlist(product._id).unwrap();
      toast.success('Moved to cart');
    } catch (err) {
      toast.error(normalizeApiError(err, 'Failed to move to cart'));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-end"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />

          {/* Modal Content (Slide in from right) */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="glass relative z-10 h-screen w-full max-w-md overflow-hidden bg-white/95 shadow-2xl"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                    <IoHeartOutline className="text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Your Wishlist</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      {wishlistItems.length} Saved Items
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="group flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 transition-colors hover:bg-black hover:text-white"
                >
                  <IoClose className="text-xl transition-transform group-hover:rotate-90" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <BuyerLoader label="Loading your favorites..." />
                  </div>
                ) : isError ? (
                  <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                    <p className="text-sm font-semibold text-zinc-500">Unable to load wishlist.</p>
                  </div>
                ) : wishlistItems.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center space-y-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 text-zinc-200">
                      <IoHeartOutline className="text-4xl" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-black uppercase tracking-tight text-zinc-900">It's quiet here</p>
                      <p className="text-xs font-semibold text-zinc-500">Start saving your favorite items to see them here.</p>
                    </div>
                    <button
                      onClick={onClose}
                      className="rounded-xl bg-black px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
                    >
                      Browse Boutique
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wishlistItems.map((item) => {
                      const product = typeof item === 'string' ? null : (item as BuyerProduct);
                      if (!product) return null;

                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={product._id}
                          className="group relative flex items-center gap-4 rounded-3xl border border-zinc-100 bg-white p-3 transition hover:shadow-lg hover:shadow-zinc-100"
                        >
                          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-zinc-50">
                            <img
                              src={getPrimaryProductImage(product)}
                              alt={product.productName}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                            />
                          </div>

                          <div className="flex flex-1 flex-col justify-between py-1">
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                {product.category}
                              </p>
                              <h3 className="line-clamp-1 text-sm font-black uppercase tracking-tight text-zinc-900">
                                {product.productName}
                              </h3>
                              <p className="text-sm font-black text-zinc-900">
                                {formatCurrency(getEffectivePrice(product))}
                              </p>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <button
                                onClick={() => handleMoveToCart(product)}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black py-2.5 text-[9px] font-black uppercase tracking-widest text-white transition hover:bg-zinc-800"
                              >
                                <IoBagAddOutline className="text-sm" />
                                Add to Bag
                              </button>
                              <button
                                onClick={() => handleRemove(product._id)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-100 bg-white text-zinc-400 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
                                aria-label="Remove"
                              >
                                <IoTrashOutline className="text-sm" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {wishlistItems.length > 0 && (
                <div className="border-t border-zinc-100 bg-zinc-50/50 p-6 backdrop-blur-md">
                  <button 
                    onClick={onClose}
                    className="w-full rounded-2xl bg-black py-4 text-[11px] font-black uppercase tracking-[0.25em] text-white shadow-xl transition hover:bg-zinc-800"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BuyerWishlistModal;
