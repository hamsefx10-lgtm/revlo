'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search,
    Plus,
    Phone,
    Mail,
    Building2,
    Package,
    ExternalLink,
    Loader2
} from 'lucide-react';
import StatusBadge from '@/components/shop/ui/StatusBadge';
import { useToast } from '@/components/ui/use-toast';

// --- TYPES ---
interface Vendor {
    id: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    category: string;
    status: 'Active' | 'Inactive' | 'On Hold';
    openOrders: number;
}

export default function VendorsPage() {
    const [search, setSearch] = useState('');
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchVendors();
    }, [search]);

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.append('search', search);

            const response = await fetch(`/api/shop/vendors?${params}`);
            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            setVendors(data.vendors || []);
        } catch (error) {
            console.error('Error fetching vendors:', error);
            // Silent error or small toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-[#F39C12]">
                            <Building2 size={28} />
                        </div>
                        Vendors & Suppliers
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Manage supplier relationships and procurement.</p>
                </div>

                <div className="flex gap-3">
                    <Link href="/shop/vendors/add" className="px-5 py-2.5 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2">
                        <Plus size={18} /> Add Vendor
                    </Link>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="mb-6 max-w-md">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search company, contact person..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all font-medium text-sm shadow-sm"
                    />
                </div>
            </div>

            {/* TABLE CARD */}
            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden min-h-[300px] relative">

                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 animate-spin text-[#3498DB]" />
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Company</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Person</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Info</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Open Orders</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {vendors.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No vendors found. Add one to get started.
                                    </td>
                                </tr>
                            ) : (
                                vendors.map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/10 flex items-center justify-center text-[#F39C12] font-bold border border-orange-100 dark:border-orange-500/20">
                                                    <Building2 size={18} />
                                                </div>
                                                <span className="font-bold text-gray-900 dark:text-white text-sm">{v.companyName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {v.contactPerson}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                                                    <Phone size={12} className="text-gray-400" /> {v.phone}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                                                    <Mail size={12} className="text-gray-400" /> {v.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300">
                                                <Package size={12} /> {v.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold leading-6 ${v.openOrders > 0 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                                                {v.openOrders}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center flex justify-center">
                                            <StatusBadge status={v.status || 'Active'} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/shop/vendors/${v.id}`} className="p-2 text-gray-400 hover:text-[#3498DB] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                    <ExternalLink size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
