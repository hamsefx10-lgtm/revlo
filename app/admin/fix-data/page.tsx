'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import { 
  ArrowLeft, Database, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  FileText, Users, Briefcase, DollarSign, Settings, Zap, Target,
  Search, Filter, Calendar, Download, Upload, Trash2, Edit, Eye
} from 'lucide-react';

interface DataIssue {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedRecords: number;
  status: 'pending' | 'fixed' | 'ignored';
  createdAt: Date;
  fixedAt?: Date;
}

interface FixResult {
  success: boolean;
  message: string;
  affectedRecords: number;
}

export default function FixDataPage() {
  const [issues, setIssues] = useState<DataIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDataIssues();
  }, []);

  const fetchDataIssues = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data-issues');
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
      } else {
        setToastMessage({ message: 'Failed to fetch data issues', type: 'error' });
      }
    } catch (error) {
      setToastMessage({ message: 'Error fetching data issues', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fixIssue = async (issueId: string) => {
    setFixing(issueId);
    try {
      const res = await fetch(`/api/admin/fix-data/${issueId}`, {
        method: 'POST',
      });
      const result: FixResult = await res.json();
      
      if (res.ok && result.success) {
        setToastMessage({ 
          message: `Fixed ${result.affectedRecords} records successfully`, 
          type: 'success' 
        });
        fetchDataIssues(); // Refresh the list
      } else {
        setToastMessage({ 
          message: result.message || 'Failed to fix issue', 
          type: 'error' 
        });
      }
    } catch (error) {
      setToastMessage({ message: 'Error fixing issue', type: 'error' });
    } finally {
      setFixing(null);
    }
  };

  const fixSelectedIssues = async () => {
    if (selectedIssues.size === 0) return;
    
    setFixing('bulk');
    try {
      const res = await fetch('/api/admin/fix-data/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueIds: Array.from(selectedIssues) }),
      });
      const result = await res.json();
      
      if (res.ok && result.success) {
      setToastMessage({ 
          message: `Fixed ${result.totalFixed} issues successfully`, 
        type: 'success' 
      });
        setSelectedIssues(new Set());
        fetchDataIssues();
      } else {
      setToastMessage({ 
          message: result.message || 'Failed to fix selected issues', 
        type: 'error' 
      });
      }
    } catch (error) {
      setToastMessage({ message: 'Error fixing selected issues', type: 'error' });
    } finally {
      setFixing(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fixed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'ignored': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const toggleIssueSelection = (issueId: string) => {
    const newSelected = new Set(selectedIssues);
    if (newSelected.has(issueId)) {
      newSelected.delete(issueId);
    } else {
      newSelected.add(issueId);
    }
    setSelectedIssues(newSelected);
  };

  const selectAllIssues = () => {
    const pendingIssues = issues.filter(issue => issue.status === 'pending');
    setSelectedIssues(new Set(pendingIssues.map(issue => issue.id)));
  };

  const clearSelection = () => {
    setSelectedIssues(new Set());
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/admin" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Fix Data Issues
          </h1>
        <div className="flex space-x-3">
          <button
            onClick={fetchDataIssues}
            disabled={loading}
            className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center disabled:opacity-50"
          >
            <RefreshCw size={20} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        </div>

            {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle size={32} />
                </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Critical Issues</h4>
          <p className="text-2xl font-extrabold text-red-600">
            {issues.filter(i => i.severity === 'critical' && i.status === 'pending').length}
                </p>
              </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <FileText size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Total Issues</h4>
          <p className="text-2xl font-extrabold text-yellow-600">{issues.length}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle size={32} />
                </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Fixed Issues</h4>
          <p className="text-2xl font-extrabold text-green-600">
            {issues.filter(i => i.status === 'fixed').length}
                </p>
              </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Database size={32} />
                </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Affected Records</h4>
          <p className="text-2xl font-extrabold text-blue-600">
            {issues.reduce((sum, issue) => sum + issue.affectedRecords, 0).toLocaleString()}
                </p>
              </div>
            </div>

      {/* Bulk Actions */}
      {selectedIssues.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle size={20} className="text-blue-600 mr-2" />
              <span className="text-blue-800 dark:text-blue-200 font-medium">
                {selectedIssues.size} issue(s) selected
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={fixSelectedIssues}
                disabled={fixing === 'bulk'}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                <Zap size={16} className="mr-2" />
                Fix Selected
              </button>
              <button
                onClick={clearSelection}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issues Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-lightGray dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">
              Data Issues ({issues.length})
                </h3>
            <div className="flex space-x-2">
              <button
                onClick={selectAllIssues}
                className="text-sm text-primary hover:text-blue-700 transition-colors"
              >
                Select All Pending
              </button>
              <button
                onClick={clearSelection}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw size={32} className="animate-spin text-primary mx-auto mb-4" />
            <p className="text-mediumGray dark:text-gray-400">Loading data issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">No Issues Found</h4>
            <p className="text-mediumGray dark:text-gray-400">Your data is clean and healthy!</p>
          </div>
        ) : (
                <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
              <thead className="bg-lightGray dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIssues.size === issues.filter(i => i.status === 'pending').length && issues.filter(i => i.status === 'pending').length > 0}
                      onChange={selectAllIssues}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Issue Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Affected Records
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                      </tr>
                    </thead>
              <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIssues.has(issue.id)}
                        onChange={() => toggleIssueSelection(issue.id)}
                        disabled={issue.status !== 'pending'}
                        className="rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-darkGray dark:text-gray-100">
                        {issue.type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-mediumGray dark:text-gray-300 max-w-xs truncate">
                        {issue.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(issue.severity)}`}>
                        {issue.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-darkGray dark:text-gray-100">
                      {issue.affectedRecords.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(issue.status)}`}>
                        {issue.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-mediumGray dark:text-gray-300">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {issue.status === 'pending' ? (
                        <button
                          onClick={() => fixIssue(issue.id)}
                          disabled={fixing === issue.id}
                          className="bg-primary text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm flex items-center mx-auto"
                        >
                          {fixing === issue.id ? (
                            <RefreshCw size={14} className="animate-spin mr-1" />
                          ) : (
                            <Zap size={14} className="mr-1" />
                          )}
                          Fix
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500">Fixed</span>
                      )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
          </div>
        )}
      </div>

      {/* Toast Message */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          toastMessage.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            {toastMessage.type === 'success' ? (
              <CheckCircle size={20} className="mr-2" />
            ) : (
              <XCircle size={20} className="mr-2" />
            )}
            {toastMessage.message}
          </div>
        </div>
      )}
    </Layout>
  );
}
