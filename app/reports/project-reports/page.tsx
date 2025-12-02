// app/reports/project-reports/page.tsx - Project Reports Page (PDF-Ready Design)
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Layout from '../../../components/layouts/Layout';
import { Download, Printer, Loader2, Briefcase, Calendar, Filter, ChevronDown, ChevronUp, Eye, EyeOff, X, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSearchParams } from 'next/navigation';

// Types for project report data
interface ProjectReport {
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
  expenses: Array<{
    id: string;
    category: string;
    description: string;
    amount: number;
    date: string;
    subCategory?: string | null;
    note?: string | null;
    rentalPeriod?: string | null;
    transportType?: string | null;
    consultancyType?: string | null;
    consultantName?: string | null;
    supplierName?: string | null;
    employeeName?: string | null;
    materials?: any;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    description: string;
    amount: number;
    date: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    date: string;
    description: string;
  }>;
}

interface ProjectReportsData {
  companyName: string;
  companyLogoUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  projects: ProjectReport[];
  summary: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    onHoldProjects: number;
    totalRevenue: number;
    totalExpenses: number;
    totalProfit: number;
    averageProfitMargin: number;
  };
}

type DateFilterType = 'lastWeek' | 'lastMonth' | 'lastTwoMonths' | 'thisYear' | 'custom';

