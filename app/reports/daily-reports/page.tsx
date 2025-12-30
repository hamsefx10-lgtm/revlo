// app/reports/daily-reports/page.tsx - Daily Report Page (Beautiful PDF-Ready Design)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { Download, Printer, Loader2, TrendingUp, TrendingDown, DollarSign, Receipt, FileText, XCircle, Wallet, Calendar, HelpCircle, X, HardDrive, Edit, ExternalLink, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types for report data
interface DailyReport {
  date: string;
  companyName?: string;
  companyLogoUrl?: string;
  preparedBy?: string;
  balances: {
    previous: Record<string, number>;
    today: Record<string, number>;
  };
  totalPrev: number;
  totalToday: number;
  income: number;
  incomeTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    account: string;
    project: string | null;
    customer: string | null;
    note: string | null;
    transactionDate: string;
    user: string | null;
  }>;
  transfers: Array<{
    id: string;
    description: string;
    amount: number;
    fromAccount: string;
    toAccount: string;
    transactionDate: string;
    note: string | null;
    user: string | null;
    type: string;
  }>;
  projectExpenses: Array<{
    id: string;
    date: string;
    project: string;
    category: string;
    description: string;
    amount: number;
    paidFrom?: string;
    note?: string | null;
  }>;
  companyExpenses: Array<{
    id: string;
    date: string;
    project: string;
    category: string;
    description: string;
    amount: number;
    subCategory?: string | null;
    employeeName?: string;
    rentalPeriod?: string;
    meterReading?: string;
    campaignName?: string;
    details?: string | null;
    expenseType?: string;
    note?: string | null;
    paidFrom?: string;
  }>;
  totalProjectExpenses: number;
  totalCompanyExpenses: number;
  totalExpenses: number;
  debtsCollected: Array<{
    project: string;
    amount: number;
  }>;
  fixedAssets?: Array<{
    id: string;
    name: string;
    type: string;
    value: number;
    purchaseDate: string;
    vendor: string | null;
    assignedTo: string | null;
  }>;
  totalFixedAssets?: number;
}

