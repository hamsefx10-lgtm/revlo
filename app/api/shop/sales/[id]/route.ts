
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

        // Fetch associated payment transactions based on the invoice number description
        const payments = await prisma.transaction.findMany({
            where: {
                OR: [
                    {
                        description: {
                            contains: `Invoice #${sale.invoiceNumber}`
                        }
                    },
                    {
                        note: `Ref Sale: ${sale.id}`
                    }
                ]
            },
            orderBy: { transactionDate: 'desc' },
            include: {
                account: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json({ sale: { ...sale, payments } });
    } catch (error) {
        console.error('Error fetching sale details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sale details' },
            { status: 500 }
        );
    }
}
