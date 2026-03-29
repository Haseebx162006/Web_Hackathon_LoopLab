'use client';

import React, { useState } from 'react';
import { 
  useGetSellerOrdersQuery, 
  useVerifySellerPaymentMutation,
  type SellerOrder
} from '@/store/sellerApi';
import SellerShell from '@/components/seller/SellerShell';
import SellerPageHeader from '@/components/seller/SellerPageHeader';
import SellerLoader from '@/components/seller/SellerLoader';
import SellerErrorState from '@/components/seller/SellerErrorState';
import SellerBadge from '@/components/seller/SellerBadge';
import SellerButton from '@/components/seller/SellerButton';
import SellerTable from '@/components/seller/SellerTable';
import { formatCurrency } from '@/utils/buyerUtils';
import toast from 'react-hot-toast';
import { 
  IoCheckmarkCircleOutline, 
  IoCloseCircleOutline, 
  IoEyeOutline, 
  IoTimeOutline,
  IoImageOutline
} from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentsReceivedPage = () => {
  const { data: ordersResponse, isLoading, isError, refetch } = useGetSellerOrdersQuery();
  const [verifyPayment, { isLoading: isVerifying }] = useVerifySellerPaymentMutation();
  
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const pendingPayments = ordersResponse?.data?.filter(
    order => order.paymentMethod === 'boutique_account' && order.paymentStatus === 'pending_verification'
  ) || [];

  const handleVerify = async (orderId: string, action: 'approve' | 'reject') => {
    try {
      await verifyPayment({ orderId, action }).unwrap();
      toast.success(`Payment ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      if (selectedOrder?._id === orderId) setIsPreviewOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Action failed');
    }
  };

  return (
    <SellerShell>
      <div className="space-y-8 pb-20">
        <SellerPageHeader 
          title="Payments Received" 
          description="Verify manual Boutique Account transfers and approve orders for fulfillment."
        />

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <SellerLoader />
          </div>
        ) : isError ? (
          <SellerErrorState
            message="Unable to load pending payment verifications."
            onRetry={() => {
              void refetch();
            }}
          />
        ) : pendingPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-zinc-200 bg-white/50 p-20 text-center backdrop-blur-xl">
             <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-50 text-zinc-300">
                <IoCheckmarkCircleOutline className="text-4xl" />
             </div>
             <h3 className="text-xl font-light tracking-tight text-zinc-900">No Pending Verifications</h3>
             <p className="mt-2 text-sm font-light text-zinc-500">All Boutique Account payments have been processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            <div className="overflow-hidden rounded-[2.5rem] border border-zinc-100 bg-white shadow-xl shadow-zinc-200/50">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-50 bg-zinc-50/30">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Order Ref</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Buyer Identity</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Valuation</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Evidence</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {pendingPayments.map((order) => (
                    <tr key={order._id} className="group transition-colors hover:bg-zinc-50/50">
                      <td className="px-8 py-6">
                        <p className="text-sm font-semibold text-zinc-900">#{order._id.slice(-8).toUpperCase()}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase">
                           <IoTimeOutline />
                           {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-medium text-zinc-700">{order.buyer?.name || 'Anonymous'}</p>
                        <p className="text-[10px] font-bold text-zinc-400">{order.buyer?.email}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-black">{formatCurrency(order.totalAmount)}</p>
                      </td>
                      <td className="px-8 py-6">
                        <button 
                          onClick={() => { setSelectedOrder(order); setIsPreviewOpen(true); }}
                          className="flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 transition hover:bg-zinc-900 hover:text-white"
                        >
                          <IoImageOutline className="text-sm" />
                          View SS
                        </button>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => handleVerify(order._id, 'approve')}
                             disabled={isVerifying}
                             className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-600 hover:text-white disabled:opacity-50"
                           >
                              <IoCheckmarkCircleOutline className="text-xl" />
                           </button>
                           <button 
                             onClick={() => handleVerify(order._id, 'reject')}
                             disabled={isVerifying}
                             className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-600 hover:text-white disabled:opacity-50"
                           >
                              <IoCloseCircleOutline className="text-xl" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Verification Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && selectedOrder && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-4xl overflow-hidden rounded-[3.5rem] bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 px-10 py-8 text-black">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Evidence Verification Cabinet</p>
                    <h3 className="text-3xl font-thin tracking-tighter uppercase">Order #{selectedOrder._id.slice(-8).toUpperCase()}</h3>
                 </div>
                 <button onClick={() => setIsPreviewOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-colors">
                    <IoCloseCircleOutline className="text-2xl text-zinc-400" />
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2">
                 <div className="bg-zinc-900 p-2 flex items-center justify-center min-h-[500px]">
                    <img 
                      src={selectedOrder.paymentProof || '/assets/placeholders/no-image.png'} 
                      alt="Payment Proof" 
                      className="max-h-[70vh] w-full object-contain rounded-2xl"
                    />
                 </div>
                 <div className="p-10 flex flex-col justify-between">
                    <div className="space-y-8">
                       <section className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Buyer Summary</p>
                          <div className="rounded-3xl border border-zinc-100 p-6 space-y-3">
                             <div className="flex justify-between">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Valuation</span>
                                <span className="text-sm font-black">{formatCurrency(selectedOrder.totalAmount)}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Legal Name</span>
                                <span className="text-sm font-medium">{selectedOrder.buyer?.name}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Protocol</span>
                                <span className="text-[10px] font-black bg-zinc-900 text-white px-2 py-1 rounded">BOUTIQUE ACCOUNT</span>
                             </div>
                          </div>
                       </section>

                       <div className="rounded-3xl bg-amber-50 p-6 border border-amber-100/50">
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Merchant Advisory</p>
                          <p className="text-[11px] font-medium text-amber-900 leading-relaxed">
                             Please cross-verify the transaction ID on the screenshot with your bank statement or JazzCash records before confirming this order.
                          </p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <button 
                         onClick={() => handleVerify(selectedOrder._id, 'reject')}
                         disabled={isVerifying}
                         className="rounded-2xl border border-rose-100 bg-rose-50 py-4 text-[10px] font-black uppercase tracking-widest text-rose-600 transition hover:bg-rose-600 hover:text-white disabled:opacity-50"
                       >
                          Reject Payment
                       </button>
                       <button 
                         onClick={() => handleVerify(selectedOrder._id, 'approve')}
                         disabled={isVerifying}
                         className="rounded-2xl bg-zinc-900 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition hover:bg-black hover:scale-[1.02] disabled:opacity-50"
                       >
                          {isVerifying ? 'Processing...' : 'Approve & Confirm'}
                       </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SellerShell>
  );
};

export default PaymentsReceivedPage;
