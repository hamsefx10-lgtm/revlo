
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export async function createBackup(name: string, type: string = 'full') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${name.replace(/\s+/g, '_')}-${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Get database URL from environment
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('DATABASE_URL is not defined');
    }

    // Prepare pg_dump command
    // Note: We use "pg_dump" directly. This requires pg_dump to be in the system PATH.
    // For specific schemas or data only, flags can be added here.
    const command = `pg_dump "${dbUrl}" --file "${filepath}" --format=plain --no-owner --no-acl`;

    try {
        const { stdout, stderr } = await execAsync(command);

        const stats = fs.statSync(filepath);

        return {
            success: true,
            filename,
            filepath,
            size: stats.size,
            stdout,
            stderr
        };
    } catch (error: any) {
        console.error('Backup failed:', error);
        throw new Error(`Backup creation failed: ${error.message}`);
    }
}

export function listBackups() {
    if (!fs.existsSync(BACKUP_DIR)) {
        return [];
    }

    const files = fs.readdirSync(BACKUP_DIR).filter(file => file.endsWith('.sql'));

    return files.map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        return {
            name: file,
            size: stats.size,
            createdAt: stats.birthtime,
            path: path.join(BACKUP_DIR, file)
        };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
