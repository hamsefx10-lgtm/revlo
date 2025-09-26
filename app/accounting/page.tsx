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
  Coins, Repeat, ReceiptText, Users, Building, Package, Scale, Truck, Mail, Phone // Added specific icons for dynamic fields
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
  totalExpensesThisMonth: number;
  netFlowThisMonth: number;
  totalBankAccounts: number;
  totalCashAccounts: number;
  totalMobileMoneyAccounts: number; // Added Mobile Money count
  // For charts
  monthlyCashFlow: { month: string; income: number; expense: number; net: number }[];
  accountDistribution: { name: string; value: number; }[];
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
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-semibold text-right">${account.balance.toLocaleString()}</td>
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
  const isIncome = transaction.amount >= 0;
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
        {isIncome ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
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
  const isIncome = transaction.amount >= 0;
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
        {isIncome ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
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
        totalExpensesThisMonth: statsData.totalExpensesThisMonth,
        netFlowThisMonth: statsData.netFlowThisMonth,
        totalBankAccounts: statsData.totalBankAccounts,
        totalCashAccounts: statsData.totalCashAccounts,
        totalMobileMoneyAccounts: statsData.totalMobileMoneyAccounts, // Use actual data
        monthlyCashFlow: statsData.monthlyCashFlow, // From reports API
        accountDistribution: statsData.accountDistribution, // From reports API
      });
      setAccounts(accountsData.accounts); // Data already converted to Number in API
      setRecentTransactions(transactionsData.transactions); // Data already converted to Number in API

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

  // Chart Data for Monthly Cash Flow (from overviewStats)
  const monthlyCashFlowData = overviewStats?.monthlyCashFlow || [];
  const accountDistributionData = overviewStats?.accountDistribution || [];

  return (
    <Layout>
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 lg:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/dashboard" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-3 sm:mr-4">
            <ArrowLeft size={24} className="inline-block sm:w-7 sm:h-7" />
          </Link>
          Accounting & Finance
        </h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Link href="/accounting/transactions/add" className="bg-primary text-white py-2.5 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center justify-center">
            <Plus size={18} className="mr-2" /> Diiwaan Geli Dhaqdhaqaaq
          </Link>
          <button onClick={fetchAccountingData} className="bg-secondary text-white py-2.5 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-lg hover:bg-green-600 transition duration-200 shadow-md flex items-center justify-center">
            <RefreshCw size={18} className="mr-2" /> Cusboonaysii
          </button>
        </div>
      </div>

      {/* Overview Statistics Cards - Ultra Compact Mobile Design */}
      {overviewStats && (
        <div className="grid grid-cols-2 gap-1 mb-3 animate-fade-in-up">
          {/* Main Financial Cards */}
          <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow duration-300">
            <h4 className="text-xs font-semibold text-mediumGray dark:text-gray-400 mb-0">Wadarta Lacagta</h4>
            <p className="text-sm font-extrabold text-primary">${overviewStats.totalBalance.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow duration-300">
            <h4 className="text-xs font-semibold text-mediumGray dark:text-gray-400 mb-0">Dakhliga Bishaan</h4>
            <p className="text-sm font-extrabold text-secondary">${overviewStats.totalIncomeThisMonth.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow duration-300">
            <h4 className="text-xs font-semibold text-mediumGray dark:text-gray-400 mb-0">Kharashyada Bishaan</h4>
            <p className="text-sm font-extrabold text-redError">${overviewStats.totalExpensesThisMonth.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow duration-300">
            <h4 className="text-xs font-semibold text-mediumGray dark:text-gray-400 mb-0">Dhaqdhaqaaqa Deynta</h4>
            <p className="text-sm font-extrabold text-orange-500">{debtTransactions.length}</p>
            <p className="text-xs text-mediumGray dark:text-gray-400 mt-0">
              {debtTransactions.filter(t => t.type === 'DEBT_TAKEN').length} Qaatay, {debtTransactions.filter(t => t.type === 'DEBT_REPAID').length} Bixiyay
            </p>
            <p className="text-xs text-blue-500 mt-0">
              {projectDebtTransactions.length} Mashruuc
            </p>
          </div>
          
          {/* Account Type Cards - All Visible */}
          <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow duration-300">
            <h4 className="text-xs font-semibold text-mediumGray dark:text-gray-400 mb-0">Accounts-ka Bankiga</h4>
            <p className="text-sm font-extrabold text-blue-500">{overviewStats.totalBankAccounts}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow duration-300">
            <h4 className="text-xs font-semibold text-mediumGray dark:text-gray-400 mb-0">Accounts-ka Cash-ka</h4>
            <p className="text-sm font-extrabold text-green-500">{overviewStats.totalCashAccounts}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow duration-300">
            <h4 className="text-xs font-semibold text-mediumGray dark:text-gray-400 mb-0">Accounts-ka Mobile Money</h4>
            <p className="text-sm font-extrabold text-purple-500">{overviewStats.totalMobileMoneyAccounts}</p>
          </div>
        </div>
      )}

      {/* Charts Section - Ultra Compact Mobile Design */}
      <div className="grid grid-cols-1 gap-1 mb-3">
        {/* Monthly Cash Flow Chart */}
        <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-md animate-fade-in-up">
            <h3 className="text-xs font-semibold text-darkGray dark:text-gray-100 mb-0.5">Dhaqdhaqaaqa Lacagta Bishiiba</h3>
            <div className="w-full h-[120px]">
                <ResponsiveContainer>
                    {monthlyCashFlowData.length > 0 ? (
                        <LineChart data={monthlyCashFlowData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
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
                                    fontSize: '11px',
                                    padding: '8px'
                                }}
                                labelStyle={{ color: '#2C3E50', fontWeight: 'bold', fontSize: '11px' }}
                                itemStyle={{ color: '#2C3E50', fontSize: '11px' }}
                            />
                            <Legend 
                                wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} 
                                iconType="line"
                            />
                            <Line type="monotone" dataKey="income" stroke={CHART_COLORS[1]} name="Dakhli" strokeWidth={2} />
                            <Line type="monotone" dataKey="expense" stroke={CHART_COLORS[3]} name="Kharash" strokeWidth={2} />
                            <Line type="monotone" dataKey="net" stroke={CHART_COLORS[0]} name="Net Flow" strokeWidth={2} />
                        </LineChart>
                    ) : (
                        <div className="flex items-center justify-center h-full text-mediumGray dark:text-gray-500 text-xs sm:text-sm">
                          <div className="text-center">
                            <TrendingUp size={32} className="mx-auto mb-2 text-gray-400" />
                            <p>No data for Monthly Cash Flow Chart.</p>
                          </div>
                        </div>
                    )}
                </ResponsiveContainer>
            </div>
        </div>

        {/* Account Distribution Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-md animate-fade-in-up">
            <h3 className="text-xs font-semibold text-darkGray dark:text-gray-100 mb-0.5">Qaybinta Lacagta Accounts-ka</h3>
            <div className="w-full h-[120px]">
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
                                    fontSize: '11px',
                                    padding: '8px'
                                }}
                                labelStyle={{ color: '#2C3E50', fontWeight: 'bold', fontSize: '11px' }}
                                itemStyle={{ color: '#2C3E50', fontSize: '11px' }}
                            />
                            <Legend 
                                align="center" 
                                verticalAlign="bottom" 
                                layout="horizontal" 
                                wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} 
                                iconType="circle"
                            />
                        </PieChart>
                    ) : (
                        <div className="flex items-center justify-center h-full text-mediumGray dark:text-gray-500 text-xs sm:text-sm">
                          <div className="text-center">
                            <PieChart className="mx-auto mb-2 text-gray-400 w-8 h-8" />
                            <p>No data for Account Distribution Chart.</p>
                          </div>
                        </div>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Tabs for Accounting Sections - Ultra Compact Mobile Design */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-fade-in-up">
        <div className="border-b border-lightGray dark:border-gray-700">
          <nav className="-mb-px flex overflow-x-auto space-x-0 px-0.5" aria-label="Tabs">
            {['Overview', 'Transactions', 'Debts', 'Project Debts', 'Accounts', 'Reports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-1 px-0.5 border-b-2 font-medium text-xs focus:outline-none transition-colors duration-200 flex-shrink-0
                            ${activeTab === tab 
                              ? 'border-primary text-primary dark:text-gray-100' 
                              : 'border-transparent text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content - Ultra Compact Mobile Design */}
        <div className="p-1.5">
          {activeTab === 'Overview' && (
            <div>
              <h3 className="text-xs font-bold text-darkGray dark:text-gray-100 mb-1">Guudmarka Maaliyadda</h3>
              <p className="text-xs text-mediumGray dark:text-gray-400 mb-2">
                Halkan waxaad ka arki kartaa guudmarka maaliyadda shirkaddaada, oo ay ku jiraan dhaqdhaqaaqa lacagta iyo xaaladda accounts-ka.
              </p>
              
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-2 gap-1 mb-2">
                <div className="bg-lightGray dark:bg-gray-700 p-1.5 rounded-lg">
                  <h4 className="text-xs font-semibold text-darkGray dark:text-gray-100 mb-0">Wadarta Lacagta</h4>
                  <p className="text-xs font-bold text-primary">${overviewStats?.totalBalance.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-lightGray dark:bg-gray-700 p-1.5 rounded-lg">
                  <h4 className="text-xs font-semibold text-darkGray dark:text-gray-100 mb-0">Dakhliga Bishaan</h4>
                  <p className="text-xs font-bold text-secondary">${overviewStats?.totalIncomeThisMonth.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-lightGray dark:bg-gray-700 p-1.5 rounded-lg">
                  <h4 className="text-xs font-semibold text-darkGray dark:text-gray-100 mb-0">Kharashyada Bishaan</h4>
                  <p className="text-xs font-bold text-redError">${overviewStats?.totalExpensesThisMonth.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-lightGray dark:bg-gray-700 p-1.5 rounded-lg">
                  <h4 className="text-xs font-semibold text-darkGray dark:text-gray-100 mb-0">Accounts-ka Bankiga</h4>
                  <p className="text-xs font-bold text-blue-500">{overviewStats?.totalBankAccounts || '0'}</p>
                </div>
                <div className="bg-lightGray dark:bg-gray-700 p-1.5 rounded-lg">
                  <h4 className="text-xs font-semibold text-darkGray dark:text-gray-100 mb-0">Accounts-ka Cash-ka</h4>
                  <p className="text-xs font-bold text-green-500">{overviewStats?.totalCashAccounts || '0'}</p>
                </div>
                <div className="bg-lightGray dark:bg-gray-700 p-1.5 rounded-lg">
                  <h4 className="text-xs font-semibold text-darkGray dark:text-gray-100 mb-0">Accounts-ka Mobile Money</h4>
                  <p className="text-xs font-bold text-purple-500">{overviewStats?.totalMobileMoneyAccounts || '0'}</p>
                </div>
              </div>
              
              {/* Recent Activity Summary */}
              <div className="bg-lightGray dark:bg-gray-700 p-1.5 rounded-lg">
                <h4 className="text-xs font-semibold text-darkGray dark:text-gray-100 mb-0.5">Dhaqdhaqaaqa Dhawaan</h4>
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-center">
                    <p className="text-xs font-bold text-primary">{recentTransactions.length}</p>
                    <p className="text-xs text-mediumGray dark:text-gray-400">Dhaqdhaqaaq Dhawaan</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-orange-500">{debtTransactions.length}</p>
                    <p className="text-xs text-mediumGray dark:text-gray-400">Dhaqdhaqaaq Deynta</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-blue-500">{projectDebtTransactions.length}</p>
                    <p className="text-xs text-mediumGray dark:text-gray-400">Dhaqdhaqaaq Mashruucyada</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Transactions' && (
            <div>
              <h3 className="text-xs font-bold text-darkGray dark:text-gray-100 mb-1">Dhaqdhaqaaqa Lacagta Dhawaan</h3>
              {recentTransactions.length === 0 ? (
                <p className="text-xs text-mediumGray dark:text-gray-400">Ma jiraan dhaqdhaqaaq lacag ah oo dhawaan ah.</p>
              ) : (
                <>
                  {/* Mobile View - Ultra Compact Cards */}
                  <div className="block lg:hidden space-y-1">
                    {recentTransactions.map(trx => (
                      <MobileTransactionCard key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                    ))}
                  </div>
                  
                  {/* Desktop View - Table */}
                  <div className="hidden lg:block overflow-x-auto -mx-4 sm:mx-0">
                    <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                      <thead className="bg-lightGray dark:bg-gray-700">
                        <tr>
                          <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Taariikhda</th>
                          <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Sharaxaad</th>
                          <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca</th>
                          <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Qiimaha</th>
                          <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Account</th>
                          <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">La Xiriira</th>
                          <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                        {recentTransactions.map(trx => (
                          <TransactionRow key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <Link href="/accounting/transactions" className="mt-2 inline-block text-primary hover:underline text-xs font-medium">
                Fiiri Dhammaan Dhaqdhaqaaqa &rarr;
              </Link>
            </div>
          )}

          {activeTab === 'Debts' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Dhaqdhaqaaqa Deynta</h3>
                  <p className="text-sm sm:text-base text-mediumGray dark:text-gray-400">
                    Halkan waxaad ka arki kartaa dhammaan dhaqdhaqaaqa deynta - kuwa la qaatay iyo kuwa la bixiyay.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Link 
                    href="/accounting/transactions/add" 
                    className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium text-sm sm:text-base"
                  >
                    <Plus size={18} className="mr-2" />
                    Ku Dar Dhaqdhaqaaq
                  </Link>
                  <Link 
                    href="/reports/debts" 
                    className="inline-flex items-center justify-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors duration-200 font-medium text-sm sm:text-base"
                  >
                    <Eye size={18} className="mr-2" />
                    Warbixinta Deynta
                  </Link>
                </div>
              </div>

              {debtTransactions.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Scale size={40} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">Ma Jiraan Dhaqdhaqaaq Deyn Ah</h4>
                  <p className="text-sm sm:text-base text-mediumGray dark:text-gray-400 mb-6">
                    Wali ma jiraan dhaqdhaqaaq deyn ah oo la qaatay ama la bixiyay.
                  </p>
                  <Link 
                    href="/accounting/transactions/add" 
                    className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium text-sm sm:text-base"
                  >
                    <Plus size={18} className="mr-2" />
                    Ku Dar Dhaqdhaqaaq Deyn Ah
                  </Link>
                </div>
              ) : (
                <>
                  {/* Mobile View - Ultra Compact Cards */}
                  <div className="block lg:hidden space-y-1">
                    {debtTransactions.map(trx => (
                      <MobileTransactionCard key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                    ))}
                  </div>
                  
                  {/* Desktop View - Table */}
                  <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                        <thead className="bg-lightGray dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Taariikh</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Sharaxaad</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Qiime</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Account</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">La Xiriira</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                          {debtTransactions.map(trx => (
                            <TransactionRow key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'Project Debts' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Dhaqdhaqaaqa Deynta Mashruucyada</h3>
                  <p className="text-sm sm:text-base text-mediumGray dark:text-gray-400">
                    Halkan waxaad ka arki kartaa dhammaan dhaqdhaqaaqa deynta ee la xiriira mashruucyada.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Link 
                    href="/accounting/transactions/add" 
                    className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium text-sm sm:text-base"
                  >
                    <Plus size={18} className="mr-2" />
                    Ku Dar Dhaqdhaqaaq
                  </Link>
                  <Link 
                    href="/reports/debts" 
                    className="inline-flex items-center justify-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors duration-200 font-medium text-sm sm:text-base"
                  >
                    <Eye size={18} className="mr-2" />
                    Warbixinta Deynta
                  </Link>
                </div>
              </div>

              {projectDebtTransactions.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <BriefcaseIcon size={40} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">Ma Jiraan Dhaqdhaqaaq Deyn Ah oo Mashruuc Loo Xiriira</h4>
                  <p className="text-sm sm:text-base text-mediumGray dark:text-gray-400 mb-6">
                    Wali ma jiraan dhaqdhaqaaq deyn ah oo la xiriira mashruucyada.
                  </p>
                  <Link 
                    href="/accounting/transactions/add" 
                    className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium text-sm sm:text-base"
                  >
                    <Plus size={18} className="mr-2" />
                    Ku Dar Dhaqdhaqaaq Mashruuc
                  </Link>
                </div>
              ) : (
                <>
                  {/* Mobile View - Ultra Compact Cards */}
                  <div className="block lg:hidden space-y-1">
                    {projectDebtTransactions.map(trx => (
                      <MobileTransactionCard key={trx.id} transaction={trx} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                    ))}
                  </div>
                  
                  {/* Desktop View - Table */}
                  <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                        <thead className="bg-lightGray dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Taariikh</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Sharaxaad</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Qiime</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Mashruuc</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Account</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">La Xiriira</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Actions</th>
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
            </div>
          )}

          {activeTab === 'Accounts' && (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-darkGray dark:text-gray-100 mb-3 sm:mb-4">Accounts-ka Lacagta</h3>
              {accounts.length === 0 ? (
                <p className="text-sm sm:text-base text-mediumGray dark:text-gray-400">Ma jiraan accounts lacag ah oo la helay.</p>
              ) : (
                <>
                  {/* Mobile View - Cards */}
                  <div className="block lg:hidden space-y-3">
                    {accounts.map(acc => (
                      <div key={acc.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-primary">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-darkGray dark:text-gray-100 text-base flex items-center space-x-2 truncate">
                              <Banknote size={18} className="text-primary flex-shrink-0" />
                              <span className="truncate">{acc.name}</span>
                            </h4>
                          </div>
                          <div className="flex space-x-1 flex-shrink-0 ml-2">
                            <Link href={`/accounting/accounts/${acc.id}`} className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View">
                              <Eye size={14} />
                            </Link>
                            <button onClick={() => handleEditAccount(acc.id)} className="p-1.5 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit">
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleDeleteAccount(acc.id)} className="p-1.5 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="mb-3 text-xl font-bold text-primary">
                          ${acc.balance.toLocaleString()}
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-2">
                            <TagIcon size={12} className="flex-shrink-0" />
                            <span className="truncate">{acc.type}</span>
                          </p>
                          <p className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-2">
                            <Coins size={12} className="flex-shrink-0" />
                            <span className="truncate">{acc.currency}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop View - Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                      <thead className="bg-lightGray dark:bg-gray-700">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Magaca Account-ka</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Currency</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Balance</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                        {accounts.map(acc => (
                          <AccountRow key={acc.id} account={acc} onEdit={handleEditAccount} onDelete={handleDeleteAccount} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <Link href="/accounting/accounts/add" className="mt-3 sm:mt-4 bg-primary text-white py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 transition duration-200 w-fit text-sm sm:text-base">
                  <Plus size={16} className="mr-2"/> Ku Dar Account Cusub
              </Link>
            </div>
          )}

          {activeTab === 'Reports' && (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-darkGray dark:text-gray-100 mb-3 sm:mb-4">Warbixinada Maaliyadda</h3>
              <p className="text-sm sm:text-base text-mediumGray dark:text-gray-400 mb-4">
                Halkan waxaad ka heli kartaa warbixino maaliyadeed oo faahfaahsan.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Link href="/reports/profit-loss" className="bg-lightGray dark:bg-gray-700 p-3 sm:p-4 rounded-lg shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center space-x-2 sm:space-x-3">
                  <TrendingUp size={20} className="text-primary flex-shrink-0"/> 
                  <span className="font-semibold text-darkGray dark:text-gray-100 text-sm sm:text-base">Profit & Loss Report</span>
                </Link>
                <Link href="/reports/bank" className="bg-lightGray dark:bg-gray-700 p-3 sm:p-4 rounded-lg shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center space-x-2 sm:space-x-3">
                  <Banknote size={20} className="text-secondary flex-shrink-0"/> 
                  <span className="font-semibold text-darkGray dark:text-gray-100 text-sm sm:text-base">Bank & Cash Flow Report</span>
                </Link>
                <Link href="/reports/expenses" className="bg-lightGray dark:bg-gray-700 p-3 sm:p-4 rounded-lg shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center space-x-2 sm:space-x-3">
                  <DollarSign size={20} className="text-redError flex-shrink-0"/> 
                  <span className="font-semibold text-darkGray dark:text-gray-100 text-sm sm:text-base">Expenses Report</span>
                </Link>
                <Link href="/reports/debts" className="bg-lightGray dark:bg-gray-700 p-3 sm:p-4 rounded-lg shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center space-x-2 sm:space-x-3">
                  <Scale size={20} className="text-accent flex-shrink-0"/> 
                  <span className="font-semibold text-darkGray dark:text-gray-100 text-sm sm:text-base">Debts Report</span>
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
