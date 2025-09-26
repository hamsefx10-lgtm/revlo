// app/reports/scheduled/page.tsx - Scheduled Reports Management
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, Plus, Edit, Trash2, Play, Pause, Clock, 
  Mail, Calendar, Settings, CheckCircle, XCircle, Info
} from 'lucide-react';

interface ScheduledReport {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  reportType: 'overview' | 'profit-loss' | 'expenses' | 'debts' | 'custom';
  emailRecipients: string[];
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  createdAt: string;
}

export default function ScheduledReportsPage() {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'daily' as const,
    reportType: 'overview' as const,
    emailRecipients: [] as string[],
    enabled: true
  });

  // Load scheduled reports
  useEffect(() => {
    fetchScheduledReports();
  }, []);

  const fetchScheduledReports = async () => {
    try {
      const response = await fetch('/api/reports/scheduled');
      if (response.ok) {
        const data = await response.json();
        setReports(data.scheduledReports || []);
      }
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingReport 
        ? `/api/reports/scheduled/${editingReport.id}`
        : '/api/reports/scheduled';
      
      const method = editingReport ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchScheduledReports();
        resetForm();
      } else {
        const error = await response.json();
        alert(error.message || 'Error saving scheduled report');
      }
    } catch (error) {
      console.error('Error saving scheduled report:', error);
      alert('Error saving scheduled report');
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/scheduled/${reportId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchScheduledReports();
      } else {
        const error = await response.json();
        alert(error.message || 'Error deleting scheduled report');
      }
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      alert('Error deleting scheduled report');
    }
  };

  const toggleEnabled = async (reportId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/reports/scheduled/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        await fetchScheduledReports();
      }
    } catch (error) {
      console.error('Error toggling report status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'daily',
      reportType: 'overview',
      emailRecipients: [],
      enabled: true
    });
    setShowForm(false);
    setEditingReport(null);
  };

  const editReport = (report: ScheduledReport) => {
    setFormData({
      name: report.name,
      type: report.type,
      reportType: report.reportType,
      emailRecipients: report.emailRecipients,
      enabled: report.enabled
    });
    setEditingReport(report);
    setShowForm(true);
  };

  const addEmail = () => {
    const email = prompt('Enter email address:');
    if (email && email.includes('@')) {
      setFormData(prev => ({
        ...prev,
        emailRecipients: [...prev.emailRecipients, email]
      }));
    }
  };

  const removeEmail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emailRecipients: prev.emailRecipients.filter((_, i) => i !== index)
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      daily: 'Maalinlaha',
      weekly: 'Usbuuclaha',
      monthly: 'Bishii',
      quarterly: 'Rubuc',
      yearly: 'Sanadlaha'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getReportTypeLabel = (type: string) => {
    const labels = {
      overview: 'Overview',
      'profit-loss': 'Profit & Loss',
      expenses: 'Expenses',
      debts: 'Debts',
      custom: 'Custom'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin mr-3">
            <Settings size={32} className="text-primary" />
          </div>
          <span className="text-lg text-darkGray dark:text-gray-100">Loading scheduled reports...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
            <Link href="/reports" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
              <ArrowLeft size={28} className="inline-block" />
            </Link>
            Scheduled Reports
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center"
          >
            <Plus className="mr-2" size={20} /> Schedule New Report
          </button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md mb-8">
            <h2 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6">
              {editingReport ? 'Edit Scheduled Report' : 'Schedule New Report'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-mediumGray dark:text-gray-400 mb-2">
                    Report Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100"
                    placeholder="Enter report name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-mediumGray dark:text-gray-400 mb-2">
                    Frequency *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100"
                    required
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-mediumGray dark:text-gray-400 mb-2">
                  Report Type *
                </label>
                <select
                  value={formData.reportType}
                  onChange={(e) => setFormData(prev => ({ ...prev, reportType: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100"
                  required
                >
                  <option value="overview">Overview</option>
                  <option value="profit-loss">Profit & Loss</option>
                  <option value="expenses">Expenses</option>
                  <option value="debts">Debts</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-mediumGray dark:text-gray-400 mb-2">
                  Email Recipients *
                </label>
                <div className="space-y-2">
                  {formData.emailRecipients.map((email, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="flex-1 px-3 py-2 bg-lightGray dark:bg-gray-700 rounded-lg text-darkGray dark:text-gray-100">
                        {email}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEmail(index)}
                        className="text-redError hover:text-red-700 transition duration-200"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEmail}
                    className="bg-secondary text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-600 transition duration-200 flex items-center"
                  >
                    <Plus className="mr-2" size={16} /> Add Email
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="enabled" className="text-sm font-medium text-mediumGray dark:text-gray-400">
                  Enable this scheduled report
                </label>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white py-2 px-6 rounded-lg font-semibold hover:bg-gray-600 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 flex items-center"
                >
                  <CheckCircle className="mr-2" size={16} /> Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Scheduled Reports List */}
        <div className="grid grid-cols-1 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-darkGray dark:text-gray-100 mb-2">
                    {report.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-mediumGray dark:text-gray-400">
                    <span className="flex items-center">
                      <Calendar className="mr-1" size={16} />
                      {getTypeLabel(report.type)}
                    </span>
                    <span className="flex items-center">
                      <Settings className="mr-1" size={16} />
                      {getReportTypeLabel(report.reportType)}
                    </span>
                    <span className="flex items-center">
                      <Mail className="mr-1" size={16} />
                      {report.emailRecipients.length} recipient(s)
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleEnabled(report.id, !report.enabled)}
                    className={`p-2 rounded-lg transition duration-200 ${
                      report.enabled 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {report.enabled ? <Play size={16} /> : <Pause size={16} />}
                  </button>
                  <button
                    onClick={() => editReport(report)}
                    className="p-2 text-primary hover:text-blue-700 transition duration-200"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
                    className="p-2 text-redError hover:text-red-700 transition duration-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-mediumGray dark:text-gray-400">Next Run:</span>
                  <p className="text-darkGray dark:text-gray-100 font-semibold">
                    {formatDate(report.nextRun)}
                  </p>
                </div>
                {report.lastRun && (
                  <div>
                    <span className="text-mediumGray dark:text-gray-400">Last Run:</span>
                    <p className="text-darkGray dark:text-gray-100 font-semibold">
                      {formatDate(report.lastRun)}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-mediumGray dark:text-gray-400">Status:</span>
                  <p className={`font-semibold ${report.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                    {report.enabled ? 'Active' : 'Paused'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {reports.length === 0 && !showForm && (
          <div className="text-center py-12">
            <Clock size={64} className="mx-auto text-mediumGray dark:text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-2">No Scheduled Reports</h3>
            <p className="text-mediumGray dark:text-gray-400 mb-6">Create your first scheduled report to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center mx-auto"
            >
              <Plus className="mr-2" size={20} /> Schedule Report
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
