// app/reports/profit-loss/page.tsx - Profit & Loss Report Page (10000% Design - Project-Centric)
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, LineChart, DollarSign, Plus, Search, Filter, Calendar, 
  Download, Upload, Printer, Mail, MessageSquare, Send, 
  TrendingUp, TrendingDown, CheckCircle, XCircle, Info,
  Tag, Briefcase, CreditCard, Eye, Edit, Trash2,
  List, LayoutGrid, BarChart, PieChart, Clock as ClockIcon,
  Coins, CheckSquare, Target, Share2, ChevronRight, ChevronUp, ChevronDown, Building // New icons for project-specific insights
} from 'lucide-react';
import Toast from '../../../components/common/Toast'; // Reuse Toast component
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

// ...API-driven state and useEffect already added above...

// Helper for chart colors
const CHART_COLORS = ['#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#9B59B6', '#1ABC9C'];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-sm font-semibold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


// Main Profit & Loss Report Page Component
import { useEffect } from 'react';

interface MonthlySummaryItem {
  month: string;
  projectIncome: number;
  projectDirectCosts: number;
  operatingExpenses: number;
  netProjectProfit: number;
}
interface IncomeItem { id: string; date: string; description: string; amount: number; type: string; projectId?: string; projectName?: string; }
interface CostItem { id: string; date: string; description: string; amount: number; type: string; projectId?: string; projectName?: string; }
interface OpexItem { id: string; date: string; description: string; amount: number; type: string; projectId?: string; projectName?: string; }
interface ProjectGroup {
  projectId: string;
  projectName: string;
  projectStatus: string;
  totalIncome: number;
  totalDirectCosts: number;
  netProfit: number;
  transactions: any[];
}
interface CompanyExpenseGroup {
  category: string;
  subCategory: string;
  totalAmount: number;
  transactions: any[];
}

