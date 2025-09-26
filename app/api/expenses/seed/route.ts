// app/api/expenses/seed/route.ts - Seed Expenses for Testing
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

// POST /api/expenses/seed - Create sample expenses for testing
export async function POST(request: Request) {
  try {
    const { companyId, userId } = await getSessionCompanyUser();
    
    // Sample expenses data
    const sampleExpenses = [
      {
        description: 'Office Supplies - Stationery',
        amount: '350.00',
        category: 'Office Supplies',
        subCategory: 'Stationery',
        paidFrom: 'Ebirr Account',
        expenseDate: new Date('2024-01-15'),
        note: 'Pens, papers, folders for office use',
        approved: true,
        materials: [
          { name: 'Ballpoint Pens', qty: 50, price: 1.50, unit: 'pieces' },
          { name: 'A4 Paper', qty: 10, price: 25.00, unit: 'reams' },
          { name: 'File Folders', qty: 20, price: 2.00, unit: 'pieces' }
        ]
      },
      {
        description: 'Fuel for Vehicle A',
        amount: '500.00',
        category: 'Transport',
        subCategory: 'Fuel',
        paidFrom: 'Cash',
        expenseDate: new Date('2024-01-16'),
        note: 'Fuel for delivery vehicle',
        approved: false,
        transportType: 'Delivery Vehicle'
      },
      {
        description: 'Software License Renewal',
        amount: '2400.00',
        category: 'Technology',
        subCategory: 'Software',
        paidFrom: 'Bank Account',
        expenseDate: new Date('2024-01-17'),
        note: 'Annual license for project management software',
        approved: true
      },
      {
        description: 'Employee Salary - Ahmed Hassan',
        amount: '2500.00',
        category: 'Company Expense',
        subCategory: 'Salary',
        paidFrom: 'Bank Account',
        expenseDate: new Date('2024-01-18'),
        note: 'Monthly salary payment',
        approved: true
      },
      {
        description: 'Marketing Campaign Materials',
        amount: '1500.00',
        category: 'Marketing',
        subCategory: 'Print Materials',
        paidFrom: 'Ebirr Account',
        expenseDate: new Date('2024-01-19'),
        note: 'Brochures and flyers for new project launch',
        approved: false,
        materials: [
          { name: 'Brochures', qty: 1000, price: 0.50, unit: 'pieces' },
          { name: 'Flyers', qty: 2000, price: 0.25, unit: 'pieces' },
          { name: 'Banners', qty: 5, price: 200.00, unit: 'pieces' }
        ]
      },
      {
        description: 'Equipment Rental - Generator',
        amount: '800.00',
        category: 'Equipment Rental',
        subCategory: 'Power Equipment',
        paidFrom: 'Cash',
        expenseDate: new Date('2024-01-20'),
        note: 'Generator rental for construction site',
        approved: true,
        equipmentName: 'Diesel Generator 50KVA',
        rentalPeriod: '1 week',
        rentalFee: 800,
        supplierName: 'Power Equipment Co.'
      },
      {
        description: 'Consultancy Services - Legal',
        amount: '1200.00',
        category: 'Consultancy',
        subCategory: 'Legal',
        paidFrom: 'Bank Account',
        expenseDate: new Date('2024-01-21'),
        note: 'Legal consultation for contract review',
        approved: true,
        consultantName: 'Dr. Mohamed Ali',
        consultancyType: 'Legal Advice',
        consultancyFee: 1200
      },
      {
        description: 'Insurance Premium',
        amount: '600.00',
        category: 'Insurance',
        subCategory: 'General',
        paidFrom: 'Bank Account',
        expenseDate: new Date('2024-01-22'),
        note: 'Quarterly insurance premium',
        approved: true
      },
      {
        description: 'Internet Bill',
        amount: '120.00',
        category: 'Utilities',
        subCategory: 'Internet',
        paidFrom: 'Ebirr Account',
        expenseDate: new Date('2024-01-23'),
        note: 'Monthly internet service',
        approved: true
      },
      {
        description: 'Training Workshop - Project Management',
        amount: '900.00',
        category: 'Training',
        subCategory: 'Professional Development',
        paidFrom: 'Bank Account',
        expenseDate: new Date('2024-01-24'),
        note: 'Team training on project management best practices',
        approved: false
      }
    ];

    // Create expenses in database
    const createdExpenses = await Promise.all(
      sampleExpenses.map(expense =>
        prisma.expense.create({
          data: {
            ...expense,
            companyId,
            userId,
          },
        })
      )
    );

    return NextResponse.json(
      { 
        message: `${createdExpenses.length} kharash cusub ayaa la abuuray!`, 
        expenses: createdExpenses 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Cilad ayaa dhacday marka kharashyada la abuuraynayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
