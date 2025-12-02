// app/api/expenses/bulk-import/route.ts - Bulk Import Expenses API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '../auth';

export async function POST(request: Request) {
  try {
    const { companyId, userId } = await getSessionCompanyUser();
    const { expenseType, subCategory, projectId, expenses } = await request.json();

    if (!expenseType || !subCategory || !Array.isArray(expenses) || expenses.length === 0) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah' },
        { status: 400 }
      );
    }

    if (expenseType === 'project' && !projectId) {
      return NextResponse.json(
        { message: 'Project ID waa waajib marka project expense ah' },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as any[]
    };

    // Process each expense
    for (let i = 0; i < expenses.length; i++) {
      const expense = expenses[i];
      
      try {
        // Validate based on subcategory
        let validationError = null;
        
        if (subCategory === 'Material' || subCategory === 'Company Material') {
          if (!expense.Name || !expense.Quantity || !expense.Price || !expense.Unit) {
            validationError = 'Name, Quantity, Price, iyo Unit waa waajib';
          }
        } else if (subCategory === 'Labor' || subCategory === 'Company Labor') {
          if (!expense.EmployeeName || !expense.Wage || !expense.WorkDescription) {
            validationError = 'EmployeeName, Wage, iyo WorkDescription waa waajib';
          }
        } else {
          if (!expense.Description || !expense.Amount) {
            validationError = 'Description iyo Amount waa waajib';
          }
        }

        if (validationError) {
          results.errors.push({
            row: i + 2,
            message: validationError
          });
          results.skipped++;
          continue;
        }

        // Prepare expense data
        let expenseData: any = {
          companyId,
          userId: userId || null,
          category: subCategory,
          paidFrom: expense.PaidFrom || 'Cash',
          expenseDate: new Date(expense.ExpenseDate || new Date()),
          note: expense.Note || null,
          approved: false,
        };

        // Handle Material expenses
        if (subCategory === 'Material' || subCategory === 'Company Material') {
          const materials = [{
            name: expense.Name,
            qty: expense.Quantity,
            price: expense.Price,
            unit: expense.Unit
          }];
          
          const totalAmount = parseFloat(expense.Quantity) * parseFloat(expense.Price);
          
          expenseData.description = expense.Description || expense.Name;
          expenseData.amount = totalAmount;
          expenseData.materials = materials;
          expenseData.materialDate = expense.MaterialDate ? new Date(expense.MaterialDate) : new Date(expense.ExpenseDate);
          
          if (expenseType === 'project') {
            expenseData.projectId = projectId;
          }
        }
        // Handle Labor expenses
        else if (subCategory === 'Labor' || subCategory === 'Company Labor') {
          // Find employee by name
          const employee = await prisma.employee.findFirst({
            where: {
              companyId,
              fullName: {
                contains: expense.EmployeeName,
                mode: 'insensitive'
              }
            }
          });

          if (!employee) {
            results.errors.push({
              row: i + 2,
              message: `Shaqaale lama helin: ${expense.EmployeeName}`
            });
            results.skipped++;
            continue;
          }

          expenseData.description = expense.WorkDescription;
          expenseData.amount = parseFloat(expense.Wage);
          expenseData.employeeId = employee.id;
          
          if (expenseType === 'project') {
            expenseData.projectId = projectId;
          }
        }
        // Handle other expenses
        else {
          expenseData.description = expense.Description;
          expenseData.amount = parseFloat(expense.Amount || expense.Amount);
          
          if (subCategory === 'Transport') {
            expenseData.transportType = expense.TransportType || null;
          }
          
          if (expenseType === 'project') {
            expenseData.projectId = projectId;
          }
        }

        // Create expense
        await prisma.expense.create({
          data: expenseData
        });

        results.created++;
      } catch (error: any) {
        console.error(`Error creating expense at row ${i + 2}:`, error);
        results.errors.push({
          row: i + 2,
          message: error.message || 'Cilad ayaa dhacday'
        });
        results.skipped++;
      }
    }

    return NextResponse.json({
      message: `Guul! ${results.created} kharash ayaa la soo geliyay`,
      ...results
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in bulk import:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
