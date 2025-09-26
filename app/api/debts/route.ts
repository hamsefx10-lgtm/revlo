// app/api/debts/route.ts - Debts API Route (Redirects to main reports API)
import { NextResponse } from 'next/server';

// GET /api/debts - Redirects to main reports debts API
export async function GET(request: Request) {
  try {
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

// POST /api/debts - Redirects to main reports debts API
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const redirectUrl = '/api/reports/debts';
    
    return NextResponse.redirect(new URL(redirectUrl, url.origin));
  } catch (error) {
    console.error('Redirect error:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
