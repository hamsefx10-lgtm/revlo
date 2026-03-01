const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Hel DEBT_RECEIVED transactions
    const debtReceived = await prisma.transaction.findMany({
        where: { type: 'DEBT_RECEIVED' },
        include: {
            account: { select: { name: true } },
            company: { select: { name: true } },
            customer: { select: { name: true } },
            vendor: { select: { name: true } },
        },
        orderBy: { transactionDate: 'asc' }
    });

    const lines = [];
    lines.push('=== DEBT_RECEIVED TRANSACTIONS ===');
    lines.push('Count: ' + debtReceived.length);

    let total = 0;
    for (const tx of debtReceived) {
        const amount = Number(tx.amount);
        total += amount;
        lines.push('---');
        lines.push('ID: ' + tx.id);
        lines.push('Amount: ' + amount);
        lines.push('Date: ' + tx.transactionDate);
        lines.push('Description: ' + tx.description);
        lines.push('Note: ' + (tx.note || 'null'));
        lines.push('Account: ' + (tx.account ? tx.account.name : 'NULL'));
        lines.push('Company: ' + (tx.company ? tx.company.name : 'null'));
        lines.push('Customer: ' + (tx.customer ? tx.customer.name : 'null'));
        lines.push('Vendor: ' + (tx.vendor ? tx.vendor.name : 'null'));
        lines.push('Category: ' + (tx.category || 'null'));
    }
    lines.push('=== TOTAL: ' + total + ' ETB ===');

    // Noocyada oo dhan
    lines.push('');
    lines.push('=== ALL TYPES SUMMARY ===');
    const types = await prisma.transaction.groupBy({
        by: ['type'],
        _count: { id: true },
        _sum: { amount: true },
    });
    for (const t of types) {
        lines.push(t.type + ' | count:' + t._count.id + ' | sum:' + Number(t._sum.amount || 0));
    }

    const fs = require('fs');
    fs.writeFileSync('scripts/result-68k.txt', lines.join('\n'), 'utf8');
    console.log('Done. Lines written: ' + lines.length);
}

main().catch(e => { console.error(e.message); }).finally(() => prisma.$disconnect());
