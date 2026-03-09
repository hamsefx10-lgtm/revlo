'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Calendar,
    Users,
    ArrowLeft,
    Loader2,
    DollarSign,
    Clock,
    CheckCircle2,
    MessageCircle,
    CreditCard,
    X,
    Send,
    TrendingUp,
    ChevronRight,
    Search,
    Filter
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { format, isAfter, subDays } from 'date-fns';

export default function ReceivablesPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [receivables, setReceivables] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Quick Pay Sidebar State
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [isPaySidebarOpen, setIsPaySidebarOpen] = useState(false);
    const [payAmount, setPayAmount] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [payLoading, setPayLoading] = useState(false);

    useEffect(() => {
        fetchData();
        fetchAccounts();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/shop/accounting/receivables');
            if (res.ok) {
                const data = await res.json();
                setReceivables(data.receivables || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const openPaySidebar = (sale: any) => {
        setSelectedSale(sale);
        setPayAmount(sale.dueAmount.toString());
        setIsPaySidebarOpen(true);
        if (accounts.length > 0) setSelectedAccount(accounts[0].id);
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
                    description: `Settlement for Invoice #${selectedSale.invoiceNumber}`
                })
            });

            if (res.ok) {
                toast({
                    title: 'Payment Recorded',
                    description: `Successfully collected ETB ${parseFloat(payAmount).toLocaleString()} for Invoice #${selectedSale.invoiceNumber}`,
                    variant: 'default'
                });
                setIsPaySidebarOpen(false);
                fetchData();
            } else {
                const error = await res.json();
                throw new Error(error.error || 'Failed to settle');
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setPayLoading(false);
        }
    };

    const sendWhatsAppReminder = (sale: any) => {
        const phone = sale.customerPhone || '';
        const message = `Asc ${sale.customer}, waxaad naga haysataa Invoice #${sale.invoiceNumber} oo dhan ETB ${sale.dueAmount.toLocaleString()}. Fadlan hadii aad bixisay nala soo socodsii. Mahadsanid!`;
        const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    // Analytics Calculations
    const totalOutstanding = receivables.reduce((sum, r) => sum + r.dueAmount, 0);
    const overdueCount = receivables.filter(r => r.dueDate && isAfter(new Date(), new Date(r.dueDate))).length;
    const filteredReceivables = receivables.filter(r =>
        r.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F1A] pb-20 font-sans w-full p-4 lg:p-8 relative">

            {/* TOP HEADER */}
            <div className="max-w-[1600px] mx-auto mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <Link href="/shop/accounting" className="group text-slate-400 hover:text-[#3498DB] transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Control Panel
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-4">
                            <div className="p-4 bg-emerald-500/10 rounded-[1.5rem] text-emerald-600 dark:text-emerald-400 shadow-sm">
                                <TrendingUp size={32} strokeWidth={2.5} />
                            </div>
                            Collections Center
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-3 font-medium text-sm max-w-md">
                            Manage your accounts receivable, track aging invoices, and streamline your collection process.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3498DB] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search by customer or invoice..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 pr-6 py-4 bg-white dark:bg-[#161B2E] border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#3498DB] transition-all w-80 shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI ANALYTICS CARDS */}
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white dark:bg-[#161B2E] p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400">
                            <DollarSign size={24} />
                        </div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Outstanding</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                            {totalOutstanding.toLocaleString()}
                        </p>
                        <span className="text-[10px] font-black text-slate-300 uppercase">ETB Owed</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#161B2E] p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[50px] rounded-full"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-rose-600 dark:text-rose-400">
                            <Clock size={24} />
                        </div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Overdue Invoices</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                            {overdueCount}
                        </p>
                        <span className="text-[10px] font-black text-slate-300 uppercase">Past Due Date</span>
                    </div>
                </div>

                <div className="bg-[#0F172A] p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 relative overflow-hidden group">
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/5 rounded-2xl text-emerald-400">
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Collection Rate</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black text-white tracking-tighter tabular-nums">
                            {Math.round(((receivables.length - overdueCount) / (receivables.length || 1)) * 100)}%
                        </p>
                        <span className="text-[10px] font-black text-slate-500 uppercase italic">On-Time Health</span>
                    </div>
                </div>
            </div>

            {/* MAIN TABLE SECTION */}
            <div className="max-w-[1600px] mx-auto">
                <div className="bg-white dark:bg-[#161B2E] border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden min-h-[500px]">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Outstanding Receivables Ledger
                        </h2>
                        <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {filteredReceivables.length} Active Invoices
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96 gap-4">
                            <Loader2 className="animate-spin text-[#3498DB]" size={40} strokeWidth={3} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Data...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-6 px-10">Client / Customer</th>
                                        <th className="py-6 px-4">Invoice ID</th>
                                        <th className="py-6 px-4 text-center">Due Date</th>
                                        <th className="py-6 px-4 text-center">Collection Status</th>
                                        <th className="py-6 px-4 text-right">Balance Due</th>
                                        <th className="py-6 px-10 text-right">Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {filteredReceivables.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-32 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-30">
                                                    <CheckCircle2 size={64} strokeWidth={1} />
                                                    <p className="font-black text-slate-500 uppercase tracking-widest text-xs">All clear! No outstanding balances.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredReceivables.map(r => {
                                        const isOverdue = r.dueDate && isAfter(new Date(), new Date(r.dueDate));
                                        return (
                                            <tr key={r.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200">
                                                <td className="py-6 px-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-black text-xs uppercase">
                                                            {r.customer.substring(0, 2)}
                                                        </div>
                                                        <p className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{r.customer}</p>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4 font-mono text-[10px] font-bold text-slate-400 italic">#{r.invoiceNumber}</td>
                                                <td className="py-6 px-4 text-center">
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isOverdue ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10' : 'bg-slate-50 text-slate-500 dark:bg-slate-800'
                                                        }`}>
                                                        {r.dueDate ? format(new Date(r.dueDate), 'MMM dd, yyyy') : 'No Date'}
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4 text-center">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${r.status === 'Partial' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400'
                                                        }`}>
                                                        {r.status || 'UNPAID'}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-4 text-right">
                                                    <p className="text-lg font-black text-slate-900 dark:text-white tracking-tighter tabular-nums drop-shadow-sm">
                                                        {r.dueAmount.toLocaleString()} <span className="text-[9px] opacity-40 italic ml-1 align-top">ETB</span>
                                                    </p>
                                                </td>
                                                <td className="py-6 px-10 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => sendWhatsAppReminder(r)}
                                                            className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                            title="WhatsApp Reminder"
                                                        >
                                                            <MessageCircle size={18} strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            onClick={() => openPaySidebar(r)}
                                                            className="flex items-center gap-2 px-5 py-3 bg-[#3498DB] hover:bg-[#2980B9] text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20"
                                                        >
                                                            <CreditCard size={14} /> Record Pay
                                                        </button>
                                                        <Link
                                                            href={`/shop/sales/${r.id}`}
                                                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-[#3498DB] transition-all"
                                                        >
                                                            <ChevronRight size={18} />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
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
                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                                    <CreditCard size={20} strokeWidth={3} />
                                </div>
                                Record Settlement
                            </h3>
                            <button onClick={() => setIsPaySidebarOpen(false)} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="space-y-8">
                                <div className="bg-slate-50 dark:bg-blue-500/5 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selected Invoice</p>
                                    <div className="flex justify-between items-baseline">
                                        <p className="text-2xl font-black text-slate-800 dark:text-white">#{selectedSale?.invoiceNumber}</p>
                                        <p className="text-xs font-bold text-[#3498DB]">{selectedSale?.customer}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Balance Due</span>
                                        <span className="text-sm font-black text-rose-500">{selectedSale?.dueAmount.toLocaleString()} ETB</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Amount (ETB)</label>
                                    <input
                                        type="number"
                                        value={payAmount}
                                        onChange={(e) => setPayAmount(e.target.value)}
                                        className="w-full px-6 py-5 bg-white dark:bg-[#0B0F1A] border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-2xl font-black focus:outline-none focus:border-[#3498DB] transition-all"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deposit To Account</label>
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
                                Finalize Collection
                            </button>
                        </div>
                    </div>
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
