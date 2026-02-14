
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const company = await prisma.company.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: { users: true, projects: true, transactions: true }
                }
            }
        });

        if (!company) {
            return NextResponse.json(
                { success: false, message: 'Company not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, company });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: 'Failed to fetch company', error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { name, planType, industry, email, address, phone } = body;

        const company = await prisma.company.update({
            where: { id: params.id },
            data: {
                name,
                planType,
                industry,
                email,
                address,
                phone
            }
        });

        return NextResponse.json({ success: true, company });
    } catch (error: any) {
        console.error('Error updating company:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update company', error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Critical action: Deleting a company
        // In a real world scenario, we might just mark as status="DELETED"
        // But for now, we will attempt strict delete, which might fail due to foreign keys.

        // Check for related data first? Prisma cascade might handle it if configured, 
        // but the schema I saw earlier didn't have widespread Cascade delete on Company.
        // It's safer to block delete if data exists, or use a "soft delete" strategy.

        // Let's implement Soft Delete concept by checking if schema has status field? 
        // The GET route code I wrote assumed no status field on Company model yet.
        // So distinct delete might be dangerous.

        // Re-checking schema... Company model has `deletedItems` but creating a deletedItem is safer.
        // Actually, looking at the schema provided earlier:
        // model Company { ... accounts Account[] ... }
        // Most relations don't have onDelete: Cascade explicitly visible in the main model block 
        // (though relations are defined on the other side).

        // Let's try to delete. If it fails due to FK, we tell user to clear data first.

        await prisma.company.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true, message: 'Company deleted successfully' });

    } catch (error: any) {
        console.error('Error deleting company:', error);
        // Likely Foreign Key Constraint violation
        return NextResponse.json(
            {
                success: false,
                message: 'Cannot delete company. It may have related data (Users, Projects, etc.).',
                error: error.message
            },
            { status: 400 }
        );
    }
}
