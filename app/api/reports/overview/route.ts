import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	// Tusaale: Return empty array or dummy data
	return NextResponse.json({ data: [] });
}
