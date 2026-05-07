import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { companyId } = body;

    if (!companyId || companyId === 'UNKNOWN') {
      const firstCompany = await prisma.company.findFirst();
      if (!firstCompany) {
         return NextResponse.json({ error: 'Ma jiro shirkad diiwaangashan!' }, { status: 400 });
      }
      companyId = firstCompany.id;
    }

    let settings = await prisma.personalizationSettings.findUnique({
      where: { companyId }
    });

    // Merge all incoming security fields into enabledFeatures
    const securityFields = ['requirePasswordOnRefunds', 'autoLogout', 'require2FA', 'registerAlertsEnabled', 'registerAlertsEmail'];

    if (!settings) {
      const features: Record<string, any> = {};
      securityFields.forEach(field => {
        if (body[field] !== undefined) features[field] = body[field];
      });

      settings = await prisma.personalizationSettings.create({
        data: {
          companyId,
          enabledFeatures: features
        }
      });
    } else {
      const features = (settings.enabledFeatures as any) || {};
      securityFields.forEach(field => {
        if (body[field] !== undefined) features[field] = body[field];
      });
      
      settings = await prisma.personalizationSettings.update({
        where: { companyId },
        data: { enabledFeatures: features }
      });
    }

    return NextResponse.json({ success: true, features: settings.enabledFeatures });
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

