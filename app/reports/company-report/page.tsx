'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layouts/Layout';
import { Loader2, XCircle, Download, Calendar, Building, DollarSign, TrendingUp, TrendingDown, Briefcase, Wallet, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnimatePresence, motion } from 'framer-motion';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

// --- Types ---
interface TransactionDetail {
    id: string;
    date: string;
    description: string;
    amount: number;
    employeeName?: string;
    supplierName?: string;
    remaining?: number; // NEW
    isGroup?: boolean; // NEW
    transactions?: TransactionDetail[]; // NEW for nesting
}

interface ExpenseGroup {
    category: string;
    amount: number;
    remaining?: number; // NEW
    transactions: TransactionDetail[];
}

interface FixedAssetItem {
    name: string;
    value: number;
    purchaseDate: string;
    type: string;
}

interface CompanyReportData {
    company: {
        name: string;
        logoUrl?: string;
    };
    dateRange: {
        startDate: string;
        endDate: string;
    };
    summary: {
        currentCashBalance: number;
        totalCompanyExpenses: number; // All-time
        filteredCompanyExpenses: number; // Date-filtered
        totalFixedAssets: number;
        totalReceivables: number;
        activeLoansReceivable: number;
        totalPayables: number;
        unpaidBills: number;
        unpaidLabor: number;
        activeLoansPayable: number;
        unpaidBillsDetail?: { amount: number; transactions: TransactionDetail[] };
        unpaidLaborDetail?: { amount: number; transactions: TransactionDetail[] };
        activeLoansPayableDetail?: { amount: number; transactions: TransactionDetail[] };
        netEquity: number;
    };
    breakdowns: {
        expenses: ExpenseGroup[];
        fixedAssets: FixedAssetItem[];
        trends: Array<{ month: string; amount: number }>;
    };
}

// --- Helper Functions ---
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

