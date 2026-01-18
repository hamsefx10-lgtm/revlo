'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Plus, Search, Filter, Calendar, List, ChevronRight,
    Eye, Edit, Trash2, ArrowLeft, Download, SlidersHorizontal
} from 'lucide-react';

export default function ProductionOrdersListPage() {
    // Mock Data (Matches Dashboard for consistency)
    const orders = [
        { id: '101', product: 'Modern Sofa Set', qty: 50, due: '2024-01-24', priority: 'Normal', status: 'Planned', customer: 'HomeDepot' },
        { id: '102', product: 'Office Desk', qty: 12, due: '2024-01-27', priority: 'High', status: 'Planned', customer: 'TechCorp' },
        { id: '103', product: 'Dining Table', qty: 5, due: '2024-01-22', priority: 'High', status: 'Cutting', customer: 'Individual' },
        { id: '104', product: 'Office Chair', qty: 100, due: '2024-01-23', priority: 'Normal', status: 'Assembly', customer: 'TechCorp' },
        { id: '105', product: 'Bookshelf', qty: 20, due: '2024-01-24', priority: 'Normal', status: 'Assembly', customer: 'Library' },
        { id: '106', product: 'Coffee Table', qty: 30, due: '2024-01-21', priority: 'High', status: 'Finishing', customer: 'Cafe One' },
        { id: '107', product: 'Bed Frame', qty: 10, due: '2024-01-20', priority: 'High', status: 'QC', customer: 'Hotel Lux' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Planned': return 'bg-blue-100 text-blue-700';
            case 'Cutting': return 'bg-purple-100 text-purple-700';
            case 'Assembly': return 'bg-orange-100 text-orange-700';
            case 'Finishing': return 'bg-teal-100 text-teal-700';
            case 'QC': return 'bg-red-100 text-red-700';
            case 'Completed': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="flex flex-col gap-6 p-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/manufacturing" className="text-gray-400 hover:text-blue-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                            <ArrowLeft size={14} /> Returns to Dashboard
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Production Orders</h1>
                    <p className="text-sm text-gray-500">Full history and management of all manufacturing orders.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                        <Download size={18} /> Export
                    </button>
                    <Link href="/manufacturing/production-orders/add" className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                        <Plus size={18} /> New Request
                    </Link>
                </div>
            </div>

            {/* Filters Panel */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search by Order ID, Product, or Customer..." className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap">
                        <Filter size={16} /> Status: All
                    </button>
                    <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap">
                        <Calendar size={16} /> Date: This Month
                    </button>
                    <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap">
                        <SlidersHorizontal size={16} /> Priority
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="p-4 rounded-tl-2xl">Order No.</th>
                                <th className="p-4">Product Details</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Stage</th>
                                <th className="p-4 text-center">Qty</th>
                                <th className="p-4">Deadline</th>
                                <th className="p-4 text-center rounded-tr-2xl">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 group transition-colors">
                                    <td className="p-4 font-mono text-xs font-bold text-blue-600">
                                        #{order.id}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{order.product}</div>
                                        {order.priority === 'High' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">High Priority</span>}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                        {order.customer}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center font-bold text-gray-900 dark:text-white">
                                        {order.qty}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(order.due).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Eye size={16} /></button>
                                            <button className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100"><Edit size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Mock */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm text-gray-500">
                    <span>Showing 1-7 of 1.2k orders</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
