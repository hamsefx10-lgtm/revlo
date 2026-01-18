'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Filter,
    Download,
    Calendar,
    Search,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    Wallet,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Link as LinkIcon,
    ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface Transaction {
    id: string;
    transactionDate: string;
    type: string;
    description: string;
    amount: number;
    category?: string;
    note?: string;
    expenseId?: string;
    account: {
        name: string;
        type: string;
    };
    user: {
        fullName: string;
    } | null;
}

interface Account {
    id: string;
    name: string;
    type: string;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters & Search
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [filterType, setFilterType] = useState('All');
    const [filterAccount, setFilterAccount] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAccounts();
        fetchTransactions();
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [dateRange, filterType, filterAccount]);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/shop/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                startDate: dateRange.start,
                endDate: dateRange.end,
                type: filterType,
                accountId: filterAccount,
                limit: '200'
            });

            const res = await fetch(`/api/shop/accounting/transactions?${params}`);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.transactions || []);
            } else {
                toast.error('Failed to load transactions');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({
            Date: new Date(t.transactionDate).toLocaleDateString(),
            Type: t.type,
            Description: t.description,
            Category: t.category,
            Amount: t.amount,
            Account: t.account.name,
            'Created By': t.user?.fullName || 'System',
            Note: t.note
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        XLSX.writeFile(wb, `Transactions_${dateRange.start}_to_${dateRange.end}.xlsx`);
    };

    // --- Helpers ---

    const getAmountColor = (type: string) => {
        const t = type.toUpperCase();
        if (t === 'INCOME' || t === 'TRANSFER_IN' || t === 'DEPOSIT') return 'text-green-500';
        if (t === 'EXPENSE' || t === 'TRANSFER_OUT' || t === 'WITHDRAWAL') return 'text-red-500';
        return 'text-gray-900 dark:text-white';
    };

    const getTypeIcon = (type: string) => {
        const t = type.toUpperCase();
        if (t === 'INCOME' || t === 'DEPOSIT') return <ArrowDownLeft size={18} className="text-green-500" />;
        if (t === 'EXPENSE' || t === 'WITHDRAWAL') return <ArrowUpRight size={18} className="text-red-500" />;
        if (t.includes('TRANSFER')) return <RefreshCw size={18} className="text-blue-500" />;
        return <Wallet size={18} className="text-gray-400" />;
    };

    // Calculate Summary Stats from current view
    const stats = transactions.reduce((acc, curr) => {
        const t = curr.type.toUpperCase();
        const isIncome = ['INCOME', 'TRANSFER_IN', 'DEPOSIT'].includes(t);
        const isExpense = ['EXPENSE', 'TRANSFER_OUT', 'WITHDRAWAL'].includes(t);

        if (isIncome) acc.income += Number(curr.amount);
        if (isExpense) acc.expense += Number(curr.amount);
        return acc;
    }, { income: 0, expense: 0 });

    const filteredTransactions = transactions.filter(t =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Smart Link Logic
    const renderSmartDescription = (t: Transaction) => {
        let link = null;
        let linkText = '';

        if (t.expenseId) {
            // Can't easily link to modal, but expense page usually has list. 
            // Ideally we'd have a detailed expense page /shop/expenses/[id].
            // For now, we just indicate it.
        }

        if (t.note?.includes('Ref Sale:')) {
            const saleId = t.note.split('Ref Sale:')[1].trim();
            link = `/shop/sales/${saleId}`;
            linkText = 'View Invoice';
        }

        if (t.description.includes('PO-') && t.description.includes('Bill Payment')) {
            // Try to find Purchase ID? Without it, maybe just link to purchases list
            link = '/shop/purchases';
            linkText = 'View Purchase';
        }

        return (
            <div>
                <div className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                        {getTypeIcon(t.type)}
                    </div>
                    {t.description}
                </div>
                <div className="flex items-center gap-2 mt-1 pl-8">
                    {t.note && <p className="text-xs text-gray-400">{t.note}</p>}
                    {link && (
                        <Link href={link} className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full transition-colors">
                            {linkText} <ExternalLink size={10} />
                        </Link>
                    )}
                </div>
            </div>
        );
    };


    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] font-sans pb-20 w-full animate-fade-in">
            {/* Header */}
            <div className="bg-white dark:bg-[#151C2C] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 shadow-sm/50">
                <div className="w-full px-4 md:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/shop/accounting" className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all text-gray-500">
                            <ArrowLeft size={22} strokeWidth={2} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none mb-1.5">Transactions</h1>
                            <p className="text-sm text-gray-500 font-medium">History of all income and expenses</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full px-4 md:px-6 py-6 space-y-6">

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#151C2C] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Income</p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-xl md:text-2xl font-black text-green-500">ETB {stats.income.toLocaleString()}</p>
                            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-500"><TrendingUp size={18} /></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#151C2C] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Expense</p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-xl md:text-2xl font-black text-red-500">ETB {stats.expense.toLocaleString()}</p>
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500"><TrendingDown size={18} /></div>
                        </div>
                    </div>
                    <div className="col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl text-white shadow-lg shadow-blue-500/20 flex flex-col justify-between relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-blue-100 uppercase tracking-wider">Net Cash Flow</p>
                            <p className="text-2xl md:text-3xl font-black mt-1">ETB {(stats.income - stats.expense).toLocaleString()}</p>
                        </div>
                        <Wallet className="absolute right-4 top-1/2 -translate-y-1/2 text-white opacity-10" size={60} />
                    </div>
                </div>

                {/* Filters & Actions */}
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
                                placeholder="Search ref, note, category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>

                        {/* Account Filter */}
                        <div className="relative w-full md:w-auto">
                            <select
                                value={filterAccount}
                                onChange={e => setFilterAccount(e.target.value)}
                                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="All">All Accounts</option>
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                            <CreditCard size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto justify-between md:justify-end">
                        {/* Type Filter */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                            {['All', 'INCOME', 'EXPENSE'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setFilterType(t)}
                                    className={`px-3 md:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === t ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {t.charAt(0) + t.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleExport}
                            className="whitespace-nowrap px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                        >
                            <Download size={18} /> <span className="hidden md:inline">Export</span> CSV
                        </button>
                    </div>
                </div>

                {/* --- TABLE VIEW (Desktop) --- */}
                <div className="hidden md:block bg-white dark:bg-[#151C2C] border border-gray-100 dark:border-gray-800 rounded-[24px] overflow-hidden shadow-sm min-h-[500px]">
                    {loading ? (
                        <div className="p-20 text-center text-gray-400">Loading transactions...</div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="p-20 text-center text-gray-400">No transactions found matching your criteria.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-400 font-bold bg-gray-50/50 dark:bg-gray-800/20">
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Description & Ref</th>
                                        <th className="px-6 py-4">Account</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredTransactions.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-700 dark:text-gray-300 text-sm">
                                                    {new Date(t.transactionDate).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {new Date(t.transactionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {renderSmartDescription(t)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 w-fit">
                                                        {t.account?.name || 'N/A'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 mt-1 pl-1">{t.account?.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-gray-500">{t.category || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-black text-sm block ${getAmountColor(t.type)}`}>
                                                    {['EXPENSE', 'WITHDRAWAL', 'TRANSFER_OUT'].includes(t.type.toUpperCase()) ? '-' : '+'}
                                                    ETB {t.amount.toLocaleString()}
                                                </span>
                                                <span className="text-[10px] text-gray-400">by {t.user?.fullName ? t.user.fullName.split(' ')[0] : 'System'}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* --- MOBILE CARD VIEW (Phone) --- */}
                <div className="block md:hidden space-y-4">
                    {loading ? (
                        <div className="p-10 text-center text-gray-400">Loading...</div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">No transactions found.</div>
                    ) : (
                        filteredTransactions.map(t => (
                            <div key={t.id} className="bg-white dark:bg-[#151C2C] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            {getTypeIcon(t.type)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{t.description}</p>
                                            <p className="text-xs text-gray-500">{t.category} • {new Date(t.transactionDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`font-black text-sm ${getAmountColor(t.type)}`}>
                                        {['EXPENSE', 'WITHDRAWAL', 'TRANSFER_OUT'].includes(t.type.toUpperCase()) ? '-' : '+'}
                                        {Number(t.amount).toLocaleString()}
                                    </span>
                                </div>

                                {t.note && (
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl text-xs text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800">
                                        {t.note}
                                        {t.note.includes('Ref Sale:') && (
                                            <Link href={`/shop/sales/${t.note.split('Ref Sale:')[1].trim()}`} className="block mt-1 text-blue-500 font-bold flex items-center gap-1">
                                                View Invoice <ExternalLink size={10} />
                                            </Link>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{t.account.name}</span>
                                    <span className="text-[10px] text-gray-400">By {t.user?.fullName || 'System'}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
