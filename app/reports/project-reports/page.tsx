'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Layout from '@/components/layouts/Layout';
import { Loader2, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSearchParams } from 'next/navigation';

// Import Types
import { ProjectReportsData, DateFilterType } from '@/components/reports/project-reports/types';

// Import New Components
import { ProjectReportsHeader } from '@/components/reports/project-reports/ProjectReportsHeader';
import { ReportsSummaryStats } from '@/components/reports/project-reports/ReportsSummaryStats';
import { ReportsFilterBar } from '@/components/reports/project-reports/ReportsFilterBar';
import { ProjectsList } from '@/components/reports/project-reports/ProjectsList';

async function exportPDF(data: ProjectReportsData, showDetails: boolean) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const formatCurrency = (value: number) => `${value.toLocaleString()}`;

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

  const renderDocument = (logoDataUrl?: string) => {
    // === Page 1: Executive Summary ===
    const companyName = data.companyName || 'MAGACA SHIRKADDA';
    const reportTitle = 'WARBIXINTA HANTIDA MASHAARIICDA (EXECUTIVE SUMMARY)';
    const dateRange = data.startDate && data.endDate
      ? `${new Date(data.startDate).toLocaleDateString('so-SO')} - ${new Date(data.endDate).toLocaleDateString('so-SO')}`
      : 'Dhammaan Mashaariicda';
    const printDate = new Date().toLocaleString('so-SO');

    // Branding & Header
    doc.setFillColor(15, 23, 42); // Navy Dark
    doc.rect(0, 0, 297, 45, 'F');

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 15, 10, 25, 25, undefined, 'FAST');
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(companyName.toUpperCase(), 50, 22);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(reportTitle, 50, 32);
    doc.text(`Muddo: ${dateRange}`, 282, 22, { align: 'right' });
    doc.text(`La daabacay: ${printDate}`, 282, 32, { align: 'right' });

    // Summary Cards (Big Row)
    const drawBigCard = (x: number, y: number, title: string, value: number, color: [number, number, number], label: string) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, 52, 45, 3, 3, 'FD');
      
      doc.setFillColor(...color);
      doc.rect(x + 5, y + 8, 8, 1, 'F'); // Accent line

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(title, x + 5, y + 15);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(16);
      doc.text(formatCurrency(value), x + 5, y + 28);

      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFontSize(8);
      doc.text(label, x + 5, y + 38);
    };

    let cardY = 60;
    drawBigCard(15, cardY, 'TOTAL REVENUE', data.summary.totalRevenue, [16, 185, 129], 'Dakhliga Guud');
    drawBigCard(70, cardY, 'TOTAL EXPENSES', data.summary.totalExpenses, [239, 68, 68], 'Kharashyada Guud');
    drawBigCard(125, cardY, 'CASH PROFIT', data.summary.totalProfit, [59, 130, 246], 'Faa\'iidada Dhabta ah');
    drawBigCard(180, cardY, 'CONTRACT BALANCE', (data.summary as any).totalRemainingAgreement || 0, [99, 102, 241], 'Daynta Heshiiska');
    drawBigCard(235, cardY, 'CASH DEFICIT', data.summary.totalReceivables, [245, 158, 11], 'Lacagta Maqan');

    // Secondary Summary (Row 2)
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SHIRKADDA XAALADDEEDA GUUD (OPERATIONAL OVERVIEW)', 15, 130);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 133, 282, 133);

    const drawInfoBit = (x: number, y: number, label: string, value: string) => {
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(10);
      doc.text(label, x, y);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(value, x, y + 7);
      doc.setFont('helvetica', 'normal');
    };

    drawInfoBit(15, 145, 'Mashaariicda Guud', data.summary.totalProjects.toString());
    drawInfoBit(70, 145, 'Mashaariicda Socda', (data.summary as any).activeProjects?.toString() || '0');
    drawInfoBit(125, 145, 'Completed', (data.summary as any).completedProjects?.toString() || '0');
    drawInfoBit(180, 145, 'Profit Margin (Avg)', `${data.summary.averageProfitMargin.toFixed(2)}%`);

    // Footer for Page 1
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(`Bogga 1  |  ${companyName} - Warbixinta Mashaariicda`, 148, 200, { align: 'center' });

    // === Page 2: Projects Overview Table ===
    doc.addPage();
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, 297, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FAAHFAAHINTA MASHAARIICDA (DETAILED PROJECT INVENTORY)', 15, 13);

    const projectHeaders = [['Mashruuc', 'Macmiil', 'Xaalad', 'Qiimaha', 'Kharashyada', 'La Bixiyay', 'Haraaga', 'Maqan', 'Margin', '%']];
    const projectRows = data.projects.map(p => [
      p.name,
      p.customer,
      p.status,
      formatCurrency(p.projectValue),
      formatCurrency(p.totalExpenses),
      formatCurrency(p.totalRevenue),
      formatCurrency(p.remainingRevenue),
      p.receivables > 0 ? formatCurrency(p.receivables) : '-',
      formatCurrency(p.grossProfit),
      `${p.profitMargin.toFixed(1)}%`
    ]);

    autoTable(doc, {
      head: projectHeaders,
      body: projectRows,
      startY: 25,
      styles: { fontSize: 8, cellPadding: 3, textColor: 40, lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        3: { halign: 'right', fontStyle: 'bold' },
        4: { halign: 'right' },
        5: { halign: 'right', textColor: [22, 163, 74] },
        6: { halign: 'right', textColor: [225, 29, 72] },
        7: { halign: 'right', textColor: [245, 158, 11], fontStyle: 'bold' },
        8: { halign: 'right' },
        9: { halign: 'right' },
      },
      didDrawPage: (data) => {
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.text(`Bogga ${(doc as any).internal.getNumberOfPages()}  |  Confidential Financial Report`, 148, 205, { align: 'center' });
      }
    });

    // === Detailed Breakdown if requested ===
    if (showDetails && data.projects.length > 0) {
      data.projects.forEach((project) => {
        doc.addPage();

        // Project Health Header
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 297, 25, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(project.name.toUpperCase(), 15, 12);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Macmiil: ${project.customer}  |  Xaalad: ${project.status}  |  Bilowga: ${project.startDate}`, 15, 18);

        // Circular Progress / Health Indicator (Top Right)
        const marginColor: [number, number, number] = project.profitMargin >= 20 ? [22, 163, 74] : project.profitMargin >= 0 ? [59, 130, 246] : [225, 29, 72];
        doc.setFillColor(...marginColor);
        doc.roundedRect(240, 5, 42, 15, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.text('MARGIN', 245, 10);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${project.profitMargin.toFixed(1)}%`, 245, 16);

        let detailY = 40;

        // Key Financial Metrics Grid
        const drawMiniStat = (x: number, y: number, label: string, value: number, isCurrency = true) => {
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text(label.toUpperCase(), x, y);
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(10);
          doc.text(isCurrency ? formatCurrency(value) : value.toString(), x, y + 6);
        };

        drawMiniStat(15, detailY, 'Agreement', project.projectValue);
        drawMiniStat(65, detailY, 'Collected', project.totalRevenue);
        drawMiniStat(115, detailY, 'Spent', project.totalExpenses);
        drawMiniStat(165, detailY, 'Remaining', project.remainingRevenue);
        drawMiniStat(215, detailY, 'Receivables', project.receivables);
        drawMiniStat(255, detailY, 'Current Profit', project.grossProfit);

        doc.setDrawColor(226, 232, 240);
        doc.line(15, detailY + 10, 282, detailY + 10);
        detailY += 20;

        // 1. Group Expenses by Category
        const expensesByCategory: { [key: string]: typeof project.expenses } = {};
        const categoryTotals: { [key: string]: number } = {};

        project.expenses.forEach(e => {
          const cat = e.category || 'Uncategorized';
          if (!expensesByCategory[cat]) expensesByCategory[cat] = [];
          expensesByCategory[cat].push(e);

          categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount);
        });

        const sortedCategories = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a]);

        sortedCategories.forEach(category => {
          if (detailY > 180) {
            doc.addPage();
            detailY = 20;
          }

          doc.setFontSize(10);
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.text(`${category.toUpperCase()}`, 15, detailY);
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`Sub-total: ${formatCurrency(categoryTotals[category])}`, 282, detailY, { align: 'right' });
          detailY += 4;

          const categoryExpenses = expensesByCategory[category];
          let tableHeaders = [['Taariikh', 'Sharaxaad', 'Qiimaha']];
          let tableRows = categoryExpenses.map(e => [
            e.date,
            e.description + (e.materials && Array.isArray(e.materials) ?
              '\n' + e.materials.map((m: any) => `- ${m.name} (${m.quantity} ${m.unit} x ${formatCurrency(m.price)})`).join('\n')
              : ''),
            formatCurrency(e.amount)
          ]);

          if (category === 'Labor') {
            tableHeaders = [['Taariikh', 'Sharaxaad', 'Qofka', 'Qiimaha']];
            tableRows = categoryExpenses.map(e => [
              e.date,
              e.description,
              e.employeeName || e.supplierName || '-',
              formatCurrency(e.amount)
            ]);
          }

          if (category === 'Material') {
            tableHeaders = [['Taariikh', 'Sharaxaad', 'Agabka', 'Qty', 'Unit Price', 'Total']];
            tableRows = [];
            
            // 1. Add Expenses (with potential breakdown)
            categoryExpenses.forEach(e => {
              const description = e.description.replace(/\s-\s\d{4}-\d{2}-\d{2}$/, '');
              if (e.materials && Array.isArray(e.materials) && e.materials.length > 0) {
                e.materials.forEach((m: any, idx: number) => {
                  const qty = Number((m.qty ?? m.quantity) || 0);
                  const price = Number(m.price || 0);
                  const total = qty * price;
                  
                  tableRows.push([
                    idx === 0 ? e.date : '',
                    idx === 0 ? description : '',
                    m.name,
                    `${qty} ${m.unit || ''}`,
                    formatCurrency(price),
                    formatCurrency(total)
                  ]);
                });
              } else {
                // FALLBACK: Use description as name if no breakdown exists
                tableRows.push([
                  e.date,
                  'Material Expense',
                  description,
                  '1',
                  formatCurrency(Number(e.amount)),
                  formatCurrency(Number(e.amount))
                ]);
              }
            });

            // 2. Add ProjectMaterial records (if any)
            if (project.materialsUsed && project.materialsUsed.length > 0) {
              project.materialsUsed.forEach((m: any) => {
                const qty = Number(m.quantityUsed || 0);
                const price = Number(m.costPerUnit || 0);
                const total = qty * price;
                tableRows.push([
                  m.dateUsed ? new Date(m.dateUsed).toISOString().split('T')[0] : '-',
                  'Project Material',
                  m.name,
                  `${qty} ${m.unit || ''}`,
                  formatCurrency(price),
                  formatCurrency(total)
                ]);
              });
            }
          }

          autoTable(doc, {
            startY: detailY,
            head: tableHeaders,
            body: tableRows,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 2, valign: 'middle' },
            headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42] },
            columnStyles: {
              ...(category === 'Labor' ? { 3: { halign: 'right' } } : category === 'Material' ? { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } } : { 2: { halign: 'right' } })
            },
            margin: { left: 15, right: 15 },
          });

          detailY = (doc as any).lastAutoTable.finalY + 10;
        });

        // 3. Payments Table
        if (project.payments.length > 0) {
          if (detailY > 180) {
            doc.addPage();
            detailY = 20;
          }

          doc.setFontSize(10);
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.text('LACAGAHA & DAKHLIGA', 15, detailY);
          detailY += 4;

          const paymentRows = project.payments.map(p => [
            p.date,
            (p as any).description || 'Invoice Payment',
            formatCurrency(p.amount)
          ]);

          autoTable(doc, {
            startY: detailY,
            head: [['Taariikh', 'Sharaxaad', 'Qiimaha']],
            body: paymentRows,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42] },
            columnStyles: { 2: { halign: 'right' } },
            margin: { left: 15, right: 15 },
          });

          detailY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Project Footer
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.text(`Project: ${project.name}  |  Confidential  |  Page ${(doc as any).internal.getNumberOfPages()}`, 148, 205, { align: 'center' });
      });
    }

    doc.save(`Project-Reports-${data.startDate || 'all'}-${data.endDate || 'all'}.pdf`);
  };

  const logoDataUrl = await loadLogoAsDataUrl(data.companyLogoUrl);
  renderDocument(logoDataUrl || undefined);
}

