'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search, Plus, Filter, Package, AlertTriangle, TrendingDown,
    ArrowUpRight, ArrowDownLeft, History, Loader2, DollarSign
} from 'lucide-react';

interface InventoryItem {
    id: string;
    name: string;
    sku?: string;
    category: string;
    inStock: number;
    unit: string;
    minStock: number;
    purchasePrice: number;
    sellingPrice?: number;
    location?: string;
}

export default function FactoryInventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (selectedCategory && selectedCategory !== 'All Categories') params.append('category', selectedCategory);

            const res = await fetch(`/api/manufacturing/inventory?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timeout = setTimeout(() => {
            fetchInventory();
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm, selectedCategory]);

    // Derived Stats
    const totalItems = items.length;
    const totalValue = items.reduce((acc, item) => acc + (item.inStock * item.purchasePrice), 0);
    const lowStockItems = items.filter(item => item.inStock <= item.minStock).length;

    // Determine status
    const getStatus = (item: InventoryItem) => {
        if (item.inStock === 0) return 'Critical';
        if (item.inStock <= item.minStock) return 'Low';
        return 'Good';
    };

    return (
        <div className="flex flex-col gap-6 p-2 h-full">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="text-orange-500" /> Factory Inventory
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage raw materials and tracked stock.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/manufacturing/inventory/add" className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                        <Plus size={18} /> Add Material
                    </Link>
                </div>
            </div>

            {/* OVERVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600"><Package size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Total Items</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{loading ? '-' : totalItems}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600"><DollarSign size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Stock Value</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{loading ? '-' : `$${totalValue.toLocaleString()}`}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-red-100 dark:border-red-900/20 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-6 opacity-5"><AlertTriangle size={80} /></div>
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 relative z-10"><AlertTriangle size={24} /></div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-gray-400 uppercase">Alerts</p>
                        <p className="text-2xl font-black text-red-600">{loading ? '-' : `${lowStockItems} Low Stock`}</p>
                    </div>
                </div>
            </div>

            {/* INVENTORY TABLE */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1 flex flex-col">
                {/* Table Filters */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative flex-1 md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, SKU..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold border-none outline-none"
                        >
                            <option>All Categories</option>
                            <option>Raw Materials</option>
                            <option>Finished Goods</option>
                            <option>Packaging</option>
                            <option>Spare Parts</option>
                        </select>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-gray-400 gap-2">
                            <Loader2 className="animate-spin" /> Loading inventory...
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col h-full items-center justify-center text-gray-400 gap-4 mt-10 mb-10">
                            <Package size={48} className="opacity-20" />
                            <p>No inventory items found.</p>
                            <Link href="/manufacturing/inventory/add" className="text-blue-500 font-bold hover:underline">Add First Item</Link>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="p-4">Material Name</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Stock Level</th>
                                    <th className="p-4">Unit Cost</th>
                                    <th className="p-4">Value</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {items.map((item) => {
                                    const status = getStatus(item);
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 group transition-colors">
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 dark:text-gray-100">{item.name}</span>
                                                    {item.sku && <span className="text-xs text-blue-500 font-mono mt-0.5">{item.sku}</span>}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 dark:text-gray-100">{item.inStock}</span>
                                                    <span className="text-xs text-gray-500">{item.unit}</span>
                                                </div>
                                                <div className="w-24 h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                                    <div className={`h-full rounded-full ${status === 'Critical' ? 'bg-red-500' :
                                                        status === 'Low' ? 'bg-orange-500' : 'bg-green-500'
                                                        }`} style={{ width: `${Math.min(100, (item.inStock / (item.minStock * 2 || 1)) * 100)}%` }}></div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 dark:text-gray-400">${item.purchasePrice.toFixed(2)}</td>
                                            <td className="p-4 text-sm font-bold text-gray-900 dark:text-gray-100">${(item.inStock * item.purchasePrice).toFixed(2)}</td>
                                            <td className="p-4">
                                                {status === 'Critical' && (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg w-fit">
                                                        <AlertTriangle size={12} /> Out of Stock
                                                    </span>
                                                )}
                                                {status === 'Low' && (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg w-fit">
                                                        <TrendingDown size={12} /> Low Stock
                                                    </span>
                                                )}
                                                {status === 'Good' && (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg w-fit">
                                                        Good
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><History size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
}
