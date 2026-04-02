const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const CBE_ID = 'c8306c05-5279-4b05-b5fc-dda41c793a77';
  const EBIRR_ID = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const HAMSE_ID = '52e8d37c-7a26-4968-96d4-33df03e67efa';
  const COMPANY_ID = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

  const targets = {
    '2026-03-17': 54092.24,
    '2026-03-18': 1190497.54,
    '2026-03-21': 232243.94,
    '2026-03-22': 209213.94,
    '2026-03-23': 76083.94,
    '2026-03-24': 106065.94,
    '2026-03-25': 86047.94,
    '2026-03-26': 29.94
  };

  const dates = Object.keys(targets).sort();

  for (const dateStr of dates) {
    const target = targets[dateStr];
    const dateObj = new Date(dateStr + 'T23:59:59Z');

    // Calculate current book balance up to this date (including previous sweeps)
    const txs = await p.transaction.findMany({
      where: {
        OR: [
          { accountId: CBE_ID },
          { fromAccountId: CBE_ID },
          { toAccountId: CBE_ID }
        ],
        transactionDate: { lte: dateObj }
      }
    });

    let currentBalance = 0;
    txs.forEach(t => {
      const amt = Math.abs(Number(t.amount));
      if (!t.accountId) {
        if (t.toAccountId === CBE_ID) currentBalance += amt;
        else if (t.fromAccountId === CBE_ID) currentBalance -= amt;
      } else if (t.accountId === CBE_ID) {
        const type = t.type;
        const isIn = ['INCOME','DEBT_RECEIVED','TRANSFER_IN','SHAREHOLDER_DEPOSIT'].includes(type) || 
                     (type === 'DEBT_REPAID' && !t.vendorId && !t.expenseId);
        if (isIn) currentBalance += amt;
        else currentBalance -= amt;
      }
    });

    const diff = target - currentBalance;
    if (Math.abs(diff) > 0.01) {
      const amount = Math.abs(diff);
      const isCbeIn = diff > 0;

      console.log(`Date: ${dateStr}, Current: ${currentBalance.toFixed(2)}, Target: ${target}, Diff: ${diff.toFixed(2)}`);

      // Create CBE side
      await p.transaction.create({
        data: {
          description: 'Wareejin Habeen (' + (isCbeIn ? 'E-Birr -> CBE' : 'CBE -> E-Birr') + ')',
          amount: amount,
          type: isCbeIn ? 'TRANSFER_IN' : 'TRANSFER_OUT',
          transactionDate: dateObj,
          accountId: CBE_ID,
          fromAccountId: isCbeIn ? EBIRR_ID : CBE_ID,
          toAccountId: isCbeIn ? CBE_ID : EBIRR_ID,
          companyId: COMPANY_ID,
          userId: HAMSE_ID
        }
      });

      // Create E-Birr side
      await p.transaction.create({
        data: {
          description: 'Wareejin Habeen (' + (isCbeIn ? 'E-Birr -> CBE' : 'CBE -> E-Birr') + ')',
          amount: amount,
          type: isCbeIn ? 'TRANSFER_OUT' : 'TRANSFER_IN',
          transactionDate: dateObj,
          accountId: EBIRR_ID,
          fromAccountId: isCbeIn ? EBIRR_ID : CBE_ID,
          toAccountId: isCbeIn ? CBE_ID : EBIRR_ID,
          companyId: COMPANY_ID,
          userId: HAMSE_ID
        }
      });
      console.log(`Created sweep for ${dateStr}: ${amount.toFixed(2)}`);
    } else {
      console.log(`Date: ${dateStr} already matches target.`);
    }
  }
}

run()
  .catch(console.error)
  .finally(() => p.$disconnect());
