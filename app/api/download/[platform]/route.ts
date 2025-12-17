// app/api/download/[platform]/route.ts - Download Desktop App Installer
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: Request,
  { params }: { params: { platform: string } }
) {
  try {
    const { platform } = params;

    // Map platform to file names
    const fileMap: Record<string, string> = {
      windows: 'Revlo Setup.exe',
      mac: 'Revlo.dmg',
      linux: 'Revlo.AppImage',
    };

    const fileName = fileMap[platform.toLowerCase()];

    if (!fileName) {
      return NextResponse.json(
        { message: 'Platform ma jiro' },
        { status: 400 }
      );
    }

    // Path to installer file (should be in dist folder after build)
    const filePath = join(process.cwd(), 'dist', fileName);

    // Check if file exists
    if (!existsSync(filePath)) {
      // Fix platform name for script
      const scriptPlatform = platform.toLowerCase() === 'windows' ? 'win' : platform.toLowerCase();
      
      return NextResponse.json(
        { 
          message: 'Installer-ka ma jiro. Fadlan hubi in build-ka la sameeyay.',
          hint: `Run: npm run electron:build:${scriptPlatform}`,
          steps: [
            '1. Hubi in Electron dependencies la install-gareeyay: npm install electron electron-builder --save-dev',
            '2. Build Next.js app: npm run build',
            `3. Build Desktop App: npm run electron:build:${scriptPlatform}`,
            '4. Installer-ka wuxuu ku jiri doonaa: dist/ folder-ka'
          ]
        },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await readFile(filePath);

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(fileBuffer);

    // Return file with appropriate headers
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': platform === 'windows' 
          ? 'application/octet-stream' 
          : platform === 'mac'
          ? 'application/x-apple-diskimage'
          : 'application/x-executable',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { message: 'Cilad ayaa dhacday marka installer-ka la soo dejinayay' },
      { status: 500 }
    );
  }
}

