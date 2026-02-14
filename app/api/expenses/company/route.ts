// Company Expenses API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

// GET /api/expenses/company - List all company expenses
export async function GET(request: Request) {
  try {
    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json(
        { message: 'Awood uma lihid. Fadlan soo gal.' },
        { status: 401 }
      );
    }
    const { companyId } = sessionData;
    const expenses = await prisma.expense.findMany({
      where: { companyId, projectId: null },
      orderBy: { expenseDate: 'desc' },
    });

    // Map to frontend format: convert expenseDate to date
    const mappedExpenses = expenses.map((exp: any) => ({
      ...exp,
      date: exp.expenseDate,
    }));

    return NextResponse.json({ expenses: mappedExpenses }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
  }
}

// POST /api/expenses/company - Add new company expense
export async function POST(request: Request) {
  try {
    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json(
        { message: 'Awood uma lihid. Fadlan soo gal.' },
        { status: 401 }
      );
    }
    const { companyId, userId } = sessionData;

    // Check if request contains FormData (file upload) or JSON
    const contentType = request.headers.get('content-type') || '';
    let reqBody: any;
    let receiptFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData with file upload
      const formData = await request.formData();

      // Extract receipt file if present
      const file = formData.get('receiptImage');
      if (file && file instanceof File) {
        receiptFile = file;
      }

      // Extract all other fields from FormData
      reqBody = {};
      for (const [key, value] of formData.entries()) {
        if (key !== 'receiptImage') {
          // Parse JSON strings and arrays
          if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
            try {
              reqBody[key] = JSON.parse(value);
            } catch {
              reqBody[key] = value;
            }
          } else {
            reqBody[key] = value;
          }
        }
      }
    } else {
      // Handle regular JSON request
      reqBody = await request.json();
    }

    // Save receipt image if provided
    let receiptUrl = reqBody.receiptUrl;
    if (receiptFile) {
      try {
        const { saveReceiptImage } = await import('@/lib/upload');
        receiptUrl = await saveReceiptImage(receiptFile);
      } catch (uploadError: any) {
        console.error('Receipt upload error:', uploadError);
        return NextResponse.json(
          { message: `Khalad sawirka rasiidka: ${uploadError.message}` },
          { status: 400 }
        );
      }
    }

    const {
      description,
      amount: rawAmount,
      category,
      subCategory,
      paidFrom,
      expenseDate,
      note,
      employeeId,
      laborPaidAmount: rawLaborPaid = 0,
      agreedWage: rawAgreedWage,
      startNewAgreement,
      customerId,
      // NEW: Material/Vendor fields
      vendorId,
      paymentStatus,
      paidAmount: rawPaidAmount,
      materials,
      invoiceNumber
    } = reqBody;

    // Convert string values from FormData to numbers
    const amount = typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount;
    const laborPaidAmount = typeof rawLaborPaid === 'string' ? parseFloat(rawLaborPaid) : rawLaborPaid;
    const agreedWage = typeof rawAgreedWage === 'string' ? parseFloat(rawAgreedWage) : rawAgreedWage;
    const paidAmount = typeof rawPaidAmount === 'string' ? parseFloat(rawPaidAmount) : rawPaidAmount;

    // General required fields
    if (!category) {
      return NextResponse.json({ message: 'Category is required.' }, { status: 400 });
    }
    if (!expenseDate) {
      return NextResponse.json({ message: 'Expense date is required.' }, { status: 400 });
    }

    // Company Labor specific validation
    if (category === 'Company Labor') {
      if (!employeeId) {
        return NextResponse.json({ message: 'Employee is required for Company Labor expense.' }, { status: 400 });
      }
      if (!agreedWage || agreedWage === undefined || agreedWage === null || agreedWage === '') {
        return NextResponse.json({ message: 'Agreed wage is required for Company Labor expense.' }, { status: 400 });
      }
      if (laborPaidAmount === undefined || laborPaidAmount === null || laborPaidAmount === '') {
        return NextResponse.json({ message: 'Paid amount for labor is required.' }, { status: 400 });
      }
      if (!paidFrom) {
        return NextResponse.json({ message: 'Account (paidFrom) is required for Company Labor expense.' }, { status: 400 });
      }
    } else if (category === 'Material') {
      // Material specific validation
      if (!vendorId) {
        return NextResponse.json({ message: 'Iibiyaha (vendorId) waa waajib.' }, { status: 400 });
      }
      if (!paymentStatus || !['PAID', 'UNPAID', 'PARTIAL'].includes(paymentStatus)) {
        return NextResponse.json({ message: 'Xaaladda lacag bixinta (paymentStatus) waa waajib.' }, { status: 400 });
      }
      if ((paymentStatus === 'PAID' || paymentStatus === 'PARTIAL') && !paidFrom) {
        return NextResponse.json({ message: 'Akoonka (paidFrom) waa waajib marka lacag la bixinayo.' }, { status: 400 });
      }
    } else {
      // For other categories, validate amount and paidFrom
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Category, Amount, PaidFrom, ExpenseDate.' }, { status: 400 });
      }
      if (!paidFrom) {
        return NextResponse.json({ message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Category, Amount, PaidFrom, ExpenseDate.' }, { status: 400 });
      }
    }

    let finalAmount = amount;
    let companyLabor;
    let existingLabor = null;

    if (category === 'Company Labor') {
      // Find existing labor record for this employee
      if (!startNewAgreement) {
        existingLabor = await prisma.companyLabor.findFirst({
          where: { employeeId, companyId },
          orderBy: { dateWorked: 'desc' },
        });
      }

      if (existingLabor) {
        // UPDATE existing record - add payment to existing paidAmount
        const currentPaidAmount = existingLabor.paidAmount !== null ?
          (typeof existingLabor.paidAmount === 'object' && 'toNumber' in existingLabor.paidAmount ?
            existingLabor.paidAmount.toNumber() : Number(existingLabor.paidAmount)) : 0;

        const newTotalPaid = currentPaidAmount + Number(laborPaidAmount);
        const agreedWageValue = existingLabor.agreedWage !== null ?
          (typeof existingLabor.agreedWage === 'object' && 'toNumber' in existingLabor.agreedWage ?
            existingLabor.agreedWage.toNumber() : Number(existingLabor.agreedWage)) : 0;
        const newRemaining = agreedWageValue - newTotalPaid;

        companyLabor = await prisma.companyLabor.update({
          where: { id: existingLabor.id },
          data: {
            paidAmount: newTotalPaid,
            remainingWage: newRemaining,
            // Update description if provided
            ...(description && { description }),
            // Update date if provided
            ...(expenseDate && { dateWorked: new Date(expenseDate) }),
          },
        });
        finalAmount = Number(laborPaidAmount);
      } else {
        // CREATE new record - first time working for company
        const agreedWageValue = reqBody.agreedWage ? Number(reqBody.agreedWage) : 0;
        const paidAmount = Number(laborPaidAmount);
        const remainingWage = agreedWageValue - paidAmount;

        companyLabor = await prisma.companyLabor.create({
          data: {
            companyId,
            employeeId,
            agreedWage: agreedWageValue,
            paidAmount,
            remainingWage,
            description,
            paidFrom,
            dateWorked: new Date(expenseDate),
          },
        });
        finalAmount = paidAmount;
      }
    }

    // 1. Create the expense (only for non-Labor categories or new Labor records)
    let newExpense = null;
    if (category !== 'Company Labor' || (category === 'Company Labor' && (!existingLabor || startNewAgreement))) {
      const safeDescription = description || note || 'Expense';
      // Determine safePaidFrom for UNPAID material
      const safePaidFrom = (category === 'Material' && paymentStatus === 'UNPAID') ? 'UNPAID' : paidFrom;

      newExpense = await prisma.expense.create({
        data: {
          description: safeDescription,
          amount: finalAmount.toString(),
          category,
          subCategory: subCategory || null,
          paidFrom: safePaidFrom,
          expenseDate: new Date(expenseDate),
          note: note?.trim() || null,
          approved: false,
          companyId,
          userId,
          employeeId: employeeId || undefined,
          receiptUrl: receiptUrl || undefined,
          // Store customerId for Debt expenses
          ...(customerId ? { customerId } : {}),
          // Store Vendor fields
          vendorId: vendorId || undefined,
          paymentStatus: paymentStatus || undefined,
          invoiceNumber: invoiceNumber || undefined,
          materials: materials || undefined,
        },
      });
    }

    // 2. Create a corresponding transaction (always for every expense)
    // Determine transaction type and amount
    let transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'DEBT_TAKEN' | 'DEBT_REPAID' | 'OTHER' = 'EXPENSE';
    let transactionAmount = -Math.abs(Number(finalAmount));
    let transactionCustomerId = undefined;
    let transactionVendorId = undefined;
    let tAccountId = paidFrom;

    if (category === 'Company Expense' && subCategory === 'Debt' && customerId) {
      // This is a customer loan - create DEBT_TAKEN transaction
      transactionType = 'DEBT_TAKEN';
      transactionCustomerId = customerId;
      transactionAmount = Math.abs(Number(finalAmount)); // Positive for DEBT_TAKEN
    } else if (category === 'Material') {
      transactionVendorId = vendorId;
      if (paymentStatus === 'UNPAID') {
        transactionType = 'DEBT_TAKEN';
        transactionAmount = Number(amount); // Full amount is what we owe (positive debt?) 
        // Wait, for Vendor: DEBT_TAKEN means we created a Payable. 
        // In other parts of the system, DEBT_TAKEN for vendor is positive? 
        // Let's check api/vendors/[id]/route.ts logic: "vendorOwesUs" vs "totalUnpaid".
        // Actually, usually Expense Transaction is negative (money out).
        // DEBT_TAKEN (Payable) implies NO money out yet.
        tAccountId = null; // No account affected
      } else if (paymentStatus === 'PARTIAL') {
        transactionType = 'DEBT_REPAID';
        transactionAmount = -Math.abs(Number(paidAmount));
      } else {
        // PAID
        transactionType = 'EXPENSE';
        transactionAmount = -Math.abs(Number(amount));
      }
    }

    await prisma.transaction.create({
      data: {
        description: description?.trim() || '',
        amount: transactionAmount,
        type: transactionType,
        transactionDate: new Date(expenseDate),
        note: note?.trim() || null,
        accountId: tAccountId,
        expenseId: newExpense?.id || null,
        employeeId: employeeId || undefined,
        customerId: transactionCustomerId,
        vendorId: transactionVendorId,
        userId,
        companyId,
      },
    });

    // 3. Decrement the account balance in real time
    if (tAccountId) {
      // Use transactionAmount since it's already negative for expenses/payments
      // But wait, validation (DEBT_TAKEN positive logic) might mess this up if we just use transactionAmount.
      // Logic: decrement by the amount PAID.
      const amountToDeduct = (category === 'Material' && paymentStatus === 'PARTIAL')
        ? Number(paidAmount)
        : (category === 'Material' && paymentStatus === 'UNPAID')
          ? 0
          : Number(finalAmount);

      if (amountToDeduct > 0) {
        await prisma.account.update({
          where: { id: tAccountId },
          data: {
            balance: { decrement: amountToDeduct },
          },
        });
      }
    }

    return NextResponse.json({
      expense: newExpense,
      companyLabor: companyLabor,
      message: existingLabor ? 'Payment added to existing company labor record' : category === 'Company Labor' ? 'New company labor record created' : 'Expense created'
    }, { status: 201 });
  } catch (error) {
    console.error('Company expense API error:', error);
    const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error);
    return NextResponse.json({ message: `Server error: ${errorMessage}` }, { status: 500 });
  }
}
