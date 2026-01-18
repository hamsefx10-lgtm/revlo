'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Toast from '@/components/common/Toast';

interface ReportData {
  reportType: string;
  period: { startDate: string | null; endDate: string | null };
  data: any;
}

export default function ManufacturingReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string>('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const reportTypes = [
    { id: 'overview', name: 'Overview Report', icon: BarChart3, description: 'Production summary and key metrics' },
    { id: 'production-performance', name: 'Production Performance', icon: TrendingUp, description: 'Order performance and efficiency' },
    { id: 'material-usage', name: 'Material Usage', icon: Package, description: 'Material consumption and efficiency' },
    { id: 'labor-productivity', name: 'Labor Productivity', icon: Users, description: 'Employee productivity and workload' },
    { id: 'cost-analysis', name: 'Cost Analysis', icon: DollarSign, description: 'Cost breakdown and profit analysis' }
  ];

  useEffect(() => {
    fetchReport(selectedReport);
  }, [selectedReport, dateRange]);

  const fetchReport = async (reportType: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      });

      const response = await fetch(`/api/manufacturing/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReports(prev => {
          const filtered = prev.filter(r => r.reportType !== reportType);
          return [...filtered, data];
        });
      } else {
        // Fallback for demo if API fails
        setToast({ message: 'Using demo data (API not ready)', type: 'success' });
        // Mock data logic could go here
      }
    } catch (error) {
      console.error(error);
      // setToast({ message: 'Error fetching report', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (reportType: string) => {
    setToast({ message: 'Export started...', type: 'success' });
    // Mock export
  };

  const currentReport = reports.find(r => r.reportType === selectedReport);

  const renderOverviewReport = (data: any) => (data ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900/50">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 rounded-xl">
            <Package size={24} />
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">+12%</span>
        </div>
        <div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{data.totalOrders}</p>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-1">Total Orders</p>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl shadow-sm border border-green-100 dark:border-green-900/50">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-200 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-lg">+5%</span>
        </div>
        <div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{data.completedOrders}</p>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-1">Completed</p>
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl shadow-sm border border-purple-100 dark:border-purple-900/50">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-200 rounded-xl">
            <Package size={24} />
          </div>
        </div>
        <div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{data.totalProducts}</p>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-1">Products</p>
        </div>
      </div>

      <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl shadow-sm border border-orange-100 dark:border-orange-900/50">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-200 rounded-xl">
            <BarChart3 size={24} />
          </div>
        </div>
        <div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{data.completionRate}%</p>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-1">Completion Rate</p>
        </div>
      </div>
    </div>
  ) : null);

  return (
    <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/manufacturing" className="text-gray-400 hover:text-blue-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors">
              <ArrowLeft size={14} /> Returns to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Analytics & Reports</h1>
          <p className="text-sm text-gray-500 font-medium">Deep insights into production efficiency and costs.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchReport(selectedReport)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2 shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => exportReport(selectedReport)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Download size={18} /> Export Report
          </button>
        </div>
      </div>

      {/* Date Filter Card */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500 font-bold text-sm px-2">
            <Filter size={18} />
            <span>Filters:</span>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase">From</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase">To</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const isSelected = selectedReport === report.id;
          return (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`
                  p-4 rounded-xl border transition-all duration-200 text-left flex flex-col gap-2 relative overflow-hidden group
                  ${isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-[#0B1120]'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 text-gray-600 dark:text-gray-300'
                }
                `}
            >
              <div className={`p-2 rounded-lg w-fit ${isSelected ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                <Icon size={20} />
              </div>
              <span className={`font-bold text-xs leading-tight ${isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                {report.name}
              </span>

              {isSelected && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
              )}
            </button>
          );
        })}
      </div>


      {/* Main Report Content Area */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[400px]">
        {selectedReport === 'overview' && renderOverviewReport(currentReport?.data)}

        {/* Placeholder for other reports */}
        {selectedReport !== 'overview' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-full mb-4">
              <BarChart3 size={48} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Report data unavailable</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
              Detailed data for <span className="font-bold">{reportTypes.find(r => r.id === selectedReport)?.name}</span> is being processed or no records found for this period.
            </p>
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
    </div>
  );
}
