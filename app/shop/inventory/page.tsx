'use client';

import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Package,
    Download,
    Edit,
    Trash2
} from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/shop/ui/StatusBadge';
import { useToast } from '@/components/ui/use-toast';

// --- TYPES ---
interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    category: string;
    sellingPrice: number;
    stock: number;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    lastUpdated: string;
}

export default function InventoryPage() {
    const [filter, setFilter] = useState<'All' | 'Low Stock' | 'Out of Stock'>('All');
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Fetch products from API
    useEffect(() => {
        fetchProducts();
    }, [filter, search]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filter !== 'All') params.append('status', filter);

            const response = await fetch(`/api/shop/inventory?${params}`);

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast({
                title: 'Error',
                description: 'Failed to load inventory. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const response = await fetch(`/api/shop/inventory/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete product');
            }

            toast({
                title: 'Success',
                description: `${name} has been deleted successfully.`,
            });

            fetchProducts(); // Refresh list
        } catch (error) {
            console.error('Error deleting product:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete product. Please try again.',
                variant: 'destructive'
            });
        }
    };

    const filteredData = products.filter(item => {
        const matchesFilter = filter === 'All' || item.status === filter;
        const matchesSearch = search === '' ||
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.sku.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-[#F39C12]">
                            <Package size={28} />
                        </div>
                        Inventory Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Track stocks, manage pricing, and organize products.</p>
                </div>

                <div className="flex gap-3">
                    <button className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                        <Download size={18} /> Export
                    </button>
                    <Link href="/shop/inventory/add" className="px-5 py-2.5 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2">
                        <Plus size={18} /> Add Product
                    </Link>
                </div>
            </div>

            {/* FILTER BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                    {['All', 'Low Stock', 'Out of Stock'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === tab
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all font-medium text-sm"
                    />
                </div>
            </div>

            {/* TABLE CARD */}
            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3498DB]"></div>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center py-20">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">No products found</p>
                        <Link href="/shop/inventory/add" className="inline-block mt-4 text-[#3498DB] font-bold hover:underline">
                            Add your first product
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Product Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Price (ETB)</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Stock</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link href={`/shop/inventory/${item.id}`} className="block hover:text-[#3498DB] transition-colors">
                                                <span className="block font-bold text-gray-900 dark:text-white text-sm">{item.name}</span>
                                                <span className="text-xs text-gray-400 font-mono">SKU: {item.sku}</span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                                            {item.category}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-gray-900 dark:text-white">
                                            {item.sellingPrice.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`font-bold text-sm ${item.stock < 10 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {item.stock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap flex justify-center">
                                            <StatusBadge status={item.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/shop/inventory/${item.id}/edit`} className="p-2 text-gray-400 hover:text-[#3498DB] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                    <Edit size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
