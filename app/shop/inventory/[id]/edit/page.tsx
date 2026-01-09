'use client';

import React, { useState } from 'react';
import {
    Save,
    ArrowLeft,
    Package,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Mock data - replace with actual API call
    const [formData, setFormData] = useState({
        name: 'iPhone 15 Pro Max',
        category: 'Electronics',
        supplier: 'TechWorld Imports',
        description: 'Latest flagship smartphone with advanced camera system.',
        costPrice: 1000,
        sellingPrice: 1200,
        stock: 45,
        minStock: 10
    });

    const CATEGORIES = ['Electronics', 'Food & Beverages', 'Furniture', 'Clothing', 'Beauty'];
    const SUPPLIERS = ['Al-Nur Wholesalers', 'SomFresh Distributors', 'TechWorld Imports', 'Golden Grain Co.'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            alert('Product updated successfully!');
            router.push(`/shop/inventory/${params.id}`);
        }, 1500);
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-5xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href={`/shop/inventory/${params.id}`} className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Product
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#F39C12] to-[#E67E22] rounded-xl shadow-lg shadow-orange-500/20 text-white">
                            <Package size={28} />
                        </div>
                        Edit Product
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Update product information and pricing.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden">

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* LEFT COLUMN */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <Package size={18} className="text-[#3498DB]" /> Basic Information
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => handleChange('category', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all appearance-none cursor-pointer text-gray-700 dark:text-gray-300"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Supplier</label>
                                <select
                                    value={formData.supplier}
                                    onChange={(e) => handleChange('supplier', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all appearance-none cursor-pointer text-gray-700 dark:text-gray-300"
                                >
                                    {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                            <textarea
                                rows={4}
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all resize-none"
                            ></textarea>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <AlertCircle size={18} className="text-[#2ECC71]" /> Pricing & Stock
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cost Price</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold">ETB</div>
                                    <input
                                        type="number"
                                        value={formData.costPrice}
                                        onChange={(e) => handleChange('costPrice', parseFloat(e.target.value))}
                                        className="w-full pl-14 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Selling Price</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold">ETB</div>
                                    <input
                                        type="number"
                                        value={formData.sellingPrice}
                                        onChange={(e) => handleChange('sellingPrice', parseFloat(e.target.value))}
                                        className="w-full pl-14 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Profit Preview */}
                        <div className="p-4 rounded-xl bg-[#2ECC71]/10 border border-[#2ECC71]/20">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Profit Margin</p>
                            <p className="text-2xl font-black text-[#2ECC71]">
                                {((((formData.sellingPrice - formData.costPrice) / formData.sellingPrice) * 100) || 0).toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Profit per unit: <span className="font-bold">ETB {(formData.sellingPrice - formData.costPrice).toLocaleString()}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Stock</label>
                                <input
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => handleChange('stock', parseInt(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Min. Stock Alert</label>
                                <input
                                    type="number"
                                    value={formData.minStock}
                                    onChange={(e) => handleChange('minStock', parseInt(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#F39C12] focus:ring-0 outline-none font-medium transition-all"
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    <Link href={`/shop/inventory/${params.id}`} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-3 rounded-xl bg-[#2ECC71] hover:bg-[#27AE60] text-white font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Updating...' : <><CheckCircle2 size={18} /> Update Product</>}
                    </button>
                </div>

            </form>

        </div>
    );
}
