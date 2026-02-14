
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function GET(request: Request) {
    try {
        // In a real Super Admin scenario, we might check for a specific "SUPER_ADMIN" role/token.
        // For now, we assume the user accessing this has passed the middleware/sidebar checks.
        // We strictly want to list ALL companies here.

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } }
            ]
        } : {};

        const companies = await prisma.company.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { users: true, projects: true }
                }
            }
        });

        const formattedCompanies = companies.map(c => ({
            id: c.id,
            name: c.name,
            planType: c.planType,
            industry: c.industry,
            status: 'Active', // Schema doesn't have status yet, default to Active
            usersCount: c._count.users,
            projectsCount: c._count.projects,
            createdAt: c.createdAt
        }));

        return NextResponse.json({ success: true, companies: formattedCompanies });
    } catch (error: any) {
        console.error('Error fetching companies:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch companies', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, planType, industry } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, message: 'Company Name is required' },
                { status: 400 }
            );
        }

        const existing = await prisma.company.findUnique({ where: { name } });
        if (existing) {
            return NextResponse.json(
                { success: false, message: 'Company already exists' },
                { status: 400 }
            );
        }

        const company = await prisma.company.create({
            data: {
                name,
                email,
                planType: planType || 'COMBINED',
                industry,
                // Default settings could be added here
            }
        });

        return NextResponse.json({ success: true, company });

    } catch (error: any) {
        console.error('Error creating company:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create company', error: error.message },
            { status: 500 }
        );
    }
}
