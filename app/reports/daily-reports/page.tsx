
// app/reports/daily-reports/page.tsx - Daily Report Page (Refined Professional Design)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import {
  Download, Printer, Loader2, TrendingUp, TrendingDown, DollarSign,
  Receipt, FileText, XCircle, Wallet, Calendar, HelpCircle, X,
  HardDrive, Edit, ChevronLeft, ChevronRight, Clock, RefreshCcw
} from 'lucide-react';
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
    // Brand Colors
    const PRIMARY_COLOR: [number, number, number] = [30, 58, 138]; // Dark Blue
    const SECONDARY_COLOR: [number, number, number] = [100, 116, 139]; // Slate Gray

    // -- HEADER --
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(0, 0, 210, 4, 'F');

    // Logo & Company Info
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', 14, 10, 25, 25, undefined, 'FAST');
      } catch {
        doc.setFillColor(...PRIMARY_COLOR);
        doc.circle(20, 20, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const initials = (data.companyName || 'BW').slice(0, 2).toUpperCase();
        doc.text(initials, 20, 23, { align: 'center' });
      }
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(data.companyName || 'Birshiil Work Shop', 45, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text('Daily Financial Report', 45, 24);

    // Meta Data
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const dateY = 18;
    doc.text('DATE:', 150, dateY);
    doc.setFont('helvetica', 'bold');
    doc.text(data.date, 170, dateY);

    doc.setFont('helvetica', 'normal');
    const refY = 24;
    doc.text('REF:', 150, refY);
    doc.setFont('helvetica', 'bold');
    doc.text(`D-${data.date.replace(/-/g, '')}`, 170, refY);

    if (data.preparedBy) {
      const prepY = 30;
      doc.setFont('helvetica', 'normal');
      doc.text('PREPARED BY:', 150, prepY);
      doc.setFont('helvetica', 'bold');
      doc.text(data.preparedBy, 180, prepY);
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 38, 196, 38);

    let yPos = 45;

    // Helper for Tables
    const renderTable = (
      title: string,
      head: string[][],
      body: (string | number)[][],
      options: { totalLabel?: string; totalValue?: string; startY?: number } = {}
    ) => {
      if (!body.length) return;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...PRIMARY_COLOR);
      doc.text(title.toUpperCase(), 14, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head,
        body,
        theme: 'grid',
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [30, 41, 59],
          fontStyle: 'bold',
          lineWidth: 0,
          fontSize: 9,
        },
        bodyStyles: {
          textColor: [51, 65, 85],
          fontSize: 9,
          cellPadding: 3,
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
        },
        columnStyles: {
          [head[0].length - 1]: { halign: 'right', fontStyle: 'bold' }
        },
        styles: {
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        margin: { left: 14, right: 14 },
      });

      if (options.totalLabel && options.totalValue) {
        const finalY = (doc as any).lastAutoTable.finalY;
        doc.setFillColor(241, 245, 249);
        doc.rect(140, finalY, 56, 8, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...PRIMARY_COLOR);
        doc.text(options.totalLabel, 145, finalY + 5.5);
        doc.text(options.totalValue, 192, finalY + 5.5, { align: 'right' });

        yPos = finalY + 15;
      } else {
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
    };

    // 1. Account Balances
    if (data.balances && Object.keys(data.balances.today).length > 0) {
      const allAccounts = Array.from(new Set([...Object.keys(data.balances.previous || {}), ...Object.keys(data.balances.today || {})]));
      const balanceRows = allAccounts.map(name => [
        name,
        formatCurrency(data.balances.previous[name] || 0),
        formatCurrency(data.balances.today[name] || 0)
      ]);
      balanceRows.push([
        'TOTAL LIQUIDITY',
        formatCurrency(data.totalPrev || 0),
        formatCurrency(data.totalToday || 0)
      ]);

      renderTable(
        'Account Balances',
        [['Account', 'Previous Balance', 'Current Balance']],
        balanceRows
      );
    }

    // 2. Income
    if (data.incomeTransactions.length > 0) {
      renderTable(
        'Income Received',
        [['Description', 'Account', 'Amount']],
        data.incomeTransactions.map(tx => {
          let desc = tx.description || 'Income';
          if (tx.customer) desc += ` (${tx.customer})`;
          return [desc, tx.account || '-', formatCurrency(tx.amount)];
        }),
        {
          totalLabel: 'Total Income',
          totalValue: formatCurrency(data.income)
        }
      );
    }

    // 3. Project Expenses
    if (data.projectExpenses.length > 0) {
      renderTable(
        'Project Expenses',
        [['Project', 'Category', 'Description', 'Amount']],
        data.projectExpenses.map(e => [
          e.project,
          e.category,
          e.description,
          formatCurrency(e.amount)
        ]),
        {
          totalLabel: 'Total Project Exp.',
          totalValue: formatCurrency(data.totalProjectExpenses)
        }
      );
    }

    // 4. Company Expenses
    if (data.companyExpenses.length > 0) {
      renderTable(
        'Company Expenses',
        [['Category', 'Description', 'Amount']],
        data.companyExpenses.map(e => {
          let desc = e.description || '';
          if (e.details) desc += ` - ${e.details}`;
          return [e.category, desc, formatCurrency(e.amount)];
        }),
        {
          totalLabel: 'Total Ops Exp.',
          totalValue: formatCurrency(data.totalCompanyExpenses)
        }
      );
    }

    // 5. Debt
    if (data.debtsCollected.length > 0) {
      renderTable(
        'Debt Repayments / Collections',
        [['Project', 'Amount']],
        data.debtsCollected.map(d => [d.project, formatCurrency(d.amount)]),
        {
          totalLabel: 'Total Collected',
          totalValue: formatCurrency(data.debtsCollected.reduce((s, d) => s + d.amount, 0))
        }
      );
    }

    // 6. Transfers
    if (data.transfers.length > 0) {
      renderTable(
        'Internal Transfers',
        [['From', 'To', 'Description', 'Amount']],
        data.transfers.map(t => [t.fromAccount, t.toAccount, t.description, formatCurrency(t.amount)])
      );
    }

    // -- SUMMARY --
    const summaryY = yPos + 5;

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(120, summaryY, 76, 40, 2, 2, 'FD');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('FINANCIAL SUMMARY', 125, summaryY + 8);

    doc.setFontSize(9);

    // Income
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('Total Income:', 125, summaryY + 16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74);
    doc.text(formatCurrency(data.income || 0), 190, summaryY + 16, { align: 'right' });

    // Expenses
    const totalExp = data.totalExpenses + (data.totalFixedAssets || 0);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('Total Expenses:', 125, summaryY + 23);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`(${formatCurrency(totalExp)})`, 190, summaryY + 23, { align: 'right' });

    // Net Flow
    const netFlow = (data.income || 0) - totalExp;
    doc.line(125, summaryY + 28, 190, summaryY + 28);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('Net Cash Flow:', 125, summaryY + 34);

    if (netFlow >= 0) {
      doc.setTextColor(22, 163, 74);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.setFontSize(10);
    doc.text(formatCurrency(netFlow), 190, summaryY + 34, { align: 'right' });

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, pageHeight - 10);
    doc.text('Powered by Revlo', 196, pageHeight - 10, { align: 'right' });

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
    return new Date().toISOString().split('T')[0];
  });
  const [isChangingDate, setIsChangingDate] = useState(false);

  const handleDateChange = (newDate: string) => {
    setIsChangingDate(true);
    setSelectedDate(newDate);
    setTimeout(() => setIsChangingDate(false), 500);
  };

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError('');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const res = await fetch(`/api/reports/daily?date=${selectedDate}&t=${Date.now()}`, {
          signal: controller.signal,
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('Failed to fetch data');

        const data: DailyReport = await res.json();
        setReport(data);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err?.message || 'Error occurred');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [selectedDate]);

  if (loading && !report) {
    return (
      <Layout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="animate-spin text-primary mr-3" size={40} />
          <span className="text-xl font-medium text-gray-500">Generating report...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
          <XCircle size={60} className="text-red-500" />
          <h2 className="text-2xl font-bold text-gray-800">Error Loading Report</h2>
          <p className="text-gray-600">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  if (!report) return null;

  const totalExp = report.totalExpenses + (report.totalFixedAssets || 0);
  const netFlow = report.income - totalExp;
  const hasBalances = report.balances && Object.keys(report.balances.today).length > 0;

  // --- UI Components ---

  const StatCard = ({ title, value, icon: Icon, colorClass, borderClass }: any) => (
    <div className={`bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border-l-4 ${borderClass} flex items-center justify-between hover:shadow-md transition-shadow`}>
      <div>
        <p className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{value.toLocaleString()} <span className="text-xs md:text-sm text-gray-400 font-normal">ETB</span></h3>
      </div>
      <div className={`p-2 md:p-3 rounded-full ${colorClass} bg-opacity-10`}>
        <Icon size={20} className={`md:w-6 md:h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-transparent pb-12">
        {/* -- HEADER & CONTROL BAR -- */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-4 md:px-8 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

            {/* Title */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg shadow-blue-500/30">
                <FileText size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">Daily Financial Report</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Ref: D-{report.date.replace(/-/g, '')}</p>
              </div>
            </div>

            {/* Date Pickers & Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  handleDateChange(d.toISOString().split('T')[0]);
                }}
                className="p-2 bg-white dark:bg-gray-800 shadow-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 transition"
                disabled={loading || isChangingDate}
              >
                <ChevronLeft size={18} />
              </button>

              <div className="relative flex-1 md:flex-none">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full md:w-auto pl-9 pr-3 py-1.5 bg-transparent border-none text-sm font-bold text-gray-800 dark:text-white focus:ring-0 text-center"
                />
                <Calendar className="absolute left-2 top-2 text-blue-500 pointer-events-none" size={16} />
              </div>

              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  const tmr = new Date(d);
                  tmr.setDate(d.getDate() + 1);
                  if (tmr <= new Date()) handleDateChange(tmr.toISOString().split('T')[0]);
                }}
                className="p-2 bg-white dark:bg-gray-800 shadow-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                disabled={loading || isChangingDate || selectedDate >= new Date().toISOString().split('T')[0]}
              >
                <ChevronRight size={18} />
              </button>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1 hidden md:block"></div>

              <button
                onClick={() => exportPDF(report)}
                className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition shadow-lg shadow-blue-500/20"
              >
                <Download size={14} /> PDF
              </button>

              <button
                onClick={() => exportPDF(report)}
                className="md:hidden p-2 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-500/30"
              >
                <Download size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* -- MAIN CONTENT GRID -- */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8 space-y-4 md:space-y-8">

          {/* 1. STATUS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <StatCard
              title="Income"
              value={report.income}
              icon={TrendingUp}
              colorClass="text-green-600 bg-green-600"
              borderClass="border-green-500"
            />
            <StatCard
              title="Expenses"
              value={totalExp}
              icon={TrendingDown}
              colorClass="text-red-600 bg-red-600"
              borderClass="border-red-500"
            />
            <StatCard
              title="Net Flow"
              value={netFlow}
              icon={DollarSign}
              colorClass={netFlow >= 0 ? "text-blue-600 bg-blue-600" : "text-orange-600 bg-orange-600"}
              borderClass={netFlow >= 0 ? "border-blue-500" : "border-orange-500"}
            />
          </div>

          {/* 2. ACCOUNT BALANCES (If Any) */}
          {hasBalances && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden w-full">
              <div className="px-3 py-2 md:px-6 md:py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                <h3 className="font-bold text-sm md:text-base text-gray-800 dark:text-white flex items-center gap-2">
                  <Wallet size={16} className="text-gray-500" /> Account Liquidity
                </h3>
                <span className="text-[10px] md:text-xs font-mono text-gray-500 whitespace-nowrap ml-2">LIVE SNAPSHOT</span>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-medium">
                    <tr>
                      <th className="px-2 py-2 md:px-6 md:py-3">Account</th>
                      <th className="px-2 py-2 md:px-6 md:py-3 text-right">Prev<span className="hidden md:inline">ious Balance</span></th>
                      <th className="px-2 py-2 md:px-6 md:py-3 text-right">Curr<span className="hidden md:inline">ent Balance</span></th>
                      <th className="px-2 py-2 md:px-6 md:py-3 text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {Object.entries(report.balances.today).map(([accName, currBal]) => {
                      const prevBal = report.balances.previous[accName] || 0;
                      const change = currBal - prevBal;
                      return (
                        <tr key={accName} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-2 py-2 md:px-6 md:py-4 font-bold text-gray-900 dark:text-white">{accName}</td>
                          <td className="px-2 py-2 md:px-6 md:py-4 text-right text-gray-500">{prevBal.toLocaleString()}</td>
                          <td className="px-2 py-2 md:px-6 md:py-4 text-right font-bold text-gray-900 dark:text-white">{currBal.toLocaleString()}</td>
                          <td className={`px-2 py-2 md:px-6 md:py-4 text-right font-medium ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {change > 0 ? '+' : ''}{change.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. INCOME SECTION (Full Width) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <Link href="/shop/accounting" className="block">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-green-50/30 hover:bg-green-100/50 transition-colors cursor-pointer group">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 group-hover:text-green-700 transition-colors">
                  <TrendingUp size={18} className="text-green-600" /> Income Breakdown
                </h3>
                <span className="text-sm font-bold text-green-700 bg-green-100 px-2 py-1 rounded-lg group-hover:bg-green-200 transition-colors">
                  +{report.income.toLocaleString()} ETB
                </span>
              </div>
            </Link>
            {report.incomeTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-400 italic">No income recorded for this day.</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {report.incomeTransactions.map((tx, idx) => (
                  <div key={idx} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 dark:text-white">{tx.description || 'Income'}</p>
                        {tx.customer && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{tx.customer}</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <span className="bg-gray-100 px-1.5 rounded">{tx.account || 'N/A'}</span>
                        {tx.project && <span>• {tx.project}</span>}
                        {tx.note && <span className="italic">• {tx.note}</span>}
                      </p>
                    </div>
                    <span className="font-bold text-green-600 whitespace-nowrap text-lg">
                      +{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 4. PROJECT EXPENSES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
              <Link href="/shop/accounting">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-purple-50/30 hover:bg-purple-100/50 transition-colors cursor-pointer group">
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 group-hover:text-purple-700 transition-colors">
                    <HardDrive size={18} className="text-purple-600" /> Project Expenses
                  </h3>
                  <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full group-hover:bg-purple-200 transition-colors">
                    {report.projectExpenses.length} Items
                  </span>
                </div>
              </Link>
              {report.projectExpenses.length === 0 ? (
                <div className="p-8 text-center text-gray-400 italic flex-1 flex items-center justify-center">No project expenses.</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {report.projectExpenses.map((ex, idx) => (
                    <div key={`p-${idx}`} className="p-4 flex justify-between items-start hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 transition-colors">{ex.description || ex.category}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 font-medium">{ex.project}</span>
                          <span className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{ex.category}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">-{ex.amount.toLocaleString()}</span>
                        <Link href={`/expenses/edit/${ex.id}`} className="block text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity text-right mt-1">Edit</Link>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-gray-500">Total Project Exp</span>
                      <span className="text-red-600">-{report.totalProjectExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. COMPANY EXPENSES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
              <Link href="/shop/accounting">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-blue-50/30 hover:bg-blue-100/50 transition-colors cursor-pointer group">
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                    <Receipt size={18} className="text-blue-600" /> Company Expenses
                  </h3>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full group-hover:bg-blue-200 transition-colors">
                    {report.companyExpenses.length} Items
                  </span>
                </div>
              </Link>
              {report.companyExpenses.length === 0 ? (
                <div className="p-8 text-center text-gray-400 italic flex-1 flex items-center justify-center">No company expenses.</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {report.companyExpenses.map((ex, idx) => (
                    <div key={`c-${idx}`} className="p-4 flex justify-between items-start hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 transition-colors">{ex.description || ex.category}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{ex.category}</span>
                          {ex.details && <span className="text-xs text-gray-400">• {ex.details}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">-{ex.amount.toLocaleString()}</span>
                        <Link href={`/expenses/edit/${ex.id}`} className="block text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity text-right mt-1">Edit</Link>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-gray-500">Total Company Exp</span>
                      <span className="text-red-600">-{report.totalCompanyExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* 5. Fixed Assets & Collections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {(report.fixedAssets?.length ?? 0) > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-bold text-gray-800 dark:text-white">Fixed Assets Purchased</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {report.fixedAssets!.map((asset, i) => (
                    <div key={i} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-xs text-gray-500">{asset.type}</p>
                      </div>
                      <span className="font-bold text-indigo-600">{asset.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.debtsCollected.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-bold text-gray-800 dark:text-white">Debt / Advances Collected</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {report.debtsCollected.map((col, i) => (
                    <div key={i} className="p-4 flex justify-between items-center">
                      <p className="font-medium">{col.project}</p>
                      <span className="font-bold text-green-600">{col.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
