// app/accounting/page.tsx - Accounting Overview Page (10000% Design - API Integration & Enhanced)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '../../components/layouts/Layout';
import { 
  ArrowLeft, Landmark, Plus, Search, Filter, Calendar, List, LayoutGrid, 
  DollarSign, CreditCard, Banknote, RefreshCw, Eye, Edit, Trash2,
  TrendingUp, TrendingDown, Info as InfoIcon, CheckCircle, XCircle, Clock as ClockIcon,
  User as UserIcon, Briefcase as BriefcaseIcon, Tag as TagIcon,
  Coins, Repeat, ReceiptText, Users, Building, Package, Scale, Truck, Mail, Phone, HardDrive // Added HardDrive for fixed assets
} from 'lucide-react';
import Toast from '../../components/common/Toast';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

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
  netFlowThisMonth: number;
  totalBankAccounts: number;
  totalCashAccounts: number;
  totalMobileMoneyAccounts: number; // Added Mobile Money count
  // For charts
  monthlyCashFlow: { month: string; income: number; expense: number; net: number }[];
  accountDistribution: { name: string; value: number; }[];
}

interface DebtsReportCompanyDebt {
  id?: string;
  lender?: string;
  customerName?: string;
  amount?: number;
  paid?: number;
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
        <Banknote size={18} className="text-primary"/> <span>{account.name}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{account.type}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{account.currency}</td>
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-semibold text-right">ETB {account.balance.toLocaleString()}</td>
    <td className="p-4 whitespace-nowrap text-right">
      <div className="flex items-center justify-end space-x-2">
        <Link href={`/accounting/accounts/${account.id}`} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View Details">
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
  </tr>
);

