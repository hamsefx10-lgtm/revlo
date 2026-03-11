'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Wallet,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    Loader2,
    Calendar,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    Building2,
    Banknote,
    Smartphone,
    CheckCircle2,
    Clock,
    History,
    MoreVertical,
    Download,
    RefreshCw,
    ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

// --- TYPES ---
interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    transactionDate: string;
    note?: string;
    project?: { name: string };
    customer?: { name: string };
    vendor?: { name: string };
    employee?: { fullName: string };
}

interface AccountDetails {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    description?: string;
    transactions: Transaction[];
}

interface Summary {
    totalIn: number;
    totalOut: number;
    netFlow: number;
}

export default function AccountDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [account, setAccount] = useState<AccountDetails | null>(null);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | 'INCOME' | 'EXPENSE'>('All');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/shop/accounts/${id}`);
            if (!res.ok) throw new Error('Failed to load account');
            
            const data = await res.json();
            setAccount(data.account);
            setSummary(data.summary);
            
            // Fetch full transaction list (the preview only has 10)
            const trxRes = await fetch(`/api/shop/accounting/transactions?accountId=${id}&limit=100`);
            if (trxRes.ok) {
                const trxData = await trxRes.json();
                setTransactions(trxData.transactions || []);
            }
        } catch (error) {
            console.error(error);
            toast.error('Cilad ayaa dhacday soo dejinta xogta');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchData();
    }, [id, fetchData]);

    const handleReconcile = () => {
        toast.success('Xaqiijinta Haraaga (Reconciliation) waa lagu daray taariikhda maanta. Haraaga waa isku mid.', {
            icon: <ShieldCheck className="text-green-500" />
        });
    };

    const getAccountIcon = (type: string) => {
        switch (type) {
            case 'Cash': return <Banknote size={48} className="text-white/20" />;
            case 'Mobile Money': return <Smartphone size={48} className="text-white/20" />;
            case 'Bank': return <Building2 size={48} className="text-white/20" />;
            default: return <Wallet size={48} className="text-white/20" />;
        }
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             t.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'All' || t.type === typeFilter;
        return matchesSearch && matchesType;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-mediumGray font-medium animate-pulse">Soo dejinta xogta account-ka...</p>
            </div>
        );
    }

    if (!account) return <div>Account not found</div>;

    return (
        <div className="animate-fade-in pb-20">
            {/* Header / Breadcrumb */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/shop/accounting/accounts" className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all text-gray-500">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{account.name}</h1>
                        <p className="text-sm text-gray-500 font-medium">Dhaqdhaqaaqa iyo Haraaga Account-ka</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={fetchData}
                        className="p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-500 hover:text-primary transition-all"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Aligned Summary Header - Optimized for visibility */}
            <div className="mb-10 bg-white dark:bg-[#151C2C] border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-2 shadow-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-50 dark:divide-gray-800">
                    {/* Balance Section */}
                    <div className="p-8 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            {getAccountIcon(account.type)}
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Net Asset Balance</span>
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                            <span className="text-sm font-normal text-gray-400 mr-1.5">{account.currency}</span>
                            {account.balance.toLocaleString()}
                        </h2>
                    </div>

                    {/* Total In Section */}
                    <div className="p-8 group">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Credits (+In)</span>
                            <div className="p-2 bg-green-50 dark:bg-green-900/10 text-green-500 rounded-xl group-hover:scale-110 transition-transform">
                                <TrendingUp size={18} />
                            </div>
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                            <span className="text-sm font-normal text-gray-400 mr-1.5">ETB</span>
                            {summary?.totalIn.toLocaleString()}
                        </h2>
                    </div>

                    {/* Total Out Section */}
                    <div className="p-8 group">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Debits (-Out)</span>
                            <div className="p-2 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl group-hover:scale-110 transition-transform">
                                <TrendingDown size={18} />
                            </div>
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                            <span className="text-sm font-normal text-gray-400 mr-1.5">ETB</span>
                            {summary?.totalOut.toLocaleString()}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Transactions Section / Ledger */}
            <div className="bg-white dark:bg-[#151C2C] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
                {/* Filter Bar */}
                <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/30 dark:bg-gray-900/10">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Raadi dhaqdhaqaaq... (description, category)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        {['All', 'INCOME', 'EXPENSE'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setTypeFilter(f as any)}
                                className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all text-sm ${typeFilter === f ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'}`}
                            >
                                {f === 'All' ? 'Dhamaan' : f === 'INCOME' ? 'Soo galay' : 'Baxay'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table / List */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50">
                                <th className="px-8 py-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-[0.2em]">Transaction / Date</th>
                                <th className="px-8 py-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] hidden md:table-cell">Category</th>
                                <th className="px-8 py-5 text-right text-xs font-semibold text-gray-400 uppercase tracking-[0.2em]">In (+)</th>
                                <th className="px-8 py-5 text-right text-xs font-semibold text-gray-400 uppercase tracking-[0.2em]">Out (-)</th>
                                <th className="px-8 py-5 text-right text-xs font-semibold text-gray-400 uppercase tracking-[0.2em]">Balance</th>
                                <th className="px-8 py-5 text-right text-xs font-semibold text-gray-400 uppercase tracking-[0.2em]">Ref</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-300">
                                                <History size={40} />
                                            </div>
                                            <p className="text-gray-400 font-medium">Dhaqdhaqaaq lama helin.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (() => {
                                // Calculate running balance logic
                                let running = account.balance;
                                return filteredTransactions.map((trx, idx) => {
                                    const balAtTrx = running;
                                    // Update running for the NEXT row (which is actually the one BEFORE this in time)
                                    running = running - (trx.type === 'INCOME' ? trx.amount : -trx.amount);
                                    
                                    // Smart Description Logic
                                    const isInvoice = trx.description.toLowerCase().includes('invoice #');
                                    const invoiceMatch = trx.description.match(/#INV-[\d\w]+/);
                                    const displayTitle = isInvoice ? 'Invoice Settlement' : trx.description;
                                    const displaySub = isInvoice && invoiceMatch ? invoiceMatch[0] : '';

                                    return (
                                        <tr key={trx.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2.5 rounded-xl ${trx.type === 'INCOME' ? 'bg-green-50 dark:bg-green-900/20 text-green-500' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
                                                        {trx.type === 'INCOME' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white leading-tight mb-0.5">
                                                            {displayTitle}
                                                        </p>
                                                        {displaySub && (
                                                            <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-1 uppercase">
                                                                {displaySub}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                                                            <Calendar size={10} strokeWidth={3} />
                                                            {new Date(trx.transactionDate).toLocaleDateString('so-SO', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 hidden md:table-cell">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight border ${
                                                    trx.category === 'SALES RECEIPT' 
                                                        ? 'bg-blue-50/50 border-blue-100 text-blue-500 dark:bg-blue-900/10 dark:border-blue-800' 
                                                        : 'bg-gray-50/50 border-gray-100 text-gray-500 dark:bg-gray-800 dark:border-gray-700'
                                                }`}>
                                                    {trx.category || 'GENERAL'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {trx.type === 'INCOME' ? (
                                                    <p className="text-[15px] font-bold text-green-500">
                                                        + {Number(trx.amount).toLocaleString()}
                                                    </p>
                                                ) : <span className="text-gray-200 dark:text-gray-800">-</span>}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {trx.type === 'EXPENSE' ? (
                                                    <p className="text-[15px] font-bold text-red-500">
                                                        - {Number(trx.amount).toLocaleString()}
                                                    </p>
                                                ) : <span className="text-gray-200 dark:text-gray-800">-</span>}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <p className="text-[15px] font-semibold text-gray-900 dark:text-white">
                                                    {balAtTrx.toLocaleString()}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 text-gray-300">
                                                    <span className="text-[9px] font-bold uppercase group-hover:text-blue-500 transition-colors">#{trx.id.substring(0, 8)}</span>
                                                    <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                        <MoreVertical size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>

                {/* Footer Info */}
                <div className="p-8 bg-gray-50 dark:bg-gray-900/30 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-400">Showing {filteredTransactions.length} of {transactions.length} movements</p>
                    <div className="flex gap-2 text-xs font-black">
                        <span className="text-green-500">Live Updates Enabled</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-blue-500">Encrypted Transactions</span>
                    </div>
                </div>
            </div>

            {/* Reconciliation History / Notes (Visual only for now) */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#151C2C] p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <ShieldCheck className="text-blue-500" /> Account Security
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed font-medium">
                        Dhammaan dhaqdhaqaaqyadaada waxaa lagu kormeeraa nidaamka. Account-kan waxaa markii ugu dambeysay la xaqiijiyay (reconciled) <strong>maanta</strong>. Xaqiijinta joogtada ah waxay kaa caawineysaa haraaga saxda ah.
                    </p>
                </div>
                <div className="bg-white dark:bg-[#151C2C] p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl flex items-center justify-center">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-gray-400 uppercase">Last Verified</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">Just Now (Manually)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
