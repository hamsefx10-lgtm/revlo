// app/reports/bank/page.tsx - Bank & Cash Flow Report Page (10000% Design)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, Banknote, Plus, Search, Filter, Calendar, List, LayoutGrid, 
  DollarSign, CreditCard, Landmark, CheckCircle, XCircle, ChevronRight, 
  TrendingUp, TrendingDown, Eye, Edit, Trash2, Send, Upload, Download,
  RefreshCw, MessageSquare // For refresh and other icons
} from 'lucide-react';
import Toast from '../../../components/common/Toast'; // Reuse Toast component
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';


// --- Types ---
interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  account: string;
}

// Helper for chart colors
const CHART_COLORS = ['#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#9B59B6', '#1ABC9C'];

// Helper to aggregate monthly cash flow data
const aggregateMonthlyCashFlow = (transactions: Transaction[]) => {
  const monthlyDataMap: { [key: string]: { month: string; income: number; expense: number; net: number } } = {};
  transactions.forEach(trx => {
    const monthYear = new Date(trx.date).toLocaleString('en-US', { month: 'short', year: 'numeric' });
    if (!monthlyDataMap[monthYear]) {
      monthlyDataMap[monthYear] = { month: monthYear, income: 0, expense: 0, net: 0 };
    }
    if (trx.type === 'INCOME' || trx.type === 'TRANSFER_IN' || trx.type === 'DEBT_TAKEN') {
      monthlyDataMap[monthYear].income += trx.amount;
    } else if (trx.type === 'EXPENSE' || trx.type === 'TRANSFER_OUT' || trx.type === 'DEBT_REPAID') {
      monthlyDataMap[monthYear].expense += Math.abs(trx.amount); // Ensure expense is positive for chart
    }
    monthlyDataMap[monthYear].net = monthlyDataMap[monthYear].income - monthlyDataMap[monthYear].expense;
  });
  return Object.values(monthlyDataMap).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
};

