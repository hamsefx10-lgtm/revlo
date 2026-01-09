'use client';

import React, { useState } from 'react';
import {
    ArrowLeft,
    Package,
    Edit,
    Trash2,
    TrendingUp,
    Calendar,
    DollarSign,
    Layers,
    AlertCircle,
    History
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import StatusBadge from '@/components/shop/ui/StatusBadge';

// Mock data - replace with actual API call
const PRODUCT_DETAILS = {
    id: '1',
    name: 'iPhone 15 Pro Max',
    sku: 'ELE-001',
    category: 'Electronics',
    supplier: 'TechWorld Imports',
    description: 'Latest flagship smartphone with advanced camera system and A17 Pro chip.',
    costPrice: 1000,
    sellingPrice: 1200,
    stock: 45,
    minStock: 10,
    status: 'In Stock' as const,
    lastRestocked: '2024-01-05',
    createdAt: '2023-12-01',
    image: '/placeholder-product.jpg'
};

const STOCK_HISTORY = [
    { date: '2024-01-05', type: 'Restock', quantity: 50, note: 'Purchase Order #PO-001' },
    { date: '2024-01-03', type: 'Sale', quantity: -5, note: 'Daily Sales' },
    { date: '2023-12-28', type: 'Restock', quantity: 30, note: 'Purchase Order #PO-002' },
];

export default function ProductDetailsPage() {
    const params = useParams();
    const [isEditing, setIsEditing] = useState(false);

    const profit = PRODUCT_DETAILS.sellingPrice - PRODUCT_DETAILS.costPrice;
    const profitMargin = ((profit / PRODUCT_DETAILS.sellingPrice) * 100).toFixed(1);

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-7xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/inventory" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Inventory
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#3498DB] to-[#2980B9] rounded-xl shadow-lg shadow-blue-500/20 text-white">
                            <Package size={28} />
                        </div>
                        Product Details
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">View and manage product information.</p>
                </div>

                <div className="flex gap-3">
                    <Link href={`/shop/inventory/${params.id}/edit`} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                        <Edit size={18} /> Edit Product
                    </Link>
                    <button className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2">
                        <Trash2 size={18} /> Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: Product Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Main Info Card */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                        <div className="flex gap-8">
                            {/* Product Image */}
                            <div className="w-48 h-48 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-700">
                                <Package size={64} className="text-gray-300" />
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{PRODUCT_DETAILS.name}</h2>
                                        <p className="text-sm text-gray-500 font-mono">SKU: {PRODUCT_DETAILS.sku}</p>
                                    </div>
                                    <StatusBadge status={PRODUCT_DETAILS.status} />
                                </div>

                                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{PRODUCT_DETAILS.description}</p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Category</p>
                                        <p className="font-bold text-gray-900 dark:text-white">{PRODUCT_DETAILS.category}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Supplier</p>
                                        <p className="font-bold text-gray-900 dark:text-white">{PRODUCT_DETAILS.supplier}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stock History */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <History size={20} className="text-[#3498DB]" /> Stock Movement History
                        </h3>

                        <div className="space-y-3">
                            {STOCK_HISTORY.map((entry, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${entry.type === 'Restock' ? 'bg-[#2ECC71]/10 text-[#2ECC71]' : 'bg-red-500/10 text-red-500'}`}>
                                            {entry.type === 'Restock' ? <TrendingUp size={18} /> : <TrendingUp size={18} className="rotate-180" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{entry.type}</p>
                                            <p className="text-xs text-gray-500">{entry.note}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-lg ${entry.quantity > 0 ? 'text-[#2ECC71]' : 'text-red-500'}`}>
                                            {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                                        </p>
                                        <p className="text-xs text-gray-400">{entry.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Stats & Metrics */}
                <div className="space-y-6">

                    {/* Pricing Card */}
                    <div className="bg-gradient-to-br from-[#2ECC71] to-[#27AE60] p-6 rounded-[2rem] shadow-xl shadow-green-500/20 text-white relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-2">Selling Price</p>
                            <h2 className="text-4xl font-black mb-4">ETB {PRODUCT_DETAILS.sellingPrice.toLocaleString()}</h2>
                            <div className="flex items-center justify-between pt-4 border-t border-white/20">
                                <span className="text-sm text-green-100">Cost Price</span>
                                <span className="font-bold">ETB {PRODUCT_DETAILS.costPrice.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Profit Margin */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-[#F39C12]/10 text-[#F39C12]">
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Profit Margin</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{profitMargin}%</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">Profit per unit: <span className="font-bold text-[#2ECC71]">ETB {profit}</span></p>
                    </div>

                    {/* Stock Level */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-[#3498DB]/10 text-[#3498DB]">
                                <Layers size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Current Stock</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{PRODUCT_DETAILS.stock} units</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <AlertCircle size={14} className="text-[#F39C12]" />
                            <span className="text-gray-500">Min. stock level: <span className="font-bold">{PRODUCT_DETAILS.minStock}</span></span>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Last Restocked</span>
                            <span className="font-bold text-gray-900 dark:text-white text-sm">{PRODUCT_DETAILS.lastRestocked}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Created On</span>
                            <span className="font-bold text-gray-900 dark:text-white text-sm">{PRODUCT_DETAILS.createdAt}</span>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}
