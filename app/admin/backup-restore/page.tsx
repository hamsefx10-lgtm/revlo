'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import {
  ArrowLeft, Download, Upload, Database, HardDrive, Clock, CheckCircle,
  XCircle, AlertTriangle, RefreshCw, Trash2, Eye, Settings, FileText,
  Calendar, User, Server, Shield, Archive, RotateCcw, Zap
} from 'lucide-react';

interface Backup {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  size: number;
  createdAt: Date;
  status: 'completed' | 'failed' | 'in_progress';
  description: string;
  createdBy: string;
  tables: string[];
  recordCount: number;
}

interface RestoreJob {
  id: string;
  backupId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  progress: number;
  tablesRestored: number;
  totalTables: number;
  recordsRestored: number;
  totalRecords: number;
}

export default function BackupRestorePage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [restoreJobs, setRestoreJobs] = useState<RestoreJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [newBackup, setNewBackup] = useState({
    name: '',
    type: 'full' as 'full' | 'incremental' | 'differential',
    description: '',
    includeTables: [] as string[]
  });

  const { data: backupsData, mutate: mutateBackups } = useSWR('/api/admin/backups', (url) => fetch(url).then(res => res.json()), { refreshInterval: 5000 });
  const { data: restoreJobsData, mutate: mutateRestoreJobs } = useSWR('/api/admin/restore-jobs', (url) => fetch(url).then(res => res.json()), { refreshInterval: 5000 });

  useEffect(() => {
    if (backupsData?.backups) {
      setBackups(backupsData.backups);
    }
    if (restoreJobsData?.jobs) {
      setRestoreJobs(restoreJobsData.jobs);
    }
    if (backupsData || restoreJobsData) {
      setLoading(false);
    }
  }, [backupsData, restoreJobsData]);

  const fetchBackups = () => mutateBackups();
  const fetchRestoreJobs = () => mutateRestoreJobs();


  const createBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBackup)
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewBackup({ name: '', type: 'full', description: '', includeTables: [] });
        fetchBackups();
      }
    } catch (error) {
      console.error('Error creating backup:', error);
    } finally {
      setCreatingBackup(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    setRestoring(backupId);
    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId })
      });

      if (res.ok) {
        setShowRestoreModal(false);
        setSelectedBackup(null);
        fetchRestoreJobs();
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
    } finally {
      setRestoring(null);
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/backups/${backupId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchBackups();
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
    }
  };

  const downloadBackup = async (backupId: string) => {
    try {
      const res = await fetch(`/api/admin/backups/${backupId}/download`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${backupId}.sql`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading backup:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'incremental': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'differential': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const availableTables = [
    'users', 'companies', 'customers', 'projects', 'transactions',
    'expenses', 'invoices', 'payments', 'reports', 'settings'
  ];

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/admin" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Backup & Restore
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center"
          >
            <Database size={20} className="mr-2" />
            Create Backup
          </button>
          <button
            onClick={() => { fetchBackups(); fetchRestoreJobs(); }}
            disabled={loading}
            className="bg-secondary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-green-700 transition duration-200 shadow-md flex items-center disabled:opacity-50"
          >
            <RefreshCw size={20} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Database size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Total Backups</h4>
          <p className="text-2xl font-extrabold text-blue-600">{backups.length}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Successful</h4>
          <p className="text-2xl font-extrabold text-green-600">
            {backups.filter(b => b.status === 'completed').length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <HardDrive size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Total Size</h4>
          <p className="text-2xl font-extrabold text-yellow-600">
            {formatFileSize(backups.reduce((sum, backup) => sum + backup.size, 0))}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <RotateCcw size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Restore Jobs</h4>
          <p className="text-2xl font-extrabold text-purple-600">{restoreJobs.length}</p>
        </div>
      </div>

      {/* Recent Restore Jobs */}
      {restoreJobs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-8">
          <div className="p-6 border-b border-lightGray dark:border-gray-700">
            <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">
              Recent Restore Jobs
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {restoreJobs.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-lightGray dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${getStatusColor(job.status)}`}>
                      {job.status === 'completed' ? <CheckCircle size={20} /> :
                        job.status === 'failed' ? <XCircle size={20} /> :
                          job.status === 'in_progress' ? <RefreshCw size={20} className="animate-spin" /> :
                            <Clock size={20} />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-darkGray dark:text-gray-100">
                        Restore Job {job.id}
                      </h4>
                      <p className="text-sm text-mediumGray dark:text-gray-400">
                        Started: {new Date(job.startedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-darkGray dark:text-gray-100">
                      {job.progress}%
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Backups Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-lightGray dark:border-gray-700">
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">
            Backup History ({backups.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw size={32} className="animate-spin text-primary mx-auto mb-4" />
            <p className="text-mediumGray dark:text-gray-400">Loading backups...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center">
            <Database size={48} className="text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">No Backups Found</h4>
            <p className="text-mediumGray dark:text-gray-400">Create your first backup to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
              <thead className="bg-lightGray dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Created
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
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-darkGray dark:text-gray-100">
                          {backup.name}
                        </div>
                        <div className="text-sm text-mediumGray dark:text-gray-400">
                          {backup.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(backup.type)}`}>
                        {backup.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-darkGray dark:text-gray-100">
                      {formatFileSize(backup.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-darkGray dark:text-gray-100">
                      {backup.recordCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-mediumGray dark:text-gray-300">
                        {new Date(backup.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-mediumGray dark:text-gray-400">
                        by {backup.createdBy}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(backup.status)}`}>
                        {backup.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => downloadBackup(backup.id)}
                          className="text-primary hover:text-blue-700 transition-colors"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => { setSelectedBackup(backup.id); setShowRestoreModal(true); }}
                          disabled={backup.status !== 'completed'}
                          className="text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                          title="Restore"
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button
                          onClick={() => deleteBackup(backup.id)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-lightGray dark:border-gray-700">
              <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">
                Create New Backup
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                  Backup Name
                </label>
                <input
                  type="text"
                  value={newBackup.name}
                  onChange={(e) => setNewBackup({ ...newBackup, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter backup name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                  Backup Type
                </label>
                <select
                  value={newBackup.type}
                  onChange={(e) => setNewBackup({ ...newBackup, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="full">Full Backup</option>
                  <option value="incremental">Incremental Backup</option>
                  <option value="differential">Differential Backup</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                  Description
                </label>
                <textarea
                  value={newBackup.description}
                  onChange={(e) => setNewBackup({ ...newBackup, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                  placeholder="Enter backup description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                  Include Tables
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 dark:border-gray-600">
                  {availableTables.map((table) => (
                    <label key={table} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={newBackup.includeTables.includes(table)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewBackup({ ...newBackup, includeTables: [...newBackup.includeTables, table] });
                          } else {
                            setNewBackup({ ...newBackup, includeTables: newBackup.includeTables.filter(t => t !== table) });
                          }
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-darkGray dark:text-gray-100">{table}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-lightGray dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createBackup}
                disabled={creatingBackup || !newBackup.name}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {creatingBackup ? (
                  <RefreshCw size={16} className="animate-spin mr-2" />
                ) : (
                  <Database size={16} className="mr-2" />
                )}
                Create Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-lightGray dark:border-gray-700">
              <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">
                Restore Backup
              </h3>
            </div>
            <div className="p-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <AlertTriangle size={20} className="text-yellow-600 mr-2" />
                  <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Warning: This will overwrite existing data!
                  </span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                  Make sure you have a current backup before proceeding with the restore operation.
                </p>
              </div>
              <p className="text-mediumGray dark:text-gray-400">
                Are you sure you want to restore this backup? This action cannot be undone.
              </p>
            </div>
            <div className="p-6 border-t border-lightGray dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => { setShowRestoreModal(false); setSelectedBackup(null); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => restoreBackup(selectedBackup)}
                disabled={restoring === selectedBackup}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {restoring === selectedBackup ? (
                  <RefreshCw size={16} className="animate-spin mr-2" />
                ) : (
                  <RotateCcw size={16} className="mr-2" />
                )}
                Restore Backup
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
