const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const txs = await prisma.transaction.findMany({
        where: { type: 'DEBT_RECEIVED' },
        include: {
            account: { select: { name: true } },
            company: { select: { name: true } },
            customer: { select: { name: true } },
            vendor: { select: { name: true } },
        },
        orderBy: { transactionDate: 'asc' }
    });

    const allTypes = await prisma.transaction.groupBy({
        by: ['type'],
        _count: { id: true },
        _sum: { amount: true },
    });

    const result = {
        count: txs.length,
        total: txs.reduce((s, t) => s + Number(t.amount), 0),
        transactions: txs.map(tx => ({
            id: tx.id,
            amount: Number(tx.amount),
            date: tx.transactionDate,
            description: tx.description,
            note: tx.note,
            accountName: tx.account?.name ?? null,
            companyName: tx.company?.name ?? null,
            customerName: tx.customer?.name ?? null,
            vendorName: tx.vendor?.name ?? null,
            category: tx.category,
        })),
        allTypesSummary: allTypes.map(t => ({
            type: t.type,
            count: t._count.id,
            sum: Number(t._sum.amount || 0)
        }))
    };

    fs.writeFileSync('scripts/result68k.json', JSON.stringify(result, null, 2), 'utf8');
    console.log('Written to scripts/result68k.json');
}

main().catch(e => console.error(e.message)).finally(() => prisma.$disconnect());
