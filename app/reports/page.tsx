// app/reports/page.tsx - Reports Overview (10000% Design - Global Standard)
'use client';

import React from 'react';
import Link from 'next/link';
import Layout from '../../components/layouts/Layout';
import { useCurrency } from '../../contexts/CurrencyContext';
import {
  ArrowLeft, LineChart, DollarSign, Warehouse, Scale, CreditCard, Banknote, CalendarCheck, FileText, Plus, ArrowRight,
  Activity, TrendingUp, TrendingDown, Briefcase, Building, Users, Clock, Download, Share2, Printer, Mail, MessageSquare, Send, Bell, XCircle, Info, PlayCircle, Settings, Factory, PieChart, BarChart3, Eye // New icons for sharing
} from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

// --- API-driven Data States ---
import { useState, useEffect } from 'react';

interface OverviewStats {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  realizedProfit?: number; // Faa'iidada dhabta ah (from completed projects only)
  paymentsFromCompletedProjects?: number; // Payments received from completed projects
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  companyExpenses: number;
  projectExpenses: number;
  outstandingDebts: number;
  receivableDebts: number;
  fixedAssetsValue: number;
  totalBankBalance: number;
  totalCashBalance: number;
  shareholdersEquity: number;
}
interface ProjectPerformanceItem { month: string; started: number; completed: number; }
interface DailyReport {
  date: string;
  todayIncome: number;
  todayExpenses: number;
  todayNetFlow: number;
  newTransactions: number;
  projectsStartedToday: number;
  projectsCompletedToday: number;
  newUsersToday: number;
}
interface ProjectFinancialReport {
  id: string;
  name: string;
  status: string;
  customer: string;
  startDate: string;
  expectedCompletionDate: string;
  actualCompletionDate: string;
  projectValue: number;
  totalRevenue: number;
  totalPayments: number;
  remainingRevenue: number;
  materialCosts: number;
  laborCosts: number;
  transportCosts: number;
  equipmentCosts: number;
  utilitiesCosts: number;
  consultancyCosts: number;
  totalExpenses: number;
  grossProfit: number;
  profitMargin: number;
  completionPercentage: number;
  expenseCount: number;
  transactionCount: number;
  paymentCount: number;
}
interface ProjectReportsSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  averageProfitMargin: number;
}

