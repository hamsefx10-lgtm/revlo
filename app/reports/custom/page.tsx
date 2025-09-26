// app/reports/custom/page.tsx - Custom Report Builder
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, Plus, Save, Download, Eye, Trash2, Edit, 
  Calendar, Filter, BarChart, PieChart, LineChart, 
  FileText, Settings, CheckCircle, XCircle, Info
} from 'lucide-react';

interface ReportField {
  id: string;
  name: string;
  type: 'number' | 'text' | 'date' | 'boolean';
  label: string;
  required: boolean;
  options?: string[];
}

interface CustomReport {
  id: string;
  name: string;
  description: string;
  fields: ReportField[];
  filters: any[];
  chartType: 'bar' | 'pie' | 'line' | 'table';
  createdAt: string;
  updatedAt: string;
}

export default function CustomReportBuilderPage() {
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingReport, setEditingReport] = useState<CustomReport | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [] as ReportField[],
    filters: [] as any[],
    chartType: 'table' as 'bar' | 'pie' | 'line' | 'table'
  });

  // Load saved reports
  useEffect(() => {
    const savedReports = localStorage.getItem('customReports');
    if (savedReports) {
      setReports(JSON.parse(savedReports));
    }
  }, []);

  // Save reports to localStorage
  const saveReports = (newReports: CustomReport[]) => {
    localStorage.setItem('customReports', JSON.stringify(newReports));
    setReports(newReports);
  };

  // Add new field
  const addField = () => {
    const newField: ReportField = {
      id: `field_${Date.now()}`,
      name: '',
      type: 'text',
      label: '',
      required: false
    };
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  // Update field
  const updateField = (fieldId: string, updates: Partial<ReportField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  // Remove field
  const removeField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  };

  // Save report
  const saveReport = () => {
    if (!formData.name.trim()) {
      alert('Please enter a report name');
      return;
    }

    const report: CustomReport = {
      id: editingReport?.id || `report_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      fields: formData.fields,
      filters: formData.filters,
      chartType: formData.chartType,
      createdAt: editingReport?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let newReports;
    if (editingReport) {
      newReports = reports.map(r => r.id === editingReport.id ? report : r);
    } else {
      newReports = [...reports, report];
    }

    saveReports(newReports);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      fields: [],
      filters: [],
      chartType: 'table'
    });
    setShowBuilder(false);
    setEditingReport(null);
  };

  // Edit report
  const editReport = (report: CustomReport) => {
    setFormData({
      name: report.name,
      description: report.description,
      fields: report.fields,
      filters: report.filters,
      chartType: report.chartType
    });
    setEditingReport(report);
    setShowBuilder(true);
  };

  // Delete report
  const deleteReport = (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      const newReports = reports.filter(r => r.id !== reportId);
      saveReports(newReports);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
            <Link href="/reports" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
              <ArrowLeft size={28} className="inline-block" />
            </Link>
            Custom Report Builder
          </h1>
          <button
            onClick={() => setShowBuilder(true)}
            className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center"
          >
            <Plus className="mr-2" size={20} /> Create New Report
          </button>
        </div>

        {showBuilder ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md mb-8">
            <h2 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6">
              {editingReport ? 'Edit Report' : 'Create New Report'}
            </h2>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-mediumGray dark:text-gray-400 mb-2">
                  Chart Type
                </label>
                <select
                  value={formData.chartType}
                  onChange={(e) => setFormData(prev => ({ ...prev, chartType: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100"
                >
                  <option value="table">Table</option>
                  <option value="bar">Bar Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="line">Line Chart</option>
                </select>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-mediumGray dark:text-gray-400 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100"
                rows={3}
                placeholder="Enter report description"
              />
            </div>

            {/* Fields */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">Report Fields</h3>
                <button
                  onClick={addField}
                  className="bg-secondary text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-600 transition duration-200 flex items-center"
                >
                  <Plus className="mr-2" size={16} /> Add Field
                </button>
              </div>

              <div className="space-y-4">
                {formData.fields.map((field, index) => (
                  <div key={field.id} className="bg-lightGray dark:bg-gray-700 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-mediumGray dark:text-gray-400 mb-1">
                          Field Name
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(field.id, { name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100"
                          placeholder="e.g., amount, date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-mediumGray dark:text-gray-400 mb-1">
                          Label
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100"
                          placeholder="e.g., Amount, Date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-mediumGray dark:text-gray-400 mb-1">
                          Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="boolean">Boolean</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => removeField(field.id)}
                          className="bg-redError text-white py-2 px-3 rounded-lg hover:bg-red-700 transition duration-200 flex items-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={resetForm}
                className="bg-gray-500 text-white py-2 px-6 rounded-lg font-semibold hover:bg-gray-600 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={saveReport}
                className="bg-primary text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 flex items-center"
              >
                <Save className="mr-2" size={16} /> Save Report
              </button>
            </div>
          </div>
        ) : null}

        {/* Saved Reports */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-darkGray dark:text-gray-100">{report.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => editReport(report)}
                    className="text-primary hover:text-blue-700 transition duration-200"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deleteReport(report.id)}
                    className="text-redError hover:text-red-700 transition duration-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <p className="text-mediumGray dark:text-gray-400 mb-4">{report.description}</p>
              
              <div className="flex items-center justify-between text-sm text-mediumGray dark:text-gray-400 mb-4">
                <span>{report.fields.length} fields</span>
                <span>{report.chartType}</span>
              </div>
              
              <div className="flex space-x-2">
                <button className="bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 flex items-center flex-1 justify-center">
                  <Eye className="mr-2" size={16} /> View
                </button>
                <button className="bg-secondary text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-600 transition duration-200 flex items-center flex-1 justify-center">
                  <Download className="mr-2" size={16} /> Export
                </button>
              </div>
            </div>
          ))}
        </div>

        {reports.length === 0 && !showBuilder && (
          <div className="text-center py-12">
            <FileText size={64} className="mx-auto text-mediumGray dark:text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-2">No Custom Reports</h3>
            <p className="text-mediumGray dark:text-gray-400 mb-6">Create your first custom report to get started</p>
            <button
              onClick={() => setShowBuilder(true)}
              className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center mx-auto"
            >
              <Plus className="mr-2" size={20} /> Create Report
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
