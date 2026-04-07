'use client';

import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Users,
    ArrowLeft,
    Loader2,
    DollarSign,
    Clock,
    CheckCircle2,
    MessageCircle,
    ChevronRight,
    Search,
    TrendingUp,
    Scale
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { format, isAfter } from 'date-fns';

interface DebtsReportCompanyDebt {
  id?: string;
  lender?: string;
  client?: string;
  customerName?: string;
  amount?: number;
  paid?: number;
  received?: number;
  remaining?: number;
  dueDate?: string;
  status: string;
}

export default function CoreReceivablesPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [receivables, setReceivables] = useState<DebtsReportCompanyDebt[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/reports/debts');
            if (res.ok) {
                const data = await res.json();
                // Get general company debts (which act as receivables when owed to us)
                const clientReceivs = data.clientReceivables || data.receivables || [];
                
                // Ensure we separate out actual receivables vs payables just in case
                // Our API handles this but doing a soft filter just in case
                setReceivables(clientReceivs.filter((r: any) => !r.projectId && !r.isLiability));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const sendWhatsAppReminder = (r: DebtsReportCompanyDebt) => {
        const clientName = r.client || r.customerName || 'Customer';
        const message = `Asc ${clientName}, waxaad naga haysataa deyn dhan ETB ${(r.remaining || 0).toLocaleString()}. Fadlan nala soo socodsii haddii aad bixisay. Mahadsanid!`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    // Analytics Calculations
    const totalOutstanding = receivables.reduce((sum, r) => sum + (r.remaining || 0), 0);
    const overdueCount = receivables.filter(r => r.dueDate && isAfter(new Date(), new Date(r.dueDate))).length;
    
    // Safety matching
    const getClientName = (r: DebtsReportCompanyDebt) => r.client || r.customerName || r.lender || '--';

    const filteredReceivables = receivables.filter(r =>
        getClientName(r).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F1A] pb-20 font-sans w-full p-4 lg:p-8 relative">
            {/* TOP HEADER */}
            <div className="max-w-[1600px] mx-auto mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <Link href="/accounting" className="group text-slate-400 hover:text-[#3498DB] transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Dib u noqo
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-4">
                            <div className="p-4 bg-blue-500/10 rounded-[1.5rem] text-blue-600 dark:text-blue-400 shadow-sm">
                                <TrendingUp size={32} strokeWidth={2.5} />
                            </div>
                            Core Receivables
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-3 font-medium text-sm max-w-md">
                            Halkan ka maamul dhamaan lacagaha kugu maqan (Deymaha aad bixisay / macaamiisha cusub).
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3498DB] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search client name..."
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
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Lacagta Orodka (Total)</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                            {totalOutstanding.toLocaleString()}
                        </p>
                        <span className="text-[10px] font-black text-slate-300 uppercase">ETB</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#161B2E] p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[50px] rounded-full"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-rose-600 dark:text-rose-400">
                            <Clock size={24} />
                        </div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Deymaha Waqtigooda Dhaafay</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                            {overdueCount}
                        </p>
                        <span className="text-[10px] font-black text-slate-300 uppercase">Customers</span>
                    </div>
                </div>

                <div className="bg-[#0F172A] p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 relative overflow-hidden group">
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/5 rounded-2xl text-emerald-400">
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Deymaha Jogsan/No-Action</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black text-white tracking-tighter tabular-nums">
                            {receivables.length > 0 ? Math.round(((receivables.length - overdueCount) / receivables.length) * 100) : 100}%
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
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Outstanding Receivables Ledger
                        </h2>
                        <div className="flex items-center gap-4">
                            <Link href="/accounting/transactions/add" className="px-4 py-2 bg-[#3498DB] hover:bg-[#2980B9] text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all">
                                Record Collection/Debt
                            </Link>
                            <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {filteredReceivables.length} Active Records
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96 gap-4">
                            <Loader2 className="animate-spin text-[#3498DB]" size={40} strokeWidth={3} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Debt Records...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-6 px-10">Client / Customer</th>
                                        <th className="py-6 px-4">Amount Issued</th>
                                        <th className="py-6 px-4 text-center">Due Date</th>
                                        <th className="py-6 px-4 text-center">Status</th>
                                        <th className="py-6 px-4 text-right">Remaining Balance</th>
                                        <th className="py-6 px-10 text-right">Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {filteredReceivables.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-32 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-30">
                                                    <CheckCircle2 size={64} strokeWidth={1} className="text-emerald-500" />
                                                    <p className="font-black text-slate-500 uppercase tracking-widest text-xs">All clear! No outstanding balances.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredReceivables.map(r => {
                                        const isOverdue = r.dueDate && isAfter(new Date(), new Date(r.dueDate));
                                        const cname = getClientName(r);
                                        return (
                                            <tr key={r.id || cname} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200">
                                                <td className="py-6 px-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-black text-xs uppercase">
                                                            {cname.substring(0, 2)}
                                                        </div>
                                                        <p className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{cname}</p>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4 font-mono text-[11px] font-bold text-slate-500">
                                                    ETB {(r.amount || 0).toLocaleString()}
                                                </td>
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
                                                        {(r.remaining || 0).toLocaleString()} <span className="text-[9px] opacity-40 italic ml-1 align-top">ETB</span>
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
                                                        <Link
                                                            href="/accounting/transactions"
                                                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-[#3498DB] transition-all"
                                                            title="View Transactions"
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
            
            <style jsx global>{`
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
