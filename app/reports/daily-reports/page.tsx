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
  balances: {
    previous: Record<string, number>;
    today: Record<string, number>;
  };
  totalPrev: number;
  totalToday: number;
  income: number;
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
  }>;
  totalProjectExpenses: number;
  totalCompanyExpenses: number;
  totalExpenses: number;
  debtsCollected: Array<{
    project: string;
    amount: number;
  }>;
}

function exportPDF(data: DailyReport) {
  const doc = new jsPDF();
  
  // Header with gradient effect
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('Birshiil Work Shop', 105, 15, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('Daily Financial Report', 105, 25, { align: 'center' });
  
  // Date and Report Number
  doc.setFontSize(10);
  doc.text(`Date: ${data.date}`, 105, 32, { align: 'center' });
  
  let yPos = 45;
  
  // Balance Summary Section
  if (data.balances && Object.keys(data.balances.today).length > 0) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Account Balances', 14, yPos);
    yPos += 10;
    
    // Create table for balances
    const balanceData = Object.entries(data.balances.today).map(([name, value]) => [
      name,
      value.toLocaleString() + ' ETB'
    ]);
    
    if (data.totalToday > 0) {
      balanceData.push(['TOTAL ACCOUNTS', data.totalToday.toLocaleString() + ' ETB']);
    }
    
    autoTable(doc, {
      startY: yPos,
      head: [['Account', 'Balance']],
      body: balanceData,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      margin: { left: 14 },
      columnStyles: { 
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto', halign: 'right' }
      },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Debts Collected Section
  if (data.debtsCollected.length > 0) {
    doc.setTextColor(249, 115, 22);
    doc.setFontSize(14);
    doc.text('Debt Repaid / Advance Received', 105, yPos, { align: 'center' });
    yPos += 8;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Project', 'Amount']],
      body: data.debtsCollected.map(d => [
        d.project,
        d.amount.toLocaleString() + ' ETB'
      ]),
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [249, 115, 22], textColor: 255 },
      margin: { left: 14 },
      columnStyles: { 1: { halign: 'right' } },
    });
    doc.setTextColor(0, 0, 0);
    const debtTotal = data.debtsCollected.reduce((sum, d) => sum + d.amount, 0);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: ${debtTotal.toLocaleString()} ETB`, 180, (doc as any).lastAutoTable.finalY + 10, { align: 'right' });
    doc.setFont(undefined, 'normal');
    yPos = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // Project Expenses Section
  if (data.projectExpenses.length > 0) {
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(14);
    doc.text('Project Expenses', 105, yPos, { align: 'center' });
    yPos += 8;
    
  autoTable(doc, {
      startY: yPos,
      head: [['Project', 'Category', 'Description', 'Amount']],
      body: data.projectExpenses.map(e => [
        e.project,
        e.category,
        e.description,
        e.amount.toLocaleString() + ' ETB'
      ]),
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      margin: { left: 14 },
      columnStyles: { 3: { halign: 'right' } },
    });
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: ${data.totalProjectExpenses.toLocaleString()} ETB`, 180, (doc as any).lastAutoTable.finalY + 10, { align: 'right' });
    doc.setFont(undefined, 'normal');
    yPos = (doc as any).lastAutoTable.finalY + 20;
  }

  // Company Expenses Section
  if (data.companyExpenses.length > 0) {
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(14);
    doc.text('Company Expenses', 105, yPos, { align: 'center' });
    yPos += 8;
    
  autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Description', 'Amount']],
      body: data.companyExpenses.map(e => [
        e.category,
        e.description,
        e.amount.toLocaleString() + ' ETB'
      ]),
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      margin: { left: 14 },
      columnStyles: { 2: { halign: 'right' } },
    });
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: ${data.totalCompanyExpenses.toLocaleString()} ETB`, 180, (doc as any).lastAutoTable.finalY + 10, { align: 'right' });
    doc.setFont(undefined, 'normal');
    yPos = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // Final Summary
  yPos += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`Income: +${data.income.toLocaleString()} ETB`, 14, yPos);
  yPos += 8;
  doc.text(`Total Expenses: ${data.totalExpenses.toLocaleString()} ETB`, 14, yPos);
  yPos += 8;
  
  const netFlow = data.income - data.totalExpenses;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  if (netFlow >= 0) {
    doc.setTextColor(34, 197, 94);
  } else {
    doc.setTextColor(239, 68, 68);
  }
  doc.text(`Net Flow: ${netFlow >= 0 ? '+' : ''}${netFlow.toLocaleString()} ETB`, 14, yPos);
  
  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setTextColor(128, 128, 128);
  doc.setFontSize(8);
  doc.text('Generated by Birshiil Work Shop Management System', 105, pageHeight - 10, { align: 'center' });
  
  doc.save(`daily_report_${data.date}.pdf`);
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
  const hasData = report.income > 0 || report.totalExpenses > 0 || report.debtsCollected.length > 0;
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
                <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Birshiil Work Shop</h1>
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
              </div>
        </div>
        </div>
      </div>

        {/* Main Content Container */}
        <div className="bg-white dark:bg-gray-800 rounded-b-xl print:rounded-none shadow-lg print:shadow-none overflow-hidden">
          {/* Balance Section */}
          {hasBalances && (
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                  <Wallet size={24} className="mr-2 text-purple-600" />
                  Balances
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-700">
                    <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-3 uppercase tracking-wide">Previous Balance</div>
                    {Object.entries(report.balances.previous).map(([name, value]) => (
                      <div key={name} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600 last:border-b-0">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{value.toLocaleString()} ETB</span>
                      </div>
                    ))}
                    {report.totalPrev > 0 && (
                      <div className="flex justify-between py-2 mt-2 border-t-2 border-purple-300 dark:border-purple-600">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">TOTAL ACC</span>
                        <span className="text-lg font-extrabold text-red-600">{report.totalPrev.toLocaleString()} ETB</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-700">
                    <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-3 uppercase tracking-wide">Today Balance</div>
                    {Object.entries(report.balances.today).map(([name, value]) => (
                      <div key={name} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600 last:border-b-0">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{value.toLocaleString()} ETB</span>
                      </div>
                    ))}
                    {report.totalToday > 0 && (
                      <div className="flex justify-between py-2 mt-2 border-t-2 border-purple-300 dark:border-purple-600">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">TOTAL ACCOUNTS</span>
                        <span className="text-lg font-extrabold text-red-600">{report.totalToday.toLocaleString()} ETB</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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
                        <th className="px-4 py-3 text-left text-xs font-bold text-green-900 dark:text-green-100 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-green-900 dark:text-green-100 uppercase hidden md:table-cell">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-green-900 dark:text-green-100 uppercase">Amount</th>
              </tr>
            </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {report.companyExpenses.map((e, i) => (
                        <tr key={i} className="hover:bg-green-50 dark:hover:bg-green-900/10">
                          <td className="px-4 py-3 text-xs text-gray-900 dark:text-gray-300">{e.category}</td>
                          <td className="px-4 py-3 text-xs text-gray-900 dark:text-gray-300 hidden md:table-cell">{e.description}</td>
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
