// app/expenses/page.tsx - Expenses List Page (Enhanced with Filter Tabs & Mobile Design)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/layouts/Layout';
import { 
  Plus, Search, Eye, Edit, Trash2, DollarSign, Package, Briefcase, Building,
  List, LayoutGrid, Filter, X, ChevronDown, ChevronUp, Check, XCircle
} from 'lucide-react';
import { calculateEmployeeSalary } from '../../lib/utils';

interface Expense {
  id: string;
  date: string;
  project?: { id: string; name: string };
  company?: { id: string; name: string };
  category: string;
  subCategory?: string;
  description: string;
  amount: number;
  paidFrom: string;
  accountName?: string;
  note?: string;
  approved?: boolean;
  status?: string;
  employeeId?: string; // NEW: Add employeeId for filtering
}

type FilterType = 'total' | 'company' | 'project';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: Filter data states
  const [projects, setProjects] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('company');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'pending'>('all');
  
  // NEW: Advanced filtering states
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<{start: string, end: string}>({start: '', end: ''});
  const [amountRangeFilter, setAmountRangeFilter] = useState<{min: string, max: string}>({min: '', max: ''});
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  useEffect(() => {
    fetchExpenses();
    fetchEmployees();
    fetchProjects();
    fetchVendors();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // NEW: Fetch additional filter data
  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors');
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  // Handle expense approval
  const handleApproveExpense = async (expenseId: string) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved: true }),
      });
      
      if (res.ok) {
        // Refresh expenses list
        fetchExpenses();
      } else {
        console.error('Failed to approve expense');
      }
    } catch (error) {
      console.error('Error approving expense:', error);
    }
  };

  // Handle expense rejection
  const handleRejectExpense = async (expenseId: string) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved: false }),
      });
      
      if (res.ok) {
        // Refresh expenses list
        fetchExpenses();
      } else {
        console.error('Failed to reject expense');
      }
    } catch (error) {
      console.error('Error rejecting expense:', error);
    }
  };

  // Filter expenses based on active filter and advanced filters
  const getFilteredExpenses = () => {
    let filtered = expenses.filter(expense =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.project?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply approval filter
    if (approvalFilter === 'approved') {
      filtered = filtered.filter(exp => exp.approved === true);
    } else if (approvalFilter === 'pending') {
      filtered = filtered.filter(exp => exp.approved === false);
    }

    // NEW: Apply advanced filters
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(exp => exp.category === categoryFilter);
    }

    if (projectFilter !== 'all') {
      filtered = filtered.filter(exp => exp.project?.id === projectFilter);
    }

    if (employeeFilter !== 'all') {
      filtered = filtered.filter(exp => exp.employeeId === employeeFilter);
    }

    // Date range filter
    if (dateRangeFilter.start) {
      filtered = filtered.filter(exp => new Date(exp.date) >= new Date(dateRangeFilter.start));
    }
    if (dateRangeFilter.end) {
      filtered = filtered.filter(exp => new Date(exp.date) <= new Date(dateRangeFilter.end));
    }

    // Amount range filter
    if (amountRangeFilter.min) {
      filtered = filtered.filter(exp => exp.amount >= parseFloat(amountRangeFilter.min));
    }
    if (amountRangeFilter.max) {
      filtered = filtered.filter(exp => exp.amount <= parseFloat(amountRangeFilter.max));
    }

    switch (activeFilter) {
      case 'company':
        // Show company expenses: salary expenses and general services (no project)
        return filtered.filter(exp => 
          !exp.project || 
          (exp.category === 'Company Expense' && exp.subCategory === 'Salary') ||
          (exp.category === 'Company Expense' && exp.subCategory === 'General Services')
        );
      case 'project':
        return filtered.filter(exp => exp.project);
      default:
        return filtered;
    }
  };

  const filteredExpenses = getFilteredExpenses();

  // NEW: Clear all filters function
  const clearAllFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setVendorFilter('all');
    setPaymentStatusFilter('all');
    setDateRangeFilter({start: '', end: ''});
    setAmountRangeFilter({min: '', max: ''});
    setProjectFilter('all');
    setEmployeeFilter('all');
    setApprovalFilter('all');
  };

  // Calculate statistics based on active filter
  const getStatistics = () => {
    // Total amount should always be from all expenses, not filtered
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalCount = expenses.length;
    
    // Company expenses: no project OR salary expenses OR general services
    const companyExpenses = expenses.filter(exp => 
      !exp.project || 
      (exp.category === 'Company Expense' && exp.subCategory === 'Salary') ||
      (exp.category === 'Company Expense' && exp.subCategory === 'General Services')
    );
    
    // Project expenses: has project
    const projectExpenses = expenses.filter(exp => exp.project);
    
    const companyAmount = companyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const projectAmount = projectExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    return { totalAmount, totalCount, companyAmount, projectAmount, companyCount: companyExpenses.length, projectCount: projectExpenses.length };
  };

  const stats = getStatistics();

  // Helper function to get salary calculation for an expense
  const getSalaryCalculation = (expense: Expense) => {
    if (expense.category === 'Company Expense' && expense.subCategory === 'Salary') {
      const employee = employees.find(emp => emp.id === expense.paidFrom);
      if (employee && employee.monthlySalary) {
        return calculateEmployeeSalary(
          Number(employee.monthlySalary),
          employee.startDate,
          expense.date,
          Number(employee.salaryPaidThisMonth || 0)
        );
      }
    }
    return null;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">Soo raridda kharashyada...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-darkGray dark:text-gray-100 mb-2">Kharashyada</h1>
          <p className="text-mediumGray dark:text-gray-400">Maamul iyo eegid kharashyada shirkadda</p>
        </div>
        <Link 
          href="/expenses/add" 
          className="bg-primary text-white px-4 lg:px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 flex items-center justify-center w-full lg:w-auto"
        >
          <Plus size={20} className="mr-2" />
          Ku Dar Kharash Cusub
        </Link>
      </div>


      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-4 lg:mb-6">
        {/* Total Expenses Card */}
        <div className="bg-white dark:bg-gray-800 p-3 lg:p-6 rounded-xl shadow-md border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-medium text-mediumGray dark:text-gray-400 truncate">Wadarta Kharashyada</p>
              <p className="text-lg lg:text-2xl font-bold text-darkGray dark:text-gray-100 truncate">{stats.totalAmount.toLocaleString()} ETB</p>
            </div>
            <DollarSign className="text-primary flex-shrink-0" size={20} />
          </div>
        </div>

        {/* Company Expenses Card */}
        <div className="bg-white dark:bg-gray-800 p-3 lg:p-6 rounded-xl shadow-md border-l-4 border-accent">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-medium text-mediumGray dark:text-gray-400 truncate">Kharashyada Shirkadda</p>
              <p className="text-lg lg:text-2xl font-bold text-darkGray dark:text-gray-100 truncate">{stats.companyAmount.toLocaleString()} ETB</p>
            </div>
            <Building className="text-accent flex-shrink-0" size={20} />
          </div>
        </div>

        {/* Project Expenses Card */}
        <div className="bg-white dark:bg-gray-800 p-3 lg:p-6 rounded-xl shadow-md border-l-4 border-accent sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-medium text-mediumGray dark:text-gray-400 truncate">Kharashyada Mashruucyada</p>
              <p className="text-lg lg:text-2xl font-bold text-darkGray dark:text-gray-100 truncate">{stats.projectAmount.toLocaleString()} ETB</p>
            </div>
            <Briefcase className="text-accent flex-shrink-0" size={20} />
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-md mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Raadi kharashyada..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center space-x-2 bg-lightGray dark:bg-gray-700 px-4 py-3 rounded-lg text-darkGray dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <Filter size={18} />
            <span>Filters</span>
            {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'list' 
                  ? 'bg-primary text-white' 
                  : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="List View"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'cards' 
                  ? 'bg-primary text-white' 
                  : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Cards View"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t border-lightGray dark:border-gray-700">
          <p className="text-mediumGray dark:text-gray-400 text-sm">
            Waxaa la helay <span className="font-semibold text-darkGray dark:text-gray-100">{filteredExpenses.length}</span> kharash
            <span> oo ka mid ah {activeFilter === 'company' ? 'shirkadda' : 'mashruucyada'}</span>
          </p>
        </div>
        
        {/* Small Filter Buttons */}
        <div className="flex justify-start mt-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter('company')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeFilter === 'company'
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-1">
                <Building size={14} />
                <span>Shirkadda</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveFilter('project')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeFilter === 'project'
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-1">
                <Briefcase size={14} />
                <span>Mashruucyada</span>
              </div>
            </button>

            {/* Approval Filter Buttons */}
            <button
              onClick={() => setApprovalFilter('all')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                approvalFilter === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-1">
                <span>Dhammaan</span>
              </div>
            </button>

            <button
              onClick={() => setApprovalFilter('pending')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                approvalFilter === 'pending'
                  ? 'bg-yellow-500 text-white shadow-sm'
                  : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-1">
                <span>Sugaya</span>
              </div>
            </button>

            <button
              onClick={() => setApprovalFilter('approved')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                approvalFilter === 'approved'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-1">
                <Check size={14} />
                <span>La Ansixiyay</span>
              </div>
            </button>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                showFilters
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-1">
                <Filter size={14} />
                <span>Filtarrada Dheeraadka Ah</span>
              </div>
            </button>
          </div>
        </div>

        {/* NEW: Advanced Filters Section - Ultra Compact Mobile Design */}
        {showFilters && (
          <div className="mt-3 p-2 bg-lightGray dark:bg-gray-700 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-semibold text-darkGray dark:text-gray-100">Filtarrada Dheeraadka Ah</h3>
              <button
                onClick={clearAllFilters}
                className="text-xs text-primary hover:text-blue-700 font-medium"
              >
                Dhammaan Ka Saar
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-darkGray dark:text-gray-300 mb-0.5">Nooca Kharashka</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-1.5 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 text-xs"
                  title="Dooro Nooca Kharashka"
                >
                  <option value="all">Dhammaan</option>
                  <option value="Material">Alaab</option>
                  <option value="Labor">Shaqaale</option>
                  <option value="Transport">Gaadiid</option>
                  <option value="Company Expense">Kharashka Shirkadda</option>
                </select>
              </div>

              {/* Project Filter */}
              <div>
                <label className="block text-xs font-medium text-darkGray dark:text-gray-300 mb-0.5">Mashruuc</label>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="w-full p-1.5 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 text-xs"
                  title="Dooro Mashruuca"
                >
                  <option value="all">Dhammaan</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              {/* Employee Filter */}
              <div>
                <label className="block text-xs font-medium text-darkGray dark:text-gray-300 mb-0.5">Shaqaale</label>
                <select
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="w-full p-1.5 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 text-xs"
                  title="Dooro Shaqaalaha"
                >
                  <option value="all">Dhammaan</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-xs font-medium text-darkGray dark:text-gray-300 mb-0.5">Taariikhda Bilowga</label>
                <input
                  type="date"
                  value={dateRangeFilter.start}
                  onChange={(e) => setDateRangeFilter({...dateRangeFilter, start: e.target.value})}
                  className="w-full p-1.5 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 text-xs"
                  title="Dooro Taariikhda Bilowga"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-darkGray dark:text-gray-300 mb-0.5">Taariikhda Dhamaadka</label>
                <input
                  type="date"
                  value={dateRangeFilter.end}
                  onChange={(e) => setDateRangeFilter({...dateRangeFilter, end: e.target.value})}
                  className="w-full p-1.5 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 text-xs"
                  title="Dooro Taariikhda Dhamaadka"
                />
              </div>

              {/* Amount Range Filter */}
              <div>
                <label className="block text-xs font-medium text-darkGray dark:text-gray-300 mb-0.5">Qiimaha Ugu Yar ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={amountRangeFilter.min}
                  onChange={(e) => setAmountRangeFilter({...amountRangeFilter, min: e.target.value})}
                  className="w-full p-1.5 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-darkGray dark:text-gray-300 mb-0.5">Qiimaha Ugu Badan ($)</label>
                <input
                  type="number"
                  placeholder="1000"
                  value={amountRangeFilter.max}
                  onChange={(e) => setAmountRangeFilter({...amountRangeFilter, max: e.target.value})}
                  className="w-full p-1.5 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expenses Display */}
      {viewMode === 'list' ? (
        /* Mobile-Optimized List View */
        <div className="space-y-3">
          {/* Mobile List View */}
          <div className="block lg:hidden">
            <div className="space-y-3">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-lightGray dark:border-gray-700 p-4">
                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {expense.project ? (
                        <Briefcase size={16} className="text-accent flex-shrink-0" />
                      ) : (
                        <Building size={16} className="text-accent flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-darkGray dark:text-gray-100 truncate">
                        {expense.project?.name || expense.company?.name || 'Shirkadda'}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-redError flex-shrink-0 ml-2">
                      -{expense.amount.toLocaleString()} ETB
                    </span>
                  </div>

                  {/* Description */}
                  <div className="text-sm text-darkGray dark:text-gray-100 mb-3 line-clamp-2">
                    {expense.description}
                  </div>

                  {/* Date and Category Row */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-xs text-mediumGray dark:text-gray-400">
                      {new Date(expense.date).toLocaleDateString('so-SO', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        expense.category === 'Material' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        expense.category === 'Labor' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        expense.category === 'Transport' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        expense.category === 'Company Expense' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {expense.category}
                      </span>
                      {expense.subCategory && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          expense.subCategory === 'Salary' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          expense.subCategory === 'Material' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' :
                          expense.subCategory === 'Equipment' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' :
                          expense.subCategory === 'Consultancy' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' :
                          expense.subCategory === 'Insurance' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {expense.subCategory}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Account and Actions Row */}
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-mediumGray dark:text-gray-400">
                      Account: {expense.accountName || expense.paidFrom}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        expense.approved 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {expense.approved ? 'La Ansixiyay' : 'Sugaya'}
                      </span>
                      <div className="flex space-x-1">
                        <Link
                          href={`/expenses/${expense.id}`}
                          className="p-1 text-mediumGray dark:text-gray-400 hover:text-primary transition-colors"
                          title="Eeg faahfaahinta"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          href={`/expenses/edit/${expense.id}`}
                          className="p-1 text-mediumGray dark:text-gray-400 hover:text-primary transition-colors"
                          title="Wax ka beddel"
                        >
                          <Edit size={14} />
                        </Link>
                        {!expense.approved && (
                          <>
                            <button
                              onClick={() => handleApproveExpense(expense.id)}
                              className="p-1 text-green-600 hover:text-green-700 transition-colors"
                              title="Ansixi"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleRejectExpense(expense.id)}
                              className="p-1 text-red-600 hover:text-red-700 transition-colors"
                              title="Diid"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Salary Calculation for Salary Expenses */}
                  {expense.category === 'Company Expense' && expense.subCategory === 'Salary' && (() => {
                    const salaryCalc = getSalaryCalculation(expense);
                    return salaryCalc ? (
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                        <div className="text-blue-800 dark:text-blue-300 font-medium">
                          {salaryCalc.totalMonths} bilood × {salaryCalc.monthlySalary.toLocaleString()} ETB = {salaryCalc.totalSalaryOwed.toLocaleString()} ETB
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <table className="min-w-full" style={{ minWidth: '1000px' }}>
                <thead className="bg-lightGray dark:bg-gray-700">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Taariikh</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Qaybta</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Mashruuc</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Sharaxaad</th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Qiimaha</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Account</th>
                    <th className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Xaalad</th>
                    <th className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-darkGray dark:text-gray-100">
                        {new Date(expense.date).toLocaleDateString('so-SO', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          expense.category === 'Material' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          expense.category === 'Labor' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          expense.category === 'Transport' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          expense.category === 'Company Expense' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {expense.category}
                        </span>
                        {expense.subCategory && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            expense.subCategory === 'Salary' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            expense.subCategory === 'Material' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' :
                            expense.subCategory === 'Equipment' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' :
                            expense.subCategory === 'Consultancy' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' :
                            expense.subCategory === 'Insurance' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {expense.subCategory}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {expense.project ? (
                          <Briefcase size={16} className="text-primary mr-2" />
                        ) : (
                          <Building size={16} className="text-orange-500 mr-2" />
                        )}
                        <span className="text-sm text-darkGray dark:text-gray-100">
                          {expense.project?.name || expense.company?.name || 'Shirkadda'}
                        </span>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-4 lg:px-6 py-3">
                      <div className="text-sm text-darkGray dark:text-gray-100 max-w-xs truncate" title={expense.description}>
                        {expense.description}
                      </div>
                      {expense.note && (
                        <div className="text-xs text-mediumGray dark:text-gray-400 mt-1 max-w-xs truncate" title={expense.note}>
                          {expense.note}
                        </div>
                      )}
                      {expense.category === 'Company Expense' && expense.subCategory === 'Salary' && (() => {
                        const salaryCalc = getSalaryCalculation(expense);
                        return salaryCalc ? (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                            <div className="text-blue-800 dark:text-blue-300 font-medium">
                              {salaryCalc.totalMonths} bilood × ${salaryCalc.monthlySalary.toLocaleString()} = ${salaryCalc.totalSalaryOwed.toLocaleString()}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </td>
                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap text-right">
                      <span className="text-base lg:text-lg font-bold text-redError">
                        -{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 lg:px-6 py-3 whitespace-nowrap">
                      <span className="text-sm text-darkGray dark:text-gray-100">{expense.accountName || expense.paidFrom}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        expense.approved 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {expense.approved ? 'La Ansixiyay' : 'Sugaya'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-1 lg:space-x-2">
                        <Link
                          href={`/expenses/${expense.id}`}
                          className="text-primary hover:text-blue-700 p-1 rounded hover:bg-primary/10 transition-colors duration-200"
                          title="Eeg faahfaahinta"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={`/expenses/edit/${expense.id}`}
                          className="text-accent hover:text-orange-700 p-1 rounded hover:bg-accent/10 transition-colors duration-200"
                          title="Wax ka beddel"
                        >
                          <Edit size={16} />
                        </Link>
                        {!expense.approved && (
                          <>
                            <button
                              onClick={() => handleApproveExpense(expense.id)}
                              className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-100 transition-colors duration-200"
                              title="Ansixi"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => handleRejectExpense(expense.id)}
                              className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-100 transition-colors duration-200"
                              title="Diid"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm('Ma hubtaa inaad rabto inaad tirtirto kharashkan?')) {
                              // Handle delete
                            }
                          }}
                          className="text-redError hover:text-red-700 p-1 rounded hover:bg-redError/10 transition-colors duration-200"
                          title="Tirtir"
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
        </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filteredExpenses.map((expense) => (
            <div key={expense.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border border-lightGray dark:border-gray-700">
              <div className="p-4 lg:p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    {expense.project ? (
                      <Briefcase size={18} className="text-primary mr-2" />
                    ) : (
                      <Building size={18} className="text-orange-500 mr-2" />
                    )}
                    <span className="text-sm font-medium text-mediumGray dark:text-gray-400">
                      {expense.project?.name || expense.company?.name || 'Shirkadda'}
                    </span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    expense.approved 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {expense.approved ? 'La Ansixiyay' : 'Sugaya'}
                  </span>
                </div>

                {/* Category & Date */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col space-y-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      expense.category === 'Material' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      expense.category === 'Labor' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      expense.category === 'Transport' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      expense.category === 'Company Expense' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {expense.category}
                    </span>
                    {expense.subCategory && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        expense.subCategory === 'Salary' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        expense.subCategory === 'Material' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' :
                        expense.subCategory === 'Equipment' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' :
                        expense.subCategory === 'Consultancy' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' :
                        expense.subCategory === 'Insurance' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {expense.subCategory}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-mediumGray dark:text-gray-400">
                    {new Date(expense.date).toLocaleDateString('so-SO', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>

                {/* Description */}
                <h3 className="text-base lg:text-lg font-semibold text-darkGray dark:text-gray-100 mb-2 line-clamp-2">
                  {expense.description}
                </h3>

                {/* Note */}
                {expense.note && (
                  <p className="text-sm text-mediumGray dark:text-gray-400 mb-3 line-clamp-2">
                    {expense.note}
                  </p>
                )}

                {/* Amount */}
                <div className="text-center mb-3">
                  <span className="text-2xl lg:text-3xl font-bold text-redError">
                    -{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-mediumGray dark:text-gray-400">Account:</span>
                    <span className="text-darkGray dark:text-gray-100 font-medium">{expense.accountName || expense.paidFrom}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-lightGray dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/expenses/${expense.id}`}
                      className="text-primary hover:text-blue-700 p-2 rounded-lg hover:bg-primary/10 transition-colors duration-200"
                      title="Eeg faahfaahinta"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      href={`/expenses/edit/${expense.id}`}
                      className="text-accent hover:text-orange-700 p-2 rounded-lg hover:bg-accent/10 transition-colors duration-200"
                      title="Wax ka beddel"
                    >
                      <Edit size={16} />
                    </Link>
                    {!expense.approved && (
                      <>
                        <button
                          onClick={() => handleApproveExpense(expense.id)}
                          className="text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-100 transition-colors duration-200"
                          title="Ansixi"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleRejectExpense(expense.id)}
                          className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-100 transition-colors duration-200"
                          title="Diid"
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Ma hubtaa inaad rabto inaad tirtirto kharashkan?')) {
                        // Handle delete
                      }
                    }}
                    className="text-redError hover:text-red-700 p-2 rounded-lg hover:bg-redError/10 transition-colors duration-200"
                    title="Tirtir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredExpenses.length === 0 && !loading && (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <Package size={64} className="mx-auto text-mediumGray dark:text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-2">Kharash Lama Helin</h3>
          <p className="text-mediumGray dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Waxaa la helay kharash ku haboon raadinta aad qortay. Fadlan beddel raadinta ama ka saar.'
              : `Wali kharash lama diiwaan gelin ${activeFilter === 'company' ? 'shirkadda' : 'mashruucyada'}. Ku dar kharash cusub si aad u bilowdo.`
            }
          </p>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
            >
              Ka Saar Raadinta
            </button>
          ) : (
            <Link
              href="/expenses/add"
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 inline-block"
            >
              Ku Dar Kharash Cusub
            </Link>
          )}
        </div>
      )}
    </Layout>
  );
}
