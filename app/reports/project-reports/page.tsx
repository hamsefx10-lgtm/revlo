'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Layout from '../../../components/layouts/Layout';
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
    // === Modern Header Design ===
    const companyName = data.companyName || 'MAGACA SHIRKADDA';
    const reportTitle = 'WARBIXINTA MASHAARIICDA';

    // Header Section (Height ~30mm)
    // Logo (Top Left)
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', 15, 10, 25, 15, undefined, 'FAST');
      } catch {
        // Fallback Logo
        doc.setFillColor(30, 41, 59);
        doc.circle(25, 17, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(companyName.slice(0, 2).toUpperCase(), 25, 19, { align: 'center' });
      }
    }

    // Company & Report Info (Top Right)
    doc.setTextColor(30, 41, 59); // Dark Slate
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(companyName.toUpperCase(), 282, 16, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const dateRange = data.startDate && data.endDate
      ? `${new Date(data.startDate).toLocaleDateString('so-SO')} - ${new Date(data.endDate).toLocaleDateString('so-SO')}`
      : 'Dhammaan Mashaariicda';

    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(reportTitle, 282, 22, { align: 'right' });
    doc.text(`Muddo: ${dateRange}`, 282, 27, { align: 'right' });

    // Decorative Line (Brand Accent)
    doc.setDrawColor(30, 41, 59); // Slate 800 (Or Primary Color check theme)
    doc.setLineWidth(0.5);
    doc.line(15, 32, 282, 32);

    let yPos = 45;

    // === Summary Stats Cards ===
    const drawCard = (x: number, title: string, value: string, sub: string, color: [number, number, number]) => {
      // ... (Keep existing card logic, maybe tweak Y pos if needed)
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, yPos, 60, 28, 2, 2, 'FD');

      // Left Border Strip
      doc.setFillColor(...color);
      doc.rect(x, yPos, 2, 28, 'F');

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), x + 6, yPos + 8);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.text(value, x + 6, yPos + 18);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(sub, x + 6, yPos + 24);
    };

    drawCard(15, 'DAKHLIGA', `${formatCurrency(data.summary.totalRevenue)}`, 'ETB', [16, 185, 129]);
    drawCard(85, 'KHARASHYADA', `${formatCurrency(data.summary.totalExpenses)}`, 'ETB', [239, 68, 68]);
    drawCard(155, 'FAA\'IIDADA', `${formatCurrency(data.summary.totalProfit)}`, 'ETB', [59, 130, 246]);
    drawCard(225, 'MARGIN', `${data.summary.averageProfitMargin.toFixed(2)}%`, 'Average', [99, 102, 241]);

    yPos += 38;

    // === Projects Table ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('FAAHFAAHINTA MASHAARIICDA', 15, yPos);
    yPos += 5;

    // Updated Headers with "Kharashyada", "La Bixiyay", "Dayn"
    const projectHeaders = [['Mashruuc', 'Macmiil', 'Xaalad', 'Qiimaha', 'Kharashyada', 'La Bixiyay', 'Dayn', 'Faa\'iidada', '%']];
    const projectRows = data.projects.map(p => [
      p.name,
      p.customer,
      p.status,
      formatCurrency(p.projectValue),
      formatCurrency(p.totalExpenses),
      formatCurrency(p.totalRevenue), // Paid (Revenue)
      formatCurrency(p.remainingRevenue), // Debt (Remaining)
      formatCurrency(p.grossProfit),
      `${p.profitMargin.toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: projectHeaders,
      body: projectRows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: 60,
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [20, 30, 40], // Darker text for readability
        fontStyle: 'bold',
        lineWidth: 0
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', textColor: [22, 163, 74] }, // Green for Paid
        6: { halign: 'right', textColor: [225, 29, 72] }, // Red for Debt
        7: { halign: 'right', fontStyle: 'bold' }, // Profit
        8: { halign: 'right' }, // Margin
      },
    });

    // === Detailed Breakdown if requested ===
    if (showDetails && data.projects.length > 0) {
      data.projects.forEach((project) => {
        doc.addPage();

        // Project Header
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 297, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(project.name, 15, 12);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${project.customer}  |  ${project.status}`, 200, 12, { align: 'right' });

        let detailY = 30;

        // Stats row
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Wadarta Mashruuca: ${formatCurrency(project.projectValue)}`, 15, detailY);
        doc.text(`Dakhliga: ${formatCurrency(project.totalRevenue)}`, 85, detailY);
        doc.text(`Kharashka: ${formatCurrency(project.totalExpenses)}`, 155, detailY);
        doc.text(`Faa'iidada: ${formatCurrency(project.grossProfit)}`, 225, detailY);

        // Draw a line
        doc.setDrawColor(200);
        doc.line(15, detailY + 3, 282, detailY + 3);
        detailY += 10;

        // 1. Group Expenses by Category
        const expensesByCategory: { [key: string]: typeof project.expenses } = {};
        const categoryTotals: { [key: string]: number } = {};

        project.expenses.forEach(e => {
          const cat = e.category || 'Uncategorized';
          if (!expensesByCategory[cat]) expensesByCategory[cat] = [];
          expensesByCategory[cat].push(e);

          categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount);
        });

        // Sort categories by Total Amount Descending
        const sortedCategories = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a]);

        // 2. Iterate Categories and Render Tables
        sortedCategories.forEach(category => {
          // Check if we need a new page
          if (detailY > 180) {
            doc.addPage();
            detailY = 20;
          }

          doc.setFontSize(11);
          doc.setTextColor(30, 41, 59);
          doc.setFont('helvetica', 'bold');
          // Category Header with Total
          doc.text(`${category} (Wadarta: ${formatCurrency(categoryTotals[category])})`, 15, detailY);
          detailY += 4;

          const categoryExpenses = expensesByCategory[category];
          // Headers and Rows Configuration based on Category
          let tableHeaders = [['Taariikh', 'Sharaxaad', 'Qiimaha']]; // Default
          let tableRows = categoryExpenses.map(e => [
            e.date,
            // For Material, parse detailed items if description contains them or handled differently
            // The original code handled sub-items by appending them to description text
            // We will keep similar logic of appending details to description column
            e.description + (e.materials && Array.isArray(e.materials) ?
              '\n' + e.materials.map((m: any) => `- ${m.name} (${m.quantity} ${m.unit} x ${formatCurrency(m.price)})`).join('\n')
              : ''),
            formatCurrency(e.amount)
          ]);

          // Custom Configuration for LABOR
          if (category === 'Labor') {
            tableHeaders = [['Taariikh', 'Sharaxaad', 'Qofka', 'Qiimaha']];
            tableRows = categoryExpenses.map(e => [
              e.date,
              e.description,
              e.employeeName || e.supplierName || '-', // Show Employee or Supplier Name
              formatCurrency(e.amount)
            ]);
          }

          // Custom Configuration for MATERIAL
          if (category === 'Material') {
            tableHeaders = [['Taariikh', 'Sharaxaad', 'Faahfaahinta Agabka', 'Qiimaha']];
            tableRows = categoryExpenses.map(e => [
              e.date,
              e.description.replace(/\s-\s\d{4}-\d{2}-\d{2}$/, ''), // Clean description
              // Parse materials for detailed column
              (e.materials && Array.isArray(e.materials) ?
                e.materials.map((m: any) => `• ${m.name}\n   (${m.quantity} ${m.unit} x ${formatCurrency(m.price)})`).join('\n\n')
                : '-'),
              formatCurrency(e.amount)
            ]);
          }

          autoTable(doc, {
            startY: detailY,
            head: tableHeaders,
            body: tableRows,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
            headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105] },
            columnStyles: {
              // Dynamic styles based on category
              ...(category === 'Labor' ? {
                0: { cellWidth: 25 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 40 },
                3: { halign: 'right', cellWidth: 30 },
              } : category === 'Material' ? {
                0: { cellWidth: 25 },
                1: { cellWidth: 40 },
                2: { cellWidth: 'auto' }, // Details column gets clear space
                3: { halign: 'right', cellWidth: 30 },
              } : {
                0: { cellWidth: 25 },
                1: { cellWidth: 'auto' },
                2: { halign: 'right', cellWidth: 40 },
              })
            },
            margin: { left: 15, right: 15 },
          });

          detailY = (doc as any).lastAutoTable.finalY + 10;
        });

        // 3. Payments Table (Combined with Income transactions)
        if (project.payments.length > 0) {
          // Check page break
          if (detailY > 180) {
            doc.addPage();
            detailY = 20;
          }

          doc.setFontSize(11);
          doc.setTextColor(30, 41, 59);
          doc.setFont('helvetica', 'bold');
          doc.text('Lacagaha & Dakhliga', 15, detailY);
          detailY += 4;

          const paymentRows = project.payments.map(p => [
            p.date,
            // p.description can be handled if we extended the type in API or filtered description
            // But in the new API we populate description
            (p as any).description || 'Invoice Payment',
            formatCurrency(p.amount)
          ]);

          autoTable(doc, {
            startY: detailY,
            head: [['Taariikh', 'Sharaxaad', 'Qiimaha']],
            body: paymentRows,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105] },
            columnStyles: { 2: { halign: 'right' } },
            margin: { left: 15, right: 15 },
          });

          detailY = (doc as any).lastAutoTable.finalY + 10;
        }
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
        const url = `/api/accounting/reports/projects?${startDate ? `startDate=${startDate}&` : ''}${endDate ? `endDate=${endDate}` : ''}`;

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
                acc.totalProfit += p.grossProfit;
                return acc;
              },
              { totalRevenue: 0, totalExpenses: 0, totalProfit: 0 }
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
