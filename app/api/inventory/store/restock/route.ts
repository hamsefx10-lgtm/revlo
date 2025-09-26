// app/api/inventory/store/restock/route.ts - Inventory Restock API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants

// POST /api/inventory/store/restock - Dib u buuxi alaabta bakhaarka
export async function POST(request: Request) {
  try {
    // Mustaqbalka, halkan waxaad ku dari doontaa authentication iyo authorization
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session || !isManagerOrAdmin(session.user.role)) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 403 });
    // const companyId = session.user.companyId;
    // const userId = session.user.id; // User-ka diiwaan geliyay

    const { itemId, quantity, purchasePrice } = await request.json();

    // 1. Xaqiijinta Input-ka
    if (!itemId || typeof quantity !== 'number' || quantity <= 0 || typeof purchasePrice !== 'number' || purchasePrice < 0) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Alaabta ID, Quantity, Qiimaha Gadashada.' },
        { status: 400 }
      );
    }

    // Hubi in alaabtu jirto
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      // and: { companyId: companyId } // Mustaqbalka, ku dar filter-kan
    });

    if (!existingItem) {
      return NextResponse.json({ message: 'Alaabta lama helin.' }, { status: 404 });
    }

    // Cusboonaysii stock-ga iyo qiimaha gadashada
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        inStock: existingItem.inStock + quantity, // Ku dar quantity cusub
        purchasePrice: purchasePrice, // Cusboonaysii qiimaha gadashada (haddii uu isbeddelay)
        lastUpdated: new Date(), // Cusboonaysii taariikhda
      },
    });

    return NextResponse.json(
      { message: `Alaabta '${updatedItem.name}' si guul leh ayaa dib loogu buuxiyay!`, item: updatedItem },
      { status: 200 } // OK
    );
  } catch (error) {
    const requestData = await request.json();
    console.error(`Cilad ayaa dhacday marka alaabta ${requestData.itemId} dib loo buuxinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
