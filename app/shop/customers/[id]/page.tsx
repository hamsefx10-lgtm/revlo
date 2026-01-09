'use client';

import React from 'react';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    ShoppingBag,
    DollarSign,
    TrendingUp,
    Edit
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Mock data
const CUSTOMER_DATA = {
    id: '1',
    name: 'Ahmed Ali Mohamed',
    email: 'ahmed.ali@example.com',
    phone: '+252 61 555 1234',
    address: 'Km4, Hodan District, Mogadishu',
    joinDate: '2023-06-15',
    status: 'Active' as const,
    totalPurchases: 45,
    totalSpent: 125000,
    averageOrderValue: 2777,
    lastPurchase: '2024-01-05'
};

const PURCHASE_HISTORY = [
    { id: 'INV-001', date: '2024-01-05', items: 3, amount: 3500, status: 'Completed' },
    { id: 'INV-002', date: '2024-01-02', items: 1, amount: 1200, status: 'Completed' },
    { id: 'INV-003', date: '2023-12-28', items: 5, amount: 4800, status: 'Completed' },
    { id: 'INV-004', date: '2023-12-20', items: 2, amount: 2100, status: 'Completed' },
];

export default function CustomerProfilePage() {
    const params = useParams();

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-7xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/customers" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Customers
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#F39C12] to-[#E67E22] rounded-xl shadow-lg shadow-orange-500/20 text-white">
                            <User size={28} />
                        </div>
                        Customer Profile
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">View customer details and purchase history.</p>
                </div>

                <div className="flex gap-3">
                    <Link href={`/shop/customers/${params.id}/edit`} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                        <Edit size={18} /> Edit Customer
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: Customer Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Profile Card */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                        <div className="flex items-start gap-6">
                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#F39C12] to-[#E67E22] flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-orange-500/20 flex-shrink-0">
                                {CUSTOMER_DATA.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">{CUSTOMER_DATA.name}</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <Mail size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Email</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{CUSTOMER_DATA.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <Phone size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Phone</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{CUSTOMER_DATA.phone}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <MapPin size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Address</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{CUSTOMER_DATA.address}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <Calendar size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Customer Since</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{CUSTOMER_DATA.joinDate}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Purchase History */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Purchase History</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Invoice</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Date</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-400 uppercase">Items</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {PURCHASE_HISTORY.map((purchase) => (
                                        <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4 font-mono text-sm font-bold text-[#3498DB]">{purchase.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{purchase.date}</td>
                                            <td className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white">{purchase.items}</td>
                                            <td className="px-6 py-4 text-right text-sm font-black text-gray-900 dark:text-white">ETB {purchase.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Stats */}
                <div className="space-y-6">

                    {/* Total Spent */}
                    <div className="bg-gradient-to-br from-[#2ECC71] to-[#27AE60] p-6 rounded-[2rem] shadow-xl shadow-green-500/20 text-white relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-2">Total Spent</p>
                            <h2 className="text-4xl font-black mb-2">ETB {CUSTOMER_DATA.totalSpent.toLocaleString()}</h2>
                            <p className="text-green-100 text-sm">Lifetime value</p>
                        </div>
                    </div>

                    {/* Total Purchases */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-[#3498DB]/10 text-[#3498DB]">
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Total Orders</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{CUSTOMER_DATA.totalPurchases}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">Last purchase: <span className="font-bold">{CUSTOMER_DATA.lastPurchase}</span></p>
                    </div>

                    {/* Average Order */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-[#F39C12]/10 text-[#F39C12]">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Avg. Order Value</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">ETB {CUSTOMER_DATA.averageOrderValue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-3">Account Status</p>
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2ECC71]/10 text-[#2ECC71] border border-[#2ECC71]/20 font-bold">
                            <div className="w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse"></div>
                            {CUSTOMER_DATA.status}
                        </span>
                    </div>

                </div>
            </div>

        </div>
    );
}
