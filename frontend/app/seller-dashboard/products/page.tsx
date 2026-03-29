'use client';

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { 
  IoGridOutline, 
  IoListOutline, 
  IoSearchOutline, 
  IoDownloadOutline, 
  IoFilterOutline,
  IoEllipsisVertical,
  IoPricetagOutline,
  IoCubeOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoTimeOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoImageOutline,
  IoAddOutline,
  IoCloseOutline
} from 'react-icons/io5';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa6';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
import SellerSelect from '@/components/seller/SellerSelect';
import {
  useBulkUploadProductsMutation,
  useCreateSellerProductMutation,
  useDeleteSellerProductMutation,
  useGetSellerProductsQuery,
  useUpdateSellerProductMutation,
  useUploadProductImagesMutation,
  useGetSellerCouponsQuery,
  type SellerProduct,
  type SellerProductPayload,
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
  variants: { key: string; value: string }[];
  productImages: string[];
}

interface BulkImportMessage {
  row: number;
  column?: string;
  field?: string;
  productName?: string;
  autoValue?: string | number | null;
  message: string;
}

const getInitialFormState = (): ProductFormState => ({
  productName: '',
  description: '',
  category: 'Home Living',
  price: '',
  discountPrice: '',
  skuCode: '',
  stockQuantity: '',
  variants: [{ key: '', value: '' }],
  productImages: [],
});


