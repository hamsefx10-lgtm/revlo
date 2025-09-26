// app/reports/expenses/page.tsx - Expenses Report Page (10000% Design)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, DollarSign, Plus, Search, Filter, Calendar, 
  Download, Upload, Printer, Mail, MessageSquare, Send, 
  TrendingUp, TrendingDown, CheckCircle, XCircle, Info,
  Tag, Briefcase, CreditCard, Eye, Edit, Trash2,
  List, LayoutGrid, BarChart, PieChart, LineChart as LineChartIcon,
  CheckSquare, Clock as ClockIcon, FileText, ChevronRight, ChevronUp, ChevronDown // For approval, recurring, audit
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, 
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart as RechartsLineChart, Line
} from 'recharts';
import Toast from '../../../components/common/Toast'; // Reuse Toast component

// --- Types ---
interface Expense {
  id: string;
  date: string;
  project: string;
  category: string;
  description: string;
  amount: number;
  paidFrom: string;
  note: string;
  approved: boolean;
}
interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  nextDueDate: string;
}

// --- Dummy Data ---
const dummyExpenses = [
  { id: 'exp001', date: '2025-07-23', project: 'Furniture Project A', category: 'Material', description: 'Oak Wood', amount: 3000, paidFrom: 'Ebirr', note: 'Large order for new project.', approved: true },
  { id: 'exp002', date: '2025-07-22', project: 'Office Setup B', category: 'Labor', description: 'Cali Xasan - Assembly', amount: 1500, paidFrom: 'CBE', note: '', approved: false }, // Pending approval
  { id: 'exp003', date: '2025-07-21', project: 'Restaurant Decor C', category: 'Transport', description: 'Delivery of materials', amount: 200, paidFrom: 'Cash', note: 'Urgent delivery.', approved: true },
  { id: 'exp004', date: '2025-07-20', project: 'Internal', category: 'Office Supplies', description: 'Pens, paper, ink', amount: 120, paidFrom: 'CBE', note: '', approved: true },
  { id: 'exp005', date: '2025-07-19', project: 'Furniture Project A', category: 'Labor', description: 'Axmed Maxamed - Painting', amount: 800, paidFrom: 'Ebirr', note: 'Finish work.', approved: false }, // Pending approval
  { id: 'exp006', date: '2025-07-18', project: 'Office Setup B', category: 'Material', description: 'Glass panels', amount: 2500, paidFrom: 'CBE', note: 'Custom cut.', approved: true },
  { id: 'exp007', date: '2025-07-17', project: 'Internal', category: 'Salary', description: 'Monthly Salary - Maxamed Cali', amount: 2000, paidFrom: 'CBE', note: 'July Salary', approved: true },
  { id: 'exp008', date: '2025-07-16', project: 'Internal', category: 'Debt', description: 'Loan taken from Bank X', amount: 5000, paidFrom: 'Cash', note: 'For new equipment', approved: true },
  { id: 'exp009', date: '2025-07-15', project: 'Internal', category: 'Office Rent', description: 'July Office Rent', amount: 1000, paidFrom: 'Ebirr', note: 'Monthly payment', approved: true },
  { id: 'exp010', date: '2025-07-14', project: 'Internal', category: 'Debt Repayment', description: 'Repayment to Bank X', amount: 500, paidFrom: 'CBE', note: 'First installment', approved: true },
  { id: 'exp011', date: '2025-06-28', project: 'Furniture Project A', category: 'Material', description: 'Pine Wood', amount: 1800, paidFrom: 'Ebirr', note: 'New batch', approved: true },
  { id: 'exp012', date: '2025-06-25', project: 'Internal', category: 'Salary', description: 'Monthly Salary - Faadumo Axmed', amount: 1800, paidFrom: 'CBE', note: 'June Salary', approved: true },
  { id: 'exp013', date: '2025-06-20', project: 'Restaurant Decor C', category: 'Transport', description: 'Delivery of chairs', amount: 300, paidFrom: 'Cash', note: '', approved: true },
];

