
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '../../admin/auth';

export async function POST(request: Request) {
    try {
        const companyId = await getSessionCompanyId();
        if (!companyId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 1. CHECK LOW STOCK
        // Fetch items that track stock (minStock > 0)
        // We fetch all items with minStock defined to compare in memory (Postgres allows field compare but Prisma needs raw query or extensions)
        const inventoryItems = await prisma.inventoryItem.findMany({
            where: {
                companyId,
                minStock: { gt: 0 }
            }
        });

        const lowStockItems = inventoryItems.filter(item => item.inStock <= item.minStock);
        let newNotifications = 0;

        for (const item of lowStockItems) {
            // Check if we already notified recently to avoid spam (e.g., in last 24h)
            const existingNotif = await prisma.notification.findFirst({
                where: {
                    companyId,
                    type: 'warning',
                    message: { contains: item.name },
                    createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            });

            if (!existingNotif) {
                await prisma.notification.create({
                    data: {
                        companyId,
                        type: 'warning',
                        message: `Low Stock Alert: ${item.name}`,
                        details: `Current stock: ${item.inStock} (Min: ${item.minStock}). Please restock soon.`,
                        read: false
                    }
                });
                newNotifications++;
            }
        }

        // 2. CHECK OVERDUE PROJECTS (Weekly)
        const overdueProjects = await prisma.project.findMany({
            where: {
                companyId,
                status: 'Active',
                remainingAmount: { gt: 0 },
                // If there's a deadline, we could check it. For now, we assume active debts need reminders.
            }
        });

        for (const project of overdueProjects) {
            // Logice: Check if we sent a 'finance' notification for this project in the last 7 days
            const lastNotif = await prisma.notification.findFirst({
                where: {
                    companyId,
                    type: 'finance',
                    details: { contains: project.id }, // We'll store ID in details or define a structured way
                    createdAt: { gt: oneWeekAgo }
                }
            });

            if (!lastNotif) {
                await prisma.notification.create({
                    data: {
                        companyId,
                        type: 'finance',
                        message: `Payment Reminder: ${project.name}`,
                        details: `Outstanding Balance: $${project.remainingAmount}. Click to view/send Invoice. ProjectID:${project.id}`,
                        // We can use the 'action' field in the frontend to parse this ProjectID and show a "View Invoice" button
                        read: false
                    }
                });
                newNotifications++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Checks completed. Created ${newNotifications} new notifications.`,
            newCount: newNotifications
        });

    } catch (error) {
        console.error('Error checking notifications:', error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