async function exportPDF(data: ProjectReportsData, showDetails: boolean) {
  const doc = new jsPDF('landscape');
  const formatCurrency = (value: number) => `${value.toLocaleString()} ETB`;

  const loadLogoAsDataUrl = async (logoUrl?: string | null) => {
    if (!logoUrl) return null;
    try {
      const response = await fetch(logoUrl);
      if (!response.ok) return null;
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Unable to load logo:', error);
      return null;
    }
  };

  const renderDocument = (logoDataUrl?: string) => {
    // Header
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 297, 30, 'F');
    
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', 270, 5, 20, 10);
      } catch {
        const initials = (data.companyName || 'BW').slice(0, 2).toUpperCase();
        doc.setFillColor(59, 130, 246);
        doc.circle(280, 10, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(initials, 280, 12, { align: 'center' });
      }
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(data.companyName || 'Company', 10, 12);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('Warbixinta Mashaariicda', 10, 18);
    
    const dateRange = data.startDate && data.endDate 
      ? `${data.startDate} - ${data.endDate}`
      : 'Dhammaan Mashaariicda';
    doc.text(`Muddo: ${dateRange}`, 10, 24);
    
    if (data.startDate && data.endDate) {
      doc.text(`Ref: PR-${data.startDate.replace(/-/g, '')}-${data.endDate.replace(/-/g, '')}`, 200, 24);
    }

    let yPos = 38;

    // Summary Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.text('Wadarta Guud', 10, yPos);
    yPos += 8;

    const summaryData = [
      ['Wadarta Mashaariicda', data.summary.totalProjects.toString()],
      ['Mashaariicda Firfircoon', data.summary.activeProjects.toString()],
      ['Mashaariicda Dhammaystiran', data.summary.completedProjects.toString()],
      ['Wadarta Dakhliga', formatCurrency(data.summary.totalRevenue)],
      ['Wadarta Kharashyada', formatCurrency(data.summary.totalExpenses)],
      ['Wadarta Faa\'iidada', formatCurrency(data.summary.totalProfit)],
      ['Faa\'iidada Dhexe', `${data.summary.averageProfitMargin.toFixed(2)}%`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Qeexitaan', 'Qiimaha']],
      body: summaryData,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      margin: { left: 10, right: 10 },
      columnStyles: { 1: { halign: 'right' } },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;

    // Projects Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.text('Warbixinta Mashaariicda', 10, yPos);
    yPos += 8;

    const projectHeaders = showDetails
      ? [['Mashruuc', 'Macmiil', 'Xaalad', 'Qiimaha', 'Dakhliga', 'Kharashyada', 'Faa\'iidada', 'Faa\'iidada %']]
      : [['Mashruuc', 'Macmiil', 'Xaalad', 'Qiimaha', 'Dakhliga', 'Kharashyada', 'Faa\'iidada', 'Faa\'iidada %']];

    const projectRows = data.projects.map(p => {
      if (showDetails) {
        return [
          p.name,
          p.customer,
          p.status,
          formatCurrency(p.projectValue),
          formatCurrency(p.totalRevenue),
          formatCurrency(p.totalExpenses),
          formatCurrency(p.grossProfit),
          `${p.profitMargin.toFixed(2)}%`,
        ];
      } else {
        return [
          p.name,
          p.customer,
          p.status,
          formatCurrency(p.projectValue),
          formatCurrency(p.totalRevenue),
          formatCurrency(p.totalExpenses),
          formatCurrency(p.grossProfit),
          `${p.profitMargin.toFixed(2)}%`,
        ];
      }
    });

    autoTable(doc, {
      startY: yPos,
      head: projectHeaders,
      body: projectRows,
      theme: 'striped',
      styles: { fontSize: 7 },
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      margin: { left: 10, right: 10 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
      },
    });

    // Add new page for detailed expenses if showDetails
    if (showDetails && data.projects.length > 0) {
      data.projects.forEach((project, index) => {
        if (index > 0 && index % 3 === 0) {
          doc.addPage();
        }
        
        const pageY = index % 3 === 0 ? 20 : (doc as any).lastAutoTable?.finalY + 10 || 20;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(34, 197, 94);
        doc.text(`${project.name} - Faahfaahin`, 10, pageY);
        
        if (project.expenses.length > 0) {
          const expenseRows = project.expenses.map(e => {
            // Build related details string similar to page layout
            const details: string[] = [];
            if (e.subCategory) details.push(`Sub: ${e.subCategory}`);
            if (e.employeeName) details.push(`Shaqaale: ${e.employeeName}`);
            if (e.rentalPeriod) details.push(`Kirro: ${e.rentalPeriod}`);
            if (e.transportType) details.push(`Gaadiid: ${e.transportType}`);
            if (e.consultancyType) details.push(`La-talin: ${e.consultancyType}`);
            if (e.consultantName) details.push(`La-taliye: ${e.consultantName}`);
            if (e.supplierName) details.push(`Supplier: ${e.supplierName}`);
            if (e.note) details.push(`Fiiro: ${e.note}`);

            const detailsText = details.join(' | ');

            return [
              e.category,
              e.description,
              detailsText,
              e.date,
              formatCurrency(e.amount),
            ];
          });
          
          autoTable(doc, {
            startY: pageY + 6,
            head: [['Nooca', 'Sharaxaad', 'Faahfaahin', 'Taariikh', 'Qiimaha']],
            body: expenseRows,
            theme: 'striped',
            styles: {
              fontSize: 6,
              cellPadding: 1.2,
              overflow: 'linebreak',
            },
            headStyles: { fillColor: [249, 115, 22], textColor: 255 },
            margin: { left: 10, right: 10 },
            columnStyles: {
              4: { halign: 'right' }, // only align amount column to right
            },
          });
        }
      });
    }

    doc.save(`Project-Reports-${data.startDate || 'all'}-${data.endDate || 'all'}.pdf`);
  };

  const logoDataUrl = await loadLogoAsDataUrl(data.companyLogoUrl);
  renderDocument(logoDataUrl || undefined);
}

function ProjectReportsContent() {
  const [reportData, setReportData] = useState<ProjectReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('thisYear');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('projectId');
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>(initialProjectId || 'all');

  const getDateRange = (filter: DateFilterType): { startDate: string; endDate: string } => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const endDate = today.toISOString().split('T')[0];

    switch (filter) {
      case 'lastWeek': {
        const start = new Date(today);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        return { startDate: start.toISOString().split('T')[0], endDate };
      }
      case 'lastMonth': {
        const start = new Date(today);
        start.setMonth(start.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        return { startDate: start.toISOString().split('T')[0], endDate };
      }
      case 'lastTwoMonths': {
        const start = new Date(today);
        start.setMonth(start.getMonth() - 2);
        start.setHours(0, 0, 0, 0);
        return { startDate: start.toISOString().split('T')[0], endDate };
      }
      case 'thisYear': {
        const start = new Date(today.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        return { startDate: start.toISOString().split('T')[0], endDate };
      }
      case 'custom': {
        return {
          startDate: customStartDate || new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
          endDate: customEndDate || endDate,
        };
      }
      default:
        return { startDate: '', endDate: '' };
    }
  };

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError('');
      try {
        const { startDate, endDate } = getDateRange(dateFilter);
        const url = `/api/accounting/reports/projects?${startDate ? `startDate=${startDate}&` : ''}${endDate ? `endDate=${endDate}` : ''}`;
        
        const res = await fetch(url, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!res.ok) throw new Error('Xogta lama helin');
        const data: ProjectReportsData = await res.json();
        setReportData(data);
      } catch (err) {
        setError('Cilad ayaa dhacday ama xog lama helin.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchReport();
  }, [dateFilter, customStartDate, customEndDate]);

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const visibleProjects = useMemo(() => {
    if (!reportData) return [];
    if (!selectedProjectId || selectedProjectId === 'all') return reportData.projects;
    return reportData.projects.filter(p => p.id === selectedProjectId);
  }, [reportData, selectedProjectId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} />
          <span className="text-xl text-mediumGray">Warbixinta ayaa soo dhacaya...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <XCircle size={48} className="mb-4 text-redError" />
          <div className="text-redError text-xl font-bold mb-4">{error}</div>
          <button onClick={() => window.location.reload()} className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Reload
          </button>
        </div>
      </Layout>
    );
  }

  if (!reportData) return null;

  const { startDate, endDate } = getDateRange(dateFilter);
  const dateRangeText = startDate && endDate 
    ? `${new Date(startDate).toLocaleDateString('so-SO')} - ${new Date(endDate).toLocaleDateString('so-SO')}`
    : 'Dhammaan Mashaariicda';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto pb-8 print:max-w-full pt-6 print:pt-0">
        {/* Filter Section - inside content */}
        <div className="mb-6 print:hidden bg-white dark:bg-gray-800 rounded-xl shadow-md border border-blue-200 dark:border-blue-800">
          <div className="py-3 px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Filter className="text-blue-600 dark:text-blue-400" size={20} />
                <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  Dooro Muddo & Mashruuc
                </span>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Quick Filter Buttons */}
                <button
                  onClick={() => setDateFilter('lastWeek')}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    dateFilter === 'lastWeek'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Todobaadka u danbeeyay
                </button>
                <button
                  onClick={() => setDateFilter('lastMonth')}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    dateFilter === 'lastMonth'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Bishii u danbeeyay
                </button>
                <button
                  onClick={() => setDateFilter('lastTwoMonths')}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    dateFilter === 'lastTwoMonths'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Labadii bilood ee u danbeeyay
                </button>
                <button
                  onClick={() => setDateFilter('thisYear')}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    dateFilter === 'thisYear'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Sanadkan
                </button>
                
                {/* Custom Date Range */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className={`px-3 py-1 rounded text-sm font-medium transition flex items-center gap-1 ${
                      dateFilter === 'custom'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Custom
                    {showFilterMenu ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  {showFilterMenu && (
                    <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 min-w-[300px]">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Taariikhda Bilowga
                          </label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => {
                              setCustomStartDate(e.target.value);
                              setDateFilter('custom');
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Taariikhda Dhamaadka
                          </label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => {
                              setCustomEndDate(e.target.value);
                              setDateFilter('custom');
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <button
                          onClick={() => setShowFilterMenu(false)}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* View Toggle */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className={`px-3 py-1 rounded text-sm font-medium transition flex items-center gap-1 ${
                    showDetails
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showDetails ? 'Guud' : 'Faahfaahin'}
                </button>

                {/* Project Selector */}
                {reportData.projects.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-300">Mashruuc:</span>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value as any)}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    >
                      <option value="all">Dhammaan mashaariicda</option>
                      {reportData.projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 text-white rounded-t-xl print:rounded-none shadow-xl print:shadow-none mb-6 print:mb-2 overflow-hidden">
          <div className="relative px-8 py-10 print:py-6">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-extrabold mb-2 tracking-tight">{reportData.companyName}</h1>
                <div className="text-indigo-100 text-lg">Warbixinta Mashaariicda</div>
                <div className="mt-3 flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-200" />
                  <span className="text-indigo-200 text-sm">
                    Muddo: <span className="font-bold text-white">{dateRangeText}</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-3">
                <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-6 py-3 text-center">
                  <div className="text-sm text-indigo-100 uppercase tracking-wide mb-1">Wadarta Mashaariicda</div>
                  <div className="text-2xl font-bold">
                    {selectedProjectId === 'all' ? reportData.summary.totalProjects : visibleProjects.length}
                  </div>
                </div>
                {startDate && endDate && (
                  <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2 text-center">
                    <div className="text-xs text-indigo-100 uppercase">Warbixin No</div>
                    <div className="text-sm font-bold">PR-{startDate.replace(/-/g, '')}-{endDate.replace(/-/g, '')}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 print:grid-cols-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Wadarta Dakhliga</div>
            <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-500">{reportData.summary.totalRevenue.toLocaleString()}</div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">ETB</div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
            <div className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">Wadarta Kharashyada</div>
            <div className="text-2xl font-extrabold text-red-700 dark:text-red-500">{reportData.summary.totalExpenses.toLocaleString()}</div>
            <div className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1">ETB</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">Wadarta Faa'iidada</div>
            <div className="text-2xl font-extrabold text-green-700 dark:text-green-500">{reportData.summary.totalProfit.toLocaleString()}</div>
            <div className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">ETB</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">Faa'iidada Dhexe</div>
            <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-500">{reportData.summary.averageProfitMargin.toFixed(2)}%</div>
            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1">Average</div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg print:shadow-none overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center text-indigo-700 dark:text-indigo-300">
                <Briefcase size={24} className="mr-2 text-indigo-500" />
                Mashaariicda ({visibleProjects.length})
              </h2>
              <div className="flex gap-2 print:hidden">
                <button
                  onClick={() => {
                    const projectsForExport = visibleProjects.length > 0 ? visibleProjects : reportData.projects;
                    const exportSummary = projectsForExport.reduce(
                      (acc, p) => {
                        acc.totalRevenue += p.totalRevenue;
                        acc.totalExpenses += p.totalExpenses;
                        acc.totalProfit += p.grossProfit;
                        return acc;
                      },
                      { totalRevenue: 0, totalExpenses: 0, totalProfit: 0 }
                    );
                    const dataForExport: ProjectReportsData = {
                      ...reportData,
                      projects: projectsForExport,
                      summary: {
                        ...reportData.summary,
                        totalProjects: projectsForExport.length,
                        totalRevenue: exportSummary.totalRevenue,
                        totalExpenses: exportSummary.totalExpenses,
                        totalProfit: exportSummary.totalProfit,
                        averageProfitMargin:
                          exportSummary.totalRevenue > 0
                            ? (exportSummary.totalProfit / exportSummary.totalRevenue) * 100
                            : 0,
                      },
                    };
                    exportPDF(dataForExport, showDetails);
                  }}
                  disabled={loading || !reportData}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition font-semibold shadow-lg disabled:opacity-50"
                >
                  <Download size={18} /> PDF
                </button>
                <button
                  onClick={() => window.print()}
                  disabled={loading || !reportData}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition font-semibold shadow-lg disabled:opacity-50"
                >
                  <Printer size={18} /> Print
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-indigo-50 dark:bg-indigo-900/20">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-indigo-900 dark:text-indigo-100 uppercase">Mashruuc</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-indigo-900 dark:text-indigo-100 uppercase">Macmiil</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-indigo-900 dark:text-indigo-100 uppercase">Xaalad</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-indigo-900 dark:text-indigo-100 uppercase">Qiimaha</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-indigo-900 dark:text-indigo-100 uppercase">Dakhliga</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-indigo-900 dark:text-indigo-100 uppercase">Kharashyada</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-indigo-900 dark:text-indigo-100 uppercase">Faa'iidada</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-indigo-900 dark:text-indigo-100 uppercase">Faa'iidada %</th>
                  {showDetails && (
                    <th className="px-4 py-3 text-center text-xs font-bold text-indigo-900 dark:text-indigo-100 uppercase">Faahfaahin</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {visibleProjects.map((project) => (
                  <React.Fragment key={project.id}>
                    <tr className="hover:bg-indigo-50 dark:hover:bg-indigo-900/10">
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-300">{project.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {project.startDate && new Date(project.startDate).toLocaleDateString('so-SO')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{project.customer}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          project.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          project.status === 'Active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900 dark:text-gray-300">
                        {project.projectValue.toLocaleString()} ETB
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-green-600 dark:text-green-400">
                        {project.totalRevenue.toLocaleString()} ETB
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-red-600 dark:text-red-400">
                        {project.totalExpenses.toLocaleString()} ETB
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold text-right ${
                        project.grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {project.grossProfit.toLocaleString()} ETB
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold text-right ${
                        project.profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {project.profitMargin.toFixed(2)}%
                      </td>
                      {showDetails && (
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleProjectExpansion(project.id)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                          >
                            {expandedProjects.has(project.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </td>
                      )}
                    </tr>
                    {showDetails && expandedProjects.has(project.id) && (
                      <tr>
                        <td colSpan={9} className="px-4 py-4 bg-gray-50 dark:bg-gray-900/50">
                          <div className="space-y-4">
                            {/* Expenses */}
                            {project.expenses.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Kharashyada:</h4>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-xs">
                                    <thead className="bg-orange-50 dark:bg-orange-900/20">
                                      <tr>
                                        <th className="px-2 py-1 text-left">Nooca Kharashka</th>
                                        <th className="px-2 py-1 text-left">Sharaxaad</th>
                                        <th className="px-2 py-1 text-left">Faahfaahinta La Xidhiidha</th>
                                        <th className="px-2 py-1 text-left">Taariikh</th>
                                        <th className="px-2 py-1 text-right">Qiimaha</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                      {project.expenses.map((exp) => (
                                        <tr key={exp.id}>
                                          {/* Nooca Kharashka */}
                                          <td className="px-2 py-1 align-top">
                                            <div className="text-[11px] font-semibold text-gray-900 dark:text-gray-100">
                                              {exp.category}
                                            </div>
                                            {exp.subCategory && (
                                              <div className="text-[10px] text-gray-600 dark:text-gray-400">
                                                {exp.subCategory}
                                              </div>
                                            )}
                                          </td>

                                          {/* Sharaxaad */}
                                          <td className="px-2 py-1 align-top">
                                            <div className="text-[11px] text-gray-900 dark:text-gray-100">
                                              {exp.description}
                                            </div>
                                          </td>

                                          {/* Faahfaahinta La Xidhiidha */}
                                          <td className="px-2 py-1 align-top">
                                            <div className="flex flex-wrap gap-1 text-[10px] text-gray-600 dark:text-gray-400 max-w-xs">
                                              {exp.employeeName && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700">
                                                  Shaqaale: {exp.employeeName}
                                                </span>
                                              )}
                                              {exp.rentalPeriod && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
                                                  Kirro: {exp.rentalPeriod}
                                                </span>
                                              )}
                                              {exp.transportType && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
                                                  Gaadiid: {exp.transportType}
                                                </span>
                                              )}
                                              {exp.consultancyType && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                                                  La-talin: {exp.consultancyType}
                                                </span>
                                              )}
                                              {exp.consultantName && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                                                  La-taliye: {exp.consultantName}
                                                </span>
                                              )}
                                              {exp.supplierName && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700">
                                                  Supplier: {exp.supplierName}
                                                </span>
                                              )}
                                              {exp.note && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700">
                                                  Fiiro: {exp.note}
                                                </span>
                                              )}
                                            </div>
                                          </td>

                                          {/* Taariikh */}
                                          <td className="px-2 py-1 whitespace-nowrap">
                                            {exp.date}
                                          </td>

                                          {/* Qiimaha */}
                                          <td className="px-2 py-1 text-right whitespace-nowrap">
                                            {exp.amount.toLocaleString()} ETB
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                            
                            {/* Payments */}
                            {project.payments.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Lacagaha la bixiyay:</h4>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-xs">
                                    <thead className="bg-green-50 dark:bg-green-900/20">
                                      <tr>
                                        <th className="px-2 py-1 text-left">Taariikh</th>
                                        <th className="px-2 py-1 text-left">Sharaxaad</th>
                                        <th className="px-2 py-1 text-right">Qiimaha</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                      {project.payments.map((pay) => (
                                        <tr key={pay.id}>
                                          <td className="px-2 py-1">{pay.date}</td>
                                          <td className="px-2 py-1">{pay.description || '-'}</td>
                                          <td className="px-2 py-1 text-right">{pay.amount.toLocaleString()} ETB</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {/* Total Row */}
                <tr className="bg-indigo-100 dark:bg-indigo-900/30 font-bold border-t-2 border-indigo-300 dark:border-indigo-700">
                  <td colSpan={3} className="px-4 py-3 text-sm text-indigo-900 dark:text-indigo-100">WADARTA</td>
                  <td className="px-4 py-3 text-sm text-right text-indigo-900 dark:text-indigo-100">
                    {visibleProjects.reduce((sum, p) => sum + p.projectValue, 0).toLocaleString()} ETB
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-indigo-900 dark:text-indigo-100">
                    {visibleProjects.reduce((sum, p) => sum + p.totalRevenue, 0).toLocaleString()} ETB
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-indigo-900 dark:text-indigo-100">
                    {visibleProjects.reduce((sum, p) => sum + p.totalExpenses, 0).toLocaleString()} ETB
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-indigo-900 dark:text-indigo-100">
                    {(() => {
                      const totalRevenue = visibleProjects.reduce((sum, p) => sum + p.totalRevenue, 0);
                      const totalProfit = visibleProjects.reduce((sum, p) => sum + p.grossProfit, 0);
                      const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
                      return margin.toFixed(2);
                    })()}%
                  </td>
                  {showDetails && <td></td>}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Print styles */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4 landscape;
              margin: 0.5cm;
            }
            body * {
              visibility: hidden;
            }
            .print\\:max-w-full,
            .print\\:rounded-none,
            .print\\:mb-2,
            .print\\:py-6,
            .print\\:grid-cols-4 {
              visibility: visible;
            }
            button {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </Layout>
  );
}

export default function ProjectReportsPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin mr-3 text-primary" size={32} />
            <span className="text-xl text-mediumGray">
              Warbixinta mashaariicda ayaa soo dhacaysa...
            </span>
          </div>
        </Layout>
      }
    >
      <ProjectReportsContent />
    </Suspense>
  );
}

