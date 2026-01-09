'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Search,
    Plus,
    Truck,
    Download,
    Eye,
    MoreVertical
} from 'lucide-react';
import StatusBadge from '@/components/shop/ui/StatusBadge';

// --- TYPES ---
interface PurchaseOrder {
    id: string;
    poNumber: string;
    supplier: string;
    date: string;
    total: number;
    status: 'Received' | 'Pending' | 'Ordered' | 'Cancelled';
    itemsCount: number;
}

// --- DUMMY DATA ---
const PURCHASES_DATA: PurchaseOrder[] = [
    { id: '1', poNumber: 'PO-2024-001', supplier: 'Al-Nur Wholesalers', date: '2024-01-05', total: 45000, status: 'Received', itemsCount: 15 },
    { id: '2', poNumber: 'PO-2024-002', supplier: 'SomFresh Distributors', date: '2024-01-06', total: 12500, status: 'Ordered', itemsCount: 5 },
    { id: '3', poNumber: 'PO-2024-003', supplier: 'Golden Grain Co.', date: '2024-01-07', total: 82000, status: 'Pending', itemsCount: 40 },
    { id: '4', poNumber: 'PO-2024-004', supplier: 'TechWorld Imports', date: '2024-01-04', total: 15000, status: 'Received', itemsCount: 8 },
    { id: '5', poNumber: 'PO-2024-005', supplier: 'City Beverage Group', date: '2024-01-02', total: 6000, status: 'Cancelled', itemsCount: 12 },
];

export default function PurchasesPage() {
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');

    const filteredData = PURCHASES_DATA.filter(po =>
        (filter === 'All' || po.status === filter) &&
        (po.supplier.toLowerCase().includes(search.toLowerCase()) || po.poNumber.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-[#3498DB]">
                            <Truck size={28} />
                        </div>
                        Purchase Orders
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Manage incoming stock and supplier orders.</p>
                </div>

                <div className="flex gap-3">
                    <button className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                        <Download size={18} /> Export
                    </button>
                    <Link href="/shop/purchases/create" className="px-5 py-2.5 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2">
                        <Plus size={18} /> New Order
                    </Link>
                </div>
            </div>

            {/* FILTER BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit overflow-x-auto">
                    {['All', 'Received', 'Ordered', 'Pending'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filter === tab
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
                        placeholder="Search Supplier or PO#..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all font-medium text-sm"
                    />
                </div>
            </div>

            {/* TABLE CARD */}
            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">PO Number</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Supplier</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Total (ETB)</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredData.map((po) => (
                                <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-bold text-gray-900 dark:text-white text-sm font-mono bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                                            {po.poNumber}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                                                {po.supplier.charAt(0)}
                                            </div>
                                            <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">{po.supplier}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                                        {po.date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-500">
                                        {po.itemsCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-gray-900 dark:text-white">
                                        {po.total.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap flex justify-center">
                                        <StatusBadge status={po.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-gray-400 hover:text-[#3498DB] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                <Eye size={18} />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
