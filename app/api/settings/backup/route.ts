// app/api/settings/backup/route.ts - Database Backup API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { exec } from 'child_process'; // For executing shell commands (e.g., pg_dump)
import { promisify } from 'util'; // To use exec with async/await
import fs from 'fs/promises'; // For file system operations

const execPromise = promisify(exec);

// GET /api/settings/backup - Soo deji taariikhda backups-ka (ama liiska backups-ka)
export async function GET(request: Request) {
  try {
    // Mustaqbalka, halkan waxaad ku dari doontaa authentication iyo authorization
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session || session.user?.role !== USER_ROLES.ADMIN) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 403 });
    // const companyId = session.user.companyId;

    // Halkan waxaad ka soo dejin kartaa diiwaanka backups-ka la sameeyay
    // Tusaale ahaan, haddii aad leedahay model 'BackupRecord' database-ka
    const backupRecords = [
      { id: 'bck001', date: '2025-07-20T10:00:00Z', type: 'Manual', status: 'Completed', fileName: 'revlo_backup_20250720.sql' },
      { id: 'bck002', date: '2025-07-19T03:00:00Z', type: 'Automatic', status: 'Completed', fileName: 'revlo_backup_20250719.sql' },
    ];

    return NextResponse.json({ backups: backupRecords }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka backups-ka la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// POST /api/settings/backup - Samee backup database-ka
export async function POST(request: Request) {
  try {
    // Mustaqbalka, halkan waxaad ku dari doontaa authentication iyo authorization
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session || session.user?.role !== USER_ROLES.ADMIN) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 403 });
    // const companyId = session.user.companyId;

    const { type = 'Manual' } = await request.json(); // Type: Manual or Automatic

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({ message: 'DATABASE_URL lama qeexin.' }, { status: 500 });
    }

    // Parse database URL to get connection details
    const url = new URL(dbUrl);
    const dbUser = url.username;
    const dbPassword = url.password;
    const dbHost = url.hostname;
    const dbPort = url.port || '5432';
    const dbName = url.pathname.substring(1); // Remove leading slash

    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
    const backupFileName = `revlo_backup_${timestamp}.sql`;
    const backupFilePath = `/tmp/${backupFileName}`; // Ku kaydi meel ku meel gaar ah server-ka

    // Execute pg_dump command (for PostgreSQL)
    // MUHIIM: pg_dump waa inuu ku rakiban yahay server-kaaga
    const command = `PGPASSWORD=${dbPassword} pg_dump -U ${dbUser} -h ${dbHost} -p ${dbPort} -F p -v -f ${backupFilePath} ${dbName}`;

    console.log(`DEBUG: Bilaabaya backup database-ka: ${backupFileName}`);
    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      console.error('Cilad pg_dump ah:', stderr);
      return NextResponse.json({ message: `Cilad backup ah: ${stderr}` }, { status: 500 });
    }

    console.log(`DEBUG: Backup si guul leh ayaa loo sameeyay: ${backupFileName}`);

    // Mustaqbalka, halkan waxaad ku shubi doontaa faylka backup-ka ah meel daruur ah (Cloud Storage)
    // tusaale, Google Cloud Storage, AWS S3, iwm.
    // Kadibna waxaad diiwaan gelin doontaa backup-kan database-kaaga.

    // Tirtir faylka ku meel gaarka ah ka dib markii la shubo daruurta
    await fs.unlink(backupFilePath);

    return NextResponse.json(
      { message: `Backup database-ka si guul leh ayaa loo sameeyay: ${backupFileName}`, fileName: backupFileName },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka backup-ka la samaynayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
