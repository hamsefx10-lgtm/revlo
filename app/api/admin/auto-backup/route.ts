import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { sendEmail } from '@/lib/email';
import zlib from 'zlib';
import { google } from 'googleapis';
import { Readable } from 'stream';

// Optional: Security token for Cron Job
const CRON_SECRET = process.env.CRON_SECRET || 'revlo-cron-secret-123';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (token !== CRON_SECRET && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized CRON Trigger' }, { status: 401 });
    }

    const settingsList = await prisma.personalizationSettings.findMany();
    let backupEmail = process.env.MASTER_BACKUP_EMAIL || ''; 
    let driveFolderId = '';
    let googleClientEmail = '';
    let googlePrivateKey = '';
    
    for (const setting of settingsList) {
      if (setting.enabledFeatures && typeof setting.enabledFeatures === 'object') {
        const features = setting.enabledFeatures as any;
        if (features.backupEmail) backupEmail = features.backupEmail;
        if (features.driveFolderId) driveFolderId = features.driveFolderId;
        if (features.googleClientEmail) googleClientEmail = features.googleClientEmail;
        if (features.googlePrivateKey) googlePrivateKey = features.googlePrivateKey;
        if (backupEmail) break;
      }
    }

    if (!backupEmail) {
      return NextResponse.json({ error: 'Fadlan ku xir Email-kaaga dhanka (Settings > Backup) kahor intaadan soo wicin.' }, { status: 400 });
    }

    const backupData: Record<string, any[]> = {};
    const models = Prisma.dmmf.datamodel.models;

    // ⚡ Xawaaraha ugu sareeya (Maximum Speed): Fetch all tables concurrently
    await Promise.all(models.map(async (model) => {
      const delegateName = model.name.charAt(0).toLowerCase() + model.name.slice(1);
      if ((prisma as any)[delegateName]) {
        try {
          const rows = await (prisma as any)[delegateName].findMany();
          backupData[model.name] = rows;
        } catch (e: any) {
          console.warn(`Could not backup model ${model.name}:`, e.message);
        }
      }
    }));

    const jsonString = JSON.stringify(backupData);
    const compressedBuffer = zlib.gzipSync(Buffer.from(jsonString, 'utf-8'));
    
    const dateStr = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
    const filename = `REVLO_CLOUD_BACKUP_${dateStr}.json.gz`;

    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2b6cb0; text-align: center;">☁️ REVLO Cloud Backup Agent</h2>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: #166534; margin-top: 0;">✅ Faylkii Si Guul Leh Ayuu Ku Tagay Drive!</h3>
            <p style="color: #15803d; margin-bottom: 0;">Xogtii shirkadda waa la sugay (Secured), si toos ah ayaadna uga furi kartaa shabakadda Google Cloud.</p>
        </div>
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><b>📁 Magaca Faylka:</b> ${filename}</p>
          <p style="margin: 5px 0;"><b>📊 Xajmiga Cufan:</b> ${(compressedBuffer.length / 1024 / 1024).toFixed(2)} MB</p>
        </div>
    `;

    // Attempt Google Drive Upload if configured
    let emailAttachments: any[] = [];
    let returnedDriveLink: string | null = null;
    if (driveFolderId && googleClientEmail && googlePrivateKey) {
        try {
            // FADLAN: Parse if the user accidentally pasted the entire JSON file!
            let finalPrivateKey = googlePrivateKey;
            try {
                if (googlePrivateKey.trim().startsWith('{')) {
                    const parsedObj = JSON.parse(googlePrivateKey);
                    if (parsedObj.private_key) {
                        finalPrivateKey = parsedObj.private_key;
                    }
                    // Extract client_email too just in case they typed it wrong but pasted the JSON!
                    if (parsedObj.client_email && googleClientEmail !== parsedObj.client_email) {
                        googleClientEmail = parsedObj.client_email;
                    }
                }
            } catch(e) { /* ignore, it's just the raw string */ }

            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: googleClientEmail,
                    private_key: finalPrivateKey.replace(/\\n/g, '\n')
                },
                scopes: ['https://www.googleapis.com/auth/drive.file']
            });

            const drive = google.drive({ version: 'v3', auth });
            
            const bufferStream = new Readable();
            bufferStream.push(compressedBuffer);
            bufferStream.push(null);

            const fileMetadata = {
                name: filename,
                parents: [driveFolderId]
            };
            const media = {
                mimeType: 'application/gzip',
                body: bufferStream
            };

            const driveRes = await drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, webViewLink'
            });
            
            returnedDriveLink = driveRes.data.webViewLink || null;

            html += `
              <div style="text-align: center; margin-top: 30px;">
                <a href="${driveRes.data.webViewLink}" style="background-color: #38a169; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
                   ☁️ Taabo Halkan si aad uga rogto Google Drive
                </a>
              </div>
            `;
            console.log('Successfully uploaded to Google Drive:', driveRes.data.id);
        } catch (driveErr: any) {
            console.error('Google Drive Upload Failed:', driveErr);
            html += `<p style="color: red; font-size: 12px;">Digniin: Google Drive wuu fashilmay (${driveErr.message}). Sidaa darted faylka waa lasoo lifaaqay.</p>`;
            emailAttachments = [{ filename, content: compressedBuffer.toString('base64') }];
        }
    } else {
        // Fallback to normal email attachment if no Google Drive Config
        emailAttachments = [{ filename, content: compressedBuffer.toString('base64') }];
    }

    html += `</div>`;

    const emailSent = await sendEmail({
      to: backupEmail,
      subject: `✅ REVLO Cloud Backup Successful - ${new Date().toLocaleDateString()}`,
      html: html,
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined
    });

    if (!emailSent) {
      // If email fails, don't crash the whole process if Drive succeeded!
      if (returnedDriveLink) {
          return NextResponse.json({ 
              success: true, 
              message: `Backup ku wuxuu galay Drive, laakiin Email-ka (${backupEmail}) cilad ayaa ka dhacday (Resend Error).`, 
              driveLink: returnedDriveLink 
          });
      }
      return NextResponse.json({ error: 'Failed to send backup notification via Email/Resend' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Backup process completed and notified ${backupEmail}`, driveLink: returnedDriveLink });

  } catch (error: any) {
    console.error('Cloud Backup Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
