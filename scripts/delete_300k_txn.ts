import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const transactionId = 'c5075f85-218a-4465-ab8c-5aa36afdb4f6';
  
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { account: true }
    });

    if (!transaction) {
      console.log("Transaction not found.");
      return;
    }

    const { amount, accountId, account } = transaction;
    console.log(`Transaction found: ${amount} in account ${account?.name || accountId}`);

    // Update Account Balance (Subtract the income)
    if (accountId) {
      const updatedAccount = await prisma.account.update({
        where: { id: accountId },
        data: {
          balance: { decrement: Number(amount) }
        }
      });
      console.log(`Updated account ${updatedAccount.name} balance to: ${updatedAccount.balance}`);
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id: transactionId }
    });
    console.log("Transaction deleted successfully.");

  } catch (err) {
    console.error("Error during operation:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
