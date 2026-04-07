// app/api/projects/accounting/reports/debts/route.ts - Debts Report API Route (Redirects to main reports API)
import { NextResponse } from 'next/server';

// GET /api/projects/accounting/reports/debts - Redirects to main reports debts API

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Redirect to the main reports debts API to avoid duplication


    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const redirectUrl = `/api/reports/debts${searchParams ? `?${searchParams}` : ''}`;

    return NextResponse.redirect(new URL(redirectUrl, url.origin));
  } catch (error) {
    console.error('Redirect error:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