export default function ProfitLossReportPage() {
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryItem[]>([]);
  const [projectIncomeItems, setProjectIncomeItems] = useState<IncomeItem[]>([]);
  const [directProjectCostItems, setDirectProjectCostItems] = useState<CostItem[]>([]);
  const [operatingExpensesItems, setOperatingExpensesItems] = useState<OpexItem[]>([]);
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
  const [companyExpenseGroups, setCompanyExpenseGroups] = useState<CompanyExpenseGroup[]>([]);
  const [realizedProjectProfit, setRealizedProjectProfit] = useState<number>(0);
  const [potentialProjectProfit, setPotentialProjectProfit] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = useState('This Year');
  const [showChartSection, setShowChartSection] = useState(true);
  const [activeChartType, setActiveChartType] = useState<'line' | 'bar'>('line');
  const [activeExpenseChartType, setActiveExpenseChartType] = useState<'pie' | 'bar'>('pie');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedCompanyExpenses, setExpandedCompanyExpenses] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    async function fetchPL() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/accounting/reports/profit-loss');
        if (!res.ok) throw new Error('Failed to fetch profit & loss data');
        const data = await res.json();
        setMonthlySummary(data.monthlySummary || []);
        setProjectIncomeItems(data.projectIncomeItems || []);
        setDirectProjectCostItems(data.directProjectCostItems || []);
        setOperatingExpensesItems(data.operatingExpensesItems || []);
        setProjectGroups(data.projectGroups || []);
        setCompanyExpenseGroups(data.companyExpenseGroups || []);
        setRealizedProjectProfit(data.realizedProjectProfit || 0);
        setPotentialProjectProfit(data.potentialProjectProfit || 0);
        setToastMessage({ message: 'Warbixinta si guul leh ayaa la soo geliyay!', type: 'success' });
      } catch (err: any) {
        setError(err.message || 'Error fetching data');
        setToastMessage({ message: err.message || 'Cilad ayaa dhacday marka warbixinta la soo gelinayay.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchPL();
  }, []);

  // Calculate totals based on API data
  const currentProjectIncome = projectIncomeItems.reduce((sum, item) => sum + item.amount, 0);
  const currentDirectProjectCosts = directProjectCostItems.reduce((sum, item) => sum + item.amount, 0);
  const currentOperatingExpenses = operatingExpensesItems.reduce((sum, item) => sum + item.amount, 0);
  const currentGrossProfit = currentProjectIncome - currentDirectProjectCosts;
  const currentNetProfit = currentGrossProfit - currentOperatingExpenses;

  // Data for Expense Breakdown Pie Chart (now includes direct project costs)
  const expenseBreakdownData = [
    { name: 'Kharashyada Tooska ah ee Mashruuca', value: currentDirectProjectCosts, color: CHART_COLORS[3] },
    { name: 'Kirada Xafiiska', value: operatingExpensesItems.filter((item: any) => item.type === 'Rent').reduce((sum: number, i: any) => sum + i.amount, 0), color: CHART_COLORS[0] },
    { name: 'Adeegyada Guud', value: operatingExpensesItems.filter((item: any) => item.type === 'Utilities').reduce((sum: number, i: any) => sum + i.amount, 0), color: CHART_COLORS[4] },
    { name: 'Suuqgeyn', value: operatingExpensesItems.filter((item: any) => item.type === 'Marketing').reduce((sum: number, i: any) => sum + i.amount, 0), color: CHART_COLORS[2] },
    { name: 'Kharashyo Kale oo Shaqo', value: operatingExpensesItems.filter((item: any) => !['Rent', 'Utilities', 'Marketing'].includes(item.type)).reduce((sum: number, i: any) => sum + i.amount, 0), color: CHART_COLORS[5] },
  ].filter(item => item.value > 0);

  const dateRanges = ['All', 'This Month', 'This Quarter', 'This Year', 'Last 12 Months'];

  // Real Export Functions
  const handleExportPDF = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const printContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Profit & Loss Report - ${new Date().toLocaleDateString()}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
                .card h4 { margin: 0 0 10px 0; color: #666; }
                .card p { margin: 0; font-size: 24px; font-weight: bold; }
                .positive { color: #10b981; }
                .negative { color: #ef4444; }
                .neutral { color: #3b82f6; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; }
                .footer { text-align: center; margin-top: 30px; color: #666; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Warbixinta Faa'iidada & Khasaaraha</h1>
                <p>Taariikhda: ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div class="summary-cards">
                <div class="card">
                  <h4>Dakhliga Mashruuca</h4>
                  <p class="positive">$${currentProjectIncome.toLocaleString()}</p>
                </div>
                <div class="card">
                  <h4>Kharashyada Tooska ah</h4>
                  <p class="negative">$${currentDirectProjectCosts.toLocaleString()}</p>
                </div>
                <div class="card">
                  <h4>Faa'iidada Guud</h4>
                  <p class="neutral">$${currentGrossProfit.toLocaleString()}</p>
                </div>
                <div class="card">
                  <h4>Net Faa'iidada</h4>
                  <p class="${currentNetProfit >= 0 ? 'positive' : 'negative'}">$${currentNetProfit.toLocaleString()}</p>
                </div>
              </div>
              
              <h2>Qaybinta Mashruuca</h2>
              <table>
                <thead>
                  <tr>
                    <th>Mashruuc</th>
                    <th>Heerka</th>
                    <th>Dakhli</th>
                    <th>Kharash</th>
                    <th>Net Faa'iido</th>
                  </tr>
                </thead>
                <tbody>
                  ${projectGroups.map(project => `
                    <tr>
                      <td>${project.projectName}</td>
                      <td>${project.projectStatus}</td>
                      <td>$${project.totalIncome.toLocaleString()}</td>
                      <td>$${project.totalDirectCosts.toLocaleString()}</td>
                      <td>$${project.netProfit.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="footer">
                <p>Waxaa soo saaray Revlo Accounting System - ${new Date().toLocaleString()}</p>
              </div>
            </body>
          </html>
        `;
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('PDF Export Error:', error);
      setToastMessage({ message: 'Cilad ayaa dhacday marka PDF la soo saarayay.', type: 'error' });
    }
  };

  const handleExportCSV = () => {
    try {
      const csvData = [
        ['Type', 'Date', 'Description', 'Amount', 'Project'],
        ...projectIncomeItems.map(item => ['Project Income', new Date(item.date).toLocaleDateString(), item.description, item.amount, item.projectName || 'N/A']),
        ...directProjectCostItems.map(item => ['Direct Project Cost', new Date(item.date).toLocaleDateString(), item.description, -item.amount, item.projectName || 'N/A']),
        ...operatingExpensesItems.map(item => ['Operating Expense', new Date(item.date).toLocaleDateString(), item.description, -item.amount, item.projectName || 'N/A'])
      ];
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `profit_loss_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setToastMessage({ message: 'CSV file-ka si guul leh ayaa la soo saaray!', type: 'success' });
    } catch (error) {
      console.error('CSV Export Error:', error);
      setToastMessage({ message: 'Cilad ayaa dhacday marka CSV la soo saarayay.', type: 'error' });
    }
  };

  const handleExportExcel = () => {
    try {
      // Create Excel-like data structure
      const excelData = {
        'Summary': [
          ['Metric', 'Amount'],
          ['Total Project Income', currentProjectIncome],
          ['Total Direct Costs', currentDirectProjectCosts],
          ['Gross Profit', currentGrossProfit],
          ['Operating Expenses', currentOperatingExpenses],
          ['Net Profit', currentNetProfit]
        ],
        'Project Breakdown': [
          ['Project Name', 'Status', 'Income', 'Costs', 'Net Profit'],
          ...projectGroups.map(project => [
            project.projectName,
            project.projectStatus,
            project.totalIncome,
            project.totalDirectCosts,
            project.netProfit
          ])
        ],
        'Transactions': [
          ['Type', 'Date', 'Description', 'Amount', 'Project'],
          ...projectIncomeItems.map(item => ['Project Income', new Date(item.date).toLocaleDateString(), item.description, item.amount, item.projectName || 'N/A']),
          ...directProjectCostItems.map(item => ['Direct Project Cost', new Date(item.date).toLocaleDateString(), item.description, -item.amount, item.projectName || 'N/A']),
          ...operatingExpensesItems.map(item => ['Operating Expense', new Date(item.date).toLocaleDateString(), item.description, -item.amount, item.projectName || 'N/A'])
        ]
      };

      // Convert to CSV format (simplified Excel export)
      const csvContent = Object.entries(excelData).map(([sheetName, data]) => {
        return `\n=== ${sheetName} ===\n${data.map(row => row.join(',')).join('\n')}`;
      }).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `profit_loss_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setToastMessage({ message: 'Excel file-ka si guul leh ayaa la soo saaray!', type: 'success' });
    } catch (error) {
      console.error('Excel Export Error:', error);
      setToastMessage({ message: 'Cilad ayaa dhacday marka Excel la soo saarayay.', type: 'error' });
    }
  };

  const handleShare = (platform: string) => {
    try {
      const reportData = {
        title: 'Warbixinta Faa\'iidada & Khasaaraha',
        summary: {
          totalIncome: currentProjectIncome,
          totalCosts: currentDirectProjectCosts,
          netProfit: currentNetProfit
        },
        date: new Date().toLocaleDateString()
      };

      const shareText = `Warbixinta Faa'iidada & Khasaaraha - ${reportData.date}\nDakhliga Guud: $${reportData.summary.totalIncome.toLocaleString()}\nKharashyada Guud: $${reportData.summary.totalCosts.toLocaleString()}\nNet Faa'iidada: $${reportData.summary.netProfit.toLocaleString()}`;

      switch (platform) {
        case 'email':
          window.open(`mailto:?subject=${encodeURIComponent(reportData.title)}&body=${encodeURIComponent(shareText)}`);
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
          break;
        case 'telegram':
          window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`);
          break;
        default:
          if (navigator.share) {
            navigator.share({
              title: reportData.title,
              text: shareText,
              url: window.location.href
            });
          } else {
            navigator.clipboard.writeText(shareText);
            setToastMessage({ message: 'Warbixinta clipboard-ka loo qoray!', type: 'success' });
          }
      }
    } catch (error) {
      console.error('Share Error:', error);
      setToastMessage({ message: 'Cilad ayaa dhacday marka warbixinta la wadaagayay.', type: 'error' });
    }
  };

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const toggleCompanyExpenseExpansion = (expenseKey: string) => {
    const newExpanded = new Set(expandedCompanyExpenses);
    if (newExpanded.has(expenseKey)) {
      newExpanded.delete(expenseKey);
    } else {
      newExpanded.add(expenseKey);
    }
    setExpandedCompanyExpenses(newExpanded);
  };

  if (loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[400px] text-darkGray dark:text-gray-100 p-4">
        <div className="animate-spin mb-4">
          <LineChart size={48} className="text-primary" />
        </div>
        <p className="text-center text-lg font-semibold mb-2">Warbixinta Faa'iidada & Khasaaraha</p>
        <p className="text-center text-mediumGray dark:text-gray-400">Waxaa soo dhacaya...</p>
      </div>
    </Layout>
  );
  
  if (error) return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <XCircle size={48} className="mb-4 text-redError" />
        <div className="text-redError text-xl font-bold mb-4 text-center">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition duration-200 shadow-md"
        >
          Reload
        </button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      {/* Compact Mobile Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/reports" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-2">
              <ArrowLeft size={20} />
          </Link>
            <h1 className="text-lg font-bold text-darkGray dark:text-gray-100">
              P&L Report
        </h1>
          </div>
          <div className="flex space-x-1">
          <button 
              onClick={handleExportPDF} 
              className="bg-primary text-white p-2 rounded-lg text-xs hover:bg-blue-700 transition duration-200"
              title="PDF"
            >
              <Download size={14} />
          </button>
          <button 
              onClick={handleExportCSV}
              className="bg-secondary text-white p-2 rounded-lg text-xs hover:bg-green-600 transition duration-200"
              title="CSV"
            >
              <Share2 size={14} />
          </button>
          </div>
        </div>
      </div>

      {/* Compact Summary Cards */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp size={16} className="text-secondary mr-1" />
            <h4 className="text-xs font-semibold text-darkGray dark:text-gray-100">Dakhli</h4>
        </div>
          <p className="text-lg font-bold text-secondary">${currentProjectIncome.toLocaleString()}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingDown size={16} className="text-redError mr-1" />
            <h4 className="text-xs font-semibold text-darkGray dark:text-gray-100">Kharash</h4>
        </div>
          <p className="text-lg font-bold text-redError">${currentDirectProjectCosts.toLocaleString()}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm text-center">
          <div className="flex items-center justify-center mb-1">
            <DollarSign size={16} className="text-primary mr-1" />
            <h4 className="text-xs font-semibold text-darkGray dark:text-gray-100">Faa'iido</h4>
          </div>
          <p className="text-lg font-bold text-primary">${currentGrossProfit.toLocaleString()}</p>
      </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm text-center">
          <div className="flex items-center justify-center mb-1">
            <CheckCircle size={16} className={`mr-1 ${currentNetProfit >= 0 ? 'text-secondary' : 'text-redError'}`} />
            <h4 className="text-xs font-semibold text-darkGray dark:text-gray-100">Net</h4>
        </div>
          <p className={`text-lg font-bold ${currentNetProfit >= 0 ? 'text-secondary' : 'text-redError'}`}>${currentNetProfit.toLocaleString()}</p>
        </div>
      </div>

      {/* Compact Profit Status */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm text-center">
          <div className="flex items-center justify-center mb-1">
            <CheckSquare size={16} className="text-secondary mr-1"/>
            <h4 className="text-xs font-semibold text-darkGray dark:text-gray-100">Dhabta ah</h4>
          </div>
          <p className="text-lg font-bold text-secondary">${realizedProjectProfit.toLocaleString()}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm text-center">
          <div className="flex items-center justify-center mb-1">
            <Coins size={16} className="text-primary mr-1"/>
            <h4 className="text-xs font-semibold text-darkGray dark:text-gray-100">Suurtagal</h4>
          </div>
          <p className="text-lg font-bold text-primary">${potentialProjectProfit.toLocaleString()}</p>
        </div>
      </div>


      {/* Compact Filters */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm mb-3">
        <div className="flex items-center space-x-2">
          <select
            title="Filter by date range"
            className="flex-1 p-2 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none text-xs"
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
          >
            {dateRanges.map(range => <option key={range} value={range}>{range}</option>)}
          </select>
          
          <button 
            onClick={() => setActiveChartType('line')} 
            className={`p-2 rounded-lg transition-colors duration-200 ${activeChartType === 'line' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'}`} 
            title="Line Chart"
          >
            <LineChart size={14} />
            </button>
          <button 
            onClick={() => setActiveChartType('bar')} 
            className={`p-2 rounded-lg transition-colors duration-200 ${activeChartType === 'bar' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'}`} 
            title="Bar Chart"
          >
            <BarChart size={14} />
            </button>
          <button 
            onClick={() => setShowChartSection(!showChartSection)} 
            className="p-2 rounded-lg text-mediumGray dark:text-gray-400 hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-200"
            title={showChartSection ? 'Hide Charts' : 'Show Charts'}
          >
            {showChartSection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
        </div>
      </div>

      {/* Compact Charts Section */}
      {showChartSection && (
        <div className="space-y-3 mb-3">
          {/* Monthly P&L Chart */}
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
            <div className="flex items-center mb-2">
              <BarChart size={16} className="text-primary mr-1" />
              <h3 className="text-xs font-semibold text-darkGray dark:text-gray-100">Dakhli & Kharash Bishiiba</h3>
            </div>
            <div className="w-full h-[150px]">
              <ResponsiveContainer>
                {activeChartType === 'line' ? (
                  <RechartsLineChart data={monthlySummary} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" vertical={false} />
                    <XAxis dataKey="month" stroke="#7F8C8D" className="dark:text-gray-400 text-xs" />
                    <YAxis stroke="#7F8C8D" className="dark:text-gray-400 text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #ddd', 
                        borderRadius: '8px',
                        fontSize: '10px'
                      }} 
                      labelStyle={{ color: '#2C3E50', fontWeight: 'bold' }} 
                      itemStyle={{ color: '#2C3E50' }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="projectIncome" stroke={CHART_COLORS[1]} name="Dakhli" strokeWidth={2} />
                    <Line type="monotone" dataKey="projectDirectCosts" stroke={CHART_COLORS[3]} name="Kharash" strokeWidth={2} />
                    <Line type="monotone" dataKey="netProjectProfit" stroke={CHART_COLORS[2]} name="Net" strokeWidth={2} />
                  </RechartsLineChart>
                ) : (
                  <RechartsBarChart data={monthlySummary} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" vertical={false} />
                    <XAxis dataKey="month" stroke="#7F8C8D" className="dark:text-gray-400 text-xs" />
                    <YAxis stroke="#7F8C8D" className="dark:text-gray-400 text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #ddd', 
                        borderRadius: '8px',
                        fontSize: '10px'
                      }} 
                      labelStyle={{ color: '#2C3E50', fontWeight: 'bold' }} 
                      itemStyle={{ color: '#2C3E50' }} 
                    />
                    <Legend />
                    <Bar dataKey="projectIncome" fill={CHART_COLORS[1]} name="Dakhli" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="projectDirectCosts" fill={CHART_COLORS[3]} name="Kharash" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="netProjectProfit" fill={CHART_COLORS[2]} name="Net" radius={[2, 2, 0, 0]} />
                  </RechartsBarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Breakdown Pie Chart */}
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
            <div className="flex items-center mb-2">
              <PieChart size={16} className="text-accent mr-1" />
              <h3 className="text-xs font-semibold text-darkGray dark:text-gray-100">Qaybinta Kharashyada</h3>
            </div>
            <div className="w-full h-[150px]">
              <ResponsiveContainer>
                <RechartsPieChart>
                  <Pie
                    data={expenseBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={50}
                    dataKey="value"
                  >
                    {expenseBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd', 
                      borderRadius: '8px',
                      fontSize: '10px'
                    }}
                    labelStyle={{ color: '#2C3E50', fontWeight: 'bold' }}
                    itemStyle={{ color: '#2C3E50' }}
                  />
                  <Legend align="right" verticalAlign="middle" layout="vertical" wrapperStyle={{ paddingLeft: '20px', fontSize: '10px' }} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Compact Project Breakdown Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-3">
        <div className="flex items-center justify-between p-3 border-b border-lightGray dark:border-gray-700">
          <div className="flex items-center">
            <Briefcase size={16} className="text-primary mr-1"/>
            <h3 className="text-xs font-semibold text-darkGray dark:text-gray-100">Mashruuca</h3>
          </div>
          <div className="text-xs text-mediumGray dark:text-gray-400 bg-lightGray dark:bg-gray-700 px-2 py-1 rounded-full">
            {projectGroups.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
            <thead className="bg-lightGray dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-2 py-1.5 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Mashruuc</th>
                <th scope="col" className="px-2 py-1.5 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Dakhli</th>
                <th scope="col" className="px-2 py-1.5 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Net</th>
                <th scope="col" className="px-2 py-1.5 text-center text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lightGray dark:divide-gray-700">
              {projectGroups.map((project) => (
                <React.Fragment key={project.projectId}>
                  <tr className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full ${
                            project.projectStatus === 'Completed' ? 'bg-green-500' :
                            project.projectStatus === 'Active' ? 'bg-blue-500' :
                            project.projectStatus === 'On Hold' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`}></div>
                        </div>
                        <div className="ml-2">
                          <div className="text-xs font-medium text-darkGray dark:text-gray-100 truncate max-w-[120px]">
                            {project.projectName}
                          </div>
                          <div className="text-xs text-mediumGray dark:text-gray-400">
                            {project.projectStatus}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-right">
                      <div className="text-xs font-semibold text-secondary">${project.totalIncome.toLocaleString()}</div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-right">
                      <div className={`text-xs font-bold ${project.netProfit >= 0 ? 'text-secondary' : 'text-redError'}`}>
                        ${project.netProfit.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <button
                        onClick={() => toggleProjectExpansion(project.projectId)}
                        className="p-1.5 rounded-lg bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                        title={expandedProjects.has(project.projectId) ? 'Qari Faahfaahinta' : 'Muuji Faahfaahinta'}
                      >
                        {expandedProjects.has(project.projectId) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Compact Expanded Transaction Details */}
                  {expandedProjects.has(project.projectId) && (
                    <tr>
                      <td colSpan={4} className="px-2 py-2 bg-lightGray/30 dark:bg-gray-700/30">
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-darkGray dark:text-gray-100 mb-1">
                            Dhaqdhaqaaqa: {project.projectName}
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-lightGray dark:divide-gray-600">
                              <thead className="bg-white dark:bg-gray-800">
                                <tr>
                                  <th className="px-1 py-1 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Taariikhda</th>
                                  <th className="px-1 py-1 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Nooca</th>
                                  <th className="px-1 py-1 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Qiimaha</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-lightGray dark:divide-gray-600">
                                {project.transactions.map((transaction) => (
                                  <tr key={transaction.id} className="hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                                    <td className="px-1 py-1 whitespace-nowrap text-xs text-darkGray dark:text-gray-100">
                                      {new Date(transaction.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-1 py-1 whitespace-nowrap text-xs text-mediumGray dark:text-gray-300">
                                      <span className={`px-1 py-0.5 rounded-full text-xs ${
                                        transaction.type === 'INCOME' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                                      }`}>
                                        {transaction.type}
                                      </span>
                                    </td>
                                    <td className="px-1 py-1 whitespace-nowrap text-right text-xs font-semibold">
                                      <span className={`${transaction.type === 'INCOME' ? 'text-secondary' : 'text-redError'}`}>
                                        {transaction.type === 'INCOME' ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compact Company Expense Breakdown Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-3">
        <div className="flex items-center justify-between p-3 border-b border-lightGray dark:border-gray-700">
          <div className="flex items-center">
            <Building size={16} className="text-accent mr-1"/>
            <h3 className="text-xs font-semibold text-darkGray dark:text-gray-100">Kharashyada Shirkadda</h3>
          </div>
          <div className="text-xs text-mediumGray dark:text-gray-400 bg-lightGray dark:bg-gray-700 px-2 py-1 rounded-full">
            {companyExpenseGroups.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
            <thead className="bg-lightGray dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-2 py-1.5 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca Kharashka</th>
                <th scope="col" className="px-2 py-1.5 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Wadarta</th>
                <th scope="col" className="px-2 py-1.5 text-center text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lightGray dark:divide-gray-700">
              {companyExpenseGroups.map((expenseGroup, index) => {
                const expenseKey = `${expenseGroup.category}-${expenseGroup.subCategory}`;
                return (
                  <React.Fragment key={expenseKey}>
                    <tr className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full ${
                              expenseGroup.category === 'Salary' ? 'bg-blue-500' :
                              expenseGroup.category === 'Material' ? 'bg-green-500' :
                              expenseGroup.category === 'Labor' ? 'bg-yellow-500' :
                              expenseGroup.category === 'Debt' ? 'bg-red-500' :
                              expenseGroup.category === 'Fixed Asset' ? 'bg-purple-500' :
                              'bg-gray-500'
                            }`}></div>
                          </div>
                          <div className="ml-2">
                            <div className="text-xs font-medium text-darkGray dark:text-gray-100">
                              {expenseGroup.category}
                            </div>
                            <div className="text-xs text-mediumGray dark:text-gray-400">
                              {expenseGroup.subCategory}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-right text-xs font-bold text-redError">
                        -${expenseGroup.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-center">
                        <button
                          onClick={() => toggleCompanyExpenseExpansion(expenseKey)}
                          className="p-1.5 rounded-lg bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                          title={expandedCompanyExpenses.has(expenseKey) ? 'Qari Faahfaahinta' : 'Muuji Faahfaahinta'}
                        >
                          {expandedCompanyExpenses.has(expenseKey) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Compact Expanded Transaction Details */}
                    {expandedCompanyExpenses.has(expenseKey) && (
                      <tr>
                        <td colSpan={3} className="px-2 py-2 bg-lightGray/30 dark:bg-gray-700/30">
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-darkGray dark:text-gray-100 mb-1">
                              Kharashyada: {expenseGroup.category} - {expenseGroup.subCategory}
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-lightGray dark:divide-gray-600">
                                <thead className="bg-white dark:bg-gray-800">
                                  <tr>
                                    <th className="px-1 py-1 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Taariikhda</th>
                                    <th className="px-1 py-1 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Sharaxaad</th>
                                    <th className="px-1 py-1 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">Qiimaha</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-lightGray dark:divide-gray-600">
                                  {expenseGroup.transactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                                      <td className="px-1 py-1 whitespace-nowrap text-xs text-darkGray dark:text-gray-100">
                                        {new Date(transaction.date).toLocaleDateString()}
                                      </td>
                                      <td className="px-1 py-1 whitespace-nowrap text-xs text-mediumGray dark:text-gray-300">
                                        <div className="truncate max-w-[120px]">
                                        {transaction.description}
                                        </div>
                                      </td>
                                      <td className="px-1 py-1 whitespace-nowrap text-right text-xs font-semibold text-redError">
                                        -${transaction.amount.toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compact P&L Statement Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-3">
        <div className="flex justify-between items-center p-3 border-b border-lightGray dark:border-gray-700">
          <h3 className="text-sm font-semibold text-darkGray dark:text-gray-100">Faahfaahinta P&L</h3>
          <div className="flex space-x-2">
            <button className="bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-100 py-1.5 px-3 rounded-lg font-semibold flex items-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 shadow-sm text-xs">
                <Download size={14} className="mr-1"/> CSV
            </button>
            <button className="bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-100 py-1.5 px-3 rounded-lg font-semibold flex items-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 shadow-sm text-xs">
                <Printer size={14} className="mr-1"/> Print
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
            <thead className="bg-lightGray dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Taariikhda</th>
                <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Sharaxaad</th>
                <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca</th>
                <th scope="col" className="px-2 py-2 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Qiimaha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lightGray dark:divide-gray-700">
              {/* Project Income */}
              <tr>
                <td colSpan={4} className="p-2 text-left font-bold text-darkGray dark:text-gray-100 bg-lightGray dark:bg-gray-700 text-xs">DAKHLIGA MASHARUUCA</td>
              </tr>
              {projectIncomeItems.map(item => (
                <tr key={item.id} className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150">
                  <td className="p-2 whitespace-nowrap text-darkGray dark:text-gray-100 text-xs">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="p-2 whitespace-nowrap text-mediumGray dark:text-gray-300 text-xs">{item.description}</td>
                  <td className="p-2 whitespace-nowrap text-mediumGray dark:text-gray-300 text-xs">{item.type}</td>
                  <td className="p-2 whitespace-nowrap text-right font-semibold text-secondary text-xs">${item.amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} className="p-2 text-right font-bold text-darkGray dark:text-gray-100 text-xs">Wadarta Dakhliga Mashruuca:</td>
                <td className="p-2 whitespace-nowrap text-right font-bold text-secondary text-xs">${currentProjectIncome.toLocaleString()}</td>
              </tr>

              {/* Direct Project Costs */}
              <tr>
                <td colSpan={4} className="p-2 text-left font-bold text-darkGray dark:text-gray-100 bg-lightGray dark:bg-gray-700 text-xs">KHARASHYADA TOOSKA AH EE MASHARUUCA</td>
              </tr>
              {directProjectCostItems.map(item => (
                <tr key={item.id} className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150">
                  <td className="p-2 whitespace-nowrap text-darkGray dark:text-gray-100 text-xs">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="p-2 whitespace-nowrap text-mediumGray dark:text-gray-300 text-xs">{item.description}</td>
                  <td className="p-2 whitespace-nowrap text-mediumGray dark:text-gray-300 text-xs">{item.type}</td>
                  <td className="p-2 whitespace-nowrap text-right font-semibold text-redError text-xs">-${item.amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} className="p-2 text-right font-bold text-darkGray dark:text-gray-100 text-xs">Wadarta Kharashyada Tooska ah ee Mashruuca:</td>
                <td className="p-2 whitespace-nowrap text-right font-bold text-redError text-xs">-${currentDirectProjectCosts.toLocaleString()}</td>
              </tr>

              {/* Gross Profit (from Projects) */}
              <tr>
                <td colSpan={3} className="p-2 text-right font-bold text-darkGray dark:text-gray-100 bg-lightGray dark:bg-gray-700 text-xs">FAA'IIDADA GUUD EE MASHARUUCA:</td>
                <td className="p-2 whitespace-nowrap text-right font-bold text-primary bg-lightGray dark:bg-gray-700 text-xs">${currentGrossProfit.toLocaleString()}</td>
              </tr>

              {/* Operating Expenses */}
              <tr>
                <td colSpan={4} className="p-2 text-left font-bold text-darkGray dark:text-gray-100 bg-lightGray dark:bg-gray-700 text-xs">KHARASHYADA SHAQADA (OVERHEADS)</td>
              </tr>
              {operatingExpensesItems.map(item => (
                <tr key={item.id} className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150">
                  <td className="p-2 whitespace-nowrap text-darkGray dark:text-gray-100 text-xs">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="p-2 whitespace-nowrap text-mediumGray dark:text-gray-300 text-xs">{item.description}</td>
                  <td className="p-2 whitespace-nowrap text-mediumGray dark:text-gray-300 text-xs">{item.type}</td>
                  <td className="p-2 whitespace-nowrap text-right font-semibold text-redError text-xs">-${item.amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr>    
                <td colSpan={3} className="p-2 text-right font-bold text-darkGray dark:text-gray-100 text-xs">Wadarta Kharashyada Shaqada:</td>
                <td className="p-2 whitespace-nowrap text-right font-bold text-redError text-xs">-${currentOperatingExpenses.toLocaleString()}</td>
              </tr>

              {/* Net Profit */}
              <tr>
                <td colSpan={3} className="p-2 text-right font-bold text-darkGray dark:text-gray-100 bg-lightGray dark:bg-gray-700 text-xs">NET FAA'IIDADA SHAQADA:</td>
                <td className="p-2 whitespace-nowrap text-right font-bold text-secondary bg-lightGray dark:bg-gray-700 text-xs">${currentNetProfit.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Compact Export/Share Section */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm mb-3">
        <h3 className="text-xs font-semibold text-darkGray dark:text-gray-100 mb-2 flex items-center space-x-1">
          <Download size={16} className="text-primary"/> 
          <span>Soo Deji & Wadaag</span>
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={handleExportPDF} className="bg-blue-500 text-white py-1.5 px-2 rounded-lg font-semibold text-xs hover:bg-blue-600 transition duration-200 flex items-center justify-center space-x-1">
            <Download size={12} />
            <span>PDF</span>
          </button>
          <button onClick={handleExportCSV} className="bg-green-500 text-white py-1.5 px-2 rounded-lg font-semibold text-xs hover:bg-green-600 transition duration-200 flex items-center justify-center space-x-1">
            <Share2 size={12} />
            <span>CSV</span>
          </button>
          <button onClick={handleExportExcel} className="bg-orange-500 text-white py-1.5 px-2 rounded-lg font-semibold text-xs hover:bg-orange-600 transition duration-200 flex items-center justify-center space-x-1">
            <Upload size={12} />
            <span>Excel</span>
          </button>
          <button onClick={() => window.print()} className="bg-blue-600 text-white py-1.5 px-2 rounded-lg font-semibold text-xs hover:bg-blue-700 transition duration-200 flex items-center justify-center space-x-1">
            <Printer size={12} />
            <span>Print</span>
          </button>
          <button onClick={() => handleShare('email')} className="bg-green-600 text-white py-1.5 px-2 rounded-lg font-semibold text-xs hover:bg-green-700 transition duration-200 flex items-center justify-center space-x-1">
            <Mail size={12} />
            <span>Email</span>
          </button>
          <button onClick={() => handleShare('whatsapp')} className="bg-green-500 text-white py-1.5 px-2 rounded-lg font-semibold text-xs hover:bg-green-600 transition duration-200 flex items-center justify-center space-x-1">
            <MessageSquare size={12} />
            <span>WA</span>
          </button>
        </div>
      </div>

      {/* Compact Accounting Closure Section */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
        <h3 className="text-xs font-bold text-darkGray dark:text-gray-100 mb-2 flex items-center space-x-1">
          <CheckSquare size={16} className="text-secondary"/> 
          <span>Xisaab Xidhka</span>
        </h3>
        <p className="text-xs text-mediumGray dark:text-gray-400 mb-2">
          Xisaab xidhku waa habka lagu xiro xisaabaadkaaga dhamaadka bil ama sanad.
        </p>
        <div className="space-y-2">
            <div>
                <label htmlFor="closurePeriod" className="block text-xs font-medium text-darkGray dark:text-gray-300 mb-1">Dooro Muddada Xisaab Xidhka</label>
                <select id="closurePeriod" className="w-full p-2 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none text-xs">
                    <option value="">-- Dooro Muddada --</option>
                    <option value="monthly">Bishii</option>
                    <option value="quarterly">Saddexdii Biloodba</option>
                    <option value="yearly">Sannadkii</option>
                </select>
            </div>
            <div>
                <label htmlFor="closureDate" className="block text-xs font-medium text-darkGray dark:text-gray-300 mb-1">Taariikhda Xisaab Xidhka</label>
                <input type="date" id="closureDate" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-2 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary text-xs"/>
            </div>
        </div>
        <button className="mt-2 bg-primary text-white py-2 px-3 rounded-lg font-bold text-xs hover:bg-blue-700 transition duration-200 shadow-sm flex items-center justify-center w-full">
            <CheckSquare size={14} className="mr-1"/> Samee Xisaab Xidh
        </button>
        <p className="text-xs text-mediumGray dark:text-gray-500 mt-2">
            <Info size={12} className="inline mr-1 text-primary"/> Fadlan ogow in xisaab xidhka uu xiri doono xisaabaadkaaga muddadaas.
        </p>
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