async function exportPDF(data: DailyReport) {
  const doc = new jsPDF();
  const formatCurrency = (value: number) => `${value.toLocaleString()} ETB`;

  const loadLogoAsDataUrl = async (logoUrl?: string) => {
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
    // Modern header
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 32, 'F');
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', 172, 6, 22, 12);
      } catch {
        // fallback to initials if image fails
        doc.setFillColor(59, 130, 246);
        doc.circle(182, 12, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const initials = (data.companyName || 'BW').slice(0, 2).toUpperCase();
        doc.text(initials, 182, 14, { align: 'center' });
      }
    } else {
      const initials = (data.companyName || 'BW').slice(0, 2).toUpperCase();
      doc.setFillColor(59, 130, 246);
      doc.circle(182, 12, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(initials, 182, 14, { align: 'center' });
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(data.companyName || 'Birshiil Work Shop', 14, 15, { align: 'left' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('Daily Financial Report', 14, 21);
    doc.text(`Date: ${data.date}`, 14, 27);
    doc.text(`Ref: D-${data.date.replace(/-/g, '')}`, 70, 27);
    if (data.preparedBy) {
      doc.text(`Prepared by: ${data.preparedBy}`, 150, 27, { align: 'right' });
    }

    let yPos = 40;

    const renderTableSection = (
      title: string,
      color: [number, number, number],
      head: string[][],
      body: (string | number)[][],
      totalText?: string
    ) => {
      if (!body.length) return;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...color);
      doc.setFontSize(13);
      doc.text(title, 14, yPos);
      yPos += 6;

      autoTable(doc, {
        startY: yPos,
        head,
        body,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: color, textColor: 255 },
        margin: { left: 14, right: 14 },
        columnStyles: { [head[0].length - 1]: { halign: 'right' } },
      });

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      yPos = (doc as any).lastAutoTable.finalY + 10;

      if (totalText) {
        doc.setFont('helvetica', 'bold');
        doc.text(totalText, 196, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 8;
      }
    };

    // Project expenses
    if (data.projectExpenses.length > 0) {
      renderTableSection(
        'Project Expenses',
        [59, 130, 246],
        [['Project', 'Category', 'Description', 'Amount']],
        data.projectExpenses.map((e) => [
          e.project,
          e.category,
          e.description,
          formatCurrency(e.amount),
        ]),
        `Total: ${formatCurrency(data.totalProjectExpenses)}`
      );
    }

    // Company expenses
    if (data.companyExpenses.length > 0) {
      renderTableSection(
        'Company Expenses',
        [34, 197, 94],
        [['Nooca Kharashka', 'Faahfaahin', 'Qiimaha']],
        data.companyExpenses.map((e) => {
          let description = e.description || '';
          if (e.details) description += ` (${e.details})`;
          if (e.note) description += `\nFiiro: ${e.note}`;
          return [e.category, description, formatCurrency(e.amount)];
        }),
        `Total: ${formatCurrency(data.totalCompanyExpenses)}`
      );
    }

    // Debts collected
    if (data.debtsCollected.length > 0) {
      renderTableSection(
        'Debt Repaid / Advance Received',
        [249, 115, 22],
        [['Project', 'Amount']],
        data.debtsCollected.map((d) => [d.project, formatCurrency(d.amount)]),
        `Total: ${formatCurrency(
          data.debtsCollected.reduce((sum, d) => sum + d.amount, 0)
        )}`
      );
    }

    // Account balances after expenses
    if (data.balances && Object.keys(data.balances.today).length > 0) {
      const allAccounts = Array.from(
        new Set([
          ...Object.keys(data.balances.previous || {}),
          ...Object.keys(data.balances.today || {}),
        ])
      );
      const balanceRows = allAccounts.map((name) => [
        name,
        formatCurrency(data.balances.previous[name] || 0),
        formatCurrency(data.balances.today[name] || 0),
      ]);
      balanceRows.push([
        'TOTAL ACCOUNTS',
        formatCurrency(data.totalPrev || 0),
        formatCurrency(data.totalToday || 0),
      ]);

      renderTableSection(
        'Account Balances',
        [99, 102, 241],
        [['Account', 'Previous', 'Today']],
        balanceRows
      );
    }

    // Income transactions (after balances)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(13);
    doc.text('Dakhliga Maalinta', 14, yPos);
    yPos += 6;
    if (data.incomeTransactions.length > 0) {
      const incomeRows = data.incomeTransactions.map((tx) => {
        let description = tx.description || '';
        if (tx.customer) description += ` | Macmiil: ${tx.customer}`;
        if (tx.project) description += ` | Mashruuc: ${tx.project}`;
        if (tx.note) description += `\nFiiro: ${tx.note}`;
        return [description, tx.account || 'N/A', formatCurrency(tx.amount)];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Sharaxaad', 'Akoon', 'Qiimaha']],
        body: incomeRows,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        margin: { left: 14, right: 14 },
        columnStyles: { 2: { halign: 'right' } },
      });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text(
        `Wadarta: ${formatCurrency(data.income ?? 0)}`,
        196,
        (doc as any).lastAutoTable.finalY + 8,
        { align: 'right' }
      );
      yPos = (doc as any).lastAutoTable.finalY + 14;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(10);
      doc.text('Ma jiro dakhli maalintan.', 14, yPos);
      yPos += 10;
    }

    // Transfers
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(147, 51, 234);
    doc.setFontSize(13);
    doc.text('Wareejinta Lacagaha', 14, yPos);
    yPos += 6;
    if (data.transfers.length > 0) {
      const transferRows = data.transfers.map((tx) => {
        let description = tx.description || '';
        if (tx.note) description += `\nFiiro: ${tx.note}`;
        return [
          tx.fromAccount || 'N/A',
          tx.toAccount || 'N/A',
          description,
          formatCurrency(tx.amount),
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Laga Wareejiyay', 'Loo Wareejiyay', 'Sharaxaad', 'Qiimaha']],
        body: transferRows,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [147, 51, 234], textColor: 255 },
        margin: { left: 14, right: 14 },
        columnStyles: { 3: { halign: 'right' } },
      });
      yPos = (doc as any).lastAutoTable.finalY + 14;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(10);
      doc.text('Ma jirto wareejin lacag maalintan.', 14, yPos);
      yPos += 10;
    }

    // Summary
    doc.setDrawColor(226, 232, 240);
    doc.line(14, yPos, 196, yPos);
    yPos += 6;
    const netFlow = (data.income ?? 0) - (data.totalExpenses ?? 0);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Summary', 14, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Dakhliga: ${formatCurrency(data.income ?? 0)}`, 14, yPos);
    yPos += 5;
    doc.text(`Kharashyada: ${formatCurrency(data.totalExpenses ?? 0)}`, 14, yPos);
    yPos += 5;
    const netFlowLabel = `${netFlow >= 0 ? '+' : '-'}${formatCurrency(Math.abs(netFlow))}`;
    doc.text(`Net Flow: ${netFlowLabel}`, 14, yPos);

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Prepared by ${data.preparedBy || 'System'} • Printed ${new Date().toLocaleString()}`,
      14,
      pageHeight - 12
    );
    doc.text('Powered by Revlo', 196, pageHeight - 12, { align: 'right' });

    doc.save(`daily_report_${data.date}.pdf`);
  };

  const logoDataUrl = await loadLogoAsDataUrl(data.companyLogoUrl);
  renderDocument(logoDataUrl || undefined);
}

export default function DailyReportPage() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today's date in YYYY-MM-DD format
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [showHelp, setShowHelp] = useState(false);
  const [isChangingDate, setIsChangingDate] = useState(false);

  // Optimized date change handler
  const handleDateChange = (newDate: string) => {
    setIsChangingDate(true);
    setSelectedDate(newDate);
    // Reset the flag after a short delay
    setTimeout(() => setIsChangingDate(false), 500);
  };

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError('');
      try {
        // Add cache busting and faster fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout (increased for large datasets)
        
        const res = await fetch(`/api/reports/daily?date=${selectedDate}&t=${Date.now()}`, {
          signal: controller.signal,
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || 'Xogta lama helin');
        }
        const data: DailyReport = await res.json();
        setReport(data);
      } catch (err: any) {
        console.error('Daily Report fetch error:', err);
        if (err instanceof Error && err.name === 'AbortError') {
          setError('Waqtiga dhameeyay. Isku day mar kale.');
        } else {
          setError(err?.message || 'Cilad ayaa dhacday ama xog lama helin.');
        }
      } finally {
        setLoading(false);
      }
    }
    
    // Immediate fetch for faster response
    fetchReport();
  }, [selectedDate]);

  // Keyboard shortcuts for date navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return; // Don't trigger when typing in inputs
      if (loading || isChangingDate) return; // Don't trigger when loading or changing
      
      if (e.key === 'ArrowLeft') {
        // Previous day
        const currentDate = new Date(selectedDate);
        currentDate.setDate(currentDate.getDate() - 1);
        handleDateChange(currentDate.toISOString().split('T')[0]);
      } else if (e.key === 'ArrowRight') {
        // Next day (if not future)
        const currentDate = new Date(selectedDate);
        const tomorrow = new Date(currentDate);
        tomorrow.setDate(currentDate.getDate() + 1);
        const today = new Date();
        if (tomorrow <= today) {
          handleDateChange(tomorrow.toISOString().split('T')[0]);
        }
      } else if (e.key === 'Home') {
        // Today
        const today = new Date().toISOString().split('T')[0];
        handleDateChange(today);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedDate, loading, isChangingDate]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} />
          <span className="text-xl text-mediumGray">Loading daily report...</span>
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

  if (!report) return null;

  const totalExpensesIncludingAssets = report.totalExpenses + (report.totalFixedAssets || 0);
  const netFlow = report.income - totalExpensesIncludingAssets;
  const hasData = 
    report.income > 0 ||
    report.totalExpenses > 0 ||
    report.debtsCollected.length > 0 ||
    report.incomeTransactions.length > 0 ||
    report.transfers.length > 0 ||
    (report.fixedAssets && report.fixedAssets.length > 0);
  const hasBalances = report.balances && Object.keys(report.balances.today).length > 0;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-8 print:max-w-full print:pt-0">
        {/* Modern Date Picker Section - Sticky Below Topbar */}
        <div className="mb-4 print:hidden bg-white dark:bg-gray-800 sticky top-0 z-30 border-t border-gray-200 dark:border-gray-700 -mx-4 md:-mx-8 px-4 md:px-8">
          <div className="py-2 max-w-6xl mx-auto">
            {/* Mobile: Modern Compact Layout */}
            <div className="md:hidden flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="text-blue-600 dark:text-blue-400" size={18} />
              </div>
              <div className="relative flex-1">
                <input
                  type="date"
                  id="main-report-date-mobile"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={loading || isChangingDate}
                  title="Dooro taariikhda warbixinta"
                  aria-label="Dooro taariikhda warbixinta"
                  className="w-full px-4 py-2.5 pr-10 border-2 border-blue-300 dark:border-blue-600 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm font-semibold bg-white shadow-sm disabled:opacity-50"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 pointer-events-none" size={16} />
              </div>
              <button
                onClick={() => {
                  const currentDate = new Date(selectedDate);
                  currentDate.setDate(currentDate.getDate() - 1);
                  handleDateChange(currentDate.toISOString().split('T')[0]);
                }}
                disabled={loading || isChangingDate}
                className="p-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl transition shadow-sm disabled:opacity-50"
                title="Hore"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  handleDateChange(today);
                }}
                disabled={loading || isChangingDate}
                className={`px-3 py-2 rounded-xl font-semibold transition text-xs disabled:opacity-50 flex items-center gap-1.5 shadow-md ${
                  selectedDate === new Date().toISOString().split('T')[0]
                    ? 'bg-green-600 text-white shadow-green-200'
                    : 'bg-green-100 dark:bg-green-800 hover:bg-green-200 dark:hover:bg-green-700 text-green-800 dark:text-green-200'
                }`}
                title="Maanta"
              >
                <Clock size={16} />
                <span className="hidden sm:inline">Maanta</span>
              </button>
              <button
                onClick={() => {
                  const currentDate = new Date(selectedDate);
                  const tomorrow = new Date(currentDate);
                  tomorrow.setDate(currentDate.getDate() + 1);
                  const today = new Date();
                  if (tomorrow <= today) {
                    handleDateChange(tomorrow.toISOString().split('T')[0]);
                  }
                }}
                disabled={loading || isChangingDate || selectedDate >= new Date().toISOString().split('T')[0]}
                className="p-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl transition shadow-sm disabled:opacity-50"
                title="Xigta"
              >
                <ChevronRight size={18} />
              </button>
              {(loading || isChangingDate) && (
                <Loader2 className="animate-spin text-blue-600 flex-shrink-0" size={18} />
              )}
              </div>
              
            {/* Desktop: Modern Layout */}
            <div className="hidden md:flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 shadow-md">
                  <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <div className="text-base font-bold text-gray-800 dark:text-gray-200">Dooro Taariikhda Warbixinta</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Warbixin maalinlaha ah</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    handleDateChange(yesterday.toISOString().split('T')[0]);
                  }}
                  disabled={loading || isChangingDate}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50"
                >
                  Shalay
                </button>
                
                <button
                  onClick={() => {
                    const currentDate = new Date(selectedDate);
                    currentDate.setDate(currentDate.getDate() - 1);
                    handleDateChange(currentDate.toISOString().split('T')[0]);
                  }}
                  disabled={loading || isChangingDate}
                  className="p-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition shadow-sm disabled:opacity-50"
                  title="Maalinta hore"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="relative">
                <input
                  type="date"
                  id="main-report-date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={loading || isChangingDate}
                    title="Dooro taariikhda warbixinta"
                    aria-label="Dooro taariikhda warbixinta"
                    className="px-4 py-2 border-2 border-blue-300 dark:border-blue-600 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm font-semibold bg-white shadow-sm min-w-[140px] text-center disabled:opacity-50"
                />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 pointer-events-none" size={16} />
                </div>
                
                <button
                  onClick={() => {
                    const currentDate = new Date(selectedDate);
                    const tomorrow = new Date(currentDate);
                    tomorrow.setDate(currentDate.getDate() + 1);
                    const today = new Date();
                    if (tomorrow <= today) {
                      handleDateChange(tomorrow.toISOString().split('T')[0]);
                    }
                  }}
                  disabled={loading || isChangingDate || selectedDate >= new Date().toISOString().split('T')[0]}
                  className="p-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition shadow-sm disabled:opacity-50"
                  title="Maalinta xigta"
                >
                  <ChevronRight size={16} />
                </button>
                
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    handleDateChange(today);
                  }}
                  disabled={loading || isChangingDate}
                  className={`px-4 py-2 rounded-xl font-semibold transition text-xs disabled:opacity-50 shadow-md flex items-center gap-1.5 ${
                    selectedDate === new Date().toISOString().split('T')[0]
                      ? 'bg-green-600 text-white shadow-green-200'
                      : 'bg-green-100 dark:bg-green-800 hover:bg-green-200 dark:hover:bg-green-700 text-green-800 dark:text-green-200'
                  }`}
                >
                  <Clock size={16} />
                  <span>Maanta</span>
                </button>
            
            {(loading || isChangingDate) && (
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 ml-2">
                    <Loader2 className="animate-spin" size={16} />
                <span className="text-xs font-medium">
                  {isChangingDate ? 'Beddelaya...' : 'Loading...'}
                </span>
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Old Enhanced Date Picker Section - Hidden */}
        <div className="mb-6 print:hidden hidden">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl shadow-lg p-6 border-2 border-blue-200 dark:border-blue-700">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-full shadow-lg">
                  <Calendar size={24} />
                </div>
                <div>
                  <label htmlFor="report-date" className="block text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">
                    Dooro Taariikhda Warbixinta
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dooro taariikh kasta si aad u hesho warbixinta maalintaas oo dhamaystiran
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                {/* Quick Navigation Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      setSelectedDate(yesterday.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-2 bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-lg font-semibold transition text-sm"
                  >
                    Shalay
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setSelectedDate(today);
                    }}
                    className={`px-3 py-2 rounded-lg font-semibold transition text-sm ${
                      selectedDate === new Date().toISOString().split('T')[0]
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200'
                    }`}
                  >
                    Maanta
                  </button>
                  <button
                    onClick={() => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      setSelectedDate(weekAgo.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-2 bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-lg font-semibold transition text-sm"
                  >
                    Toddobaad ka hor
                  </button>
                </div>
                
                {/* Date Input */}
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    id="report-date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]} // Can't select future dates
                    className="px-4 py-3 border-2 border-blue-300 dark:border-blue-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-lg font-semibold shadow-md min-w-[160px]"
                  />
                  {loading && (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Loader2 className="animate-spin" size={20} />
                      <span className="text-sm font-medium">Soo qaadaya...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Selected Date Display */}
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Warbixinta: <span className="text-blue-700 dark:text-blue-300 font-bold">{report?.date || selectedDate}</span>
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {report && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border">
                      Waqtiga cusbooneysiin: {new Date().toLocaleTimeString('so-SO')}
                    </div>
                  )}
                  <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-700 transition flex items-center gap-1"
                  >
                    <HelpCircle size={12} />
                    Caawimo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:hidden">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Caawimada Isticmaalka</h3>
                <button
                  onClick={() => setShowHelp(false)}
                  title="Xidh"
                  aria-label="Xidh caawimada"
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Keyboard Shortcuts:</h4>
                  <ul className="space-y-1 ml-4">
                    <li>• <kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">←</kbd> Maalinta hore</li>
                    <li>• <kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">→</kbd> Maalinta xigta</li>
                    <li>• <kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">Home</kbd> Maanta</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Waxyaabaha Muhiimka ah:</h4>
                  <ul className="space-y-1 ml-4">
                    <li>• Warbixinta waxay soo bandhigtaa dhammaan dhaqdhaqaaqyada maalinta</li>
                    <li>• Waxaad download garayn kartaa PDF ama print garayn kartaa</li>
                    <li>• Balances-ka waxay muujinayaan xaaladda lacagaha</li>
                    <li>• Ma dooran kartid taariikhyo mustaqbalka ah</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MOBILE-OPTIMIZED Header */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-t-xl print:rounded-none shadow-xl print:shadow-none mb-6 print:mb-2 overflow-hidden">
          <div className="relative px-4 py-6 md:px-8 md:py-10 print:py-6">
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
            </div>
            
            <div className="relative z-10 flex flex-col gap-4">
              {/* Mobile: Simplified Layout */}
              <div className="md:hidden">
                <h1 className="text-2xl font-extrabold mb-1 tracking-tight">{report.companyName || 'Birshiil Work Shop'}</h1>
                <div className="text-blue-100 text-sm mb-3">Warbixinta Maalinlaha ah</div>
                <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-4 py-2">
                  <div className="text-xs text-blue-100 uppercase tracking-wide mb-1">Taariikhda</div>
                  <div className="text-lg font-bold">{report.date}</div>
                  <div className="text-xs text-blue-200 mt-1">No: D-{report.date.replace(/-/g, '')}</div>
                </div>
                {report.preparedBy && (
                  <div className="mt-2 text-xs text-blue-200">
                    Diyaariyey: {report.preparedBy}
                  </div>
                )}
              </div>
              
              {/* Desktop: Original Layout */}
              <div className="hidden md:flex md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-extrabold mb-2 tracking-tight">{report.companyName || 'Birshiil Work Shop'}</h1>
                <div className="text-blue-100 text-lg">Warbixinta Maalinlaha ah</div>
                <div className="mt-3 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-200" />
                  <span className="text-blue-200 text-sm">
                    Warbixinta: <span className="font-bold text-white">
                      {new Date(selectedDate).toLocaleDateString('so-SO', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-3">
                <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-6 py-3 text-center print:bg-white/10">
                  <div className="text-sm text-blue-100 uppercase tracking-wide mb-1">Taariikhda</div>
                  <div className="text-2xl font-bold">{report.date}</div>
                </div>
                <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2 text-center print:bg-white/10">
                  <div className="text-xs text-blue-100 uppercase">Warbixin No</div>
                  <div className="text-sm font-bold">D-{report.date.replace(/-/g, '')}</div>
                </div>
                {report.preparedBy && (
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 text-center text-white text-xs font-semibold">
                    Diyaariyey: {report.preparedBy}
                  </div>
                )}
                </div>
              </div>
              </div>
        </div>
        </div>
      </div>

        {/* Main Content Container */}
        <div className="bg-white dark:bg-gray-800 rounded-b-xl print:rounded-none shadow-lg print:shadow-none overflow-hidden">

          {/* Summary Cards - Consistent Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            {/* Income Card */}
            <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
                </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dakhliga</div>
                    <div className="text-xl md:text-2xl font-extrabold text-green-700 dark:text-green-300 mt-1">
                      {report.income.toLocaleString()}
              </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ETB</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses Card */}
            <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <TrendingDown size={20} className="text-red-600 dark:text-red-400" />
                </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Kharashyada</div>
                    <div className="text-xl md:text-2xl font-extrabold text-red-700 dark:text-red-300 mt-1">
                      {totalExpensesIncludingAssets.toLocaleString()}
              </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ETB</div>
              {(report.totalFixedAssets || 0) > 0 && (
                <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                        (Hantida: {(report.totalFixedAssets || 0).toLocaleString()})
                </div>
              )}
            </div>
                </div>
              </div>
            </div>

            {/* Net Flow Card */}
            <div className={`bg-white dark:bg-gray-800 p-5 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 ${netFlow >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${netFlow >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                    <DollarSign size={20} className={netFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'} />
                  </div>
                  <div>
                    <div className={`text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide`}>Net Flow</div>
                    <div className={`text-xl md:text-2xl font-extrabold mt-1 ${netFlow >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>
                {netFlow >= 0 ? '+' : ''}{netFlow.toLocaleString()}
              </div>
                    <div className={`text-xs text-gray-500 dark:text-gray-400 mt-0.5`}>ETB</div>
                  </div>
                </div>
              </div>
        </div>
      </div>

          {/* Transactions Sections - MOBILE OPTIMIZED */}
          <div className="p-4 md:p-8 space-y-6 md:space-y-8 print:p-4">
            {/* Income Transactions Section - MOBILE OPTIMIZED */}
            {report.incomeTransactions.length > 0 && (
              <div className="border border-green-100 dark:border-green-900 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-white dark:bg-gray-900 px-4 md:px-6 py-3 md:py-4 border-b border-green-100 dark:border-green-900 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-bold flex items-center text-green-700 dark:text-green-300">
                      <TrendingUp size={20} className="mr-2 text-green-500" />
                      <span className="hidden md:inline">Dakhliga Maanta (Faahfaahin)</span>
                      <span className="md:hidden">Dakhliga</span>
                    </h2>
                    <div className="px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-200">
                      {report.incomeTransactions.length}
                    </div>
                  </div>
                  <p className="hidden md:block text-xs text-gray-500 dark:text-gray-400">Waxa lagu tusayaa macmiilka, mashruuca iyo akoonka dakhligu ku dhacay.</p>
                </div>
                
                {/* Mobile: Card Layout */}
                <div className="md:hidden bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {report.incomeTransactions.map((tx, i) => (
                    <div key={tx.id || i} className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-300">{tx.description}</div>
                          <div className="mt-1 space-y-1">
                            {tx.customer && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Macmiil:</span> {tx.customer}
                              </div>
                            )}
                            {tx.project && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Mashruuc:</span> {tx.project}
                              </div>
                            )}
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Akoon:</span> {tx.account}
                            </div>
                            {tx.note && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">Fiiro: {tx.note}</div>
                            )}
                          </div>
                        </div>
                        <div className="ml-3 text-right">
                          <div className="text-base font-bold text-green-700 dark:text-green-300">{tx.amount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">ETB</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 border-t-2 border-green-300 dark:border-green-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-green-900 dark:text-green-100">WADARTA</span>
                      <span className="text-lg font-bold text-green-700 dark:text-green-300">{report.income.toLocaleString()} ETB</span>
                    </div>
                  </div>
                </div>
                
                {/* Desktop: Card Layout */}
                <div className="hidden md:block bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {report.incomeTransactions.map((tx, i) => (
                    <div key={tx.id || i} className="p-4 hover:bg-green-50 dark:hover:bg-green-900/10 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Sharaxaad</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-300">{tx.description}</div>
                            {tx.note && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">Fiiro: {tx.note}</div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Macmiil / Mashruuc</div>
                            <div className="text-sm text-gray-900 dark:text-gray-300">
                              {tx.customer && <div>{tx.customer}</div>}
                              {tx.project && <div className="text-xs text-gray-600 dark:text-gray-400">{tx.project}</div>}
                              {!tx.customer && !tx.project && <div className="text-gray-400">-</div>}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Akoon</div>
                            <div className="text-sm text-gray-900 dark:text-gray-300">{tx.account}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-green-700 dark:text-green-300">{tx.amount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">ETB</div>
                        </div>
                      </div>
                    </div>
                      ))}
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 border-t-2 border-green-300 dark:border-green-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-green-900 dark:text-green-100">WADARTA DAKHLIGA</span>
                      <span className="text-lg font-bold text-green-700 dark:text-green-300">{report.income.toLocaleString()} ETB</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {report.incomeTransactions.length === 0 && (
              <div className="border border-green-100 dark:border-green-900 rounded-xl px-6 py-4 bg-white dark:bg-gray-800 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 italic">
                <TrendingUp size={20} className="text-green-500" />
                <span>Ma jiro dakhli la diiwaangeliyay maalintan.</span>
              </div>
            )}

            {/* Transfer Transactions Section - MOBILE OPTIMIZED */}
            {report.transfers.length > 0 && (
              <div className="border border-purple-100 dark:border-purple-900 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-white dark:bg-gray-900 px-4 md:px-6 py-3 md:py-4 border-b border-purple-100 dark:border-purple-900 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-bold flex items-center text-purple-700 dark:text-purple-300">
                      <Wallet size={20} className="mr-2 text-purple-500" />
                      Wareejinta
                    </h2>
                    <div className="px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                      {report.transfers.length}
                    </div>
                  </div>
                  <p className="hidden md:block text-xs text-gray-500 dark:text-gray-400">Waxa lagu tusayaa sida lacagtu uga baxday akoon iyo meesha ay u gudubtay.</p>
                </div>
                
                {/* Mobile: Card Layout */}
                <div className="md:hidden bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {report.transfers.map((tx, i) => (
                    <div key={tx.id || i} className="p-4 space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-400 mb-1">Laga Wareejiyay</div>
                          <div className="text-sm font-bold text-gray-900 dark:text-gray-300">{tx.fromAccount}</div>
                        </div>
                        <div className="mx-2">
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                              <span className="text-purple-600 dark:text-purple-300 font-bold">→</span>
                            </div>
                        </div>
                        <div className="flex-1 text-right">
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-400 mb-1">Loo Wareejiyay</div>
                          <div className="text-sm font-bold text-gray-900 dark:text-gray-300">{tx.toAccount}</div>
                        </div>
                      </div>
                      {tx.description && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Sharaxaad:</span> {tx.description}
                        </div>
                      )}
                      {tx.note && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 italic">Fiiro: {tx.note}</div>
                      )}
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Qiimaha:</span>
                          <span className="text-base font-bold text-purple-700 dark:text-purple-300">{tx.amount.toLocaleString()} ETB</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Desktop: Card Layout */}
                <div className="hidden md:block bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {report.transfers.map((tx, i) => (
                    <div key={tx.id || i} className="p-4 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Laga Wareejiyay</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-300">{tx.fromAccount}</div>
                          </div>
                          <div className="flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                              <span className="text-purple-600 dark:text-purple-300 font-bold text-lg">→</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Loo Wareejiyay</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-300">{tx.toAccount}</div>
                          </div>
                        </div>
                        <div className="text-right min-w-[120px]">
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Qiimaha</div>
                          <div className="text-base font-bold text-purple-700 dark:text-purple-300">{tx.amount.toLocaleString()} ETB</div>
                        </div>
                      </div>
                      {(tx.description || tx.note) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          {tx.description && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Sharaxaad:</span> {tx.description}
                            </div>
                          )}
                            {tx.note && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">Fiiro: {tx.note}</div>
                            )}
                        </div>
                      )}
                    </div>
                      ))}
                </div>
              </div>
            )}
            {report.transfers.length === 0 && (
              <div className="border border-purple-100 dark:border-purple-900 rounded-xl px-6 py-4 bg-white dark:bg-gray-800 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 italic">
                <Wallet size={20} className="text-purple-500" />
                <span>Maalintan laguma samayn wax wareejin ah.</span>
              </div>
            )}
            {/* Debts Collected - CARD LAYOUT */}
            {report.debtsCollected.length > 0 && (
              <div className="border-2 border-orange-200 dark:border-orange-800 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 md:px-6 py-3 md:py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-bold flex items-center">
                      <FileText size={20} className="mr-2" />
                      Debt Repaid / Advance Received
                    </h2>
                    <div className="bg-white/30 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold">
                      {report.debtsCollected.length} Item(s)
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {report.debtsCollected.map((d, i) => (
                    <div key={i} className="p-4 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Mashruuc</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-300">{d.project}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Qiime</div>
                          <div className="text-base font-bold text-orange-700 dark:text-orange-300">{d.amount.toLocaleString()} ETB</div>
                        </div>
                      </div>
                    </div>
                ))}
                  <div className="p-4 bg-orange-100 dark:bg-orange-900/30 border-t-2 border-orange-300 dark:border-orange-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-orange-900 dark:text-orange-100">WADARTA</span>
                      <span className="text-lg font-bold text-orange-700 dark:text-orange-300">{report.debtsCollected.reduce((sum, d) => sum + d.amount, 0).toLocaleString()} ETB</span>
                    </div>
                  </div>
            </div>
          </div>
        )}

            {/* Project Expenses - MOBILE OPTIMIZED */}
            {report.projectExpenses.length > 0 && (
              <div className="border-2 border-blue-200 dark:border-blue-800 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 md:px-6 py-3 md:py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-bold flex items-center">
                      <Receipt size={20} className="mr-2" />
                      <span className="hidden md:inline">Kharashyada Mashruucyada</span>
                      <span className="md:hidden">Kharashyada</span>
                    </h2>
                    <div className="bg-white/30 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold">
                      {report.projectExpenses.length}
          </div>
          </div>
        </div>
                
                {/* Mobile: Card Layout */}
                <div className="md:hidden bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {report.projectExpenses.map((e, i) => (
                    <div key={e.id || i} className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-semibold">
                              {e.category}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{e.date}</span>
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-300 mb-1">{e.project}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{e.description}</div>
                            {e.note && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">Fiiro: {e.note}</div>
                            )}
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            <span className="font-medium">Akoon:</span> {e.paidFrom || 'Cash'}
                          </div>
                        </div>
                        <div className="ml-3 flex flex-col items-end gap-2">
                          <div className="text-base font-bold text-red-700 dark:text-red-300">{e.amount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">ETB</div>
                          <Link 
                            href={`/expenses/edit/${e.id}`}
                            className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                            title="Wax ka beddel"
                          >
                            <Edit size={16} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/30 border-t-2 border-blue-300 dark:border-blue-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-blue-900 dark:text-blue-100">WADARTA</span>
                      <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{report.totalProjectExpenses.toLocaleString()} ETB</span>
                    </div>
                  </div>
                </div>
                
                {/* Desktop: Card Layout */}
                <div className="hidden md:block bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {report.projectExpenses.map((e, i) => (
                    <div key={e.id || i} className="p-4 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Taariikh / Mashruuc</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{e.date}</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-300">{e.project}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nooca</div>
                            <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-semibold">
                              {e.category}
                            </span>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Sharaxaad</div>
                            <div className="text-sm text-gray-900 dark:text-gray-300">{e.description}</div>
                            {e.note && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">Fiiro: {e.note}</div>
                            )}
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Akoon: {e.paidFrom || 'Cash'}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Actions</div>
                            <Link 
                              href={`/expenses/edit/${e.id}`}
                              className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                              title="Wax ka beddel"
                            >
                              <Edit size={16} />
                            </Link>
                          </div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Qiimaha</div>
                          <div className="text-base font-bold text-red-700 dark:text-red-300">{e.amount.toLocaleString()} ETB</div>
                        </div>
                      </div>
                    </div>
              ))}
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/30 border-t-2 border-blue-300 dark:border-blue-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-blue-900 dark:text-blue-100">WADARTA KHARASHYADA MASHRUUCYADA</span>
                      <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{report.totalProjectExpenses.toLocaleString()} ETB</span>
                    </div>
                  </div>
        </div>
      </div>
            )}

            {/* Company Expenses - MOBILE OPTIMIZED */}
            {report.companyExpenses.length > 0 && (
              <div className="border-2 border-green-200 dark:border-green-800 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 md:px-6 py-3 md:py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-bold flex items-center">
                      <Receipt size={20} className="mr-2" />
                      <span className="hidden md:inline">Kharashyada Shirkadda</span>
                      <span className="md:hidden">Kharashyada</span>
                    </h2>
                    <div className="bg-white/30 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold">
                      {report.companyExpenses.length}
                    </div>
                  </div>
                </div>
                
                {/* Mobile: Card Layout */}
                <div className="md:hidden bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {report.companyExpenses.map((e, i) => (
                    <div key={e.id || i} className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{e.date}</span>
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-300 mb-1">{e.category}</div>
                          {e.details && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{e.details}</div>
                          )}
                          {e.subCategory && e.subCategory !== e.category && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">({e.subCategory})</div>
                          )}
                          <div className="text-xs text-gray-600 dark:text-gray-400">{e.description}</div>
                          {e.note && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">Fiiro: {e.note}</div>
                          )}
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            <span className="font-medium">Akoon:</span> {e.paidFrom || 'Cash'}
                          </div>
                        </div>
                        <div className="ml-3 flex flex-col items-end gap-2">
                          <div className="text-base font-bold text-red-700 dark:text-red-300">{e.amount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">ETB</div>
                          <Link 
                            href={`/expenses/edit/${e.id}`}
                            className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                            title="Wax ka beddel"
                          >
                            <Edit size={16} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 border-t-2 border-green-300 dark:border-green-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-green-900 dark:text-green-100">WADARTA</span>
                      <span className="text-lg font-bold text-green-700 dark:text-green-300">{report.totalCompanyExpenses.toLocaleString()} ETB</span>
                    </div>
                  </div>
                </div>
                
                {/* Desktop: Card Layout */}
                <div className="hidden md:block bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {report.companyExpenses.map((e, i) => (
                    <div key={e.id || i} className="p-4 hover:bg-green-50 dark:hover:bg-green-900/10 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Taariikh</div>
                            <div className="text-sm text-gray-900 dark:text-gray-300">{e.date}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nooca Kharashka</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-300">{e.category}</div>
                            {e.details && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{e.details}</div>
                            )}
                            {e.subCategory && e.subCategory !== e.category && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">({e.subCategory})</div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Sharaxaad</div>
                            <div className="text-sm text-gray-900 dark:text-gray-300">{e.description}</div>
                            {e.note && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">Fiiro: {e.note}</div>
                            )}
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Akoon: {e.paidFrom || 'Cash'}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Actions</div>
                            <Link 
                              href={`/expenses/edit/${e.id}`}
                              className="inline-flex items-center justify-center p-2 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                              title="Wax ka beddel"
                            >
                              <Edit size={16} />
                            </Link>
                          </div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Qiimaha</div>
                          <div className="text-base font-bold text-red-700 dark:text-red-300">{e.amount.toLocaleString()} ETB</div>
                        </div>
                      </div>
                    </div>
              ))}
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 border-t-2 border-green-300 dark:border-green-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-green-900 dark:text-green-100">WADARTA KHARASHYADA SHIRKADDA</span>
                      <span className="text-lg font-bold text-green-700 dark:text-green-300">{report.totalCompanyExpenses.toLocaleString()} ETB</span>
                    </div>
                  </div>
        </div>
      </div>
            )}

            {/* Fixed Assets Section - CARD LAYOUT */}
            {report.fixedAssets && report.fixedAssets.length > 0 && (
              <div className="border-2 border-indigo-200 dark:border-indigo-800 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 md:px-6 py-3 md:py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-bold flex items-center">
                      <HardDrive size={20} className="mr-2" />
                      Hantida La Gashay (Fixed Assets)
                    </h2>
                    <div className="bg-white/30 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold">
                      {report.fixedAssets.length} Item(s)
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {report.fixedAssets.map((asset, i) => (
                    <div key={asset.id || i} className="p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Magaca</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-300">{asset.name}</div>
                </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nooca</div>
                            <div className="text-sm text-gray-900 dark:text-gray-300">{asset.type}</div>
              </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Iibiyaha</div>
                            <div className="text-sm text-gray-900 dark:text-gray-300">{asset.vendor || '-'}</div>
                    </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Loo Qoondeeyay</div>
                            <div className="text-sm text-gray-900 dark:text-gray-300">{asset.assignedTo || '-'}</div>
                  </div>
                </div>
                        <div className="text-right min-w-[100px]">
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Qiimaha</div>
                          <div className="text-base font-bold text-indigo-700 dark:text-indigo-300">{asset.value.toLocaleString()} ETB</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 border-t-2 border-indigo-300 dark:border-indigo-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100">WADARTA HANTIDA LA GASHAY</span>
                      <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{(report.totalFixedAssets || 0).toLocaleString()} ETB</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No Data Message */}
            {!hasData && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-12 text-center border-2 border-gray-200 dark:border-gray-600">
                <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">Ma jiro dhaqdhaqaaq maanta</h3>
                <p className="text-gray-500 dark:text-gray-500">Maanta lama samayn wax dhaqdhaqaaq ah oo macquul ah.</p>
        </div>
            )}
      </div>

          {/* Account Balances Section - MOBILE OPTIMIZED */}
          {hasBalances && (
            <div className="px-4 md:px-8 pb-6 md:pb-8 print:px-4">
              <div className="rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-900/10 p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-bold text-blue-900 dark:text-blue-200 mb-4 flex items-center">
                  <Wallet size={20} className="mr-2 text-blue-600" />
                  <span className="hidden md:inline">Account Balances Snapshot</span>
                  <span className="md:hidden">Balances</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-800 shadow-sm">
                    <div className="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-300 mb-3 uppercase tracking-wide">Maalinta Hore</div>
                    {Object.entries(report.balances.previous).map(([name, value]) => (
                      <div key={name} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                        <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300 truncate pr-2">{name}</span>
                        <span className="text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">{value.toLocaleString()} ETB</span>
                      </div>
                    ))}
                    {report.totalPrev > 0 && (
                      <div className="flex justify-between py-2 mt-3 border-t border-blue-100 dark:border-blue-700">
                        <span className="text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100">TOTAL</span>
                        <span className="text-base md:text-lg font-extrabold text-blue-600">{report.totalPrev.toLocaleString()} ETB</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-800 shadow-sm">
                    <div className="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-300 mb-3 uppercase tracking-wide">Maalinta Dooratay</div>
                    {Object.entries(report.balances.today).map(([name, value]) => (
                      <div key={name} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                        <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300 truncate pr-2">{name}</span>
                        <span className="text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">{value.toLocaleString()} ETB</span>
                      </div>
                    ))}
                    {report.totalToday > 0 && (
                      <div className="flex justify-between py-2 mt-3 border-t border-blue-100 dark:border-blue-700">
                        <span className="text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100">TOTAL</span>
                        <span className="text-base md:text-lg font-extrabold text-blue-600">{report.totalToday.toLocaleString()} ETB</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MOBILE-OPTIMIZED Action Buttons Footer */}
          <div className="border-t-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 md:p-6 print:hidden">
            {/* Mobile: Stacked Layout */}
            <div className="md:hidden space-y-3">
              {/* Action Buttons - Full Width on Mobile */}
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => exportPDF(report)} 
                  disabled={loading || !report}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={18} /> Download PDF
                </button>
                <button 
                  onClick={() => window.print()} 
                  disabled={loading || !report}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer size={18} /> Print Report
                </button>
              </div>
            </div>
            
            {/* Desktop: Original Layout */}
            <div className="hidden md:flex md:flex-row md:items-center md:justify-between gap-4">
              {/* Date Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const currentDate = new Date(selectedDate);
                    currentDate.setDate(currentDate.getDate() - 1);
                    setSelectedDate(currentDate.toISOString().split('T')[0]);
                  }}
                  disabled={loading}
                  className="p-2 bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Maalinta hore"
                >
                  ←
                </button>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 px-3">
                  {new Date(selectedDate).toLocaleDateString('so-SO', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
                <button
                  onClick={() => {
                    const currentDate = new Date(selectedDate);
                    const tomorrow = new Date(currentDate);
                    tomorrow.setDate(currentDate.getDate() + 1);
                    const today = new Date();
                    if (tomorrow <= today) {
                      setSelectedDate(tomorrow.toISOString().split('T')[0]);
                    }
                  }}
                  disabled={loading || selectedDate >= new Date().toISOString().split('T')[0]}
                  className="p-2 bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Maalinta xigta"
                >
                  →
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => exportPDF(report)} 
                  disabled={loading || !report}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={18} /> Download PDF
                </button>
                <button 
                  onClick={() => window.print()} 
                  disabled={loading || !report}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer size={18} /> Print Report
                </button>
            </div>
            </div>
          </div>
        </div>
      
      {/* Print-specific styles */}
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
          .print\\:p-4 {
            visibility: visible;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </Layout>
  );
}