const ProductManagementPage = () => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null);
  const [formState, setFormState] = useState<ProductFormState>(getInitialFormState());
  const [formError, setFormError] = useState<string | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkWarnings, setBulkWarnings] = useState<BulkImportMessage[]>([]);
  const [bulkErrors, setBulkErrors] = useState<BulkImportMessage[]>([]);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null, null, null]);
  const [selectedCoupon, setSelectedCoupon] = useState<string | null>(null);

  const {
    data: productsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetSellerProductsQuery();

  const { data: couponsResponse } = useGetSellerCouponsQuery();
  const coupons = couponsResponse?.data ?? [];

  const [createProduct, { isLoading: creating }] = useCreateSellerProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateSellerProductMutation();
  const [deleteProduct, { isLoading: deleting }] = useDeleteSellerProductMutation();
  const [uploadImages, { isLoading: uploadingImages }] = useUploadProductImagesMutation();
  const [bulkUpload, { isLoading: bulkUploading }] = useBulkUploadProductsMutation();

  const products = useMemo(() => productsResponse?.data ?? [], [productsResponse?.data]);
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['all', ...Array.from(cats)].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.skuCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const submitting = creating || updating || uploadingImages;

  const resetForm = () => {
    setFormState(getInitialFormState());
    setEditingProduct(null);
    setFormError(null);
    setImageFiles([null, null, null, null, null]);
    setSelectedCoupon(null);
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
      variants: product.variants.length > 0 ? product.variants : [{ key: '', value: '' }],
      productImages: product.productImages,
    });
    setFormError(null);
    setImageFiles([null, null, null, null, null]);
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
      variants: formState.variants.filter(v => v.key.trim() && v.value.trim()),
      skuCode: formState.skuCode.trim(),
      stockQuantity,
      productImages: formState.productImages,
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

      const validImageFiles = imageFiles.filter((f): f is File => f !== null);
      if (validImageFiles.length > 0) {
        await uploadImages({ productId, files: validImageFiles }).unwrap();
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
      const { created, failed, warned = result.warnings?.length ?? 0 } = result.summary;

      setBulkWarnings(result.warnings ?? []);
      setBulkErrors(result.errors ?? []);

      toast.success(`Bulk upload complete. Created: ${created}, Failed: ${failed}, Auto-fixed: ${warned}`);

      if ((result.errors ?? []).length > 0) {
        const firstError = result.errors[0];
        const columnPart = firstError.column ? `, ${firstError.column}` : '';
        const productPart = firstError.productName ? ` (${firstError.productName})` : '';
        toast.error(`Row ${firstError.row}${columnPart}${productPart}: ${firstError.message}`);
      }

      if ((result.warnings ?? []).length > 0) {
        const firstWarning = result.warnings?.[0];
        if (firstWarning) {
          const columnPart = firstWarning.column ? `, ${firstWarning.column}` : '';
          const productPart = firstWarning.productName ? ` (${firstWarning.productName})` : '';
          toast(`Row ${firstWarning.row}${columnPart}${productPart}: ${firstWarning.message}`);
        }
      }

      setBulkFile(null);
    } catch (requestError) {
      setBulkWarnings([]);
      setBulkErrors([]);
      toast.error(normalizeApiError(requestError, 'Bulk upload failed'));
    }
  };

  const handleExportExcel = () => {
    if (filteredProducts.length === 0) {
      toast.error('No products to export');
      return;
    }

    const dataToExport = filteredProducts.map(p => ({
      'Product Name': p.productName,
      'Category': p.category,
      'Price': p.price,
      'Discount Price': p.discountPrice || 'N/A',
      'Stock': p.stockQuantity,
      'SKU': p.skuCode,
      'Status': p.status,
      'Updated': formatDateTime(p.updatedAt)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, `seller_products_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Excel report generated');
  };

  const handleExportPDF = () => {
    if (filteredProducts.length === 0) {
      toast.error('No products to export');
      return;
    }

    const doc = new jsPDF();
    const tableColumn = ['Product', 'Category', 'Price', 'Stock', 'SKU', 'Status'];
    const tableRows = filteredProducts.map(p => [
      p.productName,
      p.category,
      formatCurrency(p.price),
      p.stockQuantity,
      p.skuCode,
      p.status
    ]);

    doc.text('Product Inventory Report', 14, 15);
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

    doc.save(`seller_products_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('PDF report generated');
  };

  return (
    <div className="space-y-8 pb-20">
      <SellerPageHeader
        title="Inventory Manager"
        description="Streamline your product catalog with high-fidelity control and data visibility."
        action={
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 p-1 shadow-inner">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-black text-white shadow-lg' : 'text-zinc-400 hover:text-black'}`}
                >
                  <IoListOutline className="text-xl" />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-black text-white shadow-lg' : 'text-zinc-400 hover:text-black'}`}
                >
                  <IoGridOutline className="text-xl" />
                </button>
             </div>
             <SellerButton label="New Product" onClick={handleOpenCreate} />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Management Tools */}
        <div className="lg:col-span-8 space-y-6">
           <SellerCard className="bg-white/80" noPadding>
              <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-zinc-100/50">
                 <div className="flex-1 p-4 flex items-center gap-3">
                    <IoSearchOutline className="text-zinc-400 text-xl shrink-0" />
                    <input 
                      type="text" 
                      placeholder="Search items by name or SKU..." 
                      className="w-full bg-transparent border-none text-sm font-light focus:ring-0 placeholder:text-zinc-300"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
                 <div className="p-4 flex items-center gap-3">
                    <IoFilterOutline className="text-zinc-400" />
                    <select 
                      className="bg-transparent border-none text-xs font-light focus:ring-0 text-zinc-600 appearance-none pr-8"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                       {categories.map(c => (
                         <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
                       ))}
                    </select>
                 </div>
                  <div className="p-4 flex items-center gap-2 bg-zinc-50/50">
                    <button 
                      onClick={handleExportExcel}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all font-semibold text-xs shadow-sm active:scale-95"
                      title="Export Excel"
                    >
                      <FaFileExcel className="text-lg" />
                      <span>Excel Report</span>
                    </button>
                    <button 
                      onClick={handleExportPDF}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all font-semibold text-xs shadow-sm active:scale-95"
                      title="Export PDF"
                    >
                      <FaFilePdf className="text-lg" />
                      <span>PDF Catalog</span>
                    </button>
                 </div>
              </div>
           </SellerCard>

           {isLoading ? (
             <SellerLoader label="Fetching catalog..." />
           ) : isError ? (
             <SellerErrorState message={normalizeApiError(error, 'Catalog refresh failed.')} onRetry={refetch} />
           ) : filteredProducts.length === 0 ? (
             <SellerCard className="py-20 text-center bg-white/40">
                <div className="max-w-xs mx-auto space-y-4">
                   <div className="h-16 w-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
                      <IoCubeOutline className="text-3xl text-zinc-300" />
                   </div>
                   <p className="text-sm font-light text-zinc-400">No products match your current filters or search query.</p>
                   <SellerButton label="Clear All" tone="secondary" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} />
                </div>
             </SellerCard>
           ) : (
             <>
               {viewMode === 'list' ? (
                 <SellerCard className="bg-white/80 overflow-hidden" noPadding>
                    <SellerTable headers={['Product Details', 'Category', 'Economics', 'Inventory', 'Status', 'Actions']}>
                       {filteredProducts.map((p) => (
                         <tr key={p._id} className="group hover:bg-black/5 transition-colors border-b border-zinc-50/50 last:border-0">
                            <td className="px-6 py-5">
                               <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-2xl bg-zinc-100 border border-zinc-200/50 overflow-hidden shrink-0 flex items-center justify-center">
                                     {p.productImages[0] ? (
                                       <img src={p.productImages[0]} alt="" className="h-full w-full object-cover" />
                                     ) : (
                                       <IoCubeOutline className="text-xl text-zinc-300" />
                                     )}
                                  </div>
                                  <div className="min-w-0">
                                     <p className="text-sm font-light text-black truncate">{p.productName}</p>
                                     <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{p.skuCode}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-5">
                               <span className="text-xs font-light text-zinc-500 bg-zinc-100/50 px-3 py-1 rounded-full">{p.category}</span>
                            </td>
                            <td className="px-6 py-5">
                               <p className="text-sm font-light text-black">{formatCurrency(p.price)}</p>
                               {p.discountPrice && (
                                 <p className="text-[10px] text-rose-400 font-light mt-0.5">-{formatCurrency(p.discountPrice)}</p>
                               )}
                            </td>
                            <td className="px-6 py-5">
                               <div className="flex items-center gap-2">
                                  <div className={`h-1.5 w-1.5 rounded-full ${p.stockQuantity > 10 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                  <span className="text-xs font-light text-zinc-600">{p.stockQuantity} in stock</span>
                               </div>
                            </td>
                            <td className="px-6 py-5">
                               <SellerBadge 
                                 label={p.status} 
                                 tone={p.status === 'approved' ? 'success' : p.status === 'rejected' ? 'danger' : 'warning'} 
                               />
                            </td>
                            <td className="px-6 py-5 text-right">
                               <div className="flex items-center justify-end gap-2 transition-opacity">
                                  <button 
                                    onClick={() => handleOpenEdit(p)} 
                                    className="p-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all text-indigo-500"
                                    title="Edit Product"
                                  >
                                     <IoCreateOutline className="text-lg" />
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(p._id)} 
                                    className="p-2 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all text-rose-500"
                                    title="Delete Product"
                                  >
                                     <IoTrashOutline className="text-lg" />
                                  </button>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </SellerTable>
                 </SellerCard>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredProducts.map((p) => (
                      <div key={p._id} className="group relative glass bg-white/80 rounded-[2.5rem] border border-white/60 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1">
                         <div className="absolute top-6 right-6 z-10">
                            <SellerBadge 
                              label={p.status} 
                              tone={p.status === 'approved' ? 'success' : p.status === 'rejected' ? 'danger' : 'warning'} 
                            />
                         </div>
                         <div className="flex items-start gap-5">
                            <div className="h-28 w-28 rounded-3xl bg-zinc-50 border border-zinc-100 overflow-hidden shrink-0 flex items-center justify-center">
                               {p.productImages[0] ? (
                                 <img src={p.productImages[0]} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                               ) : (
                                 <IoCubeOutline className="text-4xl text-zinc-200" />
                               )}
                            </div>
                            <div className="min-w-0 flex-1">
                               <p className="text-[10px] font-black tracking-[0.2em] text-brand-purple uppercase mb-1">{p.category}</p>
                               <h3 className="text-lg font-light text-black truncate leading-tight mb-2">{p.productName}</h3>
                               <div className="flex items-baseline gap-2">
                                  <span className="text-xl font-light text-black">{formatCurrency(p.price)}</span>
                                  {p.discountPrice && (
                                    <span className="text-xs text-rose-400 line-through font-light opacity-60">{formatCurrency(p.price + p.discountPrice)}</span>
                                  )}
                               </div>
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-4 mt-8 pb-6 border-b border-zinc-100/50">
                            <div className="space-y-1">
                               <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Inventory</p>
                               <p className={`text-xs font-light ${p.stockQuantity < 5 ? 'text-rose-500' : 'text-zinc-600'}`}>{p.stockQuantity} Units</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Identifier</p>
                               <p className="text-xs font-light text-zinc-600 truncate">{p.skuCode}</p>
                            </div>
                         </div>
                         
                         <div className="flex items-center justify-between pt-6">
                            <p className="text-[9px] font-light text-zinc-400 flex items-center gap-1">
                               <IoTimeOutline /> {formatDateTime(p.updatedAt).split(',')[0]}
                            </p>
                            <div className="flex items-center gap-2">
                               <button 
                                 onClick={() => handleOpenEdit(p)}
                                 className="h-10 w-10 flex items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 hover:bg-indigo-100 transition-all shadow-sm"
                                 title="Edit Product"
                               >
                                  <IoCreateOutline className="text-xl" />
                                </button>
                               <button 
                                 onClick={() => handleDelete(p._id)}
                                 className="h-10 w-10 flex items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-100 transition-all shadow-sm"
                                 title="Delete Product"
                               >
                                  <IoTrashOutline className="text-xl" />
                               </button>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
             </>
           )}
        </div>

        {/* Bulk Actions Panel */}
        <div className="lg:col-span-4 space-y-6">
           <SellerCard className="bg-brand-purple/5 border-brand-purple/10">
              <div className="space-y-6">
                 <div>
                    <h3 className="text-lg font-light text-black">Streamline Uploads</h3>
                    <p className="text-xs font-light text-zinc-500 mt-1 leading-relaxed">
                       Scale your operations by importing catalog data directly from Excel templates.
                    </p>
                 </div>
                 
                 <div className="relative group">
                    <input
                      type="file"
                      id="bulk-upload"
                      accept=".xlsx,.xls"
                      onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <label 
                      htmlFor="bulk-upload"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-4xl p-10 bg-white/50 hover:bg-white hover:border-brand-purple/40 transition-all cursor-pointer text-center"
                    >
                       <div className="h-14 w-14 bg-brand-purple/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <IoDownloadOutline className="text-2xl text-brand-purple rotate-180" />
                       </div>
                       <p className="text-sm font-light text-zinc-800">{bulkFile ? bulkFile.name : 'Select Catalog File'}</p>
                       <p className="text-[10px] text-zinc-400 mt-2 uppercase tracking-widest font-bold">XLSX, XLS supported</p>
                    </label>
                 </div>

                 <SellerButton 
                   label="Execute Import" 
                   className="w-full h-14" 
                   loading={bulkUploading} 
                   onClick={handleBulkUpload}
                   disabled={!bulkFile}
                 />

                 {(bulkWarnings.length > 0 || bulkErrors.length > 0) && (
                   <div className="space-y-4 pt-4 border-t border-brand-purple/10">
                      {bulkErrors.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-rose-500">
                            <IoAlertCircleOutline className="mt-0.5" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">{bulkErrors.length} Crucial Faults</p>
                          </div>
                          <div className="max-h-32 space-y-1 overflow-y-auto rounded-2xl border border-rose-100 bg-rose-50/50 p-3">
                            {bulkErrors.slice(0, 6).map((issue, index) => (
                              <p key={`bulk-error-${issue.row}-${issue.column ?? 'na'}-${index}`} className="text-[10px] font-semibold leading-relaxed text-rose-700">
                                Row {issue.row}
                                {issue.column ? `, ${issue.column}` : ''}
                                {issue.productName ? `, ${issue.productName}` : ''}: {issue.message}
                              </p>
                            ))}
                            {bulkErrors.length > 6 ? (
                              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">
                                +{bulkErrors.length - 6} more errors
                              </p>
                            ) : null}
                          </div>
                        </div>
                      )}
                      {bulkWarnings.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-amber-500">
                            <IoCheckmarkCircleOutline className="mt-0.5" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">{bulkWarnings.length} Logic Adjustments</p>
                          </div>
                          <div className="max-h-32 space-y-1 overflow-y-auto rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
                            {bulkWarnings.slice(0, 6).map((issue, index) => (
                              <p key={`bulk-warning-${issue.row}-${issue.column ?? 'na'}-${index}`} className="text-[10px] font-semibold leading-relaxed text-amber-700">
                                Row {issue.row}
                                {issue.column ? `, ${issue.column}` : ''}
                                {issue.productName ? `, ${issue.productName}` : ''}: {issue.message}
                              </p>
                            ))}
                            {bulkWarnings.length > 6 ? (
                              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                                +{bulkWarnings.length - 6} more adjustments
                              </p>
                            ) : null}
                          </div>
                        </div>
                      )}
                   </div>
                 )}
              </div>
           </SellerCard>

           <SellerCard className="bg-indigo-50/20 border-indigo-100/50">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">Quick Stats</h4>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-light text-zinc-500">Total Valuation</span>
                    <span className="text-sm font-light text-black">
                       {formatCurrency(products.reduce((acc, p) => acc + (p.price * p.stockQuantity), 0))}
                    </span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-light text-zinc-500">Active Categories</span>
                    <span className="text-sm font-light text-black">{categories.length - 1}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-light text-zinc-500">Approval Rate</span>
                    <span className="text-sm font-light text-black">
                       {Math.round((products.filter(p => p.status === 'approved').length / (products.length || 1)) * 100)}%
                    </span>
                 </div>
              </div>
           </SellerCard>
        </div>
      </div>

      <SellerModal
        title={editingProduct ? 'Refine Product' : 'Initialize Product'}
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          resetForm();
        }}
      >
        <form className="space-y-5" onSubmit={handleSubmitProduct}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SellerInput
              label="Standard Name"
              name="productName"
              value={formState.productName}
              onChange={(event) => setFormState((prev) => ({ ...prev, productName: event.target.value }))}
              required
            />
            <SellerSelect
              label="Taxonomy Category"
              name="category"
              value={formState.category}
              onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
              options={[
                { value: 'Home Living', label: 'Home Living' },
                { value: 'Accessories', label: 'Accessories' },
                { value: 'Bags', label: 'Bags' },
                { value: 'Electronics', label: 'Electronics' },
                { value: 'Others', label: 'Others' },
              ]}
              required
            />
            <SellerInput
              label="Base Valuation"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={formState.price}
              onChange={(event) => setFormState((prev) => ({ ...prev, price: event.target.value }))}
              required
            />
            <SellerInput
              label="Active Discount"
              name="discountPrice"
              type="number"
              min="0"
              step="0.01"
              value={formState.discountPrice}
              onChange={(event) => setFormState((prev) => ({ ...prev, discountPrice: event.target.value }))}
            />
            <SellerInput
              label="Primary SKU Code"
              name="skuCode"
              value={formState.skuCode}
              onChange={(event) => setFormState((prev) => ({ ...prev, skuCode: event.target.value }))}
              required
            />
            <SellerInput
              label="Units in Reserve"
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
            label="Narrative Description"
            name="description"
            rows={4}
            value={formState.description}
            onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
            required
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Additions</span>
              <button 
                type="button" 
                onClick={() => setFormState(prev => ({ ...prev, variants: [...prev.variants, { key: '', value: '' }] }))}
                className="flex items-center gap-1 text-[10px] font-bold text-brand-purple hover:underline"
              >
                <IoAddOutline /> Add Additions
              </button>
            </div>
            
            <div className="space-y-3">
              {formState.variants.map((variant, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <input 
                      placeholder="Key (e.g. Size)" 
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 focus:ring-black/10 transition-all font-light"
                      value={variant.key}
                      onChange={(e) => {
                        const newVariants = [...formState.variants];
                        newVariants[index].key = e.target.value;
                        setFormState(prev => ({ ...prev, variants: newVariants }));
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      placeholder="Value (e.g. XL)" 
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 focus:ring-black/10 transition-all font-light"
                      value={variant.value}
                      onChange={(e) => {
                        const newVariants = [...formState.variants];
                        newVariants[index].value = e.target.value;
                        setFormState(prev => ({ ...prev, variants: newVariants }));
                      }}
                    />
                  </div>
                  {formState.variants.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => setFormState(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }))}
                      className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <IoCloseOutline />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
             <span className="block text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
                Visual Assets (Up to 5)
             </span>
             <div className="grid grid-cols-5 gap-4">
               {['Cover', '2nd', '3rd', '4th', '5th'].map((label, index) => {
                 const imageUrl = formState.productImages[index];
                 const file = imageFiles[index];
                 const previewUrl = file ? URL.createObjectURL(file) : imageUrl;

                 return (
                   <div key={label} className="space-y-2">
                     <div className="relative aspect-square rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden group">
                       {previewUrl ? (
                         <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                       ) : (
                         <IoImageOutline className="text-xl text-zinc-300" />
                       )}
                       <input
                         type="file"
                         accept="image/*"
                         className="absolute inset-0 opacity-0 cursor-pointer z-10"
                         onChange={(e) => {
                           const newFiles = [...imageFiles];
                           newFiles[index] = e.target.files?.[0] || null;
                           setImageFiles(newFiles);
                         }}
                       />
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[8px] text-white font-bold uppercase tracking-widest">Change</span>
                       </div>
                     </div>
                     <p className="text-[8px] text-center font-black text-zinc-400 uppercase tracking-widest">{label}</p>
                   </div>
                 );
               })}
             </div>
          </div>

          <div className="space-y-4">
            <span className="block text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Available Coupons</span>
            {coupons.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No coupons created yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {coupons.map((coupon) => (
                  <button
                    key={coupon._id}
                    type="button"
                    onClick={() => {
                      setSelectedCoupon(coupon._id);
                      toast.success(`Coupon ${coupon.code} applied!`);
                    }}
                    className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${
                      selectedCoupon === coupon._id 
                        ? 'bg-black border-black text-white' 
                        : 'border-zinc-100 text-zinc-500 hover:border-zinc-300'
                    }`}
                  >
                    {coupon.code} ({coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`})
                  </button>
                ))}
              </div>
            )}
          </div>

          {formError ? <SellerErrorState message={formError} /> : null}

          <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-zinc-100">
            <SellerButton
              label="Discard"
              tone="secondary"
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
            />
            <SellerButton
              label={editingProduct ? 'Update Inventory' : 'Finalize Creation'}
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
