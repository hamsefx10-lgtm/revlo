/**
 * Telegram Expenses Approval Page
 * Review and approve/reject expenses from Telegram
 */

'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layouts/Layout';
import { 
  CheckCircle, XCircle, Edit, RefreshCw, Loader2, 
  MessageSquare, User, Calendar, DollarSign, Briefcase,
  AlertCircle, Check, X, Tag
} from 'lucide-react';
import Toast from '@/components/common/Toast';

interface PendingExpense {
  id: string;
  telegramMessageId?: string;
  telegramChatId?: string;
  telegramSenderName?: string;
  originalMessage: string;
  parsedData: {
    projectName?: string;
    amount?: number;
    category?: string;
    description?: string;
    accountNumber?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedAt?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export default function TelegramExpensesPage() {
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {
    fetchPendingExpenses();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingExpenses, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchPendingExpenses = async () => {
    try {
      const url = filter === 'ALL' 
        ? '/api/telegram-expenses'
        : `/api/telegram-expenses?status=${filter}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPendingExpenses(data.pendingExpenses || []);
      }
    } catch (error) {
      console.error('Error fetching pending expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, projectId?: string, accountId?: string) => {
    setProcessing(id);
    try {
      const response = await fetch(`/api/telegram-expenses/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, accountId }),
      });

      if (response.ok) {
        setToast({ message: 'Kharashka waa la aqbalay!', type: 'success' });
        fetchPendingExpenses();
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Cilad ayaa dhacday', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Cilad ayaa dhacday', type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    setProcessing(id);
    try {
      const response = await fetch(`/api/telegram-expenses/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        setToast({ message: 'Kharashka waa la diiday', type: 'success' });
        fetchPendingExpenses();
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Cilad ayaa dhacday', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Cilad ayaa dhacday', type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const handleEdit = (expense: PendingExpense) => {
    setEditingId(expense.id);
    setEditData({ ...expense.parsedData });
  };

  const handleSaveEdit = async (id: string) => {
    // Update the pending expense with edited data
    // This would require a PUT endpoint
    setEditingId(null);
    setEditData(null);
    fetchPendingExpenses();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-50';
      case 'REJECTED': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Kharashyada Telegram-ka
          </h1>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {status === 'ALL' ? 'Dhammaan' : 
                 status === 'PENDING' ? 'La sugayo' :
                 status === 'APPROVED' ? 'La aqbalay' : 'La diiday'}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchPendingExpenses}
            className="mb-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Cusboonaysii
          </button>
        </div>

        {/* Expenses List */}
        {pendingExpenses.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Ma jiro kharash la sugayo</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingExpenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${getStatusColor(expense.status)}`}>
                      {getStatusIcon(expense.status)}
                      <span className="text-sm font-medium">
                        {expense.status === 'PENDING' ? 'La sugayo' :
                         expense.status === 'APPROVED' ? 'La aqbalay' : 'La diiday'}
                      </span>
                    </div>
                    {expense.telegramSenderName && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4" />
                        {expense.telegramSenderName}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(expense.createdAt).toLocaleDateString('so-SO')}
                    </div>
                  </div>
                </div>

                {/* Original Message */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 mt-1 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fariinta Asalka:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {expense.originalMessage}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parsed Data */}
                {editingId === expense.id ? (
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Magaca Mashruuca</label>
                      <input
                        type="text"
                        value={editData.projectName || ''}
                        onChange={(e) => setEditData({ ...editData, projectName: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Lacagta</label>
                      <input
                        type="number"
                        value={editData.amount || ''}
                        onChange={(e) => setEditData({ ...editData, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <input
                        type="text"
                        value={editData.category || ''}
                        onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Sharaxaada</label>
                      <textarea
                        value={editData.description || ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(expense.id)}
                        className="px-4 py-2 bg-primary text-white rounded-lg"
                      >
                        Kaydi
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditData(null);
                        }}
                        className="px-4 py-2 bg-gray-200 rounded-lg"
                      >
                        Jooji
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {expense.parsedData.projectName && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Mashruuc</p>
                          <p className="font-medium">{expense.parsedData.projectName}</p>
                        </div>
                      </div>
                    )}
                    {expense.parsedData.amount && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Lacagta</p>
                          <p className="font-medium">${expense.parsedData.amount.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {expense.parsedData.category && (
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Category</p>
                          <p className="font-medium">{expense.parsedData.category}</p>
                        </div>
                      </div>
                    )}
                    {expense.parsedData.description && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Sharaxaada</p>
                        <p className="text-sm">{expense.parsedData.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {expense.status === 'PENDING' && editingId !== expense.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(expense.id)}
                      disabled={processing === expense.id}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processing === expense.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Aqbal
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(expense)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Wax ka beddel
                    </button>
                    <button
                      onClick={() => handleReject(expense.id)}
                      disabled={processing === expense.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {processing === expense.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          Diid
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Layout>
  );
}