export default function ReportsOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [projectPerformance, setProjectPerformance] = useState<ProjectPerformanceItem[]>([]);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [projectReports, setProjectReports] = useState<ProjectFinancialReport[]>([]);
  const [projectSummary, setProjectSummary] = useState<ProjectReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProjectViews, setShowProjectViews] = useState(false);
  const [planType, setPlanType] = useState<string>('COMBINED');
  const { formatCurrency } = useCurrency();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch plan type
  useEffect(() => {
    const fetchPlanType = async () => {
      try {
        const response = await fetch('/api/company/plan-type');
        const data = await response.json();
        setPlanType(data.planType || 'COMBINED');
      } catch (error) {
        setPlanType('COMBINED');
      }
    };
    fetchPlanType();
  }, []);

  // Export functions
  const exportToPDF = () => {
    // Simple PDF export using browser print
    window.print();
  };

  const exportToExcel = () => {
    if (!stats || !dailyReport) return;

    const data = [
      ['Report Type', 'Value'],
      ['Total Income', formatCurrency(stats.totalIncome || 0)],
      ['Total Expenses', formatCurrency(stats.totalExpenses || 0)],
      ['Faa\'iidada Mashaariicda Dhammaystiran', formatCurrency(stats.netProfit || 0)],
      ['Total Projects', stats.totalProjects],
      ['Active Projects', stats.activeProjects],
      ['Completed Projects', stats.completedProjects],
      ['Today Income', formatCurrency(dailyReport.todayIncome || 0)],
      ['Today Expenses', formatCurrency(dailyReport.todayExpenses || 0)],
      ['Today Net Flow', formatCurrency(dailyReport.todayNetFlow || 0)],
    ];

    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reports-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToCSV = () => {
    if (!stats || !dailyReport) return;

    const data = [
      ['Metric', 'Value', 'Date'],
      ['Total Income', stats.totalIncome, new Date().toISOString().split('T')[0]],
      ['Total Expenses', stats.totalExpenses, new Date().toISOString().split('T')[0]],
      ['Faa\'iidada Mashaariicda Dhammaystiran', stats.netProfit, new Date().toISOString().split('T')[0]],
      ['Total Projects', stats.totalProjects, new Date().toISOString().split('T')[0]],
      ['Active Projects', stats.activeProjects, new Date().toISOString().split('T')[0]],
      ['Completed Projects', stats.completedProjects, new Date().toISOString().split('T')[0]],
      ['Today Income', dailyReport.todayIncome, dailyReport.date],
      ['Today Expenses', dailyReport.todayExpenses, dailyReport.date],
      ['Today Net Flow', dailyReport.todayNetFlow, dailyReport.date],
    ];

    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reports-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const projectReportsUrl = `/api/accounting/reports/projects?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
        const [statsRes, perfRes, dailyRes, projectRes] = await Promise.all([
          fetch('/api/accounting/reports/overview'),
          fetch('/api/accounting/reports/project-performance'),
          fetch('/api/accounting/reports/daily'),
          fetch(projectReportsUrl),
        ]);
        if (!statsRes.ok) throw new Error('Failed to fetch overview stats');
        if (!perfRes.ok) throw new Error('Failed to fetch project performance');
        if (!dailyRes.ok) throw new Error('Failed to fetch daily report');
        const statsData = await statsRes.json();
        const perfData = await perfRes.json();
        const dailyData = await dailyRes.json();
        setStats(statsData.stats || statsData);
        setProjectPerformance(perfData.performance || perfData);
        setDailyReport(dailyData.dailyReport || dailyData);

        // Fetch project financial reports
        if (projectRes.ok) {
          const projectData = await projectRes.json();
          setProjectReports(projectData.projects || []);
          setProjectSummary(projectData.summary || null);
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching reports data');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [dateRange]);

  // --- Main Reports Overview Page Component ---
  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[400px] text-darkGray dark:text-gray-100">
        <span className="animate-spin mr-3"><DollarSign size={32} className="text-primary" /></span> Warbixinada ayaa soo dhacaya...
      </div>
    </Layout>
  );
  if (error) return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle size={32} className="mb-2 text-redError" />
        <div className="text-redError text-lg font-bold mb-2">{error}</div>
        <button onClick={() => window.location.reload()} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold mt-2">Reload</button>
      </div>
    </Layout>
  );
  if (!stats || !dailyReport) { return null; }

  return (
    <Layout>
      {/* Mobile-Optimized Header */}
      <div className="mb-6 md:mb-8">
        {/* Mobile Header - Stacked Layout */}
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
          {/* Title Section */}
          <div className="flex items-center">
            <Link href="/dashboard" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-3 md:mr-4">
              <ArrowLeft size={24} className="md:w-7 md:h-7" />
            </Link>
            <h1 className="text-2xl md:text-4xl font-bold text-darkGray dark:text-gray-100">
              Reports & Analytics
            </h1>
          </div>

          {/* Mobile Date Range & Actions */}
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            {/* Date Range - Mobile Stacked */}
            <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-xs md:text-sm font-medium text-mediumGray dark:text-gray-400">From:</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-2 md:px-3 py-1.5 md:py-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 text-sm"
                  title="Start date"
                  placeholder="Start date"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-xs md:text-sm font-medium text-mediumGray dark:text-gray-400">To:</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-2 md:px-3 py-1.5 md:py-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 text-sm"
                  title="End date"
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Generate Report Button - Mobile Full Width */}
            <button className="bg-primary text-white py-2 px-4 md:py-2.5 md:px-6 rounded-lg font-semibold text-sm md:text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center justify-center w-full md:w-auto">
              <Plus className="mr-2 w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Generate Custom Report</span>
              <span className="sm:hidden">Custom Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Financial Overview Cards - Matching Project Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md text-center border-l-4 border-secondary">
          <h4 className="text-sm md:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Wadarta Dakhliga</h4>
          <p className="text-xl md:text-3xl font-extrabold text-secondary">{formatCurrency(stats.totalIncome || 0)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md text-center border-l-4 border-redError">
          <h4 className="text-sm md:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Wadarta Kharashyada</h4>
          <p className="text-xl md:text-3xl font-extrabold text-redError">{formatCurrency((stats.projectExpenses || 0) + (stats.companyExpenses || 0))}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md text-center border-l-4 border-secondary">
          <h4 className="text-sm md:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Faa'iidada Mashaariicda</h4>
          <p className={`text-xl md:text-3xl font-extrabold ${(stats.realizedProfit ?? stats.netProfit) >= 0 ? 'text-secondary' : 'text-redError'}`}>
            {formatCurrency((stats.realizedProfit ?? stats.netProfit) || 0)}
          </p>
          <p className="text-xs md:text-sm text-mediumGray dark:text-gray-400 mt-1">
            Faa'iidada dhabta ah {stats.completedProjects > 0 ? `(${stats.completedProjects} mashruuc dhammaystiran)` : '(Mashruuc dhammaystiran ma jiro)'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md text-center border-l-4 border-primary">
          <h4 className="text-sm md:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Hantida Shirkadda</h4>
          <p className="text-xl md:text-3xl font-extrabold text-primary">{formatCurrency(stats.fixedAssetsValue || 0)}</p>
        </div>
      </div>

      {/* Mobile-Optimized Detailed Expense Breakdown & Debt Overview - Fixed Design */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md border-l-4 border-redError">
          <h3 className="text-lg md:text-xl font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center space-x-2">
            <DollarSign size={20} className="md:w-6 md:h-6 text-redError" />
            <span className="text-sm md:text-base">Faahfaahinta Kharashyada</span>
          </h3>
          <div className="space-y-3 text-sm md:text-base text-mediumGray dark:text-gray-400">
            {planType !== 'FACTORIES_ONLY' && (
              <div className="flex justify-between items-center">
                <span className="text-xs md:text-sm">Kharashyada Mashruuca:</span>
                <span className="font-semibold text-redError text-xs md:text-sm">-{formatCurrency(stats.projectExpenses || 0)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm">Kharashyada Shirkadda:</span>
              <span className="font-semibold text-redError text-xs md:text-sm">-{formatCurrency(stats.companyExpenses || 0)}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-sm md:text-lg pt-2 border-t-2 border-lightGray dark:border-gray-700">
              <span className="text-xs md:text-sm">Wadarta Guud:</span>
              <span className="text-redError text-xs md:text-sm font-extrabold">-{formatCurrency((stats.projectExpenses || 0) + (stats.companyExpenses || 0))}</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md border-l-4 border-accent">
          <h3 className="text-lg md:text-xl font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center space-x-2">
            <Scale size={20} className="md:w-6 md:h-6 text-accent" />
            <span className="text-sm md:text-base">Deynaha & Lacagaha</span>
          </h3>
          <div className="space-y-3 text-sm md:text-base text-mediumGray dark:text-gray-400">
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm">Lacagaha La Sugayo (customers):</span>
              <span className="font-semibold text-redError text-xs md:text-sm">-{formatCurrency(stats.outstandingDebts || 0)}</span>
            </div>
            {planType !== 'FACTORIES_ONLY' && (
              <div className="flex justify-between items-center">
                <span className="text-xs md:text-sm">Lacagaha La Sugayo (projects):</span>
                <span className="font-semibold text-secondary text-xs md:text-sm">{formatCurrency(stats.receivableDebts || 0)}</span>
              </div>
            )}
            <div className="flex justify-between items-center font-bold text-sm md:text-lg pt-2 border-t-2 border-lightGray dark:border-gray-700">
              <span className="text-xs md:text-sm">Saamiga Saamileyda:</span>
              <span className="text-primary text-xs md:text-sm font-extrabold">{formatCurrency(stats.shareholdersEquity || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Project Performance Chart */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md mb-6 md:mb-8 animate-fade-in-up">
        <h3 className="text-lg md:text-xl font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center space-x-2">
          <LineChart size={20} className="md:w-6 md:h-6 text-primary" />
          <span className="text-sm md:text-base">Horumarka Mashruucyada (6 Bilood ee Ugu Dambeeyay)</span>
        </h3>
        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend />
              <Bar dataKey="started" fill="#3b82f6" name="Bilaabmay" radius={[2, 2, 0, 0]} />
              <Bar dataKey="completed" fill="#10b981" name="Dhammaystiran" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NEW: Project Views Section - Muraayada Mashruucyada - Only for PROJECTS_ONLY or COMBINED */}
      {planType !== 'FACTORIES_ONLY' && (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md mb-6 md:mb-8 animate-fade-in-up">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <h3 className="text-lg md:text-xl font-semibold text-darkGray dark:text-gray-100 flex items-center space-x-2">
              <Eye size={20} className="md:w-6 md:h-6 text-primary" />
              <span className="text-sm md:text-base">Muraayada Mashruucyada (Project Financial Views)</span>
            </h3>
            <button
              onClick={() => setShowProjectViews(!showProjectViews)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Eye size={16} />
              {showProjectViews ? 'Qari' : 'Muuji'}
            </button>
          </div>

          {showProjectViews && projectSummary && (
            <>
              {/* Project Financial Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Total Revenue</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(projectSummary.totalRevenue)}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {projectSummary.totalProjects} mashruuc
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">Total Expenses</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-red-700 dark:text-red-300">
                    {formatCurrency(projectSummary.totalExpenses)}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Kharashyada guud
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Profit</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(projectSummary.totalProfit)}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Faa'iidada guud
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center justify-between mb-2">
                    <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Avg Profit Margin</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {projectSummary.averageProfitMargin.toFixed(1)}%
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    Celceliska faa'iidada
                  </p>
                </div>
              </div>

              {/* Individual Project Financial Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-darkGray dark:text-gray-100">Mashruuc</th>
                      <th className="text-right py-3 px-4 font-semibold text-darkGray dark:text-gray-100">Revenue</th>
                      <th className="text-right py-3 px-4 font-semibold text-darkGray dark:text-gray-100">Kharashyada</th>
                      <th className="text-right py-3 px-4 font-semibold text-darkGray dark:text-gray-100">Faa'iidada</th>
                      <th className="text-right py-3 px-4 font-semibold text-darkGray dark:text-gray-100">Margin %</th>
                      <th className="text-center py-3 px-4 font-semibold text-darkGray dark:text-gray-100">Xaaladda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectReports.slice(0, 10).map((project) => (
                      <tr key={project.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-darkGray dark:text-gray-100">{project.name}</div>
                          <div className="text-xs text-mediumGray dark:text-gray-400">{project.customer}</div>
                        </td>
                        <td className="text-right py-3 px-4 text-green-600 dark:text-green-400 font-medium">
                          {formatCurrency(project.totalRevenue)}
                        </td>
                        <td className="text-right py-3 px-4 text-red-600 dark:text-red-400 font-medium">
                          {formatCurrency(project.totalExpenses)}
                        </td>
                        <td className={`text-right py-3 px-4 font-bold ${project.grossProfit >= 0
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-red-600 dark:text-red-400'
                          }`}>
                          {formatCurrency(project.grossProfit)}
                        </td>
                        <td className={`text-right py-3 px-4 font-medium ${project.profitMargin >= 20
                          ? 'text-green-600 dark:text-green-400'
                          : project.profitMargin >= 10
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                          }`}>
                          {project.profitMargin.toFixed(1)}%
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${project.status === 'Active'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : project.status === 'Completed'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}>
                            {project.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <td className="py-3 px-4 font-bold text-darkGray dark:text-gray-100">Wadarta Guud:</td>
                      <td className="text-right py-3 px-4 font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(projectSummary.totalRevenue)}
                      </td>
                      <td className="text-right py-3 px-4 font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(projectSummary.totalExpenses)}
                      </td>
                      <td className={`text-right py-3 px-4 font-bold ${projectSummary.totalProfit >= 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-red-600 dark:text-red-400'
                        }`}>
                        {formatCurrency(projectSummary.totalProfit)}
                      </td>
                      <td className="text-right py-3 px-4 font-bold text-purple-600 dark:text-purple-400">
                        {projectSummary.averageProfitMargin.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {projectReports.length > 10 && (
                <div className="mt-4 text-center">
                  <Link
                    href="/reports/profit-loss"
                    className="text-primary hover:text-blue-700 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    Muuji Dhammaan Mashruucyada <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Mobile-Optimized Project Alerts Section */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md mb-6 md:mb-8 animate-fade-in-up">
        <h3 className="text-lg md:text-xl font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center space-x-2">
          <Bell size={20} className="md:w-6 md:h-6 text-accent" />
          <span className="text-sm md:text-base">Digniinada Mashruucyada</span>
        </h3>
        <div className="space-y-3">
          {stats.onHoldProjects > 0 && (
            <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <XCircle size={16} className="text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {stats.onHoldProjects} Mashruuc ayaa la joojiyay
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Digniin: Mashruucyada la joojiyay waa in la eegaa si loo bilaabo
                </p>
              </div>
            </div>
          )}
          {stats.outstandingDebts > 0 && (
            <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <Scale size={16} className="text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Deyn dhan {formatCurrency(stats.outstandingDebts)} ayaa la sugayaa
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Digniin: Deynta la sugayaa waa in la bixiyaa si loo dhaafo
                </p>
              </div>
            </div>
          )}
          {stats.receivableDebts > 0 && (
            <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <TrendingUp size={16} className="text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Deyn dhan {formatCurrency(stats.receivableDebts)} ayaa la sugayaa
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Fursad: Deynta la sugayaa waa in la soo qaataa
                </p>
              </div>
            </div>
          )}
          {stats.onHoldProjects === 0 && stats.outstandingDebts === 0 && stats.receivableDebts === 0 && (
            <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <Info size={16} className="text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Wanaagsan! Ma jiraan digniino gaar ah
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Dhammaan mashruucyada iyo deynta waa ku socdaan si wanaagsan
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-Optimized Daily Report Section */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md mb-6 md:mb-8 animate-fade-in-up">
        <h3 className="text-lg md:text-xl font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center space-x-2">
          <CalendarCheck size={20} className="md:w-6 md:h-6 text-primary" />
          <span className="text-sm md:text-base">Warbixinta Maalinlaha ah ({dailyReport.date})</span>
        </h3>
        <p className="text-xs md:text-sm text-mediumGray dark:text-gray-400 mb-4">
          Warbixintani waxay si otomaatig ah u diyaarinaysaa xogta maalintaas oo dhan, oo ay ku jiraan dhaqdhaqaaqa lacagta, kharashyada, iyo xaaladda mashruuca.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-3 md:p-4 rounded-lg text-center">
            <h4 className="text-xs md:text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Dakhliga Maanta</h4>
            <p className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">+{formatCurrency(dailyReport.todayIncome || 0)}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 md:p-4 rounded-lg text-center">
            <h4 className="text-xs md:text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Kharashyada Maanta</h4>
            <p className="text-lg md:text-xl font-bold text-red-600 dark:text-red-400">-{formatCurrency(dailyReport.todayExpenses || 0)}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 md:p-4 rounded-lg text-center">
            <h4 className="text-xs md:text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Net Flow Maanta</h4>
            <p className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(dailyReport.todayNetFlow || 0)}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 md:p-4 rounded-lg text-center">
            <h4 className="text-xs md:text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">Dhaqdhaqaaqa Cusub</h4>
            <p className="text-lg md:text-xl font-bold text-purple-600 dark:text-purple-400">{dailyReport.newTransactions || 0}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 md:p-4 rounded-lg text-center">
            <h4 className="text-xs md:text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Projects Bilaabmay</h4>
            <p className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">{dailyReport.projectsStartedToday || 0}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 md:p-4 rounded-lg text-center">
            <h4 className="text-xs md:text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Projects Dhammaystiran</h4>
            <p className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">{dailyReport.projectsCompletedToday || 0}</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 md:p-4 rounded-lg text-center">
            <h4 className="text-xs md:text-sm font-semibold text-orange-700 dark:text-orange-300 mb-1">Users Cusub</h4>
            <p className="text-lg md:text-xl font-bold text-orange-600 dark:text-orange-400">{dailyReport.newUsersToday || 0}</p>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Quick Reports Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up">
        {/* NEW: Balance Sheet Card */}
        <Link href="/reports/financial-summary" className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 group border-l-4 border-blue-500">
          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-3 md:p-4 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
            <Activity size={32} className="md:w-10 md:h-10" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-lg md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Financial Summary</h3>
            <p className="text-sm md:text-base text-mediumGray dark:text-gray-400">Guudmar Maaliyadeed (Performance & Position).</p>
          </div>
          <ArrowRight size={20} className="md:w-6 md:h-6 text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200" />
        </Link>

        <Link href="/reports/profit-loss" className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 group">

          <div className="bg-primary/10 text-primary p-3 md:p-4 rounded-full group-hover:bg-primary group-hover:text-white transition-colors duration-200">
            <LineChart size={32} className="md:w-10 md:h-10" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-lg md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Profit & Loss</h3>
            <p className="text-sm md:text-base text-mediumGray dark:text-gray-400">Warbixin faa'iidada iyo khasaaraha oo faahfaahsan.</p>
          </div>
          <ArrowRight size={20} className="md:w-6 md:h-6 text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200" />
        </Link>

        <Link href="/reports/expenses" className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 group">
          <div className="bg-secondary/10 text-secondary p-3 md:p-4 rounded-full group-hover:bg-secondary group-hover:text-white transition-colors duration-200">
            <DollarSign size={32} className="md:w-10 md:h-10" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-lg md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Expenses Log</h3>
            <p className="text-sm md:text-base text-mediumGray dark:text-gray-400">Diiwaan buuxa oo dhammaan kharashaadka.</p>
          </div>
          <ArrowRight size={20} className="md:w-6 md:h-6 text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200" />
        </Link>

        <Link href="/reports/inventory" className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 group">
          <div className="bg-accent/10 text-accent p-3 md:p-4 rounded-full group-hover:bg-accent group-hover:text-white transition-colors duration-200">
            <Warehouse size={32} className="md:w-10 md:h-10" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-lg md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Inventory Report</h3>
            <p className="text-sm md:text-base text-mediumGray dark:text-gray-400">Warbixin ku saabsan alaabta bakhaarkaaga iyo isticmaalkeeda.</p>
          </div>
          <ArrowRight size={20} className="md:w-6 md:h-6 text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200" />
        </Link>

        <Link href="/manufacturing" className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 group">
          <div className="bg-primary/10 text-primary p-3 md:p-4 rounded-full group-hover:bg-primary group-hover:text-white transition-colors duration-200">
            <Factory size={32} className="md:w-10 md:h-10" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-lg md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Manufacturing Report</h3>
            <p className="text-sm md:text-base text-mediumGray dark:text-gray-400">Warbixin ku saabsan warshadaha iyo amarka alaabta.</p>
          </div>
          <ArrowRight size={20} className="md:w-6 md:h-6 text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200" />
        </Link>

        <Link href="/reports/debts" className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 group">
          <div className="bg-redError/10 text-redError p-3 md:p-4 rounded-full group-hover:bg-redError group-hover:text-white transition-colors duration-200">
            <Scale size={32} className="md:w-10 md:h-10" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-lg md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Debts Overview</h3>
            <p className="text-sm md:text-base text-mediumGray dark:text-gray-400">La socod deynaha aad leedahay iyo kuwa lagugu leeyahay.</p>
          </div>
          <ArrowRight size={20} className="md:w-6 md:h-6 text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200" />
        </Link>

        <Link href="/reports/bank" className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 group">
          <div className="bg-primary/10 text-primary p-3 md:p-4 rounded-full group-hover:bg-primary group-hover:text-white transition-colors duration-200">
            <Banknote size={32} className="md:w-10 md:h-10" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-lg md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Bank & Cash Flow</h3>
            <p className="text-sm md:text-base text-mediumGray dark:text-gray-400">Dhaqdhaqaaqa lacagta ee xisaabaadkaaga bangiga iyo cash-ka.</p>
          </div>
          <ArrowRight size={20} className="md:w-6 md:h-6 text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200" />
        </Link>

        <Link href="/reports/payment-schedule" className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 group">
          <div className="bg-secondary/10 text-secondary p-3 md:p-4 rounded-full group-hover:bg-secondary group-hover:text-white transition-colors duration-200">
            <CreditCard size={32} className="md:w-10 md:h-10" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-lg md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Payment Schedule</h3>
            <p className="text-sm md:text-base text-mediumGray dark:text-gray-400">Jadwal lacag-bixineed oo la sugayo iyo kuwa la bixiyay.</p>
          </div>
          <ArrowRight size={20} className="md:w-6 md:h-6 text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200" />
        </Link>

        <Link href="/reports/custom" className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 group">
          <div className="bg-accent/10 text-accent p-3 md:p-4 rounded-full group-hover:bg-accent group-hover:text-white transition-colors duration-200">
            <Settings size={32} className="md:w-10 md:h-10" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-lg md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Custom Reports</h3>
            <p className="text-sm md:text-base text-mediumGray dark:text-gray-400">Samee warbixino gaarka ah oo ku haboon shirkaddaada.</p>
          </div>
          <ArrowRight size={20} className="md:w-6 md:h-6 text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200" />
        </Link>

        <Link href="/reports/scheduled" className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 group">
          <div className="bg-primary/10 text-primary p-3 md:p-4 rounded-full group-hover:bg-primary group-hover:text-white transition-colors duration-200">
            <CalendarCheck size={32} className="md:w-10 md:h-10" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-lg md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Scheduled Reports</h3>
            <p className="text-sm md:text-base text-mediumGray dark:text-gray-400">Deji warbixino si otomaatig ah u soo diran.</p>
          </div>
          <ArrowRight size={20} className="md:w-6 md:h-6 text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200" />
        </Link>

        <Link href="/reports/daily-reports" className="bg-secondary/10 text-secondary p-4 md:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 group">
          <div className="bg-primary/10 text-primary p-3 md:p-4 rounded-full group-hover:bg-primary group-hover:text-white transition-colors duration-200">
            <CalendarCheck size={32} className="md:w-10 md:h-10" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-lg md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Daily Reports</h3>
            <p className="text-sm md:text-base text-mediumGray dark:text-gray-400">Warbixin buuxda oo maalinle ah, PDF/print/share.</p>
          </div>
          <ArrowRight size={20} className="md:w-6 md:h-6 text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200" />
        </Link>

        {planType !== 'FACTORIES_ONLY' && (
          <Link href="/reports/project-reports" className="bg-indigo-50 dark:bg-indigo-900/20 p-4 md:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 group border border-indigo-200 dark:border-indigo-800">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-3 md:p-4 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
              <Briefcase size={32} className="md:w-10 md:h-10" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="text-lg md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Project Reports</h3>
              <p className="text-sm md:text-base text-mediumGray dark:text-gray-400">Warbixin mashaariicda oo faahfaahsan, filter-ka taariikhda, PDF/print.</p>
            </div>
            <ArrowRight size={20} className="md:w-6 md:h-6 text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200" />
          </Link>
        )}

        {/* NEW: Company Report Card */}
        <Link href="/reports/company-report" className="bg-emerald-50 dark:bg-emerald-900/20 p-4 md:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 group border border-emerald-200 dark:border-emerald-800">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 md:p-4 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
            <Building size={32} className="md:w-10 md:h-10" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-lg md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Company Report</h3>
            <p className="text-sm md:text-base text-mediumGray dark:text-gray-400">Warbixin guud ee shirkadda (Income, Expenses, Assets, & Profit).</p>
          </div>
          <ArrowRight size={20} className="md:w-6 md:h-6 text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200" />
        </Link>
      </div>

      {/* Mobile-Optimized Export/Share Buttons */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md mb-6 md:mb-8 animate-fade-in-up">
        <h3 className="text-lg md:text-xl font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center space-x-2">
          <Download size={20} className="md:w-6 md:h-6 text-primary" />
          <span className="text-sm md:text-base">Soo Deji & Wadaag</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 md:gap-4">
          <button onClick={exportToPDF} className="bg-blue-500 text-white py-2 px-3 md:py-3 md:px-4 rounded-lg font-semibold text-xs md:text-sm hover:bg-blue-600 transition duration-200 flex items-center justify-center space-x-1">
            <Download size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Soo Deji PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
          <button onClick={exportToExcel} className="bg-green-500 text-white py-2 px-3 md:py-3 md:px-4 rounded-lg font-semibold text-xs md:text-sm hover:bg-green-600 transition duration-200 flex items-center justify-center space-x-1">
            <Download size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Soo Deji Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
          <button onClick={exportToCSV} className="bg-orange-500 text-white py-2 px-3 md:py-3 md:px-4 rounded-lg font-semibold text-xs md:text-sm hover:bg-orange-600 transition duration-200 flex items-center justify-center space-x-1">
            <Download size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Soo Deji CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
          <button onClick={() => window.print()} className="bg-blue-600 text-white py-2 px-3 md:py-3 md:px-4 rounded-lg font-semibold text-xs md:text-sm hover:bg-blue-700 transition duration-200 flex items-center justify-center space-x-1">
            <Printer size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Daabac</span>
            <span className="sm:hidden">Print</span>
          </button>
          <button onClick={() => {/* Email functionality */ }} className="bg-green-600 text-white py-2 px-3 md:py-3 md:px-4 rounded-lg font-semibold text-xs md:text-sm hover:bg-green-700 transition duration-200 flex items-center justify-center space-x-1">
            <Mail size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">U Dir Email</span>
            <span className="sm:hidden">Email</span>
          </button>
          <button onClick={() => {/* WhatsApp functionality */ }} className="bg-green-500 text-white py-2 px-3 md:py-3 md:px-4 rounded-lg font-semibold text-xs md:text-sm hover:bg-green-600 transition duration-200 flex items-center justify-center space-x-1">
            <MessageSquare size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Wadaag (WhatsApp)</span>
            <span className="sm:hidden">WhatsApp</span>
          </button>
          <button onClick={() => {/* Telegram functionality */ }} className="bg-blue-500 text-white py-2 px-3 md:py-3 md:px-4 rounded-lg font-semibold text-xs md:text-sm hover:bg-blue-600 transition duration-200 flex items-center justify-center space-x-1">
            <Send size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Wadaag (Telegram)</span>
            <span className="sm:hidden">Telegram</span>
          </button>
        </div>
      </div>

    </Layout>
  );
}