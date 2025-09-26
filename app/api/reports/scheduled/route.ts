// app/api/reports/scheduled/route.ts - Scheduled Reports API
import { NextResponse } from 'next/server';
import { reportScheduler } from '@/lib/scheduler';
import { getSessionCompanyId } from '@/app/api/accounting/reports/auth';

// GET /api/reports/scheduled - Get scheduled reports
export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const scheduledReports = reportScheduler.getScheduledReports(companyId);
    
    return NextResponse.json({ scheduledReports }, { status: 200 });
  } catch (error: any) {
    console.error('Scheduled reports API error:', error);
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { message: 'Awood uma lihid. Fadlan dib u gal.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// POST /api/reports/scheduled - Create scheduled report
export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const {
      name,
      type,
      reportType,
      emailRecipients,
      enabled = true,
      userId,
      customReportId,
      filters
    } = await request.json();

    if (!name || !type || !reportType || !emailRecipients?.length) {
      return NextResponse.json(
        { message: 'Magaca, nooca, iyo email-ka waa lagama maarmaan.' },
        { status: 400 }
      );
    }

    const scheduledReport = reportScheduler.addScheduledReport({
      name,
      type,
      reportType,
      companyId,
      userId,
      emailRecipients,
      enabled,
      customReportId,
      filters
    });

    return NextResponse.json({ scheduledReport }, { status: 201 });
  } catch (error: any) {
    console.error('Create scheduled report error:', error);
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { message: 'Awood uma lihid. Fadlan dib u gal.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// PUT /api/reports/scheduled/[id] - Update scheduled report
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getSessionCompanyId();
    const { id } = params;
    const updates = await request.json();

    reportScheduler.updateScheduledReport(companyId, id, updates);

    return NextResponse.json({ message: 'Scheduled report updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Update scheduled report error:', error);
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { message: 'Awood uma lihid. Fadlan dib u gal.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/scheduled/[id] - Delete scheduled report
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getSessionCompanyId();
    const { id } = params;

    reportScheduler.deleteScheduledReport(companyId, id);

    return NextResponse.json({ message: 'Scheduled report deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete scheduled report error:', error);
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { message: 'Awood uma lihid. Fadlan dib u gal.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
