'use client';

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import SellerBadge from '@/components/seller/SellerBadge';
import SellerButton from '@/components/seller/SellerButton';
import SellerCard from '@/components/seller/SellerCard';
import SellerErrorState from '@/components/seller/SellerErrorState';
import SellerInput from '@/components/seller/SellerInput';
import SellerLoader from '@/components/seller/SellerLoader';
import SellerPageHeader from '@/components/seller/SellerPageHeader';
import SellerTable from '@/components/seller/SellerTable';
import SellerTextarea from '@/components/seller/SellerTextarea';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  useBulkUpdateSellerInventoryMutation,
  useGetSellerInventoryQuery,
  useGetSellerProductsQuery,
  useUpdateSellerInventoryStockMutation,
} from '@/store/sellerApi';
import { formatCurrency, normalizeApiError } from '@/utils/sellerUtils';
import { IoBarChartOutline, IoCubeOutline, IoFilterOutline, IoSearchOutline, IoTrendingDownOutline } from 'react-icons/io5';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa6';
const parseBulkInput = (input: string) => {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [skuCodeRaw, qtyRaw] = line.split(',');
      return {
        skuCode: (skuCodeRaw ?? '').trim(),
        newStockQuantity: Number((qtyRaw ?? '').trim()),
      };
    })
    .filter((item) => item.skuCode && Number.isInteger(item.newStockQuantity) && item.newStockQuantity >= 0);
};