const dummyRecurringExpenses = [
    { id: 'rec001', name: 'Office Rent', amount: 1000, frequency: 'Monthly', nextDueDate: '2025-08-15' },
    { id: 'rec002', name: 'Internet Bill', amount: 150, frequency: 'Monthly', nextDueDate: '2025-08-05' },
];

// Helper for chart colors
const CHART_COLORS = ['#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#9B59B6', '#1ABC9C', '#34495E', '#A0A0A0', '#FFD700', '#FF6347', '#4682B4'];

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

// Helper function to aggregate data for charts
function aggregateExpensesByMonth(expenses: Expense[], categories: string[]) {
  type MonthlyData = { month: string; total: number } & { [key: string]: number | string };
  const monthlyDataMap: { [key: string]: MonthlyData } = {};
  expenses.forEach((exp: Expense) => {
      const monthYear = new Date(exp.date).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyDataMap[monthYear]) {
          // Assign month and total, and initialize each category to 0
          monthlyDataMap[monthYear] = { month: monthYear, total: 0 };
          categories.forEach((c: string) => { monthlyDataMap[monthYear][c] = 0; });
      }
      monthlyDataMap[monthYear].total = (monthlyDataMap[monthYear].total as number) + exp.amount;
      monthlyDataMap[monthYear][exp.category] = (monthlyDataMap[monthYear][exp.category] as number) + exp.amount;
  });
  // Sort by date ascending
  return Object.values(monthlyDataMap).sort((a, b) => {
    const aDate = new Date(a.month as string);
    const bDate = new Date(b.month as string);
    return aDate.getTime() - bDate.getTime();
  });
}

