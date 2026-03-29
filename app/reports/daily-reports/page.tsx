
// app/reports/daily-reports/page.tsx - Daily Report Page (Refined Professional Design)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import {
  Download, Printer, Loader2, TrendingUp, TrendingDown, DollarSign,
  Receipt, FileText, XCircle, Wallet, Calendar, HelpCircle, X,
  HardDrive, Edit, ChevronLeft, ChevronRight, Clock, RefreshCcw
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types for report data
interface DailyReport {
  date: string;
  companyName?: string;
  companyLogoUrl?: string;
  preparedBy?: string;
  balances: {
    previous: Record<string, number>;
    today: Record<string, number>;
  };
  totalPrev: number;
  totalToday: number;  // Summary aggregates
  income: number;
  pureIncome: number;
  totalDebtCollected: number;
  totalLoansReceived: number;
  incomeTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    account: string;
    project: string | null;
    customer: string | null;
    note: string | null;
    transactionDate: string;
  }>;
  transfers: Array<{
    id: string;
    description: string;
    amount: number;
    fromAccount: string;
    toAccount: string;
    transactionDate: string;
    note: string | null;
    type: string;
  }>;
  projectExpenses: Array<{
    id: string;
    date: string;
    project: string;
    category: string;
    description: string;
    amount: number;
    subCategory?: string | null;
    note?: string | null;
    paidFrom?: string;
    employeeName?: string | null;
    vendorName?: string | null;
    details?: string | null;
  }>;
  companyExpenses: Array<{
    id: string;
    date: string;
    project: string;
    category: string;
    description: string;
    amount: number;
    subCategory?: string | null;
    note?: string | null;
    paidFrom?: string;
    employeeName?: string | null;
    vendorName?: string | null;
    details?: string | null;
  }>;
  pureCompanyExpenses: number;
  totalBankCommissions: number;
  totalProjectExpenses: number;
  totalCompanyExpenses: number;
  totalExpenses: number;
  fixedAssets?: Array<{
    id: string;
    name: string;
    type: string;
    value: number;
    purchaseDate: string;
    vendor: string | null;
    assignedTo: string | null;
  }>;
  totalFixedAssets?: number;
  totalDebtsTaken?: number;
  totalDebtsRepaid?: number;
  totalTransfersOut?: number;
  debtsTaken?: Array<{
    id: string;
    description?: string;
    amount: number;
    account?: string;
    project?: string | null;
    customerName?: string | null;
    vendorName?: string | null;
    employeeName?: string | null;
    note?: string | null;
  }>;
  debtsRepaid?: Array<{
    id: string;
    description?: string;
    amount: number;
    account?: string;
    project?: string | null;
    customerName?: string | null;
    vendorName?: string | null;
    employeeName?: string | null;
    note?: string | null;
  }>;
}

