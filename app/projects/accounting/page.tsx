// app/accounting/page.tsx - Accounting Overview Page (10000% Design - API Integration & Enhanced)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
  ArrowLeft, Landmark, Plus, Search, Filter, Calendar, List, LayoutGrid,
  DollarSign, CreditCard, Banknote, RefreshCw, Eye, Edit, Trash2,
  TrendingUp, TrendingDown, Info as InfoIcon, CheckCircle, XCircle, Clock as ClockIcon,
  User as UserIcon, Briefcase as BriefcaseIcon, Tag as TagIcon,
  Coins, Repeat, ReceiptText, Users, Building, Package, Scale, Truck, Mail, Phone, HardDrive, PieChart as PieChartIcon
} from 'lucide-react';
import Toast from '@/components/common/Toast';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import TransactionRow from '@/components/accounting/TransactionRow';
import MobileTransactionCard from '@/components/accounting/MobileTransactionCard';
import { MobileAccountingView } from './MobileAccountingView';

// --- Data Interfaces (Refined for API response) ---
interface Account {
  id: string;
  name: string;
  type: string; // e.g., "BANK", "CASH", "MOBILE_MONEY"
  balance: number; // Converted from Decimal
  currency: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number; // Converted from Decimal
  type: string; // e.g., "INCOME", "EXPENSE", "TRANSFER_IN", "TRANSFER_OUT", "DEBT_TAKEN", "DEBT_REPAID"
  transactionDate: string;
  note?: string;
  account?: { name: string; }; // Primary account
  fromAccount?: { name: string; }; // For transfers
  toAccount?: { name: string; };   // For transfers
  project?: { name: string; };     // If linked to project
  expense?: { description: string; }; // If linked to expense
  customer?: { name: string; };    // If linked to customer
  vendor?: { name: string; };      // If linked to vendor
  user?: { fullName: string; };    // Who recorded
  employee?: { fullName: string; }; // If linked to employee
}

interface OverviewStats {
  totalBalance: number;
  totalIncomeThisMonth: number;
  totalIncome: number; // Total income (all time)
  totalExpensesThisMonth: number;
  totalExpenses: number; // Total expenses (all time, excluding fixed assets)
  fixedAssetExpenses?: number; // Fixed asset expenses (all time)
  fixedAssetExpensesThisMonth?: number; // Fixed asset expenses this month
  totalPayablesReceived?: number; // Total loans taken (all time)
  totalPayablesReceivedThisMonth?: number; // Total loans taken this month
  netFlowThisMonth: number;
  totalBankAccounts: number;
  totalCashAccounts: number;
  totalMobileMoneyAccounts: number; // Added Mobile Money count
  totalReceivables?: number;
  totalPayables?: number;
  // For charts
  monthlyCashFlow: { month: string; income: number; expense: number; net: number }[];
  accountDistribution: { name: string; value: number; }[];
}

interface DebtsReportCompanyDebt {
  id?: string;
  lender?: string;
  client?: string; // For receivables
  customerName?: string;
  amount?: number;
  paid?: number;
  received?: number; // For receivables
  remaining?: number;
  dueDate?: string;
  status: string;
}

interface DebtsReportProjectDebt {
  id?: string;
  project?: string;
  projectName?: string;
  amount?: number;
  paid?: number;
  remaining?: number;
  dueDate?: string;
  status: string;
}

