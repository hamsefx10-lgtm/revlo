'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus, Search, Users, MapPin, Phone, Mail, MoreVertical, Loader2, RefreshCcw, Briefcase, Building
} from 'lucide-react';

export default function FactoryCustomersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/manufacturing/customers?search=${searchTerm}`);
            if (res.status === 401) {
                // Redirect to login if unauthorized
                window.location.href = '/login';
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setCustomers(data.customers || []);
            }
        } catch (e) {
            console.error("Failed to load customers", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchCustomers, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Customers</h1>
                    <p className="text-sm text-gray-500 font-medium">Manage manufacturing clients and B2B partners.</p>
                </div>
                <Link href="/manufacturing/customers/add" className="px-5 py-2.5 bg-[#3498DB] hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all hover:-translate-y-0.5">
                    <Plus size={18} /> Add Customer
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-[#3498DB] rounded-xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Clients</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                            {loading ? '-' : customers.length}
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                            {loading ? '-' : customers.reduce((acc, c) => acc + (c._count?.productionOrders || 0), 0)}
                        </p>
                    </div>
                </div>
                {/* Third Stat - Maybe Recent Activity or just placeholder for now */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 opacity-50">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-xl">
                        <Building size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Companies</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                            {loading ? '-' : customers.filter(c => c.companyName).length}
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
                            placeholder="Search name, company, email..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3498DB] outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchCustomers} className="p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-100 transition-colors">
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1">
                    {loading && customers.length === 0 ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-16 bg-gray-50 dark:bg-gray-900/50 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="flex flex-col h-64 items-center justify-center text-gray-400 gap-4">
                            <Users size={48} className="opacity-20" />
                            <p>No customers found.</p>
                            <Link href="/manufacturing/customers/add" className="text-[#3498DB] hover:underline font-bold text-sm">Add your first customer</Link>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Name / Company</th>
                                    <th className="px-6 py-4">Contact Info</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4 text-center">History</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group" onClick={() => window.location.href = `/manufacturing/customers/${customer.id}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#3498DB] flex items-center justify-center text-sm font-bold">
                                                    {customer.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white">{customer.name}</div>
                                                    {customer.companyName && <div className="text-xs text-gray-500 font-medium">{customer.companyName}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                                                {customer.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {customer.phone}</div>}
                                                {customer.email && <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {customer.email}</div>}
                                                {!customer.phone && !customer.email && <span className="text-gray-400 text-xs italic">No contact info</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {customer.address ? (
                                                <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" /> {customer.address}</div>
                                            ) : <span className="text-gray-400 text-xs italic">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-blue-100 dark:bg-blue-900/30 text-[#3498DB] px-3 py-1 rounded-full text-xs font-bold">
                                                {customer._count?.productionOrders || 0} Orders
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Link
                                                href={`/manufacturing/customers/${customer.id}`}
                                                className="p-2 text-gray-400 hover:text-[#3498DB] transition-colors inline-block rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreVertical size={18} />
                                            </Link>
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
