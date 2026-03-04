
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword(email, newPassword) {
    try {
        console.log(`Attempting to reset password for: ${email}`);

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user
        const updatedUser = await prisma.user.update({
            where: { email: email },
            data: { password: hashedPassword }
        });

        console.log(`Successfully updated password for ${updatedUser.fullName} (${updatedUser.email})`);
    } catch (error) {
        if (error.code === 'P2025') {
            console.error(`Error: User with email "${email}" not found.`);
        } else {
            console.error('An unexpected error occurred:', error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Get arguments from command line
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
    console.log('Usage: node reset-password.js <email> <new-password>');
    process.exit(1);
}

resetPassword(email, newPassword);
