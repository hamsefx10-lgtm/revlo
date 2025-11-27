// app/reports/daily-reports/page.tsx - Daily Report Page (Beautiful PDF-Ready Design)
'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../../components/layouts/Layout';
import { Download, Printer, Loader2, TrendingUp, TrendingDown, DollarSign, Receipt, FileText, XCircle, Wallet, Calendar, HelpCircle, X } from 'lucide-react';
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
    date: string;
    project: string;
    category: string;
    description: string;
    amount: number;
  }>;
  companyExpenses: Array<{
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
  }>;
  totalProjectExpenses: number;
  totalCompanyExpenses: number;
  totalExpenses: number;
  debtsCollected: Array<{
    project: string;
    amount: number;
  }>;
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
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const res = await fetch(`/api/reports/daily?date=${selectedDate}&t=${Date.now()}`, {
          signal: controller.signal,
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error('Xogta lama helin');
        const data: DailyReport = await res.json();
        setReport(data);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('Waqtiga dhameeyay. Isku day mar kale.');
        } else {
          setError('Cilad ayaa dhacday ama xog lama helin.');
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

  const netFlow = report.income - report.totalExpenses;
  const hasData = 
    report.income > 0 ||
    report.totalExpenses > 0 ||
    report.debtsCollected.length > 0 ||
    report.incomeTransactions.length > 0 ||
    report.transfers.length > 0;
  const hasBalances = report.balances && Object.keys(report.balances.today).length > 0;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-8 print:max-w-full pt-16 print:pt-0">
        {/* FIXED Date Picker Section - Always Visible */}
        <div className="mb-3 print:hidden bg-white dark:bg-gray-800 fixed top-0 left-0 right-0 z-50 shadow-md border-b border-blue-300">
          <div className="py-2 px-4">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
              <div className="flex items-center gap-2">
                <Calendar className="text-blue-600 dark:text-blue-400" size={18} />
                <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  Dooro Taariikhda Warbixinta
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Quick Access Buttons */}
                <button
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    handleDateChange(yesterday.toISOString().split('T')[0]);
                  }}
                  disabled={loading || isChangingDate}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs transition disabled:opacity-50"
                >
                  Shalay
                </button>
                
                {/* Navigation Buttons */}
                <button
                  onClick={() => {
                    const currentDate = new Date(selectedDate);
                    currentDate.setDate(currentDate.getDate() - 1);
                    handleDateChange(currentDate.toISOString().split('T')[0]);
                  }}
                  disabled={loading || isChangingDate}
                  className="p-1 bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 rounded transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  title="Maalinta hore"
                >
                  ←
                </button>
                
                {/* Compact Date Input */}
                <input
                  type="date"
                  id="main-report-date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={loading || isChangingDate}
                  className="px-2 py-1 border border-blue-400 dark:border-blue-600 rounded focus:ring-1 focus:ring-blue-300 focus:border-blue-600 dark:bg-gray-700 dark:text-white text-sm font-medium min-w-[120px] text-center bg-blue-50 dark:bg-blue-900/20 disabled:opacity-50"
                />
                
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
                  className="p-1 bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 rounded transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  title="Maalinta xigta"
                >
                  →
                </button>
                
                {/* Today Button */}
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    handleDateChange(today);
                  }}
                  disabled={loading || isChangingDate}
                  className={`px-2 py-1 rounded font-medium transition text-xs disabled:opacity-50 ${
                    selectedDate === new Date().toISOString().split('T')[0]
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 dark:bg-green-800 hover:bg-green-200 dark:hover:bg-green-700 text-green-800 dark:text-green-200'
                  }`}
                >
                  Maanta
                </button>
              </div>
            </div>
            
            {(loading || isChangingDate) && (
              <div className="flex items-center gap-1 ml-2 text-blue-600 dark:text-blue-400">
                <Loader2 className="animate-spin" size={14} />
                <span className="text-xs font-medium">
                  {isChangingDate ? 'Beddelaya...' : 'Loading...'}
                </span>
              </div>
            )}
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

        {/* Beautiful Header with Selected Date */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-t-xl print:rounded-none shadow-xl print:shadow-none mb-6 print:mb-2 overflow-hidden">
          <div className="relative px-8 py-10 print:py-6">
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-extrabold mb-2 tracking-tight">{report.companyName || 'Birshiil Work Shop'}</h1>
                <div className="text-blue-100 text-lg">Warbixinta Maalinlaha ah</div>
                {/* Selected Date Display */}
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

        {/* Main Content Container */}
        <div className="bg-white dark:bg-gray-800 rounded-b-xl print:rounded-none shadow-lg print:shadow-none overflow-hidden">

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b border-gray-200 dark:border-gray-700">
            <div className="p-6 border-r border-gray-200 dark:border-gray-700 last:border-r-0 text-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 rounded-full bg-green-500 text-white shadow-lg">
                  <TrendingUp size={28} />
                </div>
              </div>
              <div className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">Dakhliga</div>
              <div className="text-3xl font-extrabold text-green-700 dark:text-green-500">{report.income.toLocaleString()}</div>
              <div className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">ETB</div>
            </div>

            <div className="p-6 border-r border-gray-200 dark:border-gray-700 last:border-r-0 text-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 rounded-full bg-red-500 text-white shadow-lg">
                  <TrendingDown size={28} />
                </div>
              </div>
              <div className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">Kharashyada</div>
              <div className="text-3xl font-extrabold text-red-700 dark:text-red-500">{report.totalExpenses.toLocaleString()}</div>
              <div className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1">ETB</div>
            </div>

            <div className={`p-6 text-center bg-gradient-to-br ${netFlow >= 0 ? 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20' : 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20'}`}>
              <div className="flex items-center justify-center mb-3">
                <div className={`p-3 rounded-full ${netFlow >= 0 ? 'bg-blue-500' : 'bg-orange-500'} text-white shadow-lg`}>
                  <DollarSign size={28} />
                </div>
              </div>
              <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${netFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>Net Flow</div>
              <div className={`text-3xl font-extrabold ${netFlow >= 0 ? 'text-blue-700 dark:text-blue-500' : 'text-orange-700 dark:text-orange-500'}`}>
                {netFlow >= 0 ? '+' : ''}{netFlow.toLocaleString()}
              </div>
              <div className={`text-xs font-semibold mt-1 ${netFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>ETB</div>
        </div>
      </div>

          {/* Transactions Sections */}
          <div className="p-8 space-y-8 print:p-4">
            {/* Income Transactions Section */}
            {report.incomeTransactions.length > 0 && (
              <div className="border border-green-100 dark:border-green-900 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-white dark:bg-gray-900 px-6 py-4 border-b border-green-100 dark:border-green-900 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center text-green-700 dark:text-green-300">
                      <TrendingUp size={24} className="mr-2 text-green-500" />
                      Dakhliga Maanta (Faahfaahin)
                    </h2>
                    <div className="px-3 py-1 rounded-full text-sm font-bold bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-200">
                      {report.incomeTransactions.length} item
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Waxa lagu tusayaa macmiilka, mashruuca iyo akoonka dakhligu ku dhacay.</p>
                </div>
                <div className="bg-white dark:bg-gray-800">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-green-50 dark:bg-green-900/20">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-green-900 dark:text-green-100 uppercase">Sharaxaad</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-green-900 dark:text-green-100 uppercase hidden md:table-cell">Macmiil</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-green-900 dark:text-green-100 uppercase hidden lg:table-cell">Mashruuc</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-green-900 dark:text-green-100 uppercase hidden md:table-cell">Akoon</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-green-900 dark:text-green-100 uppercase">Qiimaha</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {report.incomeTransactions.map((tx, i) => (
                        <tr key={tx.id || i} className="hover:bg-green-50 dark:hover:bg-green-900/10">
                          <td className="px-4 py-3">
                            <div className="text-xs text-gray-900 dark:text-gray-300 font-medium">{tx.description}</div>
                            {tx.note && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">Fiiro: {tx.note}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-900 dark:text-gray-300 hidden md:table-cell">
                            {tx.customer || '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-900 dark:text-gray-300 hidden lg:table-cell">
                            {tx.project || '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-900 dark:text-gray-300 hidden md:table-cell">
                            {tx.account}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-right text-gray-900 dark:text-gray-300">
                            {tx.amount.toLocaleString()} ETB
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-green-100 dark:bg-green-900/30 font-bold border-t-2 border-green-300 dark:border-green-700">
                        <td colSpan={4} className="px-4 py-3 text-xs text-green-900 dark:text-green-100">WADARTA DAKHLIGA</td>
                        <td className="px-4 py-3 text-xs text-right text-green-700 dark:text-green-300">{report.income.toLocaleString()} ETB</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {report.incomeTransactions.length === 0 && (
              <div className="border border-green-100 dark:border-green-900 rounded-xl px-6 py-4 bg-white dark:bg-gray-800 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 italic">
                <TrendingUp size={20} className="text-green-500" />
                <span>Ma jiro dakhli la diiwaangeliyay maalintan.</span>
              </div>
            )}

            {/* Transfer Transactions Section */}
            {report.transfers.length > 0 && (
              <div className="border border-purple-100 dark:border-purple-900 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-white dark:bg-gray-900 px-6 py-4 border-b border-purple-100 dark:border-purple-900 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center text-purple-700 dark:text-purple-300">
                      <Wallet size={24} className="mr-2 text-purple-500" />
                      Wareejinta Lacagaha
                    </h2>
                    <div className="px-3 py-1 rounded-full text-sm font-bold bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                      {report.transfers.length} item
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Waxa lagu tusayaa sida lacagtu uga baxday akoon iyo meesha ay u gudubtay.</p>
                </div>
                <div className="bg-white dark:bg-gray-800">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-purple-50 dark:bg-purple-900/20">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-purple-900 dark:text-purple-100 uppercase">Laga Wareejiyay</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-purple-900 dark:text-purple-100 uppercase">→</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-purple-900 dark:text-purple-100 uppercase">Loo Wareejiyay</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-purple-900 dark:text-purple-100 uppercase hidden md:table-cell">Sharaxaad</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-purple-900 dark:text-purple-100 uppercase">Qiimaha</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {report.transfers.map((tx, i) => (
                        <tr key={tx.id || i} className="hover:bg-purple-50 dark:hover:bg-purple-900/10">
                          <td className="px-4 py-3 text-xs font-semibold text-gray-900 dark:text-gray-300">
                            {tx.fromAccount}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30">
                              <span className="text-purple-600 dark:text-purple-300 font-bold">→</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-gray-900 dark:text-gray-300">
                            {tx.toAccount}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-900 dark:text-gray-300 hidden md:table-cell">
                            {tx.description}
                            {tx.note && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">Fiiro: {tx.note}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-right text-gray-900 dark:text-gray-300">
                            {tx.amount.toLocaleString()} ETB
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {report.transfers.length === 0 && (
              <div className="border border-purple-100 dark:border-purple-900 rounded-xl px-6 py-4 bg-white dark:bg-gray-800 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 italic">
                <Wallet size={20} className="text-purple-500" />
                <span>Maalintan laguma samayn wax wareejin ah.</span>
              </div>
            )}
            {/* Debts Collected */}
            {report.debtsCollected.length > 0 && (
              <div className="border-2 border-orange-200 dark:border-orange-800 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center">
                      <FileText size={24} className="mr-2" />
                      Debt Repaid / Advance Received
                    </h2>
                    <div className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
                      {report.debtsCollected.length} Item(s)
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-orange-50 dark:bg-orange-900/20">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-orange-900 dark:text-orange-100 uppercase tracking-wider">Mashruuc</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-orange-900 dark:text-orange-100 uppercase tracking-wider">Qiime</th>
                </tr>
              </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {report.debtsCollected.map((d, i) => (
                        <tr key={i} className="hover:bg-orange-50 dark:hover:bg-orange-900/10">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{d.project}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900 dark:text-gray-300">{d.amount.toLocaleString()} ETB</td>
                  </tr>
                ))}
                      <tr className="bg-orange-100 dark:bg-orange-900/30 font-bold border-t-2 border-orange-300 dark:border-orange-700">
                        <td className="px-6 py-4 text-sm text-orange-900 dark:text-orange-100">WADARTA</td>
                        <td className="px-6 py-4 text-sm text-right text-orange-700 dark:text-orange-300">{report.debtsCollected.reduce((sum, d) => sum + d.amount, 0).toLocaleString()} ETB</td>
                      </tr>
              </tbody>
            </table>
            </div>
          </div>
        )}

            {/* Project Expenses */}
            {report.projectExpenses.length > 0 && (
              <div className="border-2 border-blue-200 dark:border-blue-800 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center">
                      <Receipt size={24} className="mr-2" />
                      Kharashyada Mashruucyada
                    </h2>
                    <div className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
                      {report.projectExpenses.length} Item(s)
          </div>
          </div>
        </div>
                <div className="bg-white dark:bg-gray-800">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-blue-50 dark:bg-blue-900/20">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-100 uppercase">Project</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-100 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-100 uppercase hidden md:table-cell">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-blue-900 dark:text-blue-100 uppercase">Amount</th>
              </tr>
            </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {report.projectExpenses.map((e, i) => (
                        <tr key={i} className="hover:bg-blue-50 dark:hover:bg-blue-900/10">
                          <td className="px-4 py-3 text-xs text-gray-900 dark:text-gray-300">{e.project}</td>
                          <td className="px-4 py-3 text-xs text-gray-900 dark:text-gray-300">{e.category}</td>
                          <td className="px-4 py-3 text-xs text-gray-900 dark:text-gray-300 hidden md:table-cell">{e.description}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-right text-gray-900 dark:text-gray-300">{e.amount.toLocaleString()} ETB</td>
                </tr>
              ))}
                      <tr className="bg-blue-100 dark:bg-blue-900/30 font-bold border-t-2 border-blue-300 dark:border-blue-700">
                        <td colSpan={3} className="px-4 py-3 text-xs text-blue-900 dark:text-blue-100">WADARTA KHARASHYADA MASHRUUCYADA</td>
                        <td className="px-4 py-3 text-xs text-right text-blue-700 dark:text-blue-300">{report.totalProjectExpenses.toLocaleString()} ETB</td>
                      </tr>
            </tbody>
          </table>
        </div>
      </div>
            )}

            {/* Company Expenses */}
            {report.companyExpenses.length > 0 && (
              <div className="border-2 border-green-200 dark:border-green-800 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center">
                      <Receipt size={24} className="mr-2" />
                      Kharashyada Shirkadda
                    </h2>
                    <div className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
                      {report.companyExpenses.length} Item(s)
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-green-50 dark:bg-green-900/20">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-green-900 dark:text-green-100 uppercase">Nooca Kharashka</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-green-900 dark:text-green-100 uppercase hidden md:table-cell">Faahfaahin</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-green-900 dark:text-green-100 uppercase">Qiimaha</th>
              </tr>
            </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {report.companyExpenses.map((e, i) => (
                        <tr key={i} className="hover:bg-green-50 dark:hover:bg-green-900/10">
                          <td className="px-4 py-3">
                            <div className="text-xs font-semibold text-gray-900 dark:text-gray-300">{e.category}</div>
                            {e.details && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{e.details}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-900 dark:text-gray-300 hidden md:table-cell">
                            {e.description}
                            {e.note && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">Fiiro: {e.note}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-right text-gray-900 dark:text-gray-300">{e.amount.toLocaleString()} ETB</td>
                </tr>
              ))}
                      <tr className="bg-green-100 dark:bg-green-900/30 font-bold border-t-2 border-green-300 dark:border-green-700">
                        <td colSpan={2} className="px-4 py-3 text-xs text-green-900 dark:text-green-100">WADARTA KHARASHYADA SHIRKADDA</td>
                        <td className="px-4 py-3 text-xs text-right text-green-700 dark:text-green-300">{report.totalCompanyExpenses.toLocaleString()} ETB</td>
                      </tr>
            </tbody>
          </table>
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

          {/* Account Balances Section (moved below expenses) */}
          {hasBalances && (
            <div className="px-8 pb-8 print:px-4">
              <div className="rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-900/10 p-6">
                <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-4 flex items-center">
                  <Wallet size={24} className="mr-2 text-blue-600" />
                  Account Balances Snapshot
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-800 shadow-sm">
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-300 mb-3 uppercase tracking-wide">Previous Day</div>
                    {Object.entries(report.balances.previous).map(([name, value]) => (
                      <div key={name} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{value.toLocaleString()} ETB</span>
                      </div>
                    ))}
                    {report.totalPrev > 0 && (
                      <div className="flex justify-between py-2 mt-3 border-t border-blue-100 dark:border-blue-700">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">TOTAL (Prev)</span>
                        <span className="text-lg font-extrabold text-blue-600">{report.totalPrev.toLocaleString()} ETB</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-800 shadow-sm">
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-300 mb-3 uppercase tracking-wide">Selected Day</div>
                    {Object.entries(report.balances.today).map(([name, value]) => (
                      <div key={name} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{value.toLocaleString()} ETB</span>
                      </div>
                    ))}
                    {report.totalToday > 0 && (
                      <div className="flex justify-between py-2 mt-3 border-t border-blue-100 dark:border-blue-700">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">TOTAL (Today)</span>
                        <span className="text-lg font-extrabold text-blue-600">{report.totalToday.toLocaleString()} ETB</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Action Buttons Footer */}
          <div className="border-t-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 print:hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
