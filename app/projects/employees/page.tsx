// app/projects/employees/page.tsx - Employees List Page (Premium Enterprise Overhaul)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
  Plus, Search, Filter, Calendar, List, LayoutGrid, DollarSign, Tag, User, ChevronRight, Briefcase, Mail, Phone, MapPin,
  Eye, Edit, Trash2, Loader2, Info as InfoIcon, CheckCircle, XCircle, RefreshCw,
  Clock as ClockIcon, TrendingUp, TrendingDown, Coins, Building, Activity, ShieldCheck, FileText, AlertCircle
} from 'lucide-react';
import Toast from '@/components/common/Toast';
import { subscribeToExpenseChange } from '@/lib/client-events';

// --- Improved Interface syncing closely with API ---
interface Employee {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: string;
  category?: 'COMPANY' | 'PROJECT';
  monthlySalary?: number | null;
  isActive: boolean;
  startDate: string;
  
  // Financials securely coming from API
  totalPaid?: number;
  totalSalaryOwed?: number;
  totalRemaining?: number;
  totalMonthsWorked?: number;
  overpaidAmount?: number;

  laborRecords?: Array<{
    id: string;
    projectId: string;
    projectName: string;
    workDescription: string;
    agreedWage: number | null;
    paidAmount: number | null;
    remainingWage: number | null;
    dateWorked: string;
  }>;
}

