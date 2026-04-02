// app/accounting/accounts/[id]/page.tsx - ULTRA PREMIUM World-Class Design
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
  ArrowLeft, Plus, DollarSign, Banknote, Tag as TagIcon, Coins, Loader2, Info as InfoIcon,
  Edit, Trash2, Calendar, Repeat, Download, ArrowUpRight, ArrowDownLeft,
  CreditCard, Building2, Wallet, Search, TrendingUp, TrendingDown,
  ReceiptText, User as UserIcon, Sparkles, ChevronRight, MoreHorizontal,
  Shield, Zap, Activity
} from 'lucide-react';
import Toast from '@/components/common/Toast';
import * as XLSX from 'xlsx';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  transactionDate: string;
  category?: string | null;
  isIncome: boolean;
  runningBalance: number;
  accountId?: string | null;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  fromAccount?: { name: string } | null;
  toAccount?: { name: string } | null;
  project?: { name: string } | null;
  customer?: { name: string } | null;
  vendor?: { name: string } | null;
  user?: { fullName: string } | null;
  employee?: { fullName: string } | null;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  transactions: Transaction[];
  fromTransactions: any[];
  toTransactions: any[];
}

const TYPE_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  INCOME:        { label: 'Income',       color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400',  dot: 'bg-emerald-500' },
  EXPENSE:       { label: 'Expense',      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400',              dot: 'bg-rose-500' },
  TRANSFER_IN:   { label: 'Transfer In',  color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400',              dot: 'bg-blue-500' },
  TRANSFER_OUT:  { label: 'Transfer Out', color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/50 dark:text-violet-400',      dot: 'bg-violet-500' },
  DEBT_RECEIVED: { label: 'Debt Rcvd',   color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400',      dot: 'bg-indigo-500' },
  DEBT_REPAID:   { label: 'Debt Paid',   color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50 dark:text-teal-400',              dot: 'bg-teal-500' },
  DEBT_GIVEN:    { label: 'Debt Given',  color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400',          dot: 'bg-amber-500' },
  DEBT_TAKEN:    { label: 'Debt Taken',  color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/50 dark:text-orange-400',      dot: 'bg-orange-500' },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] || { label: type, color: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300', dot: 'bg-gray-400' };
}

function getAccountGradient(type: string) {
  if (type === 'BANK') return 'from-blue-600 via-blue-700 to-indigo-800';
  if (type === 'CASH') return 'from-emerald-600 via-emerald-700 to-teal-800';
  if (type === 'MOBILE_MONEY') return 'from-violet-600 via-violet-700 to-purple-800';
  return 'from-slate-700 via-slate-800 to-gray-900';
}

function getAccountIcon(type: string, size = 20) {
  if (type === 'BANK') return <Building2 size={size} />;
  if (type === 'CASH') return <Wallet size={size} />;
  if (type === 'MOBILE_MONEY') return <CreditCard size={size} />;
  return <Banknote size={size} />;
}

// Animated counter hook
function useAnimatedCounter(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return value;
}

// Mini sparkline
function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80, h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  const color = positive ? '#10b981' : '#f43f5e';
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Page() {
  const { id } = useParams();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Transactions');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchAccount = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/accounting/accounts/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setAccount({
        ...data.account,
        balance: parseFloat(data.account.balance),
        transactions: data.account.transactions.map((t: any) => ({ ...t, amount: parseFloat(t.amount) })),
        fromTransactions: data.account.fromTransactions || [],
        toTransactions: data.account.toTransactions || [],
      });
    } catch (e: any) {
      setToast({ id: Date.now().toString(), message: e.message, type: 'error' });
      router.push('/projects/accounting/accounts');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Ma hubtaa inaad tirtirto account-kan?')) return;
    try {
      const res = await fetch(`/api/projects/accounting/accounts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setToast({ id: Date.now().toString(), message: 'Account si guul leh ayaa loo tirtiray!', type: 'success' });
      router.push('/projects/accounting/accounts');
    } catch (e: any) {
      setToast({ id: Date.now().toString(), message: e.message, type: 'error' });
    }
  };

  const exportExcel = () => {
    if (!account?.transactions.length) return;
    const ws = XLSX.utils.json_to_sheet(account.transactions.map(t => ({
      Date: new Date(t.transactionDate).toLocaleDateString(),
      Description: t.description,
      Type: t.type,
      In: t.isIncome ? t.amount : 0,
      Out: !t.isIncome ? t.amount : 0,
      Balance: t.runningBalance,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `${account.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  useEffect(() => { if (id) fetchAccount(); }, [id]);

  // Derived data
  const allTxns = [...(account?.transactions || [])].reverse();
  const filtered = allTxns.filter(t =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.type.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const outTransfers = allTxns.filter(t => t.type === 'TRANSFER_OUT');
  const inTransfers = allTxns.filter(t => t.type === 'TRANSFER_IN');
  const totalIn = allTxns.filter(t => t.isIncome).reduce((s, t) => s + t.amount, 0);
  const totalOut = allTxns.filter(t => !t.isIncome).reduce((s, t) => s + t.amount, 0);

  // Sparkline data (last 20 balances)
  const balanceHistory = (account?.transactions || []).slice(-20).map(t => t.runningBalance);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pulse">
              <Activity size={28} className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-400">Loading account data...</p>
        </div>
      </Layout>
    );
  }

  if (!account) return null;

  const gradient = getAccountGradient(account.type);
  const tabs = ['Transactions', 'Transfers', 'Overview'];

  return (
    <Layout>
      <div className="max-w-full space-y-5">

        {/* ═══════════════════════════════════════════════════
            HERO HEADER — Full gradient banner
        ═══════════════════════════════════════════════════ */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 sm:p-8 shadow-2xl`}>
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-black/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl" />
          </div>

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />

          <div className="relative z-10">
            {/* Top row: back + title + actions */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <Link
                  href="/projects/accounting/accounts"
                  className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-105"
                >
                  <ArrowLeft size={16} />
                </Link>
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                      {getAccountIcon(account.type, 16)}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{account.name}</h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white/90 text-xs font-semibold">
                      {account.type}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm flex items-center gap-1.5">
                    <Shield size={12} />
                    {account.currency} · Updated {new Date(account.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={exportExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-xs sm:text-sm font-semibold transition-all hover:scale-105 border border-white/20"
                >
                  <Download size={14} /> <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={() => router.push(`/projects/accounting/transactions/transfer?fromAccount=${account.id}`)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-xs sm:text-sm font-semibold transition-all hover:scale-105 border border-white/20"
                >
                  <Repeat size={14} /> <span className="hidden sm:inline">Transfer</span>
                </button>
                <Link
                  href={`/projects/accounting/accounts/edit/${account.id}`}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-xs sm:text-sm font-semibold transition-all hover:scale-105 border border-white/20"
                >
                  <Edit size={14} /> <span className="hidden sm:inline">Edit</span>
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/30 hover:bg-red-500/50 backdrop-blur-sm text-white text-xs sm:text-sm font-semibold transition-all hover:scale-105 border border-red-400/30"
                >
                  <Trash2 size={14} /> <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>

            {/* Balance + stats row */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
              {/* Main balance */}
              <div>
                <p className="text-white/60 text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Zap size={11} /> Current Balance
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
                    ${account.balance.toLocaleString()}
                  </span>
                </div>
                {/* Sparkline */}
                <div className="mt-3 opacity-70">
                  <Sparkline data={balanceHistory} positive={account.balance >= 0} />
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex gap-4 sm:gap-4 sm:gap-6">
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-white/60 text-xs mb-1 justify-end">
                    <ArrowDownLeft size={11} /> Money In
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-emerald-300">${totalIn.toLocaleString()}</p>
                  <p className="text-white/40 text-xs">{allTxns.filter(t => t.isIncome).length} txns</p>
                </div>
                <div className="w-px bg-white/20" />
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-white/60 text-xs mb-1 justify-end">
                    <ArrowUpRight size={11} /> Money Out
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-rose-300">${totalOut.toLocaleString()}</p>
                  <p className="text-white/40 text-xs">{allTxns.filter(t => !t.isIncome).length} txns</p>
                </div>
                <div className="w-px bg-white/20" />
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-white/60 text-xs mb-1 justify-end">
                    <Activity size={11} /> Total
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-white">{allTxns.length}</p>
                  <p className="text-white/40 text-xs">transactions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            TAB PANEL
        ═══════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">

          {/* Tab bar */}
          <div className="flex items-center gap-1 p-1.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none py-2 px-4 sm:px-6 rounded-xl text-sm font-semibold transition-all duration-200
                  ${activeTab === tab
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-700'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-800'
                  }`}
              >
                {tab}
                {tab === 'Transactions' && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold
                    ${activeTab === tab ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}>
                    {account.transactions.length}
                  </span>
                )}
                {tab === 'Transfers' && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold
                    ${activeTab === tab ? 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}>
                    {outTransfers.length + inTransfers.length}
                  </span>
                )}
              </button>
            ))}

            {/* Add button - right aligned */}
            <div className="flex-1 flex justify-end pr-1">
              <Link
                href="/projects/accounting/transactions/add"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold rounded-xl transition-all hover:scale-105 shadow-sm"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Add Transaction</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </div>
          </div>

          {/* ── TRANSACTIONS ───────────────────────────────── */}
          {activeTab === 'Transactions' && (
            <div className="p-5 sm:p-6">
              {/* Search */}
              <div className="relative mb-5">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 transition-all"
                />
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <ReceiptText size={28} className="text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No transactions found</p>
                  {searchTerm && <p className="text-xs text-gray-400 mt-1">Try a different search</p>}
                </div>
              ) : (
                <>
                  {/* ── DESKTOP TABLE ── */}
                  <div className="hidden lg:block rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/80">
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Related</th>
                          <th className="px-5 py-3.5 text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">In</th>
                          <th className="px-5 py-3.5 text-right text-xs font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider">Out</th>
                          <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Balance</th>
                          <th className="w-12" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {filtered.map((trx, i) => {
                          const cfg = getTypeConfig(trx.type);
                          const relatedName = trx.project?.name || trx.customer?.name || trx.vendor?.name || trx.employee?.fullName || trx.user?.fullName;
                          const amount = Math.abs(trx.amount);
                          return (
                            <tr
                              key={trx.id}
                              className="group hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors cursor-pointer"
                              onClick={() => router.push(`/projects/accounting/transactions/${trx.id}`)}
                            >
                              <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap font-medium">
                                {new Date(trx.transactionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                              </td>
                              <td className="px-5 py-4 max-w-[220px]">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">{trx.description}</p>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.color}`}>
                                    {cfg.label}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap truncate max-w-[130px]">
                                {relatedName || '—'}
                              </td>
                              <td className="px-5 py-4 text-right whitespace-nowrap">
                                {trx.isIncome ? (
                                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                    +${amount.toLocaleString()}
                                  </span>
                                ) : <span className="text-gray-200 dark:text-gray-700">—</span>}
                              </td>
                              <td className="px-5 py-4 text-right whitespace-nowrap">
                                {!trx.isIncome ? (
                                  <span className="text-sm font-bold text-rose-500 dark:text-rose-400">
                                    -${amount.toLocaleString()}
                                  </span>
                                ) : <span className="text-gray-200 dark:text-gray-700">—</span>}
                              </td>
                              <td className={`px-5 py-4 text-right whitespace-nowrap text-sm font-bold ${trx.runningBalance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-rose-500'}`}>
                                ${trx.runningBalance.toLocaleString()}
                              </td>
                              <td className="px-3 py-4">
                                <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors ml-auto" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* ── MOBILE LIST ── */}
                  <div className="lg:hidden space-y-2.5">
                    {filtered.map((trx) => {
                      const cfg = getTypeConfig(trx.type);
                      const relatedName = trx.project?.name || trx.customer?.name || trx.vendor?.name || trx.employee?.fullName || trx.user?.fullName;
                      const amount = Math.abs(trx.amount);
                      return (
                        <Link
                          key={trx.id}
                          href={`/projects/accounting/transactions/${trx.id}`}
                          className="flex items-center gap-3.5 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all bg-white dark:bg-gray-900"
                        >
                          {/* Icon */}
                          <div className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${trx.isIncome ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-rose-100 dark:bg-rose-950'}`}>
                            {trx.isIncome
                              ? <ArrowDownLeft size={18} className="text-emerald-600 dark:text-emerald-400" />
                              : <ArrowUpRight size={18} className="text-rose-500 dark:text-rose-400" />
                            }
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">{trx.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${cfg.color}`}>{cfg.label}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {new Date(trx.transactionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                          </div>
                          {/* Amount + balance */}
                          <div className="flex-shrink-0 text-right">
                            <p className={`text-base font-bold ${trx.isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                              {trx.isIncome ? '+' : '-'}${amount.toLocaleString()}
                            </p>
                            <p className={`text-xs mt-0.5 font-medium ${trx.runningBalance >= 0 ? 'text-gray-400 dark:text-gray-500' : 'text-rose-400'}`}>
                              ${trx.runningBalance.toLocaleString()}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-4 text-right">
                    Showing {filtered.length} of {account.transactions.length} transactions
                  </p>
                </>
              )}
            </div>
          )}

          {/* ── TRANSFERS ──────────────────────────────────── */}
          {activeTab === 'Transfers' && (
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Transfer History</h3>
                <Link
                  href={`/projects/accounting/transactions/transfer?fromAccount=${account.id}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold rounded-xl transition-all hover:scale-105 shadow-sm"
                >
                  <Plus size={14} /> New Transfer
                </Link>
              </div>

              {outTransfers.length === 0 && inTransfers.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <Repeat size={28} className="text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No transfers yet</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Section label: Out */}
                  {outTransfers.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 mb-2.5">Sent</p>
                      {outTransfers.map(trx => (
                        <Link
                          key={trx.id}
                          href={`/projects/accounting/transactions/${trx.id}`}
                          className="flex items-center gap-4 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10 hover:border-rose-200 dark:hover:border-rose-800 hover:shadow-md transition-all"
                        >
                          <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center">
                            <ArrowUpRight size={18} className="text-rose-500 dark:text-rose-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{trx.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400">To: <span className="font-medium">{trx.toAccount?.name || 'External'}</span></span>
                              <span className="text-gray-300 dark:text-gray-700">·</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(trx.transactionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </div>
                          <p className="flex-shrink-0 text-base font-bold text-rose-500 dark:text-rose-400">-${trx.amount.toLocaleString()}</p>
                        </Link>
                      ))}
                    </>
                  )}

                  {/* Section label: In */}
                  {inTransfers.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 mt-5 mb-2.5">Received</p>
                      {inTransfers.map(trx => (
                        <Link
                          key={trx.id}
                          href={`/projects/accounting/transactions/${trx.id}`}
                          className="flex items-center gap-4 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-md transition-all"
                        >
                          <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                            <ArrowDownLeft size={18} className="text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{trx.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400">From: <span className="font-medium">{trx.fromAccount?.name || 'External'}</span></span>
                              <span className="text-gray-300 dark:text-gray-700">·</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(trx.transactionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </div>
                          <p className="flex-shrink-0 text-base font-bold text-emerald-600 dark:text-emerald-400">+${trx.amount.toLocaleString()}</p>
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── OVERVIEW ────────────────────────────────────── */}
          {activeTab === 'Overview' && (
            <div className="p-5 sm:p-6">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-5">Account Details</h3>

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {[
                  { icon: <Banknote size={16} className="text-blue-500" />, label: 'Account Name', value: account.name, bg: 'bg-blue-50 dark:bg-blue-950/30' },
                  { icon: <TagIcon size={16} className="text-violet-500" />, label: 'Account Type', value: account.type, bg: 'bg-violet-50 dark:bg-violet-950/30' },
                  { icon: <Coins size={16} className="text-amber-500" />, label: 'Currency', value: account.currency, bg: 'bg-amber-50 dark:bg-amber-950/30' },
                  { icon: <DollarSign size={16} className="text-emerald-500" />, label: 'Current Balance', value: `$${account.balance.toLocaleString()}`, bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                  { icon: <Calendar size={16} className="text-gray-400" />, label: 'Created', value: new Date(account.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), bg: 'bg-gray-50 dark:bg-gray-800' },
                  { icon: <Calendar size={16} className="text-gray-400" />, label: 'Last Updated', value: new Date(account.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), bg: 'bg-gray-50 dark:bg-gray-800' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3.5 p-4 rounded-2xl ${item.bg} border border-transparent`}>
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-0.5">{item.label}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Received', value: `$${totalIn.toLocaleString()}`, color: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/30' },
                  { label: 'Total Sent', value: `$${totalOut.toLocaleString()}`, color: 'text-rose-500 dark:text-rose-400', border: 'border-rose-100 dark:border-rose-900/30' },
                  { label: 'Net Flow', value: `$${(totalIn - totalOut).toLocaleString()}`, color: totalIn - totalOut >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-500', border: 'border-blue-100 dark:border-blue-900/30' },
                ].map((s, i) => (
                  <div key={i} className={`text-center p-4 rounded-2xl border ${s.border} bg-white dark:bg-gray-900`}>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{s.label}</p>
                    <p className={`text-sm sm:text-base font-black ${s.color} truncate`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast id={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}
