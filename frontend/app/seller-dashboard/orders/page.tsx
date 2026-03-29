'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  IoSearchOutline, 
  IoCartOutline,
  IoCashOutline,
  IoTimeOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoCubeOutline
} from 'react-icons/io5';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa6';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import SellerBadge from '@/components/seller/SellerBadge';
import SellerButton from '@/components/seller/SellerButton';
import SellerCard from '@/components/seller/SellerCard';
import SellerErrorState from '@/components/seller/SellerErrorState';
import SellerLoader from '@/components/seller/SellerLoader';
import SellerPageHeader from '@/components/seller/SellerPageHeader';
import SellerSelect from '@/components/seller/SellerSelect';
import SellerTable from '@/components/seller/SellerTable';
import {
  useGetSellerOrdersQuery,
  useUpdateSellerOrderStatusMutation,
  type SellerOrder,
  type SellerStatusUpdate,
} from '@/store/sellerApi';
import { formatCurrency, formatDateTime, normalizeApiError } from '@/utils/sellerUtils';

interface OrderDraftState {
  status: SellerStatusUpdate;
  trackingId: string;
}

const statusOptions = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
];

const toEditableStatus = (status: string): SellerStatusUpdate => {
  if (status === 'packed' || status === 'shipped') {
    return status;
  }
  return 'confirmed';
};

const getOrderTone = (status: string) => {
  if (status === 'delivered' || status === 'shipped') {
    return 'success' as const;
  }
  if (status === 'cancelled' || status === 'returned') {
    return 'danger' as const;
  }
  if (status === 'pending' || status === 'processing') {
    return 'warning' as const;
  }
  return 'default' as const;
};

const renderAddress = (order: SellerOrder) => {
  const address = order.shippingAddress;
  if (!address) {
    return 'No address';
  }

  const parts = [address.street, address.city, address.state, address.country, address.zipCode].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'No address';
};

