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
import {
  useBulkUpdateSellerInventoryMutation,
  useGetSellerInventoryQuery,
  useGetSellerProductsQuery,
  useUpdateSellerInventoryStockMutation,
} from '@/store/sellerApi';
import { normalizeApiError } from '@/utils/sellerUtils';

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

  const inventory = inventoryResponse?.data ?? [];
  const lowStockCount = inventory.filter((item) => item.lowStock).length;

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

  return (
    <div className="space-y-8">
      <SellerPageHeader
        title="Inventory Management"
        description="Monitor stock levels, identify low-stock products, and update inventory individually or in bulk."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SellerCard>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Current Threshold</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-black">{inventoryResponse?.threshold ?? threshold}</p>
          <p className="mt-1 text-sm text-zinc-500">Products below this value are flagged low stock.</p>
        </SellerCard>
        <SellerCard>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Products Tracked</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-black">{inventory.length}</p>
          <p className="mt-1 text-sm text-zinc-500">Live from seller inventory endpoint.</p>
        </SellerCard>
        <SellerCard>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Low Stock Alerts</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-rose-600">{lowStockCount}</p>
          <p className="mt-1 text-sm text-zinc-500">Requires replenishment.</p>
        </SellerCard>
      </div>

      <SellerCard>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_auto] md:items-end">
          <SellerInput
            label="Low Stock Threshold"
            type="number"
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
          <p className="text-sm text-zinc-500">
            Changing threshold refreshes inventory data and low-stock indicators immediately.
          </p>
        </div>
      </SellerCard>

      <SellerCard>
        <h2 className="text-xl font-black tracking-tight text-black">Bulk Stock Update</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Enter one item per line using this format: <strong>SKU123,45</strong>
        </p>

        <div className="mt-4 space-y-4">
          <SellerTextarea
            label="Bulk Update Payload"
            rows={7}
            value={bulkInput}
            onChange={(event) => setBulkInput(event.target.value)}
            placeholder={`SKU-RED-M,25\nSKU-BLUE-L,12`}
          />
          <div className="flex justify-end">
            <SellerButton label="Apply Bulk Update" loading={bulkUpdating} onClick={handleBulkUpdate} />
          </div>
        </div>
      </SellerCard>

      {isError ? (
        <SellerErrorState
          message={normalizeApiError(error, 'Unable to load inventory.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {isLoading ? (
        <SellerLoader label="Loading inventory..." />
      ) : (
        <SellerCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black tracking-tight text-black">Stock Levels</h2>
            <p className="text-xs font-semibold text-zinc-500">
              {inventory.length} item(s) {isFetching ? 'refreshing...' : 'loaded'}
            </p>
          </div>

          {inventory.length === 0 ? (
            <p className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-6 text-sm font-semibold text-zinc-500">
              Inventory is empty. Add products to begin stock tracking.
            </p>
          ) : (
            <SellerTable headers={['Product', 'SKU', 'Stock', 'Status', 'Update Quantity', 'Action']}>
              {inventory.map((item) => (
                <tr key={item.skuCode}>
                  <td className="px-4 py-4 text-sm font-black text-zinc-800">{item.productName}</td>
                  <td className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-zinc-600">{item.skuCode}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-zinc-700">{item.stockQuantity}</td>
                  <td className="px-4 py-4">
                    <SellerBadge
                      label={item.lowStock ? 'Low stock' : 'Healthy'}
                      tone={item.lowStock ? 'danger' : 'success'}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="w-28 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold"
                      value={getDraftValue(item.skuCode, item.stockQuantity)}
                      onChange={(event) => setDraftValue(item.skuCode, event.target.value)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <SellerButton
                      label="Save"
                      tone="secondary"
                      className="px-4 py-2"
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
      )}
    </div>
  );
};

export default InventoryManagementPage;
