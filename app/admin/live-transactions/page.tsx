'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import {
  ArrowLeft, Activity, DollarSign, Users, Briefcase, Clock, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Eye, Filter, Search, Download,
  Play, Pause, Settings, BarChart, TrendingUp, TrendingDown
} from 'lucide-react';

interface LiveTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'DEBT_TAKEN' | 'DEBT_REPAID';
  amount: number;
  description: string;
  customerId?: string;
  customerName?: string;
  projectId?: string;
  projectName?: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  userId: string;
  userEmail: string;
}

interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  transactionsToday: number;
  amountToday: number;
  averageTransactionValue: number;
  topTransactionTypes: Array<{ type: string; count: number; amount: number }>;
  recentActivity: Array<{ time: string; count: number; amount: number }>;
}

export default function LiveTransactionsPage() {
  const [transactions, setTransactions] = useState<LiveTransaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalAmount: 0,
    transactionsToday: 0,
    amountToday: 0,
    averageTransactionValue: 0,
    topTransactionTypes: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5); // seconds
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLiveData();
    
    if (isLive) {
      const interval = setInterval(fetchLiveData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [isLive, refreshInterval]);

  const fetchLiveData = async () => {
    try {
      const [transactionsRes, statsRes] = await Promise.all([
        fetch('/api/admin/live-transactions'),
        fetch('/api/admin/transaction-stats')
      ]);

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData.transactions || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INCOME': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'EXPENSE': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'TRANSFER_IN': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'TRANSFER_OUT': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200';
      case 'DEBT_TAKEN': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200';
      case 'DEBT_REPAID': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INCOME': return <TrendingUp size={16} className="text-green-600" />;
      case 'EXPENSE': return <TrendingDown size={16} className="text-red-600" />;
      case 'TRANSFER_IN': return <TrendingUp size={16} className="text-blue-600" />;
      case 'TRANSFER_OUT': return <TrendingDown size={16} className="text-orange-600" />;
      case 'DEBT_TAKEN': return <TrendingUp size={16} className="text-purple-600" />;
      case 'DEBT_REPAID': return <TrendingDown size={16} className="text-indigo-600" />;
      default: return <Activity size={16} className="text-gray-600" />;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  const exportTransactions = () => {
    const csvContent = [
      ['ID', 'Type', 'Amount', 'Description', 'Customer', 'Project', 'Timestamp', 'Status', 'User'].join(','),
      ...filteredTransactions.map(transaction => [
        transaction.id,
        transaction.type,
        transaction.amount,
        `"${transaction.description.replace(/"/g, '""')}"`,
        transaction.customerName || 'N/A',
        transaction.projectName || 'N/A',
        transaction.timestamp.toISOString(),
        transaction.status,
        transaction.userEmail
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/admin" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Live Transaction Monitoring
        </h1>
        <div className="flex space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-mediumGray dark:text-gray-400">Live Mode:</label>
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                isLive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
              }`}
            >
              {isLive ? <Play size={16} className="inline mr-1" /> : <Pause size={16} className="inline mr-1" />}
              {isLive ? 'ON' : 'OFF'}
            </button>
          </div>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value={1}>1s</option>
            <option value={5}>5s</option>
            <option value={10}>10s</option>
            <option value={30}>30s</option>
          </select>
          <button
            onClick={exportTransactions}
            className="bg-secondary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-green-700 transition duration-200 shadow-md flex items-center"
          >
            <Download size={20} className="mr-2" />
            Export CSV
          </button>
          <button
            onClick={fetchLiveData}
            disabled={loading}
            className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center disabled:opacity-50"
          >
            <RefreshCw size={20} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Live Status Indicator */}
      <div className={`mb-6 p-4 rounded-lg flex items-center ${
        isLive 
          ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' 
          : 'bg-gray-50 border border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'
      }`}>
        <div className={`w-3 h-3 rounded-full mr-3 ${
          isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`}></div>
        <span className={`font-medium ${
          isLive 
            ? 'text-green-800 dark:text-green-200' 
            : 'text-gray-800 dark:text-gray-200'
        }`}>
          {isLive ? 'Live monitoring active' : 'Live monitoring paused'} 
          {isLive && ` • Refreshing every ${refreshInterval} seconds`}
        </span>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Activity size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Total Transactions</h4>
          <p className="text-2xl font-extrabold text-blue-600">{stats.totalTransactions.toLocaleString()}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <DollarSign size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Total Amount</h4>
          <p className="text-2xl font-extrabold text-green-600">${stats.totalAmount.toLocaleString()}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Clock size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Today</h4>
          <p className="text-2xl font-extrabold text-yellow-600">{stats.transactionsToday}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <BarChart size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Avg Value</h4>
          <p className="text-2xl font-extrabold text-purple-600">${stats.averageTransactionValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Transaction Types Chart */}
      {stats.topTransactionTypes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-6">
            Transaction Types Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.topTransactionTypes.map((type, index) => (
              <div key={type.type} className="bg-lightGray dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-darkGray dark:text-gray-100">
                    {type.type.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-mediumGray dark:text-gray-400">
                    {type.count} transactions
                  </span>
                </div>
                <div className="text-lg font-bold text-darkGray dark:text-gray-100 mb-1">
                  ${type.amount.toLocaleString()}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${(type.count / stats.totalTransactions) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
            <option value="TRANSFER_IN">Transfer In</option>
            <option value="TRANSFER_OUT">Transfer Out</option>
            <option value="DEBT_TAKEN">Debt Taken</option>
            <option value="DEBT_REPAID">Debt Repaid</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          
          <div className="text-sm text-mediumGray dark:text-gray-400 flex items-center">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        </div>
      </div>

      {/* Live Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-lightGray dark:border-gray-700">
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">
            Live Transactions ({filteredTransactions.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw size={32} className="animate-spin text-primary mx-auto mb-4" />
            <p className="text-mediumGray dark:text-gray-400">Loading live transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <Activity size={48} className="text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">No Transactions Found</h4>
            <p className="text-mediumGray dark:text-gray-400">No transactions match your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
              <thead className="bg-lightGray dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getTypeIcon(transaction.type)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-darkGray dark:text-gray-100">
                            {transaction.type.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-mediumGray dark:text-gray-400 max-w-xs truncate">
                            {transaction.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${
                        transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN' || transaction.type === 'DEBT_REPAID'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        ${transaction.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-darkGray dark:text-gray-100">
                        {transaction.customerName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-darkGray dark:text-gray-100">
                        {transaction.projectName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                        {transaction.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-mediumGray dark:text-gray-300">
                        {transaction.userEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-mediumGray dark:text-gray-300">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
