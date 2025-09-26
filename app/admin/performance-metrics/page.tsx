'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import {
  ArrowLeft, BarChart, LineChart, PieChart, Activity, Clock, Database,
  Users, Briefcase, DollarSign, TrendingUp, TrendingDown, RefreshCw,
  Server, Cpu, HardDrive, Wifi, AlertTriangle, CheckCircle, XCircle,
  Calendar, Download, Filter, Search, Eye, Settings
} from 'lucide-react';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  status: 'good' | 'warning' | 'critical';
  timestamp: Date;
}

interface SystemHealth {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  database: number;
  api: number;
}

interface TransactionMetrics {
  totalTransactions: number;
  transactionsToday: number;
  transactionsThisWeek: number;
  transactionsThisMonth: number;
  averageTransactionValue: number;
  topTransactionTypes: Array<{ type: string; count: number; percentage: number }>;
}

export default function PerformanceMetricsPage() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpu: 0, memory: 0, disk: 0, network: 0, database: 0, api: 0
  });
  const [transactionMetrics, setTransactionMetrics] = useState<TransactionMetrics>({
    totalTransactions: 0,
    transactionsToday: 0,
    transactionsThisWeek: 0,
    transactionsThisMonth: 0,
    averageTransactionValue: 0,
    topTransactionTypes: []
  });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  useEffect(() => {
    fetchMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const fetchMetrics = async () => {
    try {
      const [metricsRes, healthRes, transactionRes] = await Promise.all([
        fetch('/api/admin/performance-metrics'),
        fetch('/api/admin/system-health'),
        fetch('/api/admin/transaction-metrics')
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics || []);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setSystemHealth(healthData.health || systemHealth);
      }

      if (transactionRes.ok) {
        const transactionData = await transactionRes.json();
        setTransactionMetrics(transactionData.metrics || transactionMetrics);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} className="text-green-600" />;
      case 'down': return <TrendingDown size={16} className="text-red-600" />;
      case 'stable': return <Activity size={16} className="text-blue-600" />;
      default: return <Activity size={16} className="text-gray-600" />;
    }
  };

  const getHealthColor = (value: number) => {
    if (value >= 80) return 'text-red-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getHealthBgColor = (value: number) => {
    if (value >= 80) return 'bg-red-100 dark:bg-red-900/20';
    if (value >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-green-100 dark:bg-green-900/20';
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/admin" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Performance Metrics
        </h1>
        <div className="flex space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-mediumGray dark:text-gray-400">Auto Refresh:</label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
          >
            <option value={10}>10s</option>
            <option value={30}>30s</option>
            <option value={60}>1m</option>
            <option value={300}>5m</option>
          </select>
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center disabled:opacity-50"
          >
            <RefreshCw size={20} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100">CPU Usage</h3>
            <Cpu size={24} className="text-blue-600" />
          </div>
          <div className={`text-3xl font-bold mb-2 ${getHealthColor(systemHealth.cpu)}`}>
            {systemHealth.cpu}%
          </div>
          <div className={`w-full bg-gray-200 rounded-full h-2 ${getHealthBgColor(systemHealth.cpu)}`}>
            <div 
              className={`h-2 rounded-full ${systemHealth.cpu >= 80 ? 'bg-red-600' : systemHealth.cpu >= 60 ? 'bg-yellow-600' : 'bg-green-600'}`}
              style={{ width: `${systemHealth.cpu}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100">Memory Usage</h3>
            <Server size={24} className="text-green-600" />
          </div>
          <div className={`text-3xl font-bold mb-2 ${getHealthColor(systemHealth.memory)}`}>
            {systemHealth.memory}%
          </div>
          <div className={`w-full bg-gray-200 rounded-full h-2 ${getHealthBgColor(systemHealth.memory)}`}>
            <div 
              className={`h-2 rounded-full ${systemHealth.memory >= 80 ? 'bg-red-600' : systemHealth.memory >= 60 ? 'bg-yellow-600' : 'bg-green-600'}`}
              style={{ width: `${systemHealth.memory}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100">Disk Usage</h3>
            <HardDrive size={24} className="text-purple-600" />
          </div>
          <div className={`text-3xl font-bold mb-2 ${getHealthColor(systemHealth.disk)}`}>
            {systemHealth.disk}%
          </div>
          <div className={`w-full bg-gray-200 rounded-full h-2 ${getHealthBgColor(systemHealth.disk)}`}>
            <div 
              className={`h-2 rounded-full ${systemHealth.disk >= 80 ? 'bg-red-600' : systemHealth.disk >= 60 ? 'bg-yellow-600' : 'bg-green-600'}`}
              style={{ width: `${systemHealth.disk}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100">Network</h3>
            <Wifi size={24} className="text-orange-600" />
          </div>
          <div className={`text-3xl font-bold mb-2 ${getHealthColor(systemHealth.network)}`}>
            {systemHealth.network}%
          </div>
          <div className={`w-full bg-gray-200 rounded-full h-2 ${getHealthBgColor(systemHealth.network)}`}>
            <div 
              className={`h-2 rounded-full ${systemHealth.network >= 80 ? 'bg-red-600' : systemHealth.network >= 60 ? 'bg-yellow-600' : 'bg-green-600'}`}
              style={{ width: `${systemHealth.network}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100">Database</h3>
            <Database size={24} className="text-indigo-600" />
          </div>
          <div className={`text-3xl font-bold mb-2 ${getHealthColor(systemHealth.database)}`}>
            {systemHealth.database}%
          </div>
          <div className={`w-full bg-gray-200 rounded-full h-2 ${getHealthBgColor(systemHealth.database)}`}>
            <div 
              className={`h-2 rounded-full ${systemHealth.database >= 80 ? 'bg-red-600' : systemHealth.database >= 60 ? 'bg-yellow-600' : 'bg-green-600'}`}
              style={{ width: `${systemHealth.database}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100">API Response</h3>
            <Activity size={24} className="text-pink-600" />
          </div>
          <div className={`text-3xl font-bold mb-2 ${getHealthColor(systemHealth.api)}`}>
            {systemHealth.api}ms
          </div>
          <div className="text-sm text-mediumGray dark:text-gray-400">
            Average response time
          </div>
        </div>
      </div>

      {/* Transaction Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <DollarSign size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Total Transactions</h4>
          <p className="text-2xl font-extrabold text-blue-600">{transactionMetrics.totalTransactions.toLocaleString()}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Calendar size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Today</h4>
          <p className="text-2xl font-extrabold text-green-600">{transactionMetrics.transactionsToday}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Clock size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">This Week</h4>
          <p className="text-2xl font-extrabold text-yellow-600">{transactionMetrics.transactionsThisWeek}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <BarChart size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">This Month</h4>
          <p className="text-2xl font-extrabold text-purple-600">{transactionMetrics.transactionsThisMonth}</p>
        </div>
      </div>

      {/* Performance Metrics Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b border-lightGray dark:border-gray-700">
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">
            Performance Metrics ({metrics.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw size={32} className="animate-spin text-primary mx-auto mb-4" />
            <p className="text-mediumGray dark:text-gray-400">Loading performance metrics...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
              <thead className="bg-lightGray dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                {metrics.map((metric) => (
                  <tr key={metric.id} className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-darkGray dark:text-gray-100">
                        {metric.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-darkGray dark:text-gray-100">
                        {metric.value.toLocaleString()} {metric.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTrendIcon(metric.trend)}
                        <span className="ml-2 text-sm text-mediumGray dark:text-gray-300 capitalize">
                          {metric.trend}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${
                        metric.change > 0 ? 'text-green-600' : 
                        metric.change < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(metric.status)}`}>
                        {metric.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-mediumGray dark:text-gray-300">
                      {new Date(metric.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Types Chart */}
      {transactionMetrics.topTransactionTypes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-6">
            Transaction Types Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transactionMetrics.topTransactionTypes.map((type, index) => (
              <div key={type.type} className="bg-lightGray dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-darkGray dark:text-gray-100">
                    {type.type}
                  </span>
                  <span className="text-sm text-mediumGray dark:text-gray-400">
                    {type.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${type.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-mediumGray dark:text-gray-400 mt-1">
                  {type.count} transactions
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}

