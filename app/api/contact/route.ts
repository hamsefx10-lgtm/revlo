import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendContactFormEmail } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'Fadlan buuxi dhammaan beeraha waajibka ah.' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Fadlan geli email sax ah.' },
        { status: 400 }
      );
    }

    // Save to database
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    // Send email notification to hamsemoalin@gmail.com
    try {
      const emailSent = await sendContactFormEmail({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      
      if (emailSent) {
        console.log('✅ Email successfully sent to hamsemoalin@gmail.com');
      } else {
        console.warn('⚠️ Email sending failed, but message saved to database');
      }
    } catch (emailError) {
      // Log error but don't fail the request
      console.error('❌ Error sending email notification:', emailError);
      // Message is still saved to database even if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Fariintaada si guul leh ayaa loo diray! Waxaan ku soo jawaabi doonaa dhowaan.',
        data: contactMessage,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error saving contact message:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Cilad ayaa dhacday. Fadlan isku day mar kale.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication check here for admin access
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const read = searchParams.get('read');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (read !== null) {
      where.read = read === 'true';
    }

    const messages = await prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.contactMessage.count({ where });

    return NextResponse.json({
      success: true,
      data: messages,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching contact messages:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Cilad ayaa dhacday marka la soo gelinayay fariimaha.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Optional: Add authentication check here for admin access
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { id, read } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID-ka fariinta waa waajib.' },
        { status: 400 }
      );
    }

    const updatedMessage = await prisma.contactMessage.update({
      where: { id },
      data: { read: read !== undefined ? read : true },
    });

    return NextResponse.json({
      success: true,
      message: 'Fariinta si guul leh ayaa loo cusbooneysiiyay.',
      data: updatedMessage,
    });
  } catch (error: any) {
    console.error('Error updating contact message:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Cilad ayaa dhacday marka la cusbooneysiinayay fariinta.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