const InventoryManagementPage = () => {
  const [threshold, setThreshold] = useState<number>(10);
  const [draftStocks, setDraftStocks] = useState<Record<string, string>>({});
  const [bulkInput, setBulkInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: inventoryResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetSellerInventoryQuery({ threshold });
  const { data: productsResponse } = useGetSellerProductsQuery();

  const [updateStock, { isLoading: updatingStock }] = useUpdateSellerInventoryStockMutation();
  const [bulkUpdateStock, { isLoading: bulkUpdating }] = useBulkUpdateSellerInventoryMutation();

  const inventory = useMemo(() => inventoryResponse?.data ?? [], [inventoryResponse?.data]);
  const lowStockCount = useMemo(() => inventory.filter((item) => item.lowStock).length, [inventory]);

  const productIdBySku = useMemo(() => {
    const skuMap = new Map<string, string>();
    for (const product of productsResponse?.data ?? []) {
      skuMap.set(product.skuCode, product._id);
    }
    return skuMap;
  }, [productsResponse?.data]);

  const getDraftValue = (skuCode: string, stockQuantity: number) => {
    return draftStocks[skuCode] ?? String(stockQuantity);
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => 
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.skuCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventory, searchQuery]);

  const imagesBySku = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of productsResponse?.data ?? []) {
      if (p.productImages[0]) map.set(p.skuCode, p.productImages[0]);
    }
    return map;
  }, [productsResponse?.data]);

  const setDraftValue = (skuCode: string, value: string) => {
    setDraftStocks((prev) => ({
      ...prev,
      [skuCode]: value,
    }));
  };

  const handleSingleUpdate = async (skuCode: string, currentStock: number) => {
    const value = draftStocks[skuCode] ?? String(currentStock);
    const parsedStock = Number(value);

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      toast.error('Stock quantity must be a non-negative whole number.');
      return;
    }

    try {
      const productId = productIdBySku.get(skuCode);

      if (productId) {
        await updateStock({ id: productId, stockQuantity: parsedStock }).unwrap();
      } else {
        await bulkUpdateStock([{ skuCode, newStockQuantity: parsedStock }]).unwrap();
      }

      toast.success(`Updated stock for ${skuCode}`);
    } catch (requestError) {
      toast.error(normalizeApiError(requestError, 'Failed to update stock quantity.'));
    }
  };

  const handleBulkUpdate = async () => {
    const items = parseBulkInput(bulkInput);

    if (items.length === 0) {
      toast.error('Provide at least one valid row in SKU,quantity format.');
      return;
    }

    try {
      const result = await bulkUpdateStock(items).unwrap();
      toast.success(`Bulk inventory updated for ${result.updated} product(s)`);
      setBulkInput('');
    } catch (requestError) {
      toast.error(normalizeApiError(requestError, 'Bulk stock update failed.'));
    }
  };

  const handleExportExcel = () => {
    if (filteredInventory.length === 0) {
      toast.error('No inventory to export');
      return;
    }

    const dataToExport = filteredInventory.map(item => ({
      'Product Name': item.productName,
      'SKU Code': item.skuCode,
      'Stock Quantity': item.stockQuantity,
      'Status': item.lowStock ? 'Low Stock' : 'Healthy',
      'Valuation': formatCurrency(item.stockQuantity * (productsResponse?.data?.find(p => p.skuCode === item.skuCode)?.price || 0))
    }));


    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSX.writeFile(workbook, `seller_inventory_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Excel report generated');
  };

  const handleExportPDF = () => {
    if (filteredInventory.length === 0) {
      toast.error('No inventory to export');
      return;
    }

    const doc = new jsPDF();
    const tableColumn = ['Product', 'SKU', 'Stock', 'Status'];
    const tableRows = filteredInventory.map(item => [
      item.productName,
      item.skuCode,
      item.stockQuantity,
      item.lowStock ? 'Low Stock' : 'Healthy'
    ]);

    doc.text('Inventory Stock Report', 14, 15);
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

    doc.save(`seller_inventory_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('PDF report generated');
  };

  return (
    <div className="space-y-8">
      <SellerPageHeader
        title="Inventory Management"
        description="Monitor stock levels, identify low-stock products, and update inventory individually or in bulk."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="relative group">
           <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-200 to-zinc-100 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
           <SellerCard className="relative bg-white/80 backdrop-blur-xl border border-white/60">
              <div className="flex items-start justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Current Threshold</p>
                    <p className="mt-2 text-3xl font-light tracking-tight text-black">{inventoryResponse?.threshold ?? threshold}</p>
                 </div>
                 <div className="h-10 w-10 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100/50">
                    <IoFilterOutline className="text-zinc-400 text-lg" />
                 </div>
              </div>
              <p className="mt-4 text-[10px] font-medium text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
                 <span className="h-1 w-1 rounded-full bg-zinc-300"></span>
                 Low stock flag basis
              </p>
           </SellerCard>
        </div>

        <div className="relative group">
           <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-200 to-blue-100 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
           <SellerCard className="relative bg-white/80 backdrop-blur-xl border border-white/60">
              <div className="flex items-start justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Products Tracked</p>
                    <p className="mt-2 text-3xl font-light tracking-tight text-black">{inventory.length}</p>
                 </div>
                 <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100/50">
                    <IoBarChartOutline className="text-indigo-400 text-lg" />
                 </div>
              </div>
              <p className="mt-4 text-[10px] font-medium text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
                 <span className="h-1 w-1 rounded-full bg-indigo-300"></span>
                 Live catalog data
              </p>
           </SellerCard>
        </div>

        <div className="relative group">
           <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-200 to-orange-100 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
           <SellerCard className="relative bg-white/80 border border-white/60">
              <div className="flex items-start justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Low Stock Alerts</p>
                    <p className="mt-2 text-3xl font-light tracking-tight text-rose-500">{lowStockCount}</p>
                 </div>
                 <div className="h-10 w-10 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100/50">
                    <IoTrendingDownOutline className="text-rose-400 text-lg" />
                 </div>
              </div>
              <p className="mt-4 text-[10px] font-medium text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                 <span className="h-1 w-1 rounded-full bg-rose-400"></span>
                 Action Required
              </p>
           </SellerCard>
        </div>
      </div>

      <SellerCard className="bg-white/80 border border-white/60">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-zinc-100/50 -m-6 lg:-m-8">
           <div className="flex-1 p-6 lg:p-8 flex items-center gap-4">
              <div className="h-12 w-24">
                <SellerInput
                  label="Alert Threshold"
                  type="number"
                  className="!py-2 !px-3"
                  min="1"
                  step="1"
                  value={String(threshold)}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isInteger(next) && next > 0) {
                      setThreshold(next);
                    }
                  }}
                />
              </div>
              <p className="text-xs font-light text-zinc-400 mt-4 leading-tight">
                Adjust the minimum stock level for low-stock flagging.
              </p>
           </div>
           
           <div className="flex-[2] p-6 lg:p-8 flex items-center gap-4">
              <div className="flex-1 relative group">
                <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg transition-colors group-focus-within:text-black" />
                <input 
                  type="text" 
                  placeholder="Search by Product Name or SKU..."
                  className="w-full bg-zinc-50/50 border border-zinc-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-light outline-none transition-all focus:bg-white focus:ring-1 focus:ring-black/5"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                 <button 
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white border border-zinc-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all font-semibold text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
                    title="Export Excel"
                  >
                    <FaFileExcel className="text-lg" />
                    <span className="hidden sm:inline">Excel</span>
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white border border-zinc-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all font-semibold text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
                    title="Export PDF"
                  >
                    <FaFilePdf className="text-lg" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
              </div>
           </div>
        </div>
      </SellerCard>

      <div className="relative group">
         <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-100 to-zinc-50 rounded-[2.5rem] blur opacity-10"></div>
         <SellerCard className="relative bg-white/60 border border-white/40">
            <div className="flex items-center justify-between mb-6">
               <div>
                  <h2 className="text-xl font-light tracking-tight text-black">Rapid Stock Sync</h2>
                  <p className="mt-1 text-xs font-light text-zinc-500">
                    Efficiently synchronize multiple stock levels using the <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 text-[10px]">SKU,QUANTITY</code> CSV format.
                  </p>
               </div>
               <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center border border-zinc-100 shadow-sm">
                  <IoCubeOutline className="text-zinc-400 text-xl" />
               </div>
            </div>

            <div className="space-y-6">
              <SellerTextarea
                label="Batch Payload"
                rows={6}
                className="bg-zinc-50/50 focus:bg-white transition-all font-mono text-xs"
                value={bulkInput}
                onChange={(event) => setBulkInput(event.target.value)}
                placeholder={`SKU123,50\nSKU456,100\nSKU789,0`}
              />
              <div className="flex justify-end">
                <SellerButton 
                  label="Execute Batch Synchronize" 
                  tone="primary"
                  className="px-8 h-12 !rounded-2xl"
                  loading={bulkUpdating} 
                  onClick={handleBulkUpdate} 
                />
              </div>
            </div>
         </SellerCard>
      </div>

      {isError ? (
        <SellerErrorState
          message={normalizeApiError(error, 'Unable to load inventory.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : isLoading ? (
        <SellerLoader label="Loading inventory..." />
      ) : (
        <div className="relative group/table">
           <div className="absolute -inset-0.5 bg-linear-to-b from-zinc-100 to-transparent rounded-[2.5rem] blur opacity-10"></div>
           <SellerCard className="relative bg-white/80 border border-white/60 overflow-hidden" noPadding>
              <div className="p-6 lg:p-8 flex items-center justify-between border-b border-zinc-50 bg-zinc-50/30">
                <h2 className="text-lg font-light tracking-tight text-black flex items-center gap-3">
                  Inventory Catalog
                  <span className="text-[10px] font-bold bg-zinc-100 text-zinc-400 px-2 py-0.5 rounded-full uppercase tracking-widest">{filteredInventory.length} Items</span>
                </h2>
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  <div className={`h-1.5 w-1.5 rounded-full ${isFetching ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                  {isFetching ? 'Synchronizing...' : 'Up to date'}
                </div>
              </div>

              {filteredInventory.length === 0 ? (
                <div className="p-20 text-center">
                   <IoSearchOutline className="text-4xl text-zinc-200 mx-auto mb-4" />
                   <p className="text-sm font-light text-zinc-400">No matching inventory items found.</p>
                </div>
              ) : (
                <SellerTable headers={['Asset', 'Product Identity', 'Stock Level', 'Status', 'Refine Quantity', 'Actions']}>
                  {filteredInventory.map((item) => (
                    <tr key={item.skuCode} className="group hover:bg-black/2 transition-colors border-b border-zinc-50 last:border-0">
                      <td className="px-6 py-5">
                         <div className="h-14 w-14 rounded-2xl bg-zinc-100 border border-zinc-200/50 overflow-hidden flex items-center justify-center shrink-0">
                            {imagesBySku.get(item.skuCode) ? (
                              <img src={imagesBySku.get(item.skuCode)} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                              <IoCubeOutline className="text-2xl text-zinc-300" />
                            )}
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="min-w-0">
                            <p className="text-sm font-light text-black truncate">{item.productName}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{item.skuCode}</p>
                         </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-light text-black">
                         <span className={`px-3 py-1 rounded-lg ${item.lowStock ? 'bg-rose-50 text-rose-600' : 'bg-zinc-50 text-zinc-600'}`}>
                            {item.stockQuantity} Units
                         </span>
                      </td>
                      <td className="px-6 py-5">
                        <SellerBadge
                          label={item.lowStock ? 'Critical' : 'Operational'}
                          tone={item.lowStock ? 'danger' : 'success'}
                        />
                      </td>
                      <td className="px-6 py-5 font-light">
                        <div className="relative w-32 group/input">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="w-full rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none transition-all focus:ring-2 focus:ring-black/10 pr-10"
                            value={getDraftValue(item.skuCode, item.stockQuantity)}
                            onChange={(event) => setDraftValue(item.skuCode, event.target.value)}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-300 font-bold uppercase transition-opacity group-focus-within/input:opacity-100 opacity-0">QTY</div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <SellerButton
                          label="Commit"
                          tone="secondary"
                          className="px-6 h-11 !rounded-2xl shadow-sm text-xs"
                          loading={updatingStock}
                          onClick={() => {
                            void handleSingleUpdate(item.skuCode, item.stockQuantity);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </SellerTable>
              )}
           </SellerCard>
        </div>
      )}
    </div>
  );
};

export default InventoryManagementPage;
