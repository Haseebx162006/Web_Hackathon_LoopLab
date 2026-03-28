'use client';

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import SellerBadge from '@/components/seller/SellerBadge';
import SellerButton from '@/components/seller/SellerButton';
import SellerCard from '@/components/seller/SellerCard';
import SellerErrorState from '@/components/seller/SellerErrorState';
import SellerInput from '@/components/seller/SellerInput';
import SellerLoader from '@/components/seller/SellerLoader';
import SellerModal from '@/components/seller/SellerModal';
import SellerPageHeader from '@/components/seller/SellerPageHeader';
import SellerTable from '@/components/seller/SellerTable';
import SellerTextarea from '@/components/seller/SellerTextarea';
import {
  useBulkUploadProductsMutation,
  useCreateSellerProductMutation,
  useDeleteSellerProductMutation,
  useGetSellerProductsQuery,
  useUpdateSellerProductMutation,
  useUploadProductImagesMutation,
  type SellerProduct,
  type SellerProductPayload,
  type SellerVariant,
} from '@/store/sellerApi';
import { formatCurrency, formatDateTime, normalizeApiError } from '@/utils/sellerUtils';

interface ProductFormState {
  productName: string;
  description: string;
  category: string;
  price: string;
  discountPrice: string;
  skuCode: string;
  stockQuantity: string;
  variantsInput: string;
  imageUrlsInput: string;
}

const getInitialFormState = (): ProductFormState => ({
  productName: '',
  description: '',
  category: '',
  price: '',
  discountPrice: '',
  skuCode: '',
  stockQuantity: '',
  variantsInput: '',
  imageUrlsInput: '',
});

const variantsToInput = (variants: SellerVariant[]) => {
  return variants.map((entry) => `${entry.key}:${entry.value}`).join('\n');
};

const parseVariants = (value: string) => {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [keyPart, ...rest] = line.split(':');
      const key = keyPart?.trim() ?? '';
      const parsedValue = rest.join(':').trim();
      return {
        key,
        value: parsedValue,
      };
    })
    .filter((entry) => entry.key && entry.value);
};

const parseImageUrls = (value: string) => {
  return value
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
};

const ProductManagementPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null);
  const [formState, setFormState] = useState<ProductFormState>(getInitialFormState());
  const [formError, setFormError] = useState<string | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const {
    data: productsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetSellerProductsQuery();

  const [createProduct, { isLoading: creating }] = useCreateSellerProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateSellerProductMutation();
  const [deleteProduct, { isLoading: deleting }] = useDeleteSellerProductMutation();
  const [uploadImages, { isLoading: uploadingImages }] = useUploadProductImagesMutation();
  const [bulkUpload, { isLoading: bulkUploading }] = useBulkUploadProductsMutation();

  const products = useMemo(() => productsResponse?.data ?? [], [productsResponse?.data]);
  const submitting = creating || updating || uploadingImages;

  const resetForm = () => {
    setFormState(getInitialFormState());
    setEditingProduct(null);
    setFormError(null);
    setImageFiles([]);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product: SellerProduct) => {
    setEditingProduct(product);
    setFormState({
      productName: product.productName,
      description: product.description,
      category: product.category,
      price: String(product.price),
      discountPrice: product.discountPrice != null ? String(product.discountPrice) : '',
      skuCode: product.skuCode,
      stockQuantity: String(product.stockQuantity),
      variantsInput: variantsToInput(product.variants),
      imageUrlsInput: product.productImages.join(', '),
    });
    setFormError(null);
    setImageFiles([]);
    setIsFormOpen(true);
  };

  const validateAndBuildPayload = (): SellerProductPayload | null => {
    const price = Number(formState.price);
    const stockQuantity = Number(formState.stockQuantity);
    const discountValue = formState.discountPrice.trim() === '' ? null : Number(formState.discountPrice);

    if (!formState.productName.trim()) {
      setFormError('Product name is required.');
      return null;
    }
    if (!formState.description.trim()) {
      setFormError('Description is required.');
      return null;
    }
    if (!formState.category.trim()) {
      setFormError('Category is required.');
      return null;
    }
    if (!formState.skuCode.trim()) {
      setFormError('SKU code is required.');
      return null;
    }
    if (Number.isNaN(price) || price < 0) {
      setFormError('Price must be a number greater than or equal to 0.');
      return null;
    }
    if (Number.isNaN(stockQuantity) || stockQuantity < 0 || !Number.isInteger(stockQuantity)) {
      setFormError('Stock quantity must be a whole number greater than or equal to 0.');
      return null;
    }
    if (discountValue !== null && (Number.isNaN(discountValue) || discountValue < 0)) {
      setFormError('Discount must be a number greater than or equal to 0.');
      return null;
    }

    const payload: SellerProductPayload = {
      productName: formState.productName.trim(),
      description: formState.description.trim(),
      category: formState.category.trim(),
      price,
      discountPrice: discountValue,
      variants: parseVariants(formState.variantsInput),
      skuCode: formState.skuCode.trim(),
      stockQuantity,
      productImages: parseImageUrls(formState.imageUrlsInput),
    };

    return payload;
  };

  const handleSubmitProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const payload = validateAndBuildPayload();
    if (!payload) {
      return;
    }

    try {
      let productId: string;

      if (editingProduct) {
        const updated = await updateProduct({ id: editingProduct._id, body: payload }).unwrap();
        productId = updated.data._id;
        toast.success('Product updated successfully');
      } else {
        const created = await createProduct(payload).unwrap();
        productId = created.data._id;
        toast.success('Product created successfully');
      }

      if (imageFiles.length > 0) {
        await uploadImages({ productId, files: imageFiles }).unwrap();
        toast.success('Product images uploaded');
      }

      setIsFormOpen(false);
      resetForm();
    } catch (requestError) {
      setFormError(normalizeApiError(requestError, 'Failed to save product.'));
    }
  };

  const handleDelete = async (productId: string) => {
    const confirmed = window.confirm('Delete this product permanently?');
    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(productId).unwrap();
      toast.success('Product deleted');
    } catch (requestError) {
      toast.error(normalizeApiError(requestError, 'Failed to delete product'));
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast.error('Select an Excel file first (.xlsx or .xls).');
      return;
    }

    try {
      const result = await bulkUpload(bulkFile).unwrap();
      const { created, failed } = result.summary;
      toast.success(`Bulk upload complete. Created: ${created}, Failed: ${failed}`);
      setBulkFile(null);
    } catch (requestError) {
      toast.error(normalizeApiError(requestError, 'Bulk upload failed'));
    }
  };

  return (
    <div className="space-y-8">
      <SellerPageHeader
        title="Product Management"
        description="Create, update, delete, and bulk upload products while keeping SKU and inventory details synchronized."
        action={<SellerButton label="Add Product" onClick={handleOpenCreate} />}
      />

      <SellerCard>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Bulk Product Upload</p>
            <p className="mt-1 text-sm text-zinc-500">
              Upload an Excel file with product rows. Supported columns include productName, description,
              category, price, discountPrice, skuCode, stockQuantity, variants, and productImages.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setBulkFile(file);
              }}
              className="block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500"
            />
            <SellerButton label="Upload File" loading={bulkUploading} onClick={handleBulkUpload} />
          </div>
        </div>
      </SellerCard>

      {isError ? (
        <SellerErrorState
          message={normalizeApiError(error, 'Unable to load products.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {isLoading ? (
        <SellerLoader label="Loading products..." />
      ) : (
        <SellerCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black tracking-tight text-black">Product List</h2>
            <p className="text-xs font-semibold text-zinc-500">
              {products.length} item(s) {isFetching ? 'updating...' : 'available'}
            </p>
          </div>

          {products.length === 0 ? (
            <p className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-6 text-sm font-semibold text-zinc-500">
              No products found. Add your first product to start selling.
            </p>
          ) : (
            <SellerTable
              headers={['Product', 'Category', 'Price', 'Stock', 'SKU', 'Status', 'Updated', 'Actions']}
            >
              {products.map((product) => (
                <tr key={product._id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="text-sm font-black text-zinc-900">{product.productName}</p>
                    <p className="mt-1 max-w-xs text-xs text-zinc-500">{product.description}</p>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-zinc-700">{product.category}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-zinc-700">
                    <div>{formatCurrency(product.price)}</div>
                    {product.discountPrice != null ? (
                      <div className="text-xs text-emerald-600">Discount: {formatCurrency(product.discountPrice)}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-zinc-700">{product.stockQuantity}</td>
                  <td className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-zinc-600">{product.skuCode}</td>
                  <td className="px-4 py-4">
                    <SellerBadge
                      label={product.status}
                      tone={
                        product.status === 'approved'
                          ? 'success'
                          : product.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                      }
                    />
                  </td>
                  <td className="px-4 py-4 text-xs font-semibold text-zinc-500">{formatDateTime(product.updatedAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <SellerButton
                        label="Edit"
                        tone="secondary"
                        className="px-3 py-2"
                        onClick={() => handleOpenEdit(product)}
                      />
                      <SellerButton
                        label="Delete"
                        tone="danger"
                        className="px-3 py-2"
                        loading={deleting}
                        onClick={() => {
                          void handleDelete(product._id);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </SellerTable>
          )}
        </SellerCard>
      )}

      <SellerModal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          resetForm();
        }}
      >
        <form className="space-y-5" onSubmit={handleSubmitProduct}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SellerInput
              label="Product Name"
              name="productName"
              value={formState.productName}
              onChange={(event) => setFormState((prev) => ({ ...prev, productName: event.target.value }))}
              required
            />
            <SellerInput
              label="Category"
              name="category"
              value={formState.category}
              onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
              required
            />
            <SellerInput
              label="Price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={formState.price}
              onChange={(event) => setFormState((prev) => ({ ...prev, price: event.target.value }))}
              required
            />
            <SellerInput
              label="Discount Price"
              name="discountPrice"
              type="number"
              min="0"
              step="0.01"
              value={formState.discountPrice}
              onChange={(event) => setFormState((prev) => ({ ...prev, discountPrice: event.target.value }))}
            />
            <SellerInput
              label="SKU"
              name="skuCode"
              value={formState.skuCode}
              onChange={(event) => setFormState((prev) => ({ ...prev, skuCode: event.target.value }))}
              required
            />
            <SellerInput
              label="Stock Quantity"
              name="stockQuantity"
              type="number"
              min="0"
              step="1"
              value={formState.stockQuantity}
              onChange={(event) => setFormState((prev) => ({ ...prev, stockQuantity: event.target.value }))}
              required
            />
          </div>

          <SellerTextarea
            label="Description"
            name="description"
            rows={4}
            value={formState.description}
            onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
            required
          />

          <SellerTextarea
            label="Variants"
            name="variantsInput"
            rows={4}
            hint="Format each line as key:value. Example: Size:M"
            value={formState.variantsInput}
            onChange={(event) => setFormState((prev) => ({ ...prev, variantsInput: event.target.value }))}
          />

          <SellerTextarea
            label="Product Image URLs"
            name="imageUrlsInput"
            rows={3}
            hint="Comma-separated image URLs."
            value={formState.imageUrlsInput}
            onChange={(event) => setFormState((prev) => ({ ...prev, imageUrlsInput: event.target.value }))}
          />

          <label className="block space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
              Upload Product Images
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                setImageFiles(files);
              }}
              className="block w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm"
            />
            <p className="text-xs text-zinc-500">Optional. Up to 5 files per request.</p>
          </label>

          {formError ? <SellerErrorState message={formError} /> : null}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <SellerButton
              label="Cancel"
              tone="secondary"
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
            />
            <SellerButton
              label={editingProduct ? 'Save Changes' : 'Create Product'}
              type="submit"
              loading={submitting}
            />
          </div>
        </form>
      </SellerModal>
    </div>
  );
};

export default ProductManagementPage;