// --- PDF Export Function ---
async function exportCompanyReportPDF(data: CompanyReportData) {
    const doc = new jsPDF('p', 'mm', 'a4');

    // Load Logo
    const loadLogo = async (url?: string) => {
        if (!url) return null;
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (e) { console.warn('Logo load failed', e); return null; }
    };

    const logoData = await loadLogo(data.company.logoUrl);

    // Constants
    const companyName = data.company.name || 'Company Name';
    const reportTitle = 'WARBIXINTA HOWLGALKA SHIRKADDA (COMPANY OPS)';
    
    const startDate = data.dateRange.startDate ? new Date(data.dateRange.startDate).toLocaleDateString() : 'Bilow';
    const endDate = data.dateRange.endDate ? new Date(data.dateRange.endDate).toLocaleDateString() : 'Hadda';
    const dateText = `${startDate} - ${endDate}`;

    let yPos = 20;

    // Header
    if (logoData) {
        try {
            doc.addImage(logoData, 'PNG', 15, 10, 25, 25, undefined, 'FAST');
        } catch (e) { }
    }

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName.toUpperCase(), 200, 20, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(reportTitle, 200, 26, { align: 'right' });
    doc.text(dateText, 200, 31, { align: 'right' });

    // Line
    doc.setDrawColor(200);
    doc.line(15, 40, 200, 40);
    yPos = 50;

    // Summary Section
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('KOOBIDI HOWLGALKA (OPERATIONS SUMMARY)', 15, yPos);
    yPos += 8;

    const summaryData = [
        ['Qiimaha Nadiifka ah (Company Equity)', formatCurrency(data.summary.netEquity)],
        ['Lacagta Hada Taala (Cash Balance)', formatCurrency(data.summary.currentCashBalance)],
        ['Lacagta ka Maqan Shirkadda (Receivables)', formatCurrency(data.summary.totalReceivables)],
        [' - Daymaha Macaamiisha (Direct Loans)', formatCurrency(data.summary.activeLoansReceivable)],
        ['Daymaha Shirkada lagu leeyahay (Payables)', formatCurrency(data.summary.totalPayables)],
        [' - Biilasha dhiman (Unpaid Bills)', formatCurrency(data.summary.unpaidBills)],
        [' - Daymaha kale (Active Loans)', formatCurrency(data.summary.activeLoansPayable)],
        ['Qiimaha Hantida (Fixed Assets)', formatCurrency(data.summary.totalFixedAssets)],
        ['Wadarta Kharashka (Filtered Opex)', formatCurrency(data.summary.filteredCompanyExpenses)],
    ];

    autoTable(doc, {
        startY: yPos,
        head: [['Maqaalka', 'Qiimaha']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
        columnStyles: { 1: { halign: 'right' } },
        margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // 2. Expense Detail
    doc.text('FAAHFAAHINTA KHARASHYADA (Opex Details)', 15, yPos);
    yPos += 5;

    const expenseRows = data.breakdowns.expenses.map(item => [item.category, formatCurrency(item.amount)]);

    autoTable(doc, {
        startY: yPos,
        head: [['Qeybta Kharashka', 'Wadarta']],
        body: expenseRows,
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38] },
        columnStyles: { 1: { halign: 'right' } },
        margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // 3. Fixed Assets
    if (data.breakdowns.fixedAssets.length > 0) {
        if (yPos > 240) {
            doc.addPage();
            yPos = 20;
        }
        doc.text('HANTIDA MAGUURTADA (FIXED ASSETS)', 15, yPos);
        yPos += 5;

        const assetRows = data.breakdowns.fixedAssets.map(item => [
            item.name,
            item.type,
            new Date(item.purchaseDate).toLocaleDateString(),
            formatCurrency(item.value)
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Magaca', 'Nooca', 'Taariikhda Iibka', 'Qiimaha Hada']],
            body: assetRows,
            theme: 'striped',
            headStyles: { fillColor: [124, 58, 237] },
            columnStyles: { 3: { halign: 'right' } },
            margin: { left: 15, right: 15 },
        });
    }

    // Footer
    const pageCount = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text(`Generated by Revlo System on ${new Date().toLocaleString()}`, 105, 295, { align: 'center' });
    }

    doc.save(`${companyName}_Operations_Report.pdf`);
}

const ExpandableRow = ({ 
    title, 
    amount, 
    remaining = 0,
    transactions, 
    type = 'expense' 
}: { 
    title: string; 
    amount: number; 
    remaining?: number;
    transactions: TransactionDetail[]; 
    type?: 'income' | 'expense' 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="border-b border-gray-100 last:border-0">
            <div 
                className="flex justify-between items-center py-4 px-6 cursor-pointer hover:bg-gray-50/80 transition-all duration-200"
                onClick={() => transactions.length > 0 && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-3">
                    {transactions.length > 0 ? (
                        <div className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                            <ChevronDown size={14} />
                        </div>
                    ) : <div className="w-[14px]" />}
                    <div>
                        <span className="font-semibold text-gray-700">{title}</span>
                        {remaining > 0 && (
                            <span className="ml-2 text-[10px] bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full">
                                Dhiman: {formatCurrency(remaining)}
                            </span>
                        )}
                    </div>
                    {transactions.length > 0 && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                            {transactions.length}
                        </span>
                    )}
                </div>
                <div className="font-mono font-bold text-gray-900">
                    {formatCurrency(amount)}
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-50/30 overflow-hidden"
                    >
                        <div className="p-4 bg-white/50 border-t border-gray-50">
                            <table className="w-full text-[11px]">
                                <thead className="text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="pb-2 text-left font-bold uppercase tracking-wider">Taariikh</th>
                                        <th className="pb-2 text-left font-bold uppercase tracking-wider">Sharaxaad</th>
                                        <th className="pb-2 text-left font-bold uppercase tracking-wider">Lala Sameeyay</th>
                                        <th className="pb-2 text-right font-bold uppercase tracking-wider">Qiimaha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {transactions.map((tx) => (
                                        <React.Fragment key={tx.id}>
                                            <tr 
                                                className={`text-gray-600 hover:bg-slate-50/50 ${tx.isGroup ? 'cursor-pointer bg-slate-50/30' : ''}`}
                                                onClick={(e) => tx.isGroup && toggleGroup(tx.id, e)}
                                            >
                                                <td className="py-2.5 whitespace-nowrap text-slate-500 flex items-center">
                                                    {tx.isGroup ? (
                                                        <div className={`mr-2 transition-transform ${expandedGroups[tx.id] ? 'rotate-0' : '-rotate-90'}`}>
                                                            <ChevronDown size={10} />
                                                        </div>
                                                    ) : (
                                                        <div className="w-1 h-1 bg-slate-300 rounded-full mr-2" />
                                                    )}
                                                    {tx.date}
                                                </td>
                                                <td className="py-2.5 pr-4 font-medium">
                                                    {tx.description}
                                                    {tx.isGroup && tx.remaining! > 0 && (
                                                        <span className="ml-2 text-[9px] text-rose-500 font-black uppercase">
                                                            (Rem: {formatCurrency(tx.remaining!)})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 text-slate-500 italic">
                                                    {tx.employeeName || tx.supplierName || '-'}
                                                </td>
                                                <td className="py-2.5 text-right font-bold text-slate-700">
                                                    {formatCurrency(tx.amount)}
                                                </td>
                                            </tr>
                                            {/* Nested Transactions for Groups */}
                                            {tx.isGroup && expandedGroups[tx.id] && tx.transactions?.map(subTx => (
                                                <tr key={subTx.id} className="bg-slate-50/20 text-[10px] text-slate-500">
                                                    <td className="py-1.5 pl-8 italic">{subTx.date}</td>
                                                    <td className="py-1.5">{subTx.description}</td>
                                                    <td className="py-1.5">-</td>
                                                    <td className="py-1.5 text-right font-semibold">{formatCurrency(subTx.amount)}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


// --- Main Page Component ---
export default function CompanyReportPage() {
    const [data, setData] = useState<CompanyReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            let url = '/api/projects/accounting/reports/company-comprehensive';
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url);
            const jsonData = await res.json();
            
            if (!res.ok) throw new Error(jsonData.message || 'Failed to load report');
            setData(jsonData);
        } catch (err: any) {
            setError(err.message || 'Error loading report data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) {
        return (
            <Layout>
                <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
                    <Loader2 className="animate-spin text-indigo-600" size={48} />
                    <p className="text-slate-500 font-medium animate-pulse">Soo raraya xogta howlgalka...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-[1600px] mx-auto p-4 md:p-8">

                {/* Header Section */}
                <div className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center space-x-2 text-indigo-600 mb-2">
                            <Building size={20} />
                            <span className="text-xs font-bold uppercase tracking-widest">Maamulka Howlgalka</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                            Warbixinta Howlgalka <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">SHIRKADDA</span>
                        </h1>
                        <p className="text-slate-500 mt-3 max-w-2xl font-medium text-sm">
                            Dhamaan dhaq-dhaqaaqa operational-ka ah ee shirkadda: Lacagta taalla, mushahaaradka, hantida, iyo daymaha gaarka ah (ProjectId: Null).
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                            <Calendar size={18} className="text-slate-400 ml-2" />
                            <input
                                type="date"
                                className="bg-transparent text-sm font-semibold outline-none text-slate-700 px-2"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <span className="text-slate-300">→</span>
                            <input
                                type="date"
                                className="bg-transparent text-sm font-semibold outline-none text-slate-700 px-2"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                            <button
                                onClick={fetchReport}
                                className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                            >
                                Filter Opex
                            </button>
                        </div>

                        <button
                            onClick={() => data && exportCompanyReportPDF(data)}
                            className="group flex items-center space-x-3 bg-slate-900 text-white px-6 py-3 rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                        >
                            <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                            <span className="font-bold">Dhalo PDF</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 p-6 rounded-2xl mb-10 flex items-center shadow-sm">
                        <div className="p-2 bg-rose-600 text-white rounded-full mr-4">
                           <XCircle size={24} />
                        </div>
                        <div>
                            <p className="font-bold">Cilad baa dhacday</p>
                            <p className="text-sm opacity-80">{error}</p>
                        </div>
                    </div>
                )}

                {data && (
                    <div className="space-y-10">

                        {/* 1. FINANCIAL SNAPSHOT (Modern Cards) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            
                            {/* Net Worth Card (Primary) */}
                            <div className="col-span-1 md:col-span-2 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                                <div className="relative z-10">
                                    <div className="flex items-center space-x-2 text-indigo-300 mb-4 opacity-80">
                                        <Wallet size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">QIIMAHA NADIIFKA AH (COMPANY EQUITY)</span>
                                    </div>
                                    <h2 className="text-4xl lg:text-5xl font-black mb-2 tracking-tighter tabular-nums">
                                        {formatCurrency(data.summary.netEquity)}
                                    </h2>
                                    <p className="text-indigo-200/60 text-sm font-medium">
                                        Cash + Assets + Core Receivables - Core Payables
                                    </p>
                                </div>
                                <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12">
                                    <TrendingUp size={240} strokeWidth={3} />
                                </div>
                            </div>

                            {/* Cash Card */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                        <DollarSign size={24} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lacagta Hada Taala</p>
                                        <p className="text-xl font-black text-slate-900 tabular-nums">{formatCurrency(data.summary.currentCashBalance)}</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-50">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                        <span>SYSTEM CASH</span>
                                        <span className="text-emerald-600 font-black">AVAILABLE</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full w-[100%]" />
                                    </div>
                                </div>
                            </div>

                            {/* Assets Card */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                        <Building size={24} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hantida Ma Guurtada</p>
                                        <p className="text-xl font-black text-slate-900 tabular-nums">{formatCurrency(data.summary.totalFixedAssets)}</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-50">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                        <span>BOOK VALUE</span>
                                        <span className="text-indigo-600 font-black">ASSETS</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-indigo-500 h-full w-[100%]" />
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* 2. RECEIVABLES & PAYABLES (CORE ONLY) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Receivables (Direct Loans) */}
                            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Lacagta ka Maqan (Receivables)</h3>
                                        <p className="text-xs text-slate-500 font-medium">Daymaha gaarka ah ee macaamiisha la siiyay.</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-blue-600 tabular-nums">{formatCurrency(data.summary.totalReceivables)}</span>
                                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Direct Loans Given</div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-4 bg-indigo-50/30 rounded-2xl border border-indigo-50">
                                        <div className="flex items-center space-x-2">
                                            <div className="p-1.5 bg-indigo-500 rounded-lg text-white">
                                                <Wallet size={12} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Daymaha Tooska ah (Core Loans)</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">{formatCurrency(data.summary.activeLoansReceivable)}</span>
                                    </div>
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Xog Muhiim ah</p>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                            Xogtan waxay ku dhisantahay macaamiisha lacagaha dayn ahaan loo siiyay iyada oo aan lagu xidhin mashruuc gaar ah.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Payables (Operational Debt) */}
                            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Daymaha Shirkadda (Payables)</h3>
                                        <p className="text-xs text-slate-500 font-medium">Daymaha shirkadda ee aan mashaariicda ahayn.</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-rose-600 tabular-nums">{formatCurrency(data.summary.totalPayables)}</span>
                                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Core Obligations</div>
                                    </div>
                                </div>
                                <div className="space-y-0 divide-y divide-slate-100 overflow-hidden border border-slate-100 rounded-2xl">
                                    <ExpandableRow 
                                        title="Biilasha dhiman (Unpaid Bills)" 
                                        amount={data.summary.unpaidBills} 
                                        transactions={data.summary.unpaidBillsDetail?.transactions || []} 
                                    />
                                    <ExpandableRow 
                                        title="Mushahar dhiman (Unpaid Labor)" 
                                        amount={data.summary.unpaidLabor} 
                                        transactions={data.summary.unpaidLaborDetail?.transactions || []} 
                                    />
                                    <ExpandableRow 
                                        title="Daymaha kale (Core Loans)" 
                                        amount={data.summary.activeLoansPayable} 
                                        transactions={data.summary.activeLoansPayableDetail?.transactions || []} 
                                    />
                                    <div className="pt-2 p-4">
                                        <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Opex Trend (Monthly)</p>
                                        <div className="h-[60px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={data.breakdowns.trends}>
                                                    <defs>
                                                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <Area type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAmt)" />
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                                        formatter={(value) => formatCurrency(Number(value))}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. TRENDS & DETAILS */}
                        <div className="flex flex-col xl:flex-row gap-8">
                            
                            {/* Detailed Expenses Breakdown */}
                            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-slate-900 text-white rounded-xl mr-3 shadow-lg">
                                            <TrendingDown size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 uppercase tracking-tight">Kharashyada Howl-galka</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider tracking-widest leading-none">FAAF-FAAHINTA HOWL-GALKA (OPEX)</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {data.breakdowns.expenses.map((item, idx) => (
                                        <ExpandableRow 
                                            key={idx} 
                                            title={item.category} 
                                            amount={item.amount} 
                                            remaining={item.remaining}
                                            transactions={item.transactions} 
                                        />
                                    ))}
                                    <div className="bg-indigo-50/50 flex justify-between items-center py-6 px-8 border-t border-indigo-100 mt-auto">
                                        <span className="font-black text-indigo-900 uppercase tracking-widest text-xs">Wadarta Kharashka (Filtered)</span>
                                        <span className="font-black text-indigo-700 text-2xl tabular-nums font-mono">{formatCurrency(data.summary.filteredCompanyExpenses)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Assets List */}
                            <div className="w-full xl:w-[500px] bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-indigo-600 text-white rounded-xl mr-3 shadow-lg">
                                            <Briefcase size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 uppercase tracking-tight">Hantida Maguurtada</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">ASSET REGISTER</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-0 overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4 text-left">Hantida</th>
                                                <th className="px-6 py-4 text-right">Qiimaha</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {data.breakdowns.fixedAssets.length === 0 ? (
                                                <tr>
                                                    <td colSpan={2} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                                                        Lama helin wax hanti ah.
                                                    </td>
                                                </tr>
                                            ) : (
                                                data.breakdowns.fixedAssets.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-medium">{item.type} • {new Date(item.purchaseDate).toLocaleDateString()}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-black text-slate-900 text-sm tabular-nums font-mono">
                                                            {formatCurrency(item.value)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-50/80">
                                                <td className="px-6 py-4 font-black text-slate-500 text-[10px] uppercase tracking-wider">Wadarta Agabka</td>
                                                <td className="px-6 py-4 text-right font-black text-slate-900 tabular-nums font-mono">
                                                    {formatCurrency(data.summary.totalFixedAssets)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </Layout>
    );
}
