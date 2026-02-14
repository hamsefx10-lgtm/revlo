
import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';
import { BACKUP_DIR } from '@/lib/backup';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getSessionCompanyId();
    const filename = params.id;

    // Security check: prevent directory traversal
    const safeFilename = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, safeFilename);

    if (!fs.existsSync(filepath)) {
      return NextResponse.json(
        { success: false, message: 'Backup file not found' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filepath);

    // Create response with file stream
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
      },
    });

  } catch (error: any) {
    console.error('Error downloading backup:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to download backup', error: error.message },
      { status: 500 }
    );
  }
}
