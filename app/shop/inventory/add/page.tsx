'use client';

import React, { useState } from 'react';
import {
    Save,
    ArrowLeft,
    Package,
    Upload,
    DollarSign,
    Layers,
    Truck,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

export default function AddProductPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        supplier: '',
        description: '',
        costPrice: '',
        sellingPrice: '',
        stock: '',
        minStock: '5'
    });

    const CATEGORIES = ['Electronics', 'Food & Beverages', 'Furniture', 'Clothing', 'Beauty'];
    const SUPPLIERS = ['Al-Nur Wholesalers', 'SomFresh Distributors', 'TechWorld Imports', 'Golden Grain Co.'];

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/shop/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    category: formData.category,
                    description: formData.description,
                    costPrice: parseFloat(formData.costPrice),
                    sellingPrice: parseFloat(formData.sellingPrice),
                    stock: parseInt(formData.stock),
                    minStock: parseInt(formData.minStock)
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create product');
            }

            const data = await response.json();

            toast({
                title: 'Success!',
                description: `${formData.name} has been added to inventory.`,
            });

            router.push('/shop/inventory');
        } catch (error: any) {
            console.error('Error creating product:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create product. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-5xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/inventory" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Inventory
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] rounded-xl shadow-lg shadow-green-500/20 text-white">
                            <Package size={28} />
                        </div>
                        Add New Product
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Create a new item in your inventory catalog.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden">

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* LEFT COLUMN: Basic Info */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <Layers size={18} className="text-[#3498DB]" /> Basic Information
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Name *</label>
                            <input
                                type="text"
                                placeholder="e.g. Wireless Headphones"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category *</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => handleChange('category', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all appearance-none cursor-pointer text-gray-700 dark:text-gray-300"
                                    required
                                >
                                    <option value="">Select...</option>
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
                                    <option value="">Select...</option>
                                    {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                            <textarea
                                rows={4}
                                placeholder="Enter product details..."
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all resize-none"
                            ></textarea>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Price & Stock */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <DollarSign size={18} className="text-[#2ECC71]" /> Pricing & Stock
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cost Price *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold text-sm">ETB</div>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.costPrice}
                                        onChange={(e) => handleChange('costPrice', e.target.value)}
                                        className="w-full pl-14 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Selling Price *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold text-sm">ETB</div>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.sellingPrice}
                                        onChange={(e) => handleChange('sellingPrice', e.target.value)}
                                        className="w-full pl-14 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Initial Stock Quantity *</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={formData.stock}
                                onChange={(e) => handleChange('stock', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                required
                            />
                        </div>

                        <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
                            <div className="flex items-start gap-3">
                                <AlertCircle size={20} className="text-[#F39C12] mt-0.5" />
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-2">Low Stock Alert Level</label>
                                    <input
                                        type="number"
                                        value={formData.minStock}
                                        onChange={(e) => handleChange('minStock', e.target.value)}
                                        className="w-24 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 focus:border-[#F39C12] outline-none font-bold text-center"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">We'll notify you when stock falls below this number.</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    <Link href="/shop/inventory" className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-3 rounded-xl bg-[#2ECC71] hover:bg-[#27AE60] text-white font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <><CheckCircle2 size={18} /> Save Product</>
                        )}
                    </button>
                </div>

            </form>

        </div>
    );
}
