'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import {
  ArrowLeft, AlertTriangle, XCircle, CheckCircle, RefreshCw, Search,
  Filter, Calendar, Download, Eye, Trash2, Clock, Server, Database,
  Users, Briefcase, DollarSign, FileText, Settings, Activity
} from 'lucide-react';

interface ErrorLog {
  id: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  stack?: string;
  source: string;
  userId?: string;
  userEmail?: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  metadata?: any;
}

interface ErrorStats {
  totalErrors: number;
  errorsToday: number;
  errorsThisWeek: number;
  errorsThisMonth: number;
  criticalErrors: number;
  unresolvedErrors: number;
}

export default function ErrorLogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<ErrorStats>({
    totalErrors: 0,
    errorsToday: 0,
    errorsThisWeek: 0,
    errorsThisMonth: 0,
    criticalErrors: 0,
    unresolvedErrors: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [resolvedFilter, setResolvedFilter] = useState<string>('all');
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    fetchErrorLogs();
  }, []);

  const fetchErrorLogs = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        fetch('/api/admin/error-logs'),
        fetch('/api/admin/error-stats')
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching error logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveError = async (logId: string) => {
    try {
      const res = await fetch(`/api/admin/error-logs/${logId}/resolve`, {
        method: 'POST',
      });
      
      if (res.ok) {
        fetchErrorLogs(); // Refresh the list
      }
    } catch (error) {
      console.error('Error resolving log:', error);
    }
  };

  const deleteError = async (logId: string) => {
    try {
      const res = await fetch(`/api/admin/error-logs/${logId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        fetchErrorLogs(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'debug': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle size={16} className="text-red-600" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'info': return <CheckCircle size={16} className="text-blue-600" />;
      case 'debug': return <Activity size={16} className="text-gray-600" />;
      default: return <Activity size={16} className="text-gray-600" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesResolved = resolvedFilter === 'all' || 
                           (resolvedFilter === 'resolved' && log.resolved) ||
                           (resolvedFilter === 'unresolved' && !log.resolved);
    
    return matchesSearch && matchesLevel && matchesResolved;
  });

  const toggleLogSelection = (logId: string) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(logId)) {
      newSelected.delete(logId);
    } else {
      newSelected.add(logId);
    }
    setSelectedLogs(newSelected);
  };

  const selectAllLogs = () => {
    setSelectedLogs(new Set(filteredLogs.map(log => log.id)));
  };

  const clearSelection = () => {
    setSelectedLogs(new Set());
  };

  const exportLogs = () => {
    const csvContent = [
      ['ID', 'Level', 'Message', 'Source', 'User', 'Timestamp', 'Resolved'].join(','),
      ...filteredLogs.map(log => [
        log.id,
        log.level,
        `"${log.message.replace(/"/g, '""')}"`,
        log.source,
        log.userEmail || 'N/A',
        log.timestamp.toISOString(),
        log.resolved ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString().split('T')[0]}.csv`;
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
          Error Logs
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={exportLogs}
            className="bg-secondary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-green-700 transition duration-200 shadow-md flex items-center"
          >
            <Download size={20} className="mr-2" />
            Export CSV
          </button>
          <button
            onClick={fetchErrorLogs}
            disabled={loading}
            className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center disabled:opacity-50"
          >
            <RefreshCw size={20} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <XCircle size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Total Errors</h4>
          <p className="text-2xl font-extrabold text-red-600">{stats.totalErrors.toLocaleString()}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Critical Errors</h4>
          <p className="text-2xl font-extrabold text-yellow-600">{stats.criticalErrors}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Clock size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Unresolved</h4>
          <p className="text-2xl font-extrabold text-orange-600">{stats.unresolvedErrors}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Calendar size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Today</h4>
          <p className="text-2xl font-extrabold text-blue-600">{stats.errorsToday}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Activity size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">This Week</h4>
          <p className="text-2xl font-extrabold text-purple-600">{stats.errorsThisWeek}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Server size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">This Month</h4>
          <p className="text-2xl font-extrabold text-indigo-600">{stats.errorsThisMonth}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
          
          <select
            value={resolvedFilter}
            onChange={(e) => setResolvedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="unresolved">Unresolved</option>
            <option value="resolved">Resolved</option>
          </select>
          
          <div className="flex space-x-2">
            <button
              onClick={selectAllLogs}
              className="text-sm text-primary hover:text-blue-700 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Error Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-lightGray dark:border-gray-700">
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">
            Error Logs ({filteredLogs.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw size={32} className="animate-spin text-primary mx-auto mb-4" />
            <p className="text-mediumGray dark:text-gray-400">Loading error logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">No Errors Found</h4>
            <p className="text-mediumGray dark:text-gray-400">Your system is running smoothly!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
              <thead className="bg-lightGray dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLogs.size === filteredLogs.length && filteredLogs.length > 0}
                      onChange={selectAllLogs}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                {filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLogs.has(log.id)}
                          onChange={() => toggleLogSelection(log.id)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getLevelIcon(log.level)}
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-darkGray dark:text-gray-100 max-w-xs truncate">
                          {log.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-mediumGray dark:text-gray-300">
                          {log.source}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-mediumGray dark:text-gray-300">
                          {log.userEmail || 'System'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-mediumGray dark:text-gray-300">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          log.resolved 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                        }`}>
                          {log.resolved ? 'RESOLVED' : 'UNRESOLVED'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                            className="text-primary hover:text-blue-700 transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          {!log.resolved && (
                            <button
                              onClick={() => resolveError(log.id)}
                              className="text-green-600 hover:text-green-700 transition-colors"
                              title="Mark as Resolved"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteError(log.id)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 bg-lightGray/30 dark:bg-gray-700/30">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold text-darkGray dark:text-gray-100 mb-2">Full Message:</h4>
                              <p className="text-sm text-mediumGray dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border">
                                {log.message}
                              </p>
                            </div>
                            {log.stack && (
                              <div>
                                <h4 className="font-semibold text-darkGray dark:text-gray-100 mb-2">Stack Trace:</h4>
                                <pre className="text-xs text-mediumGray dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border overflow-x-auto">
                                  {log.stack}
                                </pre>
                              </div>
                            )}
                            {log.metadata && (
                              <div>
                                <h4 className="font-semibold text-darkGray dark:text-gray-100 mb-2">Metadata:</h4>
                                <pre className="text-xs text-mediumGray dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.resolved && (
                              <div>
                                <h4 className="font-semibold text-darkGray dark:text-gray-100 mb-2">Resolution Info:</h4>
                                <p className="text-sm text-mediumGray dark:text-gray-300">
                                  Resolved by: {log.resolvedBy || 'System'} on {log.resolvedAt ? new Date(log.resolvedAt).toLocaleString() : 'Unknown'}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
