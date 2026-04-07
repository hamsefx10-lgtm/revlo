'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import { ArrowLeft, Scale, Search, TrendingUp, DollarSign, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface DebtsReportCompanyDebt {
  id?: string;
  lender?: string;
  client?: string;
  customerName?: string;
  amount?: number;
  paid?: number;
  received?: number;
  remaining?: number;
  dueDate?: string;
  status: string;
}

export default function ProjectReceivablesPage() {
  const router = useRouter();
  const [companyDebts, setCompanyDebts] = useState<DebtsReportCompanyDebt[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setPageLoading(true);
    try {
      const debtsReportRes = await fetch('/api/reports/debts');
      const debtsReport = await debtsReportRes.json();
      setCompanyDebts(debtsReport.receivables || []);
    } catch (error) {
      console.error('Error fetching receivables:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const getName = (d: DebtsReportCompanyDebt) => d.client || d.lender || d.customerName || '--';

  const filteredDebts = companyDebts
    .filter(d => (d.remaining || 0) > 0)
    .filter(d => getName(d).toLowerCase().includes(searchQuery.toLowerCase()));

  // Analytics
  const totalOutstanding = filteredDebts.reduce((sum, d) => sum + (d.remaining || 0), 0);
  const overdueCount = filteredDebts.filter(d => d.status === 'Overdue').length;

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 lg:mb-8 gap-4">
        <div className="flex items-center">
          <Link href="/projects/accounting" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-3 lg:mr-4">
            <ArrowLeft size={24} className="inline-block lg:w-7 lg:h-7" />
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-darkGray dark:text-gray-100 flex items-center">
             <div className="p-2 sm:p-3 bg-secondary/10 rounded-2xl mr-3 sm:mr-4">
                <Scale className="text-secondary" size={24} />
             </div>
             Client Receivables
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative group w-full lg:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-secondary transition-colors" size={18} />
                <input
                    type="text"
                    placeholder="Search client name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all shadow-sm"
                />
            </div>
        </div>
      </div>

      {pageLoading ? (
        <div className="flex flex-col items-center justify-center py-32 animate-pulse">
            <div className="w-16 h-16 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin mb-6" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded-full" />
        </div>
      ) : (
        <>
            {/* KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 animate-fade-in-up">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl p-6 rounded-[1.5rem] border border-gray-100 dark:border-gray-700/50 shadow-lg relative overflow-hidden group hover:border-secondary/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-[50px] rounded-full"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
                            <DollarSign size={20} />
                        </div>
                        <h3 className="text-[10px] font-black text-mediumGray uppercase tracking-widest leading-none">Total Outstanding</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl lg:text-4xl font-black text-darkGray dark:text-white tracking-tighter tabular-nums">
                            {totalOutstanding.toLocaleString()}
                        </p>
                        <span className="text-[10px] font-black text-mediumGray uppercase">ETB</span>
                    </div>
                </div>

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl p-6 rounded-[1.5rem] border border-gray-100 dark:border-gray-700/50 shadow-lg relative overflow-hidden group hover:border-red-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl text-red-600 dark:text-red-400">
                            <Clock size={20} />
                        </div>
                        <h3 className="text-[10px] font-black text-mediumGray uppercase tracking-widest leading-none">Overdue Accounts</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl lg:text-4xl font-black text-darkGray dark:text-white tracking-tighter tabular-nums">
                            {overdueCount}
                        </p>
                        <span className="text-[10px] font-black text-mediumGray uppercase">Clients</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black dark:from-gray-950 dark:to-gray-900 p-6 rounded-[1.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/20 blur-[60px] rounded-full"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/10 rounded-xl text-emerald-400">
                            <CheckCircle2 size={20} />
                        </div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Healthy Collections</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl lg:text-4xl font-black text-white tracking-tighter tabular-nums">
                            {filteredDebts.length > 0 ? Math.round(((filteredDebts.length - overdueCount) / filteredDebts.length) * 100) : 100}%
                        </p>
                        <span className="text-[10px] font-black text-gray-500 uppercase italic">On-Time</span>
                    </div>
                </div>
            </div>

            {/* Debts Grid */}
            <div className="bg-white/50 dark:bg-gray-800/20 backdrop-blur-3xl border border-white/60 dark:border-gray-700/50 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                {filteredDebts.length === 0 ? (
                    <div className="text-center py-24 bg-white/60 dark:bg-gray-900/40 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                        <CheckCircle2 size={64} className="mx-auto text-green-500 mb-4 opacity-50" />
                        <p className="font-bold text-mediumGray text-lg">No pending client receivables found.</p>
                        <p className="text-sm text-gray-400 mt-2">All client accounts are clear!</p>
                    </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {filteredDebts.map(debt => {
                        const name = getName(debt);
                        const linkParam = debt.id || name;

                        return (
                        <div key={debt.id || name} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[1.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group flex flex-col">
                            <div className={`absolute -top-20 -right-20 w-48 h-48 blur-[80px] opacity-20 dark:opacity-30 transition-transform duration-700 group-hover:scale-150 ${debt.status === 'Overdue' ? 'bg-red-500' : 'bg-secondary'}`} />
                            
                            <div className="p-6 pb-0 flex-1 relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-mediumGray font-black text-xs uppercase shadow-inner border border-black/5 dark:border-white/5">
                                            {name.substring(0, 2)}
                                        </div>
                                        <h4 className="font-black text-xl text-darkGray dark:text-white truncate max-w-[150px]" title={name}>{name}</h4>
                                    </div>
                                    <span className={`px-3 py-1.5 font-bold text-[9px] tracking-widest uppercase rounded-full shadow-sm ${
                                        debt.status === 'Overdue' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 border border-red-100 dark:border-red-800/40' : 'bg-secondary/10 text-secondary dark:bg-secondary/20 border border-secondary/20 dark:border-secondary/10'
                                    }`}>{debt.status}</span>
                                </div>
                                
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-mediumGray font-bold text-[10px] uppercase tracking-widest">Total Issued</span>
                                        <span className="font-black text-darkGray dark:text-gray-300">{debt.amount?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-mediumGray font-bold text-[10px] uppercase tracking-widest">Collected</span>
                                        <span className="font-black text-green-600 dark:text-green-400">{debt.received?.toLocaleString() || debt.paid?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-800 items-center">
                                        <span className="font-black text-mediumGray uppercase tracking-widest text-[10px]">Outstanding</span>
                                        <span className="font-black text-2xl text-red-500">{debt.remaining?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-2 border-t border-gray-50 dark:border-gray-800 relative z-10">
                                <Link 
                                    href={`/projects/accounting/receivables/${encodeURIComponent(linkParam)}`}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-50 hover:bg-secondary hover:text-white dark:bg-gray-800 dark:hover:bg-secondary text-mediumGray dark:text-gray-400 font-bold text-xs uppercase tracking-widest rounded-xl transition-all group/btn"
                                >
                                    Eeg Faahfaahinta
                                    <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                        );
                    })}
                </div>
                )}
            </div>
        </>
      )}
    </Layout>
  );
}