// --- Transaction Table Row Component ---
const TransactionRow: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const isIncome = transaction.amount >= 0;
  const amountColorClass = isIncome ? 'text-secondary' : 'text-redError';
  const typeBadgeClass = 
    transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN' ? 'bg-secondary/10 text-secondary' :
    transaction.type === 'EXPENSE' || transaction.type === 'TRANSFER_OUT' || transaction.type === 'DEBT_REPAID' ? 'bg-redError/10 text-redError' :
    'bg-primary/10 text-primary';

  return (
    <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
      <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100">{new Date(transaction.date).toLocaleDateString()}</td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{transaction.description}</td>
      <td className="p-4 whitespace-nowrap">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeBadgeClass}`}>
          {transaction.type}
        </span>
      </td>
      <td className={`p-4 whitespace-nowrap font-semibold ${amountColorClass}`}>
        {isIncome ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
      </td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{transaction.account}</td>
      <td className="p-4 whitespace-nowrap text-right">
        <button className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View Details">
          <Eye size={18} />
        </button>
      </td>
    </tr>
  );
};

// --- Main Bank & Cash Flow Page Component ---
export default function BankCashFlowReportPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState('All');
  const [filterAccount, setFilterAccount] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchBankReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/accounting/reports/bank');
      if (!res.ok) throw new Error('Failed to fetch bank & cash flow data');
      const data = await res.json();
      
      // Handle the correct data structure from API
      const accountsData = data.accounts || [];
      const transactionsData = data.transactions || [];
      
      // Ensure accounts have the required structure
      const formattedAccounts = accountsData.map((acc: any) => ({
        id: acc.id || '',
        name: acc.name || 'Unknown Account',
        type: acc.type || 'UNKNOWN',
        balance: typeof acc.balance === 'number' ? acc.balance : 0,
        currency: acc.currency || 'USD'
      }));
      
      // Ensure transactions have the required structure
      const formattedTransactions = transactionsData.map((trx: any) => ({
        id: trx.id || '',
        date: trx.transactionDate || trx.date || new Date().toISOString(),
        description: trx.description || 'No description',
        amount: typeof trx.amount === 'number' ? trx.amount : 0,
        type: trx.type || 'UNKNOWN',
        account: trx.account?.name || trx.account || 'Unknown Account'
      }));
      
      setAccounts(formattedAccounts);
      setTransactions(formattedTransactions);
      setToastMessage({ message: 'Warbixinta si guul leh ayaa la soo geliyay!', type: 'success' });
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
      setToastMessage({ message: err.message || 'Cilad ayaa dhacday marka warbixinta la soo gelinayay.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankReport();
  }, []);

  // Statistics with safe calculations
  const totalBalance = accounts.length > 0 ? accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0) : 0;
  const totalBankBalance = accounts.length > 0 ? accounts.filter(acc => acc.type === 'BANK' || acc.type === 'MOBILE_MONEY').reduce((sum, acc) => sum + (acc.balance || 0), 0) : 0;
  const totalCashBalance = accounts.length > 0 ? accounts.filter(acc => acc.type === 'CASH').reduce((sum, acc) => sum + (acc.balance || 0), 0) : 0;

  const filteredTransactions = transactions.filter(trx => {
    const matchesType = filterType === 'All' || trx.type === filterType;
    const matchesAccount = filterAccount === 'All' || trx.account === filterAccount;
    const matchesDate = filterDateRange === 'All' ? true : true; // Placeholder for date logic
    return matchesType && matchesAccount && matchesDate;
  });

  const transactionTypes = ['All', 'INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT', 'DEBT_TAKEN', 'DEBT_REPAID', 'OTHER'];
  const accountNames = ['All', ...accounts.map(acc => acc.name || 'Unknown Account').filter(name => name !== 'Unknown Account' || accounts.length === 0)];
  const dateRanges = ['All', 'Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'This Quarter', 'This Year'];

  // Chart data with safe handling
  const monthlyCashFlowData = transactions.length > 0 ? aggregateMonthlyCashFlow(filteredTransactions) : [];
  const accountDistributionData = accounts.length > 0 ? accounts.map(acc => ({ 
    name: acc.name || 'Unknown Account', 
    value: acc.balance || 0 
  })).filter(item => item.value > 0) : [];

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

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[400px] text-darkGray dark:text-gray-100">
        <span className="animate-spin mr-3"><Banknote size={32} className="text-primary" /></span> Warbixinta Bankiga & Lacagta ayaa soo dhacaya...
      </div>
    </Layout>
  );
  if (error) return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle size={32} className="mb-2 text-redError" />
        <div className="text-redError text-lg font-bold mb-2">{error}</div>
        <button onClick={() => window.location.reload()} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold mt-2">Reload</button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/reports" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Bank & Cash Flow
        </h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => window.print()} 
            className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center"
            title="Print Report"
          >
            <Download size={20} className="mr-2" /> Soo Deji PDF
          </button>
          <button 
            onClick={() => {
              const csvData = transactions.map(trx => ({
                Date: new Date(trx.date).toLocaleDateString(),
                Description: trx.description,
                Type: trx.type,
                Amount: trx.amount,
                Account: trx.account
              }));
              const csvContent = "data:text/csv;charset=utf-8," + 
                "Date,Description,Type,Amount,Account\n" +
                csvData.map(row => Object.values(row).join(",")).join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "bank_cashflow_report.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="bg-secondary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-green-600 transition duration-200 shadow-md flex items-center"
            title="Export to CSV"
          >
            <Upload size={20} className="mr-2" /> Dhoofi CSV
          </button>
            <button 
              onClick={fetchBankReport}
              className="bg-accent text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-orange-600 transition duration-200 shadow-md flex items-center"
              title="Refresh Data"
            >
              <RefreshCw size={20} className="mr-2" /> Cusboonaysii
            </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Guud ee Lacagta</h4>
          <p className="text-3xl font-extrabold text-primary">${totalBalance.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Lacagta Bankiga</h4>
          <p className="text-3xl font-extrabold text-secondary">${totalBankBalance.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Lacagta Gacanta</h4>
          <p className="text-3xl font-extrabold text-accent">${totalCashBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Cash Flow Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up">
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4">Dhaqdhaqaaqa Lacagta Bishiiba</h3>
          <div className="w-full h-[300px]">
            {monthlyCashFlowData.length > 0 ? (
              <ResponsiveContainer>
                <LineChart data={monthlyCashFlowData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" vertical={false} />
                  <XAxis dataKey="month" stroke="#7F8C8D" className="dark:text-gray-400 text-sm" />
                  <YAxis stroke="#7F8C8D" className="dark:text-gray-400 text-sm" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px' }}
                    labelStyle={{ color: '#2C3E50', fontWeight: 'bold' }}
                    itemStyle={{ color: '#2C3E50' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke={CHART_COLORS[1]} name="Lacag Soo Gasha" />
                  <Line type="monotone" dataKey="expense" stroke={CHART_COLORS[3]} name="Lacag Baxda" />
                  <Line type="monotone" dataKey="net" stroke={CHART_COLORS[0]} name="Net Flow" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-mediumGray dark:text-gray-400">
                <div className="text-center">
                  <Banknote size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Ma jiraan dhaqdhaqaaq lacageed oo la helay</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Distribution Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up">
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4">Qaybinta Lacagta Account-yada</h3>
          <div className="w-full h-[300px]">
            {accountDistributionData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={accountDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={120}
                    dataKey="value"
                  >
                    {accountDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px' }}
                    labelStyle={{ color: '#2C3E50', fontWeight: 'bold' }}
                    itemStyle={{ color: '#2C3E50' }}
                  />
                  <Legend align="right" verticalAlign="middle" layout="vertical" wrapperStyle={{ paddingLeft: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-mediumGray dark:text-gray-400">
                <div className="text-center">
                  <CreditCard size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Ma jiraan accounts oo la helay</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Log */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in-up">
        <div className="flex justify-between items-center p-6 border-b border-lightGray dark:border-gray-700">
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">Diiwaanka Dhaqdhaqaaqa Lacagta</h3>
          <div className="flex space-x-3">
            <button className="bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-100 py-2 px-4 rounded-lg font-semibold flex items-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 shadow-sm">
              <Upload size={18} className="mr-2"/> Dhoofi CSV
            </button>
            <button className="bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-100 py-2 px-4 rounded-lg font-semibold flex items-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 shadow-sm">
              <Download size={18} className="mr-2"/> Soo Deji PDF
            </button>
          </div>
        </div>

        {/* Filters for Transactions */}
        <div className="p-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 border-b border-lightGray dark:border-gray-700">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
            <input type="text" placeholder="Search transactions..." className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"/>
          </div>
          <div className="relative w-full md:w-48">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} title="Filter by transaction type" className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none">
              <option value="All">Dhammaan Noocyada</option>
              <option value="INCOME">Lacag Soo Gasha</option>
              <option value="EXPENSE">Lacag Baxda</option>
              <option value="TRANSFER_IN">Wareejin Soo Gasha</option>
              <option value="TRANSFER_OUT">Wareejin Baxda</option>
              <option value="DEBT_TAKEN">Deyn La Qaatay</option>
              <option value="DEBT_REPAID">Deyn La Bixiyay</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400"><ChevronRight className="transform rotate-90" size={20} /></div>
          </div>
          <div className="relative w-full md:w-48">
            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
            <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} title="Filter by account" className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none">
              <option value="All">Dhammaan Accounts-ka</option>
              {accounts.map((acc: Account) => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400"><ChevronRight className="transform rotate-90" size={20} /></div>
          </div>
          <div className="relative w-full md:w-48">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
            <select value={filterDateRange} onChange={(e) => setFilterDateRange(e.target.value)} title="Filter by date range" className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none">
              <option value="All">Dhammaan Taariikhaha</option>
              <option value="Today">Maanta</option>
              <option value="This Week">Toddobaadkan</option>
              <option value="This Month">Bishaan</option>
              <option value="This Year">Sannadkan</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400"><ChevronRight className="transform rotate-90" size={20} /></div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
            <thead className="bg-lightGray dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Taariikhda</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Sharaxaad</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Qiimaha</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Account</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Ficillo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lightGray dark:divide-gray-700">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(trx => (
                  <tr key={trx.id} className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150">
                    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100">{new Date(trx.date).toLocaleDateString()}</td>
                    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{trx.description}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        trx.type === 'INCOME' || trx.type === 'TRANSFER_IN' ? 'bg-secondary/10 text-secondary' :
                        trx.type === 'EXPENSE' || trx.type === 'TRANSFER_OUT' || trx.type === 'DEBT_REPAID' ? 'bg-redError/10 text-redError' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {trx.type}
                      </span>
                    </td>
                    <td className={`p-4 whitespace-nowrap font-semibold ${
                      trx.amount >= 0 ? 'text-secondary' : 'text-redError'
                    }`}>
                      {trx.amount >= 0 ? '+' : '-'}${Math.abs(trx.amount).toLocaleString()}
                    </td>
                    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{trx.account}</td>
                    <td className="p-4 whitespace-nowrap text-right">
                      <button className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View Details">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-mediumGray dark:text-gray-400">Ma jiraan dhaqdhaqaaq lacageed oo la helay.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Placeholder */}
        <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
            <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Hore</button>
            <span className="text-sm text-darkGray dark:text-gray-100">Bogga 1 ee {Math.ceil(filteredTransactions.length / 10) || 1}</span>
            <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Xiga</button>
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
