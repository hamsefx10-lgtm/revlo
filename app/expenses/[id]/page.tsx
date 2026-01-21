// app/expenses/[id]/page.tsx - Modern Minimalist Expense Details (Payment Voucher Style) V14
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import { useNotifications } from '@/contexts/NotificationContext';
import { emitExpenseChange } from '@/lib/client-events';
import {
  ArrowLeft, Edit, Trash2, Printer, Download,
  User, CheckCircle, AlertCircle, Building2, Briefcase, Store,
  Package, LayoutGrid, FileDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Toast from '@/components/common/Toast';

interface Expense {
  id: string;
  date: string;
  project?: { id: string; name: string };
  category: string;
  subCategory?: string;
  description: string;
  amount: number;
  paidFrom: string; // Now contains Account Name from API
  note?: string;
  approved?: boolean;
  receiptUrl?: string;
  materials?: any[];
  employee?: { id: string; fullName: string; position?: string };
  vendor?: { id: string; name: string };
  customer?: { id: string; name: string };
  user?: { fullName: string };
  company?: { name: string; address?: string; phone?: string };
}

export default function ExpenseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { addNotification } = useNotifications();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const voucherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      const fetchExpenseDetails = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/expenses/${id}`);
          if (!response.ok) {
            if (response.status === 404) { setExpense(null); return; }
            throw new Error('Failed to load expense');
          }
          const data = await response.json();
          setExpense(data.expense);
        } catch (error: any) {
          console.error(error);
          setToastMessage({ message: 'Error loading details.', type: 'error' });
        } finally { setLoading(false); }
      };
      fetchExpenseDetails();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this expense permanently?')) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      if (expense?.project?.id) emitExpenseChange({ action: 'delete', expenseId: expense.id, projectId: expense.project.id });
      setToastMessage({ message: 'Deleted successfully', type: 'success' });
      router.push('/expenses');
    } catch (error: any) {
      setToastMessage({ message: 'Could not delete expense.', type: 'error' });
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!voucherRef.current || !expense) return;
    setGeneratingPDF(true);
    try {
      const element = voucherRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`expense-voucher-${expense.id.split('-')[0]}.pdf`);
      setToastMessage({ message: 'PDF downloaded successfully!', type: 'success' });
    } catch (error) {
      console.error('PDF generation error:', error);
      setToastMessage({ message: 'Failed to generate PDF', type: 'error' });
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) return <Layout><div className="flex h-[80vh] items-center justify-center text-gray-400">Loading details...</div></Layout>;

  if (!expense) return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4"><AlertCircle size={32} /></div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Expense Not Found</h2>
        <p className="text-gray-500 mt-2 mb-6 max-w-md">The expense record you are looking for might have been deleted or does not exist.</p>
        <Link href="/expenses" className="px-6 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg font-medium hover:opacity-90 transition">Return to List</Link>
      </div>
    </Layout>
  );

  return (
    <Layout>
      {toastMessage && <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />}

      <div className="max-w-6xl mx-auto py-8 animate-in slide-in-from-bottom-4 fade-in duration-500">

        {/* NAV */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/expenses" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
            <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Expenses</span>
          </Link>
          <div className="flex gap-2 print:hidden">
            <button onClick={handleDownloadPDF} disabled={generatingPDF} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-bold disabled:opacity-50">
              {generatingPDF ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generating...</> : <><FileDown size={16} /> Download PDF</>}
            </button>
            <button onClick={() => window.print()} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-lg" title="Print Voucher"><Printer size={18} /></button>
            <button onClick={() => router.push(`/expenses/edit/${expense.id}`)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-100 rounded-lg" title="Edit Expense"><Edit size={18} /></button>
            <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-600 transition-colors border border-transparent hover:border-red-100 rounded-lg" title="Delete Expense"><Trash2 size={18} /></button>
          </div>
        </div>

        {/* VOUCHER CARD */}
        <div ref={voucherRef} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative print:shadow-none print:border min-h-[600px] flex flex-col">
          {/* Status Banner */}
          <div className={`h-2 w-full ${expense.approved ? 'bg-green-500' : 'bg-amber-400'}`}></div>

          {/* PDF-ONLY: Company Header */}
          <div className="hidden print:block px-14 pt-8 pb-6 border-b-2 border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                    <span className="text-white font-black text-xl">RV</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">Revlo Business</h2>
                    <p className="text-xs text-gray-500 font-medium">Financial Management System</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium">📍 Addis Ababa, Ethiopia</p>
                  <p>📞 +251 11 123 4567 | ✉️ info@revlo.business</p>
                  <p className="text-xs text-gray-500">TIN: 0012345678 | Trade License: BW/AA/2024/001</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-gray-900 text-white px-4 py-2 rounded-lg mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider">Payment Voucher</p>
                  <p className="text-lg font-black">#{expense.id.split('-')[0].toUpperCase()}</p>
                </div>
                <p className="text-xs text-gray-500">Issue Date: {new Date().toLocaleDateString()}</p>
                <p className="text-xs text-gray-500">Print Time: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>

          {/* Watermark for Approved */}
          {expense.approved && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] select-none">
              <span className="text-[15rem] font-black -rotate-12 block">PAID</span>
            </div>
          )}

          <div className="p-10 md:p-14 flex-1">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b-2 border-dashed border-gray-100 dark:border-gray-700 pb-10">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="h-8 w-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-xs">RV</span>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Payment Voucher</p>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                  {expense.description || (expense.subCategory === 'Salary' && expense.employee ? `Salary: ${expense.employee.fullName}` : 'Expense Voucher')}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <span className="bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider">{expense.category}</span>
                  {expense.subCategory && <span className="text-gray-300">•</span>}
                  {expense.subCategory && <span>{expense.subCategory}</span>}
                </div>
              </div>
              <div className="text-right bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50 min-w-[200px]">
                <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Total Amount</p>
                <p className="text-5xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                  {expense.amount.toLocaleString()} <span className="text-xl font-bold text-gray-400">ETB</span>
                </p>
                <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-bold ${expense.approved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                  {expense.approved ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {expense.approved ? 'Approved & Paid' : 'Pending Approval'}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 mb-12">

              <div className="space-y-8">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Record Date</label>
                  <p className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {new Date(expense.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Paid From Account</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {expense.paidFrom && expense.paidFrom.length > 20 && !expense.paidFrom.includes(' ')
                          ? `Account ...${expense.paidFrom.slice(-6)}`
                          : (expense.paidFrom || 'Petty Cash')}
                      </p>
                      <p className="text-xs text-gray-500">Source of Funds</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Payee / Recipient</label>
                  {expense.employee ? (
                    <div className="group flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform"><User size={24} /></div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{expense.employee.fullName}</p>
                        <p className="text-sm text-gray-500 font-medium mt-1">{expense.employee.position || 'Employee'}</p>
                        <div className="mt-2 flex gap-2">
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold uppercase">Internal</span>
                        </div>
                      </div>
                    </div>
                  ) : expense.vendor ? (
                    <div className="group flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform"><Store size={24} /></div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{expense.vendor.name}</p>
                        <p className="text-sm text-gray-500 font-medium mt-1">Vendor / Supplier</p>
                        <div className="mt-2 flex gap-2">
                          <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded border border-orange-100 font-bold uppercase">External</span>
                        </div>
                      </div>
                    </div>
                  ) : expense.project ? (
                    <div className="group flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform"><Briefcase size={24} /></div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{expense.project.name}</p>
                        <p className="text-sm text-gray-500 font-medium mt-1">Project Expense</p>
                        <div className="mt-2 flex gap-2">
                          <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 font-bold uppercase">Project</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-lg font-medium text-gray-500 italic">No specific payee</p>
                  )}
                </div>
              </div>
            </div>

            {/* DYNAMIC MATERIAL TABLE */}
            {expense.category === 'Material' && expense.materials && expense.materials.length > 0 && (
              <div className="mb-12 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <Package size={16} className="text-gray-400" />
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Material Items Breakdown</label>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-xs text-gray-500 uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">Item Name</th>
                        <th className="px-5 py-3 text-right border-b border-gray-100 dark:border-gray-700">Qty</th>
                        <th className="px-5 py-3 text-right border-b border-gray-100 dark:border-gray-700">Unit Price</th>
                        <th className="px-5 py-3 text-right border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {expense.materials.map((m: any, idx: number) => (
                        <tr key={idx} className="bg-white dark:bg-gray-800 hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white">
                            {m.name}
                          </td>
                          <td className="px-5 py-3.5 text-right text-gray-600 dark:text-gray-400 font-mono">{m.qty} {m.unit}</td>
                          <td className="px-5 py-3.5 text-right text-gray-600 dark:text-gray-400 font-mono">{Number(m.price).toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-right font-black text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/30 font-mono">{(Number(m.qty) * Number(m.price)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100 dark:bg-gray-900">
                      <tr>
                        <td colSpan={3} className="px-5 py-4 text-right font-bold text-gray-700 dark:text-gray-300 uppercase text-sm">Grand Total</td>
                        <td className="px-5 py-4 text-right font-black text-xl text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-800 font-mono">
                          {expense.materials.reduce((sum: number, m: any) => sum + (Number(m.qty) * Number(m.price)), 0).toLocaleString()} ETB
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}


            {/* Notes / Extra */}
            {expense.note && (
              <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-800/30 mb-8 flex gap-4">
                <div className="mt-1 text-amber-500"><AlertCircle size={20} /></div>
                <div>
                  <label className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest block mb-1">Additional Notes</label>
                  <p className="text-base text-amber-900 dark:text-amber-200 italic leading-relaxed">"{expense.note}"</p>
                </div>
              </div>
            )}

            {/* Receipt Image */}
            {expense.receiptUrl && (
              <div className="mt-10 pt-10 border-t-2 border-dashed border-gray-100 dark:border-gray-700">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Attached Receipt / Document</label>
                <div className="relative group rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 inline-block shadow-sm hover:shadow-md transition-all">
                  <img src={expense.receiptUrl} alt="Receipt" className="max-h-80 object-contain p-2" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <a href={expense.receiptUrl} download target="_blank" className="bg-white text-gray-900 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors transform hover:scale-105"><Download size={16} /> Download Source</a>
                  </div>
                </div>
              </div>
            )}

            {/* PDF-ONLY: Signature Section */}
            <div className="hidden print:block mt-12 pt-8 border-t-2 border-dashed border-gray-200">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Authorization & Acknowledgment</h3>
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-8">Prepared By</p>
                  <div className="border-t-2 border-gray-900 pt-2">
                    <p className="text-sm font-bold text-gray-900">{expense.user?.fullName || 'System User'}</p>
                    <p className="text-xs text-gray-500">Finance Department</p>
                    <p className="text-xs text-gray-400 mt-1">Date: {new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-8">Approved By</p>
                  <div className="border-t-2 border-gray-900 pt-2">
                    <p className="text-sm font-bold text-gray-900">_____________________</p>
                    <p className="text-xs text-gray-500">Manager / Supervisor</p>
                    <p className="text-xs text-gray-400 mt-1">Date: _______________</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-8">Received By</p>
                  <div className="border-t-2 border-gray-900 pt-2">
                    <p className="text-sm font-bold text-gray-900">_____________________</p>
                    <p className="text-xs text-gray-500">Payee Signature</p>
                    <p className="text-xs text-gray-400 mt-1">Date: _______________</p>
                  </div>
                </div>
              </div>
            </div>

            {/* PDF-ONLY: Terms & Bank Details Footer */}
            <div className="hidden print:block mt-12 pt-8 border-t-2 border-gray-200 bg-gray-50 -mx-14 px-14 py-8">
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Payment Information</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><span className="font-semibold">Bank:</span> Commercial Bank of Ethiopia</p>
                    <p><span className="font-semibold">Account Name:</span> Revlo Business Solutions</p>
                    <p><span className="font-semibold">Account Number:</span> 1000123456789</p>
                    <p><span className="font-semibold">Branch:</span> Bole Branch, Addis Ababa</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Terms & Conditions</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>• This voucher is valid for 30 days from the issue date</p>
                    <p>• Payment must be verified before processing</p>
                    <p>• All disputes must be raised within 7 business days</p>
                    <p>• This is a computer-generated document</p>
                  </div>
                </div>
              </div>
              <div className="text-center pt-4 border-t border-gray-300">
                <p className="text-xs text-gray-500">
                  For inquiries, contact us at <span className="font-semibold">+251 11 123 4567</span> or <span className="font-semibold">support@revlo.business</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">© {new Date().getFullYear()} Revlo Business. All rights reserved.</p>
              </div>
            </div>

            {/* Meta Footer */}
            <div className="mt-auto pt-10 flex justify-between items-end">
              <div className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                <p>Ref: {expense.id.split('-')[0]}</p>
                <p className="mt-1">Processed By: {expense.user?.fullName || 'System'}</p>
              </div>

              <div className="text-right">
                <img src="/logo.png" alt="Company Logo" className="h-6 opacity-20 grayscale mb-1 ml-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
                <p className="text-[10px] text-gray-300 font-mono">GEN-VOUCHER-V1</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          @page {
            size: A4;
            margin: 10mm;
          }
          
          /* Hide scrollbars and unnecessary elements */
          ::-webkit-scrollbar {
            display: none;
          }
          
          /* Optimize voucher for print */
          .max-w-6xl {
            max-width: 100% !important;
          }
          
          /* Remove rounded corners for print */
          .rounded-2xl, .rounded-xl, .rounded-lg {
            border-radius: 0 !important;
          }
          
          /* Ensure proper page breaks */
          .bg-white {
            page-break-inside: avoid;
          }
          
          /* Material table print optimization */
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          tfoot {
            display: table-footer-group;
          }
          
          /* Ensure borders and backgrounds print */
          * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          /* Optimize spacing for print */
          .p-10, .p-14 {
            padding: 1.5rem !important;
          }
          
          /* Ensure gradients print */
          .bg-gradient-to-br {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          /* Hide dark mode specific elements */
          .dark\\:bg-gray-800,
          .dark\\:bg-gray-900,
          .dark\\:text-white {
            background-color: white !important;
            color: black !important;
          }
        }
      `}</style>
    </Layout>
  );
}
