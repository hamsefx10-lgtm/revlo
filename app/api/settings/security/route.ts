import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    let { companyId, registerAlertsEnabled, registerAlertsEmail } = await req.json();

    if (!companyId || companyId === 'UNKNOWN') {
      const firstCompany = await prisma.company.findFirst();
      if (!firstCompany) {
         return NextResponse.json({ error: 'Ma jiro shirkad diiwaangashan! Fadlan shirkad samee horta.' }, { status: 400 });
      }
      companyId = firstCompany.id;
    }

    let settings = await prisma.personalizationSettings.findUnique({
      where: { companyId }
    });

    if (!settings) {
      settings = await prisma.personalizationSettings.create({
        data: {
          companyId,
          enabledFeatures: { 
            registerAlertsEnabled: registerAlertsEnabled || false,
            registerAlertsEmail: registerAlertsEmail || null,
          }
        }
      });
    } else {
      const features = (settings.enabledFeatures as any) || {};
      if (registerAlertsEnabled !== undefined) features.registerAlertsEnabled = registerAlertsEnabled;
      if (registerAlertsEmail !== undefined) features.registerAlertsEmail = registerAlertsEmail;
      
      settings = await prisma.personalizationSettings.update({
        where: { companyId },
        data: { enabledFeatures: features }
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Save Security Settings Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    let companyId = url.searchParams.get('companyId');
    
    if (!companyId || companyId === 'UNKNOWN') {
      const firstCompany = await prisma.company.findFirst();
      if (!firstCompany) {
         return NextResponse.json({ success: true, features: {} });
      }
      companyId = firstCompany.id;
    }

    const settings = await prisma.personalizationSettings.findUnique({
      where: { companyId }
    });

    const features = settings?.enabledFeatures as any || {};
    return NextResponse.json({ success: true, features });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
