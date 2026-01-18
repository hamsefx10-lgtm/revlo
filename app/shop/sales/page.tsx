'use client';

import React, { useState, useEffect } from 'react';
import {
    Search,
    Calendar,
    Download,
    Eye,
    RotateCcw,
    Printer,
    ArrowUpRight,
    Loader2,
    PackageX
} from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/shop/ui/StatusBadge';
import { format } from 'date-fns';

// --- TYPES ---
interface SaleItem {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface Sale {
    id: string;
    invoiceNumber: string;
    customer: { name: string } | null;
    createdAt: string;
    total: number;
    paidAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    status: string; // This might be redundant if paymentStatus exists, but keeping for compatibility
    items: SaleItem[];
}

export default function SalesHistoryPage() {
    const [dateRange, setDateRange] = useState('Today');
    const [search, setSearch] = useState('');
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    // Refund State
    const [refundModalOpen, setRefundModalOpen] = useState(false);
    const [refundSale, setRefundSale] = useState<Sale | null>(null);
    const [refundReason, setRefundReason] = useState('');
    const [refundAccountId, setRefundAccountId] = useState('');
    const [accounts, setAccounts] = useState<any[]>([]);

    useEffect(() => {
        fetchSales();
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/shop/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
                if (data.accounts?.length > 0) setRefundAccountId(data.accounts[0].id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSales = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/shop/sales?limit=50');
            const data = await response.json();

            if (data.sales) {
                setSales(data.sales);
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = sales.filter(sale =>
        (sale.invoiceNumber?.toLowerCase()?.includes(search.toLowerCase()) || '') ||
        (sale.customer?.name?.toLowerCase()?.includes(search.toLowerCase()) || '')
    );

    // Helper to format date
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
        } catch (e) {
            return dateString;
        }
    };

    const handleRefundClick = (sale: Sale) => {
        setRefundSale(sale);
        setRefundModalOpen(true);
    };

    const submitRefund = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!refundSale) return;

        setProcessing(refundSale.id);
        try {
            const res = await fetch(`/api/shop/sales/${refundSale.id}/refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId: refundAccountId,
                    reason: refundReason
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Refund failed');
            }

            // Success
            setRefundModalOpen(false);
            setRefundReason('');
            fetchSales(); // Refresh list
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        } finally {
            setProcessing(null);
        }
    };

    // Export to CSV
    const handleExport = () => {
        if (filteredData.length === 0) return;

        const headers = ['Invoice Number', 'Date', 'Customer', 'Items Count', 'Total', 'Payment Method', 'Status'];
        const csvContent = [
            headers.join(','),
            ...filteredData.map(sale => [
                sale.invoiceNumber,
                `"${formatDate(sale.createdAt)}"`,
                `"${sale.customer?.name || 'Walk-in'}"`,
                sale.items?.length || 0,
                sale.total.toFixed(2),
                sale.paymentMethod,
                sale.status
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-7xl mx-auto p-4 md:p-8">

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
                    <button
                        onClick={handleExport}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2"
                    >
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

            {/* Sales Table */}
            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden">

                {loading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 animate-spin text-[#3498DB]" />
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Method</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Balance Due</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                                        <Loader2 className="mx-auto mb-2 animate-spin" />
                                        Loading sales...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                                        No sales found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((sale) => {
                                    const balance = sale.total - (sale.paidAmount || (sale.paymentMethod === 'Credit' ? 0 : sale.total));
                                    // Logic: if paidAmount exists, use it. If not, and it's credit, paid is 0? 
                                    // Actually, standard sales (Cash/Card) usually have paidAmount = total or undefined implies fully paid.
                                    // Safe calculation: if paymentStatus is Paid, bal is 0. If Partial/Unpaid, calc it.
                                    const isPaid = sale.paymentStatus === 'Paid' || sale.status === 'Paid';
                                    const displayBalance = isPaid ? 0 : (sale.total - (sale.paidAmount || 0));

                                    return (
                                        <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-bold text-gray-900 dark:text-white">#{sale.invoiceNumber}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(sale.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                                                        {(sale.customer?.name || 'W').charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {sale.customer?.name || 'Walk-in'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {sale.paymentMethod}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={sale.paymentStatus || sale.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-gray-900 dark:text-white">
                                                <span className="text-xs text-gray-400 mr-1">ETB</span>
                                                {sale.total.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-bold">
                                                {displayBalance > 0 ? (
                                                    <span className="text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md text-xs">
                                                        {displayBalance.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-green-500 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/shop/sales/${sale.id}`} className="p-2 text-gray-400 hover:text-[#3498DB] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="View Details">
                                                        <Eye size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleRefundClick(sale)}
                                                        className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-all"
                                                        title="Refund"
                                                    >
                                                        <RotateCcw size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination (Simplified for now) */}
            <div className="mt-4 flex justify-end">
                {/* ... pagination controls if needed ... */}
            </div>

            {/* REFUND MODAL */}
            {refundModalOpen && refundSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={submitRefund} className="bg-white dark:bg-[#1f2937] rounded-3xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden">

                        <div className="mb-6">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">Process Refund</h3>
                            <p className="text-sm text-gray-500 font-medium">Refund for Invoice #{refundSale.invoiceNumber}</p>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase">Refund Amount</span>
                                <span className="text-xl font-black text-gray-900 dark:text-white">ETB {refundSale.total.toFixed(2)}</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Refund From Account</label>
                                <select
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 outline-none font-medium appearance-none"
                                    value={refundAccountId}
                                    onChange={e => setRefundAccountId(e.target.value)}
                                >
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reason</label>
                                <textarea
                                    required
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 outline-none resize-none font-medium"
                                    rows={3}
                                    placeholder="Reason for refund..."
                                    value={refundReason}
                                    onChange={e => setRefundReason(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRefundModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!!processing}
                                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50 transition-colors shadow-lg shadow-red-500/20"
                                >
                                    {processing ? 'Processing...' : 'Confirm Refund'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
