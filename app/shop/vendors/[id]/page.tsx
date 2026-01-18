'use client';

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Truck,
    Mail,
    Phone,
    MapPin,
    Calendar,
    ShoppingBag,
    DollarSign,
    User,
    Edit,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';

export default function VendorProfilePage() {
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [vendor, setVendor] = useState<any>(null);
    const [stats, setStats] = useState({
        totalSpent: 0,
        totalOrders: 0
    });
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (params.id) {
            fetchVendorData();
        }
    }, [params.id]);

    const fetchVendorData = async () => {
        try {
            const response = await fetch(`/api/shop/vendors/${params.id}`);
            if (!response.ok) return;
            const data = await response.json();

            if (data.vendor) {
                setVendor(data.vendor);
                setStats(data.stats);
                setHistory(data.history || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h2 className="text-xl font-bold">Vendor not found</h2>
                <Link href="/shop/vendors" className="text-blue-500 hover:underline mt-2">Go Back</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-7xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/vendors" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Vendors
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] rounded-xl shadow-lg shadow-green-500/20 text-white">
                            <Truck size={28} />
                        </div>
                        Vendor Profile
                    </h1>
                </div>

                <div className="flex gap-3">
                    <button disabled className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-400 cursor-not-allowed flex items-center gap-2 bg-gray-50 dark:bg-gray-800">
                        <Edit size={18} /> Edit Vendor
                    </button>
                    {/* Placeholder Edit button logic would go here */}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: Vendor Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Profile Card */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                        <div className="flex items-start gap-6">
                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-green-500/20 flex-shrink-0 uppercase">
                                {vendor.companyName ? vendor.companyName.slice(0, 2) : 'VE'}
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{vendor.companyName}</h2>
                                {vendor.contactPerson && <p className="text-gray-500 font-bold text-sm mb-4">Contact: {vendor.contactPerson}</p>}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <Mail size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Email</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{vendor.email || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <Phone size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Phone</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{vendor.phone || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <MapPin size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Address</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{vendor.address || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <Calendar size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Added Since</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {vendor.createdAt ? format(new Date(vendor.createdAt), 'MMM yyyy') : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Purchase History */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Purchase Orders</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">PO Number</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Date</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-400 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {history.length === 0 ? (
                                        <tr><td colSpan={4} className="p-6 text-center text-gray-500">No purchase history.</td></tr>
                                    ) : (
                                        history.map((po) => (
                                            <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-6 py-4 font-mono text-sm font-bold text-[#3498DB]">
                                                    {po.poNumber || po.id.substring(0, 8)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                    {format(new Date(po.createdAt), 'MMM dd, yyyy')}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-block px-2 py-1 text-xs font-bold rounded-lg ${po.status === 'Received' ? 'bg-green-100 text-green-700' :
                                                        po.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {po.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-black text-gray-900 dark:text-white">
                                                    ETB {po.total.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Stats */}
                <div className="space-y-6">

                    {/* Total Spent */}
                    <div className="bg-gradient-to-br from-[#3498DB] to-[#2980B9] p-6 rounded-[2rem] shadow-xl shadow-blue-500/20 text-white relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-2">Total Paid</p>
                            <h2 className="text-4xl font-black mb-2">ETB {stats.totalSpent.toLocaleString()}</h2>
                            <p className="text-blue-100 text-sm">To this vendor</p>
                        </div>
                    </div>

                    {/* Total Orders */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-[#F39C12]/10 text-[#F39C12]">
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Total Orders</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalOrders}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}
