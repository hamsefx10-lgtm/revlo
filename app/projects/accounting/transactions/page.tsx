// app/accounting/transactions/page.tsx - Transactions List Page (10000% Design - API Integration)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
  ArrowLeft, Plus, Search, Filter, Calendar, List, LayoutGrid,
  DollarSign, CreditCard, Banknote, RefreshCw, Eye, Edit, Trash2,
  TrendingUp, TrendingDown, Info as InfoIcon, CheckCircle, XCircle, Clock as ClockIcon,
  User as UserIcon, Briefcase as BriefcaseIcon, Tag as TagIcon, ChevronRight, Loader2, HardDrive, Repeat // Added Repeat for transfers
} from 'lucide-react';
import Toast from '@/components/common/Toast';

// --- Transaction Data Interface (Refined for API response) ---
interface Transaction {
  id: string;
  description: string;
  amount: number; // Converted from Decimal
  type: string; // e.g., "INCOME", "EXPENSE", "TRANSFER_IN", "TRANSFER_OUT", "DEBT_TAKEN", "DEBT_REPAID", "DEBT_GIVEN"
  category?: string; // e.g., "FIXED_ASSET_PURCHASE"
  transactionDate: string;
  note?: string;
  account?: { name: string; }; // Primary account
  fromAccount?: { name: string; }; // For transfers
  toAccount?: { name: string; };   // For transfers
  project?: { name: string; };     // If linked to project
  expense?: { description: string; }; // If linked to expense
  customer?: { name: string; };    // If linked to customer
  vendor?: { name: string; };      // If linked to vendor
  employee?: { fullName: string; }; // If linked to employee (DEBT_TAKEN = loan given out)
  user?: { fullName: string; };    // Who recorded
  isVirtual?: boolean;             // Flag indicating if this is a synthesized transaction (e.g. from Project records)
  expenseId?: string;
  customerId?: string;
  vendorId?: string;
  projectId?: string;
  fixedAssetId?: string;
}