// --- Transaction Table Row Component ---
const TransactionRow: React.FC<{ transaction: Transaction; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ transaction, onEdit, onDelete }) => {
  // Determine sign by type (debt taken = outflow, debt repaid = inflow)
  const isIncome = transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN' || transaction.type === 'DEBT_REPAID';
  const amountColorClass = isIncome ? 'text-secondary' : 'text-redError';
  
  // Enhanced type badge with debt-specific styling
  let typeBadgeClass = '';
  let typeIcon = null;
  let typeDisplayText = transaction.type;
  
  switch (transaction.type) {
    case 'INCOME':
    case 'TRANSFER_IN':
      typeBadgeClass = 'bg-secondary/10 text-secondary border border-secondary/20';
      typeIcon = <TrendingUp size={12} className="mr-1" />;
      typeDisplayText = transaction.type === 'INCOME' ? 'Dakhli' : 'Wareeji (Soo Gal)';
      break;
    case 'EXPENSE':
    case 'TRANSFER_OUT':
      typeBadgeClass = 'bg-redError/10 text-redError border border-redError/20';
      typeIcon = <TrendingDown size={12} className="mr-1" />;
      typeDisplayText = transaction.type === 'EXPENSE' ? 'Kharash' : 'Wareeji (Bax)';
      break;
    case 'DEBT_TAKEN':
      typeBadgeClass = 'bg-orange-500/10 text-orange-600 border border-orange-500/20';
      typeIcon = <Scale size={12} className="mr-1" />;
      typeDisplayText = 'Deyn La Qaatay';
      break;
    case 'DEBT_REPAID':
      typeBadgeClass = 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
      typeIcon = <CheckCircle size={12} className="mr-1" />;
      typeDisplayText = 'Deyn La Bixiyay';
      break;
    default:
      typeBadgeClass = 'bg-primary/10 text-primary border border-primary/20';
      typeIcon = <InfoIcon size={12} className="mr-1" />;
      typeDisplayText = transaction.type;
  }

  return (
    <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
      <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100">{new Date(transaction.transactionDate).toLocaleDateString()}</td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{transaction.description}</td>
      <td className="p-4 whitespace-nowrap">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center ${typeBadgeClass}`}>
          {typeIcon}
          {typeDisplayText}
        </span>
      </td>
      <td className={`p-4 whitespace-nowrap font-semibold ${amountColorClass}`}>
        {isIncome ? '+' : '-'}ETB {Math.abs(transaction.amount).toLocaleString()}
      </td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{transaction.account?.name || 'N/A'}</td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">
        {/* Enhanced context display with debt-specific info */}
        <div className="flex flex-wrap gap-1">
          {transaction.type === 'DEBT_TAKEN' && transaction.vendor?.name && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100">
              <Scale size={12} className="mr-1" />
              Deyn: {transaction.vendor.name}
            </span>
          )}
          {transaction.type === 'DEBT_TAKEN' && transaction.customer?.name && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100">
              <Scale size={12} className="mr-1" />
              Deyn: {transaction.customer.name}
            </span>
          )}
          {transaction.type === 'DEBT_REPAID' && transaction.vendor?.name && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
              <CheckCircle size={12} className="mr-1" />
              Bixiyay: {transaction.vendor.name}
            </span>
          )}
          {transaction.type === 'DEBT_REPAID' && transaction.customer?.name && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
              <CheckCircle size={12} className="mr-1" />
              Bixiyay: {transaction.customer.name}
            </span>
          )}
          
          {/* Project info for all transactions */}
          {transaction.project?.name && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
              <BriefcaseIcon size={12} className="mr-1" />
              {transaction.project.name}
            </span>
          )}
          
          {/* Regular context info for non-debt transactions */}
          {transaction.type !== 'DEBT_TAKEN' && transaction.type !== 'DEBT_REPAID' && (
            <>
              {transaction.vendor?.name && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                  <Truck size={12} className="mr-1" />
                  {transaction.vendor.name}
                </span>
              )}
              {transaction.customer?.name && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                  <UserIcon size={12} className="mr-1" />
                  {transaction.customer.name}
                </span>
              )}
              {transaction.employee?.fullName && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                  <Users size={12} className="mr-1" />
                  {transaction.employee.fullName}
                </span>
              )}
            </>
          )}
          
          {/* Show user who recorded the transaction */}
          {transaction.user?.fullName && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              <UserIcon size={12} className="mr-1" />
              {transaction.user.fullName}
            </span>
          )}
          
          {/* Fallback if no context available */}
          {!transaction.project?.name && !transaction.vendor?.name && !transaction.customer?.name && 
           !transaction.employee?.fullName && !transaction.user?.fullName && (
            <span className="text-gray-400">N/A</span>
          )}
        </div>
      </td>
      <td className="p-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end space-x-2">
          <Link href={`/accounting/transactions/${transaction.id}`} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View Details">
            <Eye size={18} />
          </Link>
          <button onClick={() => onEdit(transaction.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Transaction">
            <Edit size={18} />
          </button>
          <button onClick={() => onDelete(transaction.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Transaction">
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// --- Mobile Transaction Card Component ---
const MobileTransactionCard: React.FC<{ transaction: Transaction; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ transaction, onEdit, onDelete }) => {
  const isIncome = transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN' || transaction.type === 'DEBT_REPAID';
  const amountColorClass = isIncome ? 'text-secondary' : 'text-redError';
  let borderColor = 'border-lightGray dark:border-gray-700';
  if (isIncome) borderColor = 'border-secondary';
  else borderColor = 'border-redError';
  
  // Enhanced type badge with debt-specific styling
  let typeBadgeClass = '';
  let typeIcon = null;
  let typeDisplayText = transaction.type;
  
  switch (transaction.type) {
    case 'INCOME':
    case 'TRANSFER_IN':
      typeBadgeClass = 'bg-secondary/10 text-secondary border border-secondary/20';
      typeIcon = <TrendingUp size={12} className="mr-1" />;
      typeDisplayText = transaction.type === 'INCOME' ? 'Dakhli' : 'Wareeji (Soo Gal)';
      break;
    case 'EXPENSE':
    case 'TRANSFER_OUT':
      typeBadgeClass = 'bg-redError/10 text-redError border border-redError/20';
      typeIcon = <TrendingDown size={12} className="mr-1" />;
      typeDisplayText = transaction.type === 'EXPENSE' ? 'Kharash' : 'Wareeji (Bax)';
      break;
    case 'DEBT_TAKEN':
      typeBadgeClass = 'bg-orange-500/10 text-orange-600 border border-orange-500/20';
      typeIcon = <Scale size={12} className="mr-1" />;
      typeDisplayText = 'Deyn La Qaatay';
      break;
    case 'DEBT_REPAID':
      typeBadgeClass = 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
      typeIcon = <CheckCircle size={12} className="mr-1" />;
      typeDisplayText = 'Deyn La Bixiyay';
      break;
    default:
      typeBadgeClass = 'bg-primary/10 text-primary border border-primary/20';
      typeIcon = <InfoIcon size={12} className="mr-1" />;
      typeDisplayText = transaction.type;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-2 ${borderColor}`}>
      {/* Header with amount and actions */}
      <div className="flex justify-between items-start mb-1">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-darkGray dark:text-gray-100 text-xs flex items-center space-x-1 truncate">
            {isIncome ? <DollarSign size={12} className="text-secondary flex-shrink-0" /> : <XCircle size={12} className="text-redError flex-shrink-0" />} 
            <span className="truncate">{transaction.description}</span>
          </h4>
        </div>
        <div className="flex space-x-0.5 flex-shrink-0 ml-1">
          <Link href={`/accounting/transactions/${transaction.id}`} className="p-1 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View">
            <Eye size={10} />
          </Link>
          <button onClick={() => onEdit(transaction.id)} className="p-1 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit">
            <Edit size={10} />
          </button>
          <button onClick={() => onDelete(transaction.id)} className="p-1 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete">
            <Trash2 size={10} />
          </button>
        </div>
      </div>
      
      {/* Amount - Prominent display */}
      <div className={`mb-1 text-sm font-bold ${amountColorClass}`}>
        {isIncome ? '+' : '-'}ETB {Math.abs(transaction.amount).toLocaleString()}
      </div>
      
      {/* Transaction details */}
      <div className="space-y-1">
        <p className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-1">
          <Calendar size={10} className="flex-shrink-0" /> 
          <span className="truncate">{new Date(transaction.transactionDate).toLocaleDateString()}</span>
        </p>
        <p className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-1">
          <span className={`px-1 py-0.5 rounded-full text-xs font-semibold flex items-center w-fit ${typeBadgeClass}`}>
            {typeIcon}
            {typeDisplayText}
          </span>
        </p>
        <p className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-1">
          <Banknote size={10} className="flex-shrink-0" /> 
          <span className="truncate">{transaction.account?.name || 'N/A'}</span>
        </p>
        
        {/* Context info */}
        {(transaction.project?.name || transaction.vendor?.name || transaction.customer?.name || transaction.employee?.fullName || transaction.user?.fullName) && (
          <div className="flex flex-wrap gap-0.5">
            {transaction.type === 'DEBT_TAKEN' && transaction.vendor?.name && (
              <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100">
                <Scale size={8} className="mr-0.5" />
                Deyn: {transaction.vendor.name}
              </span>
            )}
            {transaction.type === 'DEBT_TAKEN' && transaction.customer?.name && (
              <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100">
                <Scale size={8} className="mr-0.5" />
                Deyn: {transaction.customer.name}
              </span>
            )}
            {transaction.type === 'DEBT_REPAID' && transaction.vendor?.name && (
              <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                <CheckCircle size={8} className="mr-0.5" />
                Bixiyay: {transaction.vendor.name}
              </span>
            )}
            {transaction.type === 'DEBT_REPAID' && transaction.customer?.name && (
              <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                <CheckCircle size={8} className="mr-0.5" />
                Bixiyay: {transaction.customer.name}
              </span>
            )}
            
            {transaction.project?.name && (
              <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                <BriefcaseIcon size={8} className="mr-0.5" />
                {transaction.project.name}
              </span>
            )}
            
            {transaction.type !== 'DEBT_TAKEN' && transaction.type !== 'DEBT_REPAID' && (
              <>
                {transaction.vendor?.name && (
                  <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                    <Truck size={8} className="mr-0.5" />
                    {transaction.vendor.name}
                  </span>
                )}
                {transaction.customer?.name && (
                  <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                    <UserIcon size={8} className="mr-0.5" />
                    {transaction.customer.name}
                  </span>
                )}
                {transaction.employee?.fullName && (
                  <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                    <Users size={8} className="mr-0.5" />
                    {transaction.employee.fullName}
                  </span>
                )}
              </>
            )}
            
            {transaction.user?.fullName && (
              <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                <UserIcon size={8} className="mr-0.5" />
                {transaction.user.fullName}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


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

  // --- API Functions ---
  const fetchAccountingData = async () => {
    setPageLoading(true);
    try {
      const [statsResponse, accountsResponse, transactionsResponse, debtTransactionsResponse, projectDebtTransactionsResponse] = await Promise.all([
        fetch('/api/accounting/reports'), // Fetch overview stats from new reports API
        fetch('/api/accounting/accounts'),
        fetch('/api/accounting/transactions?limit=5'), // Fetch only recent 5 transactions
        fetch('/api/accounting/transactions?includeDebts=true&limit=10'), // Fetch debt transactions
        fetch('/api/accounting/transactions?includeProjectDebts=true&limit=15') // Fetch project debt transactions
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

      setOverviewStats({
        totalBalance: statsData.totalBalance,
        totalIncomeThisMonth: statsData.totalIncomeThisMonth,
        totalIncome: statsData.totalIncome, // Total income (all time)
        totalExpensesThisMonth: statsData.totalExpensesThisMonth,
        totalExpenses: statsData.totalExpenses, // Total expenses (all time, excluding fixed assets)
        fixedAssetExpenses: statsData.fixedAssetExpenses || 0, // Fixed asset expenses (all time)
        fixedAssetExpensesThisMonth: statsData.fixedAssetExpensesThisMonth || 0, // Fixed asset expenses this month
        netFlowThisMonth: statsData.netFlowThisMonth,
        totalBankAccounts: statsData.totalBankAccounts,
        totalCashAccounts: statsData.totalCashAccounts,
        totalMobileMoneyAccounts: statsData.totalMobileMoneyAccounts, // Use actual data
        monthlyCashFlow: statsData.monthlyCashFlow, // From reports API
        accountDistribution: statsData.accountDistribution, // From reports API
      });
      setAccounts(accountsData.accounts); // Data already converted to Number in API
      setRecentTransactions(transactionsData.transactions); // Data already converted to Number in API

      // NEW: Fetch debts report (true aggregation)
      const debtsReportRes = await fetch('/api/reports/debts');
      const debtsReport = await debtsReportRes.json();
      const allDebts = debtsReport.debts || [];
      const company = allDebts.filter((d: any) => !d.projectId || !d.project);
      const project = allDebts.filter((d: any) => d.projectId && d.project);
      setCompanyDebts(company);
      setProjectDebts(project);

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
    router.push(`/accounting/accounts/edit/${id}`); // Navigate to edit account page
  };

  const handleDeleteAccount = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad tirtirto account-kan? Tan lama soo celin karo!')) {
      try {
        const response = await fetch(`/api/accounting/accounts/${id}`, {
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
    router.push(`/accounting/transactions/edit/${id}`); // Navigate to edit transaction page
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad tirtirto dhaqdhaqaaqan lacagta ah? Tan lama soo celin karo!')) {
      try {
        const response = await fetch(`/api/accounting/transactions/${id}`, {
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
      fetchAccountingData();
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
      {/* Header - Responsive Design */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 lg:mb-8 gap-4">
        <div className="flex items-center">
          <Link href="/dashboard" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-3 lg:mr-4">
            <ArrowLeft size={24} className="inline-block lg:w-7 lg:h-7" />
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-darkGray dark:text-gray-100">
          Accounting & Finance
        </h1>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Link href="/accounting/transactions/add" className="bg-primary text-white py-2.5 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center justify-center">
            <Plus size={18} className="mr-2" /> Diiwaan Geli Dhaqdhaqaaq
          </Link>
          <button onClick={fetchAccountingData} className="bg-secondary text-white py-2.5 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-lg hover:bg-green-600 transition duration-200 shadow-md flex items-center justify-center">
            <RefreshCw size={18} className="mr-2" /> Cusboonaysii
          </button>
        </div>
      </div>

      {/* Overview Statistics Cards - Mobile & Desktop Separate Designs */}
      {overviewStats && (
        <>
          {/* Mobile Design - Clean Cards */}
          <div className="block lg:hidden space-y-3 mb-6 animate-fade-in-up">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border-l-4 border-primary">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <DollarSign size={20} className="text-primary" />
          </div>
                  <div>
                    <h4 className="font-semibold text-darkGray dark:text-gray-100">Wadarta Lacagta</h4>
                    <p className="text-xs text-mediumGray dark:text-gray-400">Total Balance</p>
          </div>
          </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{overviewStats.totalBalance.toLocaleString()}</p>
                  <p className="text-xs text-mediumGray dark:text-gray-400">ETB</p>
                </div>
              </div>
          </div>
          
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border-l-4 border-secondary">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mr-3">
                    <TrendingUp size={20} className="text-secondary" />
          </div>
                  <div>
                    <h4 className="font-semibold text-darkGray dark:text-gray-100">Wadarta Dakhliga</h4>
                    <p className="text-xs text-mediumGray dark:text-gray-400">Total Income</p>
          </div>
          </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-secondary">{overviewStats.totalIncome.toLocaleString()}</p>
                  <p className="text-xs text-mediumGray dark:text-gray-400">ETB</p>
        </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border-l-4 border-redError">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-redError/10 rounded-full flex items-center justify-center mr-3">
                    <TrendingDown size={20} className="text-redError" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-darkGray dark:text-gray-100">Wadarta Kharashyada</h4>
                    <p className="text-xs text-mediumGray dark:text-gray-400">Total Expenses (ma jiraan Hantida)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-redError">{overviewStats.totalExpenses.toLocaleString()}</p>
                  <p className="text-xs text-mediumGray dark:text-gray-400">ETB</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center mr-3">
                    <HardDrive size={20} className="text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-darkGray dark:text-gray-100">Kharashyada Hantida Go'an</h4>
                    <p className="text-xs text-mediumGray dark:text-gray-400">Fixed Asset Expenses</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-purple-500">{overviewStats.fixedAssetExpenses?.toLocaleString() || 0}</p>
                  <p className="text-xs text-mediumGray dark:text-gray-400">ETB</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center mr-3">
                    <Scale size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-darkGray dark:text-gray-100">Dhaqdhaqaaqa Deynta</h4>
                    <p className="text-xs text-mediumGray dark:text-gray-400">Debt Activity</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-orange-500">{debtTransactions.length}</p>
                  <p className="text-xs text-mediumGray dark:text-gray-400">Total</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-sm font-semibold text-orange-600">{debtTransactions.filter(t => t.type === 'DEBT_TAKEN').length}</p>
                  <p className="text-xs text-mediumGray dark:text-gray-400">Qaatay</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-green-600">{debtTransactions.filter(t => t.type === 'DEBT_REPAID').length}</p>
                  <p className="text-xs text-mediumGray dark:text-gray-400">Bixiyay</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-blue-600">{projectDebtTransactions.length}</p>
                  <p className="text-xs text-mediumGray dark:text-gray-400">Mashruuc</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Design - Enhanced Cards */}
          <div className="hidden lg:grid lg:grid-cols-5 gap-6 mb-8 animate-fade-in-up">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-all duration-300 border-l-4 border-primary">
              <div className="flex items-center justify-center mb-3">
                <DollarSign size={20} className="text-primary mr-2" />
                <h4 className="text-base font-semibold text-mediumGray dark:text-gray-400">Wadarta Lacagta</h4>
              </div>
              <p className="text-2xl font-extrabold text-primary">{overviewStats.totalBalance.toLocaleString()} ETB</p>
              <p className="text-sm text-mediumGray dark:text-gray-400 mt-1">Total Balance</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-all duration-300 border-l-4 border-secondary">
              <div className="flex items-center justify-center mb-3">
                <TrendingUp size={20} className="text-secondary mr-2" />
                <h4 className="text-base font-semibold text-mediumGray dark:text-gray-400">Wadarta Dakhliga</h4>
              </div>
              <p className="text-2xl font-extrabold text-secondary">{overviewStats.totalIncome.toLocaleString()} ETB</p>
              <p className="text-sm text-mediumGray dark:text-gray-400 mt-1">Total Income</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-all duration-300 border-l-4 border-redError">
              <div className="flex items-center justify-center mb-3">
                <TrendingDown size={20} className="text-redError mr-2" />
                <h4 className="text-base font-semibold text-mediumGray dark:text-gray-400">Wadarta Kharashyada</h4>
              </div>
              <p className="text-2xl font-extrabold text-redError">{overviewStats.totalExpenses.toLocaleString()} ETB</p>
              <p className="text-sm text-mediumGray dark:text-gray-400 mt-1">Total Expenses (ma jiraan Hantida)</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-all duration-300 border-l-4 border-purple-500">
              <div className="flex items-center justify-center mb-3">
                <HardDrive size={20} className="text-purple-500 mr-2" />
                <h4 className="text-base font-semibold text-mediumGray dark:text-gray-400">Kharashyada Hantida Go'an</h4>
              </div>
              <p className="text-2xl font-extrabold text-purple-500">{overviewStats.fixedAssetExpenses?.toLocaleString() || 0} ETB</p>
              <p className="text-sm text-mediumGray dark:text-gray-400 mt-1">Fixed Asset Expenses</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-all duration-300 border-l-4 border-orange-500">
              <div className="flex items-center justify-center mb-3">
                <Scale size={20} className="text-orange-500 mr-2" />
                <h4 className="text-base font-semibold text-mediumGray dark:text-gray-400">Dhaqdhaqaaqa Deynta</h4>
              </div>
              <p className="text-2xl font-extrabold text-orange-500">{debtTransactions.length}</p>
              <div className="text-sm text-mediumGray dark:text-gray-400 mt-1 space-y-1">
                <p>{debtTransactions.filter(t => t.type === 'DEBT_TAKEN').length} Qaatay</p>
                <p>{debtTransactions.filter(t => t.type === 'DEBT_REPAID').length} Bixiyay</p>
                <p className="text-blue-500">{projectDebtTransactions.length} Mashruuc</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Account Type Cards - Desktop Layout */}
      {overviewStats && (
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-3">
              <Landmark size={24} className="text-blue-600 mr-3" />
              <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Accounts-ka Bankiga</h4>
            </div>
            <p className="text-3xl font-extrabold text-blue-600">{overviewStats.totalBankAccounts}</p>
            <p className="text-sm text-blue-600 dark:text-blue-300 mt-2">Bank Accounts</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-3">
              <Banknote size={24} className="text-green-600 mr-3" />
              <h4 className="text-lg font-semibold text-green-800 dark:text-green-200">Accounts-ka Cash-ka</h4>
            </div>
            <p className="text-3xl font-extrabold text-green-600">{overviewStats.totalCashAccounts}</p>
            <p className="text-sm text-green-600 dark:text-green-300 mt-2">Cash Accounts</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-3">
              <CreditCard size={24} className="text-purple-600 mr-3" />
              <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-200">Mobile Money</h4>
            </div>
            <p className="text-3xl font-extrabold text-purple-600">{overviewStats.totalMobileMoneyAccounts}</p>
            <p className="text-sm text-purple-600 dark:text-purple-300 mt-2">Mobile Money Accounts</p>
          </div>
        </div>
      )}

      {/* Charts Section - Mobile & Desktop Separate Designs */}
      {/* Mobile Charts Design */}
      <div className="block lg:hidden space-y-4 mb-6 animate-fade-in-up">
        {/* Mobile Monthly Cash Flow Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-darkGray dark:text-gray-100 flex items-center">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                <TrendingUp size={16} className="text-primary" />
              </div>
              Dhaqdhaqaaqa Lacagta
            </h3>
          </div>
          <div className="w-full h-[180px]">
            <ResponsiveContainer>
              {monthlyCashFlowData.length > 0 ? (
                <LineChart data={monthlyCashFlowData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#7F8C8D" 
                    className="dark:text-gray-400" 
                    fontSize={10}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    stroke="#7F8C8D" 
                    className="dark:text-gray-400" 
                    fontSize={10}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd', 
                      borderRadius: '8px', 
                      fontSize: '12px',
                      padding: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ color: '#2C3E50', fontWeight: 'bold', fontSize: '12px' }}
                    itemStyle={{ color: '#2C3E50', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="income" stroke="#2ECC71" name="Dakhli" strokeWidth={3} dot={{ r: 5, fill: '#2ECC71' }} />
                  <Line type="monotone" dataKey="expense" stroke="#E74C3C" name="Kharash" strokeWidth={3} dot={{ r: 5, fill: '#E74C3C' }} />
                  <Line type="monotone" dataKey="net" stroke="#3498DB" name="Net" strokeWidth={3} dot={{ r: 5, fill: '#3498DB' }} />
                </LineChart>
              ) : (
                <div className="flex items-center justify-center h-full text-mediumGray dark:text-gray-500">
                  <div className="text-center">
                    <TrendingUp size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Ma jiraan xog dhaqdhaqaaqa lacagta</p>
                    <p className="text-xs text-gray-400 mt-1">Ku dar dhaqdhaqaaq lacag ah si aad u arko xogta</p>
                  </div>
                </div>
              )}
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 mt-3">
            <div className="flex items-center text-xs">
              <div className="w-2 h-2 bg-secondary rounded-full mr-1"></div>
              <span className="text-mediumGray dark:text-gray-400">Dakhli</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-2 h-2 bg-redError rounded-full mr-1"></div>
              <span className="text-mediumGray dark:text-gray-400">Kharash</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-2 h-2 bg-primary rounded-full mr-1"></div>
              <span className="text-mediumGray dark:text-gray-400">Net</span>
            </div>
          </div>
        </div>

        {/* Mobile Account Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-darkGray dark:text-gray-100 flex items-center">
              <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center mr-3">
                <div className="w-4 h-4 text-accent flex items-center justify-center">
                  <PieChart />
                </div>
              </div>
              Qaybinta Accounts-ka
            </h3>
          </div>
          <div className="w-full h-[180px]">
            <ResponsiveContainer>
              {accountDistributionData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={accountDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={60}
                    innerRadius={20}
                    dataKey="value"
                  >
                    {accountDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd', 
                      borderRadius: '8px', 
                      fontSize: '12px',
                      padding: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ color: '#2C3E50', fontWeight: 'bold', fontSize: '12px' }}
                    itemStyle={{ color: '#2C3E50', fontSize: '12px' }}
                  />
                </PieChart>
              ) : (
                <div className="flex items-center justify-center h-full text-mediumGray dark:text-gray-500">
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-2 text-gray-400 flex items-center justify-center">
                      <PieChart />
                    </div>
                    <p className="text-sm">Ma jiraan xog qaybinta accounts-ka</p>
                    <p className="text-xs text-gray-400 mt-1">Ku dar accounts lacag ah si aad u arko xogta</p>
                  </div>
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Desktop Charts Design */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-8 mb-8 animate-fade-in-up">
        {/* Desktop Monthly Cash Flow Chart */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-darkGray dark:text-gray-100 flex items-center">
              <TrendingUp size={24} className="text-primary mr-3" />
              Dhaqdhaqaaqa Lacagta Bishiiba
            </h3>
            <div className="flex space-x-2">
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 bg-secondary rounded-full mr-2"></div>
                <span className="text-mediumGray dark:text-gray-400">Dakhli</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 bg-redError rounded-full mr-2"></div>
                <span className="text-mediumGray dark:text-gray-400">Kharash</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                <span className="text-mediumGray dark:text-gray-400">Net</span>
              </div>
            </div>
          </div>
          <div className="w-full h-[300px]">
            <ResponsiveContainer>
              {monthlyCashFlowData.length > 0 ? (
                <LineChart data={monthlyCashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#7F8C8D" 
                    className="dark:text-gray-400" 
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#7F8C8D" 
                    className="dark:text-gray-400" 
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd', 
                      borderRadius: '12px', 
                      fontSize: '14px',
                      padding: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ color: '#2C3E50', fontWeight: 'bold', fontSize: '14px' }}
                    itemStyle={{ color: '#2C3E50', fontSize: '14px' }}
                  />
                  <Line type="monotone" dataKey="income" stroke="#2ECC71" name="Dakhli" strokeWidth={4} dot={{ r: 6, fill: '#2ECC71' }} />
                  <Line type="monotone" dataKey="expense" stroke="#E74C3C" name="Kharash" strokeWidth={4} dot={{ r: 6, fill: '#E74C3C' }} />
                  <Line type="monotone" dataKey="net" stroke="#3498DB" name="Net Flow" strokeWidth={4} dot={{ r: 6, fill: '#3498DB' }} />
                </LineChart>
              ) : (
                <div className="flex items-center justify-center h-full text-mediumGray dark:text-gray-500">
                  <div className="text-center">
                    <TrendingUp size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-lg">Ma jiraan xog dhaqdhaqaaqa lacagta</p>
                    <p className="text-sm text-gray-400 mt-2">Ku dar dhaqdhaqaaq lacag ah si aad u arko xogta</p>
                  </div>
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Desktop Account Distribution Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-darkGray dark:text-gray-100 flex items-center">
              <div className="w-6 h-6 text-accent mr-3 flex items-center justify-center">
                <PieChart />
              </div>
              Qaybinta Lacagta Accounts-ka
            </h3>
          </div>
          <div className="w-full h-[300px]">
            <ResponsiveContainer>
              {accountDistributionData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={accountDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    innerRadius={40}
                    dataKey="value"
                  >
                    {accountDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd', 
                      borderRadius: '12px', 
                      fontSize: '14px',
                      padding: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ color: '#2C3E50', fontWeight: 'bold', fontSize: '14px' }}
                    itemStyle={{ color: '#2C3E50', fontSize: '14px' }}
                  />
                  <Legend 
                    align="center" 
                    verticalAlign="bottom" 
                    layout="horizontal" 
                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} 
                    iconType="circle"
                  />
                </PieChart>
              ) : (
                <div className="flex items-center justify-center h-full text-mediumGray dark:text-gray-500">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 text-gray-400 flex items-center justify-center">
                      <PieChart />
                    </div>
                    <p className="text-lg">Ma jiraan xog qaybinta accounts-ka</p>
                    <p className="text-sm text-gray-400 mt-2">Ku dar accounts lacag ah si aad u arko xogta</p>
                  </div>
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabs for Accounting Sections - Mobile & Desktop Separate Designs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
        {/* Mobile Tab Navigation */}
        <div className="block lg:hidden">
        <div className="border-b border-lightGray dark:border-gray-700">
            <nav className="flex overflow-x-auto space-x-0 px-1" aria-label="Tabs">
            {['Overview', 'Transactions', 'Debts', 'Project Debts', 'Accounts', 'Reports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs focus:outline-none transition-all duration-200 flex-shrink-0 flex flex-col items-center space-y-1 w-[16.66%]
                            ${activeTab === tab 
                                ? 'border-primary text-primary dark:text-gray-100 bg-primary/5' 
                              : 'border-transparent text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
              >
                  {tab === 'Overview' && <LayoutGrid size={14} />}
                  {tab === 'Transactions' && <ReceiptText size={14} />}
                  {tab === 'Debts' && <Scale size={14} />}
                  {tab === 'Project Debts' && <BriefcaseIcon size={14} />}
                  {tab === 'Accounts' && <Landmark size={14} />}
                  {tab === 'Reports' && <TrendingUp size={14} />}
                  <span className="text-xs leading-tight text-center">{tab === 'Project Debts' ? 'Project' : tab === 'Transactions' ? 'Trans' : tab}</span>
              </button>
            ))}
          </nav>
          </div>
        </div>

        {/* Desktop Tab Navigation */}
        <div className="hidden lg:block">
          <div className="border-b border-lightGray dark:border-gray-700">
            <nav className="-mb-px flex overflow-x-auto space-x-0 px-6" aria-label="Tabs">
              {['Overview', 'Transactions', 'Debts', 'Project Debts', 'Accounts', 'Reports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap py-3 px-6 border-b-2 font-medium text-base focus:outline-none transition-all duration-200 flex-shrink-0 flex items-center space-x-2
                              ${activeTab === tab 
                                ? 'border-primary text-primary dark:text-gray-100 bg-primary/5' 
                                : 'border-transparent text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                >
                  {tab === 'Overview' && <LayoutGrid size={16} />}
                  {tab === 'Transactions' && <ReceiptText size={16} />}
                  {tab === 'Debts' && <Scale size={16} />}
                  {tab === 'Project Debts' && <BriefcaseIcon size={16} />}
                  {tab === 'Accounts' && <Landmark size={16} />}
                  {tab === 'Reports' && <TrendingUp size={16} />}
                  <span>{tab}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content - Mobile & Desktop Separate Designs */}
        {/* Mobile Tab Content */}
        <div className="block lg:hidden p-4">
          {activeTab === 'Overview' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-2 flex items-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <LayoutGrid size={16} className="text-primary" />
                  </div>
                  Guudmarka Maaliyadda
                </h3>
                <p className="text-sm text-mediumGray dark:text-gray-400">
                  Halkan waxaad ka arki kartaa guudmarka maaliyadda shirkaddaada.
                </p>
              </div>
              
              {/* Mobile Financial Summary Cards */}
              <div className="space-y-3 mb-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Wadarta Lacagta</h4>
                    <DollarSign size={18} className="text-blue-600" />
                </div>
                  <p className="text-xl font-bold text-blue-600">ETB {overviewStats?.totalBalance.toLocaleString() || '0'}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">Total Balance</p>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">Dakhliga Bishaan</h4>
                    <TrendingUp size={18} className="text-green-600" />
                </div>
                  <p className="text-xl font-bold text-green-600">ETB {overviewStats?.totalIncomeThisMonth.toLocaleString() || '0'}</p>
                  <p className="text-xs text-green-600 dark:text-green-300">This Month Income</p>
                </div>
                
                <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-xl shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">Kharashyada Bishaan</h4>
                    <TrendingDown size={18} className="text-red-600" />
                </div>
                  <p className="text-xl font-bold text-red-600">ETB {overviewStats?.totalExpensesThisMonth.toLocaleString() || '0'}</p>
                  <p className="text-xs text-red-600 dark:text-red-300">This Month Expenses</p>
                </div>
              </div>
              
              {/* Mobile Recent Activity Summary */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-md">
                <h4 className="text-base font-semibold text-darkGray dark:text-gray-100 mb-3 flex items-center">
                  <ClockIcon size={16} className="text-primary mr-2" />
                  Dhaqdhaqaaqa Dhawaan
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                      <p className="text-sm text-mediumGray dark:text-gray-400">Dhaqdhaqaaq Dhawaan</p>
                  </div>
                    <p className="text-lg font-bold text-primary">{recentTransactions.length}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                      <p className="text-sm text-mediumGray dark:text-gray-400">Dhaqdhaqaaq Deynta</p>
                  </div>
                    <p className="text-lg font-bold text-orange-500">{debtTransactions.length}</p>
                </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <p className="text-sm text-mediumGray dark:text-gray-400">Dhaqdhaqaaq Mashruucyada</p>
                    </div>
                    <p className="text-lg font-bold text-blue-500">{projectDebtTransactions.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Transactions' && (
            <div>
              <div className="mb-6 lg:mb-8">
                <h3 className="text-xl lg:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2 flex items-center">
                  <ReceiptText size={24} className="text-primary mr-3" />
                  Dhaqdhaqaaqa Lacagta Dhawaan
                </h3>
                <p className="text-sm lg:text-base text-mediumGray dark:text-gray-400">
                  Halkan waxaad ka arki kartaa dhaqdhaqaaqa lacagta ee dhawaan la sameeyay.
                </p>
              </div>
              
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 lg:py-12">
                  <ReceiptText size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">Ma Jiraan Dhaqdhaqaaq Lacag Ah</h4>
                  <p className="text-sm lg:text-base text-mediumGray dark:text-gray-400 mb-6">
                    Wali ma jiraan dhaqdhaqaaq lacag ah oo dhawaan la sameeyay.
                  </p>
                  <Link 
                    href="/accounting/transactions/add" 
                    className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium"
                  >
                    <Plus size={18} className="mr-2" />
                    Ku Dar Dhaqdhaqaaq Cusub
                  </Link>
                </div>
              ) : (
                <>
                  {/* Mobile View - Compact Cards */}
                  <div className="block lg:hidden space-y-2">
                    {recentTransactions.map(trx => (
                      <MobileTransactionCard key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                    ))}
                  </div>
                  
                  {/* Desktop View - Enhanced Table */}
                  <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                          <tr>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Taariikhda</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Sharaxaad</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Nooca</th>
                            <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Qiimaha</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Account</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">La Xiriira</th>
                            <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                        {recentTransactions.map(trx => (
                          <TransactionRow key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                </>
              )}
              
              <div className="mt-6 lg:mt-8 text-center">
                <Link 
                  href="/accounting/transactions" 
                  className="inline-flex items-center px-6 py-3 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg font-medium transition-all duration-200"
                >
                  Fiiri Dhammaan Dhaqdhaqaaqa
                  <ArrowLeft size={16} className="ml-2 rotate-180" />
              </Link>
              </div>
            </div>
          )}

          {activeTab === 'Debts' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Lacagaha Deynta Macaamiisha/Shirkadaha</h3>
                <p className="text-sm sm:text-base text-mediumGray dark:text-gray-400 mb-4">Halkan waxaad ka arki kartaa macaamiisha/shirkadaha ay shirkaddu daynta ku leedahay.</p>
                </div>
              {companyDebts.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Scale size={40} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">Ma jiraan deymo sax ah oo macaamiil/shirkad leedahay</h4>
                  <p className="text-sm sm:text-base text-mediumGray dark:text-gray-400">Deynta oo dhan waa la bixiyay ama lama helin wax deyn ah.</p>
                </div>
              ) : (
                <>
                  {/* Mobile Cards */}
                  <div className="block lg:hidden space-y-3">
                    {companyDebts.map((debt) => (
                      <div key={debt.id || debt.lender} className={`bg-white dark:bg-gray-800 p-3 rounded-xl shadow-md border-l-4 ${debt.status === 'Overdue' ? 'border-redError' : 'border-accent'} flex flex-col gap-2`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Scale size={18} className={debt.status === 'Overdue' ? 'text-redError' : 'text-accent'} />
                          <span className="font-bold text-darkGray dark:text-gray-100 text-base">{debt.lender || debt.customerName || '--'}</span>
                          <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${debt.status === 'Overdue' ? 'bg-redError/20 text-redError' : debt.status === 'Paid' ? 'bg-green-100 text-secondary' : 'bg-accent/10 text-accent'}`}>{debt.status}</span>
                        </div>
                        <div className="flex flex-wrap justify-between text-xs font-medium text-mediumGray dark:text-gray-400">
                          <div>Total: <span className="text-darkGray dark:text-gray-100 font-bold">{debt.amount?.toLocaleString()}</span></div>
                          <div>Paid: <span>{debt.paid?.toLocaleString()}</span></div>
                          <div>Remaining: <span className="text-redError font-bold">{debt.remaining?.toLocaleString()}</span></div>
                          <div>Due: <span>{debt.dueDate ? new Date(debt.dueDate).toLocaleDateString() : '--'}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop Table */}
                  <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
                      <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                        <thead className="bg-lightGray dark:bg-gray-700">
                          <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Lender</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Paid</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Remaining</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Due</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                        {companyDebts.map((debt) => (
                          <tr key={debt.id || debt.lender} className={debt.status === 'Overdue' ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                            <td className="px-4 py-2 font-bold text-darkGray dark:text-gray-100">{debt.lender || debt.customerName || '--'}</td>
                            <td className="px-4 py-2">{debt.amount?.toLocaleString()}</td>
                            <td className="px-4 py-2">{debt.paid?.toLocaleString()}</td>
                            <td className="px-4 py-2 text-redError font-semibold">{debt.remaining?.toLocaleString()}</td>
                            <td className="px-4 py-2">{debt.dueDate ? new Date(debt.dueDate).toLocaleDateString() : '--'}</td>
                            <td className="px-4 py-2 font-medium"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${debt.status === 'Overdue' ? 'bg-redError/20 text-redError' : debt.status === 'Paid' ? 'bg-green-100 text-secondary' : 'bg-accent/10 text-accent'}`}>{debt.status}</span></td>
                          </tr>
                          ))}
                        </tbody>
                      </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'Project Debts' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Deynta Mashaariicda Ku Dhiman</h3>
                <p className="text-sm sm:text-base text-mediumGray dark:text-gray-400 mb-4">Halkan waxaad ka arki kartaa dhammaan mashaariicda weli lacag looga leeyahay shirkad ahaan.</p>
                </div>
              {projectDebts.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <BriefcaseIcon size={40} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">Ma jiraan deymo mashruuc ah oo ku dhiman</h4>
                  <p className="text-sm sm:text-base text-mediumGray dark:text-gray-400">Deynta dhammaan mashaariicdu waa la bixiyay ama lama helin wax deyn mashruuc ah.</p>
                </div>
              ) : (
                <>
                  {/* Mobile Cards */}
                  <div className="block lg:hidden space-y-3">
                    {projectDebts.map((debt) => (
                      <div key={debt.id || debt.project} className={`bg-white dark:bg-gray-800 p-3 rounded-xl shadow-md border-l-4 border-darkGray flex flex-col gap-2`}>
                        <div className="flex items-center gap-2 mb-1">
                          <BriefcaseIcon size={18} className="text-darkGray" />
                          <span className="font-bold text-darkGray dark:text-gray-100 text-base">{debt.project || debt.projectName || '--'}</span>
                          <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${debt.status === 'Overdue' ? 'bg-redError/20 text-redError' : debt.status === 'Paid' ? 'bg-green-100 text-secondary' : 'bg-accent/10 text-accent'}`}>{debt.status}</span>
                        </div>
                        <div className="flex flex-wrap justify-between text-xs font-medium text-mediumGray dark:text-gray-400">
                          <div>Total: <span className="text-darkGray dark:text-gray-100 font-bold">{debt.amount?.toLocaleString()}</span></div>
                          <div>Paid: <span>{debt.paid?.toLocaleString()}</span></div>
                          <div>Remaining: <span className="text-redError font-bold">{debt.remaining?.toLocaleString()}</span></div>
                          <div>Due: <span>{debt.dueDate ? new Date(debt.dueDate).toLocaleDateString() : '--'}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop Table */}
                  <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
                      <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                        <thead className="bg-lightGray dark:bg-gray-700">
                          <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Project</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Agreement</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Paid</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Remaining</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Due</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                        {projectDebts.map((debt) => (
                          <tr key={debt.id || debt.project}>
                            <td className="px-4 py-2 font-bold text-darkGray dark:text-gray-100">{debt.project || debt.projectName || '--'}</td>
                            <td className="px-4 py-2">{debt.amount?.toLocaleString()}</td>
                            <td className="px-4 py-2">{debt.paid?.toLocaleString()}</td>
                            <td className="px-4 py-2 text-redError font-semibold">{debt.remaining?.toLocaleString()}</td>
                            <td className="px-4 py-2">{debt.dueDate ? new Date(debt.dueDate).toLocaleDateString() : '--'}</td>
                            <td className="px-4 py-2 font-medium"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${debt.status === 'Overdue' ? 'bg-redError/20 text-redError' : debt.status === 'Paid' ? 'bg-green-100 text-secondary' : 'bg-accent/10 text-accent'}`}>{debt.status}</span></td>
                          </tr>
                          ))}
                        </tbody>
                      </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'Accounts' && (
            <div>
              <div className="mb-6 lg:mb-8">
                <h3 className="text-xl lg:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2 flex items-center">
                  <Landmark size={24} className="text-primary mr-3" />
                  Accounts-ka Lacagta
                </h3>
                <p className="text-sm lg:text-base text-mediumGray dark:text-gray-400">
                  Halkan waxaad ka maamuli kartaa accounts-ka lacagta ee shirkaddaada.
                </p>
              </div>
              
              {accounts.length === 0 ? (
                <div className="text-center py-8 lg:py-12">
                  <Landmark size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">Ma Jiraan Accounts Lacag Ah</h4>
                  <p className="text-sm lg:text-base text-mediumGray dark:text-gray-400 mb-6">
                    Wali ma jiraan accounts lacag ah oo la helay.
                  </p>
                  <Link 
                    href="/accounting/accounts/add" 
                    className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium"
                  >
                    <Plus size={18} className="mr-2" />
                    Ku Dar Account Cusub
                  </Link>
                </div>
              ) : (
                <>
                  {/* Mobile View - Enhanced Cards */}
                  <div className="block lg:hidden space-y-4">
                    {accounts.map(acc => (
                      <div key={acc.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-primary">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-darkGray dark:text-gray-100 text-base flex items-center space-x-2 truncate">
                              <Banknote size={18} className="text-primary flex-shrink-0" />
                              <span className="truncate">{acc.name}</span>
                            </h4>
                          </div>
                          <div className="flex space-x-2 flex-shrink-0 ml-2">
                            <Link href={`/accounting/accounts/${acc.id}`} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View">
                              <Eye size={16} />
                            </Link>
                            <button onClick={() => handleEditAccount(acc.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDeleteAccount(acc.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="mb-4 text-2xl font-bold text-primary">
                          ETB {acc.balance.toLocaleString()}
                        </div>
                        
                        <div className="space-y-3">
                          <p className="text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-2">
                            <TagIcon size={14} className="flex-shrink-0" />
                            <span className="truncate">{acc.type}</span>
                          </p>
                          <p className="text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-2">
                            <Coins size={14} className="flex-shrink-0" />
                            <span className="truncate">{acc.currency}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop View - Enhanced Table */}
                  <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                          <tr>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Magaca Account-ka</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Nooca</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Currency</th>
                            <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Balance</th>
                            <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                        {accounts.map(acc => (
                          <AccountRow key={acc.id} account={acc} onEdit={handleEditAccount} onDelete={handleDeleteAccount} />
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                </>
              )}
              
              <div className="mt-6 lg:mt-8 text-center">
                <Link 
                  href="/accounting/accounts/add" 
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Ku Dar Account Cusub
              </Link>
              </div>
            </div>
          )}

          {activeTab === 'Reports' && (
            <div>
              <div className="mb-6 lg:mb-8">
                <h3 className="text-xl lg:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2 flex items-center">
                  <TrendingUp size={24} className="text-primary mr-3" />
                  Warbixinada Maaliyadda
                </h3>
                <p className="text-sm lg:text-base text-mediumGray dark:text-gray-400">
                Halkan waxaad ka heli kartaa warbixino maaliyadeed oo faahfaahsan.
              </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <Link href="/reports/profit-loss" className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 lg:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg group-hover:scale-110 transition-transform duration-200">
                      <TrendingUp size={24} className="text-blue-600 dark:text-blue-300"/>
                    </div>
                    <div>
                      <h4 className="text-lg lg:text-xl font-bold text-blue-800 dark:text-blue-200">Profit & Loss Report</h4>
                      <p className="text-sm text-blue-600 dark:text-blue-300">Warbixinta Fayda iyo Khasaaraha</p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Ka arko fayda iyo khasaaraha shirkaddaada</p>
                </Link>
                
                <Link href="/reports/bank" className="group bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 lg:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-green-100 dark:bg-green-800 rounded-lg group-hover:scale-110 transition-transform duration-200">
                      <Banknote size={24} className="text-green-600 dark:text-green-300"/>
                    </div>
                    <div>
                      <h4 className="text-lg lg:text-xl font-bold text-green-800 dark:text-green-200">Bank & Cash Flow Report</h4>
                      <p className="text-sm text-green-600 dark:text-green-300">Warbixinta Bank iyo Dhaqdhaqaaqa Lacagta</p>
                    </div>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">Ka arko dhaqdhaqaaqa lacagta iyo xaaladda bankiga</p>
                </Link>
                
                <Link href="/reports/expenses" className="group bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 lg:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-red-100 dark:bg-red-800 rounded-lg group-hover:scale-110 transition-transform duration-200">
                      <DollarSign size={24} className="text-red-600 dark:text-red-300"/>
                    </div>
                    <div>
                      <h4 className="text-lg lg:text-xl font-bold text-red-800 dark:text-red-200">Expenses Report</h4>
                      <p className="text-sm text-red-600 dark:text-red-300">Warbixinta Kharashyada</p>
                    </div>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">Ka arko dhammaan kharashyada la sameeyay</p>
                </Link>
                
                <Link href="/reports/debts" className="group bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 lg:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-lg group-hover:scale-110 transition-transform duration-200">
                      <Scale size={24} className="text-orange-600 dark:text-orange-300"/>
                    </div>
                    <div>
                      <h4 className="text-lg lg:text-xl font-bold text-orange-800 dark:text-orange-200">Debts Report</h4>
                      <p className="text-sm text-orange-600 dark:text-orange-300">Warbixinta Deynta</p>
                    </div>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">Ka arko dhammaan deynta la qaatay iyo la bixiyay</p>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Tab Content */}
        <div className="hidden lg:block p-8">
          {activeTab === 'Overview' && (
            <div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-2 flex items-center">
                  <LayoutGrid size={24} className="text-primary mr-3" />
                  Guudmarka Maaliyadda
                </h3>
                <p className="text-base text-mediumGray dark:text-gray-400">
                  Halkan waxaad ka arki kartaa guudmarka maaliyadda shirkaddaada, oo ay ku jiraan dhaqdhaqaaqa lacagta iyo xaaladda accounts-ka.
                </p>
              </div>
              
              {/* Desktop Financial Summary Cards */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-blue-800 dark:text-blue-200">Wadarta Lacagta</h4>
                    <DollarSign size={20} className="text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">ETB {overviewStats?.totalBalance.toLocaleString() || '0'}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">Total Balance</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-green-800 dark:text-green-200">Dakhliga Bishaan</h4>
                    <TrendingUp size={20} className="text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">ETB {overviewStats?.totalIncomeThisMonth.toLocaleString() || '0'}</p>
                  <p className="text-sm text-green-600 dark:text-green-300 mt-1">This Month Income</p>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-red-800 dark:text-red-200">Kharashyada Bishaan</h4>
                    <TrendingDown size={20} className="text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">ETB {overviewStats?.totalExpensesThisMonth.toLocaleString() || '0'}</p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">This Month Expenses</p>
                </div>
              </div>
              
              {/* Desktop Recent Activity Summary */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-md">
                <h4 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
                  <ClockIcon size={20} className="text-primary mr-2" />
                  Dhaqdhaqaaqa Dhawaan
                </h4>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-left">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                      <p className="text-3xl font-bold text-primary">{recentTransactions.length}</p>
                    </div>
                    <p className="text-base text-mediumGray dark:text-gray-400">Dhaqdhaqaaq Dhawaan</p>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                      <p className="text-3xl font-bold text-orange-500">{debtTransactions.length}</p>
                    </div>
                    <p className="text-base text-mediumGray dark:text-gray-400">Dhaqdhaqaaq Deynta</p>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <p className="text-3xl font-bold text-blue-500">{projectDebtTransactions.length}</p>
                    </div>
                    <p className="text-base text-mediumGray dark:text-gray-400">Dhaqdhaqaaq Mashruucyada</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Transactions' && (
            <div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-2 flex items-center">
                  <ReceiptText size={24} className="text-primary mr-3" />
                  Dhaqdhaqaaqa Lacagta Dhawaan
                </h3>
                <p className="text-base text-mediumGray dark:text-gray-400">
                  Halkan waxaad ka arki kartaa dhaqdhaqaaqa lacagta ee dhawaan la sameeyay.
                </p>
              </div>
              
              {recentTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <ReceiptText size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">Ma Jiraan Dhaqdhaqaaq Lacag Ah</h4>
                  <p className="text-base text-mediumGray dark:text-gray-400 mb-6">
                    Wali ma jiraan dhaqdhaqaaq lacag ah oo dhawaan la sameeyay.
                  </p>
                  <Link 
                    href="/accounting/transactions/add" 
                    className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium"
                  >
                    <Plus size={18} className="mr-2" />
                    Ku Dar Dhaqdhaqaaq Cusub
                  </Link>
                </div>
              ) : (
                <>
                  {/* Desktop View - Enhanced Table */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                          <tr>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Taariikhda</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Sharaxaad</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Nooca</th>
                            <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Qiimaha</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Account</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">La Xiriira</th>
                            <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                          {recentTransactions.map(trx => (
                            <TransactionRow key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
              
              <div className="mt-8 text-center">
                <Link 
                  href="/accounting/transactions" 
                  className="inline-flex items-center px-6 py-3 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg font-medium transition-all duration-200"
                >
                  Fiiri Dhammaan Dhaqdhaqaaqa
                  <ArrowLeft size={16} className="ml-2 rotate-180" />
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'Accounts' && (
            <div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-2 flex items-center">
                  <Landmark size={24} className="text-primary mr-3" />
                  Accounts-ka Lacagta
                </h3>
                <p className="text-base text-mediumGray dark:text-gray-400">
                  Halkan waxaad ka maamuli kartaa accounts-ka lacagta ee shirkaddaada.
                </p>
              </div>
              
              {accounts.length === 0 ? (
                <div className="text-center py-12">
                  <Landmark size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">Ma Jiraan Accounts Lacag Ah</h4>
                  <p className="text-base text-mediumGray dark:text-gray-400 mb-6">
                    Wali ma jiraan accounts lacag ah oo la helay.
                  </p>
                  <Link 
                    href="/accounting/accounts/add" 
                    className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium"
                  >
                    <Plus size={18} className="mr-2" />
                    Ku Dar Account Cusub
                  </Link>
                </div>
              ) : (
                <>
                  {/* Desktop View - Enhanced Table */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                          <tr>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Magaca Account-ka</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Nooca</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Currency</th>
                            <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Balance</th>
                            <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                          {accounts.map(acc => (
                            <AccountRow key={acc.id} account={acc} onEdit={handleEditAccount} onDelete={handleDeleteAccount} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
              
              <div className="mt-8 text-center">
                <Link 
                  href="/accounting/accounts/add" 
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Ku Dar Account Cusub
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'Reports' && (
            <div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-2 flex items-center">
                  <TrendingUp size={24} className="text-primary mr-3" />
                  Warbixinada Maaliyadda
                </h3>
                <p className="text-base text-mediumGray dark:text-gray-400">
                  Halkan waxaad ka heli kartaa warbixino maaliyadeed oo faahfaahsan.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <Link href="/reports/profit-loss" className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg group-hover:scale-110 transition-transform duration-200">
                      <TrendingUp size={24} className="text-blue-600 dark:text-blue-300"/>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-blue-800 dark:text-blue-200">Profit & Loss Report</h4>
                      <p className="text-sm text-blue-600 dark:text-blue-300">Warbixinta Fayda iyo Khasaaraha</p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Ka arko fayda iyo khasaaraha shirkaddaada</p>
                </Link>
                
                <Link href="/reports/bank" className="group bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-green-100 dark:bg-green-800 rounded-lg group-hover:scale-110 transition-transform duration-200">
                      <Banknote size={24} className="text-green-600 dark:text-green-300"/>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-green-800 dark:text-green-200">Bank & Cash Flow Report</h4>
                      <p className="text-sm text-green-600 dark:text-green-300">Warbixinta Bank iyo Dhaqdhaqaaqa Lacagta</p>
                    </div>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">Ka arko dhaqdhaqaaqa lacagta iyo xaaladda bankiga</p>
                </Link>
                
                <Link href="/reports/expenses" className="group bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-red-100 dark:bg-red-800 rounded-lg group-hover:scale-110 transition-transform duration-200">
                      <DollarSign size={24} className="text-red-600 dark:text-red-300"/>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-red-800 dark:text-red-200">Expenses Report</h4>
                      <p className="text-sm text-red-600 dark:text-red-300">Warbixinta Kharashyada</p>
                    </div>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">Ka arko dhammaan kharashyada la sameeyay</p>
                </Link>
                
                <Link href="/reports/debts" className="group bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-lg group-hover:scale-110 transition-transform duration-200">
                      <Scale size={24} className="text-orange-600 dark:text-orange-300"/>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-orange-800 dark:text-orange-200">Debts Report</h4>
                      <p className="text-sm text-orange-600 dark:text-orange-300">Warbixinta Deynta</p>
                    </div>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">Ka arko dhammaan deynta la qaatay iyo la bixiyay</p>
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'Project Debts' && (
            <div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-2 flex items-center">
                  <BriefcaseIcon size={24} className="text-primary mr-3" />
                  Dhaqdhaqaaqa Deynta Mashruucyada
                </h3>
                <p className="text-base text-mediumGray dark:text-gray-400">
                  Halkan waxaad ka arki kartaa dhammaan dhaqdhaqaaqa deynta ee la xiriira mashruucyada.
                </p>
              </div>
              
              {projectDebtTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <BriefcaseIcon size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">Ma Jiraan Dhaqdhaqaaq Deyn Ah oo Mashruuc Loo Xiriira</h4>
                  <p className="text-base text-mediumGray dark:text-gray-400 mb-6">
                    Wali ma jiraan dhaqdhaqaaq deyn ah oo la xiriira mashruucyada.
                  </p>
                  <Link 
                    href="/accounting/transactions/add" 
                    className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium"
                  >
                    <Plus size={18} className="mr-2" />
                    Ku Dar Dhaqdhaqaaq Mashruuc
                  </Link>
                </div>
              ) : (
                <>
                  {/* Desktop View - Enhanced Table */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                          <tr>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Taariikhda</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Sharaxaad</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Nooca</th>
                            <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Qiimaha</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Mashruuc</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Account</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">La Xiriira</th>
                            <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                          {projectDebtTransactions.map(trx => (
                            <TransactionRow key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
              
              <div className="mt-8 text-center">
                <Link 
                  href="/accounting/transactions/add" 
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Ku Dar Dhaqdhaqaaq Mashruuc
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