async function exportPDF(data: DailyReport) {
  const doc = new jsPDF();
  const formatCurrency = (value: number) => `${value.toLocaleString()} ETB`;

  const loadLogoAsDataUrl = async (logoUrl?: string) => {
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

  const loadWatermarkAsDataUrl = async (logoUrl?: string) => {
    if (!logoUrl) return null;
    try {
      return await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // The user wants the text part of the logo for the watermark, not the top icon.
          // The exact crop depends on the image, let's just use the whole image with low opacity
          // since cropping the bottom text perfectly might be difficult without knowing the exact pixel layout.
          // Let's use the whole image instead for a more reliable watermark.
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, img.width, img.height);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(img.src); // fallback
          }
        };
        img.onerror = () => reject(new Error('Failed to load image for watermark'));
        img.src = logoUrl;
      });
    } catch (error) {
      console.warn('Unable to load watermark:', error);
      return null;
    }
  };

  const renderDocument = (logoDataUrl?: string, watermarkDataUrl?: string) => {
    // -- HEADER --

    // Logo & Company Info
    if (logoDataUrl) {
      try {
        // Enlarge the main logo significantly as requested
        doc.addImage(logoDataUrl, 'PNG', 14, 12, 28, 28, undefined, 'FAST');
      } catch {
        // fallback
      }
    }

    // Title text styling (Bir + shiil in different colors)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28); // Increased size

    // "Bir" part in Black
    doc.setTextColor(0, 0, 0);
    doc.text('Bir', 46, 26); // Shifted right to accommodate larger logo

    // Hardcoded tightly spaced width to make sure 's' touches 'r'
    const birWidth = 14.5;

    // "shiil" part in darker orange/amber
    doc.setTextColor(242, 154, 40);
    doc.text('shiil', 46 + birWidth, 26); // Shifted right

    // "Daily Financial Report" styled distinctly, smaller, and aligned
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 120);
    doc.text('Daily Financial Report', 46, 34); // Shifted right

    // Meta Data
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const startXMeta = 135;
    const valueXMeta = 165;
    const metaY1 = 18;
    doc.setFont('helvetica', 'bold');
    doc.text('DATE', startXMeta, metaY1);
    doc.setFont('helvetica', 'normal');
    doc.text(data.date, valueXMeta, metaY1);

    const metaY2 = 24;
    doc.setFont('helvetica', 'bold');
    doc.text('REF NUMBER', startXMeta, metaY2);
    doc.setFont('helvetica', 'normal');
    doc.text(`D-${data.date.replace(/-/g, '')}`, valueXMeta, metaY2);

    if (data.preparedBy) {
      const metaY3 = 30;
      doc.setFont('helvetica', 'bold');
      doc.text('PREPARED BY', startXMeta, metaY3);
      doc.setFont('helvetica', 'normal');
      doc.text(data.preparedBy, valueXMeta, metaY3);
    }

    let yPos = 45;

    // Helper for Tables
    const renderTable = (
      title: string,
      head: string[][],
      body: (string | number)[][],
      options: {
        totalLabel?: string;
        totalValue?: string;
        totalColor?: [number, number, number];
        startY?: number;
        didParseCell?: (data: any) => void;
      } = {}
    ) => {
      if (!body.length) return;

      yPos += 5;

      // Prevent orphan titles
      if (yPos > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPos = 20;
      }

      // Draw top horizontal line (Green) only for Account Balances
      if (title === 'Account Balances') {
        doc.setDrawColor(22, 163, 74);
        doc.setLineWidth(0.5);
        doc.line(14, yPos, 196, yPos);
        yPos += 7;
      } else {
        yPos += 2; // small padding instead
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(title, 14, yPos);
      yPos += 5;

      // Draw line below title
      doc.setLineWidth(0.2);
      doc.line(14, yPos, 196, yPos);
      yPos += 2;

      // Ensure the head text is uppercase
      const upperHead = head.map(row => row.map(cell => typeof cell === 'string' ? cell.toUpperCase() : cell));

      autoTable(doc, {
        startY: yPos,
        head: upperHead,
        body,
        theme: 'plain',
        pageBreak: 'avoid',
        // rowPageBreak prevents a single row from awkwardly splitting across pages 
        rowPageBreak: 'avoid',
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [30, 41, 59], // Dark Slate Gray
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: { top: 3, bottom: 2, left: 1, right: 1 },
          lineColor: [200, 200, 200],
          lineWidth: { bottom: 0.5 }
        },
        bodyStyles: {
          textColor: [50, 60, 70],
          fontSize: 8,
          fontStyle: 'normal',
          cellPadding: { top: 3, bottom: 3, left: 1, right: 1 },
        },
        columnStyles: {
          [head[0].length - 1]: { halign: 'right' }
        },
        margin: { left: 14, right: 14 },
        didDrawCell: (hookData) => {
          // Add a very subtle bottom border to every body row
          if (hookData.section === 'body') {
            doc.setDrawColor(240, 240, 240);
            doc.setLineWidth(0.1);
            doc.line(
              hookData.cell.x,
              hookData.cell.y + hookData.cell.height,
              hookData.cell.x + hookData.cell.width,
              hookData.cell.y + hookData.cell.height
            );
          }
        },
        didParseCell: (hookData) => {
          // Right align any cell in the body that actually represents a money amount (ends in ETB)
          // But avoid right-aligning descriptions that just happen to contain numbers.
          if (hookData.section === 'body' && typeof hookData.cell.raw === 'string') {
            const val = hookData.cell.raw.trim();
            // If it's a monetary value, right align.
            if (val.endsWith('ETB') && !val.includes('-')) {
              // We avoid strings with '-' because descriptions often have dates e.g. "Material expense - 2026-03-03"
              // If "208,000 ETB", it ends with ETB and doesn't have a dash (usually).
              hookData.cell.styles.halign = 'right';
            } else if (/^[\d,.\s]+ETB$/.test(val) || /^[\+\-]?[\d,.\s]+ETB$/.test(val) || /^[\+\-]?[\d,.\s]+$/.test(val)) {
              // Strict regex for amount + optional ETB or just amount
              hookData.cell.styles.halign = 'right';
            } else {
              // Explicitly left-align text to fix centering issues for descriptions
              hookData.cell.styles.halign = 'left';
            }
          } else if (hookData.section === 'head') {
            // Head cells default to left unless they are specifically the last column (amount)
            if (hookData.column.index !== head[0].length - 1) {
              hookData.cell.styles.halign = 'left';
            }
          }

          if (options.didParseCell) {
            options.didParseCell(hookData);
          }
        }
      });

      if (options.totalLabel && options.totalValue) {
        const finalY = (doc as any).lastAutoTable.finalY + 4;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);

        // Draw a light box for the total
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(140, finalY - 4, 56, 7, 'F');

        doc.text(options.totalLabel, 150, finalY, { align: 'right' });
        if (options.totalColor) {
          doc.setTextColor(...options.totalColor);
        }
        doc.text(options.totalValue, 196, finalY, { align: 'right' });

        yPos = finalY + 12;
      } else {
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
    };

    // 1. Account Balances
    if (data.balances && Object.keys(data.balances.today).length > 0) {
      const allAccounts = Array.from(new Set([...Object.keys(data.balances.previous || {}), ...Object.keys(data.balances.today || {})]));

      const balanceRows = allAccounts.map(name => {
        const prevBal = data.balances.previous[name] || 0;
        const currBal = data.balances.today[name] || 0;
        const change = currBal - prevBal;
        return [
          name,
          prevBal.toLocaleString(),
          currBal.toLocaleString(),
          (change > 0 ? '+' : '') + change.toLocaleString()
        ];
      });

      renderTable(
        'Account Balances', [['Account', 'Previous Balance', 'Current Balance', 'Change']],
        balanceRows,
        {
          didParseCell: (hookData) => {
            // Apply styles specifically for the Account Balances table
            if (hookData.section === 'body') {
              const rowIndex = hookData.row.index;
              const isTotalRow = rowIndex === balanceRows.length - 1;
              const colIndex = hookData.column.index;

              if (isTotalRow) {
                hookData.cell.styles.fontStyle = 'bold';
              } else {
                hookData.cell.styles.fontStyle = 'normal';
              }

              // Color specific columns (Previous Balance and Current Balance and Change)
              // Only color the values, not the account names. 
              // Based on user: "kuwaana tirooyinka numbarada sii kalaro ku haboon waana qaybta accountska"
              if (colIndex === 1 || colIndex === 2 || colIndex === 3) {
                hookData.cell.styles.textColor = [15, 23, 42]; // slate-900 
                
                // Color the Change column specifically
                if (colIndex === 3) {
                  const val = String(hookData.cell.raw);
                  if (val.startsWith('+')) {
                    hookData.cell.styles.textColor = [22, 163, 74]; // Green
                  } else if (val.startsWith('-')) {
                    hookData.cell.styles.textColor = [220, 38, 38]; // Red
                  }
                }
              }

              // Force right alignment for numeric columns (index 1, 2, 3)
              if (colIndex === 1 || colIndex === 2 || colIndex === 3) {
                hookData.cell.styles.halign = 'right';
              }
            }

            // Align headers for numeric columns to the right as well to match body
            if (hookData.section === 'head') {
              const colIndex = hookData.column.index;
              if (colIndex === 1 || colIndex === 2 || colIndex === 3) {
                hookData.cell.styles.halign = 'right';
              }
            }
          }
        }
      );
    }

    // 2. Income
    if (data.incomeTransactions.length > 0) {
      renderTable(
        'Income Received',
        [['Customer', 'Project', 'Description', 'Account', 'Amount']],
        data.incomeTransactions.map(tx => {
          return [
            tx.customer || '-',
            tx.project || '-',
            tx.description || 'Income',
            tx.account || '-',
            formatCurrency(tx.amount)
          ];
        }),
        {
          totalLabel: 'Total Income',
          totalValue: formatCurrency(data.income),
          totalColor: [22, 163, 74] // Green
        }
      );
    }

    // 3. Project Expenses
    if (data.projectExpenses.length > 0) {
      renderTable(
        'Project Expenses',
        [['Project', 'Category', 'Employee / Vendor', 'Description', 'Amount']],
        data.projectExpenses.map(exp => {
          let entity = exp.employeeName || exp.vendorName || '-';
          let desc = exp.description || 'Project Expense';

          if (exp.details && !exp.details.includes('Shaqaale:')) {
            desc += ` - ${exp.details}`;
          }

          // Strip date securely
          desc = desc.replace(/\s?-?\s*\d{4}-\d{2}-\d{2}$/, '').trim();

          // Simplify description if it includes the employee/vendor name
          if (entity !== '-' && desc.toLowerCase().includes(entity.toLowerCase())) {
            if (exp.category === 'Salary' || exp.category === 'Labor' || desc.toLowerCase().includes('salary')) {
              desc = 'Salary Payment';
            } else {
              // Remove standard prefix and name e.g., "Salary payment for Ahmad" -> "payment for" or just replace name
              desc = desc.replace(new RegExp(`\\s*(for|to)?\\s*${entity}`, 'gi'), '').trim();
            }
          }

          return [
            exp.project || '-',
            exp.category || '-',
            entity,
            desc,
            formatCurrency(exp.amount)
          ];
        }),
        {
          totalLabel: 'Total Project Exp.',
          totalValue: formatCurrency(data.totalProjectExpenses),
          totalColor: [220, 38, 38] // Red
        }
      );
    }

    // 4. Company Expenses
    if (data.companyExpenses.length > 0) {
      renderTable(
        'Company Expenses',
        [['Category', 'Employee / Vendor', 'Description', 'Amount']],
        data.companyExpenses.map(exp => {
          let entity = exp.employeeName || exp.vendorName || '-';
          let desc = exp.description || 'Company Expense';

          if (exp.details && !exp.details.includes('Shaqaale:')) {
            desc += ` - ${exp.details}`;
          }
          // Strip date securely
          desc = desc.replace(/\s?-?\s*\d{4}-\d{2}-\d{2}$/, '').trim();

          // Simplify description if it includes the employee name
          if (entity !== '-' && desc.toLowerCase().includes(entity.toLowerCase())) {
            if (exp.category === 'Salary' || exp.category === 'Company Labor' || desc.toLowerCase().includes('salary')) {
              desc = 'Salary Payment';
            } else {
              // Remove standard prefix and name e.g., "Salary payment for Ahmad" -> "payment for" or just replace name entirely
              desc = desc.replace(new RegExp(`\\s*(for|to)?\\s*${entity}`, 'gi'), '').trim();
            }
          }

          return [
            exp.category || '-',
            entity,
            desc,
            formatCurrency(exp.amount)
          ];
        }),
        {
          totalLabel: 'Total Ops Exp.',
          totalValue: formatCurrency(data.totalCompanyExpenses),
          totalColor: [220, 38, 38] // Red
        }
      );
    }

    // 4b. Fixed Assets Purchased
    if (data.fixedAssets && data.fixedAssets.length > 0) {
      renderTable(
        'Fixed Assets Purchased',
        [['Asset Name', 'Type', 'Vendor', 'Assigned To', 'Value']],
        data.fixedAssets.map(asset => [
          asset.name || '-',
          asset.type || '-',
          asset.vendor || '-',
          asset.assignedTo || '-',
          formatCurrency(asset.value)
        ]),
        {
          totalLabel: 'Total Fixed Assets',
          totalValue: formatCurrency(data.totalFixedAssets || 0),
          totalColor: [234, 88, 12] // Orange
        }
      );
    }

    // 5. Receivables Given
    if (data.debtsTaken && data.debtsTaken.length > 0) {
      renderTable(
        'Receivables Given (Deyn La Siiyay)',
        [['Borrower / Customer', 'Description', 'Account', 'Amount']],
        data.debtsTaken.map(tx => {
          // We cast to any here just for flexibility to pull name fields if present from backend
          let entity = (tx as any).customerName || (tx as any).vendorName || (tx as any).employeeName || '-';
          let desc = tx.note || tx.description || 'Receivable Given';
          desc = desc.replace(/\s?-?\s*\d{4}-\d{2}-\d{2}$/, '').trim();
          if (!desc) desc = 'Receivable Given';
          return [entity, desc, tx.account || '-', formatCurrency(tx.amount)];
        }),
        {
          totalLabel: 'Total Receivables',
          totalValue: formatCurrency(
            data.debtsTaken.reduce((sum, tx) => sum + tx.amount, 0)
          )
        }
      );
    }

    // 6. Debts Repaid
    if (data.debtsRepaid && data.debtsRepaid.length > 0) {
      renderTable(
        'Debts Repaid',
        [['Lender / Customer', 'Description', 'Account', 'Amount']],
        data.debtsRepaid.map(tx => {
          let entity = (tx as any).customerName || (tx as any).vendorName || (tx as any).employeeName || '-';
          let desc = tx.note || tx.description || 'Debt Repaid';
          desc = desc.replace(/\s?-?\s*\d{4}-\d{2}-\d{2}$/, '').trim();
          if (!desc) desc = 'Debt Repaid';
          return [entity, desc, tx.account || '-', formatCurrency(tx.amount)];
        }),
        {
          totalLabel: 'Total Debts Repaid',
          totalValue: formatCurrency(
            data.debtsRepaid.reduce((sum, tx) => sum + tx.amount, 0)
          )
        }
      );
    }


    // 6. Transfers
    if (data.transfers.length > 0) {
      renderTable(
        'Internal Transfers',
        [['From', 'To', 'Description', 'Amount']],
        data.transfers.map(t => [t.fromAccount, t.toAccount, t.description, formatCurrency(t.amount)])
      );
    }

    // -- DETAILED WATERFALL SUMMARY --
    let summaryY = yPos + 8;
    const pageHeightPDF = doc.internal.pageSize.getHeight();

    // Ensure enough space for the full summary (approx 100 units tall)
    if (summaryY > pageHeightPDF - 130) {
      doc.addPage();
      summaryY = 30;
    }

    const openingBal = data.totalPrev ?? 0;
    const closingBal = data.totalToday ?? 0;
    const incomeAmt = data.pureIncome ?? 0;
    const debtColl = data.totalDebtCollected ?? 0;
    const loansRec = data.totalLoansReceived ?? 0;
    const projExp = data.totalProjectExpenses ?? 0;
    const compExp = data.pureCompanyExpenses ?? 0;
    const comms = data.totalBankCommissions ?? 0;
    const fixedAmt = data.totalFixedAssets ?? 0;
    const debtGiven = data.totalDebtsTaken ?? 0;

    const summaryX1 = 14;   // Left label column
    const summaryX2 = 196;  // Right value column

    // Section header background
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(summaryX1 - 2, summaryY - 2, 184, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('DAILY FINANCIAL STATEMENT', summaryX1 + 2, summaryY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(data.date, summaryX2, summaryY + 4.5, { align: 'right' });

    summaryY += 15;

    // Helper to draw a summary row
    const drawRow = (label: string, value: number, isTotal = false, color?: [number, number, number], indent = false, hideSign = false) => {
      if (isTotal) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(summaryX1, summaryY - 2, summaryX2, summaryY - 2);
      }
      doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
      doc.setFontSize(isTotal ? 10 : 9);
      doc.setTextColor(...(color ?? [50, 50, 50] as [number,number,number]));
      const labelX = indent ? summaryX1 + 6 : summaryX1;
      doc.text(label, labelX, summaryY);

      // Prefix sign
      let valStr = formatCurrency(Math.abs(value));
      if (!isTotal && !hideSign) {
        valStr = value >= 0 ? `+ ${valStr}` : `- ${valStr}`;
      }
      doc.text(valStr, summaryX2, summaryY, { align: 'right' });
      summaryY += isTotal ? 8 : 7;
    };

    // Opening balance
    drawRow('Jaban Hore (Opening Balance)', openingBal, false, [15, 23, 42], false, true);
    summaryY += 1;

    // Inflows
    if (incomeAmt > 0) drawRow('  + Dakhli (Income)', incomeAmt, false, [22, 163, 74], true);
    if (debtColl > 0) drawRow('  + Deyn Soo Xarootay (Debt Collected)', debtColl, false, [22, 163, 74], true);
    if (loansRec > 0) drawRow('  + Dayn La Qaaday (Loans Received)', loansRec, false, [22, 163, 74], true);
    
    // Total Inflows Sub-total
    const totalIn = incomeAmt + debtColl + loansRec;
    if (totalIn > 0) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.line(summaryX1 + 6, summaryY - 2, summaryX2, summaryY - 2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('TOTAL INFLOWS', summaryX1 + 6, summaryY + 2);
      doc.text(`+ ${formatCurrency(totalIn)}`, summaryX2, summaryY + 2, { align: 'right' });
      summaryY += 8;
    }

    summaryY += 1;

    // Outflows
    if (projExp > 0) drawRow('  - Mashruuc Kharashyada (Project Exp.)', -projExp, false, [220, 38, 38], true);
    if (compExp > 0) drawRow('  - Shirkad Kharashyada (Company Exp.)', -compExp, false, [220, 38, 38], true);
    if (fixedAmt > 0) drawRow('  - Hantida Joogtada (Fixed Assets)', -fixedAmt, false, [234, 88, 12], true);
    if (comms > 0) drawRow('  - Khidmadaha Bankiga (Bank Commissions)', -comms, false, [234, 88, 12], true);
    if (debtGiven > 0) drawRow('  - Deyn La Siiyay (Receivables Given)', -debtGiven, false, [220, 38, 38], true);
    const debtRepaidVal = data.totalDebtsRepaid ?? 0;
    if (debtRepaidVal > 0) drawRow('  - Deyn La Bixiyay (Debts Repaid)', -debtRepaidVal, false, [220, 38, 38], true);

    // Total Outflows Sub-total
    const totalOut = projExp + compExp + fixedAmt + comms + debtGiven + debtRepaidVal;
    if (totalOut > 0) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.line(summaryX1 + 6, summaryY - 2, summaryX2, summaryY - 2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('TOTAL OUTFLOWS', summaryX1 + 6, summaryY + 2);
      doc.text(`- ${formatCurrency(totalOut)}`, summaryX2, summaryY + 2, { align: 'right' });
      summaryY += 8;
    }

    summaryY += 1;

    // Closing balance (double line)
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.line(summaryX1, summaryY - 3, summaryX2, summaryY - 3);
    doc.setLineWidth(0.3);
    doc.line(summaryX1, summaryY - 1, summaryX2, summaryY - 1);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Jaban Hada (Closing Balance)', summaryX1, summaryY + 5);

    if (closingBal >= 0) {
      doc.setTextColor(22, 163, 74);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.text(formatCurrency(closingBal), summaryX2, summaryY + 5, { align: 'right' });

    // -- Closing separator --
    summaryY += 12;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(summaryX1, summaryY, summaryX2, summaryY);

    // Check if there's enough room on the current page for the signature block
    // We removed the signatures and stamp entirely.

    // Pagination & Watermark Footer Hook
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Watermark
      if (watermarkDataUrl) {
        (doc as any).setGState(new (doc as any).GState({ opacity: 0.05 }));
        // Draw large logo in center
        doc.addImage(watermarkDataUrl, 'PNG', 55, 100, 100, 100, undefined, 'FAST');
        (doc as any).setGState(new (doc as any).GState({ opacity: 1.0 }));
      }

      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on ${new Date().toLocaleString()}`, 14, pageHeight - 10);
      doc.text(`Page ${i} of ${pageCount}`, 105, pageHeight - 10, { align: 'center' });
      doc.text('Powered by Revlo', 196, pageHeight - 10, { align: 'right' });
    }

    doc.save(`daily_report_${data.date}.pdf`);
  };

  const logoDataUrl = await loadLogoAsDataUrl(data.companyLogoUrl);
  const watermarkDataUrl = await loadWatermarkAsDataUrl(data.companyLogoUrl);
  renderDocument(logoDataUrl || undefined, watermarkDataUrl || undefined);
}

export default function DailyReportPage() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isChangingDate, setIsChangingDate] = useState(false);

  const handleDateChange = (newDate: string) => {
    setIsChangingDate(true);
    setSelectedDate(newDate);
    setTimeout(() => setIsChangingDate(false), 500);
  };

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError('');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const res = await fetch(`/api/reports/daily?date=${selectedDate}&t=${Date.now()}`, {
          signal: controller.signal,
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('Failed to fetch data');

        const data: DailyReport = await res.json();
        setReport(data);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err?.message || 'Error occurred');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [selectedDate]);

  if (loading && !report) {
    return (
      <Layout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="animate-spin text-primary mr-3" size={40} />
          <span className="text-xl font-medium text-gray-500">Generating report...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
          <XCircle size={60} className="text-red-500" />
          <h2 className="text-2xl font-bold text-gray-800">Error Loading Report</h2>
          <p className="text-gray-600">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  if (!report) return null;

  const totalExp = report.totalExpenses + (report.totalFixedAssets || 0);
  const netFlow = report.income - totalExp;
  const hasBalances = report.balances && Object.keys(report.balances.today).length > 0;
  const openingBal = report.totalPrev ?? 0;
  const closingBal = report.totalToday ?? 0;

  // Helper: show a waterfall row
  const WRow = ({ label, amount, type }: { label: string; amount: number; type: 'in' | 'out' | 'neutral' | 'total' }) => {
    if (amount === 0) return null;
    const color = type === 'in' ? 'text-green-600 dark:text-green-400'
      : type === 'out' ? 'text-red-500 dark:text-red-400'
      : type === 'total' ? (closingBal >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-600 dark:text-red-400')
      : 'text-gray-700 dark:text-gray-200';
    const sign = type === 'in' ? '+' : type === 'out' ? '−' : '';
    const fontClass = type === 'total' ? 'font-black text-lg' : 'font-semibold text-sm';
    return (
      <div className={`flex justify-between items-center py-1.5 ${type === 'total' ? 'border-t-2 border-gray-800 dark:border-gray-300 mt-2 pt-3' : ''}`}>
        <span className={`text-gray-600 dark:text-gray-300 ${type === 'total' ? 'font-bold text-base' : 'text-sm'}`}>{label}</span>
        <span className={`${fontClass} ${color} tabular-nums`}>{sign} {Math.abs(amount).toLocaleString()} ETB</span>
      </div>
    );
  };

  // --- UI Components ---

  return (
    <Layout>
      <div className="min-h-screen bg-transparent pb-12">
        {/* -- HEADER & CONTROL BAR -- */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-4 md:px-8 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

            {/* Title */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg shadow-blue-500/30">
                <FileText size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">Daily Financial Report</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Ref: D-{report.date.replace(/-/g, '')}</p>
              </div>
            </div>

            {/* Date Pickers & Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  handleDateChange(d.toISOString().split('T')[0]);
                }}
                className="p-2 bg-white dark:bg-gray-800 shadow-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 transition"
                disabled={loading || isChangingDate}
              >
                <ChevronLeft size={18} />
              </button>

              <div className="relative flex-1 md:flex-none">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full md:w-auto pl-9 pr-3 py-1.5 bg-transparent border-none text-sm font-bold text-gray-800 dark:text-white focus:ring-0 text-center"
                />
                <Calendar className="absolute left-2 top-2 text-blue-500 pointer-events-none" size={16} />
              </div>

              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  const tmr = new Date(d);
                  tmr.setDate(d.getDate() + 1);
                  if (tmr <= new Date()) handleDateChange(tmr.toISOString().split('T')[0]);
                }}
                className="p-2 bg-white dark:bg-gray-800 shadow-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                disabled={loading || isChangingDate || selectedDate >= new Date().toISOString().split('T')[0]}
              >
                <ChevronRight size={18} />
              </button>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1 hidden md:block"></div>

              <button
                onClick={() => exportPDF(report)}
                className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition shadow-lg shadow-blue-500/20"
              >
                <Download size={14} /> PDF
              </button>

              <button
                onClick={() => exportPDF(report)}
                className="md:hidden p-2 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-500/30"
              >
                <Download size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* -- MAIN CONTENT GRID -- */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8 space-y-4 md:space-y-8">

          {/* 1. WATERFALL FINANCIAL SUMMARY */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-black text-white text-base tracking-wide">DAILY FINANCIAL STATEMENT</h3>
                <p className="text-slate-400 text-xs mt-0.5">{report.date}</p>
              </div>
              <span className="text-slate-300 text-xs font-mono">{report.companyName}</span>
            </div>

            {/* Waterfall rows */}
            <div className="px-6 py-5 space-y-0.5">
              {/* Opening */}
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 mb-2">
                <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">Jaban Hore (Opening Balance)</span>
                <span className="font-bold text-gray-900 dark:text-white tabular-nums">{openingBal.toLocaleString()} ETB</span>
              </div>

              {/* Inflows */}
              {report.pureIncome > 0 && <WRow label="+ Dakhli (Income)" amount={report.pureIncome} type="in" />}
              {(report.totalDebtCollected ?? 0) > 0 && <WRow label="+ Deyn Soo Xarootay (Debt Collected)" amount={report.totalDebtCollected!} type="in" />}
              {(report.totalLoansReceived ?? 0) > 0 && <WRow label="+ Dayn La Qaaday (Loans Received)" amount={report.totalLoansReceived!} type="in" />}

              {/* Total Inflows Sub-total */}
              {((report.pureIncome || 0) + (report.totalDebtCollected || 0) + (report.totalLoansReceived || 0)) > 0 && (
                <div className="flex justify-between items-center py-1 border-t border-gray-50 dark:border-gray-800 mt-1 opacity-80">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Total Inflows</span>
                  <span className="text-xs font-bold text-green-600 tabular-nums">+ {((report.pureIncome || 0) + (report.totalDebtCollected || 0) + (report.totalLoansReceived || 0)).toLocaleString()}</span>
                </div>
              )}

              {/* Spacer */}
              {(report.totalProjectExpenses > 0 || report.pureCompanyExpenses > 0 || (report.totalBankCommissions ?? 0) > 0 || (report.totalFixedAssets ?? 0) > 0 || (report.totalDebtsTaken ?? 0) > 0) && (
                <div className="pt-2" />
              )}

              {/* Outflows */}
              {report.totalProjectExpenses > 0 && <WRow label="− Mashruuc Kharash (Project Exp.)" amount={report.totalProjectExpenses} type="out" />}
              {report.pureCompanyExpenses > 0 && <WRow label="− Shirkad Kharash (Company Exp.)" amount={report.pureCompanyExpenses} type="out" />}
              {(report.totalBankCommissions ?? 0) > 0 && <WRow label="− Khidmadaha Bankiga (Bank Commissions)" amount={report.totalBankCommissions!} type="out" />}
              {(report.totalFixedAssets ?? 0) > 0 && <WRow label="− Hantida Joogtada (Fixed Assets)" amount={report.totalFixedAssets!} type="out" />}
              {(report.totalDebtsTaken ?? 0) > 0 && <WRow label="− Deyn La Siiyay (Receivables Given)" amount={report.totalDebtsTaken!} type="out" />}
              {(report.totalDebtsRepaid ?? 0) > 0 && <WRow label="− Deyn La Bixiyay (Debts Repaid)" amount={report.totalDebtsRepaid!} type="out" />}

              {/* Total Outflows Sub-total */}
              {(report.totalProjectExpenses + report.pureCompanyExpenses + (report.totalBankCommissions || 0) + (report.totalFixedAssets || 0) + (report.totalDebtsTaken || 0) + (report.totalDebtsRepaid || 0)) > 0 && (
                <div className="flex justify-between items-center py-1 border-t border-gray-50 dark:border-gray-800 mt-1 opacity-80">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Total Outflows</span>
                  <span className="text-xs font-bold text-red-500 tabular-nums">− {(report.totalProjectExpenses + report.pureCompanyExpenses + (report.totalBankCommissions || 0) + (report.totalFixedAssets || 0) + (report.totalDebtsTaken || 0) + (report.totalDebtsRepaid || 0)).toLocaleString()}</span>
                </div>
              )}

              {/* Closing */}
              <WRow label="Jaban Hada (Closing Balance)" amount={closingBal} type="total" />
            </div>
          </div>

          {/* 2. ACCOUNT BALANCES (If Any) */}
          {hasBalances && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden w-full">
              <div className="px-3 py-2 md:px-6 md:py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                <h3 className="font-bold text-sm md:text-base text-gray-800 dark:text-white flex items-center gap-2">
                  <Wallet size={16} className="text-gray-500" /> Account Liquidity
                </h3>
                <span className="text-[10px] md:text-xs font-mono text-gray-500 whitespace-nowrap ml-2">LIVE SNAPSHOT</span>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-medium">
                    <tr>
                      <th className="px-2 py-2 md:px-6 md:py-3">Account</th>
                      <th className="px-2 py-2 md:px-6 md:py-3 text-right">Prev<span className="hidden md:inline">ious Balance</span></th>
                      <th className="px-2 py-2 md:px-6 md:py-3 text-right">Curr<span className="hidden md:inline">ent Balance</span></th>
                      <th className="px-2 py-2 md:px-6 md:py-3 text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {Object.entries(report.balances.today).map(([accName, currBal]) => {
                      const prevBal = report.balances.previous[accName] || 0;
                      const change = currBal - prevBal;
                      return (
                        <tr key={accName} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-2 py-2 md:px-6 md:py-4 font-bold text-gray-900 dark:text-white">{accName}</td>
                          <td className="px-2 py-2 md:px-6 md:py-4 text-right text-gray-500">{prevBal.toLocaleString()}</td>
                          <td className="px-2 py-2 md:px-6 md:py-4 text-right font-bold text-gray-900 dark:text-white">{currBal.toLocaleString()}</td>
                          <td className={`px-2 py-2 md:px-6 md:py-4 text-right font-medium ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {change > 0 ? '+' : ''}{change.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. INCOME SECTION (Full Width) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <Link href="/shop/accounting" className="block">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-green-50/30 hover:bg-green-100/50 transition-colors cursor-pointer group">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 group-hover:text-green-700 transition-colors">
                  <TrendingUp size={18} className="text-green-600" /> Income Breakdown
                </h3>
                <span className="text-sm font-bold text-green-700 bg-green-100 px-2 py-1 rounded-lg group-hover:bg-green-200 transition-colors">
                  +{report.income.toLocaleString()} ETB
                </span>
              </div>
            </Link>
            {report.incomeTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-400 italic">No income recorded for this day.</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {report.incomeTransactions.map((tx, idx) => (
                  <div key={idx} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 dark:text-white">{tx.description || 'Income'}</p>
                        {tx.customer && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{tx.customer}</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <span className="bg-gray-100 px-1.5 rounded">{tx.account || 'N/A'}</span>
                        {tx.project && <span>• {tx.project}</span>}
                        {tx.note && <span className="italic">• {tx.note}</span>}
                      </p>
                    </div>
                    <span className="font-bold text-green-600 whitespace-nowrap text-lg">
                      +{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 4. PROJECT EXPENSES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
              <Link href="/shop/accounting">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-purple-50/30 hover:bg-purple-100/50 transition-colors cursor-pointer group">
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 group-hover:text-purple-700 transition-colors">
                    <HardDrive size={18} className="text-purple-600" /> Project Expenses
                  </h3>
                  <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full group-hover:bg-purple-200 transition-colors">
                    {report.projectExpenses.length} Items
                  </span>
                </div>
              </Link>
              {report.projectExpenses.length === 0 ? (
                <div className="p-8 text-center text-gray-400 italic flex-1 flex items-center justify-center">No project expenses.</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {report.projectExpenses.map((ex, idx) => (
                    <Link href={`/expenses/${ex.id}`} key={`p-${idx}`}>
                      <div className="p-4 flex justify-between items-start hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 transition-colors">
                            {ex.description || ex.category}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 font-medium">{ex.project}</span>
                            <span className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{ex.category}</span>
                            {ex.employeeName && (
                              <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 font-medium">Shaqaale: {ex.employeeName}</span>
                            )}
                            {ex.vendorName && (
                              <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 font-medium">Iibiyo: {ex.vendorName}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">-{ex.amount.toLocaleString()}</span>
                          <div className="flex gap-2 mt-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">View</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-gray-500">Total Project Exp</span>
                      <span className="text-red-600">-{report.totalProjectExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. COMPANY EXPENSES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
              <Link href="/shop/accounting">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-blue-50/30 hover:bg-blue-100/50 transition-colors cursor-pointer group">
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                    <Receipt size={18} className="text-blue-600" /> Company Expenses
                  </h3>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full group-hover:bg-blue-200 transition-colors">
                    {report.companyExpenses.length} Items
                  </span>
                </div>
              </Link>
              {report.companyExpenses.length === 0 ? (
                <div className="p-8 text-center text-gray-400 italic flex-1 flex items-center justify-center">No company expenses.</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {report.companyExpenses.map((ex, idx) => (
                    <Link href={`/expenses/${ex.id}`} key={`c-${idx}`}>
                      <div className="p-4 flex justify-between items-start hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 transition-colors">
                            {ex.description || ex.category}
                          </p>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <span className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{ex.category}</span>
                            {ex.employeeName && (
                              <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 font-medium">Shaqaale: {ex.employeeName}</span>
                            )}
                            {ex.vendorName && (
                              <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 font-medium">Iibiyo: {ex.vendorName}</span>
                            )}
                            {ex.details && <span className="text-xs text-gray-400 font-medium">| {ex.details}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">-{ex.amount.toLocaleString()}</span>
                          <div className="flex gap-2 mt-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">View</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-gray-500">Total Company Exp</span>
                      <span className="text-red-600">-{report.totalCompanyExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* 5. Fixed Assets & Collections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {(report.fixedAssets?.length ?? 0) > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-bold text-gray-800 dark:text-white">Fixed Assets Purchased</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {report.fixedAssets!.map((asset, i) => (
                    <div key={i} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-xs text-gray-500">{asset.type}</p>
                      </div>
                      <span className="font-bold text-indigo-600">{asset.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>

          {/* 6. Vendor Debt Repayments */}
          {(report.debtsRepaid?.filter(tx => tx.vendorName) ?? []).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-orange-50/30">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Receipt size={18} className="text-orange-500" /> Lacag Bixinta Iibiyayaasha
                </h3>
                <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                  {(report.debtsRepaid?.filter(tx => tx.vendorName) ?? []).length} Items
                </span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {report.debtsRepaid?.filter(tx => tx.vendorName).map((tx, idx) => (
                  <div key={idx} className="p-4 flex justify-between items-start hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{tx.description || 'Lacag bixin'}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tx.vendorName && (
                          <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 font-medium">
                            Iibiye: {tx.vendorName}
                          </span>
                        )}
                        {tx.project && (
                          <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 font-medium">
                            Mashruuc: {tx.project}
                          </span>
                        )}
                        {tx.account && (
                          <span className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                            {tx.account}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-red-500 whitespace-nowrap">-{tx.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
