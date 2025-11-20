// app/reports/daily-reports/page.tsx - Daily Report Page (Beautiful PDF-Ready Design)
'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../../components/layouts/Layout';
import { Download, Printer, Loader2, TrendingUp, TrendingDown, DollarSign, Receipt, FileText, XCircle, Wallet } from 'lucide-react';
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

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/reports/daily');
        if (!res.ok) throw new Error('Xogta lama helin');
        const data: DailyReport = await res.json();
        setReport(data);
      } catch (err) {
        setError('Cilad ayaa dhacday ama xog lama helin.');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, []);

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
      <div className="max-w-6xl mx-auto pb-8 print:max-w-full">
        {/* Beautiful Header */}
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

          {/* Action Buttons Footer */}
          <div className="border-t-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 flex justify-end gap-3 print:hidden">
            <button 
              onClick={() => exportPDF(report)} 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition font-bold shadow-lg"
            >
              <Download size={18} /> Download PDF
            </button>
            <button 
              onClick={() => window.print()} 
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition font-bold shadow-lg"
            >
              <Printer size={18} /> Print Report
            </button>
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
