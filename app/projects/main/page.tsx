// app/projects/page.tsx - Project List Page (DESIGN UPDATE)
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout'; // Layout for sidebar
import {
  Plus, Search, Filter, Eye, Edit, Trash2, LayoutGrid, List, Calendar, CheckCircle, Clock, XCircle, ChevronRight,
  Loader2, Info, Bell, FileX2, MoreVertical, DollarSign, User, Hash, AlertTriangle, Upload, TrendingUp, Download,
  RotateCcw, ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Toast from '@/components/common/Toast'; 
import { generateProjectExcelWorkbook } from '@/lib/project-export-utils';
// --- Project Data Interface (No Changes) ---
interface Project {
  id: string;
  name: string;
  description?: string;
  customer: { name: string; email?: string; };
  agreementAmount: number;
  advancePaid: number;
  remainingAmount: number;
  projectType: string;
  status: 'Active' | 'Completed' | 'On Hold' | 'Cancelled' | 'Overdue' | 'Nearing Deadline';
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Helper Function for Status ---
const getStatusProps = (status: Project['status']) => {
  switch (status) {
    case 'Active':
      return { class: 'text-primary bg-primary/10', icon: <Clock size={16} /> };
    case 'Completed':
      return { class: 'text-secondary bg-secondary/10', icon: <CheckCircle size={16} /> };
    case 'On Hold':
      return { class: 'text-accent bg-accent/10', icon: <Info size={16} /> };
    case 'Cancelled':
      return { class: 'text-redError bg-redError/10', icon: <XCircle size={16} /> };
    case 'Overdue':
      return { class: 'text-redError bg-redError/10', icon: <AlertTriangle size={16} /> };
    case 'Nearing Deadline':
      return { class: 'text-orange-500 bg-orange-500/10', icon: <Bell size={16} /> };
    default:
      return { class: 'text-mediumGray bg-mediumGray/10', icon: <Info size={16} /> };
  }
};


// --- [RESPONSIVE] Table Row Component ---
// This component now transforms into a card on mobile screens
interface ProjectRowProps {
  project: Project;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: Project['status']) => void;
}

const ProjectRow: React.FC<ProjectRowProps> = ({ project, onDelete, onUpdateStatus }) => {
  const { class: statusClass, icon: statusIcon } = getStatusProps(project.status);
  const isPAYG = project.agreementAmount === 0;
  const progress = !isPAYG && project.agreementAmount > 0 ? (project.advancePaid / project.agreementAmount) * 100 : 0;

  return (
    // On mobile (default), it's a flex-column (card). On md screens and up, it's a table-row.
    <tr className={`block md:table-row border-b md:border-b-0 border-lightGray dark:border-gray-700 mb-4 md:mb-0 rounded-lg md:rounded-none bg-white dark:bg-gray-800 md:bg-transparent shadow-md md:shadow-none md:hover:bg-lightGray/50 dark:md:hover:bg-gray-700/50 transition-colors duration-150 ${isPAYG ? 'border-l-4 md:border-l-0 border-l-blue-400' : ''}`}>

      {/* Helper function to create table cells that work on both mobile and desktop */}
      <td data-label="Project" className="p-3 md:p-4 flex justify-between items-center md:table-cell text-left font-bold text-lg md:font-medium md:text-base text-darkGray dark:text-gray-100 whitespace-nowrap border-b md:border-b-0 border-lightGray dark:border-gray-700/50">
        <div className="flex flex-col">
          <span className="md:hidden text-primary font-bold">{project.name}</span>
          <span className="hidden md:inline">{project.name}</span>
          {isPAYG && <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Pay As You Go</span>}
        </div>
      </td>
      <td data-label="Client" className="p-3 md:p-4 flex justify-between items-center md:table-cell text-left text-mediumGray dark:text-gray-300 whitespace-nowrap border-b md:border-b-0 border-lightGray dark:border-gray-700/50">
        <span className="font-bold md:hidden">Client:</span> {project.customer.name}
      </td>
      <td data-label="Amount" className="p-3 md:p-4 flex justify-between items-center md:table-cell text-left md:text-right text-mediumGray dark:text-gray-300 whitespace-nowrap border-b md:border-b-0 border-lightGray dark:border-gray-700/50">
        <span className="font-bold md:hidden">Amount:</span>
        {isPAYG ? <span className="text-blue-500 font-medium">Open / T&M</span> : `Br${project.agreementAmount.toLocaleString()}`}
      </td>
      <td data-label="Paid" className="p-3 md:p-4 flex justify-between items-center md:table-cell text-left md:text-right text-secondary dark:text-green-400 whitespace-nowrap border-b md:border-b-0 border-lightGray dark:border-gray-700/50">
        <span className="font-bold md:hidden">Paid:</span> Br{project.advancePaid.toLocaleString()}
      </td>
      <td data-label="Remaining" className={`p-3 md:p-4 flex justify-between items-center md:table-cell text-left md:text-right font-semibold whitespace-nowrap border-b md:border-b-0 border-lightGray dark:border-gray-700/50 ${project.remainingAmount <= 0 ? 'text-green-600 dark:text-green-400' : 'text-redError dark:text-red-400'}`}>
        <span className="font-bold md:hidden">Remaining:</span> Br{project.remainingAmount.toLocaleString()}
      </td>
      <td data-label="Status" className="p-3 md:p-4 flex justify-between items-center md:table-cell text-left whitespace-nowrap border-b md:border-b-0 border-lightGray dark:border-gray-700/50">
        <span className="font-bold md:hidden">Status:</span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center justify-center gap-2 ${statusClass}`}>
          {statusIcon} <span>{project.status}</span>
        </span>
      </td>
      <td data-label="Progress" className="p-3 md:p-4 flex justify-between items-center md:table-cell text-left whitespace-nowrap">
        <span className="font-bold md:hidden">Progress:</span>
        <div className="w-full">
          {!isPAYG ? (
            <>
              <div className="w-full bg-lightGray dark:bg-gray-700 rounded-full h-2">
                <div className={`h-2 rounded-full ${progress < 100 ? 'bg-primary' : 'bg-secondary'}`} style={{ width: `${progress}%` }}></div>
              </div>
              <span className="text-xs text-mediumGray dark:text-gray-400">{progress.toFixed(0)}% Paid</span>
            </>
          ) : (
            <span className="text-xs text-mediumGray italic">N/A (Open)</span>
          )}
        </div>
      </td>
      {/* Actions are grouped and hidden on mobile, shown on desktop */}
      <td className="p-3 md:p-4 md:table-cell text-right">
        <div className="flex items-center justify-end space-x-2">
          {project.status !== 'Completed' ? (
            <button 
              onClick={() => {
                if (window.confirm('Ma hubtaa inaad mashruucan u calaamadiso inuu dhamaaday?')) {
                  onUpdateStatus(project.id, 'Completed');
                }
              }} 
              className="p-2 rounded-full bg-secondary/10 text-secondary hover:bg-secondary hover:text-white transition-colors duration-200" 
              title="Mark as Completed"
            >
              <CheckCircle size={18} />
            </button>
          ) : (
            <button 
              onClick={() => {
                if (window.confirm('Ma hubtaa inaad mashruucan dib ugu soo celiso Active?')) {
                  onUpdateStatus(project.id, 'Active');
                }
              }} 
              className="p-2 rounded-full bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors duration-200" 
              title="Revert to Active"
            >
              <RotateCcw size={18} />
            </button>
          )}
          <Link href={`/projects/main/${project.id}`} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View Details">
            <Eye size={18} />
          </Link>
          <Link href={`/projects/main/edit/${project.id}`} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Project">
            <Edit size={18} />
          </Link>
          <button onClick={() => onDelete(project.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Project">
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};


// --- [ENHANCED] Kanban Card Component ---
interface KanbanCardProps {
  project: Project;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: Project['status']) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ project, onDelete, onUpdateStatus }) => {
  const isPAYG = project.agreementAmount === 0;
  const progress = !isPAYG && project.agreementAmount > 0 ? (project.advancePaid / project.agreementAmount) * 100 : 0;
  const { class: statusClass, icon: statusIcon } = getStatusProps(project.status);

  // Border Color Logic
  let borderColor = 'border-lightGray dark:border-gray-700';
  if (isPAYG) borderColor = 'border-blue-400'; // Distinct color for PAYG
  else if (project.status === 'Active') borderColor = 'border-primary';
  else if (project.status === 'Completed') borderColor = 'border-secondary';
  else if (project.status === 'On Hold') borderColor = 'border-accent';
  else if (project.status === 'Cancelled') borderColor = 'border-redError';
  else if (project.status === 'Overdue') borderColor = 'border-redError';
  else if (project.status === 'Nearing Deadline') borderColor = 'border-orange-500';

  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg mb-4 border-l-4 ${borderColor} ${isPAYG ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''} transform hover:scale-[1.02] hover:shadow-xl transition-all duration-300 flex flex-col justify-between`}>
      <div>
        {/* --- Card Header --- */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-bold text-lg text-darkGray dark:text-gray-100">{project.name}</h4>
            {isPAYG && <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block mt-1">Pay As You Go</span>}
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${statusClass}`}>
            {statusIcon} <span>{project.status}</span>
          </span>
        </div>

        {/* --- Project Details --- */}
        <div className="space-y-2 text-sm text-mediumGray dark:text-gray-400">
          <div className="flex items-center gap-2">
            <User size={14} className="text-gray-400" />
            <span>Client: <span className="font-medium text-darkGray dark:text-gray-200">{project.customer.name}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-gray-400" />
            <span>Amount: <span className="font-medium text-darkGray dark:text-gray-200">
              {isPAYG ? <span className="text-blue-500">Open / T&M</span> : `Br${project.agreementAmount.toLocaleString()}`}
            </span></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <span>Due Date: <span className="font-medium text-darkGray dark:text-gray-200">{project.expectedCompletionDate ? new Date(project.expectedCompletionDate).toLocaleDateString() : 'N/A'}</span></span>
          </div>
        </div>
      </div>

      {/* --- Progress & Actions --- */}
      <div className="mt-4">
        {!isPAYG ? (
          <>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-redError">Remaining: Br{project.remainingAmount.toLocaleString()}</span>
              <span className="text-xs font-semibold text-secondary">{progress.toFixed(0)}% Paid</span>
            </div>
            <div className="w-full bg-lightGray dark:bg-gray-700 rounded-full h-2">
              <div className={`h-2 rounded-full ${progress >= 100 ? 'bg-secondary' : 'bg-primary'}`} style={{ width: `${progress}%` }}></div>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-blue-500">Total Paid: Br{project.advancePaid.toLocaleString()}</span>
            <span className="text-xs font-medium text-mediumGray">Open Budget</span>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-4">
          {project.status !== 'Completed' ? (
            <button 
              onClick={() => {
                if (window.confirm('Ma hubtaa inaad mashruucan u calaamadiso inuu dhamaaday?')) {
                  onUpdateStatus(project.id, 'Completed');
                }
              }} 
              className="p-2 rounded-full bg-secondary/10 text-secondary hover:bg-secondary hover:text-white transition-colors duration-200" 
              title="Mark as Completed"
            >
              <CheckCircle size={16} />
            </button>
          ) : (
            <button 
              onClick={() => {
                if (window.confirm('Ma hubtaa inaad mashruucan dib ugu soo celiso Active?')) {
                  onUpdateStatus(project.id, 'Active');
                }
              }} 
              className="p-2 rounded-full bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors duration-200" 
              title="Revert to Active"
            >
              <RotateCcw size={16} />
            </button>
          )}
          <Link href={`/projects/main/${project.id}`} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View Details">
            <Eye size={16} />
          </Link>
          <Link href={`/projects/main/edit/${project.id}`} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Project">
            <Edit size={16} />
          </Link>
          <button onClick={() => onDelete(project.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Project">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};


export default function ProjectsPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCustomer, setFilterCustomer] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [cardsReflectFilters, setCardsReflectFilters] = useState(true);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Fetch Projects (unchanged) ---
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Derived unique customers from projects list
  const customerNames = ['All', ...Array.from(new Set(projects.map(p => p.customer.name).filter(Boolean)))];

  // --- API Functions (No Changes) ---
  const fetchProjects = async () => {
    setPageLoading(true);
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data.projects);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka mashaariicda la soo gelinayay.', type: 'error' });
      setProjects([]);
    } finally {
      setPageLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad tirtirto mashruucan?')) {
      try {
        const response = await fetch(`/api/projects/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete project');

        setToastMessage({ message: data.message || 'Mashruuca si guul leh ayaa loo tirtiray!', type: 'success' });
        fetchProjects(); // Re-fetch
      } catch (error: any) {
        console.error('Error deleting project:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka mashruuca la tirtirayay.', type: 'error' });
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Project['status']) => {
    // Optimistic update
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update project status');

      setToastMessage({ message: data.message || 'Xaalada mashruuca waa la cusboonaysiiyay!', type: 'success' });
      // No need to refetch if successful, as we did optimistic update. 
      // But maybe good to sync? Let's just keep optimistic.
    } catch (error: any) {
      console.error('Error updating status:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday.', type: 'error' });
      fetchProjects(); // Revert on error
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Real-time update when transactions or payments are created
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === 'transactionCreated' || e.key === 'projectPaymentCreated') && e.newValue) {
        const data = JSON.parse(e.newValue);
        if (data.projectId) {
          // Refresh projects list when a transaction or payment is created for any project
          console.log('Transaction/Payment created for project:', data);
          fetchProjects();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false); // Changed from setShowExportMenu to setShowExportDropdown
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || project.status === filterStatus;
    const matchesCustomer = filterCustomer === 'All' || project.customer.name === filterCustomer;
    const matchesType = filterType === 'All' ||
      (filterType === 'Fixed' && project.agreementAmount > 0) ||
      (filterType === 'PAYG' && project.agreementAmount === 0);

    let matchesDate = true;
    if (filterDateRange !== 'All') {
      const projDate = new Date(project.createdAt);
      const now = new Date();
      if (filterDateRange === 'Today') {
        matchesDate = projDate.toDateString() === now.toDateString();
      } else if (filterDateRange === 'This Month') {
        matchesDate = projDate.getMonth() === now.getMonth() && projDate.getFullYear() === now.getFullYear();
      } else if (filterDateRange === 'This Year') {
        matchesDate = projDate.getFullYear() === now.getFullYear();
      }
    }
    return matchesSearch && matchesStatus && matchesCustomer && matchesType && matchesDate;
  });

  // --- Project Statistics ---
  const statsSource = cardsReflectFilters ? filteredProjects : projects;
  const activeProjectsCount = statsSource.filter(p => p.status === 'Active').length;
  const completedProjectsCount = statsSource.filter(p => p.status === 'Completed').length;
  const onHoldProjectsCount = statsSource.filter(p => p.status === 'On Hold').length;
  const totalAmount = statsSource.reduce((sum, p) => {
    const amt = typeof p.agreementAmount === 'number' ? p.agreementAmount : parseFloat(p.agreementAmount as any) || 0;
    return sum + amt;
  }, 0);
  const totalAdvance = statsSource.reduce((sum, p) => {
    const adv = typeof p.advancePaid === 'number' ? p.advancePaid : parseFloat(p.advancePaid as any) || 0;
    return sum + adv;
  }, 0);
  const totalRemaining = totalAmount - totalAdvance;

  // --- Kanban Board Columns (No Changes) ---
  const kanbanColumns = {
    'Active': filteredProjects.filter(p => p.status === 'Active'),
    'Nearing Deadline': filteredProjects.filter(p => p.status === 'Nearing Deadline'),
    'On Hold': filteredProjects.filter(p => p.status === 'On Hold'),
    'Overdue': filteredProjects.filter(p => p.status === 'Overdue'),
    'Completed': filteredProjects.filter(p => p.status === 'Completed'),
    'Cancelled': filteredProjects.filter(p => p.status === 'Cancelled'),
  };

  // NEW: Dual Export Handlers
  const handleExportCombined = async () => {
    setShowExportDropdown(false);
    if (filteredProjects.length === 0) return;
    
    setToastMessage({ message: 'Excelka waa la diyaarinayaa...', type: 'info' });
    
    try {
      // For combined, we fetch detail for each to get full data (expenses, etc)
      const fullProjects = await Promise.all(
        filteredProjects.map(async (p) => {
          const res = await fetch(`/api/projects/${p.id}`);
          const data = await res.json();
          return data.project;
        })
      );

      const workbook = XLSX.utils.book_new();
      const combinedSummary: any[] = [];
      const combinedTransactions: any[] = [];
      const combinedMaterials: any[] = [];

      fullProjects.forEach(project => {
        const pWorkbook = generateProjectExcelWorkbook(project);
        
        // Add summary row
        const summarySheet = pWorkbook.Sheets['Guudmar'];
        const summaryData = XLSX.utils.sheet_to_json(summarySheet)[0] as any;
        combinedSummary.push(summaryData);

        // Add transactions
        if (pWorkbook.Sheets['Dhaqdhaqaaqaadka']) {
          const trxData = XLSX.utils.sheet_to_json(pWorkbook.Sheets['Dhaqdhaqaaqaadka']);
          trxData.forEach((t: any) => {
            if (t['Sharaxaad (Description)'] !== 'WADARTA (TOTAL)') {
              combinedTransactions.push({ 'Mashruuca': project.name, ...t });
            }
          });
        }

        // Add materials
        if (pWorkbook.Sheets['Agabka']) {
          const matData = XLSX.utils.sheet_to_json(pWorkbook.Sheets['Agabka']);
          matData.forEach((m: any) => {
            if (m['Magaca Agabka (Material)'] !== 'WADARTA (TOTAL)') {
              combinedMaterials.push({ 'Mashruuca': project.name, ...m });
            }
          });
        }
      });

      // Append Combined Sheets
      const wsSum = XLSX.utils.json_to_sheet(combinedSummary);
      XLSX.utils.book_append_sheet(workbook, wsSum, 'Guudmar_Mashaariicda');
      
      if (combinedTransactions.length > 0) {
        const wsTrx = XLSX.utils.json_to_sheet(combinedTransactions);
        XLSX.utils.book_append_sheet(workbook, wsTrx, 'Dhaqdhaqaaqa_Dhan');
      }

      if (combinedMaterials.length > 0) {
        const wsMat = XLSX.utils.json_to_sheet(combinedMaterials);
        XLSX.utils.book_append_sheet(workbook, wsMat, 'Agabka_Dhan');
      }

      XLSX.writeFile(workbook, `Mashaariicda_Isku_Dhafka_ah_${new Date().toISOString().split('T')[0]}.xlsx`);
      setToastMessage({ message: 'Excel-kii guud waa la soo dejiyay.', type: 'success' });
    } catch (error) {
      setToastMessage({ message: 'Cilad ayaa ku timid soo dejinta Excel-ka.', type: 'error' });
    }
  };

  const handleExportIndividual = async () => {
    setShowExportDropdown(false);
    if (filteredProjects.length === 0) return;

    setToastMessage({ message: `Soo dejinta ${filteredProjects.length} mashaariicood ayaa bilaabatay...`, type: 'info' });

    try {
      for (const p of filteredProjects) {
        // Fetch full detail for each
        const res = await fetch(`/api/projects/${p.id}`);
        const data = await res.json();
        const fullProject = data.project;
        
        const workbook = generateProjectExcelWorkbook(fullProject);
        XLSX.writeFile(workbook, `Project_${fullProject.name.replace(/\s+/g, '_')}.xlsx`);
        
        // Small delay to prevent browser from blocking multiple downloads
        await new Promise(r => setTimeout(r, 500));
      }
      setToastMessage({ message: 'Dhamaan mashaariicdii waa la soo dejiyay.', type: 'success' });
    } catch (error) {
      setToastMessage({ message: 'Cilad ayaa ku timid soo dejinta.', type: 'error' });
    }
  };

  // --- Loading State ---
  if (pageLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
          <Loader2 className="animate-spin text-primary mb-4" size={48} />
          <h2 className="text-2xl font-semibold text-darkGray dark:text-gray-200">Loading Projects...</h2>
          <p className="text-mediumGray dark:text-gray-400">Fadlan sug inta aanu soo kaxaynayno xogtaada.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* --- Page Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-darkGray dark:text-gray-100">Projects Dashboard</h1>
          <p className="text-mediumGray dark:text-gray-400 mt-1">Manage all your projects from one place.</p>
        </div>
        <div className="flex gap-3 self-start md:self-center">
          <div className="flex items-center gap-3">
          {/* Dual Export Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="bg-secondary text-white py-2 px-4 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Download size={20} />
              <span>Daji Excel</span>
              <ChevronDown size={16} className={`transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-lightGray dark:border-gray-700 z-50 overflow-hidden animate-fade-in">
                <button
                  onClick={handleExportCombined}
                  className="w-full text-left px-4 py-3 hover:bg-lightGray dark:hover:bg-gray-700 flex items-center gap-3 transition-colors text-darkGray dark:text-gray-100"
                >
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <LayoutGrid size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Hal Excel (Combined)</p>
                    <p className="text-[10px] text-mediumGray">Dhammaan mashaariicda oo hal meel ah</p>
                  </div>
                </button>
                <div className="border-t border-lightGray dark:border-gray-700"></div>
                <button
                  onClick={handleExportIndividual}
                  className="w-full text-left px-4 py-3 hover:bg-lightGray dark:hover:bg-gray-700 flex items-center gap-3 transition-colors text-darkGray dark:text-gray-100"
                >
                  <div className="bg-secondary/10 p-2 rounded-lg text-secondary">
                    <Plus size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Mid Mid (Individual)</p>
                    <p className="text-[10px] text-mediumGray">Mashruuc kasta goonidiisa u daji</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <Link href="/projects/main/add" className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-lg hover:shadow-primary/40 flex items-center gap-2">
            <Plus size={20} /> <span className="hidden sm:inline">Add New Project</span><span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>
    </div>

      {/* --- Project Statistics Cards --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center border-l-4 border-primary flex flex-col items-center justify-center min-h-[110px]">
          <TrendingUp className="text-primary mb-2" size={22} />
          <h4 className="text-xs font-semibold text-primary mb-1 truncate">Active</h4>
          <span className="text-2xl md:text-3xl font-bold text-primary">{activeProjectsCount}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center border-l-4 border-secondary flex flex-col items-center justify-center min-h-[110px]">
          <CheckCircle className="text-secondary mb-2" size={22} />
          <h4 className="text-xs font-semibold text-secondary mb-1 truncate">Completed</h4>
          <span className="text-2xl md:text-3xl font-bold text-secondary">{completedProjectsCount}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center border-l-4 border-accent flex flex-col items-center justify-center min-h-[110px]">
          <Clock className="text-accent mb-2" size={22} />
          <h4 className="text-xs font-semibold text-accent mb-1 truncate">On Hold</h4>
          <span className="text-2xl md:text-3xl font-bold text-accent">{onHoldProjectsCount}</span>
        </div>
        {/* NEW: Agreement Total Card */}
        <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center border-l-4 border-blue-500 flex flex-col items-center justify-center min-h-[110px]">
          <Hash className="text-blue-500 mb-2" size={22} />
          <h4 className="text-xs font-semibold text-blue-500 mb-1 truncate">Heshiiska (Total)</h4>
          <span className="text-xl md:text-2xl font-bold text-blue-500">Br{totalAmount.toLocaleString()}</span>
        </div>
        {/* Advance Paid - renamed */}
        <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center border-l-4 border-secondary flex flex-col items-center justify-center min-h-[110px]">
          <DollarSign className="text-secondary mb-2" size={22} />
          <h4 className="text-xs font-semibold text-secondary mb-1 truncate">La Bixiyay (Advance)</h4>
          <span className="text-xl md:text-2xl font-bold text-secondary">Br{totalAdvance.toLocaleString()}</span>
        </div>
        <div className={`bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center border-l-4 ${totalRemaining <= 0 ? 'border-green-600' : 'border-redError'} flex flex-col items-center justify-center min-h-[110px]`}>
          <XCircle className={`${totalRemaining <= 0 ? 'text-green-600' : 'text-redError'} mb-2`} size={22} />
          <h4 className={`text-xs font-semibold ${totalRemaining <= 0 ? 'text-green-600' : 'text-redError'} mb-1 truncate`}>Haraaga (Remaining)</h4>
          <span className={`text-xl md:text-2xl font-bold ${totalRemaining <= 0 ? 'text-green-600' : 'text-redError'}`}>Br{totalRemaining.toLocaleString()}</span>
        </div>
      </div>

      {/* --- Search, Filter & View Mode Bar --- */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-8 flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-4 animate-fade-in-up">
        <div className="relative w-full lg:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <input type="text" placeholder="Search by name or client..."
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700/50 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
            <select
              title="Filter by project status"
              className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700/50 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition appearance-none"
              value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Overdue">Overdue</option>
              <option value="Nearing Deadline">Nearing Deadline</option>
            </select>
            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-mediumGray dark:text-gray-400" size={20} />
          </div>

          <div className="relative w-full sm:w-auto">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
            <select
              title="Filter by customer"
              className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700/50 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition appearance-none min-w-[150px]"
              value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)}
            >
              <option value="All">All Customers</option>
              {customerNames.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-mediumGray dark:text-gray-400" size={20} />
          </div>

          <div className="relative w-full sm:w-auto">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
            <select
              title="Filter by project type"
              className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700/50 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition appearance-none"
              value={filterType} onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Fixed">Fixed Price</option>
              <option value="PAYG">Pay As You Go</option>
            </select>
            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-mediumGray dark:text-gray-400" size={20} />
          </div>

          <div className="relative w-full sm:w-auto">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
            <select
              title="Filter by date range"
              className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700/50 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition appearance-none"
              value={filterDateRange} onChange={(e) => setFilterDateRange(e.target.value)}
            >
              <option value="All">Any Time</option>
              <option value="Today">Today</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-mediumGray dark:text-gray-400" size={20} />
          </div>
        </div>

        <div className="flex items-center space-x-4 w-full lg:w-auto">
          {/* Toggle for stats cards */}
          <div className="flex items-center gap-2 mr-auto lg:mr-0">
            <input
              type="checkbox"
              id="reflectFilters"
              checked={cardsReflectFilters}
              onChange={(e) => setCardsReflectFilters(e.target.checked)}
              className="w-4 h-4 text-primary rounded focus:ring-primary"
            />
            <label htmlFor="reflectFilters" className="text-xs font-semibold text-mediumGray dark:text-gray-400 cursor-pointer select-none">
              Apply Filters to Totals
            </label>
          </div>

          {/* View Mode Toggle */}
          <div className="flex space-x-2 bg-lightGray dark:bg-gray-700/50 p-1 rounded-lg">
            <button onClick={() => setViewMode('list')} className={`w-full sm:w-auto px-4 py-2 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 text-primary shadow' : 'text-mediumGray dark:text-gray-300'}`}>
              <List size={20} /> List
            </button>
            <button onClick={() => setViewMode('kanban')} className={`w-full sm:w-auto px-4 py-2 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-800 text-primary shadow' : 'text-mediumGray dark:text-gray-300'}`}>
              <LayoutGrid size={20} /> Board
            </button>
          </div>
        </div>
      </div>

      {/* --- Projects View --- */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in flex flex-col items-center gap-4">
          <FileX2 size={48} className="text-gray-300 dark:text-gray-600" />
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-200">No Projects Found</h3>
          <p>Codsigaaga wax mashruuc ah laguma helin. Isku day inaad beddesho miirayaasha.</p>
        </div>
      ) : viewMode === 'list' ? (
        // --- RESPONSIVE TABLE VIEW ---
        <div className="animate-fade-in">
          {/* Desktop Table Header (Hidden on Mobile) */}
          <table className="hidden md:table min-w-full text-sm">
            <thead className="bg-lightGray dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium text-mediumGray dark:text-gray-400 uppercase">Project</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-mediumGray dark:text-gray-400 uppercase">Client</th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-mediumGray dark:text-gray-400 uppercase">Amount</th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-mediumGray dark:text-gray-400 uppercase">Paid</th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-mediumGray dark:text-gray-400 uppercase">Remaining</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-mediumGray dark:text-gray-400 uppercase">Status</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-mediumGray dark:text-gray-400 uppercase">Progress</th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-mediumGray dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
          </table>
          {/* Table Body container handles both mobile cards and desktop rows */}
          <table className="min-w-full">
            <tbody className="md:divide-y md:divide-lightGray dark:md:divide-gray-700">
              {filteredProjects.map(project => (
                <ProjectRow key={project.id} project={project} onDelete={handleDeleteProject} onUpdateStatus={handleUpdateStatus} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // --- KANBAN BOARD VIEW ---
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 animate-fade-in">
          {Object.entries(kanbanColumns).filter(([_, projectsInColumn]) => projectsInColumn.length > 0) // Only show columns with projects
            .map(([status, projectsInColumn]) => (
              <div key={status} className="bg-lightGray/50 dark:bg-gray-900/50 p-4 rounded-xl shadow-inner flex flex-col w-full min-h-[300px]">
                <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-4 pb-2 border-b border-mediumGray/20 flex justify-between items-center">
                  <span>{status}</span>
                  <span className="text-sm font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">{projectsInColumn.length}</span>
                </h3>
                <div className="flex-1 space-y-4 overflow-y-auto pr-2 -mr-2"> {/* Scrollable content */}
                  {projectsInColumn.map(project => (
                    <KanbanCard key={project.id} project={project} onDelete={handleDeleteProject} onUpdateStatus={handleUpdateStatus} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}