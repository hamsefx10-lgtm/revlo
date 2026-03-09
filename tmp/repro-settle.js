const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSettle() {
    const saleId = '15f054e6-a9a6-4726-bd2d-43a5f1835177';
    const amount = 100;
    const accountId = 'da54c86e-8ccd-4a6c-9226-9eeb6f50b4f8'; // Need a valid account ID

    try {
        console.log('Testing Settle for Sale:', saleId);
        const sale = await prisma.sale.findUnique({
            where: { id: saleId },
            include: { customer: true }
        });

        if (!sale) {
            console.error('Sale not found');
            return;
        }

        console.log('Sale found:', sale.invoiceNumber, 'Total:', sale.total, 'Paid:', sale.paidAmount);

        // Find an account if accountId is wrong
        let actualAccountId = accountId;
        const account = await prisma.account.findUnique({ where: { id: accountId } });
        if (!account) {
            const firstAccount = await prisma.account.findFirst();
            if (firstAccount) {
                actualAccountId = firstAccount.id;
                console.log('Using fallback account:', firstAccount.name);
            } else {
                console.error('No account found');
                return;
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            const newPaidAmount = Number(sale.paidAmount) + Number(amount);
            const newStatus = newPaidAmount >= sale.total - 0.01 ? 'Paid' : 'Partial';

            console.log('Updating sale to paidAmount:', newPaidAmount, 'status:', newStatus);

            const updatedSale = await tx.sale.update({
                where: { id: saleId },
                data: {
                    paidAmount: newPaidAmount,
                    paymentStatus: newStatus
                }
            });

            console.log('Updating account:', actualAccountId);
            await tx.account.update({
                where: { id: actualAccountId },
                data: {
                    balance: { increment: amount }
                }
            });

            console.log('Creating transaction...');
            await tx.transaction.create({
                data: {
                    type: 'INCOME',
                    amount: amount,
                    description: `Test Settlement for #${sale.invoiceNumber}`,
                    category: 'Sales Receipt',
                    transactionDate: new Date(),
                    accountId: actualAccountId,
                    userId: sale.userId,
                    companyId: sale.companyId,
                    note: `Ref Sale: ${sale.id}`,
                    customerId: sale.customerId
                }
            });

            return updatedSale;
        });

        console.log('Success:', result.invoiceNumber);
    } catch (e) {
        console.error('FAILED:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testSettle();
