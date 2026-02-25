// app/api/customers/route.ts - Customer Management API Route (DEBUGGING)
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { isValidEmail } from '@/lib/utils'; // For email validation
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { getSessionCompanyId } from './auth';

// GET /api/customers - Soo deji dhammaan macaamiisha
export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    // Fetch customers and calculate outstanding debt for each
    const customers = await prisma.customer.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        companyName: true,
        phone: true,
        email: true,
        address: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        // Calculate outstanding debt (sum of DEBT_TAKEN - sum of DEBT_REPAID)
        transactions: {
          select: {
            amount: true,
            type: true,
          },
        },
      },
    });
    // Calculate outstandingDebt for each customer
  const processedCustomers = customers.map((cust: any) => {
      let debtTaken = 0;
      let debtRepaid = 0;
      for (const t of cust.transactions) {
        if (t.type === 'DEBT_TAKEN') debtTaken += Number(t.amount);
        if (t.type === 'DEBT_REPAID') debtRepaid += Number(t.amount); // DEBT_REPAID is now stored as positive
      }
      return {
        ...cust,
        outstandingDebt: debtTaken - debtRepaid,
      };
    });
    return NextResponse.json({ customers: processedCustomers }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka macaamiisha la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Ku dar macmiil cusub
export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const { 
      name, type, companyName, phone, email, address, notes
    } = await request.json();

    // 1. Xaqiijinta Input-ka
    if (!name || !type) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Magaca, Nooca.' },
        { status: 400 }
      );
    }
    if (type === 'Company' && !companyName) {
      return NextResponse.json(
        { message: 'Magaca shirkadda waa waajib haddii nooca uu yahay "Company".' },
        { status: 400 }
      );
    }
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { message: 'Fadlan geli email sax ah.' },
        { status: 400 }
      );
    }

    // Hubi haddii macmiilkan horey u jiray (magac + shirkad)
    const existingCustomer = await prisma.customer.findUnique({
      where: { 
        name_companyId: { 
          name: name, 
          companyId: companyId
        } 
      }, 
    });

    if (existingCustomer) {
      return NextResponse.json(
        { message: 'Macmiilkan horey ayuu u jiray.' },
        { status: 409 } // Conflict
      );
    }

    // Abuur macmiil cusub
    const newCustomer = await prisma.customer.create({
      data: {
        name,
        type,
        companyName: type === 'Company' ? companyName : null, 
        phone: phone || null,
        email: email || null,
        address: address || null,
        notes: notes || null,
        companyId,
      },
    });

    return NextResponse.json(
      { message: 'Macmiilka si guul leh ayaa loo daray!', customer: newCustomer },
      { status: 201 } 
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: `Cilad server ayaa dhacday: ${error.message || 'Fadlan isku day mar kale.'}` },
      { status: 500 }
    );
  }
}
