'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Wallet,
    Plus,
    CreditCard,
    Banknote,
    Building2,
    MoreVertical,
    Loader2,
    DollarSign,
    ArrowRightLeft,
    Trash2,
    Edit3,
    History,
    TrendingUp,
    TrendingDown,
    X,
    Smartphone
} from 'lucide-react';
import { toast } from 'sonner';

// --- TYPES ---
interface Account {
    id: string;
    name: string;
    type: string; // Bank, Cash, Mobile Money
    balance: number;
    currency: string;
    description?: string;
}

// --- COMPONENTS ---

export default function AccountsPage() {
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [filter, setFilter] = useState<'All' | 'Cash' | 'Bank' | 'Mobile Money'>('All');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [newAccount, setNewAccount] = useState({ name: '', type: 'Bank', balance: '', currency: 'ETB', description: '' });
    const [editAccount, setEditAccount] = useState<Account | null>(null);
    const [transferData, setTransferData] = useState({ fromAccountId: '', toAccountId: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/shop/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    // --- ACTIONS ---

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/shop/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAccount)
            });

            if (!res.ok) throw new Error('Failed to create');

            toast.success('Account created successfully');
            setIsCreateModalOpen(false);
            setNewAccount({ name: '', type: 'Bank', balance: '', currency: 'ETB', description: '' });
            fetchAccounts();
        } catch (error) {
            toast.error('Failed to create account');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/shop/accounts/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transferData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Transfer failed');

            toast.success('Funds transferred successfully');
            setIsTransferModalOpen(false);
            setTransferData({ fromAccountId: '', toAccountId: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
            fetchAccounts();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editAccount) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/shop/accounts/${editAccount.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editAccount)
            });

            if (!res.ok) throw new Error('Failed to update');

            toast.success('Account updated');
            setIsEditModalOpen(false);
            fetchAccounts();
        } catch (error) {
            toast.error('Failed to update account');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/shop/accounts/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to delete');

            toast.success(`${name} deleted`);
            fetchAccounts();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    // --- UTILS ---

    const getIcon = (type: string) => {
        switch (type) {
            case 'Cash': return <Banknote size={24} className="text-green-500" />;
            case 'Mobile Money': return <Smartphone size={24} className="text-orange-500" />;
            case 'Bank': return <Building2 size={24} className="text-blue-500" />;
            default: return <Wallet size={24} className="text-purple-500" />;
        }
    };

    const filteredAccounts = accounts.filter(acc => filter === 'All' || acc.type === filter);
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] font-sans pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-[#151C2C] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 shadow-sm/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/shop/dashboard" className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all text-gray-500">
                            <ArrowLeft size={22} strokeWidth={2} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none mb-1.5">Accounts & Assets</h1>
                            <p className="text-sm text-gray-500 font-medium">Manage cash flow, banks, and liquidity</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 space-y-8">

                {/* Top Section: Overview & Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Total Liquidity Card */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700 rotate-12"><Wallet size={180} /></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-white/10 backdrop-blur rounded-lg"><TrendingUp size={16} /></div>
                                <span className="text-blue-100 font-bold uppercase tracking-wider text-sm">Total Liquidity</span>
                            </div>
                            <h2 className="text-5xl font-black mb-8 tracking-tight">ETB {totalBalance.toLocaleString()}</h2>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="px-6 py-3 bg-white text-blue-600 rounded-xl font-black shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <Plus size={20} strokeWidth={3} /> Add Account
                                </button>
                                <button
                                    onClick={() => setIsTransferModalOpen(true)}
                                    className="px-6 py-3 bg-blue-500/30 hover:bg-blue-500/40 backdrop-blur-md rounded-xl font-bold border border-white/20 transition-all flex items-center gap-2"
                                >
                                    <ArrowRightLeft size={20} /> Transfer Funds
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats / Mini Cards */}
                    <div className="space-y-4 flex flex-col justify-center">
                        <div className="bg-white dark:bg-[#151C2C] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/10 text-green-500"><Banknote size={24} /></div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase">Cash on Hand</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">ETB {accounts.filter(a => a.type === 'Cash').reduce((s, a) => s + a.balance, 0).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#151C2C] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 text-blue-500"><Building2 size={24} /></div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase">Bank Balance</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">ETB {accounts.filter(a => a.type === 'Bank').reduce((s, a) => s + a.balance, 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['All', 'Cash', 'Bank', 'Mobile Money'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-6 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${filter === f ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg' : 'bg-white dark:bg-[#151C2C] text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Accounts Grid */}
                {loading ? (
                    <div className="flex justify-center py-20 animate-pulse"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                        {filteredAccounts.map(account => (
                            <div key={account.id} className="bg-white dark:bg-[#151C2C] rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative">

                                {/* Header */}
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                            {getIcon(account.type)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{account.type}</p>
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{account.name}</h3>
                                        </div>
                                    </div>

                                    <div className="relative group/menu">
                                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                            <MoreVertical size={20} />
                                        </button>
                                        {/* Dropdown - Simple Implementation */}
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-2 invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 transition-all z-20">
                                            <button
                                                onClick={() => { setEditAccount(account); setIsEditModalOpen(true); }}
                                                className="w-full text-left px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2"
                                            >
                                                <Edit3 size={16} /> Edit Details
                                            </button>
                                            <button
                                                onClick={() => handleDelete(account.id, account.name)}
                                                className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2"
                                            >
                                                <Trash2 size={16} /> Delete Account
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="mb-6">
                                    <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">
                                        <span className="text-lg text-gray-400 align-top mr-1">ETB</span>
                                        {account.balance.toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-2 text-green-500 text-xs font-bold">
                                        <span className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md flex items-center gap-1">
                                            <TrendingUp size={12} /> Live
                                        </span>
                                        <span>Updated just now</span>
                                    </div>
                                </div>

                                {/* Actions Footer */}
                                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setTransferData(prev => ({ ...prev, fromAccountId: account.id }));
                                            setIsTransferModalOpen(true);
                                        }}
                                        className="flex-1 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 text-gray-600 dark:text-gray-400 font-bold text-sm transition-all"
                                    >
                                        Transfer Out
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTransferData(prev => ({ ...prev, toAccountId: account.id }));
                                            setIsTransferModalOpen(true);
                                        }}
                                        className="flex-1 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-500 text-gray-600 dark:text-gray-400 font-bold text-sm transition-all"
                                    >
                                        Deposit
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Register New Card */}
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-gray-50/50 dark:bg-[#151C2C]/30 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[24px] p-6 flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group min-h-[200px]"
                        >
                            <div className="p-5 rounded-full bg-white dark:bg-gray-800 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                                <Plus size={32} />
                            </div>
                            <span className="font-bold text-lg">Register New Account</span>
                        </button>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}

            {/* CREATE MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#151C2C] rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">New Account</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-8 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Name</label>
                                <input required type="text" placeholder="e.g. CBE Main Branch" value={newAccount.name} onChange={e => setNewAccount({ ...newAccount, name: e.target.value })} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Bank', 'Cash', 'Mobile Money'].map(type => (
                                        <button key={type} type="button" onClick={() => setNewAccount({ ...newAccount, type })} className={`px-2 py-3 rounded-xl border text-xs font-bold transition-all ${newAccount.type === type ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{type}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Initial Balance</label>
                                <input type="number" placeholder="0.00" value={newAccount.balance} onChange={e => setNewAccount({ ...newAccount, balance: e.target.value })} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-70 flex justify-center">{isSubmitting ? <Loader2 className="animate-spin" /> : 'Create Account'}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* TRANSFER MODAL */}
            {isTransferModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#151C2C] rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2"><ArrowRightLeft className="text-blue-500" /> Transfer Funds</h3>
                                <p className="text-sm text-gray-500 mt-1">Move money between your accounts</p>
                            </div>
                            <button onClick={() => setIsTransferModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleTransfer} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6 relative">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">From</label>
                                    <select required value={transferData.fromAccountId} onChange={e => setTransferData({ ...transferData, fromAccountId: e.target.value })} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-bold text-gray-900 dark:text-white appearance-none cursor-pointer">
                                        <option value="">Select Account</option>
                                        {accounts.filter(a => a.id !== transferData.toAccountId).map(a => <option key={a.id} value={a.id}>{a.name} ({a.balance.toLocaleString()})</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center justify-center absolute left-1/2 top-10 -translate-x-1/2 z-10">
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm"><ArrowRightLeft size={16} className="text-gray-400" /></div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">To</label>
                                    <select required value={transferData.toAccountId} onChange={e => setTransferData({ ...transferData, toAccountId: e.target.value })} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-bold text-gray-900 dark:text-white appearance-none cursor-pointer">
                                        <option value="">Select Account</option>
                                        {accounts.filter(a => a.id !== transferData.fromAccountId).map(a => <option key={a.id} value={a.id}>{a.name} ({a.balance.toLocaleString()})</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount (ETB)</label>
                                <input required type="number" min="1" placeholder="0.00" value={transferData.amount} onChange={e => setTransferData({ ...transferData, amount: e.target.value })} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-black text-2xl text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-center" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description / Reference</label>
                                <input type="text" placeholder="e.g. Weekly Deposit" value={transferData.description} onChange={e => setTransferData({ ...transferData, description: e.target.value })} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-bold text-gray-900 dark:text-white" />
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-xl bg-gray-900 dark:bg-blue-600 text-white font-bold shadow-lg active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center gap-2">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <>Confirm Transfer</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditModalOpen && editAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#151C2C] rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">Edit Account</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleEdit} className="p-8 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Name</label>
                                <input required type="text" value={editAccount.name} onChange={e => setEditAccount({ ...editAccount, name: e.target.value })} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Type</label>
                                <select value={editAccount.type} onChange={e => setEditAccount({ ...editAccount, type: e.target.value })} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-bold text-gray-900 dark:text-white">
                                    {['Bank', 'Cash', 'Mobile Money'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                                <textarea value={editAccount.description || ''} onChange={e => setEditAccount({ ...editAccount, description: e.target.value })} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white" />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-70 flex justify-center">{isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Changes'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
