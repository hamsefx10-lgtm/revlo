'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../../components/layouts/Layout';
import { Loader2, XCircle, Download, Calendar, Building, DollarSign, TrendingUp, TrendingDown, Briefcase, Wallet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Types ---
interface IncomeGroup {
    name: string;
    amount: number;
}

interface ExpenseGroup {
    category: string;
    amount: number;
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
        completedProjectsProfit: number;
        activeProjectsSurplus: number;
        totalOtherIncome: number;
        totalOpEx: number;
        netProfit: number;
        totalFixedAssets: number;
    };
    breakdowns: {
        income: IncomeGroup[];
        expenses: ExpenseGroup[];
        fixedAssets: FixedAssetItem[];
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
    const reportTitle = 'WARBIXINTA GUUD EE SHIRKADDA';
    const dateText = `${new Date(data.dateRange.startDate).toLocaleDateString()} - ${new Date(data.dateRange.endDate).toLocaleDateString()}`;

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

    // Summary Cards (Text based for PDF)
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('KOOBIDI GUUD (SUMMARY)', 15, yPos);
    yPos += 8;

    const summaryData = [
        ['Lacagta Hada Taala (Cash Balance)', formatCurrency(data.summary.currentCashBalance)],
        ['Faa\'iidada Mashaariicda Dhammaystiran (Realized)', formatCurrency(data.summary.completedProjectsProfit)],
        ['Lacagta Mashaariicda u Hadhay (Remaining Funds)', formatCurrency(data.summary.activeProjectsSurplus)],
        ['Kharashka Hawlgalka (OpEx)', formatCurrency(data.summary.totalOpEx)],
        ['Net Faa\'iidada (Realized + Other - OpEx)', formatCurrency(data.summary.netProfit)],
        ['Qiimaha Hantida (Fixed Assets)', formatCurrency(data.summary.totalFixedAssets)],
    ];

    autoTable(doc, {
        startY: yPos,
        head: [['Tilmaan', 'Qiimaha']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: { 1: { halign: 'right' } },
        margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // 1. Income Detail
    doc.text('ISHA DHAQAALAHA (Sources of Funds)', 15, yPos);
    yPos += 5;

    const incomeRows = data.breakdowns.income.map(item => [item.name, formatCurrency(item.amount)]);

    autoTable(doc, {
        startY: yPos,
        head: [['Isha', 'Qiimaha']],
        body: incomeRows,
        theme: 'striped',
        headStyles: { fillColor: [46, 204, 113] },
        columnStyles: { 1: { halign: 'right' } },
        margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // 2. Expense Detail
    doc.text('KHARASHKA HAWLGALKA (Operating Expenses)', 15, yPos);
    yPos += 5;

    const expenseRows = data.breakdowns.expenses.map(item => [item.category, formatCurrency(item.amount)]);

    autoTable(doc, {
        startY: yPos,
        head: [['Qeybta Kharashka', 'Wadarta']],
        body: expenseRows,
        theme: 'striped',
        headStyles: { fillColor: [231, 76, 60] },
        columnStyles: { 1: { halign: 'right' } },
        margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // 3. Fixed Assets
    if (data.breakdowns.fixedAssets.length > 0) {
        doc.addPage();
        yPos = 20;
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
            headStyles: { fillColor: [155, 89, 182] },
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

    doc.save('Company_Report.pdf');
}


// --- Main Page Component ---
export default function CompanyReportPage() {
    const [data, setData] = useState<CompanyReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Date Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Initial Load (This Year)
    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            let url = '/api/accounting/reports/company-comprehensive';
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to load report');
            const jsonData = await res.json();
            setData(jsonData);
        } catch (err) {
            setError('Error loading report data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilter = () => {
        fetchReport();
    };

    if (loading && !data) {
        return (
            <Layout>
                <div className="flex h-[80vh] items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={40} />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto p-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Warbixinta Guud ee Shirkadda</h1>
                        <p className="text-gray-500 text-sm mt-1">Cash Balance, Company Profit, Remaining Funds & Assets.</p>
                        {data && (
                            <p className="text-primary text-sm font-medium mt-2">
                                {new Date(data.dateRange.startDate).toLocaleDateString()} - {new Date(data.dateRange.endDate).toLocaleDateString()}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
                        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <Calendar size={16} className="text-gray-500" />
                            <input
                                type="date"
                                className="bg-transparent text-sm outline-none text-gray-700"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                className="bg-transparent text-sm outline-none text-gray-700"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                            <button
                                onClick={handleApplyFilter}
                                className="bg-primary text-white px-3 py-1 rounded text-xs font-medium"
                            >
                                Apply
                            </button>
                        </div>

                        <button
                            onClick={() => data && exportCompanyReportPDF(data)}
                            className="flex items-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                        >
                            <Download size={18} />
                            <span>PDF / Print</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center">
                        <XCircle size={20} className="mr-2" />
                        {error}
                    </div>
                )}

                {data && (
                    <div className="space-y-8">

                        {/* 1. CURRENT CASH POSITION (Highlighted) */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-xl shadow-lg flex justify-between items-center">
                            <div>
                                <p className="text-blue-100 font-medium mb-1">Lacagta Hada Taala (Cash Balance)</p>
                                <h2 className="text-4xl font-bold">{formatCurrency(data.summary.currentCashBalance)}</h2>
                                <p className="text-xs text-blue-200 mt-2">Total Cash available in Hand and Bank</p>
                            </div>
                            <div className="bg-white/20 p-4 rounded-full">
                                <Wallet size={40} className="text-white" />
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Net Faa'iidada Shirkadda</p>
                                        <h3 className="text-xl md:text-2xl font-bold text-gray-800 mt-1">{formatCurrency(data.summary.netProfit)}</h3>
                                        <p className="text-xs text-green-600 mt-1">Completed Profit - OpEx</p>
                                    </div>
                                    <div className="p-2 bg-green-50 rounded-lg">
                                        <TrendingUp size={20} className="text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Lacagta Mashaariicda u Hadhay</p>
                                        <h3 className="text-xl md:text-2xl font-bold text-gray-800 mt-1">{formatCurrency(data.summary.activeProjectsSurplus)}</h3>
                                        <p className="text-xs text-orange-600 mt-1">Unused Funds (Active Projects)</p>
                                    </div>
                                    <div className="p-2 bg-orange-50 rounded-lg">
                                        <Briefcase size={20} className="text-orange-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Kharashka Hawlgalka (OpEx)</p>
                                        <h3 className="text-xl md:text-2xl font-bold text-gray-800 mt-1">{formatCurrency(data.summary.totalOpEx)}</h3>
                                        <p className="text-xs text-purple-600 mt-1">Company Expenses Only</p>
                                    </div>
                                    <div className="p-2 bg-purple-50 rounded-lg">
                                        <TrendingDown size={20} className="text-purple-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Sections */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Income Source Detail */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center">
                                    <TrendingUp size={18} className="text-green-600 mr-2" />
                                    <h3 className="font-semibold text-gray-800">Isha Dhaqaalaha (Breakdown)</h3>
                                </div>
                                <div className="p-0">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Nooca</th>
                                                <th className="px-6 py-3 text-right">Qiimaha</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {data.breakdowns.income.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition">
                                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{item.name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-700 text-right font-bold">{formatCurrency(item.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Expense Source Detail */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center">
                                    <TrendingDown size={18} className="text-red-600 mr-2" />
                                    <h3 className="font-semibold text-gray-800">Faahfaahinta Kharashyada Hawlka</h3>
                                </div>
                                <div className="p-0">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Qaybta</th>
                                                <th className="px-6 py-3 text-right">Qiimaha</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {data.breakdowns.expenses.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition">
                                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{item.category}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-700 text-right font-bold">{formatCurrency(item.amount)}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-red-50/50">
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900">Total</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">{formatCurrency(data.summary.totalOpEx)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Fixed Assets Section */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-12">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center">
                                    <Building size={18} className="text-purple-600 mr-2" />
                                    <h3 className="font-semibold text-gray-800">Hantida Ma Guurtada Ah (Fixed Assets)</h3>
                                </div>
                                <div className="text-sm font-bold text-purple-700">
                                    Total: {formatCurrency(data.summary.totalFixedAssets)}
                                </div>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Magaca Hantida</th>
                                            <th className="px-6 py-3 text-left">Nooca</th>
                                            <th className="px-6 py-3 text-left">Taariikhda Iibka</th>
                                            <th className="px-6 py-3 text-right">Qiimaha Hada</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.breakdowns.fixedAssets.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                                                    Lama helin wax hanti ah.
                                                </td>
                                            </tr>
                                        ) : (
                                            data.breakdowns.fixedAssets.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition">
                                                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">{item.name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{item.type}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(item.purchaseDate).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-800 text-right font-semibold">{formatCurrency(item.value)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </Layout>
    );
}
