// app/api/vehicles/route.ts - Vehicles API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '../expenses/auth';

// GET /api/vehicles - Get all vehicles for the company
export async function GET(request: Request) {
  try {
    const { companyId } = await getSessionCompanyUser();
    const vehicles = await prisma.fixedAsset.findMany({
      where: { companyId, type: 'Vehicle' },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ vehicles }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// POST /api/vehicles - Add a new vehicle
export async function POST(request: Request) {
  try {
    const { companyId } = await getSessionCompanyUser();
    const { name, plate } = await request.json();
    if (!name || !plate || typeof name !== 'string' || typeof plate !== 'string' || !name.trim() || !plate.trim()) {
      return NextResponse.json(
        { message: 'Fadlan buuxi magaca iyo plate-ka.' },
        { status: 400 }
      );
    }
    // Check if vehicle already exists for this company
    const existingVehicle = await prisma.fixedAsset.findFirst({
      where: { name: name.trim(), companyId, type: 'Vehicle' },
    });
    if (existingVehicle) {
      return NextResponse.json(
        { message: 'Gaarigan horey ayuu u diiwaangashanaa.' },
        { status: 409 }
      );
    }
    const newVehicle = await prisma.fixedAsset.create({
      data: {
        name: name.trim(),
        type: 'Vehicle',
        value: 0,
        purchaseDate: new Date(),
        assignedTo: plate.trim(), // Plate-ka waxaa lagu kaydinayaa assignedTo
        status: 'Active',
        depreciationRate: 0,
        currentBookValue: 0,
        companyId,
      },
    });
    return NextResponse.json({ message: 'Gaariga waa la daray!', vehicle: newVehicle }, { status: 201 });
  } catch (error) {
    console.error('Vehicles API error:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
