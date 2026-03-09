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
    PackageX,
    CreditCard,
    MessageCircle,
    TrendingUp,
    ShoppingBag,
    DollarSign,
    CheckCircle2,
    X,
    ArrowLeft,
    ChevronRight,
    MoreVertical,
    History,
    Globe
} from 'lucide-react';
import Link from 'next/link';
import { format, isToday, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

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
    customer: { name: string; phone?: string } | null;
    createdAt: string;
    total: number;
    paidAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
    subtotal: number;
    tax: number;
    items: SaleItem[];
    currency: string;
    exchangeRate: number;
}

export default function SalesHistoryPage() {
    const { toast } = useToast();
    const [dateRange, setDateRange] = useState('Today');
    const [search, setSearch] = useState('');
    const [sales, setSales] = useState<Sale[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    // Sidebars & Modals
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isPaySidebarOpen, setIsPaySidebarOpen] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

    // Payment State
    const [payAmount, setPayAmount] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [payLoading, setPayLoading] = useState(false);
    const [currentExchangeRate, setCurrentExchangeRate] = useState<number>(1);

    // Refund State
    const [refundReason, setRefundReason] = useState('');
    const [refundAccountId, setRefundAccountId] = useState('');
    const [selectedRefundItems, setSelectedRefundItems] = useState<Set<string>>(new Set());

    // Pagination State
    const [limit, setLimit] = useState(20);
    const [hasMore, setHasMore] = useState(true);

    // Hover Preview State
    const [hoveredSaleId, setHoveredSaleId] = useState<string | null>(null);

    useEffect(() => {
        fetchSales();
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts'); // Using the more general accounts API
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSales = async (isLoadMore = false) => {
        try {
            if (!isLoadMore) setLoading(true);
            const currentOffset = isLoadMore ? sales.length : 0;
            const response = await fetch(`/api/shop/sales?limit=${limit}&offset=${currentOffset}`);
            const data = await response.json();
            if (data.sales) {
                if (isLoadMore) {
                    setSales(prev => [...prev, ...data.sales]);
                } else {
                    setSales(data.sales);
                }
                setHasMore(data.sales.length === limit);
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsApp = async (sale: Sale) => {
        if (!sale.customer?.phone) {
            toast({ title: "Missing Phone", description: "No customer phone attached.", variant: "destructive" });
            return;
        }

        const phone = sale.customer.phone;
        const balance = sale.total - (sale.paidAmount || 0);
        const message = `Asc ${sale.customer.name}, kani waa risiitkaaga Invoice #${sale.invoiceNumber}. Wadarta: ETB ${sale.total.toLocaleString()}.${balance > 0 ? ` Lacagta kugu dhiman waa ETB ${balance.toLocaleString()}. Fadlan xaqiiji haddii aad bixisay.` : ''} Mahadsanid!`;
        const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const openPaySidebar = async (sale: Sale) => {
        const balance = sale.total - (sale.paidAmount || 0);
        if (balance <= 0) return;

        setSelectedSale(sale);
        setPayAmount(balance.toString());
        setIsPaySidebarOpen(true);
        if (accounts.length > 0) setSelectedAccount(accounts[0].id);

        // Fetch today's rate for settlement
        try {
            const res = await fetch('/api/settings/exchange-rate');
            const data = await res.json();
            if (data.rate) {
                setCurrentExchangeRate(data.rate.rate);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSettle = async () => {
        if (!selectedSale || !payAmount || !selectedAccount) return;

        setPayLoading(true);
        try {
            const res = await fetch(`/api/shop/sales/${selectedSale.id}/settle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(payAmount),
                    accountId: selectedAccount,
                    exchangeRate: currentExchangeRate,
                    description: `Settlement for Invoice #${selectedSale.invoiceNumber}`
                })
            });

            if (res.ok) {
                toast({
                    title: 'Payment Recorded',
                    description: `Successfully collected ETB ${parseFloat(payAmount).toLocaleString()} for Invoice #${selectedSale.invoiceNumber}`,
                    variant: 'default' // ClassName removal due to lint
                });
                setIsPaySidebarOpen(false);
                fetchSales();
            } else {
                const error = await res.json();
                throw new Error(error.error || 'Failed to settle');
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setPayLoading(false);
        }
    };

    const handleRefund = (sale: Sale) => {
        setSelectedSale(sale);
        setIsRefundModalOpen(true);
        // Initially select all items for refund
        setSelectedRefundItems(new Set(sale.items.map(i => i.id)));
        if (accounts.length > 0) setRefundAccountId(accounts[0].id);
    };

    const toggleRefundItem = (id: string) => {
        const next = new Set(selectedRefundItems);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedRefundItems(next);
    };

    const calculateRefundTotal = () => {
        if (!selectedSale) return 0;
        return selectedSale.items
            .filter(i => selectedRefundItems.has(i.id))
            .reduce((sum, i) => sum + i.total, 0);
    };

    const submitRefund = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSale || !refundAccountId) return;

        setProcessing(selectedSale.id);
        try {
            const res = await fetch(`/api/shop/sales/${selectedSale.id}/refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId: refundAccountId,
                    reason: refundReason,
                    itemIds: Array.from(selectedRefundItems)
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Refund failed');
            }

            toast({ title: 'Refund Processed', variant: 'default' });
            setIsRefundModalOpen(false);
            setRefundReason('');
            fetchSales();
        } catch (error: any) {
            toast({ title: 'Refund Error', description: error.message, variant: "destructive" });
        } finally {
            setProcessing(null);
        }
    };

    // Analytics Calculations (Based on loaded 50 sales)
    const todaySales = sales.filter(s => isToday(parseISO(s.createdAt)));
    const totalRevToday = todaySales.reduce((sum, s) => sum + s.total, 0);
    const unpaidToday = todaySales.reduce((sum, s) => sum + (s.total - s.paidAmount), 0);

    const filteredData = sales.filter(sale =>
        (sale.invoiceNumber?.toLowerCase()?.includes(search.toLowerCase()) || '') ||
        (sale.customer?.name?.toLowerCase()?.includes(search.toLowerCase()) || '')
    );

    const handleExport = () => {
        // ... CSV logic ...
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F1A] pb-20 font-sans w-full relative overflow-x-hidden animate-fade-in flex flex-col items-start overflow-y-auto">

            {/* TOP HEADER */}
            <div className="w-full mb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-left p-4 lg:p-6 lg:pt-4 pb-0">
                    <div>
                        <Link href="/shop/dashboard" className="group text-slate-400 hover:text-[#3498DB] transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                            <ArrowLeft size={12} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                            Point of Sale Dashboard
                        </Link>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                            <History size={24} strokeWidth={3} className="text-blue-600 dark:text-blue-400 hover:scale-110 active:rotate-12 transition-transform cursor-pointer" />
                            Sales Intelligence
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-xs max-w-md">
                            Analyze performance, manage transactions, and process returns with precision.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={handleExport} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-[#161B2E] border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                            <Download size={12} strokeWidth={3} /> Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI ANALYTICS CARDS */}
            <div className="w-full px-4 lg:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white dark:bg-[#161B2E] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all text-left">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[40px] rounded-full"></div>
                    <div className="flex items-center gap-4 mb-3">
                        <TrendingUp size={16} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform" />
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Net Revenue (Faaiido Basis)</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                            {sales.reduce((sum, s) => sum + (s.subtotal || s.total), 0).toLocaleString()}
                        </p>
                        <span className="text-[9px] font-black text-slate-300 uppercase">ETB Net</span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 italic">
                        Gross: {sales.reduce((sum, s) => sum + s.total, 0).toLocaleString()} ETB (Inc. VAT)
                    </p>
                </div>

                <div className="bg-white dark:bg-[#161B2E] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all text-left">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[40px] rounded-full"></div>
                    <div className="flex items-center gap-4 mb-3">
                        <ShoppingBag size={16} strokeWidth={3} className="text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform" />
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Transactions</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                            {sales.length}
                        </p>
                        <span className="text-[9px] font-black text-slate-300 uppercase">Latest Orders</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#161B2E] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/30 transition-all text-left">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-[40px] rounded-full"></div>
                    <div className="flex items-center gap-4 mb-3">
                        <DollarSign size={16} strokeWidth={3} className="text-rose-500 hover:scale-110 transition-transform" />
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Lacagta Maqan</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums text-left">
                            {sales.reduce((sum, s) => sum + (s.total - s.paidAmount), 0).toLocaleString()}
                        </p>
                        <span className="text-[9px] font-black text-slate-300 uppercase italic">Credits Due</span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 italic">
                        Wadarta daymaha macaamiisha ku maqan.
                    </p>
                </div>
            </div>

            {/* CONTROLS & TABLE SECTION */}
            <div className="w-full px-4 lg:px-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-2 bg-white dark:bg-[#161B2E] p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        {['Today', 'Yesterday', 'This Week', 'This Month'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateRange === range
                                    ? 'bg-[#3498DB] text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3498DB] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Find receipt or customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-white dark:bg-[#161B2E] border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#3498DB] transition-all w-80 shadow-sm"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-[#161B2E] border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden min-h-[500px]">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Transaction Registry
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96 gap-4">
                            <Loader2 className="animate-spin text-[#3498DB]" size={40} strokeWidth={3} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching Orders...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-6 px-10">Invoice Details</th>
                                        <th className="py-6 px-4">Customer</th>
                                        <th className="py-6 px-4 text-center">Payment Method</th>
                                        <th className="py-6 px-4 text-center">Status</th>
                                        <th className="py-6 px-4 text-right">Order Value</th>
                                        <th className="py-6 px-10 text-right">Intelligence</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-left">
                                    {filteredData.map((sale) => {
                                        const isPaid = sale.paymentStatus === 'Paid' || sale.status === 'Paid';
                                        const balance = sale.total - (sale.paidAmount || 0);

                                        return (
                                            <tr
                                                key={sale.id}
                                                className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200 relative"
                                                onMouseEnter={() => setHoveredSaleId(sale.id)}
                                                onMouseLeave={() => setHoveredSaleId(null)}
                                            >
                                                <td className="py-6 px-10 relative">
                                                    {hoveredSaleId === sale.id && sale.items && sale.items.length > 0 && (
                                                        <div className="absolute left-full top-0 ml-4 z-40 bg-white dark:bg-[#1E293B] shadow-2xl rounded-2xl p-4 border border-slate-100 dark:border-slate-800 w-64 animate-in fade-in zoom-in duration-200 pointer-events-none">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-50 dark:border-slate-800 pb-2">Order Contents</p>
                                                            <div className="space-y-3">
                                                                {sale.items.slice(0, 5).map(item => (
                                                                    <div key={item.id} className="flex justify-between items-center text-left">
                                                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{item.productName}</span>
                                                                        <span className="text-[10px] font-black text-slate-400">x{item.quantity}</span>
                                                                    </div>
                                                                ))}
                                                                {sale.items.length > 5 && (
                                                                    <p className="text-[9px] font-bold text-blue-500 pt-1">+{sale.items.length - 5} more items</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-white text-sm tracking-tight mb-1">#{sale.invoiceNumber}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 italic">{format(new Date(sale.createdAt), 'MMM dd, yyyy hh:mm a')}</p>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-black">
                                                            {(sale.customer?.name || 'W').charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                            {sale.customer?.name || 'Walk-in'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4 text-center">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                                                        {sale.paymentMethod}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-4 text-center">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                        : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400'
                                                        }`}>
                                                        {sale.paymentStatus || sale.status}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <p className="text-lg font-black text-slate-900 dark:text-white tracking-tighter tabular-nums drop-shadow-sm">
                                                            {sale.total.toLocaleString()} <span className="text-[9px] opacity-40 italic ml-1 align-top">{sale.currency || 'ETB'}</span>
                                                        </p>
                                                        {sale.currency === 'USD' && (
                                                            <p className="text-[9px] font-black text-slate-400 opacity-60">
                                                                ≈ {(sale.total * (sale.exchangeRate || 1)).toLocaleString()} ETB
                                                            </p>
                                                        )}
                                                        {!isPaid && (
                                                            <p className="text-[10px] font-black text-rose-500 mt-0.5">
                                                                Due: {balance.toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-6 px-10 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!isPaid && (
                                                            <button
                                                                onClick={() => openPaySidebar(sale)}
                                                                className="flex items-center gap-2 px-4 py-2 bg-[#3498DB] hover:bg-[#2980B9] text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20"
                                                            >
                                                                <CreditCard size={14} strokeWidth={3} /> Pay
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleWhatsApp(sale)}
                                                            className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                            title="WhatsApp Receipt"
                                                        >
                                                            <MessageCircle size={16} strokeWidth={3} />
                                                        </button>
                                                        <Link
                                                            href={`/shop/sales/${sale.id}`}
                                                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-[#3498DB] transition-all"
                                                        >
                                                            <ChevronRight size={16} strokeWidth={3} />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleRefund(sale)}
                                                            className="p-2.5 rounded-xl bg-orange-500/5 text-orange-500 hover:bg-orange-500 hover:text-white transition-all"
                                                        >
                                                            <RotateCcw size={16} strokeWidth={3} />
                                                        </button>
                                                        <button
                                                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all shadow-sm"
                                                            title="Print Receipt"
                                                        >
                                                            <Printer size={16} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && hasMore && filteredData.length >= limit && (
                        <div className="p-10 flex justify-center border-t border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/10">
                            <button
                                onClick={() => fetchSales(true)}
                                className="px-10 py-4 bg-white dark:bg-[#161B2E] border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:border-[#3498DB] hover:text-[#3498DB] transition-all shadow-sm hover:shadow-xl hover:shadow-blue-500/10 active:scale-95"
                            >
                                Load More Transactions
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* QUICK PAY SIDEBAR (SLIDE-OVER) */}
            {isPaySidebarOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsPaySidebarOpen(false)} />

                    <div className="relative w-full max-w-md bg-white dark:bg-[#161B2E] h-full shadow-2xl flex flex-col animate-slide-in p-0">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 text-left">
                                    <CreditCard size={20} strokeWidth={3} />
                                </div>
                                Settle Balance
                            </h3>
                            <button onClick={() => setIsPaySidebarOpen(false)} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="space-y-8">
                                <div className="bg-slate-50 dark:bg-blue-500/5 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-left">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Invoice Summary</p>
                                    <div className="flex justify-between items-baseline">
                                        <p className="text-2xl font-black text-slate-800 dark:text-white">#{selectedSale?.invoiceNumber}</p>
                                        <p className="text-xs font-bold text-[#3498DB]">{selectedSale?.customer?.name}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">Outstanding</span>
                                            <span className="text-sm font-black text-rose-500">{(selectedSale!.total - (selectedSale!.paidAmount || 0)).toLocaleString()} {selectedSale?.currency}</span>
                                        </div>
                                        {selectedSale?.currency === 'USD' && (
                                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">Current Exchange Rate</p>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={currentExchangeRate}
                                                            onChange={(e) => setCurrentExchangeRate(parseFloat(e.target.value))}
                                                            className="w-20 bg-transparent border-b border-blue-500/30 text-sm font-black text-blue-600 outline-none"
                                                        />
                                                        <span className="text-[9px] font-bold text-blue-400 italic">ETB / USD</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Required in ETB</p>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white">
                                                        {((selectedSale!.total - (selectedSale!.paidAmount || 0)) * currentExchangeRate).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 text-left">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Payment Amount ({selectedSale?.currency})
                                    </label>
                                    <input
                                        type="number"
                                        value={payAmount}
                                        onChange={(e) => setPayAmount(e.target.value)}
                                        className="w-full px-6 py-5 bg-white dark:bg-[#0B0F1A] border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-2xl font-black focus:outline-none focus:border-[#3498DB] transition-all"
                                    />
                                    {selectedSale?.currency === 'USD' && (
                                        <p className="text-[10px] font-bold text-slate-400 italic px-2">
                                            Equiv: {(parseFloat(payAmount || '0') * currentExchangeRate).toLocaleString()} ETB based on rate above.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-4 text-left">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destination Account</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {accounts.map(acc => (
                                            <button
                                                key={acc.id}
                                                onClick={() => setSelectedAccount(acc.id)}
                                                className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${selectedAccount === acc.id
                                                    ? 'border-[#3498DB] bg-blue-50/50 dark:bg-blue-500/10'
                                                    : 'border-slate-50 dark:border-slate-800 hover:border-slate-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${selectedAccount === acc.id ? 'bg-[#3498DB] animate-pulse' : 'bg-slate-300'}`}></div>
                                                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">{acc.name}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 tabular-nums">{acc.balance.toLocaleString()} ETB</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-50 dark:border-slate-800/50">
                            <button
                                onClick={handleSettle}
                                disabled={payLoading || !payAmount || parseFloat(payAmount) <= 0}
                                className="w-full py-5 bg-[#3498DB] hover:bg-[#2980B9] text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-3 group"
                            >
                                {payLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />}
                                Process Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REFUND MODAL */}
            {isRefundModalOpen && selectedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-left">
                    <form onSubmit={submitRefund} className="bg-white dark:bg-[#161B2E] rounded-[2.5rem] w-full max-w-md p-0 shadow-2xl relative overflow-hidden">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                                    <RotateCcw size={20} strokeWidth={3} />
                                </div>
                                Issue Refund
                            </h3>
                            <button type="button" onClick={() => setIsRefundModalOpen(false)} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Items for Refund</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedSale.items.map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => toggleRefundItem(item.id)}
                                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between text-left ${selectedRefundItems.has(item.id)
                                                ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/10'
                                                : 'border-slate-50 dark:border-slate-800'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedRefundItems.has(item.id) ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}>
                                                    {selectedRefundItems.has(item.id) && <X size={10} className="text-white" />}
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.productName}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400">ETB {item.total.toLocaleString()}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-orange-50 dark:bg-orange-500/5 rounded-[1.5rem] border border-orange-100 dark:border-orange-800/50 flex justify-between items-center text-left">
                                <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-none">Total Refund</span>
                                <span className="text-2xl font-black text-orange-600">ETB {calculateRefundTotal().toLocaleString()}</span>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Source Account</label>
                                <select
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 outline-none font-bold appearance-none text-slate-700 dark:text-white"
                                    value={refundAccountId}
                                    onChange={e => setRefundAccountId(e.target.value)}
                                    required
                                >
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.balance.toLocaleString()} ETB)</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Reason for Refund</label>
                                <textarea
                                    required
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 outline-none resize-none font-medium min-h-[100px]"
                                    placeholder="Briefly explain why..."
                                    value={refundReason}
                                    onChange={e => setRefundReason(e.target.value)}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={!!processing}
                                className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {processing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                Confirm Refund
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <style jsx global>{`
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                .animate-slide-in {
                    animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1E293B;
                }
            `}</style>
        </div>
    );
}
