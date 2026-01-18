'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus, Search, Filter, CreditCard, DollarSign,
    PieChart, Calendar, MoreVertical, Flag, Truck, FileText, Loader2, RefreshCcw
} from 'lucide-react';

export default function FactorySalesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [salesOrders, setSalesOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/manufacturing/sales');
            if (res.ok) {
                const data = await res.json();
                setSalesOrders(data.orders || []);
            }
        } catch (e) {
            console.error("Failed to load sales", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    const totalRevenue = salesOrders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = salesOrders.filter(o => o.status !== 'Completed').length;
    const filteredOrders = salesOrders.filter(o =>
        o.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Sales Orders</h1>
                    <p className="text-sm text-gray-500 font-medium">Manage customer orders and invoicing.</p>
                </div>
                <Link href="/manufacturing/sales/add" className="px-5 py-2.5 bg-[#3498DB] hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all hover:-translate-y-0.5">
                    <Plus size={18} /> New Order
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                            {loading ? '-' : `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-[#3498DB] rounded-xl">
                        <Truck size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Delivery</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                            {loading ? '-' : pendingOrders}
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Orders Count</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                            {loading ? '-' : salesOrders.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col min-h-[400px]">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search orders, customers..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3498DB] outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchSales} className="p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-100 transition-colors">
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1">
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-16 bg-gray-50 dark:bg-gray-900/50 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="flex flex-col h-64 items-center justify-center text-gray-400 gap-4">
                            <FileText size={48} className="opacity-20" />
                            <p>No sales orders found.</p>
                            <Link href="/manufacturing/sales/add" className="text-[#3498DB] hover:underline font-bold text-sm">Create your first order</Link>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Items</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                    <th className="px-6 py-4 text-right">Date</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-[#3498DB] cursor-pointer hover:underline">#{order.id.slice(0, 8)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{order.customer}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase
                                                ${order.status === 'Completed' ? 'bg-green-100 text-green-600' :
                                                    order.status === 'Processing' ? 'bg-blue-100 text-blue-600' :
                                                        'bg-yellow-100 text-yellow-600'}
                                            `}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-600 dark:text-gray-300">
                                            {order.items.toLocaleString()} pcs
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white">
                                            ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500 text-sm">
                                            {new Date(order.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="p-2 text-gray-400 hover:text-[#3498DB] transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
