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
  Eye
} from 'lucide-react';
import Layout from '@/components/layouts/Layout';
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
        setToast({ message: 'Failed to fetch report', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Error fetching report', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (reportType: string) => {
    try {
      const params = new URLSearchParams({
        type: reportType,
        format: 'csv',
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      });

      const response = await fetch(`/api/manufacturing/reports?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setToast({ message: 'Report exported successfully', type: 'success' });
      }
    } catch (error) {
      setToast({ message: 'Failed to export report', type: 'error' });
    }
  };

  const currentReport = reports.find(r => r.reportType === selectedReport);

  const renderOverviewReport = (data: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gradient-to-br from-primary/10 to-primary/20 p-6 rounded-xl shadow-lg border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary">Total Orders</h3>
            <p className="text-3xl font-bold text-darkGray dark:text-gray-100">{data.totalOrders}</p>
          </div>
          <Package className="text-primary" size={32} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-secondary/10 to-secondary/20 p-6 rounded-xl shadow-lg border border-secondary/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-secondary">Completed</h3>
            <p className="text-3xl font-bold text-darkGray dark:text-gray-100">{data.completedOrders}</p>
          </div>
          <TrendingUp className="text-secondary" size={32} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-accent/10 to-accent/20 p-6 rounded-xl shadow-lg border border-accent/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-accent">Total Products</h3>
            <p className="text-3xl font-bold text-darkGray dark:text-gray-100">{data.totalProducts}</p>
          </div>
          <Package className="text-accent" size={32} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/20 p-6 rounded-xl shadow-lg border border-purple-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-purple-600">Completion Rate</h3>
            <p className="text-3xl font-bold text-darkGray dark:text-gray-100">{data.completionRate}%</p>
          </div>
          <BarChart3 className="text-purple-500" size={32} />
        </div>
      </div>
    </div>
  );

  const renderProductionPerformanceReport = (data: any[]) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-darkGray dark:text-gray-100">Production Performance</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cost/Unit</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((order, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-darkGray dark:text-gray-100">
                  {order.orderNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {order.productName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {order.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    order.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  ${order.totalCost.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  ${order.costPerUnit.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMaterialUsageReport = (data: any[]) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-darkGray dark:text-gray-100">Material Usage Analysis</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Material</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Purchased</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Efficiency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Cost</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((material, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-darkGray dark:text-gray-100">
                  {material.materialName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {material.totalUsed}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {material.totalPurchased}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    material.efficiency >= 80 ? 'bg-green-100 text-green-800' :
                    material.efficiency >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {material.efficiency}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  ${material.totalCost.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLaborProductivityReport = (data: any[]) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-darkGray dark:text-gray-100">Labor Productivity</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Hours</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Orders</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Efficiency</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((employee, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-darkGray dark:text-gray-100">
                  {employee.employeeName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {employee.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {employee.totalHours}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {employee.totalOrders}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {employee.efficiency}h/order
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCostAnalysisReport = (data: any) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary/10 to-primary/20 p-6 rounded-xl shadow-lg border border-primary/20">
          <h3 className="text-lg font-semibold text-primary mb-2">Total Material Cost</h3>
          <p className="text-3xl font-bold text-darkGray dark:text-gray-100">
            ${data.totals.totalMaterialCost.toFixed(2)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-secondary/10 to-secondary/20 p-6 rounded-xl shadow-lg border border-secondary/20">
          <h3 className="text-lg font-semibold text-secondary mb-2">Total Labor Cost</h3>
          <p className="text-3xl font-bold text-darkGray dark:text-gray-100">
            ${data.totals.totalLaborCost.toFixed(2)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-accent/10 to-accent/20 p-6 rounded-xl shadow-lg border border-accent/20">
          <h3 className="text-lg font-semibold text-accent mb-2">Average Cost/Unit</h3>
          <p className="text-3xl font-bold text-darkGray dark:text-gray-100">
            ${data.averageCostPerUnit.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-darkGray dark:text-gray-100">Cost Breakdown by Order</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Labor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cost/Unit</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.orders.map((order: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-darkGray dark:text-gray-100">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {order.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    ${order.materialCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    ${order.laborCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    ${order.totalCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    ${order.costPerUnit.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">Manufacturing Reports</h1>
            <p className="text-mediumGray dark:text-gray-400 mt-2">Production analytics and performance insights</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchReport(selectedReport)}
              disabled={loading}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => exportReport(selectedReport)}
              className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-mediumGray dark:text-gray-400" />
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`p-6 rounded-xl shadow-lg border transition-all duration-200 text-left ${
                  selectedReport === report.id
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-xl'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon size={24} className={selectedReport === report.id ? 'text-white' : 'text-primary'} />
                  <h3 className={`font-semibold ${selectedReport === report.id ? 'text-white' : 'text-darkGray dark:text-gray-100'}`}>
                    {report.name}
                  </h3>
                </div>
                <p className={`text-sm ${selectedReport === report.id ? 'text-white/80' : 'text-mediumGray dark:text-gray-400'}`}>
                  {report.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : currentReport ? (
          <div className="space-y-6">
            {selectedReport === 'overview' && renderOverviewReport(currentReport.data)}
            {selectedReport === 'production-performance' && renderProductionPerformanceReport(currentReport.data)}
            {selectedReport === 'material-usage' && renderMaterialUsageReport(currentReport.data)}
            {selectedReport === 'labor-productivity' && renderLaborProductivityReport(currentReport.data)}
            {selectedReport === 'cost-analysis' && renderCostAnalysisReport(currentReport.data)}
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Select a report type to view data</p>
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

