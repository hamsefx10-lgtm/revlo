import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

const MAX_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 });
        if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 4MB)' }, { status: 400 });
        if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Only PNG, JPG, WebP' }, { status: 400 });

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
        await mkdir(uploadDir, { recursive: true });

        const ext = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg';
        const fileName = `${session.user.id}-${Date.now()}${ext}`;
        const filePath = path.join(uploadDir, fileName);

        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        const publicUrl = `/uploads/avatars/${fileName}`;

        // Update company logoUrl
        await prisma.company.update({
            where: { id: session.user.companyId },
            data: { logoUrl: publicUrl }
        });

        return NextResponse.json({ success: true, url: publicUrl });
    } catch (error: any) {
        console.error('Avatar upload failed:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

// DELETE — Remove photo
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await prisma.company.update({
            where: { id: session.user.companyId },
            data: { logoUrl: null }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
