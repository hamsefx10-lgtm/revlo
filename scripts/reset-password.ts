
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'birshil1@gmail.com';
    const newPassword = 'Birshil123$';

    console.log(`--- Resetting Password for ${email} ---`);

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log(`User ${email} not found!`);
        return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
    });

    console.log(`Password for ${email} has been updated to: ${newPassword}`);
    console.log(`User ID: ${user.id}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
