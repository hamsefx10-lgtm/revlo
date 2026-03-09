import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateShopReceiptPDF } from '@/lib/whatsapp/send-shop-receipt';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const sale = await (prisma as any).sale.findUnique({
            where: { id: params.id },
            include: {
                customer: true,
                items: true,
                company: true,
            },
        });

        if (!sale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
        }

        const pdfBuffer = await generateShopReceiptPDF(sale, sale.company);

        if (!pdfBuffer) {
            return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
        }

        // Return the PDF buffer with appropriate headers
        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Invoice_${sale.invoiceNumber}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Error generating receipt PDF:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
