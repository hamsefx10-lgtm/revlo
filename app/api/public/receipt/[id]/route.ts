import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateReceiptPDF } from '@/lib/whatsapp/send-receipt';




export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params;

    try {
        const expense = await (prisma as any).expense.findUnique({
            where: { id },
            include: {
                vendor: true,
                project: true,
                company: true,
            },
        });

        if (!expense) {
            return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
        }

        const companyName = expense.company?.name || 'Revlo Business';
        const pdfBuffer = await generateReceiptPDF(expense, companyName);

        if (!pdfBuffer) {
            return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
        }

        return new NextResponse(pdfBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Receipt_${id.substring(0, 8)}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Public PDF generation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
