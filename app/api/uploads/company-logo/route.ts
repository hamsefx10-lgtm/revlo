import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { InputValidator } from '@/lib/input-validator';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const MAX_LOGO_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'Logo file is required.' }, { status: 400 });
    }

    const validation = InputValidator.validateFile(file, {
      maxSize: MAX_LOGO_SIZE,
      allowedTypes: ALLOWED_TYPES,
      allowedExtensions: ALLOWED_EXTENSIONS,
    });

    if (!validation.isValid) {
      return NextResponse.json({ message: validation.errors.join(', ') }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'company-logos');
    await mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const ext = path.extname(file.name) || '.png';
    const fileName = `${session.user.companyId}-${timestamp}-${randomId}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    const publicUrl = `/uploads/company-logos/${fileName}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('Company logo upload failed:', error);
    return NextResponse.json({ message: 'Failed to upload logo.' }, { status: 500 });
  }
}