// --- Transaction Table Row Component ---
const TransactionRow: React.FC<{ transaction: Transaction; onEdit: (trx: Transaction) => void; onDelete: (id: string) => void }> = ({ transaction, onEdit, onDelete }) => {
  const isIncome =
    transaction.type === 'INCOME' ||
    transaction.type === 'TRANSFER_IN' ||
    transaction.type === 'DEBT_RECEIVED' ||
    (transaction.type === 'DEBT_REPAID' && (!!transaction.customer || !!transaction.project) && !transaction.vendor);

  const amountColorClass = isIncome ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400';
  const typeBadgeClass = isIncome ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';

  return (
    <tr className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-all duration-300 border-b border-gray-200/50 dark:border-gray-700/50 last:border-b-0 group backdrop-blur-md">
      <td className="p-4 whitespace-nowrap text-gray-700 dark:text-gray-200 font-medium">{new Date(transaction.transactionDate).toLocaleDateString()}</td>
      <td className="p-4 whitespace-nowrap text-gray-600 dark:text-gray-300 font-medium group-hover:text-primary transition-colors">{transaction.description}</td>
      <td className="p-4 whitespace-nowrap">
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase shadow-sm ${typeBadgeClass}`}>
          {transaction.type.replace('_', ' ')}
        </span>
      </td>
      <td className={`p-4 whitespace-nowrap font-black text-lg tracking-tight ${amountColorClass}`}>
        {isIncome ? '+' : '-'}ETB {Math.abs(transaction.amount).toLocaleString()}
      </td>
      <td className="p-4 whitespace-nowrap text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
        <Banknote size={14} className="text-gray-400" />
        {transaction.account?.name || 'N/A'}
      </td>
      <td className="p-4 whitespace-nowrap text-gray-500 dark:text-gray-400 font-medium">
        {transaction.project?.name || transaction.customer?.name || transaction.vendor?.name || transaction.user?.fullName || 'N/A'}
      </td>
      <td className="p-4 whitespace-nowrap text-right">
        {!transaction.isVirtual && (
          <div className="flex items-center justify-end space-x-2">
            {(transaction.type.includes('DEBT')) && (
              <Link
                href="/projects/accounting/reports/debts"
                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold transition-all mr-2 backdrop-blur-md"
                title="Maamul Amaahda"
              >
                Bixi / Qaad
              </Link>
            )}
            <button onClick={() => onEdit(transaction)} className="p-2 rounded-xl bg-gray-100 hover:bg-white text-gray-600 hover:text-primary dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-400 transition-all shadow-sm duration-300 hover:shadow-md hover:-translate-y-0.5" title="Wax ka bedel">
              <Edit size={16} />
            </button>
            <button onClick={() => onDelete(transaction.id)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 transition-all shadow-sm duration-300 hover:shadow-md hover:-translate-y-0.5" title="Tirtir">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

// --- Transaction Card Component (Mobile Optimized) ---
const TransactionCard: React.FC<{ transaction: Transaction; onEdit: (trx: Transaction) => void; onDelete: (id: string) => void }> = ({ transaction, onEdit, onDelete }) => {
  const isIncome =
    transaction.type === 'INCOME' ||
    transaction.type === 'TRANSFER_IN' ||
    transaction.type === 'DEBT_RECEIVED' ||
    (transaction.type === 'DEBT_REPAID' && (!!transaction.customer || !!transaction.project) && !transaction.vendor);

  let borderColor = 'from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800';
  let statusIcon: React.ReactNode;
  let statusBgClass = '';

  if (isIncome) {
    borderColor = 'from-emerald-400 to-emerald-600';
    statusIcon = <TrendingUp size={14} className="text-emerald-500 dark:text-emerald-400" />;
    statusBgClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
  } else {
    borderColor = 'from-rose-400 to-rose-600';
    statusIcon = <TrendingDown size={14} className="text-rose-500 dark:text-rose-400" />;
    statusBgClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
  }

  return (
    <div className="relative group p-[1px] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 animate-fade-in-up hover:-translate-y-1">
      {/* Animated gradient border wrapper */}
      <div className={`absolute inset-0 bg-gradient-to-br ${borderColor} opacity-30 group-hover:opacity-100 transition-opacity duration-500`}></div>
      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-5 sm:p-6 rounded-[23px] h-full flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 mr-4">
            <h4 className="font-bold text-gray-800 dark:text-gray-100 text-base sm:text-lg tracking-tight leading-tight flex items-start gap-2">
              <div className={`p-2 rounded-xl flex-shrink-0 ${isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {isIncome ? <DollarSign size={20} /> : <XCircle size={20} />}
              </div>
              <span className="truncate pt-1">{transaction.description}</span>
            </h4>
          </div>
          {!transaction.isVirtual && (
            <div className="flex space-x-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button onClick={() => onEdit(transaction)} className="p-2 rounded-xl bg-gray-100 hover:bg-white text-gray-600 hover:text-primary dark:bg-gray-700/50 dark:hover:bg-gray-600 transition-all shadow-sm" title="Edit">
                <Edit size={14} />
              </button>
              <button onClick={() => onDelete(transaction.id)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all shadow-sm" title="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className={`mb-5 text-2xl sm:text-3xl font-black tracking-tight ${isIncome ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
          {isIncome ? '+' : '-'}ETB {Math.abs(transaction.amount).toLocaleString()}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/30">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{new Date(transaction.transactionDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/30">
            <Banknote size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate">{transaction.account?.name || 'N/A'}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase ${statusBgClass}`}>
             {transaction.type.replace('_', ' ')}
          </span>
          <div className="flex items-center gap-2">
            {(transaction.type.includes('DEBT')) && (
              <Link href="/projects/accounting/reports/debts" className="px-3 py-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-lg text-xs font-bold transition-colors backdrop-blur-md">
                Bixi / Qaad
              </Link>
            )}
            {!transaction.isVirtual && (
              <Link href={`/projects/accounting/transactions/${transaction.id}`} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterAccount, setFilterAccount] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');
  const [pageLoading, setPageLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [overviewStats, setOverviewStats] = useState<any>(null); // Added for dashboard syncing

  // Dynamic filter options derived from real transaction data
  const transactionTypes = ['All', 'INCOME', 'EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN', 'DEBT_RECEIVED', 'DEBT_REPAID', 'TRANSFER_IN', 'TRANSFER_OUT'];
  const accountNames = ['All', ...Array.from(new Set(transactions.map(t => t.account?.name).filter(Boolean)))];
  const categories = ['All', ...Array.from(new Set(transactions.map(t => t.category).filter(Boolean)))];
  const dateRanges = ['All', 'Today', 'This Week', 'This Month', 'Last 30 Days', 'Last 3 Months', 'This Year'];

  // --- API Functions ---
  const fetchTransactions = async () => {
    setPageLoading(true);
    try {
      const [trxResponse, statsResponse] = await Promise.all([
        fetch('/api/projects/accounting/transactions'),
        fetch('/api/projects/accounting/reports')
      ]);

      if (!trxResponse.ok) throw new Error('Failed to fetch transactions');
      if (!statsResponse.ok) throw new Error('Failed to fetch stats');

      const trxData = await trxResponse.json();
      const statsData = await statsResponse.json();

      setTransactions(trxData.transactions.map((trx: any) => ({ ...trx, amount: parseFloat(trx.amount) }))); // Convert Decimal to Number
      setOverviewStats(statsData);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka xogta la soo gelinayay.', type: 'error' });
      setTransactions([]);
    } finally {
      setPageLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad tirtirto dhaqdhaqaaqan lacagta ah? Tan lama soo celin karo!')) {
      try {
        const response = await fetch(`/api/projects/accounting/transactions/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete transaction');

        setToastMessage({ message: data.message || 'Dhaqdhaqaaqa lacagta si guul leh ayaa loo tirtiray!', type: 'success' });
        fetchTransactions(); // Re-fetch transactions after deleting
      } catch (error: any) {
        console.error('Error deleting transaction:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka dhaqdhaqaaqa lacagta la tirtirayay.', type: 'error' });
      }
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    if (transaction.isVirtual || transaction.id?.startsWith('virtual-')) {
      if (transaction.projectId) {
        router.push(`/projects/main/edit/${transaction.projectId}`);
      } else {
        alert("Kani waa transaction dhalanteed ah (Virtual). Fadlan ka bedel meeshii asalka ahayd.");
      }
    } else if (transaction.expenseId) {
      // Redirect to expense edit page
      router.push(`/projects/expenses/edit/${transaction.expenseId}`);
    } else if (transaction.fixedAssetId) {
      // Redirect to fixed asset page
      router.push(`/projects/accounting/fixed-assets`);
    } else {
      // Default to general accounting edit
      router.push(`/projects/accounting/transactions/edit/${transaction.id}`);
    }
  };

  useEffect(() => {
    fetchTransactions(); // Fetch transactions on component mount
  }, []);


  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.account?.name && transaction.account.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.project?.name && transaction.project.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.customer?.name && transaction.customer.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'All' || transaction.type === filterType;
    const matchesAccount = filterAccount === 'All' || transaction.account?.name === filterAccount;
    const matchesCategory = filterCategory === 'All' || transaction.category === filterCategory;

    // Date range filtering — now actually works
    let matchesDate = true;
    if (filterDateRange !== 'All') {
      const txDate = new Date(transaction.transactionDate);
      const now = new Date();
      const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const today = startOfDay(now);
      if (filterDateRange === 'Today') {
        matchesDate = txDate >= today;
      } else if (filterDateRange === 'This Week') {
        const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
        matchesDate = txDate >= weekStart;
      } else if (filterDateRange === 'This Month') {
        matchesDate = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      } else if (filterDateRange === 'Last 30 Days') {
        const d = new Date(now); d.setDate(d.getDate() - 30);
        matchesDate = txDate >= d;
      } else if (filterDateRange === 'Last 3 Months') {
        const d = new Date(now); d.setMonth(d.getMonth() - 3);
        matchesDate = txDate >= d;
      } else if (filterDateRange === 'This Year') {
        matchesDate = txDate.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesType && matchesAccount && matchesCategory && matchesDate;
  });


  // Statistics
  const totalTransactionsCount = filteredTransactions.length;

  // ─────────────────────────────────────────────────────────────
  // CALCULATION RULES (companyId is enforced by the API — only
  // this company's transactions are ever in filteredTransactions)
  //
  // TRUE INCOME = money earned by the company
  //   ✅ INCOME              — direct revenue
  //   ✅ DEBT_REPAID(customer)— customer paying back debt owed to us
  //   ❌ DEBT_TAKEN          — money BORROWED (liability, not income)
  //   ❌ TRANSFER_IN         — internal move (no value created)
  //
  // TRUE EXPENSES = money spent by the company
  //   ✅ EXPENSE             — operating costs
  //   ✅ DEBT_REPAID(vendor) — paying back our debt to supplier
  //   ❌ TRANSFER_OUT        — internal move
  //   ❌ FIXED_ASSET_PURCHASE— tracked separately
  // ─────────────────────────────────────────────────────────────

  // 1. Total Operating Income (Business Revenue)
  const totalIncome = overviewStats?.totalIncome || 0;

  // 2. Total Gross Inflow (Every shilling into accounts) - NEW
  const totalCashInflow = overviewStats?.totalCashInflow || 0;

  // 3. Total Expenses (Operating)
  const totalExpenses = overviewStats?.totalExpenses || 0;

  // 4. Fixed Asset Purchases
  const fixedAssetExpenses = overviewStats?.fixedAssetExpenses || 0;

  // 5. Net Flow — real operating performance
  const netFlow = totalIncome - totalExpenses - fixedAssetExpenses;

  return (
    <Layout>
      {/* Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-primary/5 dark:bg-primary/10 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-blue-400/5 dark:bg-blue-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Header - Ultra Premium */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 sm:mb-8 lg:mb-10 gap-4 sm:gap-6">
          <div>
             <Link href="/projects/accounting" className="inline-flex items-center text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-primary transition-colors mb-3">
              <ArrowLeft size={16} className="mr-2" /> Ku Noqo Dashboard-ka
            </Link>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              Liska Dhaqdhaqaaqa
              <span className="px-3 py-1 rounded-full text-sm font-bold bg-primary/10 text-primary border border-primary/20 backdrop-blur-md hidden sm:inline-block">Diiwaanka Rasmiga</span>
            </h1>
          </div>
          <div className="flex space-x-3">
            <Link href="/projects/accounting/transactions/transfer" className="group flex-1 md:flex-none relative bg-emerald-500 text-white py-3 px-5 rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all duration-300 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1 flex items-center justify-center">
              <Repeat size={18} className="mr-2 group-hover:rotate-180 transition-transform duration-500" /> Xawilaad 
            </Link>
            <Link href="/projects/accounting/transactions/add" className="group flex-1 md:flex-none relative bg-gradient-to-r from-blue-600 to-primary text-white py-3 px-5 lg:px-8 rounded-2xl font-bold text-sm lg:text-base hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center">
              <Plus size={18} className="mr-2 group-hover:scale-125 transition-transform" /> Diiwaangeli
            </Link>
          </div>
        </div>

        {/* Bento Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 animate-fade-in-up">
          <div className="relative p-[1px] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/10 dark:from-gray-700/60 dark:to-gray-800/10 rounded-[1.5rem] sm:rounded-[2rem]"></div>
            <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl p-6 rounded-[1.5rem] sm:rounded-[2rem] h-full shadow-lg border border-white/50 dark:border-gray-700/50">
              <div className="flex items-center mb-4 text-emerald-600 dark:text-emerald-400">
                <div className="p-3 bg-emerald-500/10 rounded-2xl mr-3">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold tracking-widest uppercase">Wadarta Soo Gashay</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">(Shilin kasta/All Inflows)</p>
                </div>
              </div>
              <p className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                {totalCashInflow.toLocaleString()}<span className="text-lg font-bold text-gray-400 ml-1">ETB</span>
              </p>
            </div>
          </div>

          <div className="relative p-[1px] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/10 dark:from-gray-700/60 dark:to-gray-800/10 rounded-[1.5rem] sm:rounded-[2rem]"></div>
            <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl p-6 rounded-[1.5rem] sm:rounded-[2rem] h-full shadow-lg border border-white/50 dark:border-gray-700/50">
              <div className="flex items-center mb-4 text-rose-600 dark:text-rose-400">
                <div className="p-3 bg-rose-500/10 rounded-2xl mr-3">
                  <TrendingDown size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold tracking-widest uppercase">Wadarta Baxday</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">(Shilin kasta/All Outflows)</p>
                </div>
              </div>
              <p className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                {(overviewStats?.totalCashOutflow || 0).toLocaleString()}<span className="text-lg font-bold text-gray-400 ml-1">ETB</span>
              </p>
            </div>
          </div>

          <div className="relative p-[1px] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-blue-500/5 dark:from-primary/20 dark:to-blue-900/10 rounded-[1.5rem] sm:rounded-[2rem]"></div>
            <div className="relative bg-gradient-to-br from-white/90 to-white/40 dark:from-gray-800/90 dark:to-gray-900/40 backdrop-blur-2xl p-6 rounded-[1.5rem] sm:rounded-[2rem] h-full shadow-xl border border-white/60 dark:border-gray-700/50">
              <div className="flex items-center mb-4 text-primary">
                <div className="p-3 bg-primary/10 rounded-2xl mr-3 animate-pulse">
                  <RefreshCw size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold tracking-widest uppercase">Net Flow (Handa)</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">(Kala goynta In & Out)</p>
                </div>
              </div>
              <p className={`text-3xl md:text-4xl font-black tracking-tighter ${(totalCashInflow - (overviewStats?.totalCashOutflow || 0)) >= 0 ? 'text-primary' : 'text-rose-500'}`}>
                {(totalCashInflow - (overviewStats?.totalCashOutflow || 0)).toLocaleString()}<span className="text-lg font-bold opacity-60 ml-1">ETB</span>
              </p>
            </div>
          </div>
        </div>

        {/* Filters Bento Box */}
        <div className="relative p-[1px] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden mb-10 animate-fade-in">
           <div className="absolute inset-0 bg-white/40 dark:bg-gray-800/40 rounded-[1.5rem] sm:rounded-[2rem]"></div>
           <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-white/60 dark:border-gray-700/50">
              <div className="flex items-center gap-3 mb-6">
                <Filter size={20} className="text-primary" />
                <h3 className="font-bold text-gray-800 dark:text-gray-200">Kala Shaandheyn</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="lg:col-span-1 relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                     <Search size={16} className="text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Raadi..."
                    className="w-full bg-white/80 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm group-hover:shadow-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Dropdowns */}
                {[
                  { icon: TagIcon, title: "Nooca", value: filterType, setter: setFilterType, options: transactionTypes },
                  { icon: CreditCard, title: "Account-ka", value: filterAccount, setter: setFilterAccount, options: accountNames },
                  { icon: LayoutGrid, title: "Qaybta", value: filterCategory, setter: setFilterCategory, options: categories },
                  { icon: Calendar, title: "Wakhtiga", value: filterDateRange, setter: setFilterDateRange, options: dateRanges }
                ].map((f, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                       <f.icon size={16} className="text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <select
                      className="w-full bg-white/80 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 pl-11 pr-10 text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm group-hover:shadow-md cursor-pointer"
                      value={f.value}
                      onChange={(e) => f.setter(e.target.value)}
                    >
                      {f.options.map(opt => <option key={opt} value={opt}>{opt || 'N/A'}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                       <ChevronRight size={16} className="text-gray-400 rotate-90" />
                    </div>
                  </div>
                ))}
              </div>

              {/* View Toggles & Clear */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200/50 dark:border-gray-700/50 pt-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                    {filteredTransactions.length} Natiijo
                  </span>
                  {(filterType !== 'All' || filterAccount !== 'All' || filterCategory !== 'All' || filterDateRange !== 'All' || searchTerm) && (
                     <button
                        onClick={() => { setSearchTerm(''); setFilterType('All'); setFilterAccount('All'); setFilterCategory('All'); setFilterDateRange('All'); }}
                        className="text-xs text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 px-4 py-1.5 rounded-lg font-bold transition-colors"
                     >
                        Masax Shaandheynta
                     </button>
                  )}
                </div>

                <div className="hidden md:flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700/50">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <LayoutGrid size={16} /> Kaarar
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <List size={16} /> Liis
                  </button>
                </div>
              </div>
           </div>
        </div>

        {/* Transactions Content */}
        {pageLoading ? (
          <div className="h-[400px] flex flex-col items-center justify-center bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] border border-white/50 dark:border-gray-700/50 shadow-xl">
            <Loader2 className="animate-spin text-primary mb-4" size={48} /> 
            <p className="text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase text-sm animate-pulse">Raadinaya Xogta...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] border border-white/50 dark:border-gray-700/50 shadow-xl text-center px-6">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
              <Search className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Xog Lama Helin</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Ma jiraan wax dhaqdhaqaaq ah oo ku aadan shuruudaha aad dooratay.</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Mobile (Always Cards) */}
            <div className="md:hidden grid grid-cols-1 gap-5">
              {filteredTransactions.map(trx => (
                <TransactionCard key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden md:block">
              {viewMode === 'list' ? (
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                      <thead className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md">
                        <tr>
                          {['Taariikhda', 'Sharaxaad', 'Nooca', 'Qiimaha', 'Account', 'La Xiriira', 'Actions'].map((head, i) => (
                             <th key={i} className={`px-4 py-5 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ${i === 3 || i === 6 ? 'text-right' : 'text-left'}`}>
                               {head}
                             </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50 bg-transparent">
                        {filteredTransactions.map(trx => (
                          <TransactionRow key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {filteredTransactions.map(trx => (
                    <TransactionCard key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
