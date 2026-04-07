'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import { ArrowLeft, User, Phone, BriefcaseIcon, Calendar, CheckSquare, FileText, ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react';
import Link from 'next/link';

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: string;        // 'GIVEN', 'REPAID', 'EXPENSE'
  debit: number;       // (+) Increases balance (Money given to client)
  credit: number;      // (-) Decreases balance (Money client paid)
  balance: number;     // Running balance at this row
  isExpenseRecord?: boolean;
}

export default function ReceivableDetailLedger() {
  const router = useRouter();
  const params = useParams();
  const clientIdParam = decodeURIComponent(params.id as string);
  
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    fetchLedger();
  }, [clientIdParam]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/debts');
      const data = await res.json();
      
      const allReceivables = data.receivables || [];
      const allPayables = data.companyDebts || [];
      const allDebts = [...allReceivables, ...allPayables]; // Could be stored either way depending on strict remaining logic
      
      // Find customer
      const target = allDebts.find((d: any) => 
        d.id === clientIdParam || 
        d.clientId === clientIdParam || 
        d.client === clientIdParam || 
        d.lender === clientIdParam ||
        d.customerName === clientIdParam
      );
      
      if (!target) {
         setCustomerInfo(null);
         setLoading(false);
         return;
      }
      
      setCustomerInfo(target);
      
      if (target.transactions && target.transactions.length > 0) {
        // Sort chronologically
        const sorted = [...target.transactions].sort((a: any, b: any) => 
            new Date(a.transactionDate || a.createdAt).getTime() - new Date(b.transactionDate || b.createdAt).getTime()
        );
        
        let runningBalance = 0;
        const entries = sorted.map((t: any) => {
           let debit = 0;
           let credit = 0;
           const amt = Math.abs(Number(t.amount) || 0);
           
           if (t.isExpenseRecord || t.type === 'DEBT_GIVEN') {
              // Money given TO customer -> Debit (increases remaining debt)
              debit = amt;
              runningBalance += amt;
           } else {
              // Money received FROM customer -> Credit (decreases remaining debt)
              credit = amt;
              runningBalance -= amt;
           }
           
           return {
             id: t.id || t._id || Math.random().toString(),
             date: t.transactionDate || t.createdAt,
             description: t.description || t.title || t.remarks || (t.isExpenseRecord ? 'Expense/Loan Given' : 'Payment Received'),
             type: t.isExpenseRecord ? 'EXPENSE' : (t.type === 'DEBT_GIVEN' ? 'GIVEN' : 'REPAID'),
             debit,
             credit,
             balance: runningBalance,
             isExpenseRecord: t.isExpenseRecord
           };
        });
        
        // Reverse so newest is at top!
        setLedgerEntries(entries.reverse());
      } else {
        setLedgerEntries([]);
      }
      
    } catch (error) {
      console.error('Error fetching ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
     return (
       <Layout>
          <div className="flex flex-col items-center justify-center py-40 animate-pulse">
            <div className="w-16 h-16 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin mb-6" />
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded-full" />
          </div>
       </Layout>
     );
  }

  if (!customerInfo) {
     return (
       <Layout>
         <div className="text-center py-40">
           <User size={64} className="mx-auto text-gray-300 dark:text-gray-700 mb-6" />
           <h2 className="text-2xl font-black text-darkGray dark:text-white mb-2">Customer Not Found</h2>
           <p className="text-mediumGray font-bold mb-6">Could not locate ledger for {clientIdParam}.</p>
           <button onClick={() => router.push('/projects/accounting/receivables')} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 rounded-xl font-bold transition-all">Go Back</button>
         </div>
       </Layout>
     );
  }

  const name = customerInfo.client || customerInfo.lender || customerInfo.customerName;
  const isPayableValue = customerInfo.remaining < 0 || customerInfo.isLiability;
  const currentBalance = Math.abs(customerInfo.remaining || 0);

  return (
    <Layout>
       <div className="mb-6 flex items-center justify-between">
          <Link href="/projects/accounting/receivables" className="flex items-center text-mediumGray dark:text-gray-400 hover:text-darkGray transition-colors font-bold text-sm tracking-wide">
             <ArrowLeft size={18} className="mr-2" /> Back to Receivables
          </Link>
          
          <Link href={`/projects/accounting/transactions/add?customerId=${customerInfo.id || customerInfo.clientId}`} className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center shadow-lg">
             <Plus size={16} className="mr-2" /> Record Entry
          </Link>
       </div>

       {/* Premium Client Header Header */}
       <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white dark:border-gray-800 rounded-[2rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden mb-8 group animate-fade-in-up flex flex-col md:flex-row gap-6 items-start lg:items-center justify-between">
           <div className={`absolute -right-20 -top-20 w-64 h-64 blur-[100px] opacity-20 pointer-events-none transition-transform duration-1000 group-hover:scale-150 ${isPayableValue ? 'bg-orange-500' : 'bg-secondary'}`} />
           
           <div className="flex items-center gap-6 relative z-10">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-inner">
                 <User size={32} className="text-gray-400" />
              </div>
              <div>
                 <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl lg:text-4xl font-black text-darkGray dark:text-white tracking-tighter">{name}</h1>
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black tracking-widest uppercase border ${
                       isPayableValue ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}>
                       {isPayableValue ? 'Payable (We Owe)' : 'Receivable (Owes Us)'}
                    </span>
                 </div>
                 
                 <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-mediumGray dark:text-gray-400">
                    <div className="flex items-center"><BriefcaseIcon size={14} className="mr-1.5" /> Client Account</div>
                    {customerInfo.phoneNumber && <div className="flex items-center"><Phone size={14} className="mr-1.5" /> {customerInfo.phoneNumber}</div>}
                    <div className="flex items-center"><Calendar size={14} className="mr-1.5" /> Created: {new Date(customerInfo.issueDate || Date.now()).toLocaleDateString()}</div>
                 </div>
              </div>
           </div>

           <div className="relative z-10 w-full md:w-auto mt-4 md:mt-0 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
               <p className="text-[10px] font-black uppercase tracking-widest text-mediumGray mb-1 text-center md:text-right">Current Balance</p>
               <p className={`text-3xl lg:text-4xl font-black tracking-tighter text-center md:text-right ${isPayableValue ? 'text-orange-500' : 'text-red-500'}`}>
                   {currentBalance.toLocaleString()} <span className="text-base font-bold uppercase tracking-widest ml-1">ETB</span>
               </p>
               <div className="mt-3 flex justify-center md:justify-end gap-3 text-[10px] uppercase font-bold tracking-widest">
                   <span className="text-mediumGray">Total Value: {customerInfo.amount?.toLocaleString()}</span>
                   <span className="text-gray-300">|</span>
                   <span className="text-green-600">Collected: {customerInfo.received?.toLocaleString()}</span>
               </div>
           </div>
       </div>

       {/* Ledger Table Section */}
       <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 className="font-black text-lg text-darkGray dark:text-white flex items-center">
                 <FileText size={18} className="mr-2 text-primary" /> Activity Ledger
              </h3>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800 text-[10px] font-black uppercase tracking-widest text-mediumGray">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4 flex justify-center items-center"><ArrowUpRight size={14} className="mr-1 text-red-500" /> Charge (Debit)</th>
                      <th className="px-6 py-4" align="center"><span className="flex justify-center items-center"><ArrowDownRight size={14} className="mr-1 text-green-500" /> Payment (Credit)</span></th>
                      <th className="px-6 py-4 text-right">Running Balance</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                   {ledgerEntries.length === 0 ? (
                      <tr>
                         <td colSpan={5} className="py-12 text-center text-mediumGray font-bold">
                            <CheckSquare size={32} className="mx-auto mb-3 opacity-50" />
                            No transactions found for this account.
                         </td>
                      </tr>
                   ) : ledgerEntries.map((entry, idx) => {
                      const isNegative = entry.balance < 0;
                      return (
                         <tr key={entry.id + idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4">
                               <p className="font-bold text-xs text-darkGray dark:text-gray-300">{new Date(entry.date).toLocaleDateString()}</p>
                               <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td className="px-6 py-4">
                               <p className="font-bold text-sm text-darkGray dark:text-gray-200">{entry.description}</p>
                               <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[8px] font-black uppercase tracking-widest ${
                                  entry.isExpenseRecord ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                               }`}>{entry.type}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                               {entry.debit > 0 ? (
                                  <span className="font-black text-red-500">{entry.debit.toLocaleString()}</span>
                               ) : <span className="text-gray-300">-</span>}
                            </td>
                            <td className="px-6 py-4 text-center bg-green-50/20 dark:bg-green-900/10">
                               {entry.credit > 0 ? (
                                  <span className="font-black text-green-600">{entry.credit.toLocaleString()}</span>
                               ) : <span className="text-gray-300">-</span>}
                            </td>
                            <td className="px-6 py-4 text-right border-l border-gray-50 dark:border-gray-800">
                               <p className={`font-black text-base ${isNegative ? 'text-orange-500' : 'text-darkGray dark:text-white'}`}>
                                  {Math.abs(entry.balance).toLocaleString()}
                               </p>
                               {isNegative && <span className="text-[9px] uppercase tracking-widest text-orange-500 font-bold">Overpaid</span>}
                            </td>
                         </tr>
                      )
                   })}
                </tbody>
             </table>
          </div>
       </div>

    </Layout>
  );
}