function ProjectReportsContent() {
  const [reportData, setReportData] = useState<ProjectReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('thisYear');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showCustomDateInput, setShowCustomDateInput] = useState(false);

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
        start.setHours(0, 0, 0, 0);
        return { startDate: start.toISOString().split('T')[0], endDate };
      }
      case 'lastMonth': {
        const start = new Date(today);
        start.setMonth(start.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        return { startDate: start.toISOString().split('T')[0], endDate };
      }
      case 'lastTwoMonths': {
        const start = new Date(today);
        start.setMonth(start.getMonth() - 2);
        start.setHours(0, 0, 0, 0);
        return { startDate: start.toISOString().split('T')[0], endDate };
      }
      case 'thisYear': {
        const start = new Date(today.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
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
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
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
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
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
          <button onClick={() => window.location.reload()} className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Reload
          </button>
        </div>
      </Layout>
    );
  }

  if (!reportData) return null;

  const { startDate, endDate } = getDateRange(dateFilter);
  const dateRangeText = startDate && endDate
    ? `${new Date(startDate).toLocaleDateString('so-SO')} - ${new Date(endDate).toLocaleDateString('so-SO')}`
    : 'Dhammaan Mashaariicda';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto pb-8 print:max-w-full pt-6 print:pt-0">

        <ProjectReportsHeader
          data={reportData}
          dateRangeText={dateRangeText}
          loading={loading}
          onExportPDF={() => {
            // Recalculate summary if filtered
            const projectsForExport = visibleProjects.length > 0 ? visibleProjects : reportData.projects;
            const exportSummary = projectsForExport.reduce(
              (acc, p) => {
                acc.totalRevenue += p.totalRevenue;
                acc.totalExpenses += p.totalExpenses;
                // Summary Profit remains Cash-based (Collected - Spent) for consistency with cards
                acc.totalProfit += (p.totalRevenue - p.totalExpenses); 
                if (p.remainingRevenue > 0) acc.totalRemainingAgreement += p.remainingRevenue;
                if ((p.totalRevenue - p.totalExpenses) < 0) acc.totalLosses += Math.abs(p.totalRevenue - p.totalExpenses);
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
                averageProfitMargin:
                  exportSummary.totalRevenue > 0
                    ? (exportSummary.totalProfit / exportSummary.totalRevenue) * 100
                    : 0,
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
        />

        <ProjectsList
          projects={reportData.projects}
          visibleProjects={visibleProjects}
          showDetails={showDetails}
          expandedProjects={expandedProjects}
          toggleProjectExpansion={toggleProjectExpansion}
          loading={loading}
        />

        {/* Print styles */}
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
            .print\\:grid-cols-4 {
              visibility: visible;
            }
            button {
              display: none !important;
            }
            /* Ensure components inside are visible */
            .print\\:block {
                display: block !important;
            }
          }
        `}</style>
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
            <span className="text-xl text-mediumGray">
              Warbixinta mashaariicda ayaa soo dhacaysa...
            </span>
          </div>
        </Layout>
      }
    >
      <ProjectReportsContent />
    </Suspense>
  );
}
