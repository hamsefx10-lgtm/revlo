// app/reports/daily-reports/page.tsx - Daily Report Page (Live, Full, Clean)
'use client';

import React, { useState, useEffect } from 'react';
import { Download, Printer, Share2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types for report data
interface DailyReport {
  date: string;
  balances: {
    previous: { CBE: number; EBirr: number };
    today: { CBE: number; EBirr: number };
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
  doc.text('Birshiil Work Shop - Daily Report', 14, 18);
  doc.text(`Date: ${data.date}`, 14, 28);
  doc.text(`Previous Balance: CBE ${data.balances.previous.CBE}, EBirr ${data.balances.previous.EBirr}`, 14, 38);
  doc.text(`Today Balance: CBE ${data.balances.today.CBE}, EBirr ${data.balances.today.EBirr}`, 14, 48);
  doc.text(`Total Previous: ${data.totalPrev}`, 14, 58);
  doc.text(`Total Today: ${data.totalToday}`, 14, 68);
  doc.text(`Income: ${data.income}`, 14, 78);
  doc.text('Project Expenses', 14, 88);
  autoTable(doc, {
    startY: 98,
    head: [['Date', 'Project', 'Category', 'Description', 'Amount']],
    body: data.projectExpenses.map(e => [e.date, e.project, e.category, e.description, e.amount]),
  });
  doc.text(`Total Project Expenses: ${data.totalProjectExpenses}`, 14, (doc as any).lastAutoTable.finalY + 10);

  doc.text('Company Expenses', 14, (doc as any).lastAutoTable.finalY + 20);
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 30,
    head: [['Date', 'Category', 'Description', 'Amount']],
    body: data.companyExpenses.map(e => [e.date, e.category, e.description, e.amount]),
  });
  doc.text(`Total Company Expenses: ${data.totalCompanyExpenses}`, 14, (doc as any).lastAutoTable.finalY + 10);

  doc.text(`Combined Total Expenses: ${data.totalExpenses}`, 14, (doc as any).lastAutoTable.finalY + 20);
  doc.save('daily_report.pdf');
}

