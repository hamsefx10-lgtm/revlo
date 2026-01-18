'use client';

import React, { useState, useEffect } from 'react';
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
    Edit,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';

export default function CustomerProfilePage() {
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState<any>(null);
    const [stats, setStats] = useState({
        totalSpent: 0,
        totalOrders: 0,
        averageOrderValue: 0
    });
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (params.id) {
            fetchCustomerData();
        }
    }, [params.id]);

    const fetchCustomerData = async () => {
        try {
            const response = await fetch(`/api/shop/customers/${params.id}`);
            if (!response.ok) return; // Handle error
            const data = await response.json();

            if (data.customer) {
                setCustomer(data.customer);
                setStats(data.analytics);
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

    if (!customer) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h2 className="text-xl font-bold">Customer not found</h2>
                <Link href="/shop/customers" className="text-blue-500 hover:underline mt-2">Go Back</Link>
            </div>
        );
    }

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
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#F39C12] to-[#E67E22] flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-orange-500/20 flex-shrink-0 uppercase">
                                {customer.name ? customer.name.slice(0, 2) : 'CU'}
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">{customer.name}</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <Mail size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Email</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.email || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <Phone size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Phone</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.phone || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <MapPin size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Address</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.address || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <Calendar size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Customer Since</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {customer.createdAt ? format(new Date(customer.createdAt), 'MMM yyyy') : '-'}
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
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Purchase History</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Invoice</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Date</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-400 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {history.length === 0 ? (
                                        <tr><td colSpan={5} className="p-6 text-center text-gray-500">No purchase history available.</td></tr>
                                    ) : (
                                        history.map((purchase) => {
                                            const paid = purchase.paidAmount || (purchase.paymentStatus === 'Paid' ? purchase.total : 0);
                                            const balance = purchase.total - paid;

                                            // Determine display status if not explicitly 'Credit'/'Partial' but has balance?
                                            // Rely on purchase.paymentStatus mainly.

                                            return (
                                                <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-sm font-bold text-[#3498DB]">
                                                        <Link href={`/shop/sales/${purchase.id}`}>{purchase.invoiceNumber || purchase.id}</Link>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                        {format(new Date(purchase.createdAt), 'MMM dd, yyyy')}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${purchase.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                                                                purchase.paymentStatus === 'Credit' ? 'bg-red-100 text-red-700' :
                                                                    purchase.paymentStatus === 'Partial' ? 'bg-orange-100 text-orange-700' :
                                                                        'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {purchase.paymentStatus || 'Paid'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm font-black text-gray-900 dark:text-white">
                                                        ETB {purchase.total.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm font-bold">
                                                        {balance > 0 ? (
                                                            <span className="text-red-500">ETB {balance.toFixed(2)}</span>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Stats */}
                <div className="space-y-6">

                    {/* Total Debt (New) */}
                    {(() => {
                        const totalDebt = history.reduce((sum, sale) => {
                            const paid = sale.paidAmount || (sale.paymentStatus === 'Paid' ? sale.total : 0);
                            const balance = sale.total - paid;
                            return sum + Math.max(0, balance);
                        }, 0);

                        return (
                            <div className={`p-6 rounded-[2rem] shadow-xl relative overflow-hidden text-white ${totalDebt > 0 ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                                <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                                <div className="relative z-10">
                                    <p className="text-red-100 text-xs font-bold uppercase tracking-wider mb-2">Total Debt</p>
                                    <h2 className="text-4xl font-black mb-2">ETB {totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                                    <p className="text-red-100 text-sm">{totalDebt > 0 ? 'Outstanding Balance' : 'No outstanding debt'}</p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Total Spent */}
                    <div className="bg-gradient-to-br from-[#2ECC71] to-[#27AE60] p-6 rounded-[2rem] shadow-xl shadow-green-500/20 text-white relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-2">Total Spent</p>
                            <h2 className="text-2xl font-black mb-2">ETB {stats.totalSpent.toLocaleString()}</h2>
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
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalOrders}</p>
                            </div>
                        </div>
                        {history.length > 0 && <p className="text-sm text-gray-500">Last: <span className="font-bold">{format(new Date(history[0].createdAt), 'MMM dd')}</span></p>}
                    </div>

                    {/* Average Order */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-[#F39C12]/10 text-[#F39C12]">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Avg. Order Value</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">ETB {Math.round(stats.averageOrderValue).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}
