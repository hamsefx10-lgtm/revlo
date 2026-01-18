'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Search,
    Plus,
    Truck,
    Download,
    Eye,
    MoreVertical,
    Loader2,
    CheckCircle,
    Trash2,
    CreditCard,
    X,
    DollarSign,
    Calendar,
    Filter,
    ArrowUpRight,
    Briefcase,
    Package,
    ChevronRight,
    FileText
} from 'lucide-react';
import StatusBadge from '@/components/shop/ui/StatusBadge';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

// --- TYPES ---
interface PurchaseOrder {
    id: string;
    poNumber: string;
    vendor: { name: string };
    createdAt: string;
    total: number;
    paidAmount: number;
    paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
    status: 'Received' | 'Pending' | 'Ordered' | 'Cancelled';
    _count: { items: number };
}

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
}

export default function PurchasesPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    // Filters
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Payment Modal State
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState('');

    useEffect(() => {
        fetchPurchases();
        fetchAccounts();
    }, [filter, dateRange]); // Refetch on filter change

    const fetchAccounts = async () => {
        try {
            const response = await fetch('/api/shop/accounts');
            if (response.ok) {
                const data = await response.json();
                setAccounts(data.accounts || []);
            }
        } catch (error) {
            console.error('Error fetching accounts', error);
        }
    };

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            // if (search) params.append('search', search); // Client-side search for smoother experience
            if (filter !== 'All') params.append('status', filter);
            params.append('startDate', dateRange.start);
            params.append('endDate', dateRange.end);

            const response = await fetch(`/api/shop/purchases?${params}`);
            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            setPurchases(data.purchases || []);
        } catch (error) {
            console.error('Error fetching purchases:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (e: React.MouseEvent, id: string, newStatus: string) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to mark this status as ${newStatus}?`)) return;
        setProcessing(id);
        try {
            const response = await fetch(`/api/shop/purchases/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Failed to update');

            toast({ title: 'Success', description: `Order marked as ${newStatus}` });
            fetchPurchases();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update order', variant: 'destructive' });
        } finally {
            setProcessing(null);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this order?')) return;
        setProcessing(id);
        try {
            const response = await fetch(`/api/shop/purchases/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to delete');
            }

            toast({ title: 'Success', description: 'Order deleted' });
            fetchPurchases();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setProcessing(null);
        }
    };

    // Payment Functionality
    const openPaymentModal = (e: React.MouseEvent, po: PurchaseOrder) => {
        e.stopPropagation();
        setSelectedPo(po);
        setPayAmount((po.total - po.paidAmount).toString()); // Default to remaining balance
        setPayModalOpen(true);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPo) return;

        setProcessing(selectedPo.id);

        try {
            const response = await fetch(`/api/shop/purchases/${selectedPo.id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(payAmount),
                    accountId: selectedAccountId
                })
            });

            if (!response.ok) throw new Error("Payment failed");

            toast({ title: 'Payment Recorded', description: `Payment of ETB ${payAmount} saved.` });
            setPayModalOpen(false);
            fetchPurchases();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to record payment', variant: 'destructive' });
        } finally {
            setProcessing(null);
        }
    };

    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(purchases.map(p => ({
            'PO Number': p.poNumber,
            Vendor: p.vendor?.name,
            Date: new Date(p.createdAt).toLocaleDateString(),
            Items: p._count.items,
            Total: p.total,
            Paid: p.paidAmount,
            Balance: p.total - p.paidAmount,
            Status: p.status,
            Payment: p.paymentStatus
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Purchase Orders");
        XLSX.writeFile(wb, `Purchases_${dateRange.start}_to_${dateRange.end}.xlsx`);
    };

    // --- Helpers ---
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch (e) {
            return dateString;
        }
    };

    const filteredPurchases = purchases.filter(p =>
        p.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.vendor?.name?.toLowerCase().includes(search.toLowerCase())
    );

    // Stats Logic
    const stats = purchases.reduce((acc, curr) => {
        acc.total += curr.total;
        acc.paid += curr.paidAmount;
        if (curr.status === 'Pending' || curr.status === 'Ordered') acc.pendingCount++;
        return acc;
    }, { total: 0, paid: 0, pendingCount: 0 });

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] font-sans pb-20 w-full animate-fade-in">

            {/* HEADER */}
            <div className="bg-white dark:bg-[#151C2C] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 shadow-sm/50">
                <div className="w-full px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-[#3498DB]">
                            <Truck size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none mb-1.5">Purchase Orders</h1>
                            <p className="text-sm text-gray-500 font-medium">Manage incoming stock and supplier orders.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExport}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 text-sm"
                        >
                            <Download size={18} /> Export
                        </button>
                        <Link href="/shop/purchases/add" className="px-5 py-2.5 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2 text-sm">
                            <Plus size={18} /> New Order
                        </Link>
                    </div>
                </div>
            </div>

            <div className="w-full px-4 md:px-6 py-6 space-y-6">

                {/* STATS CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#151C2C] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Purchases</p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">ETB {stats.total.toLocaleString()}</p>
                            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500"><DollarSign size={18} /></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#151C2C] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Paid Amount</p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-xl md:text-2xl font-black text-green-500">ETB {stats.paid.toLocaleString()}</p>
                            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-500"><CheckCircle size={18} /></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#151C2C] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Orders</p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-xl md:text-2xl font-black text-orange-500">{stats.pendingCount}</p>
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-500"><Package size={18} /></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#151C2C] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Balance Due</p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-xl md:text-2xl font-black text-red-500">ETB {(stats.total - stats.paid).toLocaleString()}</p>
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500"><CreditCard size={18} /></div>
                        </div>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="bg-white dark:bg-[#151C2C] p-4 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col xl:flex-row items-center gap-4 justify-between">
                    <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
                        {/* Date Range */}
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 w-full md:w-auto">
                            <Calendar size={18} className="text-gray-400 ml-2" />
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                className="bg-transparent text-sm font-bold outline-none text-gray-700 dark:text-gray-200 w-full md:w-32"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                className="bg-transparent text-sm font-bold outline-none text-gray-700 dark:text-gray-200 w-full md:w-32"
                            />
                        </div>

                        {/* Search */}
                        <div className="relative w-full md:w-64">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search Supplier or PO#..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto max-w-full">
                        {['All', 'Received', 'Ordered', 'Pending'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filter === tab
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* TABLE VIEW (Desktop) */}
                <div className="hidden md:block bg-white dark:bg-[#151C2C] border border-gray-100 dark:border-gray-800 rounded-[24px] overflow-hidden shadow-sm min-h-[400px] relative">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                            <Loader2 className="w-8 h-8 animate-spin text-[#3498DB]" />
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Purchase Order</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredPurchases.length === 0 && !loading ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No purchase orders found.</td></tr>
                                ) : (
                                    filteredPurchases.map((po) => (
                                        <tr
                                            key={po.id}
                                            onClick={() => router.push(`/shop/purchases/${po.id}`)}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-500">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-900 dark:text-white text-sm block group-hover:text-blue-500 transition-colors">
                                                            {po.poNumber}
                                                        </span>
                                                        <span className="text-xs text-gray-500">{formatDate(po.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase size={16} className="text-gray-400" />
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{po.vendor?.name || 'Unknown Vendor'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-500">
                                                {po._count?.items || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-black text-gray-900 dark:text-white">{po.total.toLocaleString()}</span>
                                                    {po.paidAmount < po.total && po.paidAmount > 0 && (
                                                        <span className="text-[10px] text-red-500 font-bold">Due: {(po.total - po.paidAmount).toLocaleString()}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] uppercase font-black ${po.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                                                        po.paymentStatus === 'Partial' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {po.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap flex justify-center">
                                                <StatusBadge status={po.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {(po.paymentStatus !== 'Paid') && (
                                                        <button
                                                            onClick={(e) => openPaymentModal(e, po)}
                                                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                            title="Record Payment"
                                                        >
                                                            <CreditCard size={18} />
                                                        </button>
                                                    )}
                                                    {processing === po.id ? (
                                                        <Loader2 size={18} className="animate-spin text-gray-400" />
                                                    ) : (

                                                        <>
                                                            {po.status !== 'Received' && (
                                                                <button
                                                                    onClick={(e) => handleStatusUpdate(e, po.id, 'Received')}
                                                                    className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                                    title="Mark as Received"
                                                                >
                                                                    <CheckCircle size={18} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => handleDelete(e, po.id)}
                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                title="Delete Order"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <div className="p-2 text-gray-300">
                                                        <ChevronRight size={18} />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MOBILE CARD VIEW */}
                <div className="block md:hidden space-y-4">
                    {loading ? (
                        <div className="p-10 text-center text-gray-400">Loading...</div>
                    ) : filteredPurchases.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">No orders found.</div>
                    ) : (
                        filteredPurchases.map(po => (
                            <div
                                key={po.id}
                                onClick={() => router.push(`/shop/purchases/${po.id}`)}
                                className="bg-white dark:bg-[#151C2C] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 active:scale-[98%] transition-transform"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500">
                                            <Truck size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{po.poNumber}</p>
                                            <p className="text-xs text-gray-500">{formatDate(po.createdAt)}</p>
                                        </div>
                                    </div>
                                    <StatusBadge status={po.status} />
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Vendor</p>
                                        <p className="font-bold text-gray-700 dark:text-gray-300 truncate">{po.vendor?.name || 'Unknown'}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg text-right">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Total</p>
                                        <p className="font-black text-gray-900 dark:text-white">{po.total.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${po.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                                            po.paymentStatus === 'Partial' ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        Payment: {po.paymentStatus}
                                    </span>

                                    <div className="flex gap-2">
                                        {(po.paymentStatus !== 'Paid') && (
                                            <button onClick={(e) => openPaymentModal(e, po)} className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                                <CreditCard size={16} />
                                            </button>
                                        )}
                                        <button onClick={(e) => handleDelete(e, po.id)} className="p-2 bg-red-50 text-red-500 rounded-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>

            {/* PAYMENT MODAL */}
            {payModalOpen && selectedPo && (
                <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#1f2937] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold">Record Payment</h3>
                                <p className="text-sm opacity-90">{selectedPo.poNumber} — {selectedPo.vendor?.name}</p>
                            </div>
                            <button onClick={() => setPayModalOpen(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
                        </div>

                        <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">Remaining Balance</span>
                                <span className="text-xl font-black text-gray-900 dark:text-white">
                                    ETB {(selectedPo.total - selectedPo.paidAmount).toLocaleString()}
                                </span>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Amount to Pay</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={selectedPo.total - selectedPo.paidAmount}
                                        value={payAmount}
                                        onChange={(e) => setPayAmount(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-bold text-lg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Funding Account</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white appearance-none"
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                    required
                                >
                                    <option value="">Select Account...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.type}) - ETB {acc.balance.toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                                {accounts.find(a => a.id === selectedAccountId) && (
                                    <p className={`text-xs font-bold mt-2 ${(accounts.find(a => a.id === selectedAccountId)?.balance || 0) < parseFloat(payAmount || '0')
                                        ? 'text-red-500'
                                        : 'text-green-500'
                                        }`}>
                                        Available Funds: ETB {accounts.find(a => a.id === selectedAccountId)?.balance.toLocaleString()}
                                    </p>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPayModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!!processing}
                                    className="flex-1 py-3 rounded-xl bg-[#2ECC71] hover:bg-[#27AE60] text-white font-bold shadow-lg shadow-green-500/20"
                                >
                                    {processing ? 'Processing...' : 'Confirm Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
