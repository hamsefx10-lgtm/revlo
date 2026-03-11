import { NextRequest, NextResponse } from 'next/server';
import { getSessionCompanyUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { sendReceiptViaWhatsApp } from '@/lib/whatsapp/send-receipt';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionCompanyUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactionId = params.id;

    const transaction = await prisma.transaction.findUnique({
      where: { 
        id: transactionId,
        companyId: session.companyId 
      },
      include: {
        vendor: true,
        expense: {
          include: {
            project: true,
            vendor: true
          }
        },
        account: true,
        fromAccount: true
      }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (!transaction.expense) {
      return NextResponse.json({ error: 'No expense record linked to this transaction' }, { status: 400 });
    }

    // Determine the phone number to use (prefer transaction.vendor, fallback to expense.vendor)
    const phone = transaction.vendor?.phone || 
                  (transaction.vendor as any)?.phoneNumber || 
                  transaction.expense.vendor?.phone || 
                  (transaction.expense.vendor as any)?.phoneNumber;
    
    if (!phone) {
      return NextResponse.json({ error: 'Vendor has no phone number' }, { status: 400 });
    }

    // Trigger WhatsApp with correct arguments: companyId, companyName, phone, expense
    const result = await sendReceiptViaWhatsApp(
      session.companyId,
      session.companyName || 'Shirkaddeena',
      phone,
      transaction.expense
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Receipt sent successfully via WhatsApp',
      result 
    });

  } catch (error: any) {
    console.error('Error resending WhatsApp receipt:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
