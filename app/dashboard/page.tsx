// app/dashboard/page.tsx - Enterprise Dashboard Layout Unification
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import RevloLoader from '@/components/ui/RevloLoader';
import { useCurrency } from '@/contexts/CurrencyContext';
import useSWR from 'swr';
import {
  DollarSign, Briefcase, Banknote, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown,
  CheckCircle, Clock, XCircle, Plus, Info, MessageSquare, User, Package, Bell,
  LineChart as LineChartIcon, PieChart as PieChartIcon, Target,
  Eye, Factory, Scale, FileText, ClipboardList, Activity, Sparkles, Building, BarChart2
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts';

// --- Dashboard Data Interfaces ---
interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalBankBalance: number;
  totalMobileMoneyBalance: number;
  totalCashBalance: number;
  lowStockItems: number;
  overdueProjects: number;
  realizedProfitFromCompletedProjects: number;
  potentialProfitFromActiveProjects: number;
  monthlyFinancialData: { month: string; income: number; expenses: number; profit: number }[];
  projectStatusBreakdown: { name: string; value: number; color: string }[];
  recentActivities: { id: string; type: string; description: string; amount?: number; date: string; user: string }[];
  accountBreakdown?: { name: string; value: number; type: string }[];
  outstandingDebts?: number;
  totalReceivables?: number;
  totalPayables?: number;
  topCustomers?: { name: string; value: number }[];
  topVendors?: { name: string; value: number }[];
  thisMonthIncome?: number;
  thisMonthExpenses?: number;
  lastMonthIncome?: number;
  lastMonthExpenses?: number;
  topExpenseCategories?: { name: string; amount: number }[];
  fixedAssetsValue?: number;
  fixedAssetsCount?: number;
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Server error');
  return res.json();
});

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-sm font-semibold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function DashboardPage() {
  const [dateFilter, setDateFilter] = useState<'ALL'|'TODAY'|'WEEK'|'MONTH'|'YEAR'>('ALL');
  const { formatCurrency } = useCurrency();

  const getStatsUrl = () => {
    let url = `/api/dashboard/stats`;
    const params = new URLSearchParams();

    if (dateFilter !== 'ALL') {
      const now = new Date();
      let start = new Date();
      let end = new Date();

      if (dateFilter === 'TODAY') {
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
      } else if (dateFilter === 'WEEK') {
        const day = now.getDay() || 7;
        if (day !== 1) start.setHours(-24 * (day - 1));
        else start.setHours(0, 0, 0, 0);
        end = new Date(now.setHours(23, 59, 59, 999));
      } else if (dateFilter === 'MONTH') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      } else if (dateFilter === 'YEAR') {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      }

      params.append('startDate', start.toISOString());
      params.append('endDate', end.toISOString());
      return `${url}?${params.toString()}`;
    }
    return url;
  };

  const { data: stats, error, isLoading } = useSWR<DashboardStats>(getStatsUrl(), fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  const loading = isLoading && !stats;

  if (loading && !stats) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-md">
      <RevloLoader />
    </div>
  );
  if (error) return <div className="text-red-500 text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow m-6">{error.message || String(error)}</div>;
  if (!stats) return null;

  const {
    totalIncome, totalExpenses, netProfit, totalProjects, activeProjects,
    totalBankBalance, totalMobileMoneyBalance, totalCashBalance, lowStockItems, overdueProjects,
    monthlyFinancialData, projectStatusBreakdown, recentActivities,
    accountBreakdown = [], totalReceivables = 0, totalPayables = 0, topCustomers = [], topVendors = [],
    thisMonthIncome = 0, thisMonthExpenses = 0, lastMonthIncome = 0, lastMonthExpenses = 0
  } = stats;

  const incomeChange = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1) : thisMonthIncome > 0 ? '100' : '0';
  const expenseChange = lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(1) : thisMonthExpenses > 0 ? '100' : '0';

  return (
    <Layout>
      <div className="relative pb-10">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-sm transition-all duration-300 rounded-xl">
            <RevloLoader />
          </div>
        )}

        <div className={`transition-opacity duration-300 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          {/* Header & Global Filters */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-lightGray dark:border-gray-700 mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 relative z-10 w-full overflow-visible">
             <div className="flex flex-col">
               <h1 className="text-2xl font-black tracking-tight text-darkGray dark:text-white flex items-center">
                 <Activity className="mr-3 text-primary h-6 w-6" />
                 Hoggaanka Xarunta
               </h1>
               <p className="text-mediumGray dark:text-gray-400 text-[13px] mt-1 font-medium flex items-center">
                 Dhaqdhaqaaqa Live <span className="flex h-2 w-2 ml-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span></span>
               </p>
             </div>
             
             {/* Filter Engine */}
             <div className="flex bg-lightGray dark:bg-gray-900 rounded-lg p-1 shrink-0 overflow-x-auto w-full xl:w-auto">
                <button onClick={() => setDateFilter('TODAY')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${dateFilter==='TODAY' ? 'bg-white shadow dark:bg-gray-700 text-darkGray dark:text-white' : 'text-mediumGray hover:text-darkGray'} `}>Maanta</button>
                <button onClick={() => setDateFilter('WEEK')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${dateFilter==='WEEK' ? 'bg-white shadow dark:bg-gray-700 text-darkGray dark:text-white' : 'text-mediumGray hover:text-darkGray'} `}>Todobaadkan</button>
                <button onClick={() => setDateFilter('MONTH')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${dateFilter==='MONTH' ? 'bg-white shadow dark:bg-gray-700 text-darkGray dark:text-white' : 'text-mediumGray hover:text-darkGray'} `}>Bishan</button>
                <button onClick={() => setDateFilter('YEAR')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${dateFilter==='YEAR' ? 'bg-white shadow dark:bg-gray-700 text-darkGray dark:text-white' : 'text-mediumGray hover:text-darkGray'} `}>Sanadkan</button>
                <button onClick={() => setDateFilter('ALL')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${dateFilter==='ALL' ? 'bg-primary shadow text-white' : 'text-mediumGray hover:text-darkGray'} `}>All-time</button>
             </div>
          </div>

          {/* Actionable Alerts Layer (Only visible if issues exist) */}
          {(overdueProjects > 0 || lowStockItems > 0) && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {overdueProjects > 0 && (
                <div className="flex items-center justify-between p-4 bg-redError/10 border border-redError/30 rounded-xl">
                   <div className="flex items-center space-x-3">
                     <div className="p-2 bg-redError/20 text-redError rounded-lg"><Clock size={20} /></div>
                     <div><h4 className="font-bold text-redError text-sm">Dib u dhac!</h4><p className="text-xs text-redError/80 font-medium">Waxaad haysataa {overdueProjects} mashruuc oo ka dib dhacay wakhtigii loogu tala galay.</p></div>
                   </div>
                   <Link href="/projects" className="px-3 py-1.5 bg-redError text-white text-xs font-bold rounded-md hover:bg-red-700 transition">Action</Link>
                </div>
              )}
              {lowStockItems > 0 && (
                <div className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                   <div className="flex items-center space-x-3">
                     <div className="p-2 bg-orange-500/20 text-orange-600 rounded-lg"><Package size={20} /></div>
                     <div><h4 className="font-bold text-orange-600 text-sm">Alaab Yaraan!</h4><p className="text-xs text-orange-600/80 font-medium">{lowStockItems} nooc oo alaabta bakhaarka ah ayaa gabaabsi ah.</p></div>
                   </div>
                   <Link href="/inventory/store?status=Low Stock" className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-md hover:bg-orange-600 transition">Dib u buuxi</Link>
                </div>
              )}
            </div>
          )}

          {/* Bento Grid Layer 1: Core Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {/* Net Profit */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-lightGray dark:border-gray-700 relative overflow-hidden group hover:border-primary transition-colors">
               <div className="flex justify-between items-center mb-3">
                 <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                   <TrendingUp size={20} className="stroke-[2.5]" />
                 </div>
               </div>
               <h3 className="font-bold text-mediumGray dark:text-gray-400 uppercase tracking-wide text-xs mb-1">Macaashka Safiican</h3>
               <div className="text-3xl font-black text-darkGray dark:text-white tracking-tight break-words">
                 {formatCurrency(netProfit)}
               </div>
            </div>

            {/* Income */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-lightGray dark:border-gray-700 relative overflow-hidden group hover:border-secondary transition-colors">
               <div className="flex justify-between items-center mb-3">
                 <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                   <ArrowDownLeft size={20} className="stroke-[2.5]" />
                 </div>
                 <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${parseFloat(incomeChange) >= 0 ? 'bg-secondary/10 text-secondary' : 'bg-redError/10 text-redError'}`}>
                   {parseFloat(incomeChange) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(incomeChange))}%
                 </span>
               </div>
               <h3 className="font-bold text-mediumGray dark:text-gray-400 uppercase tracking-wide text-xs mb-1">Dakhli Soo Galay</h3>
               <div className="text-3xl font-black text-darkGray dark:text-white tracking-tight break-words">
                 {formatCurrency(totalIncome)}
               </div>
            </div>

            {/* Expenses */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-lightGray dark:border-gray-700 relative overflow-hidden group hover:border-redError transition-colors">
               <div className="flex justify-between items-center mb-3">
                 <div className="w-10 h-10 rounded-full bg-redError/10 text-redError flex items-center justify-center">
                   <ArrowUpRight size={20} className="stroke-[2.5]" />
                 </div>
                 <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${parseFloat(expenseChange) <= 0 ? 'bg-secondary/10 text-secondary' : 'bg-redError/10 text-redError'}`}>
                   {parseFloat(expenseChange) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(expenseChange))}%
                 </span>
               </div>
               <h3 className="font-bold text-mediumGray dark:text-gray-400 uppercase tracking-wide text-xs mb-1">Kharash Baxay</h3>
               <div className="text-3xl font-black text-darkGray dark:text-white tracking-tight break-words">
                 {formatCurrency(totalExpenses)}
               </div>
            </div>

            {/* Active Projects */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-lightGray dark:border-gray-700 relative overflow-hidden group hover:border-accent transition-colors">
               <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Briefcase size={90} className="text-accent" />
               </div>
               <div className="flex justify-between items-center mb-3 relative z-10">
                 <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                   <Building size={20} className="stroke-[2.5]" />
                 </div>
               </div>
               <h3 className="font-bold text-mediumGray dark:text-gray-400 uppercase tracking-wide text-xs mb-1 relative z-10">Mashaariic Firfircoon</h3>
               <div className="flex items-end gap-2 relative z-10">
                 <span className="text-3xl font-black text-darkGray dark:text-white tracking-tight">{activeProjects}</span>
                 <span className="text-xs font-semibold text-mediumGray mb-1.5">/ {totalProjects} Guud</span>
               </div>
            </div>
          </div>

          {/* Bento Grid Layer 2: Debts & Cashflow (Exec View) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* The Big Chart (Span 2) */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-lightGray dark:border-gray-700">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-darkGray dark:text-white flex items-center">
                   <Target size={20} className="mr-2 text-primary" /> Is-barbardhigga Billaha ah (Cashflow Trend)
                 </h3>
               </div>
               <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={monthlyFinancialData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-700" />
                     <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} tickFormatter={(value) => `$${value/1000}k`} />
                     <RechartsTooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                     <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" name="Soo Galay" />
                     <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" name="Baxay" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Debt Health Gauges (Span 1) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-lightGray dark:border-gray-700 flex flex-col">
               <h3 className="text-lg font-bold text-darkGray dark:text-white mb-6 flex items-center">
                 <Scale size={20} className="mr-2 text-accent" /> Caafimaadka Deymaha
               </h3>
               
               <div className="flex-1 flex flex-col justify-center space-y-8">
                 {/* Receivables Meter */}
                 <div>
                   <div className="flex justify-between items-end mb-2">
                     <span className="text-sm font-bold text-darkGray dark:text-gray-300">Laguu Maqan</span>
                     <span className="text-xl font-black text-secondary">{formatCurrency(totalReceivables)}</span>
                   </div>
                   <div className="w-full bg-lightGray dark:bg-gray-700 rounded-full h-3">
                      <div className="bg-secondary h-3 rounded-full" style={{ width: '70%' }}></div>
                   </div>
                   <p className="text-xs text-mediumGray mt-1 text-right">Deymaha la filayo in ay soo xaroodaan</p>
                 </div>

                 {/* Payables Meter */}
                 <div>
                   <div className="flex justify-between items-end mb-2">
                     <span className="text-sm font-bold text-darkGray dark:text-gray-300">Lagu Leeyahay</span>
                     <span className="text-xl font-black text-orange-500">{formatCurrency(totalPayables)}</span>
                   </div>
                   <div className="w-full bg-lightGray dark:bg-gray-700 rounded-full h-3">
                      <div className="bg-orange-500 h-3 rounded-full" style={{ width: '45%' }}></div>
                   </div>
                   <p className="text-xs text-mediumGray mt-1 text-right">Deymaha kugu waajibay inaad bixiso</p>
                 </div>
               </div>

               <Link href="/projects/accounting?tab=Debts" className="mt-8 py-2.5 w-full bg-lightGray dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-center rounded-lg text-sm font-bold text-darkGray dark:text-white transition-colors">
                 Maaree Deymaha
               </Link>
            </div>
          </div>

          {/* Bento Grid Layer 3: Details & Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* Top Entities */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-lightGray dark:border-gray-700">
               <h3 className="text-base font-bold text-darkGray dark:text-white mb-4 flex items-center">
                 <User size={18} className="mr-2 text-primary" /> Macaamiisha Ugu Weyn
               </h3>
               <div className="space-y-3">
                 {topCustomers.length > 0 ? topCustomers.slice(0, 4).map((c, i) => (
                   <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-lightGray dark:border-gray-700 hover:border-primary/50 transition">
                     <div className="flex items-center space-x-3">
                       <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{i+1}</div>
                       <span className="text-sm font-semibold text-darkGray dark:text-white">{c.name}</span>
                     </div>
                     <span className="text-sm font-bold text-secondary">{formatCurrency(c.value)}</span>
                   </div>
                 )) : <p className="text-sm text-mediumGray">Xog kuma jirto</p>}
               </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-lightGray dark:border-gray-700">
               <h3 className="text-base font-bold text-darkGray dark:text-white mb-4 flex items-center">
                 <Factory size={18} className="mr-2 text-accent" /> Shirkadaha lala shaqeeyo
               </h3>
               <div className="space-y-3">
                 {topVendors.length > 0 ? topVendors.slice(0, 4).map((v, i) => (
                   <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-lightGray dark:border-gray-700 hover:border-accent/50 transition">
                     <div className="flex items-center space-x-3">
                       <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-xs">{i+1}</div>
                       <span className="text-sm font-semibold text-darkGray dark:text-white truncate max-w-[120px]">{v.name}</span>
                     </div>
                     <span className="text-sm font-bold text-redError">{formatCurrency(v.value)}</span>
                   </div>
                 )) : <p className="text-sm text-mediumGray">Xog kuma jirto</p>}
               </div>
            </div>

            {/* Quick Activity */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-lightGray dark:border-gray-700">
               <h3 className="text-base font-bold text-darkGray dark:text-white mb-4 flex items-center">
                 <Activity size={18} className="mr-2 text-mediumGray" /> Dhaqdhaqaaqii ugu dambeeyay
               </h3>
               <div className="space-y-4">
                 {recentActivities.length > 0 ? recentActivities.slice(0, 4).map(act => (
                   <div key={act.id} className="flex items-start space-x-3">
                     <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${act.type === 'income' ? 'bg-secondary' : act.type === 'expense' ? 'bg-redError' : 'bg-primary'}`}></div>
                     <div>
                       <p className="text-sm font-medium text-darkGray dark:text-gray-200 leading-tight">{act.description}</p>
                       <p className="text-[11px] text-mediumGray mt-0.5">{new Date(act.date).toLocaleString()} &bull; {act.user}</p>
                     </div>
                   </div>
                 )) : <p className="text-sm text-mediumGray">Dhaqdhaqaaq ma jiro</p>}
               </div>
            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
}
