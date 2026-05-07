'use client';

import React, { useState, useEffect } from 'react';
import {
    Search,
    Calendar,
    Download,
    Eye,
    RotateCcw,
    Printer,
    ArrowUpRight,
    Loader2,
    PackageX,
    CreditCard,
    MessageCircle,
    TrendingUp,
    ShoppingBag,
    DollarSign,
    CheckCircle2,
    X,
    ArrowLeft,
    ChevronRight,
    MoreVertical,
    History,
    Globe,
    FileText,
    Sheet,
    Lock
} from 'lucide-react';
import Link from 'next/link';
import { format, isToday, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useShopLang } from '@/contexts/ShopLanguageContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- TYPES ---
interface SaleItem {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface Sale {
    id: string;
    invoiceNumber: string;
    customer: { name: string; phone?: string } | null;
    createdAt: string;
    total: number;
    paidAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
    subtotal: number;
    tax: number;
    items: SaleItem[];
    currency: string;
    exchangeRate: number;
}

export default function SalesHistoryPage() {
    const { t } = useShopLang();
    const { toast } = useToast();
    const [dateRange, setDateRange] = useState('Today');
    const [search, setSearch] = useState('');
    const [sales, setSales] = useState<Sale[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    // Sidebars & Modals
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isPaySidebarOpen, setIsPaySidebarOpen] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

    // Payment State
    const [payAmount, setPayAmount] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [payLoading, setPayLoading] = useState(false);
    const [currentExchangeRate, setCurrentExchangeRate] = useState<number>(1);

    // Refund State
    const [refundReason, setRefundReason] = useState('');
    const [refundAccountId, setRefundAccountId] = useState('');
    const [selectedRefundItems, setSelectedRefundItems] = useState<Set<string>>(new Set());
    const [requireRefundPassword, setRequireRefundPassword] = useState(false);
    const [refundPasswordInput, setRefundPasswordInput] = useState('');
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [pendingRefundSale, setPendingRefundSale] = useState<Sale | null>(null);

    // Pagination State
    const [limit, setLimit] = useState(20);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    // Hover Preview State
    const [hoveredSaleId, setHoveredSaleId] = useState<string | null>(null);

    useEffect(() => {
        fetchSales();
        fetchAccounts();
        // Check security settings
        fetch('/api/settings/security').then(r => r.json()).then(data => {
            if (data.success && data.features?.requirePasswordOnRefunds) {
                setRequireRefundPassword(true);
            }
        }).catch(() => {});
    }, []);

    useEffect(() => {
        fetchSales();
    }, [dateRange]);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts'); // Using the more general accounts API
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSales = async (isLoadMore = false) => {
        try {
            if (!isLoadMore) setLoading(true);
            const currentOffset = isLoadMore ? sales.length : 0;
            const rangeParam = dateRange !== 'All' ? `&dateRange=${encodeURIComponent(dateRange)}` : '';
            const response = await fetch(`/api/shop/sales?limit=${limit}&offset=${currentOffset}${rangeParam}`);
            const data = await response.json();
            if (data.sales) {
                if (isLoadMore) {
                    setSales(prev => [...prev, ...data.sales]);
                } else {
                    setSales(data.sales);
                }
                setHasMore(data.sales.length === limit);
                if (data.totalCount !== undefined) setTotalCount(data.totalCount);
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsApp = async (sale: Sale) => {
        if (!sale.customer?.phone) {
            toast({ title: "Missing Phone", description: "No customer phone attached.", variant: "destructive" });
            return;
        }

        const phone = sale.customer.phone;
        const balance = sale.total - (sale.paidAmount || 0);
        const message = `Asc ${sale.customer.name}, kani waa risiitkaaga Invoice #${sale.invoiceNumber}. Wadarta: ETB ${sale.total.toLocaleString()}.${balance > 0 ? ` Lacagta kugu dhiman waa ETB ${balance.toLocaleString()}. Fadlan xaqiiji haddii aad bixisay.` : ''} Mahadsanid!`;
        const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const openPaySidebar = async (sale: Sale) => {
        const balance = sale.total - (sale.paidAmount || 0);
        if (balance <= 0) return;

        setSelectedSale(sale);
        setPayAmount(balance.toString());
        setIsPaySidebarOpen(true);
        if (accounts.length > 0) setSelectedAccount(accounts[0].id);

        // Fetch today's rate for settlement
        try {
            const res = await fetch('/api/settings/exchange-rate');
            const data = await res.json();
            if (data.rate) {
                setCurrentExchangeRate(data.rate.rate);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSettle = async () => {
        if (!selectedSale || !payAmount || !selectedAccount) return;

        setPayLoading(true);
        try {
            const res = await fetch(`/api/shop/sales/${selectedSale.id}/settle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(payAmount),
                    accountId: selectedAccount,
                    exchangeRate: currentExchangeRate,
                    description: `${t('settlement_for')} #${selectedSale.invoiceNumber}`
                })
            });

            if (res.ok) {
                toast({
                    title: t('payment_recorded'),
                    description: `${t('invoice_number')} #${selectedSale.invoiceNumber} — ETB ${parseFloat(payAmount).toLocaleString()}`,
                    variant: 'default'
                });
                setIsPaySidebarOpen(false);
                fetchSales();
            } else {
                const error = await res.json();
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setPayLoading(false);
        }
    };

    const handleRefund = (sale: Sale) => {
        if (requireRefundPassword) {
            setPendingRefundSale(sale);
            setRefundPasswordInput('');
            setShowPasswordPrompt(true);
            return;
        }
        openRefundModal(sale);
    };

    const openRefundModal = (sale: Sale) => {
        setSelectedSale(sale);
        setIsRefundModalOpen(true);
        setSelectedRefundItems(new Set(sale.items.map(i => i.id)));
        if (accounts.length > 0) setRefundAccountId(accounts[0].id);
    };

    const verifyRefundPassword = async () => {
        try {
            const res = await fetch('/api/auth/verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: refundPasswordInput })
            });
            if (res.ok) {
                setShowPasswordPrompt(false);
                if (pendingRefundSale) openRefundModal(pendingRefundSale);
            } else {
                toast({ title: 'Khalad!', description: 'Password-ka waa khalad. Isku day mar kale.', variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Xaqiijinta way fashilantay', variant: 'destructive' });
        }
    };

    const toggleRefundItem = (id: string) => {
        const next = new Set(selectedRefundItems);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedRefundItems(next);
    };

    const calculateRefundTotal = () => {
        if (!selectedSale) return 0;
        return selectedSale.items
            .filter(i => selectedRefundItems.has(i.id))
            .reduce((sum, i) => sum + i.total, 0);
    };

    const submitRefund = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSale || !refundAccountId) return;

        setProcessing(selectedSale.id);
        try {
            const res = await fetch(`/api/shop/sales/${selectedSale.id}/refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId: refundAccountId,
                    reason: refundReason,
                    itemIds: Array.from(selectedRefundItems)
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Refund failed');
            }

            toast({ title: t('success'), variant: 'default' });
            setIsRefundModalOpen(false);
            setRefundReason('');
            fetchSales();
        } catch (error: any) {
            toast({ title: 'Refund Error', description: error.message, variant: "destructive" });
        } finally {
            setProcessing(null);
        }
    };

    // Analytics Calculations (Based on loaded 50 sales)
    const todaySales = sales.filter(s => isToday(parseISO(s.createdAt)));
    const totalRevToday = todaySales.reduce((sum, s) => sum + s.total, 0);
    const unpaidToday = todaySales.reduce((sum, s) => sum + (s.total - s.paidAmount), 0);

    const filteredData = sales.filter(sale =>
        (sale.invoiceNumber?.toLowerCase()?.includes(search.toLowerCase()) || '') ||
        (sale.customer?.name?.toLowerCase()?.includes(search.toLowerCase()) || '')
    );

    const handleExport = () => {
        if (filteredData.length === 0) return;

        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 15;

        // --- HEADER BAR ---
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageW, 28, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text('Revlo', margin, 12);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text('Taariikhda Iibka — Warbixin Rasmi Ah', margin, 19);

        // Date + Time
        const dateLabel = dateRange === 'All' ? 'Weligeed' : dateRange === 'Today' ? 'Maanta' : dateRange === 'This Week' ? 'Usbuucan' : 'Bishan';
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`${dateLabel}  •  ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, pageW - margin, 12, { align: 'right' });
        doc.text(`Tirada: ${filteredData.length} transaction`, pageW - margin, 19, { align: 'right' });

        // --- KPI SUMMARY CARDS ---
        const y0 = 35;
        const cardW = (pageW - margin * 2 - 10) / 3;
        const totalRev = filteredData.reduce((s, x) => s + (x.subtotal || x.total), 0);
        const totalGross = filteredData.reduce((s, x) => s + x.total, 0);
        const totalDebt = filteredData.reduce((s, x) => s + (x.total - (x.paidAmount || 0)), 0);

        const kpis = [
            { label: 'DAKHLIGA SAAFIGA', value: `ETB ${totalRev.toLocaleString()}`, sub: `Wadarta: ETB ${totalGross.toLocaleString()}`, color: [16, 185, 129] },
            { label: 'DHAQDHAQAAQYADA', value: `${filteredData.length}`, sub: `Dalabyo la diiwaan geliyay`, color: [59, 130, 246] },
            { label: 'DAYMAHA MAQAN', value: `ETB ${totalDebt.toLocaleString()}`, sub: `Lacagta aan macaamiisha ku leenahay`, color: [239, 68, 68] },
        ];

        kpis.forEach((kpi, i) => {
            const x = margin + i * (cardW + 5);
            doc.setFillColor(248, 250, 252); // slate-50
            doc.roundedRect(x, y0, cardW, 22, 3, 3, 'F');
            // Accent line
            doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
            doc.rect(x, y0, 1.5, 22, 'F');
            // Label
            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(148, 163, 184);
            doc.text(kpi.label, x + 7, y0 + 7);
            // Value
            doc.setFontSize(13);
            doc.setTextColor(15, 23, 42);
            doc.text(kpi.value, x + 7, y0 + 15);
            // Sub
            doc.setFontSize(5.5);
            doc.setTextColor(148, 163, 184);
            doc.text(kpi.sub, x + 7, y0 + 20);
        });

        // --- TABLE ---
        const tableY = y0 + 30;
        const tableData = filteredData.map((s, idx) => {
            const bal = s.total - (s.paidAmount || 0);
            return [
                (idx + 1).toString(),
                `#${s.invoiceNumber}`,
                s.customer?.name || 'Walk-in',
                format(new Date(s.createdAt), 'dd/MM/yy HH:mm'),
                s.paymentMethod,
                s.paymentStatus === 'Paid' ? 'La Bixiyay' : 'Deen',
                `${s.total.toLocaleString()}`,
                `${(s.paidAmount || 0).toLocaleString()}`,
                `${bal.toLocaleString()}`,
            ];
        });

        // Totals row
        const grandTotal = filteredData.reduce((s, x) => s + x.total, 0);
        const grandPaid = filteredData.reduce((s, x) => s + (x.paidAmount || 0), 0);
        const grandBal = grandTotal - grandPaid;
        tableData.push(['', '', '', '', '', 'WADARTA', grandTotal.toLocaleString(), grandPaid.toLocaleString(), grandBal.toLocaleString()]);

        autoTable(doc, {
            startY: tableY,
            margin: { left: margin, right: margin },
            head: [['#', 'Invoice', 'Macmiilka', 'Taariikh', 'Habka', 'Xaalad', 'Wadarta', 'La Bixiyay', 'Haraaga']],
            body: tableData,
            theme: 'plain',
            styles: {
                fontSize: 7.5,
                cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
                textColor: [30, 41, 59],
                lineColor: [226, 232, 240],
                lineWidth: 0.2,
                font: 'helvetica',
            },
            headStyles: {
                fillColor: [241, 245, 249],
                textColor: [100, 116, 139],
                fontStyle: 'bold',
                fontSize: 6.5,
                cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                5: { halign: 'center' },
                6: { halign: 'right', fontStyle: 'bold' },
                7: { halign: 'right' },
                8: { halign: 'right' },
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252],
            },
            didDrawCell: (data: any) => {
                // Style status column
                if (data.section === 'body' && data.column.index === 5 && data.row.index < filteredData.length) {
                    const val = data.cell.raw;
                    if (val === 'La Bixiyay') {
                        doc.setFillColor(220, 252, 231);
                        doc.roundedRect(data.cell.x + 2, data.cell.y + 1.5, data.cell.width - 4, data.cell.height - 3, 1.5, 1.5, 'F');
                        doc.setFontSize(6);
                        doc.setTextColor(22, 163, 74);
                        doc.text(val, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' });
                    } else if (val === 'Deen') {
                        doc.setFillColor(254, 243, 199);
                        doc.roundedRect(data.cell.x + 2, data.cell.y + 1.5, data.cell.width - 4, data.cell.height - 3, 1.5, 1.5, 'F');
                        doc.setFontSize(6);
                        doc.setTextColor(217, 119, 6);
                        doc.text(val, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' });
                    }
                }
                // Bold total row
                const isLastRow = data.row.index === tableData.length - 1;
                if (data.section === 'body' && isLastRow) {
                    doc.setFillColor(15, 23, 42);
                    doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(255, 255, 255);
                    const align = data.column.index >= 6 ? 'right' : (data.column.index === 5 ? 'center' : 'left');
                    const xPos = align === 'right' ? data.cell.x + data.cell.width - 3 : (align === 'center' ? data.cell.x + data.cell.width / 2 : data.cell.x + 3);
                    doc.text(String(data.cell.raw || ''), xPos, data.cell.y + data.cell.height / 2 + 1, { align });
                }
            },
        });

        // --- FOOTER ---
        const totalPages = doc.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            doc.setFillColor(248, 250, 252);
            doc.rect(0, pageH - 12, pageW, 12, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.line(0, pageH - 12, pageW, pageH - 12);
            doc.setFontSize(6);
            doc.setTextColor(148, 163, 184);
            doc.setFont('helvetica', 'normal');
            doc.text(`Revlo POS  •  ${format(new Date(), 'dd/MM/yyyy HH:mm')}  •  Warbixin Auto-Generated`, margin, pageH - 5);
            doc.text(`${p} / ${totalPages}`, pageW - margin, pageH - 5, { align: 'right' });
        }

        doc.save(`Revlo-Sales-${dateRange}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    const handleExportExcel = () => {
        if (filteredData.length === 0) return;
        const dateLabel = dateRange === 'All' ? 'Weligeed' : dateRange === 'Today' ? 'Maanta' : dateRange === 'This Week' ? 'Usbuucan' : 'Bishan';
        const totalRev = filteredData.reduce((s, x) => s + (x.subtotal || x.total), 0);
        const totalDebt = filteredData.reduce((s, x) => s + (x.total - (x.paidAmount || 0)), 0);
        const grandTotal = filteredData.reduce((s, x) => s + x.total, 0);
        const grandPaid = filteredData.reduce((s, x) => s + (x.paidAmount || 0), 0);

        // Build styled HTML table for Excel
        const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="UTF-8">
        <style>
            body { font-family: Calibri, Arial, sans-serif; }
            .header { background: #0F172A; color: white; font-size: 18px; font-weight: bold; padding: 12px 16px; }
            .header-sub { background: #0F172A; color: #94A3B8; font-size: 11px; padding: 4px 16px 12px; }
            .kpi-row td { padding: 10px 16px; font-size: 12px; border: 1px solid #E2E8F0; }
            .kpi-label { color: #64748B; font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
            .kpi-value { font-size: 18px; font-weight: bold; color: #0F172A; }
            .spacer td { height: 16px; border: none; }
            th { background: #F1F5F9; color: #64748B; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding: 10px 12px; border: 1px solid #E2E8F0; text-align: left; }
            td { padding: 8px 12px; font-size: 11px; color: #1E293B; border: 1px solid #F1F5F9; }
            tr:nth-child(even) td { background: #F8FAFC; }
            .paid { background: #DCFCE7; color: #16A34A; padding: 3px 10px; border-radius: 4px; font-weight: bold; font-size: 9px; }
            .unpaid { background: #FEF3C7; color: #D97706; padding: 3px 10px; border-radius: 4px; font-weight: bold; font-size: 9px; }
            .total-row td { background: #0F172A !important; color: white !important; font-weight: bold; font-size: 12px; border: none; }
            .footer td { background: #F8FAFC; color: #94A3B8; font-size: 9px; padding: 8px 16px; border: none; border-top: 1px solid #E2E8F0; }
        </style>
        </head>
        <body>
        <table width="100%">
            <tr><td colspan="9" class="header">REVLO — Taariikhda Iibka</td></tr>
            <tr><td colspan="9" class="header-sub">${dateLabel} • ${format(new Date(), 'dd MMM yyyy, HH:mm')} • ${filteredData.length} transactions</td></tr>
            <tr class="spacer"><td colspan="9"></td></tr>
            <tr class="kpi-row">
                <td colspan="3"><span class="kpi-label">Dakhliga Saafiga</span><br/><span class="kpi-value">ETB ${totalRev.toLocaleString()}</span></td>
                <td colspan="3"><span class="kpi-label">Dhaqdhaqaaqyada</span><br/><span class="kpi-value">${filteredData.length} Dalabyo</span></td>
                <td colspan="3"><span class="kpi-label">Daymaha Maqan</span><br/><span class="kpi-value">ETB ${totalDebt.toLocaleString()}</span></td>
            </tr>
            <tr class="spacer"><td colspan="9"></td></tr>
            <tr>
                <th>#</th><th>Invoice</th><th>Macmiilka</th><th>Taariikh</th><th>Habka</th><th>Xaalad</th><th>Wadarta (ETB)</th><th>La Bixiyay</th><th>Haraaga</th>
            </tr>
            ${filteredData.map((s, i) => {
                const bal = s.total - (s.paidAmount || 0);
                const statusClass = s.paymentStatus === 'Paid' ? 'paid' : 'unpaid';
                const statusText = s.paymentStatus === 'Paid' ? 'La Bixiyay' : 'Deen';
                return `<tr>
                    <td>${i + 1}</td>
                    <td>#${s.invoiceNumber}</td>
                    <td>${s.customer?.name || 'Walk-in'}</td>
                    <td>${format(new Date(s.createdAt), 'dd/MM/yy HH:mm')}</td>
                    <td>${s.paymentMethod}</td>
                    <td><span class="${statusClass}">${statusText}</span></td>
                    <td style="text-align:right;font-weight:bold">${s.total.toLocaleString()}</td>
                    <td style="text-align:right">${(s.paidAmount || 0).toLocaleString()}</td>
                    <td style="text-align:right">${bal.toLocaleString()}</td>
                </tr>`;
            }).join('')}
            <tr class="total-row">
                <td colspan="6" style="text-align:right">WADARTA</td>
                <td style="text-align:right">${grandTotal.toLocaleString()}</td>
                <td style="text-align:right">${grandPaid.toLocaleString()}</td>
                <td style="text-align:right">${(grandTotal - grandPaid).toLocaleString()}</td>
            </tr>
            <tr class="footer"><td colspan="9">Revlo POS • ${format(new Date(), 'dd/MM/yyyy HH:mm')} • Warbixin Auto-Generated</td></tr>
        </table>
        </body></html>`;

        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Revlo-Sales-${dateRange}-${format(new Date(), 'yyyy-MM-dd')}.xls`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F1A] pb-20 font-sans w-full relative overflow-x-hidden animate-fade-in flex flex-col items-start overflow-y-auto">

            {/* TOP HEADER */}
            <div className="w-full mb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-left p-4 lg:p-6 lg:pt-4 pb-0">
                    <div>
                        <Link href="/shop/dashboard" className="group text-slate-400 hover:text-[#3498DB] transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                            <ArrowLeft size={12} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                            Point of Sale Dashboard
                        </Link>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                            <History size={24} strokeWidth={3} className="text-blue-600 dark:text-blue-400 hover:scale-110 active:rotate-12 transition-transform cursor-pointer" />
                            {t('sales_title')}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-xs max-w-md">
                            {t('sales_desc')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800/50 rounded-2xl text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all shadow-sm hover:shadow-md active:scale-95">
                            <FileText size={13} strokeWidth={3} /> PDF
                        </button>
                        <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all shadow-sm hover:shadow-md active:scale-95">
                            <Sheet size={13} strokeWidth={3} /> Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI ANALYTICS CARDS */}
            <div className="w-full px-4 lg:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white dark:bg-[#161B2E] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all text-left">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[40px] rounded-full"></div>
                    <div className="flex items-center gap-4 mb-3">
                        <TrendingUp size={16} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform" />
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Dakhliga Saafiga</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                            {sales.reduce((sum, s) => sum + (s.subtotal || s.total), 0).toLocaleString()}
                        </p>
                        <span className="text-[9px] font-black text-slate-300 uppercase">ETB Saafi</span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 italic">
                        Wadarta: {sales.reduce((sum, s) => sum + s.total, 0).toLocaleString()} ETB (VAT ku jira)
                    </p>
                </div>

                <div className="bg-white dark:bg-[#161B2E] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all text-left">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[40px] rounded-full"></div>
                    <div className="flex items-center gap-4 mb-3">
                        <ShoppingBag size={16} strokeWidth={3} className="text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform" />
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Dhaqdhaqaaqyada</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                            {sales.length}
                        </p>
                        <span className="text-[9px] font-black text-slate-300 uppercase">Dalabyo</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#161B2E] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/30 transition-all text-left">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-[40px] rounded-full"></div>
                    <div className="flex items-center gap-4 mb-3">
                        <DollarSign size={16} strokeWidth={3} className="text-rose-500 hover:scale-110 transition-transform" />
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Lacagta Maqan</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums text-left">
                            {sales.reduce((sum, s) => sum + (s.total - s.paidAmount), 0).toLocaleString()}
                        </p>
                        <span className="text-[9px] font-black text-slate-300 uppercase italic">Daymaha</span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 italic">
                        Wadarta daymaha aan macaamiisha ku leenahay.
                    </p>
                </div>
            </div>

            {/* CONTROLS & TABLE SECTION */}
            <div className="w-full px-4 lg:px-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-2 bg-white dark:bg-[#161B2E] p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        {[t('today'), t('this_week'), t('this_month'), t('all_time')].map((label, idx) => {
                            const rangeKeys = ['Today', 'This Week', 'This Month', 'All'];
                            return (
                            <button
                                key={rangeKeys[idx]}
                                onClick={() => setDateRange(rangeKeys[idx])}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateRange === rangeKeys[idx]
                                    ? 'bg-[#3498DB] text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {label}
                            </button>
                            );
                        })}
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3498DB] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-white dark:bg-[#161B2E] border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#3498DB] transition-all w-80 shadow-sm"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-[#161B2E] border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden min-h-[500px]">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            {t('transactions_title')}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96 gap-4">
                            <Loader2 className="animate-spin text-[#3498DB]" size={40} strokeWidth={3} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('loading')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-6 px-10">{t('invoice_number')}</th>
                                        <th className="py-6 px-4">{t('customer')}</th>
                                        <th className="py-6 px-4 text-center">{t('payment_method')}</th>
                                        <th className="py-6 px-4 text-center">{t('status')}</th>
                                        <th className="py-6 px-4 text-right">{t('total')}</th>
                                        <th className="py-6 px-10 text-right">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-left">
                                    {filteredData.map((sale) => {
                                        const isPaid = sale.paymentStatus === 'Paid' || sale.status === 'Paid';
                                        const isRefunded = sale.status === 'Refunded' || sale.status === 'PartialRefund';
                                        const balance = sale.total - (sale.paidAmount || 0);

                                        return (
                                            <tr
                                                key={sale.id}
                                                className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200 relative"
                                                onMouseEnter={() => setHoveredSaleId(sale.id)}
                                                onMouseLeave={() => setHoveredSaleId(null)}
                                            >
                                                <td className="py-6 px-10 relative">
                                                    {hoveredSaleId === sale.id && sale.items && sale.items.length > 0 && (
                                                        <div className="absolute left-full top-0 ml-4 z-40 bg-white dark:bg-[#1E293B] shadow-2xl rounded-2xl p-4 border border-slate-100 dark:border-slate-800 w-64 animate-in fade-in zoom-in duration-200 pointer-events-none">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-50 dark:border-slate-800 pb-2">Alaabta La Iibiyay</p>
                                                            <div className="space-y-3">
                                                                {sale.items.slice(0, 5).map(item => (
                                                                    <div key={item.id} className="flex justify-between items-center text-left">
                                                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{item.productName}</span>
                                                                        <span className="text-[10px] font-black text-slate-400">x{item.quantity}</span>
                                                                    </div>
                                                                ))}
                                                                {sale.items.length > 5 && (
                                                                    <p className="text-[9px] font-bold text-blue-500 pt-1">+{sale.items.length - 5} alaab kale</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-white text-sm tracking-tight mb-1">#{sale.invoiceNumber}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 italic">{format(new Date(sale.createdAt), 'MMM dd, yyyy hh:mm a')}</p>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-black">
                                                            {(sale.customer?.name || 'W').charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                            {sale.customer?.name || 'Walk-in'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4 text-center">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                                                        {sale.paymentMethod}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-4 text-center">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                                        isRefunded ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400' :
                                                        isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                        : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400'
                                                        }`}>
                                                        {isRefunded ? (sale.status === 'PartialRefund' ? 'Partial Refund' : 'Refunded') : (sale.paymentStatus || sale.status)}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <p className="text-lg font-black text-slate-900 dark:text-white tracking-tighter tabular-nums drop-shadow-sm">
                                                            {sale.total.toLocaleString()} <span className="text-[9px] opacity-40 italic ml-1 align-top">{sale.currency || 'ETB'}</span>
                                                        </p>
                                                        {sale.currency === 'USD' && (
                                                            <p className="text-[9px] font-black text-slate-400 opacity-60">
                                                                ≈ {(sale.total * (sale.exchangeRate || 1)).toLocaleString()} ETB
                                                            </p>
                                                        )}
                                                        {!isPaid && (
                                                            <p className="text-[10px] font-black text-rose-500 mt-0.5">
                                                                Due: {balance.toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-6 px-10 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!isPaid && (
                                                            <button
                                                                onClick={() => openPaySidebar(sale)}
                                                                className="flex items-center gap-2 px-4 py-2 bg-[#3498DB] hover:bg-[#2980B9] text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20"
                                                            >
                                                                <CreditCard size={14} strokeWidth={3} /> {t('pay')}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleWhatsApp(sale)}
                                                            className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                            title="WhatsApp Receipt"
                                                        >
                                                            <MessageCircle size={16} strokeWidth={3} />
                                                        </button>
                                                        <Link
                                                            href={`/shop/sales/${sale.id}`}
                                                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-[#3498DB] transition-all"
                                                        >
                                                            <ChevronRight size={16} strokeWidth={3} />
                                                        </Link>
                                                        {!isRefunded && (
                                                        <button
                                                            onClick={() => handleRefund(sale)}
                                                            className="p-2.5 rounded-xl bg-orange-500/5 text-orange-500 hover:bg-orange-500 hover:text-white transition-all"
                                                            title="Refund / Return"
                                                        >
                                                            <RotateCcw size={16} strokeWidth={3} />
                                                        </button>
                                                        )}
                                                        <button
                                                            onClick={() => window.open(`/shop/sales/${sale.id}/print?auto=1`, '_blank')}
                                                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all shadow-sm"
                                                            title="Print Receipt"
                                                        >
                                                            <Printer size={16} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && filteredData.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-96 gap-4">
                            <PackageX className="text-slate-300 dark:text-slate-700" size={60} />
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{t('no_data') || 'Wax iibka ah lama helin'}</p>
                            <p className="text-xs text-slate-400">Tijaabi muddo kale ama raadin kale</p>
                        </div>
                    )}

                    {!loading && filteredData.length > 0 && (
                        <div className="p-6 flex items-center justify-between border-t border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/10">
                            <p className="text-[11px] font-bold text-slate-400">
                                {sales.length} ka mid ah {totalCount} {t('total') || 'wadarta'}
                            </p>
                            {hasMore && filteredData.length >= limit && (
                                <button
                                    onClick={() => fetchSales(true)}
                                    className="px-10 py-4 bg-white dark:bg-[#161B2E] border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:border-[#3498DB] hover:text-[#3498DB] transition-all shadow-sm hover:shadow-xl hover:shadow-blue-500/10 active:scale-95"
                                >
                                    {t('view_all') || 'Dhammaanba Arag'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* QUICK PAY SIDEBAR (SLIDE-OVER) */}
            {isPaySidebarOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsPaySidebarOpen(false)} />

                    <div className="relative w-full max-w-md bg-white dark:bg-[#161B2E] h-full shadow-2xl flex flex-col animate-slide-in p-0">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 text-left">
                                    <CreditCard size={20} strokeWidth={3} />
                                </div>
                                {t('balance')}
                            </h3>
                            <button onClick={() => setIsPaySidebarOpen(false)} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="space-y-8">
                                <div className="bg-slate-50 dark:bg-blue-500/5 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-left">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Warbixinta Risiitka</p>
                                    <div className="flex justify-between items-baseline">
                                        <p className="text-2xl font-black text-slate-800 dark:text-white">#{selectedSale?.invoiceNumber}</p>
                                        <p className="text-xs font-bold text-[#3498DB]">{selectedSale?.customer?.name}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">Lacagta Haray</span>
                                            <span className="text-sm font-black text-rose-500">{(selectedSale!.total - (selectedSale!.paidAmount || 0)).toLocaleString()} {selectedSale?.currency}</span>
                                        </div>
                                        {selectedSale?.currency === 'USD' && (
                                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">Sicirka Sarrifka</p>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={currentExchangeRate}
                                                            onChange={(e) => setCurrentExchangeRate(parseFloat(e.target.value))}
                                                            className="w-20 bg-transparent border-b border-blue-500/30 text-sm font-black text-blue-600 outline-none"
                                                        />
                                                        <span className="text-[9px] font-bold text-blue-400 italic">ETB / USD</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ETB Loo Baahan</p>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white">
                                                        {((selectedSale!.total - (selectedSale!.paidAmount || 0)) * currentExchangeRate).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 text-left">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Lacagta La Bixinayo ({selectedSale?.currency})
                                    </label>
                                    <input
                                        type="number"
                                        value={payAmount}
                                        onChange={(e) => setPayAmount(e.target.value)}
                                        className="w-full px-6 py-5 bg-white dark:bg-[#0B0F1A] border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-2xl font-black focus:outline-none focus:border-[#3498DB] transition-all"
                                    />
                                    {selectedSale?.currency === 'USD' && (
                                        <p className="text-[10px] font-bold text-slate-400 italic px-2">
                                            Equiv: {(parseFloat(payAmount || '0') * currentExchangeRate).toLocaleString()} ETB based on rate above.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-4 text-left">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Akoonka Loo Dirayo</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {accounts.map(acc => (
                                            <button
                                                key={acc.id}
                                                onClick={() => setSelectedAccount(acc.id)}
                                                className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${selectedAccount === acc.id
                                                    ? 'border-[#3498DB] bg-blue-50/50 dark:bg-blue-500/10'
                                                    : 'border-slate-50 dark:border-slate-800 hover:border-slate-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${selectedAccount === acc.id ? 'bg-[#3498DB] animate-pulse' : 'bg-slate-300'}`}></div>
                                                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">{acc.name}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 tabular-nums">{acc.balance.toLocaleString()} ETB</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-50 dark:border-slate-800/50">
                            <button
                                onClick={handleSettle}
                                disabled={payLoading || !payAmount || parseFloat(payAmount) <= 0}
                                className="w-full py-5 bg-[#3498DB] hover:bg-[#2980B9] text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-3 group"
                            >
                                {payLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />}
                                {t('pay_now')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REFUND MODAL */}
            {isRefundModalOpen && selectedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-left">
                    <form onSubmit={submitRefund} className="bg-white dark:bg-[#161B2E] rounded-[2.5rem] w-full max-w-md p-0 shadow-2xl relative overflow-hidden">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                                    <RotateCcw size={20} strokeWidth={3} />
                                </div>
                                Lacag Celin (Refund)
                            </h3>
                            <button type="button" onClick={() => setIsRefundModalOpen(false)} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('items_sold')}</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedSale.items.map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => toggleRefundItem(item.id)}
                                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between text-left ${selectedRefundItems.has(item.id)
                                                ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/10'
                                                : 'border-slate-50 dark:border-slate-800'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedRefundItems.has(item.id) ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}>
                                                    {selectedRefundItems.has(item.id) && <X size={10} className="text-white" />}
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.productName}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400">ETB {item.total.toLocaleString()}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-orange-50 dark:bg-orange-500/5 rounded-[1.5rem] border border-orange-100 dark:border-orange-800/50 flex justify-between items-center text-left">
                                <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-none">{t('total')}</span>
                                <span className="text-2xl font-black text-orange-600">ETB {calculateRefundTotal().toLocaleString()}</span>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Akoonka Laga Bixinayo</label>
                                <select
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 outline-none font-bold appearance-none text-slate-700 dark:text-white"
                                    value={refundAccountId}
                                    onChange={e => setRefundAccountId(e.target.value)}
                                    required
                                >
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.balance.toLocaleString()} ETB)</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">{t('notes')}</label>
                                <textarea
                                    required
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 outline-none resize-none font-medium min-h-[100px]"
                                    placeholder={t('notes')}
                                    value={refundReason}
                                    onChange={e => setRefundReason(e.target.value)}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={!!processing}
                                className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {processing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                {t('confirm')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* PASSWORD CONFIRMATION MODAL */}
            {showPasswordPrompt && (
                <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center animate-fade-in">
                    <div className="bg-white dark:bg-[#161B2E] rounded-[2rem] p-8 w-full max-w-sm mx-4 shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Lock className="text-orange-500" size={28} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Password Required</h3>
                            <p className="text-xs text-gray-500 mt-1">Lacag-celinta waxay u baahan tahay admin password-ka</p>
                        </div>
                        <input
                            type="password"
                            value={refundPasswordInput}
                            onChange={e => setRefundPasswordInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && verifyRefundPassword()}
                            className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-orange-500 outline-none font-bold text-center text-lg tracking-widest mb-4"
                            placeholder="••••••••"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowPasswordPrompt(false); setPendingRefundSale(null); }}
                                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold text-sm"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={verifyRefundPassword}
                                disabled={!refundPasswordInput}
                                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm disabled:opacity-50 transition-all"
                            >
                                Xaqiiji
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                .animate-slide-in {
                    animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1E293B;
                }
            `}</style>
        </div>
    );
}
