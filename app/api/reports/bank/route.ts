import { NextResponse } from 'next/server';

export async function GET(request: Request) {
	// Tusaale: Return empty array or dummy data
	return NextResponse.json({ data: [] });
}
