'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Package, Tag, Grip } from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function AddInventoryItemPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: 'Raw Materials',
        unit: 'pcs',
        inStock: 0,
        minStock: 10,
        purchasePrice: 0,
        sellingPrice: 0,
        location: '',
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.name) {
            setToast({ message: 'Please enter a name.', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/manufacturing/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to create item');

            setToast({ message: 'Item added successfully!', type: 'success' });
            setTimeout(() => router.push('/manufacturing/inventory'), 1000);

        } catch (error) {
            setToast({ message: 'Error adding item.', type: 'error' });
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
                <Link href="/manufacturing/inventory" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Add Inventory Item</h1>
                    <p className="text-sm font-medium text-gray-500">Register new raw material or product</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-8">

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Item Details</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Item Name *</label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="e.g. PET Resin"
                                        className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">SKU / Code</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.sku}
                                        onChange={(e) => handleInputChange('sku', e.target.value)}
                                        placeholder="e.g. RAW-001"
                                        className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
                                <div className="relative">
                                    <Grip className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <select
                                        value={formData.category}
                                        onChange={(e) => handleInputChange('category', e.target.value)}
                                        className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                    >
                                        <option>Raw Materials</option>
                                        <option>Finished Goods</option>
                                        <option>Packaging</option>
                                        <option>Spare Parts</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Unit of Measure</label>
                                <select
                                    value={formData.unit}
                                    onChange={(e) => handleInputChange('unit', e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="pcs">Pieces (pcs)</option>
                                    <option value="kg">Kilograms (kg)</option>
                                    <option value="l">Liters (l)</option>
                                    <option value="m">Meters (m)</option>
                                    <option value="box">Box</option>
                                    <option value="roll">Roll</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Stock & Pricing */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Stock & Value</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Initial Stock</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.inStock}
                                    onChange={(e) => handleInputChange('inStock', parseFloat(e.target.value))}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Min. Stock Level</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.minStock}
                                    onChange={(e) => handleInputChange('minStock', parseFloat(e.target.value))}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cost Price (per unit)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.purchasePrice}
                                    onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value))}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Selling Price (Optional)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.sellingPrice}
                                    onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value))}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Storage Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                placeholder="e.g. Warehouse A, Shelf 4"
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 bg-gray-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-black flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            Save Item
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
