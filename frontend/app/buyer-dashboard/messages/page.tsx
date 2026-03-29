'use client';

import React, { useSyncExternalStore } from 'react';
import { useSelector } from 'react-redux';
import BuyerAuthGate from '@/components/buyer/BuyerAuthGate';
import BuyerPageShell from '@/components/buyer/BuyerPageShell';
import MarketplaceChatPanel from '@/components/chat/MarketplaceChatPanel';
import type { RootState } from '@/store/store';
import { isBuyerAuthenticated } from '@/utils/buyerUtils';

const hydrationSubscribe = () => () => {};
const getHydratedClientSnapshot = () => true;
const getHydratedServerSnapshot = () => false;

const BuyerMessagesPage = () => {
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const isHydrated = useSyncExternalStore(
    hydrationSubscribe,
    getHydratedClientSnapshot,
    getHydratedServerSnapshot
  );

  const isBuyer = isHydrated && ((role === 'buyer' && isAuthenticated) || isBuyerAuthenticated());

  return (
    <BuyerPageShell>
      {!isBuyer ? (
        <BuyerAuthGate
          title="Buyer messages are protected"
          description="Login with your buyer account to chat with sellers in real time."
        />
      ) : (
        <MarketplaceChatPanel
          role="buyer"
          title="Seller Conversations"
          description="Coordinate delivery, ask product questions, and resolve order updates with sellers instantly."
        />
      )}
    </BuyerPageShell>
  );
};

export default BuyerMessagesPage;
