
import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';
import { createBackup, listBackups, BACKUP_DIR } from '@/lib/backup';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();

    // Get real files from backup directory
    const files = listBackups();

    const backups = files.map((file, index) => ({
      id: file.name, // Use filename as ID
      name: file.name,
      type: file.name.includes('incremental') ? 'incremental' : 'full',
      size: file.size,
      createdAt: new Date(file.createdAt),
      status: 'completed', // Existing files are completed
      description: 'System Backup',
      createdBy: 'System',
      tables: ['All'], // Full backup by default
      recordCount: 0 // Cannot determine without parsing
    }));

    return NextResponse.json({
      success: true,
      backups,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('Error fetching backups:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch backups', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const body = await request.json();

    const { name, type, description, includeTables } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Backup name is required' },
        { status: 400 }
      );
    }

    console.log(`Creating real backup: ${name} for company ${companyId}`);

    // Call the real backup utility
    const result = await createBackup(name, type);

    const newBackup = {
      id: result.filename,
      name: result.filename,
      type: type || 'full',
      size: result.size,
      createdAt: new Date(),
      status: 'completed',
      description: description || 'Manual Backup',
      createdBy: 'Admin',
      tables: ['All'],
      recordCount: 0
    };

    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      backup: newBackup
    });

  } catch (error: any) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create backup', error: error.message },
      { status: 500 }
    );
  }
}