const EmployeeRow: React.FC<{ employee: Employee; onEdit: (id: string) => void; onDelete: (id: string) => void; onRecordDailyWork: (id: string) => void; onRecordPayment: (id: string) => void }> = ({ employee, onEdit, onDelete, onRecordDailyWork, onRecordPayment }) => {
  const isCompany = employee.category === 'COMPANY';
  
  // Safely grab from Backend
  const owed = isCompany ? (employee.totalSalaryOwed || 0) : (employee.laborRecords?.reduce((s, r) => s + (r.agreedWage || 0), 0) || 0);
  const paid = isCompany ? (employee.totalPaid || 0) : (employee.laborRecords?.reduce((s, r) => s + (r.paidAmount || 0), 0) || 0);
  const remaining = owed - paid;
  const overpaid = remaining < 0 ? Math.abs(remaining) : 0;

  // Latest Project Context for Laborers
  const latestProject = !isCompany && employee.laborRecords && employee.laborRecords.length > 0
    ? employee.laborRecords[employee.laborRecords.length - 1].projectName
    : null;

  // Vibrant Gradients for Initial Avatars
  const avatarGradients = [
    'from-blue-500 to-indigo-600', 'from-emerald-400 to-teal-500', 'from-orange-400 to-rose-500',
    'from-purple-500 to-pink-500', 'from-cyan-400 to-blue-500'
  ];
  const colorIndex = employee.fullName.charCodeAt(0) % avatarGradients.length;
  const initial = employee.fullName.charAt(0).toUpperCase();

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-all duration-200 border-b border-lightGray dark:border-gray-700 last:border-b-0 group">
      {/* 1. EMPLOYEE & ID */}
      <td className="p-4 whitespace-nowrap">
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 rounded-xl shadow-inner flex items-center justify-center bg-gradient-to-br ${avatarGradients[colorIndex]} transform group-hover:scale-105 transition-transform duration-200`}>
            <span className="text-white font-bold text-lg">{initial}</span>
          </div>
          <div>
            <span className="text-darkGray dark:text-gray-100 font-bold block leading-tight">{employee.fullName}</span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 tracking-wider">ID: {employee.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </td>

      {/* 2. ROLE & CATEGORY & PROJECT */}
      <td className="p-4 whitespace-nowrap">
        <div className="flex flex-col space-y-1.5">
          <div className="flex items-center space-x-2">
            {isCompany ? (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 uppercase flex items-center">
                <Briefcase size={12} className="mr-1" /> CORE TEAM
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 uppercase flex items-center">
                <Building size={12} className="mr-1" /> FIELD LABOR
              </span>
            )}
            <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm flex items-center gap-1.5">
               {employee.role}
            </span>
          </div>
          {latestProject && (
            <div className="text-[11px] text-gray-500 font-medium flex items-center">
              <MapPin size={10} className="mr-1 text-red-400" />
              <span>{latestProject}</span>
            </div>
          )}
        </div>
      </td>

      {/* 3. CONTACT */}
      <td className="p-4 whitespace-nowrap hidden lg:table-cell">
        <div className="flex flex-col space-y-1">
          {employee.phone ? (
             <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300">
               <Phone size={13} className="mr-1.5 text-emerald-500" /> {employee.phone}
             </div>
          ) : <span className="text-sm font-medium text-gray-400 dark:text-gray-600">-</span>}
          {employee.email && (
            <div className="flex items-center text-[11px] text-gray-500">
              <Mail size={11} className="mr-1.5" /> {employee.email}
            </div>
          )}
        </div>
      </td>

      {/* 4. TOTAL OWED (CALCULATED WAGE) */}
      <td className="p-4 whitespace-nowrap text-right">
        <div className="font-extrabold text-sm text-gray-800 dark:text-gray-200">
          {owed.toLocaleString()} ETB
        </div>
        <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
          {isCompany ? `Rate: ${employee.monthlySalary?.toLocaleString()||0}/mo` : 'Total Project Value'}
        </div>
      </td>

      {/* 5. TOTAL PAID */}
      <td className="p-4 whitespace-nowrap text-right">
        <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 px-2 py-0.5 rounded-md inline-block">
          {paid.toLocaleString()} ETB
        </div>
      </td>

      {/* 6. BALANCE / REMAINING */}
      <td className="p-4 whitespace-nowrap text-right">
        {overpaid > 0 ? (
          <div className="font-bold text-sm text-rose-500 dark:text-rose-400 flex items-center justify-end">
            <TrendingDown size={14} className="mr-1" />
            {(overpaid).toLocaleString()} ETB
          </div>
        ) : (
          <div className="font-bold text-sm text-blue-600 dark:text-blue-400">
             {Math.abs(remaining).toLocaleString()} ETB
          </div>
        )}
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
          {overpaid > 0 ? 'Overpaid / Advance' : 'Pending Balance'}
        </div>
      </td>

      {/* 7. STATUS */}
      <td className="p-4 whitespace-nowrap text-center">
        {employee.isActive ? (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100/50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Active</span>
          </div>
        ) : (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5"></div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Inactive</span>
          </div>
        )}
      </td>

      {/* 8. ACTIONS */}
      <td className="p-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end space-x-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onRecordDailyWork(employee.id)} className="p-1.5 rounded-md hover:bg-amber-100 hover:text-amber-600 outline-none transition-colors border border-transparent hover:border-amber-200 text-gray-500" title="Log Attendance">
            <ClockIcon size={16} />
          </button>
          <button onClick={() => onRecordPayment(employee.id)} className="p-1.5 rounded-md hover:bg-emerald-100 hover:text-emerald-600 outline-none transition-colors border border-transparent hover:border-emerald-200 text-gray-500" title="Issue Salary">
            <Coins size={16} />
          </button>
          <Link href={`/projects/employees/${employee.id}`} className="p-1.5 rounded-md hover:bg-blue-100 hover:text-blue-600 outline-none transition-colors border border-transparent hover:border-blue-200 text-gray-500" title="View Detail">
            <Eye size={16} />
          </Link>
          <Link href={`/projects/employees/edit/${employee.id}`} className="p-1.5 rounded-md hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-white outline-none transition-colors border border-transparent hover:border-gray-200 text-gray-500" title="Edit">
            <Edit size={16} />
          </Link>
          <button onClick={() => onDelete(employee.id)} className="p-1.5 rounded-md hover:bg-rose-100 hover:text-rose-600 outline-none transition-colors border border-transparent hover:border-rose-200 text-gray-500" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};


export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterEmployeeType, setFilterEmployeeType] = useState('All');
  const [filterProject, setFilterProject] = useState('All'); // NEW: Project Filter
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [activeTab, setActiveTab] = useState<'All' | 'Company' | 'Project'>('All');
  const [pageLoading, setPageLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchEmployees = async () => {
    setPageLoading(true);
    try {
      const response = await fetch('/api/projects/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data.employees);
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka shaqaalaha la soo gelinayay.', type: 'error' });
    } finally {
      setPageLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad tirtirto shaqaalahan? Tan lama soo celin karo!')) {
      try {
        const response = await fetch(`/api/projects/employees/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete');
        setToastMessage({ message: data.message || 'Shaqaalaha waa la tirtiray!', type: 'success' });
        fetchEmployees();
      } catch (error: any) {
        setToastMessage({ message: error.message || 'Cilad tirtiridda.', type: 'error' });
      }
    }
  };

  const handleEditEmployee = (id: string) => router.push(`/projects/employees/edit/${id}`);
  const handleRecordDailyWork = (id: string) => router.push(`/projects/employees/${id}?tab=Attendance`);
  const handleRecordPayment = (id: string) => router.push(`/projects/employees/${id}?tab=Attendance`);
  const refreshData = async () => { await fetchEmployees(); setToastMessage({ message: 'Live data synced!', type: 'success' }); };

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => {
    const handleVisibility = () => { if (!document.hidden) refreshData(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
  useEffect(() => {
    const unsubscribe = subscribeToExpenseChange(() => fetchEmployees());
    return () => unsubscribe();
  }, []);

  // Compute unique projects for the filter dropdown
  const uniqueProjects = Array.from(new Set(
    employees.flatMap(e => e.laborRecords?.map(r => r.projectName) || [])
  )).filter(Boolean).sort();

  const filteredEmployees = employees.filter(e => {
    const term = searchTerm.toLowerCase();
    const matchSearch = e.fullName.toLowerCase().includes(term) || (e.phone && e.phone.includes(term));
    const matchRole = filterRole === 'All' || e.role === filterRole;
    const matchStatus = filterStatus === 'All' || (filterStatus === 'Active' && e.isActive) || (filterStatus === 'Inactive' && !e.isActive);
    const matchType = filterEmployeeType === 'All' || (filterEmployeeType === 'Company' && e.category === 'COMPANY') || (filterEmployeeType === 'Project' && e.category === 'PROJECT');
    
    // Project Matcher
    const matchProject = filterProject === 'All' ? true : 
      e.laborRecords?.some(r => r.projectName === filterProject);

    return matchSearch && matchRole && matchStatus && matchType && matchProject;
  });

  const tabFilteredEmployees = activeTab === 'All' ? filteredEmployees :
    activeTab === 'Company' ? filteredEmployees.filter(e => e.category === 'COMPANY') :
    filteredEmployees.filter(e => e.category === 'PROJECT');

  // Strict Backend metrics usage (No local recalcs for finances)
  const totalEmployeesCount = tabFilteredEmployees.length;
  const activeEmployeesCount = tabFilteredEmployees.filter(e => e.isActive).length;

  const totalOwed = tabFilteredEmployees.reduce((sum, e) => {
    return sum + (e.category==='COMPANY' ? (e.totalSalaryOwed||0) : (e.laborRecords?.reduce((s,r)=>s+(r.agreedWage||0),0)||0));
  }, 0);

  const totalPaid = tabFilteredEmployees.reduce((sum, e) => {
    return sum + (e.category==='COMPANY' ? (e.totalPaid||0) : (e.laborRecords?.reduce((s,r)=>s+(r.paidAmount||0),0)||0));
  }, 0);

  const totalBalance = totalOwed - totalPaid;
  const isNetOverpaid = totalBalance < 0;

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth < 768 && viewMode === 'list') setViewMode('cards'); };
    handleResize(); window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  return (
    <Layout>
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 py-4">
        <div>
           <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white flex items-center">
             <ShieldCheck className="mr-3 text-primary h-8 w-8" />
             Employee Roster
           </h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium">Manage core staff, projects laborers, and process payroll securely.</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
          <button onClick={refreshData} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all flex items-center justify-center flex-1 md:flex-none">
            <RefreshCw size={18} className="mr-2" /> Sync Data
          </button>
          <Link href="/projects/employees/add" className="px-5 py-2 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-bold shadow-md shadow-primary/30 transition-all flex items-center justify-center flex-1 md:flex-none transform hover:-translate-y-0.5">
            <Plus size={18} className="mr-2" /> Add Employee
          </Link>
        </div>
      </div>

      {/* Enterprise Bento Box Stats - STRICTLY ON-BRAND */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        
        {/* Metric 1: Headcount Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-lightGray dark:border-gray-700 relative overflow-hidden group hover:border-primary transition-colors">
           <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <User size={100} className="text-primary" />
           </div>
           <div className="flex items-center space-x-3 mb-4">
             <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
               <Briefcase size={20} className="stroke-[2.5]" />
             </div>
             <h3 className="font-bold text-mediumGray dark:text-gray-400 uppercase tracking-wide text-xs">Total Workforce</h3>
           </div>
           <div className="flex items-end gap-3 relative z-10">
             <span className="text-5xl font-black text-darkGray dark:text-white tracking-tight">{totalEmployeesCount}</span>
             <span className="text-sm font-semibold text-secondary bg-secondary/10 px-2.5 py-1 rounded-md mb-1.5 border border-secondary/20">
                {activeEmployeesCount} Active
             </span>
           </div>
        </div>

        {/* Metric 2: Total Labor Value (Owed) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-lightGray dark:border-gray-700 relative overflow-hidden group hover:border-accent transition-colors">
           <div className="flex items-center justify-between mb-2">
             <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center">
               <FileText size={20} className="stroke-[2.5]" />
             </div>
           </div>
           <h3 className="font-bold text-mediumGray dark:text-gray-400 uppercase tracking-wide text-xs mb-1">Gross Wage Liability</h3>
           <div className="text-3xl lg:text-4xl font-black text-darkGray dark:text-white tracking-tight break-words">
             ${totalOwed.toLocaleString()}
           </div>
           <p className="text-xs text-mediumGray dark:text-gray-500 mt-2 font-medium">Total earned historically by filtered group</p>
        </div>

        {/* Metric 3: Financial Balances */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-l-4 border-l-primary border-t border-t-lightGray border-r border-r-lightGray border-b border-b-lightGray dark:border-gray-700 relative overflow-hidden group">
           <div className="flex items-center space-x-3 mb-2 flex-wrap">
             <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
               <Coins size={20} className="stroke-[2.5]" />
             </div>
             <div className="text-right flex-1">
                <span className="text-xs font-bold text-mediumGray dark:text-gray-400 uppercase tracking-wider">Disbursed</span>
                <div className="text-lg font-bold text-darkGray dark:text-white">${totalPaid.toLocaleString()}</div>
             </div>
           </div>
           <div className="border-t border-lightGray dark:border-gray-700 my-3"></div>
           <div>
             <h3 className="font-bold text-mediumGray uppercase tracking-wide text-[10px] mb-0.5">
               {isNetOverpaid ? 'Total Advance / Overpaid' : 'Pending Clearance Liability'}
             </h3>
             <div className={`text-2xl font-black tracking-tight ${isNetOverpaid ? 'text-redError' : 'text-primary'}`}>
               ${Math.abs(totalBalance).toLocaleString()} <span className="text-sm font-semibold opacity-70 tracking-normal">{isNetOverpaid?'Overpaid':'Remaining'}</span>
             </div>
           </div>
        </div>
      </div>

      {/* Advanced Unified Action Bar */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col xl:flex-row gap-3 relative z-10 w-full overflow-visible">
          {/* Global Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, ID, phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-primary/50 focus:bg-white rounded-lg text-sm font-medium transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="h-full w-px bg-gray-200 dark:bg-gray-700 hidden xl:block mx-1"></div>

          {/* Filtering Engine */}
          <div className="flex flex-wrap md:flex-nowrap gap-3 flex-1 xl:max-w-4xl z-50 overflow-visible">
            {/* Category Toggle (Visual Pills) */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-lg shrink-0">
               <button onClick={() => setActiveTab('All')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab==='All' ? 'bg-white shadow dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'} `}>All</button>
               <button onClick={() => setActiveTab('Company')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab==='Company' ? 'bg-white shadow dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'} `}>Core HR</button>
               <button onClick={() => setActiveTab('Project')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab==='Project' ? 'bg-white shadow dark:bg-gray-700 text-amber-600 dark:text-amber-400' : 'text-gray-500 hover:text-gray-700'} `}>Field Labor</button>
            </div>

            {/* Project Filter */}
            {activeTab !== 'Company' && (
              <div className="relative min-w-[150px] shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <select className="w-full pl-9 pr-8 py-2.5 bg-transparent text-sm font-semibold text-gray-700 dark:text-gray-200 appearance-none outline-none cursor-pointer" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
                  <option value="All">All Projects</option>
                  {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" size={16} />
              </div>
            )}
            
            {/* Status Filter */}
            <div className="relative w-32 shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300">
               <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
               <select className="w-full pl-9 pr-6 py-2.5 bg-transparent text-sm font-semibold text-gray-700 dark:text-gray-200 appearance-none outline-none cursor-pointer" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
               </select>
            </div>
            
            {/* View Mode */}
            <div className="flex ml-auto bg-gray-100 dark:bg-gray-900 rounded-lg p-1 shrink-0 self-center">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list'?'bg-white shadow text-gray-900 dark:bg-gray-700 dark:text-white':'text-gray-400 hover:text-gray-600'}`}><List size={18} /></button>
                <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded-md transition-all ${viewMode === 'cards'?'bg-white shadow text-gray-900 dark:bg-gray-700 dark:text-white':'text-gray-400 hover:text-gray-600'}`}><LayoutGrid size={18} /></button>
            </div>
          </div>
      </div>

      {pageLoading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
           <Loader2 className="animate-spin text-primary mb-4" size={40} />
           <p className="text-gray-500 font-medium">Syncing Master Rosters...</p>
        </div>
      ) : tabFilteredEmployees.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 border-dashed">
           <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4">
             <Search size={32} className="text-gray-300" />
           </div>
           <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">No records found</h3>
           <p className="text-gray-500 text-sm mt-1 max-w-sm text-center">Try adjusting your filters or search terms. If you haven't added an employee, click 'Add Employee' to start.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative z-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 uppercase text-[10px] tracking-wider text-gray-500">
                  <th className="p-4 font-bold">Identity</th>
                  <th className="p-4 font-bold">Role & Dept</th>
                  <th className="p-4 font-bold hidden lg:table-cell">Contact</th>
                  <th className="p-4 font-bold text-right">Value (Owed)</th>
                  <th className="p-4 font-bold text-right">Settled</th>
                  <th className="p-4 font-bold text-right">Balance</th>
                  <th className="p-4 font-bold text-center">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tabFilteredEmployees.map(emp => (
                  <EmployeeRow key={emp.id} employee={emp} onEdit={handleEditEmployee} onDelete={handleDeleteEmployee} onRecordDailyWork={handleRecordDailyWork} onRecordPayment={handleRecordPayment} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
           {tabFilteredEmployees.map(emp => {
             const isCompany = emp.category === 'COMPANY';
             const owed = isCompany ? (emp.totalSalaryOwed || 0) : (emp.laborRecords?.reduce((s, r) => s + (r.agreedWage || 0), 0) || 0);
             const paid = isCompany ? (emp.totalPaid || 0) : (emp.laborRecords?.reduce((s, r) => s + (r.paidAmount || 0), 0) || 0);
             const remaining = owed - paid;
             const overpaid = remaining < 0 ? Math.abs(remaining) : 0;
             const latestProject = !isCompany && emp.laborRecords && emp.laborRecords.length > 0
                ? emp.laborRecords[emp.laborRecords.length - 1].projectName : null;
             
             // Same Avatar Gradient Logic
             const avatarGradients = [
               'from-blue-500 to-indigo-600', 'from-emerald-400 to-teal-500', 'from-orange-400 to-rose-500',
               'from-purple-500 to-pink-500', 'from-cyan-400 to-blue-500'
             ];
             const colorIndex = emp.fullName.charCodeAt(0) % avatarGradients.length;
             const initial = emp.fullName.charAt(0).toUpperCase();

             return (
               <div key={emp.id} className={`bg-white dark:bg-gray-800 border-l-4 ${emp.isActive ? 'border-primary' : 'border-gray-300 dark:border-gray-600'} border-t border-r border-b border-lightGray dark:border-gray-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative`}>
                  {/* Status Indicator */}
                  <div className="absolute top-4 right-4 flex space-x-1">
                     <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${isCompany ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                       {isCompany ? 'Core' : 'Labor'}
                     </span>
                  </div>

                  {/* Header: Avatar, Name, Role */}
                  <div className="flex items-center space-x-3 mb-5 pr-12">
                     <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarGradients[colorIndex]} flex items-center justify-center text-white font-bold text-xl shadow-inner`}>
                       {initial}
                     </div>
                     <div>
                       <h4 className="font-bold text-darkGray dark:text-white leading-tight text-lg">{emp.fullName}</h4>
                       <span className="text-xs font-semibold text-mediumGray dark:text-gray-400 flex items-center mt-0.5">
                         {emp.role}
                       </span>
                     </div>
                  </div>

                  {/* Contact & Context */}
                  <div className="flex flex-col space-y-2 mb-5">
                     {emp.phone && (
                       <div className="flex items-center text-sm font-medium text-darkGray dark:text-gray-300">
                         <Phone size={14} className="mr-2 text-secondary" /> {emp.phone}
                       </div>
                     )}
                     {latestProject && (
                       <div className="flex items-center text-xs font-medium text-mediumGray dark:text-gray-400">
                         <MapPin size={14} className="mr-2 text-redError" /> {latestProject}
                       </div>
                     )}
                  </div>

                  {/* Finances */}
                  <div className="bg-lightGray/30 dark:bg-gray-900 p-3 rounded-xl text-sm border border-lightGray/50 dark:border-gray-800 mb-4 space-y-2">
                     <div className="flex justify-between items-center text-xs font-semibold text-mediumGray dark:text-gray-400">
                        <span>Earned:</span>
                        <span className="text-darkGray dark:text-gray-200">${owed.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs font-semibold text-mediumGray dark:text-gray-400">
                        <span>Paid:</span>
                        <span className="text-secondary">${paid.toLocaleString()}</span>
                     </div>
                     <div className="border-t border-lightGray dark:border-gray-700 pt-2 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-300">Balance:</span>
                        <span className={`font-black ${overpaid > 0 ? 'text-redError' : 'text-primary'}`}>
                           ${overpaid > 0 ? overpaid.toLocaleString() : Math.abs(remaining).toLocaleString()}
                           {overpaid > 0 ? <span className="text-[10px] ml-1">Overpaid</span> : ''}
                        </span>
                     </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 gap-2 w-full mt-auto">
                    <button onClick={()=>handleRecordDailyWork(emp.id)} className="flex items-center justify-center py-2 bg-lightGray dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-darkGray dark:text-white text-xs font-bold rounded-lg transition-colors">
                      <ClockIcon size={14} className="mr-1.5" /> Log Hours
                    </button>
                    <Link href={`/projects/employees/${emp.id}`} className="flex items-center justify-center py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
                      <Eye size={14} className="mr-1.5" /> View Profile
                    </Link>
                  </div>
               </div>
             );
           })}
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