// Helper for chart colors
const CHART_COLORS = ['#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#9B59B6', '#1ABC9C', '#34495E', '#A0A0A0'];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-sm font-semibold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// --- Account Table Row Component ---
const AccountRow: React.FC<{ account: Account; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ account, onEdit, onDelete }) => (
  <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium flex items-center space-x-2">
      <Banknote size={18} className="text-primary" /> <span>{account.name}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{account.type}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{account.currency}</td>
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-semibold text-right">ETB {account.balance.toLocaleString()}</td>
    <td className="p-4 whitespace-nowrap text-right">
      <div className="flex items-center justify-end space-x-2">
        <Link href={`/projects/accounting/accounts/${account.id}`} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View Details">
          <Eye size={18} />
        </Link>
        <button onClick={() => onEdit(account.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Account">
          <Edit size={18} />
        </button>
        <button onClick={() => onDelete(account.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Account">
          <Trash2 size={18} />
        </button>
      </div>
    </td>
  </tr >
);

export default function AccountingPage() {
  const router = useRouter();
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [debtTransactions, setDebtTransactions] = useState<Transaction[]>([]);
  const [projectDebtTransactions, setProjectDebtTransactions] = useState<Transaction[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [companyDebts, setCompanyDebts] = useState<DebtsReportCompanyDebt[]>([]);
  const [projectDebts, setProjectDebts] = useState<DebtsReportProjectDebt[]>([]);
  const [payableDebts, setPayableDebts] = useState<DebtsReportCompanyDebt[]>([]);

  // --- API Functions ---
  const fetchAccountingData = async (isBackground = false) => {
    if (!isBackground) setPageLoading(true);
    try {
      const [statsResponse, accountsResponse, transactionsResponse, debtTransactionsResponse, projectDebtTransactionsResponse] = await Promise.all([
        fetch('/api/projects/accounting/reports'), // Fetch overview stats from new reports API
        fetch('/api/projects/accounting/accounts'),
        fetch('/api/projects/accounting/transactions?limit=5'), // Fetch only recent 5 transactions
        fetch('/api/projects/accounting/transactions?includeDebts=true&limit=10'), // Fetch debt transactions
        fetch('/api/projects/accounting/transactions?includeProjectDebts=true&limit=15') // Fetch project debt transactions
      ]);

      const statsData = await statsResponse.json();
      const accountsData = await accountsResponse.json();
      const transactionsData = await transactionsResponse.json();
      const debtTransactionsData = await debtTransactionsResponse.json();
      const projectDebtTransactionsData = await projectDebtTransactionsResponse.json();

      if (!statsResponse.ok) throw new Error(statsData.message || 'Failed to fetch overview stats');
      if (!accountsResponse.ok) throw new Error(accountsData.message || 'Failed to fetch accounts');
      if (!transactionsResponse.ok) throw new Error(transactionsData.message || 'Failed to fetch transactions');
      if (!debtTransactionsResponse.ok) throw new Error(debtTransactionsData.message || 'Failed to fetch debt transactions');
      if (!projectDebtTransactionsResponse.ok) throw new Error(projectDebtTransactionsData.message || 'Failed to fetch project debt transactions');

      // Set debt transactions
      setDebtTransactions(debtTransactionsData.transactions || []);
      setProjectDebtTransactions(projectDebtTransactionsData.transactions || []);

      // NEW: Fetch debts report (true aggregation)
      const debtsReportRes = await fetch('/api/projects/accounting/reports/debts');
      const debtsReport = await debtsReportRes.json();

      setOverviewStats({
        totalBalance: statsData.totalBalance,
        totalIncomeThisMonth: statsData.totalIncomeThisMonth,
        totalIncome: statsData.totalIncome, // Total income (all time)
        totalExpensesThisMonth: statsData.totalExpensesThisMonth,
        totalExpenses: statsData.totalExpenses, // Total expenses (all time, excluding fixed assets)
        fixedAssetExpenses: statsData.fixedAssetExpenses || 0, // Fixed asset expenses (all time)
        fixedAssetExpensesThisMonth: statsData.fixedAssetExpensesThisMonth || 0, // Fixed asset expenses this month
        totalPayablesReceived: statsData.totalPayablesReceived || 0,
        totalPayablesReceivedThisMonth: statsData.totalPayablesReceivedThisMonth || 0,
        totalReceivables: debtsReport.summary?.totalReceivablesRemaining || 0,
        totalPayables: debtsReport.summary?.totalDebtsRemaining || 0,
        netFlowThisMonth: statsData.netFlowThisMonth,
        totalBankAccounts: statsData.totalBankAccounts,
        totalCashAccounts: statsData.totalCashAccounts,
        totalMobileMoneyAccounts: statsData.totalMobileMoneyAccounts, // Use actual data
        monthlyCashFlow: statsData.monthlyCashFlow, // From reports API
        accountDistribution: statsData.accountDistribution, // From reports API
      });
      setAccounts(accountsData.accounts); // Data already converted to Number in API
      setRecentTransactions(transactionsData.transactions); // Data already converted to Number in API

      // Strict separation: Use aggregate project debts for the Project tab, and discrete non-project receivables for the general tab.
      const clientReceivables = debtsReport.clientReceivables || [];
      const company = clientReceivables.filter((d: any) => !d.projectId);
      
      const project = debtsReport.projectDebts || [];
      
      // Payables are strictly liabilities the company owes (vendors, etc.)
      const payables = debtsReport.companyDebts || [];

      setCompanyDebts(company);
      setProjectDebts(project);
      setPayableDebts(payables);

    } catch (error: any) {
      console.error('Error fetching accounting data:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka xogta accounting-ga la soo gelinayay.', type: 'error' });
      setOverviewStats(null);
      setAccounts([]);
      setRecentTransactions([]);
    } finally {
      setPageLoading(false);
    }
  };

  const handleEditAccount = (id: string) => {
    router.push(`/projects/accounting/accounts/edit/${id}`); // Navigate to edit account page
  };

  const handleDeleteAccount = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad tirtirto account-kan? Tan lama soo celin karo!')) {
      try {
        const response = await fetch(`/api/projects/accounting/accounts/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete account');

        setToastMessage({ message: data.message || 'Account-ka si guul leh ayaa loo tirtiray!', type: 'success' });
        fetchAccountingData(); // Re-fetch all data after deleting
      } catch (error: any) {
        console.error('Error deleting account:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka account-ka la tirtirayay.', type: 'error' });
      }
    }
  };

  const handleEditTransaction = (id: string) => {
    router.push(`/projects/accounting/transactions/edit/${id}`); // Navigate to edit transaction page
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

        // If API returned an event, notify all pages about transaction deletion for real-time updates
        if (data.event) {
          const deleteEvent = data.event;

          // Store in localStorage for cross-tab communication
          localStorage.setItem('transactionDeleted', JSON.stringify(deleteEvent));
          localStorage.setItem('expenses_updated', JSON.stringify(deleteEvent));
          localStorage.setItem('project_updated', JSON.stringify(deleteEvent));

          // Trigger storage events for same-tab listeners
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'transactionDeleted',
            newValue: JSON.stringify(deleteEvent)
          }));
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'expenses_updated',
            newValue: JSON.stringify(deleteEvent)
          }));
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'project_updated',
            newValue: JSON.stringify(deleteEvent)
          }));

          // Trigger custom events for same-tab listeners
          window.dispatchEvent(new CustomEvent('expense_updated', { detail: deleteEvent }));
          window.dispatchEvent(new CustomEvent('project_updated', { detail: deleteEvent }));
        }

        fetchAccountingData(); // Re-fetch all data after deleting
      } catch (error: any) {
        console.error('Error deleting transaction:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka dhaqdhaqaaqa lacagta la tirtirayay.', type: 'error' });
      }
    }
  };


  useEffect(() => {
    fetchAccountingData();
  }, []);

  // Auto-refresh data every 30 seconds for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAccountingData(true);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Listen for storage events (when expenses are added/deleted from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'expenses_updated' || e.key === 'project_updated' || e.key === 'transactionCreated' || e.key === 'transactionDeleted') {
        console.log('Accounting page: Storage event detected, refreshing data...', e.key);
        fetchAccountingData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for custom events (when expenses are added/deleted from same tab)
  useEffect(() => {
    const handleExpenseUpdate = (event: any) => {
      console.log('Accounting page: Custom event detected, refreshing data...', event.type, event.detail);
      fetchAccountingData();
    };

    window.addEventListener('expense_updated', handleExpenseUpdate);
    window.addEventListener('project_updated', handleExpenseUpdate);
    window.addEventListener('transaction_created', handleExpenseUpdate);
    window.addEventListener('transaction_deleted', handleExpenseUpdate);

    return () => {
      window.removeEventListener('expense_updated', handleExpenseUpdate);
      window.removeEventListener('project_updated', handleExpenseUpdate);
      window.removeEventListener('transaction_created', handleExpenseUpdate);
      window.removeEventListener('transaction_deleted', handleExpenseUpdate);
    };
  }, []);

  // Chart Data for Monthly Cash Flow (from overviewStats only - no dummy data)
  const monthlyCashFlowData = overviewStats?.monthlyCashFlow || [];
  const accountDistributionData = overviewStats?.accountDistribution || [];

  return (
    <Layout>
      {/* Dynamic Animated Background Patterns */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] bg-primary/5 dark:bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] -left-[10%] w-[30%] h-[30%] bg-secondary/5 dark:bg-secondary/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-[20%] w-[25%] h-[25%] bg-accent/5 dark:bg-accent/10 blur-[100px] rounded-full" />
      </div>

      <MobileAccountingView 
        overviewStats={overviewStats} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        recentTransactions={recentTransactions} 
        accounts={accounts} 
        companyDebts={companyDebts}
        payableDebts={payableDebts}
      />

      <div className="hidden md:block">
      {/* Modern Header Row */}
      <div className="flex flex-col xl:flex-row xl:justify-between xl:items-end mb-8 gap-4 px-2 pt-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Link href="/dashboard" className="p-2 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 rounded-xl shadow-sm border border-black/5 dark:border-white/5 transition-all text-mediumGray dark:text-gray-400 hover:text-primary">
              <ArrowLeft size={20} />
            </Link>
            <span className="text-xs tracking-widest font-bold uppercase text-primary bg-primary/10 px-3 py-1 rounded-full">Finance Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-darkGray dark:text-white tracking-tight">
            Accounting
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full xl:w-auto">
          <Link
            href="/projects/accounting/transactions/transfer"
            className="flex-1 sm:flex-none flex items-center justify-center px-4 md:px-5 py-3 md:py-2.5 bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 font-bold rounded-2xl shadow-sm hover:shadow-md border border-black/5 dark:border-white/10 hover:-translate-y-0.5 transition-all text-sm md:text-base"
          >
            <Repeat size={18} className="mr-2 text-primary" /> Transfer funds
          </Link>
          <Link
            href="/projects/accounting/transactions/add"
            className="flex-1 sm:flex-none flex items-center justify-center px-4 md:px-6 py-3 md:py-2.5 bg-gradient-to-tr from-primary to-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all text-sm md:text-base"
          >
            <Plus size={18} className="mr-2" /> New Entry
          </Link>
        </div>
      </div>

      {/* Floating Segmented Tabs Control */}
      <div className="sticky top-0 z-40 flex justify-start lg:justify-center mb-8 px-2 overflow-x-auto custom-scrollbar pt-2 pb-4 -mx-4 sm:mx-0 pr-4 sm:pr-0">
        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 p-1.5 rounded-full shadow-lg shadow-black/5 flex space-x-1 min-w-max mx-4 sm:mx-0">
          {['Overview', 'Transactions', 'Receivables', 'Payables', 'Project Debts', 'Accounts', 'Reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex items-center px-5 py-2.5 text-sm font-bold transition-all duration-300 rounded-full ${
                activeTab === tab
                  ? 'text-primary dark:text-white'
                  : 'text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
              }`}
            >
              {activeTab === tab && (
                <span className="absolute inset-0 rounded-full bg-white dark:bg-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/5 -z-10 transition-all duration-300" />
              )}
              {tab === 'Overview' && <LayoutGrid size={16} className={`mr-2 ${activeTab === tab ? '' : 'opacity-70'}`} />}
              {tab === 'Transactions' && <ReceiptText size={16} className={`mr-2 ${activeTab === tab ? '' : 'opacity-70'}`} />}
              {tab === 'Receivables' && <Scale size={16} className={`mr-2 ${activeTab === tab ? '' : 'opacity-70'}`} />}
              {tab === 'Payables' && <ClockIcon size={16} className={`mr-2 ${activeTab === tab ? '' : 'opacity-70'}`} />}
              {tab === 'Project Debts' && <BriefcaseIcon size={16} className={`mr-2 ${activeTab === tab ? '' : 'opacity-70'}`} />}
              {tab === 'Accounts' && <Landmark size={16} className={`mr-2 ${activeTab === tab ? '' : 'opacity-70'}`} />}
              {tab === 'Reports' && <TrendingUp size={16} className={`mr-2 ${activeTab === tab ? '' : 'opacity-70'}`} />}
              <span className="whitespace-nowrap">{tab === 'Project Debts' ? 'Projects' : tab}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-2">
        {pageLoading ? (
          <div className="flex flex-col items-center justify-center py-32 animate-pulse pb-64">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded-full" />
          </div>
        ) : overviewStats ? (
          <div className="animate-fade-in-up">
            
            {/* --- OVERVIEW TAB --- */}
            {activeTab === 'Overview' && (
              <div className="space-y-4 sm:space-y-6">
                {/* BENTO GRID */}
                <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  
                  {/* HERO BENTO - TOTAL BALANCE */}
                  <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-gray-900 via-gray-800 to-black dark:from-gray-800 dark:to-gray-950 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden group min-h-[300px]">
                    <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay" style={{backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')"}} />
                    <div className="absolute -top-32 -right-32 w-72 h-72 bg-primary/40 blur-[100px] rounded-full group-hover:bg-primary/50 group-hover:scale-110 transition-all duration-700" />
                    <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-secondary/20 blur-[100px] rounded-full group-hover:bg-secondary/30 group-hover:scale-110 transition-all duration-700 delay-150" />
                    
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div className="flex justify-between items-start mb-8 md:mb-10">
                        <div>
                          <div className="flex items-center space-x-2 text-gray-400 mb-1">
                            <DollarSign size={18} className="text-primary" />
                            <h4 className="text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-500">Wadarta Lacagta</h4>
                          </div>
                          <p className="text-xs text-gray-500 font-medium">Total Company Balance</p>
                        </div>
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner hidden sm:block transform group-hover:rotate-12 transition-transform duration-500">
                          <Banknote size={24} className="text-white drop-shadow-md" />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-baseline space-x-1 sm:space-x-2 flex-wrap drop-shadow-lg break-all">
                          <span className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter">
                            {overviewStats.totalBalance.toLocaleString()}
                          </span>
                          <span className="text-xl md:text-2xl font-black text-gray-400">ETB</span>
                        </div>
                        
                        <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 md:gap-4">
                          <div className="flex-1 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md border border-white/10 rounded-2xl p-4 transition-colors">
                            <p className="text-[10px] md:text-xs text-gray-400 font-bold mb-1.5 uppercase tracking-widest flex items-center"><TrendingUp size={12} className="mr-1 text-green-400"/> Operating Income</p>
                            <p className="text-lg md:text-xl font-black text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]">+{overviewStats.totalIncome.toLocaleString()}</p>
                          </div>
                          <div className="flex-1 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md border border-white/10 rounded-2xl p-4 transition-colors">
                            <p className="text-[10px] md:text-xs text-gray-400 font-bold mb-1.5 uppercase tracking-widest flex items-center"><TrendingDown size={12} className="mr-1 text-red-400"/> Total Expenses</p>
                            <p className="text-lg md:text-xl font-black text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]">-{overviewStats.totalExpenses.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MINI BENTO 1 - DAYNTA ACTIVITY */}
                  <div className="bg-gradient-to-b from-white/90 to-white/60 dark:from-gray-800/90 dark:to-gray-800/60 backdrop-blur-2xl border border-white dark:border-gray-700/50 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 shadow-xl hover:shadow-2xl md:hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full group-hover:bg-orange-500/20 transition-colors" />
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div className="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 p-3 rounded-2xl shadow-sm border border-orange-200/50 dark:border-orange-700/30">
                        <ClockIcon size={22} className="text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="text-[10px] font-black text-mediumGray uppercase tracking-widest">Loanes & Debts</span>
                    </div>
                    <div className="mb-4 relative z-10">
                      <p className="text-3xl lg:text-4xl font-black text-darkGray dark:text-white tracking-tight">{overviewStats.totalReceivables?.toLocaleString() || 0}</p>
                      <p className="text-xs font-bold text-mediumGray dark:text-gray-400 mt-1">Total Receivables</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-auto pt-5 border-t border-gray-100 dark:border-gray-700/50 relative z-10">
                      <div className="bg-gray-50/50 dark:bg-gray-900/30 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] uppercase font-black text-mediumGray mb-1">Payables</p>
                        <p className="text-base font-black text-orange-600 dark:text-orange-400 drop-shadow-sm">{overviewStats.totalPayables?.toLocaleString() || 0}</p>
                      </div>
                      <div className="bg-gray-50/50 dark:bg-gray-900/30 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] uppercase font-black text-mediumGray mb-1">Loans</p>
                        <p className="text-base font-black text-red-600 dark:text-red-400 drop-shadow-sm">{debtTransactions.filter(t => t.type === 'DEBT_TAKEN').length}</p>
                      </div>
                    </div>
                  </div>

                  {/* MINI BENTO 2 - HANTIDA / ACCOUNTS */}
                  <div className="bg-gradient-to-b from-white/90 to-white/60 dark:from-gray-800/90 dark:to-gray-800/60 backdrop-blur-2xl border border-white dark:border-gray-700/50 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 shadow-xl hover:shadow-2xl md:hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full group-hover:bg-purple-500/20 transition-colors" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 p-3 rounded-2xl shadow-sm border border-purple-200/50 dark:border-purple-700/30">
                          <HardDrive size={22} className="text-purple-700 dark:text-purple-400" />
                        </div>
                        <span className="text-[10px] font-black text-mediumGray uppercase tracking-widest">Fixed Assets</span>
                      </div>
                      <p className="text-3xl lg:text-4xl font-black text-darkGray dark:text-white tracking-tight">{overviewStats.fixedAssetExpenses?.toLocaleString()}</p>
                      <p className="text-xs font-bold text-mediumGray dark:text-gray-400 mt-1">Total Asset Value (ETB)</p>
                    </div>

                    <div className="pt-5 mt-5 border-t border-gray-100 dark:border-gray-700/50 relative z-10">
                      <div className="flex space-x-2">
                        <div className="flex-1 bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900/50 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/30 text-center">
                          <p className="text-lg font-black text-blue-600 dark:text-blue-400 drop-shadow-sm">{overviewStats.totalBankAccounts}</p>
                          <p className="text-[9px] font-black text-blue-800/60 dark:text-blue-200/60 uppercase tracking-widest mt-0.5">Bank</p>
                        </div>
                        <div className="flex-1 bg-gradient-to-b from-green-50 to-white dark:from-green-900/20 dark:to-gray-900/50 p-2.5 rounded-xl border border-green-100 dark:border-green-900/30 text-center">
                          <p className="text-lg font-black text-green-600 dark:text-green-400 drop-shadow-sm">{overviewStats.totalCashAccounts}</p>
                          <p className="text-[9px] font-black text-green-800/60 dark:text-green-200/60 uppercase tracking-widest mt-0.5">Cash</p>
                        </div>
                        <div className="flex-1 bg-gradient-to-b from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-900/50 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900/30 text-center">
                          <p className="text-lg font-black text-purple-600 dark:text-purple-400 drop-shadow-sm">{overviewStats.totalMobileMoneyAccounts}</p>
                          <p className="text-[9px] font-black text-purple-800/60 dark:text-purple-200/60 uppercase tracking-widest mt-0.5">Mob</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </main>

                {/* CHARTS ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
                  {/* CASH FLOW CHART */}
                  <div className="lg:col-span-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white dark:border-gray-700/50 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
                      <div className="flex items-center">
                        <div className="p-3.5 bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 rounded-2xl mr-4 border border-primary/20">
                          <TrendingUp size={24} className="text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-darkGray dark:text-white leading-tight mb-1">Cash Flow Trend</h3>
                          <p className="text-[10px] md:text-xs font-bold tracking-widest text-mediumGray uppercase">Monthly Revenue vs Expenses</p>
                        </div>
                      </div>
                      <div className="flex space-x-3 bg-gray-50/80 dark:bg-gray-900/80 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner">
                        <div className="flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                          <div className="w-2.5 h-2.5 bg-[#2ECC71] rounded-full mr-2 shadow-[0_0_8px_rgba(46,204,113,0.6)]"></div>
                          <span className="text-xs font-black text-darkGray dark:text-white uppercase">Dakhli</span>
                        </div>
                        <div className="flex items-center px-3 py-1.5 text-mediumGray">
                          <div className="w-2.5 h-2.5 bg-[#E74C3C] rounded-full mr-2 shadow-[0_0_8px_rgba(231,76,60,0.6)]"></div>
                          <span className="text-xs font-black text-darkGray dark:text-white uppercase">Kharash</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full h-[250px] md:h-[300px]">
                      <ResponsiveContainer>
                        {monthlyCashFlowData.length > 0 ? (
                          <LineChart data={monthlyCashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-800" vertical={false} />
                            <XAxis dataKey="month" stroke="#A0AEC0" className="dark:text-gray-500 font-bold text-xs" tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#A0AEC0" className="dark:text-gray-500 font-bold text-xs" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)', padding: '16px' }}
                              itemStyle={{ fontWeight: '900', fontFamily: 'inherit' }}
                            />
                            <Line type="monotone" dataKey="income" stroke="url(#colorIncome)" strokeWidth={4} dot={false} activeDot={{ r: 8, strokeWidth: 0, fill: '#2ECC71', filter: 'drop-shadow(0px 0px 8px rgba(46,204,113,0.8))' }} />
                            <Line type="monotone" dataKey="expense" stroke="url(#colorExpense)" strokeWidth={4} dot={false} activeDot={{ r: 8, strokeWidth: 0, fill: '#E74C3C', filter: 'drop-shadow(0px 0px 8px rgba(231,76,60,0.8))' }} />
                            <defs>
                              <linearGradient id="colorIncome" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="5%" stopColor="#2ECC71" stopOpacity={1}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={1}/>
                              </linearGradient>
                              <linearGradient id="colorExpense" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="5%" stopColor="#E74C3C" stopOpacity={1}/>
                                <stop offset="95%" stopColor="#EF4444" stopOpacity={1}/>
                              </linearGradient>
                            </defs>
                          </LineChart>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-mediumGray">
                            <TrendingUp size={48} className="text-gray-200 dark:text-gray-700 mb-4" />
                            <p className="font-bold text-sm">No transaction data available</p>
                          </div>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* PIE CHART */}
                  <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white dark:border-gray-700/50 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-xl flex flex-col">
                    <div className="flex items-center mb-6">
                      <div className="p-3.5 bg-gradient-to-br from-accent/20 to-accent/5 dark:from-accent/30 dark:to-accent/10 rounded-2xl mr-4 border border-accent/20">
                        <PieChartIcon size={24} className="text-accent" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-darkGray dark:text-white leading-tight mb-1">Funds Allocation</h3>
                        <p className="text-[10px] md:text-xs font-bold tracking-widest text-mediumGray uppercase">Distribution by Account</p>
                      </div>
                    </div>

                    <div className="w-full h-[200px] md:h-[220px] flex-grow">
                      <ResponsiveContainer>
                        {accountDistributionData.length > 0 ? (
                          <PieChart>
                            <Pie
                              data={accountDistributionData}
                              cx="50%" cy="50%" innerRadius="65%" outerRadius="90%"
                              paddingAngle={6} dataKey="value" stroke="none" cornerRadius={8}
                            >
                              {accountDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} style={{ filter: `drop-shadow(0px 4px 8px ${CHART_COLORS[index % CHART_COLORS.length]}40)` }} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                              itemStyle={{ fontWeight: '900' }}
                            />
                          </PieChart>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-mediumGray">
                            <PieChartIcon size={48} className="text-gray-200 dark:text-gray-700 mb-4" />
                            <p className="font-bold text-sm">No accounts found</p>
                          </div>
                        )}
                      </ResponsiveContainer>
                    </div>
                    {/* LEGEND PILLS */}
                    <div className="flex flex-wrap gap-2 justify-center mt-6">
                       {accountDistributionData.map((entry, idx) => (
                         <div key={idx} className="flex items-center bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                           <div className="w-3 h-3 rounded-full mr-2 shadow-inner" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></div>
                           <span className="text-[11px] font-black tracking-wide text-darkGray dark:text-gray-200">{entry.name}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- TRANSACTIONS TAB --- */}
            {activeTab === 'Transactions' && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl border border-white dark:border-gray-700/50 rounded-[1.5rem] sm:rounded-[2rem] p-5 md:p-8 shadow-2xl animate-fade-in-up">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-darkGray dark:text-white flex items-center tracking-tight">
                      <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-2xl mr-4 border border-primary/20">
                        <ReceiptText className="text-primary" size={24} /> 
                      </div>
                      Ledger History
                    </h3>
                  </div>
                  <Link href="/projects/accounting/transactions/add" className="px-5 py-3 bg-gradient-to-tr from-primary to-blue-500 text-white rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all font-bold flex items-center justify-center space-x-2">
                    <Plus size={18} /> <span>New Entry</span>
                  </Link>
                </div>

                {recentTransactions.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-900/50 rounded-[1.5rem] sm:rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                     <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <ReceiptText size={40} className="text-gray-300 dark:text-gray-600" />
                     </div>
                     <h4 className="text-xl font-black text-darkGray dark:text-white mb-2">No ledgers written</h4>
                     <p className="text-sm font-medium text-mediumGray">Your recent transactions will appear here.</p>
                  </div>
                ) : (
                  <>
                    <div className="block md:hidden space-y-4">
                      {recentTransactions.map(trx => (
                        <MobileTransactionCard key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                      ))}
                    </div>
                    <div className="hidden md:block overflow-hidden rounded-[1.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                             <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-mediumGray">Date</th>
                             <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-mediumGray">Description</th>
                             <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-mediumGray">Type</th>
                             <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-mediumGray text-right">Amount</th>
                             <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-mediumGray">Account</th>
                             <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-mediumGray">Link</th>
                             <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-mediumGray text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                           {recentTransactions.map(trx => (
                             <TransactionRow key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                           ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                
                {recentTransactions.length > 0 && (
                  <div className="mt-8 flex justify-center">
                    <Link href="/projects/accounting/transactions" className="group px-8 py-3.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-full transition-all text-sm font-black flex items-center shadow-sm">
                      View Full Ledger <ArrowLeft size={16} className="ml-3 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* --- RECEIVABLES & PROJECT DEBTS & ACCOUNTS & REPORTS - reusing upgraded cards above but styling to match glassmorphism --- */}
            {/* Same aesthetic applied to remaining tabs */}
            {activeTab === 'Receivables' && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl border border-white dark:border-gray-700/50 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-2xl animate-fade-in-up">
                 <div className="mb-8">
                    <h3 className="text-2xl md:text-3xl font-black text-darkGray dark:text-white flex items-center tracking-tight">
                      <div className="p-3 bg-accent/10 dark:bg-accent/20 rounded-2xl mr-4 border border-accent/20">
                        <Scale className="text-accent" size={24} />
                      </div>
                      Client Receivables
                    </h3>
                 </div>
                 
                 {companyDebts.filter(d => (d.remaining || 0) > 0).length === 0 ? (
                   <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-900/50 rounded-[1.5rem] sm:rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                     <p className="font-bold text-mediumGray">No pending client receivables found.</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                     {companyDebts.filter(d => (d.remaining || 0) > 0).map(debt => (
                       <div key={debt.id || debt.lender} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group">
                         <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 dark:opacity-30 transition-transform duration-700 group-hover:scale-[2] ${debt.status === 'Overdue' ? 'bg-red-500' : 'bg-accent'}`} />
                         
                         <div className="flex justify-between items-start mb-6 relative z-10">
                           <h4 className="font-black text-xl text-darkGray dark:text-white truncate pr-4">{debt.lender || debt.client || debt.customerName || '--'}</h4>
                           <span className={`px-3 py-1 font-black text-[10px] tracking-widest uppercase rounded-full shadow-sm ${
                             debt.status === 'Overdue' ? 'bg-red-100 text-red-600 dark:bg-red-900/40 border border-red-200 dark:border-red-800/50' : 'bg-accent/10 text-accent dark:bg-accent/20 border border-accent/20 dark:border-accent/10'
                           }`}>{debt.status}</span>
                         </div>
                         
                         <div className="space-y-4 relative z-10 bg-gray-50/80 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 backdrop-blur-md">
                           <div className="flex justify-between text-sm items-center">
                             <span className="text-mediumGray font-bold text-[10px] uppercase tracking-widest">Total Value</span>
                             <span className="font-black text-darkGray dark:text-gray-300">{debt.amount?.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between text-sm items-center">
                             <span className="text-mediumGray font-bold text-[10px] uppercase tracking-widest">Collected</span>
                             <span className="font-black text-green-600 dark:text-green-400">{debt.received?.toLocaleString() || debt.paid?.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700 items-center">
                             <span className="font-black text-darkGray dark:text-white text-xs uppercase tracking-widest">Outstanding</span>
                             <span className="font-black text-xl text-red-500">{debt.remaining?.toLocaleString()}</span>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'Payables' && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl border border-white dark:border-gray-700/50 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-2xl animate-fade-in-up">
                 <div className="mb-8">
                    <h3 className="text-2xl md:text-3xl font-black text-darkGray dark:text-white flex items-center tracking-tight">
                      <div className="p-3 bg-orange-500/10 dark:bg-orange-500/20 rounded-2xl mr-4 border border-orange-500/20">
                        <ClockIcon className="text-orange-500" size={24} />
                      </div>
                      Company Payables
                    </h3>
                 </div>
                 
                 {payableDebts.filter(d => (d.remaining || 0) > 0).length === 0 ? (
                   <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-900/50 rounded-[1.5rem] sm:rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                     <p className="font-bold text-mediumGray">No pending payables found.</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                     {payableDebts.filter(d => (d.remaining || 0) > 0).map(debt => (
                       <div key={debt.id || debt.lender} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group">
                         <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 dark:opacity-30 transition-transform duration-700 group-hover:scale-[2] ${debt.status === 'Overdue' ? 'bg-red-500' : 'bg-orange-500'}`} />
                         
                         <div className="flex justify-between items-start mb-6 relative z-10">
                           <h4 className="font-black text-xl text-darkGray dark:text-white truncate pr-4">{debt.lender || debt.client || debt.customerName || '--'}</h4>
                           <span className={`px-3 py-1 font-black text-[10px] tracking-widest uppercase rounded-full shadow-sm ${
                             debt.status === 'Overdue' ? 'bg-red-100 text-red-600 dark:bg-red-900/40 border border-red-200 dark:border-red-800/50' : 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 border border-orange-500/20'
                           }`}>{debt.status}</span>
                         </div>
                         
                         <div className="space-y-4 relative z-10 bg-gray-50/80 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 backdrop-blur-md">
                           <div className="flex justify-between text-sm items-center">
                             <span className="text-mediumGray font-bold text-[10px] uppercase tracking-widest">Total Value</span>
                             <span className="font-black text-darkGray dark:text-gray-300">{debt.amount?.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between text-sm items-center">
                             <span className="text-mediumGray font-bold text-[10px] uppercase tracking-widest">Paid</span>
                             <span className="font-black text-green-600 dark:text-green-400">{debt.paid?.toLocaleString() || debt.received?.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700 items-center">
                             <span className="font-black text-darkGray dark:text-white text-xs uppercase tracking-widest">Outstanding</span>
                             <span className="font-black text-xl text-red-500">{debt.remaining?.toLocaleString()}</span>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'Project Debts' && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl border border-white dark:border-gray-700/50 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-2xl animate-fade-in-up">
                 <div className="mb-8">
                    <h3 className="text-2xl md:text-3xl font-black text-darkGray dark:text-white flex items-center tracking-tight">
                      <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl mr-4 border border-blue-500/20">
                        <BriefcaseIcon className="text-blue-600" size={24} />
                      </div>
                      Project Receivables
                    </h3>
                 </div>
                 
                 {projectDebts.filter(d => (d.remaining || 0) > 0).length === 0 ? (
                   <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-900/50 rounded-[1.5rem] sm:rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                     <p className="font-bold text-mediumGray">No pending project debts found.</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                     {projectDebts.filter(d => (d.remaining || 0) > 0).map(debt => (
                       <div key={debt.id || debt.project} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group">
                         <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/20 blur-3xl transition-transform duration-700 group-hover:scale-[2]" />
                         
                         <div className="flex justify-between items-start mb-6 relative z-10">
                           <h4 className="font-black text-xl text-darkGray dark:text-white truncate pr-4">{debt.project || debt.projectName || '--'}</h4>
                           <span className="px-3 py-1 font-black text-[10px] tracking-widest uppercase rounded-full shadow-sm bg-blue-50 text-blue-600 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50">
                             {debt.status}
                           </span>
                         </div>
                         
                         <div className="space-y-4 relative z-10 bg-gray-50/80 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 backdrop-blur-md">
                           <div className="flex justify-between text-sm items-center">
                             <span className="text-mediumGray font-bold text-[10px] uppercase tracking-widest">Agreement value</span>
                             <span className="font-black text-darkGray dark:text-gray-300">{debt.amount?.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between text-sm items-center">
                             <span className="text-mediumGray font-bold text-[10px] uppercase tracking-widest">Collected</span>
                             <span className="font-black text-green-600 dark:text-green-400">{debt.paid?.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700 items-center">
                             <span className="font-black text-darkGray dark:text-white text-xs uppercase tracking-widest">Pending</span>
                             <span className="font-black text-xl text-red-500">{debt.remaining?.toLocaleString()}</span>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'Accounts' && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl border border-white dark:border-gray-700/50 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-2xl animate-fade-in-up">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-darkGray dark:text-white flex items-center tracking-tight">
                      <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-2xl mr-4 border border-primary/20">
                         <Landmark className="text-primary" size={24} />
                      </div>
                      Internal Accounts
                    </h3>
                  </div>
                  <Link href="/projects/accounting/accounts/add" className="px-6 py-3.5 bg-gradient-to-tr from-primary to-blue-500 text-white rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all font-bold flex items-center justify-center space-x-2">
                    <Plus size={18} /> <span>Create Account</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {accounts.map(acc => (
                     <div key={acc.id} className="relative group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[1.5rem] p-6 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[220px]">
                       <div className={`absolute -bottom-10 -right-10 w-40 h-40 blur-[50px] opacity-20 group-hover:opacity-40 transition-all duration-700 ${
                         acc.type === 'BANK' ? 'bg-blue-600' : acc.type === 'CASH' ? 'bg-green-600' : 'bg-purple-600'
                       }`}></div>
                       
                       <div className="flex justify-between items-start mb-8 relative z-10">
                         <div className={`p-4 rounded-2xl border backdrop-blur-md shadow-sm ${
                           acc.type === 'BANK' ? 'bg-blue-50/80 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800/50' : 
                           acc.type === 'CASH' ? 'bg-green-50/80 border-green-100 dark:bg-green-900/30 dark:border-green-800/50' : 
                           'bg-purple-50/80 border-purple-100 dark:bg-purple-900/30 dark:border-purple-800/50'
                         }`}>
                           {acc.type === 'BANK' ? <Landmark size={24} className="text-blue-600 dark:text-blue-400" /> : 
                            acc.type === 'CASH' ? <Banknote size={24} className="text-green-600 dark:text-green-400" /> : 
                            <CreditCard size={24} className="text-purple-600 dark:text-purple-400" />}
                         </div>
                         <div className="flex space-x-1 border border-gray-100 dark:border-gray-800 rounded-xl p-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-all shadow-sm">
                            <Link href={`/projects/accounting/accounts/${acc.id}`} className="p-2 text-mediumGray hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><Eye size={16}/></Link>
                            <button onClick={() => handleEditAccount(acc.id)} className="p-2 text-mediumGray hover:text-accent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><Edit size={16}/></button>
                            <button onClick={() => handleDeleteAccount(acc.id)} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={16}/></button>
                         </div>
                       </div>
                       
                       <div className="relative z-10">
                         <div className="flex items-center space-x-2 mb-1.5">
                           <div className={`w-2 h-2 rounded-full shadow-sm ${
                             acc.type === 'BANK' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 
                             acc.type === 'CASH' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 
                             'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                           }`}></div>
                           <p className="text-[10px] font-black text-mediumGray uppercase tracking-widest">{acc.type}</p>
                         </div>
                         <h4 className="text-xl font-black text-darkGray dark:text-white truncate mb-4">{acc.name}</h4>
                         <div className="flex items-baseline space-x-1.5 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-md w-full px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                           <span className="text-2xl font-black text-darkGray dark:text-white tracking-tighter">{acc.balance.toLocaleString()}</span>
                           <span className="text-xs font-bold text-mediumGray">{acc.currency}</span>
                         </div>
                       </div>
                     </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Reports' && (
              <div className="animate-fade-in-up">
                 <div className="mb-8 px-2">
                    <h3 className="text-2xl md:text-3xl font-black text-darkGray dark:text-white flex items-center tracking-tight">
                      <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-2xl mr-4 border border-primary/20">
                         <TrendingUp className="text-primary" size={24} />
                      </div>
                      Business Intelligence Reports
                    </h3>
                    <p className="text-mediumGray font-bold mt-2 tracking-wide text-sm ml-[4.5rem]">Generate comprehensive financial insights.</p>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <Link href="/reports/profit-loss" className="group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-lg hover:shadow-2xl md:hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent -z-10" />
                       <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-[2] transition-transform duration-700" />
                       <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_10px_20px_rgba(59,130,246,0.3)] rounded-2xl mb-8 flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300">
                         <TrendingUp size={28} className="text-white" />
                       </div>
                       <h4 className="text-2xl font-black text-darkGray dark:text-white mb-3 tracking-tight">Profit & Loss</h4>
                       <p className="text-sm font-semibold text-mediumGray leading-relaxed">Comprehensive P&L analysis covering all operations.</p>
                       <div className="mt-8 flex items-center text-blue-600 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                          GENERATE REPORT <ArrowLeft size={16} className="ml-2 rotate-180" />
                       </div>
                    </Link>

                    <Link href="/reports/bank" className="group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-lg hover:shadow-2xl md:hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-900/10 dark:to-transparent -z-10" />
                       <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/10 rounded-full blur-2xl group-hover:scale-[2] transition-transform duration-700" />
                       <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 shadow-[0_10px_20px_rgba(34,197,94,0.3)] rounded-2xl mb-8 flex items-center justify-center transform group-hover:-rotate-6 transition-transform duration-300">
                         <Landmark size={28} className="text-white" />
                       </div>
                       <h4 className="text-2xl font-black text-darkGray dark:text-white mb-3 tracking-tight">Cash Flow</h4>
                       <p className="text-sm font-semibold text-mediumGray leading-relaxed">Track liquidity, inflows, and outgoing bank funds.</p>
                       <div className="mt-8 flex items-center text-green-600 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                          GENERATE REPORT <ArrowLeft size={16} className="ml-2 rotate-180" />
                       </div>
                    </Link>

                    <Link href="/reports/expenses" className="group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-lg hover:shadow-2xl md:hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent -z-10" />
                       <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 rounded-full blur-2xl group-hover:scale-[2] transition-transform duration-700" />
                       <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 shadow-[0_10px_20px_rgba(239,68,68,0.3)] rounded-2xl mb-8 flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300">
                         <DollarSign size={28} className="text-white" />
                       </div>
                       <h4 className="text-2xl font-black text-darkGray dark:text-white mb-3 tracking-tight">Expenses</h4>
                       <p className="text-sm font-semibold text-mediumGray leading-relaxed">Detailed breakdown of all company expenditures.</p>
                       <div className="mt-8 flex items-center text-red-600 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                          GENERATE REPORT <ArrowLeft size={16} className="ml-2 rotate-180" />
                       </div>
                    </Link>

                    <Link href="/reports/debts" className="group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-lg hover:shadow-2xl md:hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-900/10 dark:to-transparent -z-10" />
                       <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl group-hover:scale-[2] transition-transform duration-700" />
                       <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_10px_20px_rgba(249,115,22,0.3)] rounded-2xl mb-8 flex items-center justify-center transform group-hover:-rotate-6 transition-transform duration-300">
                         <Scale size={28} className="text-white" />
                       </div>
                       <h4 className="text-2xl font-black text-darkGray dark:text-white mb-3 tracking-tight">Debt Ledger</h4>
                       <p className="text-sm font-semibold text-mediumGray leading-relaxed">Comprehensive view of open loans and receivables.</p>
                       <div className="mt-8 flex items-center text-orange-600 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                          GENERATE REPORT <ArrowLeft size={16} className="ml-2 rotate-180" />
                       </div>
                    </Link>
                 </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
      </div>
      {toastMessage && <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />}
    </Layout>
  );
}
