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
  // ── Direction logic ──────────────────────────────────────────────
  // Money IN  (green +): INCOME, TRANSFER_IN, DEBT_RECEIVED, DEBT_REPAID from customer/project
  // Money OUT (red  -): EXPENSE, TRANSFER_OUT, DEBT_TAKEN, DEBT_GIVEN, DEBT_REPAID to vendor
  const isIncome =
    transaction.type === 'INCOME' ||
    transaction.type === 'TRANSFER_IN' ||
    transaction.type === 'DEBT_RECEIVED' ||
    (transaction.type === 'DEBT_REPAID' && (!!transaction.customer || !!transaction.project) && !transaction.vendor);

  const amountColorClass = isIncome ? 'text-secondary' : 'text-redError';
  const typeBadgeClass = isIncome ? 'bg-secondary/10 text-secondary' : 'bg-redError/10 text-redError';

  return (
    <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
      <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100">{new Date(transaction.transactionDate).toLocaleDateString()}</td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{transaction.description}</td>
      <td className="p-4 whitespace-nowrap">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeBadgeClass}`}>
          {transaction.type}
        </span>
      </td>
      <td className={`p-4 whitespace-nowrap font-semibold ${amountColorClass}`}>
        {isIncome ? '+' : '-'}ETB {Math.abs(transaction.amount).toLocaleString()}
      </td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{transaction.account?.name || 'N/A'}</td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">
        {transaction.project?.name || transaction.customer?.name || transaction.vendor?.name || transaction.user?.fullName || 'N/A'}
      </td>
      <td className="p-4 whitespace-nowrap text-right">
        {!transaction.isVirtual && (
          <div className="flex items-center justify-end space-x-2">
            {(transaction.type.includes('DEBT')) && (
              <Link
                href="/reports/debts"
                className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors mr-2"
                title="Maamul Amaahda"
              >
                Bixi / Qaad
              </Link>
            )}
            <button onClick={() => onEdit(transaction)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Transaction">
              <Edit size={18} />
            </button>
            <button onClick={() => onDelete(transaction.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Transaction">
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

// --- Transaction Card Component (Mobile Optimized) ---
const TransactionCard: React.FC<{ transaction: Transaction; onEdit: (trx: Transaction) => void; onDelete: (id: string) => void }> = ({ transaction, onEdit, onDelete }) => {
  // ── Direction logic ──────────────────────────────────────────────
  // Money IN  (green +): INCOME, TRANSFER_IN, DEBT_RECEIVED, DEBT_REPAID from customer/project
  // Money OUT (red  -): EXPENSE, TRANSFER_OUT, DEBT_TAKEN, DEBT_GIVEN, DEBT_REPAID to vendor
  const isIncome =
    transaction.type === 'INCOME' ||
    transaction.type === 'TRANSFER_IN' ||
    transaction.type === 'DEBT_RECEIVED' ||
    (transaction.type === 'DEBT_REPAID' && (!!transaction.customer || !!transaction.project) && !transaction.vendor);

  let borderColor = 'border-lightGray dark:border-gray-700';
  let statusIcon: React.ReactNode;
  let statusBgClass = '';

  if (isIncome) {
    borderColor = 'border-secondary';
    statusIcon = <TrendingUp size={16} className="text-secondary" />;
    statusBgClass = 'bg-secondary/10';
  } else {
    borderColor = 'border-redError';
    statusIcon = <TrendingDown size={16} className="text-redError" />;
    statusBgClass = 'bg-redError/10';
  }

  return (
    <div className={`bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in-up border-l-4 ${borderColor} relative`}>
      {/* Header with amount and actions */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-darkGray dark:text-gray-100 text-base sm:text-lg flex items-center space-x-2 truncate">
            {isIncome ? <DollarSign size={18} className="text-secondary flex-shrink-0" /> : <XCircle size={18} className="text-redError flex-shrink-0" />}
            <span className="truncate">{transaction.description}</span>
          </h4>
        </div>
        {!transaction.isVirtual && (
          <div className="flex space-x-1 flex-shrink-0 ml-2">
            <button onClick={() => onEdit(transaction)} className="p-1.5 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit">
              <Edit size={14} />
            </button>
            <button onClick={() => onDelete(transaction.id)} className="p-1.5 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Amount - Prominent display */}
      <div className={`mb-3 text-xl sm:text-2xl font-bold ${isIncome ? 'text-secondary' : 'text-redError'}`}>
        {isIncome ? '+' : '-'}ETB {Math.abs(transaction.amount).toLocaleString()}
      </div>

      {/* Transaction details */}
      <div className="space-y-2">
        <p className="text-xs sm:text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-2">
          <Calendar size={12} className="flex-shrink-0" />
          <span className="truncate">{new Date(transaction.transactionDate).toLocaleDateString()}</span>
        </p>
        <p className="text-xs sm:text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-2">
          <TagIcon size={12} className="flex-shrink-0" />
          <span className="truncate">{transaction.type}</span>
        </p>
        <p className="text-xs sm:text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-2">
          <Banknote size={12} className="flex-shrink-0" />
          <span className="truncate">{transaction.account?.name || 'N/A'}</span>
        </p>
        {(transaction.project?.name || transaction.customer?.name || transaction.vendor?.name || transaction.user?.fullName) && (
          <p className="text-xs sm:text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-2">
            <InfoIcon size={12} className="flex-shrink-0" />
            <span className="truncate">{transaction.project?.name || transaction.customer?.name || transaction.vendor?.name || transaction.user?.fullName}</span>
          </p>
        )}
      </div>

      {/* Status Badge */}
      <div className="mt-3 flex items-center justify-between">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center space-x-1 ${statusBgClass}`}>
          {statusIcon} <span>{transaction.type === 'DEBT_RECEIVED' ? 'Payables' : (isIncome ? 'Dakhli' : 'Kharash')}</span>
        </span>
        <div className="flex items-center space-x-3">
          {(transaction.type.includes('DEBT')) && (
            <Link href="/reports/debts" className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors">
              Bixi / Qaad
            </Link>
          )}
          {!transaction.isVirtual && (
            <Link href={`/projects/accounting/transactions/${transaction.id}`} className="text-primary hover:underline text-xs font-medium">
              Fiiri &rarr;
            </Link>
          )}
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
    if (transaction.expenseId) {
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
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 lg:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/projects/accounting" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-3 sm:mr-4">
            <ArrowLeft size={24} className="inline-block sm:w-7 sm:h-7" />
          </Link>
          Dhaqdhaqaaqa Lacagta
        </h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Link href="/projects/accounting/transactions/add" className="bg-primary text-white py-2.5 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center justify-center">
            <Plus size={18} className="mr-2" /> Diiwaan Geli Dhaqdhaqaaq
          </Link>
          <Link href="/projects/accounting/transactions/transfer" className="bg-green-600 text-white py-2.5 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-lg hover:bg-green-700 transition duration-200 shadow-md flex items-center justify-center">
            <Repeat size={18} className="mr-2" /> Wareejin Account-ka
          </Link>
          <button onClick={fetchTransactions} className="bg-secondary text-white py-2.5 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-lg hover:bg-green-600 transition duration-200 shadow-md flex items-center justify-center">
            <RefreshCw size={18} className="mr-2" /> Cusboonaysii
          </button>
        </div>
      </div>

      {/* Transaction Statistics Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 lg:mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-5 rounded-lg lg:rounded-xl shadow-md text-center hover:shadow-lg transition-shadow duration-300 border-l-4 border-secondary">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp size={20} className="text-secondary mr-2" />
            <h4 className="text-xs sm:text-sm font-semibold text-mediumGray dark:text-gray-400">Total Inflow (Soo Gashay)</h4>
          </div>
          <p className="text-xs text-mediumGray mb-1 font-medium">(Shilin kasta: Dakhli + Transfers + Loans)</p>
          <p className="text-lg sm:text-2xl font-extrabold text-secondary">{totalCashInflow.toLocaleString()} ETB</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-5 rounded-lg lg:rounded-xl shadow-md text-center hover:shadow-lg transition-shadow duration-300 border-l-4 border-redError">
          <div className="flex items-center justify-center mb-1">
            <TrendingDown size={20} className="text-redError mr-2" />
            <h4 className="text-xs sm:text-sm font-semibold text-mediumGray dark:text-gray-400">Total Outflow (Baxday)</h4>
          </div>
          <p className="text-xs text-mediumGray mb-1 font-medium">(Shilin kasta: Kharash + Transfers + Loans)</p>
          <p className="text-lg sm:text-2xl font-extrabold text-redError">{(overviewStats?.totalCashOutflow || 0).toLocaleString()} ETB</p>
        </div>


        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-5 rounded-lg lg:rounded-xl shadow-md text-center hover:shadow-lg transition-shadow duration-300 border-l-4 border-primary">
          <div className="flex items-center justify-center mb-2">
            <RefreshCw size={20} className="text-primary mr-2" />
            <h4 className="text-xs sm:text-sm font-semibold text-mediumGray dark:text-gray-400">Net Flow (Handa)</h4>
          </div>
          <p className="text-xs text-mediumGray mb-1 font-medium">(Kala goynta In/Out)</p>
          <p className={`text-lg sm:text-2xl font-extrabold ${(totalCashInflow - (overviewStats?.totalCashOutflow || 0)) >= 0 ? 'text-primary' : 'text-redError'}`}>
            {(totalCashInflow - (overviewStats?.totalCashOutflow || 0)).toLocaleString()} ETB
          </p>
        </div>
      </div>

      {/* Search and Filter Bar - Mobile Optimized */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md mb-6 lg:mb-8 animate-fade-in-up">
        {/* Search Bar */}
        <div className="relative w-full mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full p-3 pl-10 text-sm sm:text-base border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3">
          {/* Filter by Type */}
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
            <select
              title="Filter by transaction type"
              className={`w-full p-2.5 pl-9 text-sm border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition duration-200 appearance-none ${filterType !== 'All' ? 'border-primary ring-1 ring-primary' : 'border-lightGray dark:border-gray-700'}`}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {transactionTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
              <ChevronRight className="transform rotate-90" size={16} />
            </div>
          </div>

          {/* Filter by Account — dynamic from real data */}
          <div className="relative">
            <CreditCard size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
            <select
              title="Filter by account"
              className={`w-full p-2.5 pl-9 text-sm border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition duration-200 appearance-none ${filterAccount !== 'All' ? 'border-primary ring-1 ring-primary' : 'border-lightGray dark:border-gray-700'}`}
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
            >
              {accountNames.map(acc => <option key={acc} value={acc}>{acc}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
              <ChevronRight className="transform rotate-90" size={16} />
            </div>
          </div>

          {/* Filter by Category — dynamic from real data */}
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" />
            <select
              title="Filter by category"
              className={`w-full p-2.5 pl-9 text-sm border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400 transition duration-200 appearance-none ${filterCategory !== 'All' ? 'border-purple-400 ring-1 ring-purple-400' : 'border-lightGray dark:border-gray-700'}`}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat || 'N/A'}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
              <ChevronRight className="transform rotate-90" size={16} />
            </div>
          </div>

          {/* Filter by Date Range */}
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
            <select
              title="Filter by date range"
              className={`w-full p-2.5 pl-9 text-sm border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition duration-200 appearance-none ${filterDateRange !== 'All' ? 'border-primary ring-1 ring-primary' : 'border-lightGray dark:border-gray-700'}`}
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
            >
              {dateRanges.map(range => <option key={range} value={range}>{range}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
              <ChevronRight className="transform rotate-90" size={16} />
            </div>
          </div>
        </div>

        {/* Active filters summary + Clear button */}
        {(filterType !== 'All' || filterAccount !== 'All' || filterCategory !== 'All' || filterDateRange !== 'All') && (
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-xs text-mediumGray">Active filters:</span>
            {filterType !== 'All' && <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-semibold">{filterType}</span>}
            {filterAccount !== 'All' && <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-semibold">{filterAccount}</span>}
            {filterCategory !== 'All' && <span className="bg-purple-500/10 text-purple-500 text-xs px-2 py-1 rounded-full font-semibold">{filterCategory}</span>}
            {filterDateRange !== 'All' && <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-semibold">{filterDateRange}</span>}
            <button
              onClick={() => { setFilterType('All'); setFilterAccount('All'); setFilterCategory('All'); setFilterDateRange('All'); }}
              className="text-xs text-redError hover:underline font-semibold ml-2"
            >
              ✕ Clear All
            </button>
            <span className="text-xs text-mediumGray ml-auto">{filteredTransactions.length} results</span>
          </div>
        )}

        {/* View Mode Toggle - Mobile Optimized */}
        <div className="flex space-x-2 justify-center">
          {/* Mobile - Always show cards view (no toggle) */}
          <div className="lg:hidden">
            <div className="flex items-center space-x-2 text-sm text-mediumGray dark:text-gray-400">
              <LayoutGrid size={18} />
              <span>Cards View</span>
            </div>
          </div>

          {/* Desktop - Show both options */}
          <div className="hidden lg:flex space-x-2">
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Cards View"
              className={`p-2 rounded-lg ${viewMode === 'cards' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Transactions View */}
      {pageLoading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Transactions...
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in">
          Ma jiraan dhaqdhaqaaq lacag ah oo la helay.
        </div>
      ) : (
        <>
          {/* Mobile - Always show cards view */}
          <div className="lg:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 animate-fade-in">
              {filteredTransactions.map(trx => (
                <TransactionCard key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
              ))}
            </div>
          </div>

          {/* Desktop - Show based on view mode */}
          <div className="hidden lg:block">
            {viewMode === 'list' ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                    <thead className="bg-lightGray dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Taariikhda</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Sharaxaad</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Qiimaha</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Account</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">La Xiriira</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                      {filteredTransactions.map(trx => (
                        <TransactionRow key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination Placeholder */}
                <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
                  <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Hore</button>
                  <span className="text-sm text-darkGray dark:text-gray-100">Page 1 of {Math.ceil(filteredTransactions.length / 10) || 1}</span>
                  <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Next</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-fade-in">
                {filteredTransactions.map(trx => (
                  <TransactionCard key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
