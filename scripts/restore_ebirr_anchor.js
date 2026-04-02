const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const EBIRR_ID = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const COMPANY_ID = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
  const HAMSE_ID = '52e8d37c-7a26-4968-96d4-33df03e67efa';

  try {
    const tx = await p.transaction.create({
      data: {
        description: 'System Re-Calibration: E-Birr Anchor (Mar 1)',
        amount: 425872.15,
        type: 'INCOME',
        transactionDate: new Date('2026-03-01T12:00:00Z'),
        accountId: EBIRR_ID,
        companyId: COMPANY_ID,
        userId: HAMSE_ID,
        note: 'Restored from previous audit context (Pre-Mar 17 Anchor)'
      }
    });
    console.log('Restored E-Birr Anchor with ID: ' + tx.id);
  } catch (error) {
    console.error('Error restoring anchor:', error);
  } finally {
    await p.$disconnect();
  }
}

run();
