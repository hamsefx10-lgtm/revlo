const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    try {
        // Find a company
        const company = await prisma.company.findFirst();
        if (!company) {
            console.error("No company found in the database. Cannot create user.");
            return;
        }

        const email = "antigravity@revlo.com";
        const password = await bcrypt.hash("Antigravity123!", 10);

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            console.log("User already exists. Update password if needed.");
            await prisma.user.update({
                where: { email },
                data: { password, role: 'ADMIN' }
            });
            console.log("Password reset successfully. Email: " + email + " Password: Antigravity123!");
            return;
        }

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                email,
                password,
                fullName: "Antigravity AI",
                role: 'ADMIN', // Assuming ADMIN is in Role enum
                companyId: company.id,
                status: "Active"
            }
        });

        console.log("Successfully created user: " + email + " with password: Antigravity123!");
    } catch (e) {
        console.error("Error creating user:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