// --- Expenses Page Component ---
export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterProject, setFilterProject] = useState('All');
  const [filterPaidFrom, setFilterPaidFrom] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState('All'); // New filter for approval status
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list'); 
  const [showChartSection, setShowChartSection] = useState(true); 
  const [activeChartType, setActiveChartType] = useState<'line' | 'bar' | 'pie'>('line'); 

  // --- API Data States ---
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- Fetch Expenses Data ---
  useEffect(() => {
    async function fetchExpenses() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/accounting/reports/expenses');
        if (!res.ok) throw new Error('Failed to fetch expenses data');
        const data = await res.json();
        setExpenses(data.expenses || []);
        setRecurringExpenses(data.recurringExpenses || []);
        setToastMessage({ message: 'Warbixinta kharashaadka si guul leh ayaa la soo geliyay!', type: 'success' });
      } catch (err: any) {
        setError(err.message || 'Error fetching expenses data');
        setToastMessage({ message: err.message || 'Cilad ayaa dhacday marka warbixinta la soo gelinayay.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchExpenses();
  }, []);

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (expense.project && expense.project.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (expense.note && expense.note.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'All' || expense.category === filterCategory;
    const matchesProject = filterProject === 'All' 
                           ? true 
                           : filterProject === 'Internal' 
                             ? !expense.project || expense.project === 'Internal' 
                             : expense.project === filterProject; 
    const matchesPaidFrom = filterPaidFrom === 'All' || expense.paidFrom === filterPaidFrom;
    const matchesDate = filterDateRange === 'All' ? true : true; 
    const matchesApproval = filterApprovalStatus === 'All' || 
                            (filterApprovalStatus === 'Approved' && expense.approved) || 
                            (filterApprovalStatus === 'Pending' && !expense.approved);

    return matchesSearch && matchesCategory && matchesProject && matchesPaidFrom && matchesDate && matchesApproval;
  });

  // Define categories from API data
  const categories: string[] = Array.from(new Set(expenses.map((e: Expense) => e.category)));

  // Dynamic filter options from API data
  const projects = ['All', 'Internal', ...Array.from(new Set(expenses.map((e: Expense) => e.project).filter(Boolean)))];
  const paidFromOptions = ['All', ...Array.from(new Set(expenses.map((e: Expense) => e.paidFrom).filter(Boolean)))];
  const dateRanges = ['All', 'Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'This Quarter', 'This Year'];
  const approvalStatuses = ['All', 'Approved', 'Pending'];

  // Expense Statistics
  const totalExpensesAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const expensesCount = filteredExpenses.length;
  const averageExpense = expensesCount > 0 ? totalExpensesAmount / expensesCount : 0;
  const pendingApprovalCount = filteredExpenses.filter(exp => !exp.approved).length;
  const approvedExpensesAmount = filteredExpenses.filter(exp => exp.approved).reduce((sum, exp) => sum + exp.amount, 0);

  // Data for Category Pie Chart (used for Pie and other charts if applicable)
  const categoryData = categories.filter(cat => cat !== 'All').map(cat => ({
    name: cat,
    value: filteredExpenses.filter(exp => exp.category === cat).reduce((sum, exp) => sum + exp.amount, 0),
  })).filter(item => typeof item.value === 'number' && item.value > 0);


  // Helper function to aggregate data for charts
  const aggregateExpensesByMonth = (expenses: Expense[], categories: string[]) => {
    type MonthlyData = { month: string; total: number } & { [key: string]: number | string };
    const monthlyDataMap: { [key: string]: MonthlyData } = {};
    expenses.forEach((exp: Expense) => {
        const monthYear = new Date(exp.date).toLocaleString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyDataMap[monthYear]) {
            // Assign month and total, and initialize each category to 0
            monthlyDataMap[monthYear] = { month: monthYear, total: 0 };
            categories.forEach((c: string) => { monthlyDataMap[monthYear][c] = 0; });
        }
        monthlyDataMap[monthYear].total = (monthlyDataMap[monthYear].total as number) + exp.amount;
        monthlyDataMap[monthYear][exp.category] = (monthlyDataMap[monthYear][exp.category] as number) + exp.amount;
    });
    // Sort by date ascending
    return Object.values(monthlyDataMap).sort((a, b) => {
      const aDate = new Date(a.month as string);
      const bDate = new Date(b.month as string);
      return aDate.getTime() - bDate.getTime();
    });
  };

  // Data for Monthly Trend Chart (Line/Bar)
  const monthlyExpensesData = aggregateExpensesByMonth(filteredExpenses, categories); 

  const PIE_COLORS = ['#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#9B59B6', '#1ABC9C', '#34495E', '#A0A0A0', '#FFD700', '#FF6347', '#4682B4']; 

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
  const RADIAN = Math.PI / 180; 

// --- Expense Table Row Component ---
const ExpenseRow: React.FC<{ expense: typeof dummyExpenses[0]; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ expense, onEdit, onDelete }) => (
  <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
    <td className="p-2 lg:p-4 whitespace-nowrap text-darkGray dark:text-gray-100 text-sm lg:text-base">{new Date(expense.date).toLocaleDateString()}</td>
    <td className="p-2 lg:p-4 whitespace-nowrap text-mediumGray dark:text-gray-300 text-sm lg:text-base">{expense.project || 'Internal'}</td>
    <td className="p-2 lg:p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium flex items-center space-x-2">
      <Tag size={16} className="text-primary"/> <span className="text-sm lg:text-base">{String(expense.category)}</span>
    </td>
    <td className="p-2 lg:p-4 whitespace-nowrap text-redError font-semibold text-sm lg:text-base">-${expense.amount.toLocaleString()}</td>
    <td className="p-2 lg:p-4 whitespace-nowrap text-mediumGray dark:text-gray-300 text-sm lg:text-base">{expense.paidFrom}</td>
    <td className="p-2 lg:p-4 text-mediumGray dark:text-gray-300 truncate max-w-xs text-sm lg:text-base">{expense.note || 'N/A'}</td>
    <td className="p-2 lg:p-4 whitespace-nowrap text-center">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            expense.approved ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent'
        }`}>
            {expense.approved ? 'Approved' : 'Pending'}
        </span>
    </td>
    <td className="p-2 lg:p-4 whitespace-nowrap text-right">
      <div className="flex items-center justify-end space-x-1 lg:space-x-2">
        <button className="p-1 lg:p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View Details">
          <Eye size={16} />
        </button>
        <button className="p-1 lg:p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Expense">
          <Edit size={16} />
        </button>
        <button className="p-1 lg:p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Expense">
          <Trash2 size={16} />
        </button>
      </div>
    </td>
  </tr>
);

// --- Expense Card Component (for Mobile View) ---
const ExpenseCard: React.FC<{ expense: typeof dummyExpenses[0]; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ expense, onEdit, onDelete }) => (
    <div className={`bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-xl shadow-md animate-fade-in-up border-l-4 border-redError relative`}>
        <div className="flex justify-between items-start mb-3">
            <h4 className="font-semibold text-darkGray dark:text-gray-100 text-base lg:text-lg flex items-center space-x-2">
                <DollarSign size={18} className="text-redError"/> <span>{expense.description}</span>
            </h4>
            <span className="text-redError font-bold text-base lg:text-lg">-${expense.amount.toLocaleString()}</span>
        </div>
    <p className="text-xs lg:text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
      <Briefcase size={14}/> <span>Mashruuc: {expense.project || 'Internal'}</span>
    </p>
    <p className="text-xs lg:text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
      <Tag size={14} className="text-secondary"/> <span>Nooca: {String(expense.category)}</span>
    </p>
        <p className="text-xs lg:text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
            <Calendar size={14}/> <span>Taariikhda: {new Date(expense.date).toLocaleDateString()}</span>
        </p>
        <p className="text-xs lg:text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
            <CreditCard size={14}/> <span>Laga Bixiyay: {expense.paidFrom}</span>
        </p>
        <p className="text-xs lg:text-sm text-mediumGray dark:text-gray-400 mt-2 p-2 bg-lightGray dark:bg-gray-700 rounded-lg border border-lightGray dark:border-gray-600">
            <Info size={14} className="inline mr-1 text-primary"/> {expense.note || 'Ma jiraan fiiro gaar ah.'}
        </p>
        <div className="flex justify-end space-x-2 mt-3">
            <button className="p-1 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View Details">
                <Eye size={16} />
            </button>
            <button className="p-1 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Expense">
                <Edit size={16} />
            </button>
            <button className="p-1 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Expense">
                <Trash2 size={16} />
            </button>
        </div>
    </div>
);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[400px] text-darkGray dark:text-gray-100">
        <span className="animate-spin mr-3"><DollarSign size={32} className="text-primary" /></span> Warbixinta Kharashaadka ayaa soo dhacaya...
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

  return (
    <Layout>
      {/* Mobile-Responsive Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <h1 className="text-2xl lg:text-4xl font-bold text-darkGray dark:text-gray-100">Expenses</h1>
        <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/expenses/import" className="bg-primary text-white py-2 lg:py-2.5 px-4 lg:px-6 rounded-lg font-bold text-sm lg:text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center justify-center" title="Import Bulk Expenses">
                <Upload className="mr-2" size={18} /> Import Bulk
            </Link>
            <Link href="/expenses/add" className="bg-secondary text-white py-2 lg:py-2.5 px-4 lg:px-6 rounded-lg font-bold text-sm lg:text-lg hover:bg-green-600 transition duration-200 shadow-md flex items-center justify-center" title="Add New Expense">
                <Plus className="mr-2" size={18} /> Add New Expense
            </Link>
            <button 
              onClick={() => window.print()} 
              className="bg-accent text-white py-2 lg:py-2.5 px-4 lg:px-6 rounded-lg font-bold text-sm lg:text-lg hover:bg-orange-600 transition duration-200 shadow-md flex items-center justify-center"
              title="Print Report"
            >
              <Printer className="mr-2" size={18} /> Print Report
            </button>
        </div>
      </div>

      {/* Expense Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8 animate-fade-in-up">
          <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-md text-center">
              <h4 className="text-sm lg:text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Kharashyada</h4>
              <p className="text-2xl lg:text-3xl font-extrabold text-redError">-${totalExpensesAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-md text-center">
              <h4 className="text-sm lg:text-lg font-semibold text-mediumGray dark:text-gray-400">Kharashyada La Ansixiyay</h4>
              <p className="text-2xl lg:text-3xl font-extrabold text-secondary">-${approvedExpensesAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-md text-center">
              <h4 className="text-sm lg:text-lg font-semibold text-mediumGray dark:text-gray-400">Sugaya Ansixinta</h4>
              <p className="text-2xl lg:text-3xl font-extrabold text-accent">{pendingApprovalCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-md text-center">
              <h4 className="text-sm lg:text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Diiwaanka</h4>
              <p className="text-2xl lg:text-3xl font-extrabold text-primary">{expensesCount}</p>
          </div>
      </div>

      {/* Search, Filter & View Mode Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-md mb-6 lg:mb-8 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 animate-fade-in-up">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by description, project, or note..."
            className="w-full p-2 lg:p-3 pl-9 lg:pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 text-sm lg:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Filter by Category */}
        <div className="relative w-full md:w-48">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
          <select
            title="Filter by Category"
            className="w-full p-2 lg:p-3 pl-9 lg:pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none text-sm lg:text-base"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={18} />
          </div>
        </div>
        {/* Filter by Project */}
        <div className="relative w-full md:w-48">
          <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
          <select
            title="Filter by Project"
            className="w-full p-2 lg:p-3 pl-9 lg:pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none text-sm lg:text-base"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          >
            {projects.map(proj => <option key={proj} value={proj}>{proj}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={18} />
          </div>
        </div>
        {/* Filter by Approval Status */}
        <div className="relative w-full md:w-48">
          <CheckSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <select
            title="Filter by Approval Status"
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterApprovalStatus}
            onChange={(e) => setFilterApprovalStatus(e.target.value)}
          >
            {approvalStatuses.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
        {/* Filter by Paid From */}
        <div className="relative w-full md:w-48">
          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <select
            title="Filter by Paid From"
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterPaidFrom}
            onChange={(e) => setFilterPaidFrom(e.target.value)}
          >
            {paidFromOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
        {/* Filter by Date Range */}
        <div className="relative w-full md:w-48">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <select
            title="Filter by Date Range"
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
          >
            {dateRanges.map(range => <option key={range} value={range}>{range}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
        {/* View Mode Toggle */}
        <div className="flex space-x-2 w-full md:w-auto justify-center">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`} title="List View">
                <List size={20} />
            </button>
            <button onClick={() => setViewMode('cards')} className={`p-2 rounded-lg ${viewMode === 'cards' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`} title="Cards View">
                <LayoutGrid size={20} />
            </button>
        </div>
      </div>

      {/* Expense Chart Section - Toggleable */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">Expense Analysis</h3>
              <div className="flex items-center space-x-2">
                  {/* Chart Type Selectors (small, subtle icons) */}
                  <button onClick={() => setActiveChartType('line')} className={`p-1 rounded-full ${activeChartType === 'line' ? 'bg-primary text-white' : 'text-mediumGray dark:text-gray-400 hover:bg-lightGray dark:hover:bg-gray-700'} transition-colors duration-200`} title="Line Chart">
                      <LineChartIcon size={20} />
                  </button>
                  <button onClick={() => setActiveChartType('bar')} className={`p-1 rounded-full ${activeChartType === 'bar' ? 'bg-primary text-white' : 'text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-700'} transition-colors duration-200`} title="Bar Chart">
                      <BarChart size={20} />
                  </button>
                  <button onClick={() => setActiveChartType('pie')} className={`p-1 rounded-full ${activeChartType === 'pie' ? 'bg-primary text-white' : 'text-mediumGray dark:text-gray-400'} hover:bg-lightGray dark:hover:bg-gray-700'} transition-colors duration-200`} title="Pie Chart">
                      <PieChart size={20} />
                  </button>
                  {/* Toggle Chart Section Visibility */}
                  <button onClick={() => setShowChartSection(!showChartSection)} className="p-1 rounded-full text-mediumGray dark:text-gray-400 hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-200">
                      {showChartSection ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </button>
              </div>
          </div>
          
          {showChartSection && (
              <div className="h-80 w-full animate-fade-in"> {/* Added height and fade-in */}
                  <ResponsiveContainer width="100%" height="100%">
                      <>
                      {activeChartType === 'line' && (
                          <RechartsLineChart data={monthlyExpensesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" vertical={false} />
                              <XAxis dataKey="month" stroke="#7F8C8D" className="dark:text-gray-400 text-sm" />
                              <YAxis stroke="#7F8C8D" className="dark:text-gray-400 text-sm" />
                              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px' }} labelStyle={{ color: '#2C3E50', fontWeight: 'bold' }} itemStyle={{ color: '#2C3E50' }} />
                              <Legend />
                              {categories.filter(cat => cat !== 'All').map((cat, idx) => (
                                <Line key={cat} type="monotone" dataKey={cat} stroke={PIE_COLORS[idx % PIE_COLORS.length]} name={cat} />
                              ))}
                          </RechartsLineChart>
                      )}
                      {activeChartType === 'bar' && (
                          <RechartsBarChart data={monthlyExpensesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" vertical={false} />
                              <XAxis dataKey="month" stroke="#7F8C8D" className="dark:text-gray-400 text-sm" />
                              <YAxis stroke="#7F8C8D" className="dark:text-gray-400 text-sm" />
                              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px' }} labelStyle={{ color: '#2C3E50', fontWeight: 'bold' }} itemStyle={{ color: '#2C3E50' }} />
                              <Legend />
                              {categories.filter(cat => cat !== 'All').map((cat, idx) => (
                                <Bar key={cat} dataKey={cat} fill={PIE_COLORS[idx % PIE_COLORS.length]} name={cat} radius={[5, 5, 0, 0]} />
                              ))}
                          </RechartsBarChart>
                      )}
                    {activeChartType === 'pie' && categoryData.length > 0 && (
                      <RechartsPieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={120}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px' }}
                          labelStyle={{ color: '#2C3E50', fontWeight: 'bold' }}
                          itemStyle={{ color: '#2C3E50' }}
                        />
                        <Legend align="right" verticalAlign="middle" layout="vertical" wrapperStyle={{ paddingLeft: '20px' }} />
                      </RechartsPieChart>
                    )}
                      {/* Handle no data for charts */}
                    {activeChartType === 'pie' && categoryData.length === 0 && (
                      <div className="flex items-center justify-center h-full text-mediumGray dark:text-gray-500">No data for Pie Chart.</div>
                    )}
                    {(activeChartType === 'line' || activeChartType === 'bar') && Array.isArray(monthlyExpensesData) && monthlyExpensesData.length === 0 && (
                      <div className="flex items-center justify-center h-full text-mediumGray dark:text-gray-500">No data for this chart type.</div>
                    )}
                      </>
                  </ResponsiveContainer>
              </div>
          )}
          {!showChartSection && (
              <div className="h-20 flex items-center justify-center text-mediumGray dark:text-gray-500 animate-fade-in">
                  Charts section is collapsed.
              </div>
          )}
      </div>


      {/* Expenses View */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in">
          No expenses found matching your criteria.
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
              <thead className="bg-lightGray dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Project</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Paid From</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Note</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-lightGray dark:divide-gray-700">
              {filteredExpenses.map(expense => (
                <ExpenseRow 
                  key={expense.id} 
                  expense={expense} 
                  onEdit={(id) => console.log(`Edit expense with id: ${id}`)} 
                  onDelete={(id) => console.log(`Delete expense with id: ${id}`)} 
                />
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Placeholder */}
        <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
            <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Hore</button>
            <span className="text-sm text-darkGray dark:text-gray-100">Bogga 1 ee {Math.ceil(filteredExpenses.length / 10) || 1}</span>
            <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Xiga</button>
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredExpenses.map(expense => (
                <ExpenseCard 
                  key={expense.id} 
                  expense={expense} 
                  onEdit={(id) => console.log(`Edit expense with id: ${id}`)} 
                  onDelete={(id) => console.log(`Delete expense with id: ${id}`)} 
                />
            ))}
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
