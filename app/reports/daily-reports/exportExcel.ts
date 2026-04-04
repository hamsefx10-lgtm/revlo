import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DailyReport } from './page';

export async function exportExcel(data: DailyReport) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Revlo System';
  workbook.created = new Date();

  // Helper to safely format currency
  const num = (value: number | undefined) => typeof value === 'number' ? value : 0;

  // Helper to fetch image as base64 with opacity mapping
  const fetchImageBase64 = async (url: string | undefined, opacity = 1): Promise<string | undefined> => {
    if (!url) return undefined;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (opacity >= 1) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
            return;
          }
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.globalAlpha = opacity;
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve('');
          }
        };
        img.src = URL.createObjectURL(blob);
      });
    } catch {
      return undefined;
    }
  };

  const logoBase64 = await fetchImageBase64(data.companyLogoUrl);
  // Fetch a very faint version for the watermark
  const watermarkBase64 = await fetchImageBase64(data.companyLogoUrl, 0.08);

  const sheet = workbook.addWorksheet('Daily Report', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 }
  });

  // 1) Remove Standard Excel Gridlines to make it clean like a PDF
  sheet.views = [{ showGridLines: false }];

  // Basic styling colors matching the PDF
  const HEADER_COLOR = '0f172a'; // slate-900 (Dark Blue)
  const GREEN = '16a34a'; // Main theme green
  const RED = 'dc2626';
  const ORANGE = 'ea580c';

  // Define Columns
  sheet.columns = [
    { header: '', key: 'A', width: 4 },  // Margin L
    { header: '', key: 'B', width: 22 }, // Col 1
    { header: '', key: 'C', width: 22 }, // Col 2
    { header: '', key: 'D', width: 35 }, // Col 3
    { header: '', key: 'E', width: 20 }, // Col 4
    { header: '', key: 'F', width: 22 }, // Col 5
    { header: '', key: 'G', width: 4 }   // Margin R
  ];

  let currentLine = 2;

  // --- HEADER SECTION (Matching PDF) ---
  // Left: Logo
  if (logoBase64) {
    try {
      const logoId = workbook.addImage({
        base64: logoBase64,
        extension: logoBase64.includes('jpeg') || logoBase64.includes('jpg') ? 'jpeg' : 'png',
      });
      sheet.addImage(logoId, {
        tl: { col: 1, row: currentLine - 1 }, // Col B 
        ext: { width: 80, height: 80 }
      });
    } catch (e) {
      // Ignore logo error
    }
  }

  // Center: Title Brand (Birshiil)
  const titleCell = sheet.getCell(`C${currentLine}`);
  titleCell.value = ' Birshiil';
  titleCell.font = { name: 'Arial', size: 28, bold: true, color: { argb: ORANGE } };
  
  const subCell = sheet.getCell(`C${currentLine + 1}`);
  subCell.value = ' Daily Financial Report';
  subCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: '777777' } };

  // Right: Date, Ref, Prepared By
  const metaLabels = ['DATE', 'REF NUMBER', 'PREPARED BY'];
  const metaValues = [data.date, `D-${data.date.replace(/-/g, '')}`, data.preparedBy || 'System'];
  
  for (let i = 0; i < 3; i++) {
    const rC = sheet.getCell(`E${currentLine + i}`);
    rC.value = metaLabels[i];
    rC.font = { name: 'Arial', size: 9, bold: true, color: { argb: HEADER_COLOR } };
    
    const vC = sheet.getCell(`F${currentLine + i}`);
    vC.value = metaValues[i];
    vC.font = { name: 'Arial', size: 9, color: { argb: '333333' } };
  }
  
  currentLine += 5;

  // Green horizontal separator line
  for (const c of ['B', 'C', 'D', 'E', 'F']) {
    sheet.getCell(`${c}${currentLine}`).border = { top: { style: 'medium', color: { argb: GREEN } } };
  }
  currentLine += 2;

  // Watermark (Single faint image floating in the center of the report)
  if (watermarkBase64) {
    try {
      const wtbId = workbook.addImage({
        base64: watermarkBase64,
        extension: watermarkBase64.includes('jpeg') || watermarkBase64.includes('jpg') ? 'jpeg' : 'png',
      });
      sheet.addImage(wtbId, {
        tl: { col: 2, row: 15 }, // Start at Column C, Row 16 roughly
        ext: { width: 350, height: 350 }
      });
    } catch (e) { }
  }

  const addTable = (
    title: string,
    headers: string[],
    rows: any[][],
    totals?: { label: string, amount: number, color?: string }
  ) => {
    // Spacer
    currentLine++;

    // Title
    sheet.mergeCells(`B${currentLine}:E${currentLine}`);
    const titleC = sheet.getCell(`B${currentLine}`);
    titleC.value = title;
    titleC.font = { name: 'Arial', size: 14, bold: true, color: { argb: HEADER_COLOR } };
    currentLine += 2; // Extra space after title

    // Table Headers
    const startColIdx = 2; // Col B
    headers.forEach((h, i) => {
      const cell = sheet.getRow(currentLine).getCell(startColIdx + i);
      cell.value = h.toUpperCase();
      cell.font = { name: 'Arial', size: 8, bold: true, color: { argb: HEADER_COLOR } };
      cell.border = { bottom: { style: 'medium', color: { argb: GREEN } } }; // Green thick border standard for headers
      
      if (h.toLowerCase().includes('balance') || h.toLowerCase().includes('change') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('value')) {
        cell.alignment = { horizontal: 'right' };
      }
    });
    currentLine++;



    // Table Rows (White, thin bottom border)
    rows.forEach(row => {
      row.forEach((val, i) => {
        const cell = sheet.getRow(currentLine).getCell(startColIdx + i);
        cell.value = val;
        cell.font = { name: 'Arial', size: 9, color: { argb: '444444' } }; // Dark gray like PDF body
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }; // Pure white background
        cell.border = { bottom: { style: 'thin', color: { argb: 'EEEEEE' } } }; // Subtle divider
        
        // Color green/red for Change column
        if (typeof val === 'string' && (val.startsWith('+') || val.startsWith('-'))) {
          // If it's a difference string, color it exactly 
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: val.startsWith('+') ? GREEN : RED } };
          cell.alignment = { horizontal: 'right' };
        } else if (typeof val === 'number') {
          cell.numFmt = '#,##0.00 "ETB"';
          cell.alignment = { horizontal: 'right' };
        }
      });
      currentLine++;
    });

    // Totals
    if (totals) {
      sheet.mergeCells(`B${currentLine}:E${currentLine}`);
      const tLabel = sheet.getCell(`B${currentLine}`);
      tLabel.value = totals.label;
      tLabel.alignment = { horizontal: 'right' };
      tLabel.font = { name: 'Arial', size: 10, bold: true };

      const tValue = sheet.getCell(`F${currentLine}`);
      tValue.value = totals.amount;
      tValue.numFmt = '#,##0.00 "ETB"';
      tValue.font = { name: 'Arial', size: 10, bold: true, color: { argb: totals.color || HEADER_COLOR } };
      currentLine++;
    }
  };

  // 1. Account Balances
  if (data.balances && Object.keys(data.balances.today).length > 0) {
    const allAccounts = Array.from(new Set([...Object.keys(data.balances.previous || {}), ...Object.keys(data.balances.today || {})]));
    const balanceRows = allAccounts.map(name => {
      const p = num(data.balances.previous[name]);
      const c = num(data.balances.today[name]);
      const diff = c - p;
       return [name, p, c, diff > 0 ? `+${diff.toLocaleString()}` : `${diff.toLocaleString()}`];
    });
    addTable('Account Balances', ['Account', 'Previous Balance', 'Current Balance', 'Change'], balanceRows);
  }

  // 2. Income
  if (data.incomeTransactions.length > 0) {
    addTable('Income Received', ['Customer', 'Project', 'Description', 'Account', 'Amount'], 
      data.incomeTransactions.map(tx => [tx.customer || '-', tx.project || '-', tx.description || 'Income', tx.account || '-', num(tx.amount)]),
      { label: 'Total Income', amount: num(data.income), color: GREEN }
    );
  }

  // 3. Project Expenses
  if (data.projectExpenses.length > 0) {
    addTable('Project Expenses', ['Project', 'Category', 'Employee / Vendor', 'Description', 'Amount'], 
      data.projectExpenses.map(e => [e.project || '-', e.category || '-', e.employeeName || e.vendorName || '-', e.description || '-', num(e.amount)]),
      { label: 'Total Project Exp.', amount: num(data.totalProjectExpenses), color: RED }
    );
  }

  // 4. Company Expenses
  if (data.companyExpenses.length > 0) {
    addTable('Company Expenses', ['Category', 'Employee / Vendor', 'Description', '', 'Amount'], 
      data.companyExpenses.map(e => [e.category || '-', e.employeeName || e.vendorName || '-', e.description || '-', '', num(e.amount)]),
      { label: 'Total Ops Exp.', amount: num(data.totalCompanyExpenses), color: RED }
    );
  }

  // 4b. Fixed Assets
  if (data.fixedAssets && data.fixedAssets.length > 0) {
    addTable('Fixed Assets Purchased', ['Asset Name', 'Type', 'Vendor', 'Assigned To', 'Value'], 
      data.fixedAssets.map((a: any) => [a.name || '-', a.type || '-', a.vendor || '-', a.assignedTo || '-', num(a.value)]),
      { label: 'Total Fixed Assets', amount: num(data.totalFixedAssets), color: ORANGE }
    );
  }

  // 5. Receivables Given
  if (data.debtsTaken && data.debtsTaken.length > 0) {
    addTable('Receivables Given (Deyn La Siiyay)', ['Borrower / Customer', 'Description', 'Account', '', 'Amount'], 
      data.debtsTaken.map((tx: any) => [tx.customerName || tx.vendorName || tx.employeeName || '-', tx.note || tx.description || '-', tx.account || '-', '', num(tx.amount)]),
      { label: 'Total Receivables', amount: data.debtsTaken.reduce((sum: number, tx: any) => sum + num(tx.amount), 0), color: RED }
    );
  }

  // 6. Debts Repaid
  if (data.debtsRepaid && data.debtsRepaid.length > 0) {
    addTable('Debts Repaid', ['Lender / Customer', 'Description', 'Account', '', 'Amount'], 
      data.debtsRepaid.map((tx: any) => [tx.customerName || tx.vendorName || tx.employeeName || '-', tx.note || tx.description || '-', tx.account || '-', '', num(tx.amount)]),
      { label: 'Total Debts Repaid', amount: data.debtsRepaid.reduce((sum: number, tx: any) => sum + num(tx.amount), 0), color: RED }
    );
  }

  // --- WATERFALL SUMMARY ---
  currentLine += 3;
  sheet.mergeCells(`B${currentLine}:F${currentLine}`);
  const sTitle = sheet.getCell(`B${currentLine}`);
  sTitle.value = 'DAILY FINANCIAL STATEMENT';
  sTitle.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  sTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
  sTitle.alignment = { vertical: 'middle' };
  currentLine += 2;

  const wRow = (label: string, valStr: string | number, color?: string, isBold = false) => {
    sheet.mergeCells(`B${currentLine}:E${currentLine}`);
    const lC = sheet.getCell(`B${currentLine}`);
    lC.value = label;
    lC.font = { name: 'Arial', size: isBold ? 10 : 9, bold: isBold, color: { argb: '333333' } };

    const vC = sheet.getCell(`F${currentLine}`);
    vC.value = valStr;
    vC.alignment = { horizontal: 'right' };
    if (typeof valStr === 'number') vC.numFmt = '#,##0.00 "ETB"';
    vC.font = { name: 'Arial', size: isBold ? 10 : 9, bold: isBold, color: { argb: color || HEADER_COLOR } };
    currentLine++;
  };

  wRow('Lacagtii hore ugu jirtay (Opening Balance)', num(data.totalPrev), HEADER_COLOR, true);
  currentLine++;

  const totalIn = num(data.pureIncome) + num(data.totalDebtCollected) + num(data.totalLoansReceived);
  if (num(data.pureIncome) > 0) wRow('  + Dakhli (Income)', num(data.pureIncome), GREEN);
  if (num(data.totalDebtCollected) > 0) wRow('  + Deyn Soo Xarootay (Debt Collected)', num(data.totalDebtCollected), GREEN);
  if (num(data.totalLoansReceived) > 0) wRow('  + Dayn La Qaaday (Loans Received)', num(data.totalLoansReceived), GREEN);
  if (totalIn > 0) {
    wRow('TOTAL INFLOWS', totalIn, GREEN, true);
    currentLine++;
  }

  const out1 = num(data.totalProjectExpenses);
  const out2 = num(data.pureCompanyExpenses);
  const out3 = num(data.totalFixedAssets);
  const out4 = num(data.totalBankCommissions);
  const out5 = num(data.totalDebtsTaken);
  const out6 = num(data.totalDebtsRepaid);
  
  if (out1 > 0) wRow('  - Mashruuc Kharashyada (Project Exp.)', -out1, RED);
  if (out2 > 0) wRow('  - Shirkad Kharashyada (Company Exp.)', -out2, RED);
  if (out3 > 0) wRow('  - Hantida Joogtada (Fixed Assets)', -out3, ORANGE);
  if (out4 > 0) wRow('  - Khidmadaha Bankiga (Bank Commissions)', -out4, ORANGE);
  if (out5 > 0) wRow('  - Deyn La Siiyay (Receivables Given)', -out5, RED);
  if (out6 > 0) wRow('  - Deyn La Bixiyay (Debts Repaid)', -out6, RED);

  const totalOut = out1 + out2 + out3 + out4 + out5 + out6;
  if (totalOut > 0) {
    wRow('TOTAL OUTFLOWS', -totalOut, RED, true);
    currentLine++;
  }

  // Draw thick border for closing balance
  const bottomBorder = sheet.getCell(`B${currentLine}`);
  bottomBorder.border = { top: { style: 'medium' } };
  sheet.getCell(`C${currentLine}`).border = { top: { style: 'medium' } };
  sheet.getCell(`D${currentLine}`).border = { top: { style: 'medium' } };
  sheet.getCell(`E${currentLine}`).border = { top: { style: 'medium' } };
  sheet.getCell(`F${currentLine}`).border = { top: { style: 'medium' } };
  currentLine++;

  const closingBal = num(data.totalToday);
  wRow('Lacagta hada taala (Closing Balance)', closingBal, closingBal >= 0 ? GREEN : RED, true);

  // Generate buffer and save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `daily_report_${data.date}.xlsx`);
}
