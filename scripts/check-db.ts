import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        console.log("Checking DB connection...");
        const count = await prisma.user.count();
        console.log(`Success! Found ${count} users.`);
        const txCount = await prisma.transaction.count();
        console.log(`Found ${txCount} transactions.`);
    } catch (e) {
        console.error("DB Connection Failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
