// Project Expenses API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

// GET /api/expenses/project - List all project expenses
export async function GET(request: Request) {
    try {
        const sessionUser = await getSessionCompanyUser() as { companyId: string; userId: string } | null;
        if (!sessionUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { companyId } = sessionUser;
        const expenses = await prisma.expense.findMany({
            where: { companyId, projectId: { not: null } },
            orderBy: { expenseDate: 'desc' },
        });
        return NextResponse.json({ expenses }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Server error.' }, { status: 500 });
    }
}

// POST /api/expenses/project - Add new project expense
export async function POST(request: Request) {
    try {
        const sessionUser = await getSessionCompanyUser() as { companyId: string; userId: string } | null;
        if (!sessionUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { companyId, userId } = sessionUser;

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
            projectId,
            employeeId,
            laborPaidAmount: rawLaborPaid = 0,
            employeeName,
            transportType,
            consultantName,
            consultancyType,
            consultancyFee: rawConsultancyFee,
            equipmentName,
            rentalPeriod,
            rentalFee: rawRentalFee,
            supplierName,
            bankAccountId,
            agreedWage: rawAgreedWage,
            invoiceNumber,
            materialDate,
            paidAmount: rawPaidAmount, // NEW: Extract paidAmount
            vendorId, // NEW: Extract vendorId directly
            paymentStatus, // NEW: Extract paymentStatus directly
            startNewAgreement, // NEW: Extract startNewAgreement
        } = reqBody;

        // Convert string values from FormData to numbers
        const amount = typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount;
        const laborPaidAmount = typeof rawLaborPaid === 'string' ? parseFloat(rawLaborPaid) : rawLaborPaid;
        const agreedWage = typeof rawAgreedWage === 'string' ? parseFloat(rawAgreedWage) : rawAgreedWage;
        const consultancyFee = typeof rawConsultancyFee === 'string' ? parseFloat(rawConsultancyFee) : rawConsultancyFee;
        const rentalFee = typeof rawRentalFee === 'string' ? parseFloat(rawRentalFee) : rawRentalFee;
        const paidAmount = typeof rawPaidAmount === 'string' ? parseFloat(rawPaidAmount) : rawPaidAmount; // Parse paidAmount

        // General required fields
        if (!category) {
            return NextResponse.json({ message: 'Category is required.' }, { status: 400 });
        }
        if (!amount) {
            return NextResponse.json({ message: 'Amount is required.' }, { status: 400 });
        }
        // For project expenses, paidFrom is required only when a payment is made (not for unpaid vendor materials)
        // We'll validate category-specific below instead of globally here
        if (!expenseDate) {
            return NextResponse.json({ message: 'Expense date is required.' }, { status: 400 });
        }

        // Category-specific validation
        if (category === 'Transport' && !transportType) {
            return NextResponse.json({ message: 'Nooca gaadiidka waa waajib.' }, { status: 400 });
        }

        if (category === 'Labor') {
            if (!employeeId) {
                return NextResponse.json({ message: 'Employee is required for Labor expense.' }, { status: 400 });
            }
            if (!projectId) {
                return NextResponse.json({ message: 'Project is required for Labor expense.' }, { status: 400 });
            }
            if (!agreedWage || agreedWage === undefined || agreedWage === null || agreedWage === '') {
                return NextResponse.json({ message: 'Agreed wage is required for Labor expense.' }, { status: 400 });
            }
            if (laborPaidAmount === undefined || laborPaidAmount === null || laborPaidAmount === '') {
                return NextResponse.json({ message: 'Paid amount for labor is required.' }, { status: 400 });
            }
            if (!paidFrom) {
                return NextResponse.json({ message: 'Account (paidFrom) is required for Labor expense.' }, { status: 400 });
            }
            if (!expenseDate) {
                return NextResponse.json({ message: 'Date worked is required for Labor expense.' }, { status: 400 });
            }
        }

        if (category === 'Material') {
            if (!projectId) {
                return NextResponse.json({ message: 'Project is required for Material expense.' }, { status: 400 });
            }
            if (!Array.isArray(reqBody.materials) || reqBody.materials.length === 0) {
                return NextResponse.json({ message: 'At least one material is required for Material expense.' }, { status: 400 });
            }
            for (const mat of reqBody.materials) {
                if (!mat.name || !mat.qty || !mat.price || !mat.unit) {
                    return NextResponse.json({ message: 'Material name, quantity, price, and unit are required for each material.' }, { status: 400 });
                }
            }
            // Vendor payment fields
            if (!vendorId) {
                return NextResponse.json({ message: 'Iibiyaha (vendorId) waa waajib.' }, { status: 400 });
            }
            if (!paymentStatus || !['PAID', 'UNPAID', 'PARTIAL'].includes(paymentStatus)) { // FIXED: Added PARTIAL
                return NextResponse.json({ message: 'Xaaladda lacag bixinta (paymentStatus) waa waajib.' }, { status: 400 });
            }
            // Validate paidFrom for PAID and PARTIAL
            if ((paymentStatus === 'PAID' || paymentStatus === 'PARTIAL') && !paidFrom) {
                return NextResponse.json({ message: 'Akoonka (paidFrom) waa waajib marka lacag la bixinayo.' }, { status: 400 });
            }
        }

        if (category === 'Equipment Rental') {
            if (!equipmentName || !rentalPeriod || !rentalFee || !supplierName || !projectId || !bankAccountId) {
                return NextResponse.json({ message: 'Dhammaan fields-ka Equipment Rental waa waajib.' }, { status: 400 });
            }
        }

        if (category === 'Utilities') {
            if (!projectId) {
                return NextResponse.json({ message: 'Mashruuca waa waajib.' }, { status: 400 });
            }
            if (!description || !description.trim()) {
                return NextResponse.json({ message: 'Faahfaahinta adeegga waa waajib.' }, { status: 400 });
            }
            if (!paidFrom) {
                return NextResponse.json({ message: 'Akoonka (paidFrom) waa waajib.' }, { status: 400 });
            }
        }

        let finalWage = amount;
        let projectLabor;
        let existingLabor = null;

        if (category === 'Labor') {
            // Find existing labor record for this employee/project
            if (!startNewAgreement) {
                existingLabor = await prisma.projectLabor.findFirst({
                    where: { employeeId, projectId },
                    orderBy: { dateWorked: 'desc' },
                });
            }

            if (existingLabor) {
                // UPDATE existing record - add payment to existing paidAmount
                const currentPaidAmount = existingLabor.paidAmount !== null ?
                    (typeof existingLabor.paidAmount === 'object' && 'toNumber' in existingLabor.paidAmount ?
                        existingLabor.paidAmount.toNumber() : Number(existingLabor.paidAmount)) : 0;

                const newTotalPaid = currentPaidAmount + Number(laborPaidAmount);
                const agreedWage = existingLabor.agreedWage !== null ?
                    (typeof existingLabor.agreedWage === 'object' && 'toNumber' in existingLabor.agreedWage ?
                        existingLabor.agreedWage.toNumber() : Number(existingLabor.agreedWage)) : 0;
                const newRemaining = agreedWage - newTotalPaid;

                projectLabor = await prisma.projectLabor.update({
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
            } else {
                // CREATE new record - first time working on this project
                const agreedWage = reqBody.agreedWage ? Number(reqBody.agreedWage) : 0;
                const paidAmount = Number(laborPaidAmount);
                const remainingWage = agreedWage - paidAmount;

                projectLabor = await prisma.projectLabor.create({
                    data: {
                        projectId,
                        employeeId,
                        agreedWage,
                        paidAmount,
                        remainingWage,
                        description,
                        paidFrom,
                        dateWorked: new Date(expenseDate),
                    },
                });
            }
        }

        // 1. Create the expense (only for non-Labor categories or new Labor records)
        let newExpense = null;
        if (category !== 'Labor' || (category === 'Labor' && (!existingLabor || startNewAgreement))) {
            // Always provide a non-empty string for description
            // For Utilities, use the description from form (already validated above)
            const safeDescription = category === 'Utilities' ? (description || 'Utilities expense') :
                (description || note || (category === 'Transport' ? transportType : '') || 'Expense');
            // Determine safePaidFrom to satisfy non-null schema while representing UNPAID
            const safePaidFrom = (category === 'Material' && (reqBody.paymentStatus === 'UNPAID')) ? 'UNPAID' : paidFrom;
            newExpense = await prisma.expense.create({
                data: {
                    description: safeDescription,
                    amount: finalWage.toString(),
                    category,
                    subCategory: subCategory || null,
                    paidFrom: safePaidFrom as any,
                    expenseDate: new Date(expenseDate),
                    note: note || null,
                    approved: false,
                    company: { connect: { id: companyId } },
                    user: { connect: { id: userId } },
                    project: projectId ? { connect: { id: projectId } } : undefined,
                    employee: employeeId ? { connect: { id: employeeId } } : undefined,
                    receiptUrl: receiptUrl || undefined,
                    transportType: category === 'Transport' ? transportType : undefined,
                    consultantName: category === 'Consultancy' ? consultantName : undefined,
                    consultancyType: category === 'Consultancy' ? consultancyType : undefined,
                    consultancyFee: category === 'Consultancy' ? consultancyFee ? Number(consultancyFee) : undefined : undefined,
                    equipmentName: category === 'Equipment Rental' ? equipmentName : undefined,
                    rentalPeriod: category === 'Equipment Rental' ? rentalPeriod : undefined,
                    rentalFee: category === 'Equipment Rental' ? rentalFee ? Number(rentalFee) : undefined : undefined,
                    supplierName: category === 'Equipment Rental' ? supplierName : undefined,
                    bankAccountId: category === 'Equipment Rental' ? bankAccountId : undefined,
                    materials: reqBody.materials ? reqBody.materials : undefined,
                    invoiceNumber, // NEW: Invoice Number
                    paymentStatus, // NEW: Payment Status
                    expenseCategory: invoiceNumber ? undefined : undefined, // Ensure no schema conflict if not present
                },
            });
        }

        // 1b. If Material expense, create ProjectMaterial records for each material
        if (category === 'Material' && Array.isArray(reqBody.materials) && projectId) {
            for (const mat of reqBody.materials) {
                await prisma.projectMaterial.create({
                    data: {
                        name: mat.name,
                        quantityUsed: typeof mat.qty === 'number' ? mat.qty : parseFloat(mat.qty),
                        unit: mat.unit,
                        costPerUnit: typeof mat.price === 'number' ? mat.price : parseFloat(mat.price),
                        leftoverQty: 0,
                        projectId,
                    },
                });
            }
        }

        // 2. Create corresponding transaction based on category/paymentStatus
        // const paymentStatus = reqBody.paymentStatus as string | undefined; // Already extracted
        // const vendorId = reqBody.vendorId as string | undefined; // Already extracted
        let tType: any = 'EXPENSE';
        let tAmount = Number(laborPaidAmount > 0 ? laborPaidAmount : amount);
        let tAccountId: string | null = category === 'Equipment Rental' ? bankAccountId : paidFrom;
        let tVendorId: string | undefined = undefined;

        if (category === 'Material') {
            tVendorId = vendorId;
            if (paymentStatus === 'UNPAID') {
                tType = 'DEBT_TAKEN';
                tAmount = amount; // Full amount is debt
                tAccountId = null; // No money moved
            } else if (paymentStatus === 'PARTIAL') {
                tType = 'DEBT_REPAID'; // Correct type for partial payment to vendor
                tAmount = -Math.abs(Number(paidAmount)); // Negative because it's money OUT
                tAccountId = paidFrom;
            } else {
                // PAID (Full)
                tType = 'EXPENSE';
                tAmount = -Math.abs(tAmount); // Full amount OUT
                tAccountId = paidFrom;
            }
        } else {
            // Labor and others behave as expense - always deduct from paidFrom if provided
            tAmount = -Math.abs(tAmount);
            tAccountId = paidFrom; // Ensure account is set for all expense types
        }

        await prisma.transaction.create({
            data: {
                description: description || note || category || 'Expense transaction',
                amount: tAmount,
                type: tType,
                transactionDate: new Date(expenseDate),
                note: note || null,
                accountId: tAccountId,
                expenseId: newExpense?.id || null,
                employeeId: employeeId || undefined,
                userId,
                companyId,
                projectId,
                vendorId: tVendorId,
            },
        });

        // 3. Update account if needed (only when accountId present)
        if (tAccountId) {
            await prisma.account.update({
                where: { id: tAccountId },
                data: { balance: { decrement: Math.abs(Number(amount)) } },
            });
        }

        return NextResponse.json({
            expense: newExpense,
            projectLabor: projectLabor,
            message: existingLabor ? 'Payment added to existing labor record' : 'New labor record created'
        }, { status: 201 });
    } catch (error) {
        console.error('Labor expense API error:', error);
        const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error);
        return NextResponse.json({ message: 'Server error.', details: errorMessage }, { status: 500 });
    }
}

// DELETE /api/expenses/project/[id] - Delete project labor record
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const sessionUser = await getSessionCompanyUser() as { companyId: string; userId: string } | null;
        if (!sessionUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { companyId } = sessionUser;

        // Verify project labor record exists and belongs to company
        const existingLabor = await prisma.projectLabor.findFirst({
            where: {
                id,
                project: { companyId } // Check through project relationship
            }
        });

        if (!existingLabor) {
            return NextResponse.json({ message: 'Project labor record lama helin.' }, { status: 404 });
        }

        // Manual cascade delete - delete related records first
        // 1. Refund account balance (add back the amount that was deducted)
        if (existingLabor.paidFrom && existingLabor.paidAmount) {
            await prisma.account.update({
                where: { id: existingLabor.paidFrom },
                data: {
                    balance: { increment: Number(existingLabor.paidAmount) }, // Soo celi lacagta
                },
            });
        }

        // 2. Delete related transactions
        await prisma.transaction.deleteMany({
            where: {
                projectId: existingLabor.projectId,
                employeeId: existingLabor.employeeId,
                description: { contains: existingLabor.description || '' }
            }
        });

        // 3. Delete the project labor record
        await prisma.projectLabor.delete({
            where: { id }
        });

        return NextResponse.json(
            { message: 'Project labor record si guul leh ayaa loo tirtiray!' },
            { status: 200 }
        );
    } catch (error) {
        console.error(`Cilad ayaa dhacday marka project labor record ${params.id} la tirtirayay:`, error);
        return NextResponse.json(
            { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
            { status: 500 }
        );
    }
}