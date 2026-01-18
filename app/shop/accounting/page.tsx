'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    Download,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    Loader2,
    X,
    Calendar,
    DollarSign,
    Tag,
    FileText,
    ArrowRightLeft,
    Lock,
    Users,
    History,
    Truck
} from 'lucide-react';


import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from '@/components/shop/ui/MetricCard';
import { format, subDays, startOfMonth, startOfYear } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

// --- TYPES ---
interface Transaction {
    id: string;
    description: string;
    type: 'Income' | 'Expense';
    category: string;
    amount: number;
    date: string;
    reference: string;
}

export default function AccountingPage() {
    const { toast } = useToast();
    const [filter, setFilter] = useState<'All' | 'Income' | 'Expense'>('All');
    const [dateRange, setDateRange] = useState('This Month');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Data State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, netProfit: 0 });
    const [chartData, setChartData] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Category Modal State
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [expenseCategories, setExpenseCategories] = useState([
        'General', 'Rent', 'Utilities', 'Salary', 'Maintenance', 'Marketing', 'Other'
    ]);

    const handleAddCategory = () => {
        if (!newCategoryName) return;
        setExpenseCategories(prev => [...prev, newCategoryName]);
        setFormData(prev => ({ ...prev, category: newCategoryName }));
        setIsNewCategoryModalOpen(false);
        setNewCategoryName('');
    };

    // Form State
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'General',
        date: new Date().toISOString().split('T')[0],
        accountId: '',
        notes: ''
    });

    const [transferData, setTransferData] = useState({
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });

    useEffect(() => {
        handleRangeChange('This Month');
    }, []);

    useEffect(() => {
        if (startDate && endDate) fetchData();
    }, [startDate, endDate]);

    const handleRangeChange = (range: string) => {
        setDateRange(range);
        const now = new Date();
        let start = now;

        switch (range) {
            case 'Today': start = now; break;
            case 'Last 7 Days': start = subDays(now, 7); break;
            case 'This Month': start = startOfMonth(now); break;
            case 'This Year': start = startOfYear(now); break;
        }

        setStartDate(start.toISOString());
        setEndDate(now.toISOString());
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ledgerRes, chartRes] = await Promise.all([
                fetch(`/api/shop/accounting/ledger?startDate=${startDate}&endDate=${endDate}`),
                fetch('/api/shop/accounting/chart')
            ]);

            const ledgerData = await ledgerRes.json();
            const chartDataRaw = await chartRes.json();

            if (ledgerData.transactions) {
                setTransactions(ledgerData.transactions);
                setStats(ledgerData.stats);
            }

            if (chartDataRaw.chartData) {
                setChartData(chartDataRaw.chartData);
            }

            // Fetch Accounts
            const accRes = await fetch('/api/shop/accounts');
            if (accRes.ok) {
                const accData = await accRes.json();
                setAccounts(accData.accounts || []);
                // Set default account if not set
                if (accData.accounts?.length > 0 && !formData.accountId) {
                    setFormData(prev => ({ ...prev, accountId: accData.accounts[0].id }));
                }
            }

        } catch (error) {
            console.error('Error fetching accounting data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        try {
            const response = await fetch('/api/shop/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error("Failed to create expense");

            toast({ title: 'Success', description: 'Expense recorded successfully.' });
            setIsModalOpen(false);
            setFormData({
                description: '',
                amount: '',
                category: 'General',
                date: new Date().toISOString().split('T')[0],
                accountId: accounts.length > 0 ? accounts[0].id : '',
                notes: ''
            });
            fetchData(); // Refresh
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to record expense', variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (transferData.fromAccountId === transferData.toAccountId) {
            toast({ title: 'Error', description: 'Source and destination accounts must be different', variant: 'destructive' });
            return;
        }
        setProcessing(true);
        try {
            const res = await fetch('/api/shop/accounting/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transferData)
            });

            if (!res.ok) throw new Error('Transfer failed');

            toast({ title: 'Success', description: 'Funds transferred successfully' });
            setIsTransferModalOpen(false);
            setTransferData({
                fromAccountId: '',
                toAccountId: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                description: ''
            });
            fetchData();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to transfer funds', variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    const filteredData = transactions.filter(t => filter === 'All' || t.type === filter);

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full relative">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-[#3498DB]">
                            <Wallet size={28} />
                        </div>
                        Accounting & Finance
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Track income, expenses, and financial health.</p>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                    {['Today', 'This Month', 'This Year'].map((range) => (
                        <button
                            key={range}
                            onClick={() => handleRangeChange(range)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dateRange === range
                                ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
                <Link href="/shop/accounting/accounts" className="whitespace-nowrap px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                    <Wallet size={18} /> Accounts
                </Link>
                <Link href="/shop/accounting/ledger" className="whitespace-nowrap px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                    <History size={18} /> General Ledger
                </Link>
                <Link href="/shop/accounting/journal" className="whitespace-nowrap px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                    <FileText size={18} /> Journal Entry
                </Link>
                <Link href="/shop/accounting/payables" className="whitespace-nowrap px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                    <ArrowDownLeft size={18} /> Payables
                </Link>
                <Link href="/shop/accounting/receivables" className="whitespace-nowrap px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                    <ArrowUpRight size={18} /> Receivables
                </Link>
                <Link href="/shop/accounting/till" className="whitespace-nowrap px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                    <Lock size={18} /> Till
                </Link>
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2"></div>

                <Link href="/shop/accounting/tax" className="whitespace-nowrap px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                    Tax Center
                </Link>
                <Link href="/shop/accounting/assets" className="whitespace-nowrap px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                    Fixed Assets
                </Link>
                <Link href="/shop/accounting/reconciliation" className="whitespace-nowrap px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                    Reconcile
                </Link>
                <Link href="/shop/reports/finance" className="whitespace-nowrap px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                    <Download size={18} /> Reports
                </Link>
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2"></div>
                <Link href="/shop/reports/aging/customer" className="whitespace-nowrap px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                    <Users size={18} /> Customer Aging
                </Link>
                <Link href="/shop/reports/aging/vendor" className="whitespace-nowrap px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                    <Truck size={18} /> Vendor Aging
                </Link>

                <button
                    onClick={() => setIsTransferModalOpen(true)}
                    className="whitespace-nowrap px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2"
                >
                    <ArrowRightLeft size={18} /> Transfer
                </button>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="whitespace-nowrap px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> Expense
                </button>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#3498DB]" />
                </div>
            ) : (
                <>
                    {/* STATS OVERVIEW */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Income */}
                        <MetricCard
                            label="Total Income"
                            value={`ETB ${stats.totalIncome.toLocaleString()}`}
                            trend={dateRange}
                            isPositive={true}
                            icon={TrendingUp}
                            variant="accent"
                        />

                        {/* Expense */}
                        <MetricCard
                            label="Total Expenses"
                            value={`ETB ${stats.totalExpense.toLocaleString()}`}
                            trend={dateRange}
                            isPositive={false}
                            icon={TrendingDown}
                            variant="danger"
                        />

                        {/* NET PROFIT */}
                        <div className="bg-[#2ECC71] p-6 rounded-[2rem] shadow-xl shadow-green-500/20 relative overflow-hidden text-white group">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                            <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-black/10 rounded-full blur-3xl"></div>

                            <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-2 relative z-10">Net Profit</p>
                            <h2 className="text-4xl font-black text-white mb-2 relative z-10">ETB {stats.netProfit.toLocaleString()}</h2>
                            <p className="text-green-100 text-sm font-medium relative z-10 opacity-80">
                                {stats.netProfit >= 0 ? 'Healthy profit margin.' : 'Operating at a loss.'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* CHART */}
                        <div className="lg:col-span-2 bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cash Flow (Last 7 Days)</h3>
                                <div className="flex gap-2">
                                    <span className="flex items-center gap-1 text-xs font-bold text-[#2ECC71]"><div className="w-2 h-2 rounded-full bg-[#2ECC71]"></div> Income</span>
                                    <span className="flex items-center gap-1 text-xs font-bold text-red-400"><div className="w-2 h-2 rounded-full bg-red-400"></div> Expense</span>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#2ECC71" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.5} className="dark:stroke-gray-700" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff', color: '#000' }}
                                        />
                                        <Area type="monotone" dataKey="income" stroke="#2ECC71" strokeWidth={3} fill="url(#colorIncome)" />
                                        <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} fill="url(#colorExpense)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* LEDGER / TRANSACTIONS LIST */}
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Ledger</h3>
                                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                    {['All', 'Income', 'Expense'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setFilter(tab as any)}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === tab ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar max-h-[400px]">
                                {filteredData.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 text-sm">No transactions found</div>
                                ) : (
                                    filteredData.map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-3 mb-2 rounded-xl border border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${t.type === 'Income' ? 'bg-[#2ECC71]/10 text-[#2ECC71]' : t.type === 'Expense' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                    {t.type === 'Income' ? <ArrowDownLeft size={18} /> : t.type === 'Expense' ? <ArrowUpRight size={18} /> : <ArrowRightLeft size={18} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{t.description}</p>
                                                    <p className="text-xs text-gray-500">{t.category} • {format(new Date(t.date), 'MMM dd')}</p>
                                                </div>
                                            </div>
                                            <span className={`font-black text-sm ${t.type === 'Income' ? 'text-[#2ECC71]' : t.type === 'Expense' ? 'text-red-500' : 'text-blue-500'}`}>
                                                {t.type === 'Income' ? '+' : t.type === 'Expense' ? '-' : ''} {t.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 text-center">
                                <button className="text-sm font-bold text-[#3498DB] hover:underline">View All Transactions</button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* EXPENSE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#1f2937] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Record Expense</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description *</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Shop Rent, Office Supplies"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Amount *</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-bold"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between items-center">
                                        Category
                                        <button
                                            type="button"
                                            onClick={() => setIsNewCategoryModalOpen(true)}
                                            className="text-[#3498DB] hover:underline flex items-center gap-1 text-[10px]"
                                        >
                                            + New
                                        </button>
                                    </label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-medium appearance-none"
                                        >
                                            {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Paid From Account</label>
                                    <div className="relative">
                                        <Wallet className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                        <select
                                            value={formData.accountId}
                                            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-medium appearance-none"
                                            required
                                        >
                                            <option value="">Select Account...</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold shadow-lg hover:opacity-90"
                                >
                                    {processing ? 'Saving...' : 'Save Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TRANSFER MODAL */}
            {isTransferModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#1f2937] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Transfer Funds</h3>
                            <button onClick={() => setIsTransferModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleTransfer} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">From Account</label>
                                    <div className="relative">
                                        <Wallet className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                        <select
                                            value={transferData.fromAccountId}
                                            onChange={(e) => setTransferData({ ...transferData, fromAccountId: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-medium appearance-none"
                                            required
                                        >
                                            <option value="">Select Source...</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id} disabled={acc.id === transferData.toAccountId}>
                                                    {acc.name} (ETB {acc.balance.toLocaleString()})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">To Account</label>
                                    <div className="relative">
                                        <Wallet className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                        <select
                                            value={transferData.toAccountId}
                                            onChange={(e) => setTransferData({ ...transferData, toAccountId: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-medium appearance-none"
                                            required
                                        >
                                            <option value="">Select Destination...</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id} disabled={acc.id === transferData.fromAccountId}>
                                                    {acc.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Amount</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            placeholder="0.00"
                                            value={transferData.amount}
                                            onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-bold"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Date</label>
                                    <input
                                        type="date"
                                        value={transferData.date}
                                        onChange={(e) => setTransferData({ ...transferData, date: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description (Optional)</label>
                                <textarea
                                    value={transferData.description}
                                    onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
                                    placeholder="e.g. End of day deposit"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-medium h-24 resize-none"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsTransferModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 py-3 rounded-xl bg-[#3498DB] text-white font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 hover:shadow-blue-600/30 transition-all flex justify-center items-center gap-2"
                                >
                                    {processing ? <Loader2 className="animate-spin" /> : <>Transfer Fund <ArrowRightLeft size={18} /></>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* NEW CATEGORY MODAL */}
            {isNewCategoryModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#1f2937] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">New Expense Category</h3>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Category Name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none mb-4 font-medium"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsNewCategoryModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100 font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAddCategory}
                                disabled={!newCategoryName}
                                className="px-6 py-2 rounded-lg bg-[#3498DB] text-white font-bold text-sm hover:bg-blue-600 disabled:opacity-50"
                            >
                                Add Category
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

