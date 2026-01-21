import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { authenticator } from 'otplib';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { token, secret } = body;

    if (!token || !secret) {
        return NextResponse.json({ error: 'Missing token or secret' }, { status: 400 });
    }

    // Verify the token matches the secret
    const isValid = authenticator.verify({ token, secret });

    if (!isValid) {
        return NextResponse.json({ error: 'Invalid Code' }, { status: 400 });
    }

    // Save secret to user
    await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFASecret: secret },
    });

    return NextResponse.json({ success: true });
}