const OrdersManagementPage = () => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, OrderDraftState>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: ordersResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetSellerOrdersQuery();

  const [updateOrderStatus, { isLoading: updatingStatus }] = useUpdateSellerOrderStatusMutation();

  const orders = useMemo(() => ordersResponse?.data ?? [], [ordersResponse?.data]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => 
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.buyer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orders, searchQuery]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const activeOrders = orders.filter(o => ['pending', 'processing', 'confirmed', 'packed', 'shipped'].includes(o.status)).length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    return { totalRevenue, activeOrders, completedOrders };
  }, [orders]);

  const getDraft = (order: SellerOrder): OrderDraftState => {
    return (
      drafts[order._id] ?? {
        status: toEditableStatus(order.status),
        trackingId: order.trackingId ?? '',
      }
    );
  };

  const setDraft = (orderId: string, next: Partial<OrderDraftState>) => {
    setDrafts((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] ?? { status: 'confirmed', trackingId: '' }),
        ...next,
      },
    }));
  };

  const handleSave = async (order: SellerOrder) => {
    const draft = getDraft(order);

    try {
      await updateOrderStatus({
        id: order._id,
        status: draft.status,
        trackingId: draft.trackingId,
      }).unwrap();

      toast.success(`Order ${order._id.slice(-6)} updated`);
    } catch (requestError) {
      toast.error(normalizeApiError(requestError, 'Failed to update order status.'));
    }
  };

  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    const dataToExport = filteredOrders.map(order => ({
      'Order ID': order._id,
      'Date': formatDateTime(order.createdAt),
      'Customer': order.buyer?.name || 'Unknown',
      'Email': order.buyer?.email || '--',
      'Total': formatCurrency(order.total),
      'Status': order.status,
      'Tracking ID': order.trackingId || '--',
      'Shipping Address': renderAddress(order)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, `seller_orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Excel report generated');
  };

  const handleExportPDF = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    const doc = new jsPDF();
    const tableColumn = ['Order ID', 'Date', 'Customer', 'Total', 'Status'];
    const tableRows = filteredOrders.map(order => [
      order._id.slice(-8),
      formatDateTime(order.createdAt),
      order.buyer?.name || 'Unknown',
      formatCurrency(order.total),
      order.status
    ]);

    doc.text('Orders Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], fontSize: 9 },
      styles: { fontSize: 8 }
    });

    doc.save(`seller_orders_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('PDF report generated');
  };

  return (
    <div className="space-y-8">
      <SellerPageHeader
        title="Orders Management"
        description="Review buyer details, inspect item breakdowns, and update shipment status with tracking IDs."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="relative group">
           <div className="absolute -inset-0.5 bg-linear-to-r from-emerald-200 to-teal-100 rounded-4xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
           <SellerCard className="relative bg-white/80 backdrop-blur-xl border border-white/60">
              <div className="flex items-start justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Total Revenue</p>
                    <p className="mt-2 text-3xl font-light tracking-tight text-black">{formatCurrency(stats.totalRevenue)}</p>
                 </div>
                 <div className="h-10 w-10 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100/50">
                    <IoCashOutline className="text-emerald-400 text-lg" />
                 </div>
              </div>
              <p className="mt-4 text-[10px] font-medium text-emerald-600 flex items-center gap-1.5 uppercase tracking-wider">
                 <span className="h-1 w-1 rounded-full bg-emerald-400"></span>
                 Gross earnings
              </p>
           </SellerCard>
        </div>

        <div className="relative group">
           <div className="absolute -inset-0.5 bg-linear-to-r from-amber-200 to-orange-100 rounded-4xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
           <SellerCard className="relative bg-white/80 backdrop-blur-xl border border-white/60">
              <div className="flex items-start justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Active Orders</p>
                    <p className="mt-2 text-3xl font-light tracking-tight text-black">{stats.activeOrders}</p>
                 </div>
                 <div className="h-10 w-10 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100/50">
                    <IoCartOutline className="text-amber-400 text-lg" />
                 </div>
              </div>
              <p className="mt-4 text-[10px] font-medium text-amber-600 flex items-center gap-1.5 uppercase tracking-wider">
                 <span className="h-1 w-1 rounded-full bg-amber-400"></span>
                 In fulfillment pipeline
              </p>
           </SellerCard>
        </div>

        <div className="relative group">
           <div className="absolute -inset-0.5 bg-linear-to-r from-zinc-200 to-zinc-100 rounded-4xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
           <SellerCard className="relative bg-white/80 border border-white/60">
              <div className="flex items-start justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Completed Orders</p>
                    <p className="mt-2 text-3xl font-light tracking-tight text-zinc-800">{stats.completedOrders}</p>
                 </div>
                 <div className="h-10 w-10 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100/50">
                    <IoTimeOutline className="text-zinc-400 text-lg" />
                 </div>
              </div>
              <p className="mt-4 text-[10px] font-medium text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
                 <span className="h-1 w-1 rounded-full bg-zinc-300"></span>
                 Successful deliveries
              </p>
           </SellerCard>
        </div>
      </div>

      <SellerCard className="bg-white/80 border border-white/60">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-zinc-100/50 -m-6 lg:-m-8">
           <div className="flex-1 p-6 lg:p-8">
              <div className="relative group">
                <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg transition-colors group-focus-within:text-black" />
                <input 
                  type="text" 
                  placeholder="Filter by Order ID, Name or Email..."
                  className="w-full bg-zinc-50/50 border border-zinc-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-light outline-none transition-all focus:bg-white focus:ring-1 focus:ring-black/5"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
           </div>
           
           <div className="flex-initial p-6 lg:p-8 flex items-center gap-2">
              <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-zinc-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all font-semibold text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
                title="Export Excel"
              >
                <FaFileExcel className="text-lg" />
                <span>Excel</span>
              </button>
              <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-zinc-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all font-semibold text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
                title="Export PDF"
              >
                <FaFilePdf className="text-lg" />
                <span>PDF</span>
              </button>
           </div>
        </div>
      </SellerCard>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-linear-to-b from-zinc-100 to-transparent rounded-[2.5rem] blur opacity-10"></div>
        <SellerCard className="relative bg-white/80 border border-white/60 overflow-hidden" noPadding>
          <div className="p-6 lg:p-8 flex items-center justify-between border-b border-zinc-50 bg-zinc-50/30">
            <h2 className="text-lg font-light tracking-tight text-black flex items-center gap-3">
              Order Catalog
              <span className="text-[10px] font-bold bg-zinc-100 text-zinc-400 px-2 py-0.5 rounded-full uppercase tracking-widest">{filteredOrders.length} Records</span>
            </h2>
            <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <div className={`h-1.5 w-1.5 rounded-full ${isFetching ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              {isFetching ? 'Synchronizing...' : 'Live Data'}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-20 text-center">
               <IoSearchOutline className="text-4xl text-zinc-200 mx-auto mb-4" />
               <p className="text-sm font-light text-zinc-400">No matching orders found.</p>
            </div>
          ) : (
            <SellerTable
              headers={['Order Reference', 'Customer Details', 'Volume', 'Fulfillment', 'Timeline & Status', 'Shipment Tracking', 'Actions']}
            >
              {filteredOrders.map((order) => {
                const draft = getDraft(order);
                const isExpanded = expandedOrderId === order._id;

                return (
                  <React.Fragment key={order._id}>
                    <tr className="group hover:bg-black/2 transition-colors border-b border-zinc-50 last:border-0">
                      <td className="px-6 py-6 font-light">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-black group-hover:text-brand-purple transition-colors">#{order._id.slice(-8)}</p>
                          <p className="mt-1 text-[11px] font-light text-zinc-400 uppercase tracking-[0.15em]">{formatDateTime(order.createdAt)}</p>
                        </div>
                      </td>

                      <td className="px-6 py-6 font-light">
                        <p className="text-sm font-light text-black">{order.buyer?.name || 'Unknown'}</p>
                        <p className="mt-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">{order.buyer?.email || '--'}</p>
                      </td>

                      <td className="px-6 py-6">
                         <span className="px-3 py-1 bg-zinc-50 text-[10px] font-bold text-zinc-500 rounded-lg uppercase tracking-wider border border-zinc-100">
                            {order.items.length} Units
                         </span>
                      </td>

                      <td className="px-6 py-6">
                         <div className="max-w-[180px]">
                            <p className="text-[10px] font-light text-zinc-400 leading-relaxed uppercase tracking-wider line-clamp-2">{renderAddress(order)}</p>
                         </div>
                      </td>

                      <td className="px-6 py-6">
                         <div className="flex flex-col gap-2">
                            <SellerBadge label={order.status.replace('_', ' ')} tone={getOrderTone(order.status)} />
                            <button 
                              onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                              className="flex items-center gap-1.5 text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                            >
                               {isExpanded ? <IoChevronUpOutline /> : <IoChevronDownOutline />}
                               {isExpanded ? 'Hide Details' : 'View Items'}
                            </button>
                         </div>
                      </td>

                      <td className="px-6 py-6">
                        <div className="relative group/track min-w-[140px]">
                          <input
                            type="text"
                            value={draft.trackingId}
                            onChange={(event) => setDraft(order._id, { trackingId: event.target.value })}
                            placeholder="Tracking ID"
                            className="w-full h-11 rounded-2xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 text-[11px] font-bold text-zinc-800 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-black/5"
                          />
                        </div>
                      </td>

                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                          {order.buyer?._id ? (
                            <Link
                              href={`/seller-dashboard/messages?receiverId=${order.buyer._id}&orderId=${order._id}`}
                              className="inline-flex h-11 items-center rounded-2xl border border-zinc-200 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
                            >
                              Message buyer
                            </Link>
                          ) : null}

                          <div className="w-40">
                             <SellerSelect
                               label=""
                               className="!py-2.5"
                               value={draft.status}
                               onChange={(event) => {
                                 setDraft(order._id, { status: event.target.value as SellerStatusUpdate });
                               }}
                               options={statusOptions}
                             />
                          </div>
                          <SellerButton
                            label="Apply"
                            tone="primary"
                            className="h-11 px-6 !rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm"
                            loading={updatingStatus}
                            onClick={() => {
                              void handleSave(order);
                            }}
                          />
                        </div>
                      </td>
                    </tr>

                    {isExpanded ? (
                      <tr>
                        <td colSpan={7} className="p-0">
                           <div className="bg-zinc-50/40 border-b border-zinc-100/50 p-8 animate-fade-in">
                              <div className="flex items-center justify-between mb-6">
                                 <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 flex items-center gap-2">
                                    <IoCartOutline className="text-sm" />
                                    Detailed Order Manifest
                                 </h3>
                                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Valuation: {formatCurrency(order.total)}</p>
                              </div>
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {order.items.map((item) => {
                                  const productData =
                                    typeof item.product === 'object' && item.product !== null ? item.product : null;

                                  return (
                                    <div key={item._id} className="group/item relative">
                                       <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-100 to-zinc-50 rounded-2xl blur opacity-0 group-hover/item:opacity-20 transition"></div>
                                       <div className="relative rounded-2xl border border-white bg-white/60 p-5 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
                                          <div className="flex items-start justify-between">
                                             <div className="min-w-0 pr-4">
                                                <p className="text-sm font-semibold text-zinc-900 line-clamp-1 mb-1">
                                                  {productData?.productName || 'Product unavailable'}
                                                </p>
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">SKU: {productData?.skuCode || 'N/A'}</p>
                                             </div>
                                             <div className="h-8 w-8 bg-zinc-50 rounded-lg flex items-center justify-center border border-zinc-100 shrink-0">
                                                <IoCubeOutline className="text-zinc-300 text-sm" />
                                             </div>
                                          </div>
                                          <div className="mt-6 flex items-end justify-between">
                                             <div>
                                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Unit Price</p>
                                                <p className="text-sm font-light text-indigo-600">{formatCurrency(item.priceAtPurchase)}</p>
                                             </div>
                                             <div className="text-right">
                                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Quantity</p>
                                                <p className="text-xs font-bold text-zinc-800">x{item.quantity}</p>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                  );
                                })}
                              </div>
                           </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </SellerTable>
          )}
        </SellerCard>
      </div>

      {isError ? (
        <SellerErrorState
          message={normalizeApiError(error, 'Unable to load orders.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {isLoading ? (
        <SellerLoader label="Loading seller orders..." />
      ) : null}
    </div>
  );
};

export default OrdersManagementPage;
