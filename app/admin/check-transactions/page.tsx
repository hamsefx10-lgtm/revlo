// app/admin/check-transactions/page.tsx - Admin page to check transactions and project links
'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../../components/layouts/Layout';
import { 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Database, 
  RefreshCw,
  FileText,
  Users,
  DollarSign,
  Eye,
  XCircle
} from 'lucide-react';
import Toast from '../../../components/common/Toast';

interface TransactionData {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  account: string;
  project: { id: string; name: string } | null;
  customer: { id: string; name: string } | null;
  hasProjectLink: boolean;
}

interface ProjectData {
  id: string;
  name: string;
  customer: string;
  agreementAmount: number;
  advancePaid: number;
  remainingAmount: number;
  incomeTransactions: number;
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
  }>;
}

interface CheckResults {
  summary: {
    totalTransactions: number;
    incomeWithoutProject: number;
    totalProjects: number;
  };
  transactions: TransactionData[];
  incomeWithoutProject: TransactionData[];
  projects: ProjectData[];
}

export default function CheckTransactionsPage() {
  const [results, setResults] = useState<CheckResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const checkTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/check-transactions');
      if (!response.ok) throw new Error('Failed to check transactions');
      const data = await response.json();
      setResults(data);
      setToastMessage({ message: 'Transaction check completed successfully!', type: 'success' });
    } catch (error: any) {
      console.error('Error checking transactions:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka transactions la baarayay.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fixTransactionLinks = async () => {
    setFixing(true);
    try {
      const response = await fetch('/api/admin/fix-transaction-links', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to fix transaction links');
      const data = await response.json();
      setToastMessage({ message: data.message, type: 'success' });
      // Refresh the check after fixing
      await checkTransactions();
    } catch (error: any) {
      console.error('Error fixing transaction links:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka transaction links la saxayay.', type: 'error' });
    } finally {
      setFixing(false);
    }
  };

  useEffect(() => {
    checkTransactions();
  }, []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-darkGray dark:text-gray-100 mb-2">
              Transaction Check
            </h1>
            <p className="text-mediumGray dark:text-gray-400">
              Check existing transactions and their project links
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={checkTransactions}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
              {loading ? 'Checking...' : 'Refresh Check'}
            </button>
            {results && results.summary.incomeWithoutProject > 0 && (
              <button
                onClick={fixTransactionLinks}
                disabled={fixing}
                className="inline-flex items-center gap-2 bg-redError text-white py-2 px-4 rounded-lg font-semibold hover:bg-redError/90 transition-colors disabled:opacity-50"
              >
                {fixing ? <Loader2 className="animate-spin" size={20} /> : <AlertTriangle size={20} />}
                {fixing ? 'Fixing...' : 'Fix Links'}
              </button>
            )}
          </div>
        </div>

        {(loading || fixing) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="ml-3 text-mediumGray">
              {loading ? 'Checking transactions...' : 'Fixing transaction links...'}
            </p>
          </div>
        )}

        {results && !fixing && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                <div className="flex items-center gap-3">
                  <Database className="text-primary" size={24} />
                  <div>
                    <p className="text-sm text-mediumGray">Total Transactions</p>
                    <p className="text-2xl font-bold text-darkGray dark:text-gray-100">
                      {results.summary.totalTransactions}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-redError" size={24} />
                  <div>
                    <p className="text-sm text-mediumGray">Income Without Project</p>
                    <p className="text-2xl font-bold text-redError">
                      {results.summary.incomeWithoutProject}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                <div className="flex items-center gap-3">
                  <Users className="text-secondary" size={24} />
                  <div>
                    <p className="text-sm text-mediumGray">Total Projects</p>
                    <p className="text-2xl font-bold text-darkGray dark:text-gray-100">
                      {results.summary.totalProjects}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Income Transactions Without Project Links */}
            {results.incomeWithoutProject.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-lightGray dark:border-gray-700">
                  <h2 className="text-xl font-bold text-darkGray dark:text-gray-100 flex items-center gap-2">
                    <AlertTriangle className="text-redError" size={24} />
                    Income Transactions Without Project Links
                  </h2>
                  <p className="text-mediumGray dark:text-gray-400 mt-1">
                    These transactions need to be linked to projects
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-lightGray dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                          Account
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                      {results.incomeWithoutProject.map((trx) => (
                        <tr key={trx.id} className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm text-darkGray dark:text-gray-100">
                            {trx.description}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600">
                            +${trx.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-mediumGray">
                            {trx.customer?.name || 'No customer'}
                          </td>
                          <td className="px-4 py-3 text-sm text-mediumGray">
                            {trx.account || 'No account'}
                          </td>
                          <td className="px-4 py-3 text-sm text-mediumGray">
                            {new Date(trx.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-lightGray dark:border-gray-700">
                <h2 className="text-xl font-bold text-darkGray dark:text-gray-100 flex items-center gap-2">
                  <FileText className="text-primary" size={24} />
                  Recent Transactions
                </h2>
                <p className="text-mediumGray dark:text-gray-400 mt-1">
                  Last 20 transactions with their project links
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-lightGray dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                    {results.transactions.map((trx) => (
                      <tr key={trx.id} className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm text-darkGray dark:text-gray-100">
                          {trx.description}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          +${trx.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-mediumGray">
                          {trx.type}
                        </td>
                        <td className="px-4 py-3 text-sm text-mediumGray">
                          {trx.project ? trx.project.name : 'No project'}
                        </td>
                        <td className="px-4 py-3 text-sm text-mediumGray">
                          {trx.customer?.name || 'No customer'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {trx.hasProjectLink ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              <CheckCircle size={12} />
                              Linked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              <XCircle size={12} />
                              Not Linked
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Projects and Their Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-lightGray dark:border-gray-700">
                <h2 className="text-xl font-bold text-darkGray dark:text-gray-100 flex items-center gap-2">
                  <Users className="text-secondary" size={24} />
                  Projects and Their Income Transactions
                </h2>
                <p className="text-mediumGray dark:text-gray-400 mt-1">
                  All projects with their linked income transactions
                </p>
              </div>
              <div className="space-y-4 p-6">
                {results.projects.map((project) => (
                  <div key={project.id} className="border border-lightGray dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100">
                          {project.name}
                        </h3>
                        <p className="text-sm text-mediumGray">Customer: {project.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-mediumGray">Agreement: <span className="font-semibold">${project.agreementAmount.toLocaleString()}</span></p>
                        <p className="text-sm text-mediumGray">Advance: <span className="font-semibold text-green-600">${project.advancePaid.toLocaleString()}</span></p>
                        <p className="text-sm text-mediumGray">Remaining: <span className="font-semibold text-redError">${project.remainingAmount.toLocaleString()}</span></p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-mediumGray">
                        Income Transactions: <span className="font-semibold">{project.incomeTransactions}</span>
                      </p>
                    </div>
                    
                    {project.transactions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-darkGray dark:text-gray-100">Transactions:</h4>
                        {project.transactions.map((trx) => (
                          <div key={trx.id} className="flex justify-between items-center bg-lightGray/50 dark:bg-gray-700/50 p-2 rounded">
                            <div>
                              <p className="text-sm text-darkGray dark:text-gray-100">{trx.description}</p>
                              <p className="text-xs text-mediumGray">{new Date(trx.date).toLocaleDateString()}</p>
                            </div>
                            <p className="text-sm font-semibold text-green-600">+${trx.amount.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {toastMessage && (
          <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
        )}
      </div>
    </Layout>
  );
}
