import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateSecret, generateKeyUri } from '@/lib/security';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = generateSecret();
    const otpauth = generateKeyUri(session.user.email, secret);

    return NextResponse.json({ secret, otpauth });
}