export default function DailyReportPage() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShare, setShowShare] = useState(false);

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

  if (loading) return <div className="max-w-3xl mx-auto p-8 text-center text-mediumGray">Loading daily report...</div>;
  if (error) return <div className="max-w-3xl mx-auto p-8 text-center text-redError">{error}</div>;
  if (!report) return null;

  const hasIncome = report.income > 0;

  const debtsCollected = report.debtsCollected;

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-xl p-4 md:p-8 mt-4 md:mt-8 mb-4 md:mb-8 border border-gray-200 print:max-w-full print:shadow-none print:border-none">
      {/* Mobile-Optimized Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0 mb-6">
        <div className="flex flex-col space-y-2 md:flex-row md:gap-2 md:items-center">
          <button onClick={() => window.history.back()} className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 w-full md:w-auto">Back</button>
          <h1 className="text-2xl md:text-3xl font-bold text-primary md:ml-4">Birshiil Work Shop</h1>
        </div>
        <div className="flex flex-col space-y-2 md:flex-row md:gap-2 md:space-y-0">
          <button onClick={() => exportPDF(report)} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/80 w-full md:w-auto">
            <Download size={16} className="md:w-[18px] md:h-[18px]"/> 
            <span className="text-sm md:text-base">PDF</span>
          </button>
          <button onClick={() => window.print()} className="bg-secondary text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-secondary/80 w-full md:w-auto">
            <Printer size={16} className="md:w-[18px] md:h-[18px]"/> 
            <span className="text-sm md:text-base">Print</span>
          </button>
          <button onClick={() => setShowShare(true)} className="bg-accent text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-accent/80 w-full md:w-auto">
            <Share2 size={16} className="md:w-[18px] md:h-[18px]"/> 
            <span className="text-sm md:text-base">Share</span>
          </button>
        </div>
      </div>

      {/* Mobile-Optimized Income Received Today Section */}
      <div className="mb-6">
        <h2 className="text-lg md:text-xl font-bold text-green-700 mb-2">Dakhliga Maanta</h2>
        <div className="bg-green-100 rounded-lg p-4 text-lg md:text-xl font-bold text-green-800 text-center">
          +{report.income.toLocaleString()} ETB
        </div>
      </div>

      {/* Mobile-Optimized Debts Collected Today Section */}
      <div className="mb-6">
        <h2 className="text-lg md:text-xl font-bold text-orange-700 mb-2">Deynaha La Qaatay Maanta</h2>
        {debtsCollected.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full mb-2 border border-gray-300 rounded-lg overflow-hidden">
              <thead className="bg-orange-500 text-white">
                <tr>
                  <th className="px-2 md:px-4 py-2 text-sm md:text-base">Mashruuc</th>
                  <th className="px-2 md:px-4 py-2 text-sm md:text-base">Qiime</th>
                </tr>
              </thead>
              <tbody>
                {debtsCollected.map((d: any, i: number) => (
                  <tr key={i} className="bg-white even:bg-orange-100">
                    <td className="px-2 md:px-4 py-2 text-sm md:text-base">{d.project}</td>
                    <td className="px-2 md:px-4 py-2 text-right text-sm md:text-base">{d.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-orange-50 rounded-lg p-4 text-orange-700 text-center">Ma jiraan deyno la qaatay maanta.</div>
        )}
      </div>
      {/* Mobile-Optimized Daily Report Header */}
      <div className="mb-6">
        <div className="text-center md:text-left mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">Warbixinta Maalinlaha ah</h1>
          <div className="text-mediumGray text-lg md:text-xl">{report.date}</div>
        </div>
        {report.balances && report.totalPrev !== null && report.totalToday !== null && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="font-bold text-primary text-sm md:text-base mb-2">Balance Hore</div>
              {Object.entries(report.balances.previous).map(([name, value]) => (
                <div key={name} className="text-sm md:text-base">{name}: {value}</div>
              ))}
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="font-bold text-secondary text-sm md:text-base mb-2">Balance Maanta</div>
              {Object.entries(report.balances.today).map(([name, value]) => (
                <div key={name} className="text-sm md:text-base">{name}: {value}</div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Mobile-Optimized Total Accounts Grid */}
      {report.balances && report.totalPrev !== null && report.totalToday !== null && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-100 rounded-lg p-4 text-center">
            <div className="font-bold text-primary text-sm md:text-base mb-2">TOTAL HORE</div>
            <div className="text-xl md:text-2xl font-bold">{report.totalPrev}</div>
          </div>
          <div className="bg-green-100 rounded-lg p-4 text-center">
            <div className="font-bold text-secondary text-sm md:text-base mb-2">TOTAL MAANTA</div>
            <div className="text-xl md:text-2xl font-bold">{report.totalToday}</div>
          </div>
        </div>
      )}
      {hasIncome && (
        <div className="mb-4 text-green-600 font-bold text-lg">lacag bari lasoo celiyay: {report.income}</div>
      )}

      {/* Mobile-Optimized Project Expenses Table */}
      <div className="mb-8">
        <h2 className="text-lg md:text-xl font-bold text-primary mb-4">Kharashyada Mashruucyada</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full mb-2 border border-gray-300 rounded-lg overflow-hidden">
            <thead className="bg-primary text-white">
              <tr>
                <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Taariikh</th>
                <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Mashruuc</th>
                <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Nooca</th>
                <th className="px-2 md:px-4 py-2 text-xs md:text-sm hidden md:table-cell">Sharaxaad</th>
                <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Qiime</th>
              </tr>
            </thead>
            <tbody>
              {report.projectExpenses.map((e, i) => (
                <tr key={i} className="bg-white even:bg-lightGray">
                  <td className="px-2 md:px-4 py-2 text-xs md:text-sm">{e.date}</td>
                  <td className="px-2 md:px-4 py-2 text-xs md:text-sm">{e.project}</td>
                  <td className="px-2 md:px-4 py-2 text-xs md:text-sm">{e.category}</td>
                  <td className="px-2 md:px-4 py-2 text-xs md:text-sm hidden md:table-cell">{e.description}</td>
                  <td className="px-2 md:px-4 py-2 text-right text-xs md:text-sm font-semibold">{e.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-secondary text-white font-bold">
                <td colSpan={4} className="px-2 md:px-4 py-2 text-right text-xs md:text-sm">WADARTA KHARASHYADA MASHRUUCYADA</td>
                <td className="px-2 md:px-4 py-2 text-right text-xs md:text-sm">{report.totalProjectExpenses.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Mobile-Optimized Company Expenses Table */}
      <div className="mb-8">
        <h2 className="text-lg md:text-xl font-bold text-secondary mb-4">Kharashyada Shirkadda</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full mb-2 border border-gray-300 rounded-lg overflow-hidden">
            <thead className="bg-secondary text-white">
              <tr>
                <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Taariikh</th>
                <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Nooca</th>
                <th className="px-2 md:px-4 py-2 text-xs md:text-sm hidden md:table-cell">Sharaxaad</th>
                <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Qiime</th>
              </tr>
            </thead>
            <tbody>
              {report.companyExpenses.map((e, i) => (
                <tr key={i} className="bg-white even:bg-lightGray">
                  <td className="px-2 md:px-4 py-2 text-xs md:text-sm">{e.date}</td>
                  <td className="px-2 md:px-4 py-2 text-xs md:text-sm">{e.category}</td>
                  <td className="px-2 md:px-4 py-2 text-xs md:text-sm hidden md:table-cell">{e.description}</td>
                  <td className="px-2 md:px-4 py-2 text-right text-xs md:text-sm font-semibold">{e.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-primary text-white font-bold">
                <td colSpan={3} className="px-2 md:px-4 py-2 text-right text-xs md:text-sm">WADARTA KHARASHYADA SHIRKADDA</td>
                <td className="px-2 md:px-4 py-2 text-right text-xs md:text-sm">{report.totalCompanyExpenses.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Mobile-Optimized Combined Total */}
      <div className="mb-8">
        <div className="bg-red-100 rounded-lg p-4 text-center">
          <h3 className="text-lg md:text-xl font-bold text-red-700 mb-2">WADARTA GUUD EE KHARASHYADA</h3>
          <div className="text-xl md:text-2xl font-bold text-red-800">{report.totalExpenses.toLocaleString()} ETB</div>
        </div>
      </div>

      {/* Mobile-Optimized Share Modal */}
      {showShare && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-4 md:p-8 max-w-md w-full">
            <div className="text-lg md:text-xl font-bold mb-4">Wadaag Warbixinta Maalinlaha ah</div>
            <div className="mb-4 text-sm md:text-base">Link-ka ku qor ama wadaag social media:</div>
            <input type="text" value={window.location.href} readOnly className="w-full p-2 border rounded mb-4 text-xs md:text-sm" title="Report link" placeholder="Report link" />
            <div className="flex flex-col space-y-2 md:flex-row md:gap-2 md:space-y-0">
              <button onClick={() => {navigator.clipboard.writeText(window.location.href); setShowShare(false);}} className="bg-primary text-white px-4 py-2 rounded w-full md:w-auto">Ku Qor Link</button>
              <button onClick={() => setShowShare(false)} className="bg-gray-300 px-4 py-2 rounded w-full md:w-auto">Xidh</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
