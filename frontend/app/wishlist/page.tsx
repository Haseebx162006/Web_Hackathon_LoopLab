'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import type { RootState } from '@/store/store';
import {
  type BuyerProduct,
  useAddToBuyerCartMutation,
  useGetBuyerWishlistQuery,
  useRemoveFromBuyerWishlistMutation,
} from '@/store/buyerApi';
import BuyerAuthGate from '@/components/buyer/BuyerAuthGate';
import BuyerEmptyState from '@/components/buyer/BuyerEmptyState';
import BuyerErrorState from '@/components/buyer/BuyerErrorState';
import BuyerLoader from '@/components/buyer/BuyerLoader';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import BuyerProductCard from '@/components/buyer/BuyerProductCard';
import { isBuyerAuthenticated, normalizeApiError } from '@/utils/buyerUtils';

const WishlistPage = () => {
  const router = useRouter();
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isBuyer = (role === 'buyer' && isAuthenticated) || isBuyerAuthenticated();

  const {
    data: wishlistResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetBuyerWishlistQuery(undefined, { skip: !isBuyer });

  const [addToCart] = useAddToBuyerCartMutation();
  const [removeFromWishlist] = useRemoveFromBuyerWishlistMutation();

  const wishlistProducts = useMemo(() => {
    const items = wishlistResponse?.data?.items ?? [];
    return items.filter((item): item is BuyerProduct => typeof item === 'object' && item !== null);
  }, [wishlistResponse?.data?.items]);

  const handleAddToCart = async (product: BuyerProduct) => {
    try {
      await addToCart({ productId: product._id, quantity: 1 }).unwrap();
      toast.success(`${product.productName} added to cart.`);
      router.push('/cart');
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to add product to cart.'));
    }
  };

  const handleRemove = async (product: BuyerProduct) => {
    try {
      await removeFromWishlist(product._id).unwrap();
      toast.success('Removed from wishlist.');
    } catch (mutationError) {
      toast.error(normalizeApiError(mutationError, 'Unable to remove from wishlist.'));
    }
  };

  return (
    <BuyerPageShell>
      {!isBuyer ? (
        <BuyerAuthGate title="Wishlist is for buyers" description="Login with your buyer account to save products you love." />
      ) : (
        <section className="space-y-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-zinc-400">Saved Products</p>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">My Wishlist</h1>
          </div>

          {isLoading ? <BuyerLoader label="Loading wishlist..." /> : null}

          {isError ? (
            <BuyerErrorState
              message={normalizeApiError(error, 'Unable to load wishlist.')}
              onRetry={() => {
                void refetch();
              }}
            />
          ) : null}

          {!isLoading && !isError && wishlistProducts.length === 0 ? (
            <BuyerEmptyState
              title="No wishlist items yet"
              description="Save your favorite products so you can compare and purchase them later."
              actionLabel="Browse products"
              actionHref="/products"
            />
          ) : null}

          {!isLoading && !isError && wishlistProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {wishlistProducts.map((product) => (
                <BuyerProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleRemove}
                  wished
                />
              ))}
            </div>
          ) : null}
        </section>
      )}
    </BuyerPageShell>
  );
};

export default WishlistPage;
