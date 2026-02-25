import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const allExpenses = await prisma.expense.findMany({
        select: {
            paymentStatus: true,
            paidFrom: true,
        }
    });

    const stats: any = {
        total: allExpenses.length,
        statuses: {},
        paidFromValues: {}
    };

    allExpenses.forEach(exp => {
        const status = String(exp.paymentStatus);
        stats.statuses[status] = (stats.statuses[status] || 0) + 1;

        // Check if paidFrom is empty or has a value
        const pf = exp.paidFrom ? 'Has Value' : 'Empty/Null';
        stats.paidFromValues[pf] = (stats.paidFromValues[pf] || 0) + 1;

        if (exp.paymentStatus !== 'PAID' && exp.paidFrom) {
            // log unique values of paidFrom for unpaid ones
            if (!stats.unpaidPaidFroms) stats.unpaidPaidFroms = new Set();
            stats.unpaidPaidFroms.add(exp.paidFrom);
        }
    });

    if (stats.unpaidPaidFroms) {
        stats.unpaidPaidFroms = Array.from(stats.unpaidPaidFroms);
    }

    console.log(JSON.stringify(stats, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
