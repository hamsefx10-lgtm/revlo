
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const sale = await prisma.sale.findUnique({
            where: { id: params.id },
            include: {
                customer: true,
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        role: true
                    }
                },
                items: {
                    include: {
                        product: {
                            select: {
                                sku: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!sale) {
            return NextResponse.json(
                { error: 'Sale not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ sale });
    } catch (error) {
        console.error('Error fetching sale details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sale details' },
            { status: 500 }
        );
    }
}
