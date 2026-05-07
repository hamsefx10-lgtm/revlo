'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Layout from '@/components/layouts/Layout';
import { Loader2, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSearchParams } from 'next/navigation';

import { ProjectReportsData, DateFilterType } from '@/components/reports/project-reports/types';
import { ProjectReportsHeader } from '@/components/reports/project-reports/ProjectReportsHeader';
import { ReportsSummaryStats } from '@/components/reports/project-reports/ReportsSummaryStats';
import { ReportsFilterBar } from '@/components/reports/project-reports/ReportsFilterBar';
import { ProjectsList } from '@/components/reports/project-reports/ProjectsList';

async function exportPDF(data: ProjectReportsData, showDetails: boolean) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const formatCurrency = (value: number) => `${value.toLocaleString()} ETB`;
  const pageW = 297;
  const marginL = 14;
  const marginR = 283;

  const loadLogoAsDataUrl = async (logoUrl?: string | null) => {
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

  const renderDocument = (logoDataUrl?: string, watermarkDataUrl?: string) => {
    const companyName = data.companyName || 'MAGACA SHIRKADDA';
    const dateRange = data.startDate && data.endDate
      ? `${new Date(data.startDate).toLocaleDateString('so-SO')} - ${new Date(data.endDate).toLocaleDateString('so-SO')}`
      : 'Dhammaan Mashaariicda';

    let yPos = 45;

    // ========== HEADER (Daily Reports Style) ==========
    if (logoDataUrl) {
      try { doc.addImage(logoDataUrl, 'PNG', marginL, 12, 28, 28, undefined, 'FAST'); } catch {}
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(0, 0, 0);
    doc.text(companyName, 46, 26);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 120);
    doc.text('Warbixinta Mashaariicda • Project Financial Report', 46, 34);

    // Meta
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('DATE', 200, 18);
    doc.setFont('helvetica', 'normal');
    doc.text(dateRange, 220, 18);
    doc.setFont('helvetica', 'bold');
    doc.text('GENERATED', 200, 24);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString(), 220, 24);

    // ========== HELPER: Render Table (Daily Reports Style) ==========
    const renderTable = (
      title: string,
      head: string[][],
      body: (string | number)[][],
      options: { totalLabel?: string; totalValue?: string; totalColor?: [number, number, number] } = {}
    ) => {
      if (!body.length) return;
      yPos += 5;
      if (yPos > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); yPos = 20; }

      // Section title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(title, marginL, yPos);
      yPos += 5;
      doc.setLineWidth(0.2);
      doc.setDrawColor(200, 200, 200);
      doc.line(marginL, yPos, marginR, yPos);
      yPos += 2;

      const upperHead = head.map(row => row.map(cell => typeof cell === 'string' ? cell.toUpperCase() : cell));

      // Detect which rows are TOTAL rows
      const totalRowIndices = new Set<number>();
      body.forEach((row, idx) => {
        const hasTotal = row.some(cell => typeof cell === 'string' && cell.includes('TOTAL'));
        if (hasTotal) totalRowIndices.add(idx);
      });

      autoTable(doc, {
        startY: yPos,
        head: upperHead,
        body,
        theme: 'plain',
        pageBreak: 'avoid',
        rowPageBreak: 'avoid',
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [30, 41, 59],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: { top: 3, bottom: 2, left: 1, right: 1 },
          lineColor: [200, 200, 200],
          lineWidth: { bottom: 0.5 }
        },
        bodyStyles: {
          textColor: [50, 60, 70],
          fontSize: 8,
          cellPadding: { top: 3, bottom: 3, left: 1, right: 1 },
        },
        columnStyles: { [head[0].length - 1]: { halign: 'right' } },
        margin: { left: marginL, right: marginL },
        didDrawCell: (hookData) => {
          if (hookData.section === 'body') {
            const isTotal = totalRowIndices.has(hookData.row.index);
            if (isTotal) {
              // Draw strong top border for total rows
              doc.setDrawColor(30, 41, 59);
              doc.setLineWidth(0.6);
              doc.line(hookData.cell.x, hookData.cell.y, hookData.cell.x + hookData.cell.width, hookData.cell.y);
              // Draw bottom border
              doc.setLineWidth(0.3);
              doc.line(hookData.cell.x, hookData.cell.y + hookData.cell.height, hookData.cell.x + hookData.cell.width, hookData.cell.y + hookData.cell.height);
            } else {
              // Light separator for normal rows
              doc.setDrawColor(235, 235, 235);
              doc.setLineWidth(0.1);
              doc.line(hookData.cell.x, hookData.cell.y + hookData.cell.height, hookData.cell.x + hookData.cell.width, hookData.cell.y + hookData.cell.height);
            }
          }
        },
        didParseCell: (hookData) => {
          if (hookData.section === 'body') {
            const isTotal = totalRowIndices.has(hookData.row.index);
            if (isTotal) {
              // TOTAL rows: bold, bigger font, dark background
              hookData.cell.styles.fontStyle = 'bold';
              hookData.cell.styles.fontSize = 9.5;
              hookData.cell.styles.textColor = [15, 23, 42];
              hookData.cell.styles.fillColor = [243, 244, 246]; // gray-100
              hookData.cell.styles.cellPadding = { top: 4, bottom: 4, left: 1, right: 1 };
            }
            // Right-align currency values
            if (typeof hookData.cell.raw === 'string') {
              const val = hookData.cell.raw.trim();
              if (/[\d,.]+\s*ETB$/.test(val)) hookData.cell.styles.halign = 'right';
            }
          }
        }
      });

      if (options.totalLabel && options.totalValue) {
        const finalY = (doc as any).lastAutoTable.finalY + 2;
        // Draw double line above grand total
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.8);
        doc.line(marginL, finalY, marginR, finalY);
        doc.setLineWidth(0.3);
        doc.line(marginL, finalY + 1.5, marginR, finalY + 1.5);
        // Grand total background
        const totalY = finalY + 5;
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(marginL, totalY - 5, marginR - marginL, 9, 1, 1, 'F');
        // Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(200, 200, 200);
        doc.text(options.totalLabel.toUpperCase(), marginL + 4, totalY);
        // Value
        if (options.totalColor) doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text(options.totalValue, marginR - 4, totalY, { align: 'right' });
        yPos = totalY + 14;
      } else {
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
    };


    // ========== PAGE 1: FINANCIAL SUMMARY (Waterfall) ==========
    const s = data.summary;
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.5);
    doc.line(marginL, yPos, marginR, yPos);
    yPos += 7;

    // Summary header
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(marginL - 2, yPos - 2, marginR - marginL + 4, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('XAALADDA DHAQAALE EE MASHAARIICDA (PROJECT FINANCIAL OVERVIEW)', marginL + 2, yPos + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(`${data.projects.length} Mashruuc`, marginR, yPos + 4.5, { align: 'right' });
    yPos += 18;

    const drawSummaryRow = (label: string, value: number, type: 'in' | 'out' | 'neutral' | 'total') => {
      if (type === 'total') {
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.8);
        doc.line(marginL, yPos - 3, marginR, yPos - 3);
        doc.setLineWidth(0.3);
        doc.line(marginL, yPos - 1, marginR, yPos - 1);
      }
      const isTotal = type === 'total';
      doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
      doc.setFontSize(isTotal ? 10 : 9);
      const color: [number, number, number] = type === 'in' ? [22, 163, 74] : type === 'out' ? [220, 38, 38] : type === 'total' ? (value >= 0 ? [22, 163, 74] : [220, 38, 38]) : [50, 50, 50];
      doc.setTextColor(...color);
      doc.text(label, type === 'neutral' || type === 'total' ? marginL : marginL + 6, yPos);
      const sign = type === 'in' ? '+ ' : type === 'out' ? '- ' : '';
      doc.text(`${sign}${formatCurrency(Math.abs(value))}`, marginR, yPos, { align: 'right' });
      yPos += isTotal ? 8 : 7;
    };

    doc.setTextColor(15, 23, 42);
    drawSummaryRow(`Wadarta Qiimaha Heshiisyada (Total Agreement Value)`, s.totalProjectValue, 'neutral');
    yPos += 1;
    if (s.totalRevenue > 0) drawSummaryRow('  Dakhliga La Helay (Revenue Collected)', s.totalRevenue, 'in');
    if (s.totalExpenses > 0) drawSummaryRow('  Kharashyada Guud (Total Expenses)', s.totalExpenses, 'out');
    yPos += 1;
    drawSummaryRow(`Faa'iidada Dhabta ah (Net Profit)`, s.totalProfit, 'total');

    if ((s.totalRemainingAgreement || 0) > 0 || (s.totalReceivables || 0) > 0) {
      yPos += 2;
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
      doc.text(`Daynta Macmiilka (Wali La Haysto): ${formatCurrency(s.totalReceivables)}`, marginL, yPos);
    }
    yPos += 12;

    // ========== PROJECTS OVERVIEW TABLE ==========
    renderTable(
      'Mashaariicda Oo Dhan',
      [['Mashruuc', 'Macmiil', 'Xaalad', 'Qiimaha', 'Kharashka', 'La Helay', 'Haraaga', "Faa'iida", '%']],
      data.projects.map(p => [
        p.name, p.customer, p.status,
        formatCurrency(p.projectValue), formatCurrency(p.totalExpenses),
        formatCurrency(p.totalRevenue), formatCurrency(p.remainingRevenue),
        formatCurrency(p.grossProfit), `${p.profitMargin.toFixed(1)}%`
      ])
    );

    // ========== DETAILED BREAKDOWN PER PROJECT ==========
    if (showDetails && data.projects.length > 0) {
      data.projects.forEach((project) => {
        doc.addPage();
        yPos = 20;

        // Project Header
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(marginL - 2, 8, marginR - marginL + 4, 10, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(project.name.toUpperCase(), marginL + 2, 14.5);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Macmiil: ${project.customer}  |  Xaalad: ${project.status}  |  Bilowga: ${project.startDate}`, marginR, 14.5, { align: 'right' });

        // Project Waterfall
        yPos += 5;
        const drawPRow = (label: string, value: number, type: 'in' | 'out' | 'neutral' | 'total') => {
          if (type === 'total') {
            doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2); doc.line(marginL, yPos - 2, marginR, yPos - 2);
          }
          const isTotal = type === 'total';
          doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
          doc.setFontSize(isTotal ? 10 : 9);
          const c: [number, number, number] = type === 'in' ? [22, 163, 74] : type === 'out' ? [220, 38, 38] : type === 'total' ? (value >= 0 ? [22, 163, 74] : [220, 38, 38]) : [50, 50, 50];
          doc.setTextColor(...c);
          doc.text(label, marginL + (type === 'neutral' || type === 'total' ? 0 : 4), yPos);
          const sign = type === 'in' ? '+ ' : type === 'out' ? '- ' : '';
          doc.text(`${sign}${formatCurrency(Math.abs(value))}`, marginR, yPos, { align: 'right' });
          yPos += isTotal ? 8 : 6;
        };

        drawPRow('Qiimaha Heshiiska (Agreement)', project.projectValue, 'neutral');
        if (project.totalRevenue > 0) drawPRow('Lacagta la helay (Collected)', project.totalRevenue, 'in');
        if (project.totalExpenses > 0) drawPRow('Kharashyada (Expenses)', project.totalExpenses, 'out');
        if (project.remainingRevenue > 0) drawPRow('Haraaga (Remaining)', project.remainingRevenue, 'out');
        drawPRow("Faa'iidada (Cash Profit)", project.grossProfit, 'total');
        yPos += 4;

        // Expenses by category (exclude Labor — shown separately in labor breakdown)
        const cats = Object.keys(project.expensesByCategory || {}).filter(c => c !== 'Labor');
        cats.forEach(cat => {
          const items = project.expensesByCategory[cat];
          if (!items || !items.length) return;
          const catTotal = items.reduce((s, e) => s + e.amount, 0);

          if (cat === 'Material') {
            // Material with full breakdown
            const materialRows: (string | number)[][] = [];
            items.forEach(e => {
              const desc = e.description.replace(/\s-\s\d{4}-\d{2}-\d{2}$/, '');
              if (e.materials && Array.isArray(e.materials) && e.materials.length > 0) {
                e.materials.forEach((m: any, mi: number) => {
                  const qty = Number(m.qty ?? m.quantity ?? 0);
                  const price = Number(m.price ?? 0);
                  materialRows.push([
                    mi === 0 ? e.date : '', mi === 0 ? desc : '',
                    m.name, `${qty} ${m.unit || ''}`, formatCurrency(price), formatCurrency(qty * price)
                  ]);
                });
              } else {
                materialRows.push([e.date, desc, '-', '1', formatCurrency(e.amount), formatCurrency(e.amount)]);
              }
            });
            renderTable(cat, [['Taariikh', 'Sharaxaad', 'Agabka', 'Qty', 'Unit Price', 'Total']], materialRows,
              { totalLabel: `Total ${cat}`, totalValue: formatCurrency(catTotal), totalColor: [220, 38, 38] });
          } else {
            renderTable(cat, [['Taariikh', 'Sharaxaad', 'Shaqaale/Vendor', 'Qiimaha']],
              items.map(e => [e.date, e.description.replace(/\s-\s\d{4}-\d{2}-\d{2}$/, ''), e.employeeName || '-', formatCurrency(e.amount)]),
              { totalLabel: `Total ${cat}`, totalValue: formatCurrency(catTotal), totalColor: [220, 38, 38] });
          }
        });

        // Labor Breakdown (by employee)
        if (project.laborBreakdown && project.laborBreakdown.length > 0) {
          const laborRows: (string | number)[][] = [];
          project.laborBreakdown.forEach(emp => {
            emp.items.forEach((item, idx) => {
              laborRows.push([
                idx === 0 ? emp.employeeName : '',
                item.date,
                item.description.replace(/\s-\s\d{4}-\d{2}-\d{2}$/, ''),
                item.accountName || '-',
                formatCurrency(item.amount)
              ]);
            });
            // Sub-total row for employee
            laborRows.push(['', '', '', `${emp.employeeName} TOTAL`, formatCurrency(emp.totalPaid)]);
          });
          const laborTotal = project.laborBreakdown.reduce((s, e) => s + e.totalPaid, 0);
          renderTable('Shaqaalaha (Labor)', [['Shaqaale', 'Taariikh', 'Sharaxaad', 'Account', 'Qiimaha']], laborRows,
            { totalLabel: 'Total Labor', totalValue: formatCurrency(laborTotal), totalColor: [220, 38, 38] });
        }

        // Materials Used
        if (project.materialsUsed && project.materialsUsed.length > 0) {
          renderTable('Agabka La Isticmaalay', [['Magaca', 'Tirada', 'Unit Price', 'Hadhay', 'Wadarta']],
            project.materialsUsed.map(m => [m.name, `${m.quantityUsed} ${m.unit}`, formatCurrency(m.costPerUnit), `${m.leftoverQty} ${m.unit}`, formatCurrency(m.totalCost)])
          );
        }

        // Payments
        if (project.payments.length > 0) {
          renderTable('Lacagaha La Helay (Income)', [['Taariikh', 'Macmiil', 'Sharaxaad', 'Account', 'Qiimaha']],
            project.payments.map(p => [p.date, p.customerName || '-', p.description || 'Payment', p.accountName || '-', formatCurrency(p.amount)]),
            { totalLabel: 'Total Collected', totalValue: formatCurrency(project.totalRevenue), totalColor: [22, 163, 74] }
          );
        }

        // Footer per project
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.text(`Project: ${project.name}  |  Confidential`, 148, 200, { align: 'center' });
      });
    }

    // Page numbers & footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      if (watermarkDataUrl) {
        (doc as any).setGState(new (doc as any).GState({ opacity: 0.04 }));
        doc.addImage(watermarkDataUrl, 'PNG', 80, 60, 140, 140, undefined, 'FAST');
        (doc as any).setGState(new (doc as any).GState({ opacity: 1.0 }));
      }
      const ph = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on ${new Date().toLocaleString()}`, marginL, ph - 8);
      doc.text(`Page ${i} of ${pageCount}`, 148, ph - 8, { align: 'center' });
      doc.text('Powered by Revlo', marginR, ph - 8, { align: 'right' });
    }

    doc.save(`Project-Reports-${data.startDate || 'all'}-${data.endDate || 'all'}.pdf`);
  };

  const logoDataUrl = await loadLogoAsDataUrl(data.companyLogoUrl);
  renderDocument(logoDataUrl || undefined, logoDataUrl || undefined);
}


function ProjectReportsContent() {
  const [reportData, setReportData] = useState<ProjectReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showDetails, setShowDetails] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showCustomDateInput, setShowCustomDateInput] = useState(false);
  const [expandAll, setExpandAll] = useState(false);

  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('projectId');
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>(initialProjectId || 'all');

  const getDateRange = (filter: DateFilterType): { startDate: string; endDate: string } => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const endDate = today.toISOString().split('T')[0];

    switch (filter) {
      case 'lastWeek': {
        const start = new Date(today);
        start.setDate(start.getDate() - 7);
        return { startDate: start.toISOString().split('T')[0], endDate };
      }
      case 'lastMonth': {
        const start = new Date(today);
        start.setMonth(start.getMonth() - 1);
        return { startDate: start.toISOString().split('T')[0], endDate };
      }
      case 'lastTwoMonths': {
        const start = new Date(today);
        start.setMonth(start.getMonth() - 2);
        return { startDate: start.toISOString().split('T')[0], endDate };
      }
      case 'thisYear': {
        const start = new Date(today.getFullYear(), 0, 1);
        return { startDate: start.toISOString().split('T')[0], endDate };
      }
      case 'custom': {
        return {
          startDate: customStartDate || new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
          endDate: customEndDate || endDate,
        };
      }
      default:
        return { startDate: '', endDate: '' };
    }
  };

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError('');
      try {
        const { startDate, endDate } = getDateRange(dateFilter);
        const url = `/api/projects/accounting/reports/projects?${startDate ? `startDate=${startDate}&` : ''}${endDate ? `endDate=${endDate}` : ''}`;

        const res = await fetch(url, {
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });

        if (!res.ok) throw new Error('Xogta lama helin');
        const data: ProjectReportsData = await res.json();
        setReportData(data);
      } catch (err) {
        setError('Cilad ayaa dhacday ama xog lama helin.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [dateFilter, customStartDate, customEndDate]);

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) newExpanded.delete(projectId);
    else newExpanded.add(projectId);
    setExpandedProjects(newExpanded);
  };

  const handleToggleExpandAll = () => {
    if (!reportData) return;
    if (expandAll) {
      setExpandedProjects(new Set());
      setExpandAll(false);
    } else {
      setExpandedProjects(new Set(reportData.projects.map(p => p.id)));
      setExpandAll(true);
    }
  };

  const visibleProjects = useMemo(() => {
    if (!reportData) return [];
    if (!selectedProjectId || selectedProjectId === 'all') return reportData.projects;
    return reportData.projects.filter(p => p.id === selectedProjectId);
  }, [reportData, selectedProjectId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} />
          <span className="text-xl text-mediumGray">Warbixinta ayaa soo dhacaya...</span>
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
          <button onClick={() => window.location.reload()} className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Reload</button>
        </div>
      </Layout>
    );
  }

  if (!reportData) return null;

  const { startDate, endDate } = getDateRange(dateFilter);
  const dateRangeText = startDate && endDate
    ? `${new Date(startDate).toLocaleDateString('so-SO')} - ${new Date(endDate).toLocaleDateString('so-SO')}`
    : 'Dhammaan Wakhtiga';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto pb-8 print:max-w-full pt-6 print:pt-0 px-4">

        <ProjectReportsHeader
          data={reportData}
          dateRangeText={dateRangeText}
          loading={loading}
          onExportPDF={() => {
            const projectsForExport = visibleProjects.length > 0 ? visibleProjects : reportData.projects;
            const exportSummary = projectsForExport.reduce(
              (acc, p) => {
                acc.totalRevenue += p.totalRevenue;
                acc.totalExpenses += p.totalExpenses;
                acc.totalProfit += (p.totalRevenue - p.totalExpenses);
                if (p.remainingRevenue > 0) acc.totalRemainingAgreement += p.remainingRevenue;
                acc.totalReceivables += p.receivables;
                acc.totalProjectValue += p.projectValue;
                return acc;
              },
              { totalRevenue: 0, totalExpenses: 0, totalProfit: 0, totalRemainingAgreement: 0, totalLosses: 0, totalReceivables: 0, totalProjectValue: 0 }
            );

            const dataForExport: ProjectReportsData = {
              ...reportData,
              projects: projectsForExport,
              summary: {
                ...reportData.summary,
                totalProjects: projectsForExport.length,
                totalRevenue: exportSummary.totalRevenue,
                totalExpenses: exportSummary.totalExpenses,
                totalProfit: exportSummary.totalProfit,
                totalRemainingAgreement: exportSummary.totalRemainingAgreement,
                totalLosses: exportSummary.totalLosses,
                totalReceivables: exportSummary.totalReceivables,
                totalProjectValue: exportSummary.totalProjectValue,
                averageProfitMargin: exportSummary.totalRevenue > 0 ? (exportSummary.totalProfit / exportSummary.totalRevenue) * 100 : 0,
              },
            };
            exportPDF(dataForExport, showDetails);
          }}
          onPrint={() => window.print()}
        />

        <ReportsSummaryStats summary={reportData.summary} />

        <ReportsFilterBar
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          showDetails={showDetails}
          setShowDetails={setShowDetails}
          selectedProjectId={selectedProjectId}
          setSelectedProjectId={setSelectedProjectId}
          projects={reportData.projects}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          showCustomDateInput={showCustomDateInput}
          setShowCustomDateInput={setShowCustomDateInput}
          expandAll={expandAll}
          onToggleExpandAll={handleToggleExpandAll}
        />

        <ProjectsList
          projects={reportData.projects}
          visibleProjects={visibleProjects}
          showDetails={showDetails}
          expandedProjects={expandedProjects}
          toggleProjectExpansion={toggleProjectExpansion}
          loading={loading}
        />
      </div>
    </Layout>
  );
}

export default function ProjectReportsPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin mr-3 text-primary" size={32} />
            <span className="text-xl text-mediumGray">Warbixinta mashaariicda ayaa soo dhacaysa...</span>
          </div>
        </Layout>
      }
    >
      <ProjectReportsContent />
    </Suspense>
  );
}
