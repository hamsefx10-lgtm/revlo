'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, ShoppingCart, Calendar, FileText, CheckSquare, Search } from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function RecordPurchasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    materialName: '',
    quantity: 1,
    unit: 'pcs',
    unitPrice: 0,
    totalPrice: 0,
    vendorId: '',
    purchaseDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    invoiceNumber: '',
    notes: '',
    updateInventory: true
  });

  useEffect(() => {
    // Fetch Vendors
    fetch('/api/manufacturing/vendors')
      .then(res => res.json())
      .then(data => setVendors(data.vendors || []))
      .catch(err => console.error(err));
  }, []);

  // Auto-calculate Total
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      totalPrice: prev.quantity * prev.unitPrice
    }));
  }, [formData.quantity, formData.unitPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.materialName) {
      setToast({ message: 'Enter material name', type: 'error' });
      setLoading(false);
      return;
    }
    if (!formData.vendorId) {
      setToast({ message: 'Select a vendor', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/manufacturing/material-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to record purchase');

      setToast({ message: 'Purchase recorded!', type: 'success' });
      setTimeout(() => router.push('/manufacturing/material-purchases'), 1000);

    } catch (error) {
      setToast({ message: 'Error recording purchase.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/manufacturing/material-purchases" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Record Purchase</h1>
          <p className="text-sm font-medium text-gray-500">Add new raw material purchase expense</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-8">

          {/* Material Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Purchase Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Material Name *</label>
                <input
                  type="text"
                  required
                  value={formData.materialName}
                  onChange={(e) => handleInputChange('materialName', e.target.value)}
                  placeholder="e.g. Oak Wood"
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Allows free text or matches existing inventory.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Vendor *</label>
                <select
                  value={formData.vendorId}
                  onChange={(e) => handleInputChange('vendorId', e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Select Vendor...</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <div className="text-right mt-1">
                  <Link href="/shop/vendors/add" className="text-[10px] font-bold text-emerald-500 hover:underline">+ New Vendor</Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value))}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="pcs">pcs</option>
                  <option value="kg">kg</option>
                  <option value="l">l</option>
                  <option value="m">m</option>
                  <option value="box">Box</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Unit Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value))}
                    className="w-full pl-8 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl flex justify-between items-center border border-gray-100 dark:border-gray-700">
              <span className="font-bold text-gray-500">Total Amount</span>
              <span className="text-2xl font-black text-gray-900 dark:text-white">${formData.totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Invoice & Dates */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Invoice / Ref #</label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  placeholder="INV-001"
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 p-4 border border-emerald-100 bg-emerald-50/50 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.updateInventory}
                  onChange={(e) => handleInputChange('updateInventory', e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <div>
                  <span className="block font-bold text-gray-900">Update Inventory Stock</span>
                  <span className="block text-xs text-gray-500">Automatically add this quantity to your inventory levels.</span>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional details..."
                className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[100px]"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              Save Purchase
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}