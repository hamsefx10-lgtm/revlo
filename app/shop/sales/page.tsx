'use client';

import React, { useState } from 'react';
import {
    Search,
    Calendar,
    Download,
    Eye,
    RotateCcw,
    Printer,
    ArrowUpRight
} from 'lucide-react';
import StatusBadge from '@/components/shop/ui/StatusBadge';

// --- TYPES ---
interface SaleRecord {
    id: string;
    receiptNo: string;
    customer: string;
    date: string;
    amount: number;
    method: 'Cash' | 'E-Dahab' | 'Card';
    status: 'Completed' | 'Refunded' | 'Pending';
    itemsCount: number;
}

// --- DUMMY DATA ---
const SALES_DATA: SaleRecord[] = [
    { id: '1', receiptNo: 'RCP-1024', customer: 'Walk-in Customer', date: '2024-01-07 10:30 AM', amount: 1250, method: 'Cash', status: 'Completed', itemsCount: 3 },
    { id: '2', receiptNo: 'RCP-1023', customer: 'Ahmed Ali', date: '2024-01-07 09:15 AM', amount: 4500, method: 'E-Dahab', status: 'Completed', itemsCount: 8 },
    { id: '3', receiptNo: 'RCP-1022', customer: 'Walk-in Customer', date: '2024-01-06 04:45 PM', amount: 320, method: 'Cash', status: 'Refunded', itemsCount: 1 },
    { id: '4', receiptNo: 'RCP-1021', customer: 'Fatima Nur', date: '2024-01-06 02:20 PM', amount: 12000, method: 'E-Dahab', status: 'Completed', itemsCount: 15 },
    { id: '5', receiptNo: 'RCP-1020', customer: 'Walk-in Customer', date: '2024-01-06 11:00 AM', amount: 850, method: 'Cash', status: 'Completed', itemsCount: 2 },
    { id: '6', receiptNo: 'INV-2024-001', customer: 'Hassan Jibril', date: '2024-01-05 05:30 PM', amount: 25000, method: 'Check', status: 'Pending', itemsCount: 1 },
];

export default function SalesHistoryPage() {
    const [dateRange, setDateRange] = useState('Today');
    const [search, setSearch] = useState('');

    const filteredData = SALES_DATA.filter(sale =>
        sale.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
        sale.customer.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-[#2ECC71]">
                            <ArrowUpRight size={28} />
                        </div>
                        Sales History
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">View and manage past transactions.</p>
                </div>

                <div className="flex gap-3">
                    <button className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                        <Download size={18} /> Export Report
                    </button>
                </div>
            </div>

            {/* CONTROLS BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                {/* Date Filters */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    {['Today', 'Yesterday', 'This Week', 'This Month'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${dateRange === range
                                ? 'bg-[#3498DB]/10 text-[#3498DB]'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <Calendar size={16} />
                    </button>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Receipt # or Customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all font-medium text-sm shadow-sm"
                    />
                </div>
            </div>

            {/* TABLE CARD */}
            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Receipt No</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Total (ETB)</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredData.map((sale) => (
                                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-bold text-gray-900 dark:text-white text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                            {sale.receiptNo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                                        {sale.date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700 dark:text-gray-300">
                                        {sale.customer}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-500">
                                        {sale.itemsCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-gray-900 dark:text-white">
                                        {sale.amount.toLocaleString()}
                                        <div className="text-[10px] text-gray-400 font-normal uppercase">{sale.method}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap flex justify-center">
                                        <StatusBadge status={sale.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-gray-400 hover:text-[#3498DB] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="View Details">
                                                <Eye size={18} />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Print Receipt">
                                                <Printer size={18} />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Issue Refund">
                                                <RotateCcw size={18} />
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
