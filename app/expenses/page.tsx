// app/expenses/page.tsx - Expenses List Page (Premium Design & Mobile Optimized)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/layouts/Layout';
import {
  Plus, Search, Eye, Trash2, Filter, X, Pencil,
  Truck, Coffee, Zap, Wrench, Wallet,
  User, Store, Package, Building2, Briefcase, SlidersHorizontal, Calendar,
  MoreHorizontal, ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight
} from 'lucide-react';
import { emitExpenseChange } from '@/lib/client-events';

interface Expense {
  id: string;
  date: string;
  project?: { id: string; name: string };
  company?: { id: string; name: string };
  customer?: { id: string; name: string };
  vendor?: { id: string; name: string };
  category: string;
  subCategory?: string;
  description: string;
  amount: number;
  paidFrom: string;
  accountName?: string;
  note?: string;
  approved?: boolean;
  status?: string;
  employeeId?: string;
  employee?: { id: string; name: string };
}

type FilterType = 'all' | 'company' | 'projects';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/expenses');
        if (res.ok) {
          const data = await res.json();
          setExpenses(data.expenses || []);
          const cats = new Set<string>();
          (data.expenses || []).forEach((e: any) => { if (e.category) cats.add(e.category); });
          setCategories(Array.from(cats).sort());
        }
      } catch (error) { console.error(error); }
      setLoading(false);
    };
    fetchData();
  }, []);

  const deleteExpense = async (expense: Expense) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      const projectId = expense?.project?.id;
      const res = await fetch(`/api/expenses/${expense.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      if (projectId) emitExpenseChange({ projectId, expenseId: expense.id, action: 'delete' });
      setExpenses(prev => prev.filter(e => e.id !== expense.id));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(expense.id); return n; });
    } catch (e) { console.error(e); }
  };

  const cleanDescription = (exp: Expense) => {
    let desc = exp.description || '';
    desc = desc.replace(/\s?-?\s?\d{4}-\d{2}-\d{2}/g, '').trim();
    if (exp.employee?.name) {
      desc = desc.replace(new RegExp(`Salary payment for\\s+${exp.employee.name}`, 'gi'), 'Salary Payment').trim();
    }
    const genericTerms = ['expense', 'material expense', 'salary payment', 'payment'];
    if (!desc || genericTerms.includes(desc.toLowerCase())) {
      return '';
    }
    return desc;
  };

  const getDescriptionOrNote = (exp: Expense) => {
    const cleaned = cleanDescription(exp);
    if (cleaned) return cleaned;
    if (exp.note && exp.note.trim()) return exp.note;
    if (exp.subCategory) return exp.subCategory;
    return <span className="text-gray-300 italic">No description</span>;
  };

  const getFilteredExpenses = () => {
    let filtered = expenses.filter(expense =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.project?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.vendor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.note || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeFilter === 'company') filtered = filtered.filter(exp => !exp.project || (exp.category === 'Company Expense' && exp.subCategory === 'Salary'));
    if (activeFilter === 'projects') filtered = filtered.filter(exp => exp.project);

    if (approvalFilter !== 'all') filtered = filtered.filter(exp => approvalFilter === 'approved' ? exp.approved : !exp.approved);
    if (categoryFilter !== 'all') filtered = filtered.filter(exp => exp.category === categoryFilter);
    if (dateRange.start) filtered = filtered.filter(exp => new Date(exp.date) >= new Date(dateRange.start));
    if (dateRange.end) filtered = filtered.filter(exp => new Date(exp.date) <= new Date(dateRange.end));

    return filtered;
  };

  const filteredExpenses = getFilteredExpenses();
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: expenses.reduce((s, e) => s + e.amount, 0),
    company: expenses.filter(e => !e.project).reduce((s, e) => s + e.amount, 0),
    project: expenses.filter(e => e.project).reduce((s, e) => s + e.amount, 0),
  };

  const isSelected = (id: string) => selectedIds.has(id);
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  if (loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="animate-pulse font-medium">Loading Expenses...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8 animate-in fade-in pb-20 md:pb-6">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 px-4 md:px-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Expenses</h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Track and manage your spending efficiently.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="hidden md:flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
              {['all', 'company', 'projects'].map(t => (
                <button key={t} onClick={() => setActiveFilter(t as any)}
                  className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${activeFilter === t ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-white transform scale-105' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>
                  {t}
                </button>
              ))}
            </div>
            <Link href="/expenses/add" className="flex-1 md:flex-none bg-primary hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
              <Plus size={18} strokeWidth={3} /> <span className="hidden md:inline">New Expense</span><span className="md:hidden">Add</span>
            </Link>
          </div>
        </header>

        {/* MOBILE FILTER TABS */}
        <div className="md:hidden flex overflow-x-auto gap-2 px-4 pb-2 no-scrollbar">
          {['all', 'company', 'projects'].map(t => (
            <button key={t} onClick={() => setActiveFilter(t as any)}
              className={`flex-none px-4 py-2 rounded-full text-xs font-bold uppercase transition-all border ${activeFilter === t ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-500 border-gray-200'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-0">
          {[
            {
              title: 'Total Spending',
              value: stats.total,
              icon: <div className="p-3 rounded-full bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300"><Wallet size={24} strokeWidth={2} /></div>,
              border: 'border-l-[6px] border-blue-500',
              textColor: 'text-blue-500'
            },
            {
              title: 'Company Ops',
              value: stats.company,
              icon: <div className="p-3 rounded-full bg-green-50 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300"><Building2 size={24} strokeWidth={2} /></div>,
              border: 'border-l-[6px] border-green-500',
              textColor: 'text-green-500'
            },
            {
              title: 'Project Costs',
              value: stats.project,
              icon: <div className="p-3 rounded-full bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300"><Briefcase size={24} strokeWidth={2} /></div>,
              border: 'border-l-[6px] border-orange-500',
              textColor: 'text-orange-500'
            },
          ].map((stat, idx) => (
            <div key={idx} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col items-center justify-center text-center group ${stat.border}`}>
              <div className="mb-3">
                {stat.icon}
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.title}</p>
              <h3 className={`text-3xl font-black ${stat.textColor}`}>
                {stat.value.toLocaleString()}
                <span className="text-[10px] text-gray-400 font-medium ml-1 align-top">ETB</span>
              </h3>
            </div>
          ))}
        </div>

        {/* SEARCH & FILTERS CONTROLS */}
        <div className="mx-4 md:mx-0 relative z-0 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-2 transition-all duration-300 hover:shadow-xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search expenses by desc, category, project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-transparent text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`px-6 py-3 md:py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${showFilters ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>
            <SlidersHorizontal size={16} /> <span className="md:hidden">More </span>Filters
          </button>
        </div>

        {/* EXPANDED FILTERS PANEL */}
        {showFilters && (
          <div className="mx-4 md:mx-0 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl z-10 relative animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Filter size={16} className="text-primary" />
                Advanced Filters
              </h3>
              <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Status</label>
                <select value={approvalFilter} onChange={(e: any) => setApprovalFilter(e.target.value)} className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 ring-primary/30 focus:border-primary transition-all">
                  <option value="all">All Status</option>
                  <option value="approved">✓ Approved</option>
                  <option value="pending">⏳ Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Category</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 ring-primary/30 focus:border-primary transition-all">
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={dateRange.start} onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 ring-primary/30 focus:border-primary transition-all" placeholder="Start Date" />
                  <input type="date" value={dateRange.end} onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 ring-primary/30 focus:border-primary transition-all" placeholder="End Date" />
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing <span className="font-bold text-primary">{filteredExpenses.length}</span> of <span className="font-bold">{expenses.length}</span> expenses
              </p>
              <button
                onClick={() => {
                  setApprovalFilter('all');
                  setCategoryFilter('all');
                  setDateRange({ start: '', end: '' });
                }}
                className="text-xs font-bold text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* --- DESKTOP VIEW: TABLE --- */}
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 whitespace-nowrap">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-2">Payee / Project</div>
            <div className="col-span-1 text-right">Amount</div>
            <div className="col-span-1 text-center">Actions</div>
          </div>

          {paginatedExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Package size={48} className="mb-4 opacity-20" />
              <p className="font-medium">No expenses found matching your filters.</p>
            </div>
          ) : paginatedExpenses.map((exp, idx) => {
            // Helper for dynamic colors
            const getCategoryStyle = (cat: string) => {
              const c = cat.toLowerCase();
              if (c.includes('labor') || c.includes('salary')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700';
              if (c.includes('material')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-700';
              if (c.includes('food')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-700';
              if (c.includes('taxi') || c.includes('transport')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
              return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
            };

            const initials = exp.employee?.name
              ? exp.employee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
              : exp.vendor?.name
                ? exp.vendor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : '?';

            return (
              <div key={exp.id} className={`relative grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-lg hover:z-10 hover:scale-[1.005] group rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-gray-600 ${idx !== paginatedExpenses.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>

                {/* Hover Indicator Line */}
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="col-span-1 text-center">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" checked={isSelected(exp.id)} onChange={() => toggleSelect(exp.id)} />
                </div>

                <div className="col-span-2">
                  <div className='flex flex-col'>
                    <span className="text-gray-900 dark:text-white font-bold text-sm">{new Date(exp.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span>
                    <span className="text-[10px] text-gray-400">{new Date(exp.date).getFullYear()}</span>
                  </div>
                </div>

                <div className="col-span-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${getCategoryStyle(exp.category)}`}>
                    {exp.category}
                  </span>
                </div>

                <div className="col-span-3">
                  <p className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-1" title={exp.description || exp.note}>
                    {getDescriptionOrNote(exp)}
                  </p>
                  {exp.note && <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{exp.note}</p>}
                </div>

                <div className="col-span-2">
                  <div className="flex flex-col gap-1.5 items-start">
                    {exp.project && (
                      <Link href={`/projects/${exp.project.id}`} className="hover:underline hover:text-primary truncate max-w-full inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700">
                        <Briefcase size={10} /> {exp.project.name}
                      </Link>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-[9px] font-bold text-gray-500 border border-gray-200 dark:border-gray-600">
                        {initials}
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">
                        {exp.employee?.name || exp.vendor?.name || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="col-span-1 text-right">
                  <span className="text-sm font-black text-gray-900 dark:text-white font-mono">
                    {exp.amount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-gray-400 block">ETB</span>
                </div>

                <div className="col-span-1 flex justify-center items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/expenses/${exp.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all" title="View Details">
                    <Eye size={16} strokeWidth={2} />
                  </Link>
                  <Link href={`/expenses/edit/${exp.id}`} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all" title="Edit Expense">
                    <Pencil size={16} strokeWidth={2} />
                  </Link>
                  <button onClick={() => deleteExpense(exp)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all" title="Delete Expense">
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* --- MOBILE VIEW: CARDS --- */}
        <div className="md:hidden space-y-4 px-4">
          {paginatedExpenses.length === 0 ? (
            <div className="text-center py-10">
              <Package size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400 text-sm">No expenses found.</p>
            </div>
          ) : paginatedExpenses.map((exp) => (
            <div key={exp.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 relative overflow-hidden">
              {/* Left border indicator */}
              <div className={`absolute top-0 left-0 w-1 h-full ${exp.project ? 'bg-orange-500' : 'bg-green-500'}`}></div>

              <div className="flex justify-between items-start mb-3 pl-2">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">{exp.category}</span>
                  <h4 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2">{getDescriptionOrNote(exp)}</h4>
                </div>
                <div className="text-right">
                  <span className="block font-black text-lg text-gray-900 dark:text-white">{exp.amount.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 font-bold">ETB</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4 pl-2">
                {exp.project && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700">
                    <Briefcase size={10} /> {exp.project.name}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                  <Calendar size={10} /> {new Date(exp.date).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3 pl-2">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  {exp.employee ? <><User size={12} /> {exp.employee.name}</> : exp.vendor ? <><Store size={12} /> {exp.vendor.name}</> : null}
                </div>
                <div className="flex gap-2">
                  <Link href={`/expenses/${exp.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all">
                    <Eye size={16} strokeWidth={2} />
                  </Link>
                  <Link href={`/expenses/edit/${exp.id}`} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all">
                    <Pencil size={16} strokeWidth={2} />
                  </Link>
                  <button onClick={() => deleteExpense(exp)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all">
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 mx-4 md:mx-0 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors">
            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors">
            <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

      </div>
    </Layout>
  );
}
