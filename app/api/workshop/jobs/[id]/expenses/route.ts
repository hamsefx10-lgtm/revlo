import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionCompanyUser();
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { companyId, userId } = session;

    const body = await request.json();
    const { expenseType, description, amount, accountId, employeeId, vendorId, items, stockItems } = body;
    const jobId = params.id;

    // 1. Validate Job
    const job = await prisma.workshopJob.findUnique({ where: { id: jobId, companyId } });
    if (!job) return NextResponse.json({ message: 'Job not found' }, { status: 404 });

    let finalAmount = Number(amount) || 0;

    // 2. Handle 'LABOR' Type
    if (expenseType === 'LABOR') {
      if (accountId && finalAmount > 0) {
        // Check balance and deduct
        const account = await prisma.account.findUnique({ where: { id: accountId } });
        if (!account || Number(account.balance) < finalAmount) {
           return NextResponse.json({ message: 'Lacag kuma filna Account-kan (Insufficient funds)' }, { status: 400 });
        }
        await prisma.account.update({
          where: { id: accountId },
          data: { balance: { decrement: finalAmount } }
        });
      }

      const expense = await prisma.expense.create({
        data: {
          description,
          amount: new Decimal(finalAmount),
          category: 'LABOR',
          subCategory: 'Workshop Labor',
          paidFrom: accountId || 'UNPAID', // Or some logic
          accountId: accountId || null,
          employeeId: employeeId || null,
          companyId,
          userId,
          workshopJobId: jobId,
          projectId: job.projectId || null,
        }
      });

      if (accountId && finalAmount > 0) {
        await prisma.transaction.create({
          data: {
            description: description || 'Workshop Labor Cost',
            amount: new Decimal(finalAmount),
            type: 'EXPENSE',
            accountId,
            expenseId: expense.id,
            employeeId: employeeId || null,
            projectId: job.projectId || null,
            companyId,
            userId,
            category: 'LABOR'
          }
        });
      }

      // Update Job Labor Cost
      await prisma.workshopJob.update({
        where: { id: jobId },
        data: { 
          laborCost: { increment: finalAmount },
          totalCost: { increment: finalAmount }
        }
      });
    }

    // 3. Handle 'MATERIAL_NEW' Type (Bought from outside)
    else if (expenseType === 'MATERIAL_NEW') {
      if (!accountId) return NextResponse.json({ message: 'Fadlan dooro Account (Payment Account required)' }, { status: 400 });
      
      const account = await prisma.account.findUnique({ where: { id: accountId } });
      if (!account || Number(account.balance) < finalAmount) {
         return NextResponse.json({ message: 'Lacag kuma filna Account-kan (Insufficient funds)' }, { status: 400 });
      }

      await prisma.account.update({
        where: { id: accountId },
        data: { balance: { decrement: finalAmount } }
      });

      const expense = await prisma.expense.create({
        data: {
          description: description || 'Workshop Material Purchase',
          amount: new Decimal(finalAmount),
          category: 'MATERIAL',
          subCategory: 'Workshop Material',
          paidFrom: accountId,
          accountId,
          vendorId: vendorId || null,
          companyId,
          userId,
          workshopJobId: jobId,
          projectId: job.projectId || null,
          materials: items || [] // The AI receipt array
        }
      });

      await prisma.transaction.create({
        data: {
          description: description || 'Workshop Material Cost',
          amount: new Decimal(finalAmount),
          type: 'EXPENSE',
          accountId,
          expenseId: expense.id,
          vendorId: vendorId || null,
          projectId: job.projectId || null,
          companyId,
          userId,
          category: 'MATERIAL'
        }
      });

      // Update Job Material Cost
      await prisma.workshopJob.update({
        where: { id: jobId },
        data: { 
          materialCost: { increment: finalAmount },
          totalCost: { increment: finalAmount }
        }
      });
    }

    // 4. Handle 'MATERIAL_STOCK' Type (Picked from existing Inventory)
    else if (expenseType === 'MATERIAL_STOCK') {
      // stockItems: { productId: string, qty: number }[]
      if (!stockItems || !stockItems.length) return NextResponse.json({ message: 'No items selected' }, { status: 400 });

      let calculatedTotalCost = 0;
      const consumedMaterials = [];

      for (const item of stockItems) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stock < item.qty) {
          throw new Error(`Kuma filna Stock-ga: ${product?.name || 'Item'}`);
        }

        const cost = product.costPrice * item.qty;
        calculatedTotalCost += cost;

        // Decrement stock
        await prisma.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.qty } }
        });

        consumedMaterials.push({
          name: product.name,
          qty: item.qty,
          unitCost: product.costPrice,
          totalCost: cost
        });
      }

      const expense = await prisma.expense.create({
        data: {
          description: 'Materials picking from Stock',
          amount: new Decimal(calculatedTotalCost),
          category: 'MATERIAL',
          subCategory: 'Internal Stock Transfer',
          paidFrom: 'INTERNAL_STOCK',
          companyId,
          userId,
          workshopJobId: jobId,
          projectId: job.projectId || null,
          materials: consumedMaterials
        }
      });

      await prisma.transaction.create({
        data: {
          description: 'Internal Stock Transfer to Workshop',
          amount: new Decimal(calculatedTotalCost),
          type: 'EXPENSE',
          expenseId: expense.id,
          projectId: job.projectId || null,
          companyId,
          userId,
          category: 'MATERIAL_STOCK'
        }
      });

      // Update Job Material Cost
      await prisma.workshopJob.update({
        where: { id: jobId },
        data: { 
          materialCost: { increment: calculatedTotalCost },
          totalCost: { increment: calculatedTotalCost }
        }
      });
    }
    
    // 5. Handle 'TRANSPORT' Type
    else if (expenseType === 'TRANSPORT' || expenseType === 'SERVICE') {
      if (!accountId) return NextResponse.json({ message: 'Fadlan dooro Account (Payment Account required)' }, { status: 400 });
      
      const account = await prisma.account.findUnique({ where: { id: accountId } });
      if (!account || Number(account.balance) < finalAmount) {
         return NextResponse.json({ message: 'Lacag kuma filna Account-kan (Insufficient funds)' }, { status: 400 });
      }

      await prisma.account.update({
        where: { id: accountId },
        data: { balance: { decrement: finalAmount } }
      });

      const expense = await prisma.expense.create({
        data: {
          description: description || `Workshop ${expenseType}`,
          amount: new Decimal(finalAmount),
          category: expenseType,
          subCategory: `Workshop ${expenseType}`,
          paidFrom: accountId,
          accountId,
          companyId,
          userId,
          workshopJobId: jobId,
          projectId: job.projectId || null,
        }
      });

      await prisma.transaction.create({
        data: {
          description: description || `Workshop ${expenseType} Cost`,
          amount: new Decimal(finalAmount),
          type: 'EXPENSE',
          accountId,
          expenseId: expense.id,
          projectId: job.projectId || null,
          companyId,
          userId,
          category: expenseType
        }
      });

      // Update Job Overhead Cost
      await prisma.workshopJob.update({
        where: { id: jobId },
        data: { 
          overheadCost: { increment: finalAmount },
          totalCost: { increment: finalAmount }
        }
      });
    }

    else {
      return NextResponse.json({ message: 'Invalid expense type' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Expense recorded successfully' });
  } catch (error: any) {
    console.error('Error adding workshop expense:', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
