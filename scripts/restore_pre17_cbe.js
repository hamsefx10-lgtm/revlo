const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

function splitSqlValues(str) {
  let res = [];
  let inStr = false;
  let current = '';
  for(let i=0; i<str.length; i++) {
    if(str[i]==="'") {
      if(i+1<str.length && str[i+1]==="'") {
        current+="'"; i++;
      } else {
        inStr = !inStr;
      }
    } else if(str[i]===',' && !inStr) {
      res.push(current.trim().replace(/^'|'$/g, ''));
      current='';
    } else {
      current += str[i];
    }
  }
  res.push(current.trim().replace(/^'|'$/g, ''));
  return res.map(r => r === 'NULL' ? null : r);
}

async function run() {
  const accountId = 'c8306c05-5279-4b05-b5fc-dda41c793a77';
  const cutoffDate = new Date('2026-03-17T00:00:00Z');

  console.log(`Starting Pre-Mar 17 extraction and restoration for CBE...`);

  const sql = fs.readFileSync('railway_dump.sql', 'utf8');
  const lines = sql.split('\n');
  const txLines = lines.filter(l => l.includes('INSERT INTO public.transactions VALUES'));

  let extractedTxs = [];
  
  for (const line of txLines) {
    const match = line.match(/VALUES \((.*)\);/);
    if (!match) continue;
    const vals = splitSqlValues(match[1]);
    
    // accountId (8), fromAccountId (9), toAccountId (10)
    if (vals[8] === accountId || vals[9] === accountId || vals[10] === accountId) {
      const txDate = new Date(vals[4] + 'Z'); // e.g. '2025-10-10 16:52:22.228' -> appended Z to ensure valid UTC parsing
      if (txDate < cutoffDate) {
        extractedTxs.push({
          id: vals[0],
          description: vals[1],
          amount: parseFloat(vals[2]),
          type: vals[3],
          transactionDate: txDate,
          note: vals[5],
          createdAt: new Date(vals[6] + 'Z'),
          updatedAt: new Date(vals[7] + 'Z'),
          accountId: vals[8],
          fromAccountId: vals[9],
          toAccountId: vals[10],
          projectId: vals[11],
          expenseId: vals[12],
          customerId: vals[13],
          vendorId: vals[14],
          userId: vals[15],
          employeeId: vals[16],
          category: vals[17],
          companyId: vals[18],
          fiscalYearId: vals[19],
          shareholderId: vals[20],
          fixedAssetId: vals[21]
        });
      }
    }
  }

  console.log(`Extracted ${extractedTxs.length} pre-March 17 transactions from dump.`);

  if (extractedTxs.length === 0) {
    console.log('No transactions found. Exiting.');
    return;
  }

  // Pre-validate Foreign Keys
  const uniqueExpenseIds = [...new Set(extractedTxs.map(t => t.expenseId).filter(Boolean))];
  const validExpenses = await p.expense.findMany({ where: { id: { in: uniqueExpenseIds } }, select: { id: true } });
  const validExpenseSet = new Set(validExpenses.map(e => e.id));

  const uniqueProjectIds = [...new Set(extractedTxs.map(t => t.projectId).filter(Boolean))];
  const validProjects = await p.project.findMany({ where: { id: { in: uniqueProjectIds } }, select: { id: true } });
  const validProjectSet = new Set(validProjects.map(p => p.id));

  const uniqueVendorIds = [...new Set(extractedTxs.map(t => t.vendorId).filter(Boolean))];
  const validVendors = await p.shopVendor.findMany({ where: { id: { in: uniqueVendorIds } }, select: { id: true } });
  const validVendorSet = new Set(validVendors.map(v => v.id));

  const uniqueCustomerIds = [...new Set(extractedTxs.map(t => t.customerId).filter(Boolean))];
  const validCustomers = await p.customer.findMany({ where: { id: { in: uniqueCustomerIds } }, select: { id: true } });
  const validCustomerSet = new Set(validCustomers.map(c => c.id));

  const uniqueEmployeeIds = [...new Set(extractedTxs.map(t => t.employeeId).filter(Boolean))];
  const validEmployees = await p.employee.findMany({ where: { id: { in: uniqueEmployeeIds } }, select: { id: true } });
  const validEmployeeSet = new Set(validEmployees.map(e => e.id));

  const LIVE_BARAKO_VENDOR = '96ea6f70-9f08-4a83-a768-556e6ee2cfa0';
  const LIVE_BARAKO_EXPENSE = '2609de71-cd74-402f-8870-fc080270304d';

  // Fix extracted transactions
  extractedTxs = extractedTxs.map(t => {
    let wasVendorOrphaned = t.vendorId && !validVendorSet.has(t.vendorId);
    let wasExpenseOrphaned = t.expenseId && !validExpenseSet.has(t.expenseId);

    if (wasVendorOrphaned || wasExpenseOrphaned) {
      if (wasVendorOrphaned) t.vendorId = LIVE_BARAKO_VENDOR;
      if (wasExpenseOrphaned) t.expenseId = LIVE_BARAKO_EXPENSE;
    }

    if (t.projectId && !validProjectSet.has(t.projectId)) t.projectId = null;
    if (t.customerId && !validCustomerSet.has(t.customerId)) t.customerId = null;
    if (t.employeeId && !validEmployeeSet.has(t.employeeId)) t.employeeId = null;
    
    return t;
  });

  // 1. Delete existing pre-Mar 17 for this account
  const deleteRes = await p.transaction.deleteMany({
    where: {
      OR: [
        { accountId: accountId },
        { fromAccountId: accountId },
        { toAccountId: accountId }
      ],
      transactionDate: { lt: cutoffDate }
    }
  });

  console.log(`Deleted ${deleteRes.count} existing pre-March 17 transactions in live DB.`);

  // 2. Insert extracted
  const insertRes = await p.transaction.createMany({
    data: extractedTxs,
    skipDuplicates: true // in case of weird overlaps
  });

  console.log(`Inserted ${insertRes.count} pre-March 17 transactions from backup.`);

  // 3. Sync Account Balance
  const finalTxs = await p.transaction.findMany({
    where: {
      OR: [
        { accountId: accountId },
        { fromAccountId: accountId },
        { toAccountId: accountId }
      ]
    }
  });

  let balance = 0;
  finalTxs.forEach(t => {
    const amt = Math.abs(Number(t.amount));
    if (!t.accountId) {
      if (t.toAccountId === accountId) balance += amt;
      else if (t.fromAccountId === accountId) balance -= amt;
    } else if (t.accountId === accountId) {
      const type = t.type;
      const isIn = ['INCOME','DEBT_RECEIVED','TRANSFER_IN','SHAREHOLDER_DEPOSIT'].includes(type) || 
                   (type === 'DEBT_REPAID' && !t.vendorId && !t.expenseId);
      if (isIn) balance += amt;
      else balance -= amt;
    }
  });

  await p.account.update({
    where: { id: accountId },
    data: { balance: Math.round(balance * 100) / 100 }
  });

  console.log(`Final CBE Balance synced to: ${balance.toFixed(2)}`);
}

run()
  .catch(console.error)
  .finally(() => p.$disconnect());
