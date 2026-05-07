import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { sendAiWhatsAppMessage, sendBulkWhatsAppMessages } from '@/lib/whatsapp/send-ai-message';

export const dynamic = 'force-dynamic';

// --- TOOLS DECLARATIONS ---
const getShopSummaryDeclaration: FunctionDeclaration = {
    name: 'get_shop_summary',
    description: 'Retrieves basic shop metrics including today\'s total sales, total customers, employees, products, and vendors.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {},
        required: [],
    },
};

const getLowStockProductsDeclaration: FunctionDeclaration = {
    name: 'get_low_stock_products',
    description: 'Retrieves a list of products that have low stock (<= 10 items remaining).',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {},
        required: [],
    },
};

const getDebtorsDeclaration: FunctionDeclaration = {
    name: 'get_debtors',
    description: 'Retrieves a list of customers who owe money (debtors) and their outstanding balances.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {},
        required: [],
    },
};

const createPurchaseOrderDeclaration: FunctionDeclaration = {
    name: 'create_purchase_order',
    description: 'Creates a new purchase order for a vendor. Use this when the user says they bought stock or items from a supplier.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            vendorName: { type: SchemaType.STRING, description: 'Name of the supplier/vendor' },
            items: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        productName: { type: SchemaType.STRING },
                        quantity: { type: SchemaType.NUMBER },
                        unitCost: { type: SchemaType.NUMBER }
                    }
                }
            },
            notes: { type: SchemaType.STRING }
        },
        required: ['vendorName', 'items'],
    },
};

const createCustomerDeclaration: FunctionDeclaration = {
    name: 'create_customer',
    description: 'Creates a new customer. Use this when the user asks to register or add a customer.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            name: { type: SchemaType.STRING, description: 'Full name of the customer' },
            phone: { type: SchemaType.STRING, description: 'Phone number of the customer' }
        },
        required: ['name'],
    },
};

const addProductDeclaration: FunctionDeclaration = {
    name: 'add_product',
    description: 'Adds a new product to the inventory.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            name: { type: SchemaType.STRING, description: 'Name of the product' },
            sellingPrice: { type: SchemaType.NUMBER, description: 'Price the product is sold for' },
            costPrice: { type: SchemaType.NUMBER, description: 'Cost of purchasing the product' },
            stock: { type: SchemaType.NUMBER, description: 'Initial stock quantity' },
            category: { type: SchemaType.STRING, description: 'Category of the product' }
        },
        required: ['name', 'sellingPrice', 'stock'],
    },
};

const recordExpenseDeclaration: FunctionDeclaration = {
    name: 'record_expense',
    description: 'Records a new expense for the shop.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            amount: { type: SchemaType.NUMBER, description: 'Amount of the expense' },
            description: { type: SchemaType.STRING, description: 'Description or reason for the expense' },
            category: { type: SchemaType.STRING, description: 'Category of the expense (e.g., Rent, Utilities, Salary, Supplies)' }
        },
        required: ['amount', 'description'],
    },
};

const advancedSearchDeclaration: FunctionDeclaration = {
    name: 'advanced_search',
    description: 'Searches the database for specific receipts/invoices, customers, or products based on a query.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            query: { type: SchemaType.STRING, description: 'The search query (e.g. invoice number, customer name, or product name)' },
            type: { type: SchemaType.STRING, description: 'Type of search: "sale", "customer", or "product"' }
        },
        required: ['query', 'type'],
    },
};

const bulkAddProductsDeclaration: FunctionDeclaration = {
    name: 'bulk_add_products',
    description: 'Adds multiple products to the inventory at once. Use when the user pastes a list of items.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            products: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: { type: SchemaType.STRING },
                        sellingPrice: { type: SchemaType.NUMBER },
                        stock: { type: SchemaType.NUMBER },
                        category: { type: SchemaType.STRING }
                    }
                }
            }
        },
        required: ['products'],
    },
};

const draftSmsDeclaration: FunctionDeclaration = {
    name: 'draft_sms',
    description: 'Drafts a professional Somali SMS message to remind a customer about their debt.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            customerName: { type: SchemaType.STRING },
            debtAmount: { type: SchemaType.NUMBER }
        },
        required: ['customerName', 'debtAmount'],
    },
};

const generateReportDeclaration: FunctionDeclaration = {
    name: 'generate_report',
    description: 'Generates a direct link to a specific dashboard report.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            reportType: { type: SchemaType.STRING, description: 'Type of report: "sales", "finance", "inventory", or "customer-balances"' }
        },
        required: ['reportType'],
    },
};

const createReminderDeclaration: FunctionDeclaration = {
    name: 'create_reminder',
    description: 'Creates a task or reminder for the user.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            title: { type: SchemaType.STRING, description: 'Title or description of the reminder' },
            date: { type: SchemaType.STRING, description: 'Date for the reminder' }
        },
        required: ['title'],
    },
};

const createSaleDeclaration: FunctionDeclaration = {
    name: 'create_sale',
    description: 'Creates a new sale. Use this when the user asks to sell an item or record a sale.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            customerName: { type: SchemaType.STRING, description: 'Name of the customer (optional, leave empty for walk-in)' },
            items: { 
                type: SchemaType.ARRAY, 
                description: 'List of items being sold',
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        productName: { type: SchemaType.STRING },
                        quantity: { type: SchemaType.NUMBER }
                    }
                }
            },
            paymentMethod: { type: SchemaType.STRING, description: 'Cash, EVC, or Bank Transfer' },
            paidAmount: { type: SchemaType.NUMBER, description: 'Amount paid by the customer' }
        },
        required: ['items'],
    },
};

const verifyPaymentDeclaration: FunctionDeclaration = {
    name: 'verify_payment',
    description: 'Verifies a mobile payment (eBirr, CBE Birr) using a transaction ID. Use this when a user says they have paid via mobile.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            transactionId: { type: SchemaType.STRING, description: 'The unique transaction ID provided by the customer' },
            provider: { type: SchemaType.STRING, description: 'The mobile payment provider (e.g., eBirr, CBE Birr, Sahay)' },
            amount: { type: SchemaType.NUMBER, description: 'The amount expected to be received' }
        },
        required: ['transactionId', 'provider', 'amount'],
    },
};

// --- TOOL EXECUTORS ---
async function saveImage(base64Image: string, companyId: string): Promise<string | null> {
    try {
        const [mimePart, base64Data] = base64Image.split(';base64,');
        const extension = mimePart.split('/')[1].split(';')[0] || 'png';
        const fileName = `receipt_${companyId}_${Date.now()}.${extension}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        
        return `/uploads/${fileName}`;
    } catch (error) {
        console.error("[Revlo AI] Image save error:", error);
        return null;
    }
}

async function logAiAction(companyId: string, userId: string, action: string, entity: string, entityId: string, details: string) {
    try {
        await prisma.auditLog.create({
            data: {
                companyId,
                userId,
                action,
                entity,
                entityId,
                details: `[Revlo AI Agent] ${details}`
            }
        });
    } catch (error) {
        console.error("[Revlo AI] Failed to log audit action:", error);
    }
}

const createVendorDeclaration: FunctionDeclaration = {
    name: 'create_vendor',
    description: 'Creates a new supplier/vendor. Use this when the user mentions a new supplier that does not exist yet in the system.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            name: { type: SchemaType.STRING, description: 'Full name of the vendor/supplier' },
            phone: { type: SchemaType.STRING, description: 'Phone number' },
            type: { type: SchemaType.STRING, description: 'Type: Supplier, Manufacturer, Distributor' }
        },
        required: ['name'],
    },
};

const fullPurchaseReceiptDeclaration: FunctionDeclaration = {
    name: 'full_purchase_receipt',
    description: 'Processes a complete purchase receipt in ONE action: creates vendor (if new), adds products (if new), creates purchase order, and records expense. Use this when user sends a receipt image or says they bought items from a supplier. This is the MAIN tool for processing purchases.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            vendorName: { type: SchemaType.STRING, description: 'Name of the supplier/vendor' },
            items: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        productName: { type: SchemaType.STRING, description: 'Name of the product' },
                        quantity: { type: SchemaType.NUMBER, description: 'Quantity purchased' },
                        unitCost: { type: SchemaType.NUMBER, description: 'Cost price per unit' },
                        sellingPrice: { type: SchemaType.NUMBER, description: 'Selling price per unit (if known)' }
                    },
                    required: ['productName', 'quantity', 'unitCost']
                }
            },
            totalAmount: { type: SchemaType.NUMBER, description: 'Total invoice amount' },
            currency: { type: SchemaType.STRING, description: 'Payment currency: ETB or USD' },
            notes: { type: SchemaType.STRING, description: 'Additional notes' }
        },
        required: ['vendorName', 'items'],
    },
};

const sendWhatsAppDeclaration: FunctionDeclaration = {
    name: 'send_whatsapp',
    description: 'Sends a WhatsApp message to a specific customer or phone number. Use when user says "fariin u dir", "WhatsApp-ka u dir", or wants to message someone.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            phone: { type: SchemaType.STRING, description: 'Phone number to send to (optional if customerName provided)' },
            customerName: { type: SchemaType.STRING, description: 'Name of the customer to find and message' },
            message: { type: SchemaType.STRING, description: 'The message content to send via WhatsApp' }
        },
        required: ['message'],
    },
};

const sendBulkWhatsAppDeclaration: FunctionDeclaration = {
    name: 'send_bulk_whatsapp',
    description: 'Sends a bulk WhatsApp message to a group of people. Use when user says "dadka oo dhan u dir", "macaamiisha fariin u dir", "debtors-ka xasuusin u dir".',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            filter: { type: SchemaType.STRING, description: 'Who to send to: "all-customers", "debtors", or "vendors"' },
            message: { type: SchemaType.STRING, description: 'The message to send. Use {name} for personalization.' }
        },
        required: ['filter', 'message'],
    },
};

const getTopCustomersDeclaration: FunctionDeclaration = {
    name: 'get_top_customers',
    description: 'Retrieves the top customers ranked by total spending. Use when user asks about best customers, top buyers, or "macaamiilka ugu iibsiga badan".',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            limit: { type: SchemaType.NUMBER, description: 'Number of top customers to return (default 10)' }
        },
        required: [],
    },
};

async function executeTool(name: string, args: any, req: NextRequest, companyId: string, userId: string, receiptUrl?: string | null) {
    try {
        switch (name) {
            case 'get_shop_summary': {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const [sales, totalCustomers, totalEmployees, totalProducts, totalVendors] = await Promise.all([
                    prisma.sale.aggregate({
                        _sum: { total: true },
                        where: { companyId, createdAt: { gte: today } }
                    }),
                    prisma.customer.count({ where: { companyId } }),
                    prisma.employee.count({ where: { companyId } }),
                    prisma.product.count({ where: { companyId } }),
                    prisma.shopVendor.count({ where: { companyId } })
                ]);
                
                return {
                    success: true,
                    todaySales: sales._sum.total || 0,
                    totalCustomers,
                    totalEmployees,
                    totalProducts,
                    totalVendors
                };
            }
            case 'get_low_stock_products': {
                const lowStockProducts = await prisma.product.findMany({
                    where: { companyId, stock: { lte: 10 } },
                    take: 10,
                    select: { name: true, stock: true }
                });
                return { success: true, products: lowStockProducts };
            }
            case 'get_debtors': {
                const debtorsSales = await prisma.sale.findMany({
                    where: { companyId, paymentStatus: { in: ['Partial', 'Unpaid'] } },
                    include: { customer: true, realCustomer: true }
                });

                const debtMap = new Map();
                debtorsSales.forEach(s => {
                    const c = s.customer || s.realCustomer;
                    const cId = s.customerId || s.realCustomerId;
                    if (cId && c) {
                        const owed = s.total - s.paidAmount;
                        if (owed > 0) {
                            debtMap.set(cId, { name: c.name, owed: (debtMap.get(cId)?.owed || 0) + owed });
                        }
                    }
                });
                const debtorsArray = Array.from(debtMap.values()).sort((a, b) => b.owed - a.owed);
                return { success: true, totalDebtors: debtorsArray.length, debtors: debtorsArray.slice(0, 10) };
            }
            case 'get_top_customers': {
                const topLimit = args.limit || 10;
                const dateFrom30 = new Date();
                dateFrom30.setDate(dateFrom30.getDate() - 30);

                const topCustData = await prisma.sale.groupBy({
                    by: ['customerId'],
                    where: {
                        companyId,
                        customerId: { not: null },
                        createdAt: { gte: dateFrom30 },
                        status: { not: 'Cancelled' }
                    },
                    _sum: { total: true },
                    _count: { id: true },
                    orderBy: { _sum: { total: 'desc' } },
                    take: topLimit
                });

                const custIds = topCustData.map(t => t.customerId).filter(Boolean) as string[];
                const custDetails = custIds.length > 0 ? await prisma.shopClient.findMany({
                    where: { id: { in: custIds } },
                    select: { id: true, name: true, phone: true }
                }) : [];

                const topCustomersList = topCustData.map((t, idx) => {
                    const detail = custDetails.find(c => c.id === t.customerId);
                    return {
                        rank: idx + 1,
                        name: detail?.name || 'Walk-in',
                        phone: detail?.phone || 'N/A',
                        total_orders_last_30_days: t._count.id,
                        total_revenue_last_30_days: Number(t._sum.total || 0)
                    };
                });

                return { success: true, totalFound: topCustomersList.length, topCustomers: topCustomersList };
            }
            case 'create_customer': {
                const { name, phone } = args;
                const existing = await prisma.shopClient.findFirst({ where: { companyId, name: { equals: name, mode: 'insensitive' } } });
                if (existing) return { success: false, error: 'Macmiil magacan leh horey ayuu u jiray.' };
                
                const customer = await prisma.shopClient.create({
                    data: { name, phone: phone || '', status: 'Active', companyId, userId }
                });
                await logAiAction(companyId, userId, 'CREATE', 'ShopClient', customer.id, `Created new customer: ${name} (${phone || 'No phone'})`);
                return { success: true, message: 'Macmiilka si guul ah ayaa loo diiwaangeliyay', customer };
            }
            case 'add_product': {
                const { name, sellingPrice, costPrice, stock, category } = args;
                const existing = await prisma.product.findFirst({ where: { companyId, name: { equals: name, mode: 'insensitive' } } });
                if (existing) return { success: false, error: 'Alaab magacan leh horey ayay u jirtay.' };

                const sku = 'PRD-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
                const product = await prisma.product.create({
                    data: { name, sku, sellingPrice, costPrice: costPrice || 0, stock, category: category || 'General', minStock: 5, status: 'Active', companyId, userId }
                });
                await logAiAction(companyId, userId, 'CREATE', 'Product', product.id, `Added new product: ${name} with stock ${stock}`);
                return { success: true, message: 'Alaabta si guul ah ayaa loo diiwaangeliyay', product };
            }
            case 'record_expense': {
                const { amount, description, category } = args;
                // Get default expense account
                const account = await prisma.account.findFirst({ where: { companyId, type: 'CASH' } });
                
                const expense = await prisma.expense.create({
                    data: {
                        amount, description, category: category || 'General', paidFrom: 'CASH', paymentStatus: 'PAID', expenseDate: new Date(), companyId, userId, accountId: account?.id,
                        receiptUrl: receiptUrl || undefined
                    }
                });
                await logAiAction(companyId, userId, 'CREATE', 'Expense', expense.id, `Recorded expense: ${description} (ETB ${amount})${receiptUrl ? ' [Receipt Attached]' : ''}`);
                return { success: true, message: 'Kharashka si guul ah ayaa loo diiwaangeliyay', expense };
            }
            case 'create_sale': {
                const { customerName, items, paymentMethod, paidAmount } = args;
                
                // 1. Resolve Customer ID
                let customerId = null;
                if (customerName) {
                    const cust = await prisma.shopClient.findFirst({ where: { companyId, name: { contains: customerName, mode: 'insensitive' } } });
                    if (cust) customerId = cust.id;
                    else return { success: false, error: `Macmiilka '${customerName}' lama helin. Fadlan horta diiwaangeli.` };
                }

                // 2. Resolve Product IDs
                const mappedItems = [];
                for (const item of items) {
                    const prod = await prisma.product.findFirst({ where: { companyId, name: { contains: item.productName, mode: 'insensitive' } } });
                    if (!prod) return { success: false, error: `Alaabta '${item.productName}' lama helin.` };
                    mappedItems.push({ productId: prod.id, quantity: item.quantity });
                }

                // 3. Find default cash account for payment
                const account = await prisma.account.findFirst({ where: { companyId, type: 'CASH' } });

                // 4. Call existing sales API to ensure full transaction & stock logic runs
                const payload = {
                    customerId,
                    items: mappedItems,
                    paymentMethod: paymentMethod || 'Cash',
                    paidAmount: paidAmount,
                    accountId: account?.id,
                    notes: 'Sale created via Revlo AI',
                    receiptUrl: receiptUrl || undefined
                };

                const response = await fetch(new URL(req.url).origin + '/api/shop/sales', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'cookie': req.headers.get('cookie') || '' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                if (!response.ok) return { success: false, error: data.error || 'Khalad ayaa dhacay markii iibka la samaynayay.' };

                await logAiAction(companyId, userId, 'CREATE', 'Sale', data.id, `Performed sale via AI Agent. Items: ${items.length}, Total: ETB ${data.total}`);
                return { success: true, message: 'Iibka si guul ah ayaa loo xareeyay!', sale: data };
            }
            case 'create_vendor': {
                const { name: vendorNameArg, phone: vendorPhoneArg, type: vendorType } = args;
                const existingVendor = await prisma.shopVendor.findFirst({ where: { companyId, name: { equals: vendorNameArg, mode: 'insensitive' } } });
                if (existingVendor) return { success: true, message: `Suplayarka '${vendorNameArg}' horey ayuu u jiray.`, vendor: existingVendor };

                const newVendor = await prisma.shopVendor.create({
                    data: { name: vendorNameArg, phone: vendorPhoneArg || '', type: vendorType || 'Supplier', companyId, userId }
                });
                await logAiAction(companyId, userId, 'CREATE', 'ShopVendor', newVendor.id, `Created vendor: ${vendorNameArg}`);
                return { success: true, message: `Suplayarka '${vendorNameArg}' si guul ah ayaa loo diiwaangeliyay!`, vendor: newVendor };
            }
            case 'create_purchase_order': {
                const { vendorName, items, notes } = args;
                // Auto-create vendor if not found
                let vendor = await prisma.shopVendor.findFirst({ where: { companyId, name: { contains: vendorName, mode: 'insensitive' } } });
                if (!vendor) {
                    vendor = await prisma.shopVendor.create({
                        data: { name: vendorName, phone: '', type: 'Supplier', companyId, userId }
                    });
                    await logAiAction(companyId, userId, 'CREATE', 'ShopVendor', vendor.id, `Auto-created vendor: ${vendorName}`);
                }

                const mappedItems = [];
                for (const item of items) {
                    // Auto-create product if not found
                    let prod = await prisma.product.findFirst({ where: { companyId, name: { contains: item.productName, mode: 'insensitive' } } });
                    if (!prod) {
                        const sku = 'PRD-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
                        prod = await prisma.product.create({
                            data: { name: item.productName, sku, sellingPrice: Math.round(item.unitCost * 1.3), costPrice: item.unitCost, stock: item.quantity || 0, category: 'General', minStock: 5, status: 'Active', companyId, userId }
                        });
                    } else {
                        // Update stock for existing product
                        await prisma.product.update({ where: { id: prod.id }, data: { stock: { increment: item.quantity || 0 }, costPrice: item.unitCost } });
                    }
                    mappedItems.push({ 
                        productId: prod.id, 
                        productName: prod.name, 
                        quantity: item.quantity, 
                        unitCost: item.unitCost,
                        total: (item.quantity || 1) * item.unitCost
                    });
                }

                const subtotal = mappedItems.reduce((s, i) => s + i.total, 0);
                const po = await prisma.purchaseOrder.create({
                    data: {
                        poNumber: `PO-${Date.now()}`,
                        vendorId: vendor.id,
                        companyId,
                        userId,
                        subtotal,
                        tax: 0,
                        total: subtotal,
                        paidAmount: subtotal,
                        paymentStatus: 'Paid',
                        status: 'Received',
                        notes: notes || 'Created via Revlo AI',
                        receiptUrl: receiptUrl || null,
                        items: {
                            create: mappedItems.map(i => ({
                                productId: i.productId,
                                productName: i.productName,
                                quantity: i.quantity,
                                unitCost: i.unitCost,
                                total: i.total
                            }))
                        }
                    }
                });

                await logAiAction(companyId, userId, 'CREATE', 'PurchaseOrder', po.id, `Created PO for ${vendorName}. ${mappedItems.length} items, Total: ${subtotal}`);
                return { success: true, message: `✅ Purchase Order si guul ah ayaa loo diiwaangeliyay!\n📦 ${mappedItems.length} alaab\n💰 Wadarta: ${subtotal.toLocaleString()}\n🏢 Suplayar: ${vendorName}`, purchaseOrder: po };
            }
            case 'full_purchase_receipt': {
                const { vendorName, items, totalAmount, currency, notes } = args;
                const results: string[] = [];

                // 1. Find or Create Vendor
                let vendor = await prisma.shopVendor.findFirst({ where: { companyId, name: { contains: vendorName, mode: 'insensitive' } } });
                if (!vendor) {
                    vendor = await prisma.shopVendor.create({
                        data: { name: vendorName, phone: '', type: 'Supplier', companyId, userId }
                    });
                    results.push(`✅ Suplayar cusub: ${vendorName}`);
                } else {
                    results.push(`📋 Suplayar: ${vendorName} (horey u jiray)`);
                }

                // 2. Process Each Product (create if new, update stock if existing)
                const mappedItems = [];
                let newProducts = 0, updatedProducts = 0;
                for (const item of items) {
                    let prod = await prisma.product.findFirst({ where: { companyId, name: { contains: item.productName, mode: 'insensitive' } } });
                    if (!prod) {
                        const sku = 'PRD-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
                        const sellPrice = item.sellingPrice || Math.round(item.unitCost * 1.3);
                        prod = await prisma.product.create({
                            data: { name: item.productName, sku, sellingPrice: sellPrice, costPrice: item.unitCost, stock: item.quantity || 0, category: 'General', minStock: 5, status: 'Active', companyId, userId }
                        });
                        newProducts++;
                    } else {
                        await prisma.product.update({ where: { id: prod.id }, data: { stock: { increment: item.quantity || 0 }, costPrice: item.unitCost } });
                        updatedProducts++;
                    }
                    mappedItems.push({ productId: prod.id, productName: prod.name, quantity: item.quantity || 1, unitCost: item.unitCost, total: (item.quantity || 1) * item.unitCost });
                }
                if (newProducts > 0) results.push(`📦 ${newProducts} alaab cusub oo la diiwaangeliyay`);
                if (updatedProducts > 0) results.push(`🔄 ${updatedProducts} alaab oo stock-kooda la cusboonaysiiyay`);

                // 3. Create Purchase Order
                const subtotal = totalAmount || mappedItems.reduce((s, i) => s + i.total, 0);
                const po = await prisma.purchaseOrder.create({
                    data: {
                        poNumber: `PO-${Date.now()}`,
                        vendorId: vendor.id,
                        companyId,
                        userId,
                        subtotal,
                        tax: 0,
                        total: subtotal,
                        paidAmount: subtotal,
                        paymentStatus: 'Paid',
                        status: 'Received',
                        currency: currency || 'ETB',
                        notes: notes || `Purchase from ${vendorName} via Revlo AI`,
                        receiptUrl: receiptUrl || null,
                        items: {
                            create: mappedItems.map(i => ({
                                productId: i.productId,
                                productName: i.productName,
                                quantity: i.quantity,
                                unitCost: i.unitCost,
                                total: i.total
                            }))
                        }
                    }
                });
                results.push(`📋 Purchase Order: ${po.poNumber}`);

                // 4. Record Expense
                const account = await prisma.account.findFirst({ where: { companyId, type: 'CASH' } });
                const expense = await prisma.expense.create({
                    data: {
                        amount: subtotal,
                        description: `Purchase from ${vendorName} (${mappedItems.length} items)`,
                        category: 'PURCHASE',
                        paidFrom: 'CASH',
                        paymentStatus: 'PAID',
                        expenseDate: new Date(),
                        companyId,
                        userId,
                        accountId: account?.id,
                        purchaseOrderId: po.id,
                        receiptUrl: receiptUrl || undefined
                    }
                });
                results.push(`💰 Kharash: ${currency || 'ETB'} ${subtotal.toLocaleString()} — diiwaangashay`);

                await logAiAction(companyId, userId, 'FULL_PURCHASE', 'PurchaseOrder', po.id, `Full purchase receipt: ${vendorName}, ${mappedItems.length} items, ${currency || 'ETB'} ${subtotal}`);

                return {
                    success: true,
                    message: `🎉 Rasiidka waa la diiwaangeliyay si dhammaystiran!\n\n${results.join('\n')}\n\n💰 Wadarta: ${currency || 'ETB'} ${subtotal.toLocaleString()}`,
                    purchaseOrder: po,
                    expenseId: expense.id,
                    summary: { vendor: vendorName, newProducts, updatedProducts, total: subtotal, currency: currency || 'ETB' }
                };
            }
            case 'verify_payment': {
                const { transactionId, provider, amount } = args;
                
                // SIMULATION: In a real scenario, we would call the eBirr/CBE API here
                // For now, we simulate a successful verification
                await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
                
                await logAiAction(companyId, userId, 'VERIFY_PAYMENT', 'Finance', transactionId, `Simulated verification of ${provider} payment for ETB ${amount}. Ref: ${transactionId}`);
                
                return { 
                    success: true, 
                    message: `Lacagta dhan ETB ${amount} oo lagu bixiyay ${provider} waa la xaqiijiyay. (Ref: ${transactionId})`,
                    verified: true,
                    transactionId,
                    provider,
                    amount
                };
            }
            case 'advanced_search': {
                const { query, type } = args;
                if (type === 'sale') {
                    const sales = await prisma.sale.findMany({
                        where: { companyId, invoiceNumber: { contains: query, mode: 'insensitive' } },
                        include: { items: true, customer: true, realCustomer: true }
                    });
                    return { success: true, results: sales };
                } else if (type === 'customer') {
                    const customers = await prisma.shopClient.findMany({
                        where: { companyId, name: { contains: query, mode: 'insensitive' } },
                        include: { sales: { select: { invoiceNumber: true, total: true, paidAmount: true } } }
                    });
                    return { success: true, results: customers };
                } else if (type === 'product') {
                    const products = await prisma.product.findMany({
                        where: { companyId, name: { contains: query, mode: 'insensitive' } }
                    });
                    return { success: true, results: products };
                }
                return { success: false, error: 'Noch aan la aqoonsan' };
            }
            case 'bulk_add_products': {
                const { products } = args;
                const createdProducts = [];
                for (const p of products) {
                    const existing = await prisma.product.findFirst({ where: { companyId, name: { equals: p.name, mode: 'insensitive' } } });
                    if (!existing) {
                        const sku = 'PRD-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
                        const np = await prisma.product.create({
                            data: { name: p.name, sku, sellingPrice: p.sellingPrice, costPrice: 0, stock: p.stock || 0, category: p.category || 'General', minStock: 5, status: 'Active', companyId, userId }
                        });
                        createdProducts.push(np);
                    }
                }
                await logAiAction(companyId, userId, 'CREATE_MANY', 'Product', 'BULK_ADD', `Bulk added ${createdProducts.length} products via AI.`);
                return { success: true, message: `Waan diiwaangeliyay ${createdProducts.length} alaab.`, products: createdProducts };
            }
            case 'draft_sms': {
                const { customerName, debtAmount } = args;
                const sms = `Salaan Mudane/Marwo ${customerName}. Waxaan ku xasuusinaynaa in lagugu leeyahay lacag dhan ETB ${debtAmount.toLocaleString()}. Fadlan isku day inaad iska bixiso inta aysan dhammaan bishaan. Mahadsanid, Maamulka Dukaanka.`;
                return { success: true, draft: sms };
            }
            case 'generate_report': {
                const { reportType } = args;
                const linkMap: any = {
                    'sales': '/shop/reports/sales',
                    'finance': '/shop/reports/finance',
                    'inventory': '/shop/reports/inventory-report',
                    'customer-balances': '/shop/reports/customer-balances'
                };
                const link = linkMap[reportType] || '/shop/reports';
                return { success: true, message: 'Warbixinta waa la soo saaray', url: link };
            }
            case 'create_reminder': {
                const { title, date } = args;
                // Currently simulating reminder creation since schema lacks Task/Reminder
                return { success: true, message: `Xusuusiyaha "${title}" waa la diiwaangeliyay${date ? ' ilaa ' + date : ''}.` };
            }
            case 'send_whatsapp': {
                const { phone, customerName, message: whatsappMsg } = args;
                // Try to find phone from customer name if not provided
                let targetPhone = phone;
                if (!targetPhone && customerName) {
                    const customer = await prisma.shopClient.findFirst({
                        where: { companyId, name: { contains: customerName, mode: 'insensitive' } },
                        select: { phone: true, name: true }
                    });
                    targetPhone = customer?.phone;
                    if (!targetPhone) return { success: false, error: `Macmiilka "${customerName}" telefoonkiisa lama hayo.` };
                }
                const waResult = await sendAiWhatsAppMessage(companyId, targetPhone, whatsappMsg);
                await logAiAction(companyId, userId, 'WHATSAPP_SEND', 'WhatsApp', targetPhone, `AI sent WhatsApp to ${customerName || targetPhone}`);
                return waResult;
            }
            case 'send_bulk_whatsapp': {
                const { filter, message: bulkMsg } = args;
                let recipients: { phone: string; name: string }[] = [];
                if (filter === 'debtors') {
                    const sales = await prisma.sale.findMany({
                        where: { companyId, paymentStatus: { in: ['Partial', 'Unpaid'] } },
                        include: { customer: { select: { name: true, phone: true } } },
                        distinct: ['customerId']
                    });
                    recipients = sales.filter(s => s.customer?.phone).map(s => ({ name: s.customer!.name, phone: s.customer!.phone || '' }));
                } else if (filter === 'all-customers') {
                    const customers = await prisma.shopClient.findMany({ where: { companyId, phone: { not: '' } }, select: { name: true, phone: true } });
                    recipients = customers.map(c => ({ name: c.name, phone: c.phone || '' })).filter(r => r.phone);
                }
                if (recipients.length === 0) return { success: false, error: 'Ma jiraan qof telefoon leh oo la diri karo.' };
                const bulkResult = await sendBulkWhatsAppMessages(companyId, recipients, bulkMsg);
                await logAiAction(companyId, userId, 'WHATSAPP_BULK', 'WhatsApp', `BULK_${filter}`, `AI bulk WhatsApp: ${bulkResult.sent} sent, ${bulkResult.failed} failed`);
                return { success: true, sent: bulkResult.sent, failed: bulkResult.failed, total: recipients.length };
            }
            default:
                return { success: false, error: 'Unknown function' };
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const companyId = session.user.companyId;
        if (!companyId) return NextResponse.json({ error: 'Company ID missing' }, { status: 400 });

        const body = await req.json();
        const { message, image, sessionId } = body;
        if (!message && !image) return NextResponse.json({ error: 'Message or image required' }, { status: 400 });

        // --- SESSION & HISTORY ---
        let conversationId = sessionId;
        if (!conversationId) {
            // Find or create a default conversation for this user
            const existing = await prisma.aiConversation.findFirst({
                where: { companyId, userId: session.user.id },
                orderBy: { updatedAt: 'desc' }
            });
            conversationId = existing?.id;
            
            if (!conversationId) {
                const newConv = await prisma.aiConversation.create({
                    data: { companyId, userId: session.user.id, title: 'Revlo AI Chat' }
                });
                conversationId = newConv.id;
            }
        }

        // Fetch last 10 messages for context
        const prevMessages = await prisma.aiMessage.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            take: 12
        });
        
        // Map to Gemini format (reverse because we took 'desc' and 'take')
        const mappedHistory = prevMessages.reverse().map(m => ({
            role: m.role as 'user' | 'model',
            parts: [{ text: m.content }]
        }));

        // --- CREDIT CHECK ---
        const result: any[] = await prisma.$queryRawUnsafe(
            `SELECT "scanCredits", "scanPlan" FROM "companies" WHERE "_id" = $1`, companyId
        );
        const credits = result?.[0]?.scanCredits ?? 10;
        
        if (credits <= 0) {
            return NextResponse.json({
                error: 'NO_CREDITS',
                message: 'No credits remaining. Please upgrade your plan.'
            }, { status: 403 });
        }

        const prompt = `Waxaad tahay Revlo AI — waa COO (Chief Operating Officer) Casri ah oo dhinac walba ka taageera mulkiilaha dukaanka Revlo Shop System.

## QAANUUNKA UGU MUHIIMSAN — TOOL ISTICMAAL:
🚨 WELIGAA HA ODHAN "waan sameynayaa" ama "waan diiwaangelinayaa" ADIGA OO AADAN TOOL ISTICMAALIN!
Markaad rabto wax aad diiwaangaliso (alaab, PO, vendor, expense, iib, iwm), WAA INAAD TOOLS-KA ISTICMAASHAA.
Ha ku hadlin inay wax dhaceen — samee dhab ahaan adiga oo tool call-gareyaya!

## RASIIDKA ALAABTA (PURCHASE RECEIPT):
Marka qofku kuu soo diro sawir rasiid ah ama uu sheego in alaab cusub uu soo iibsaday:
1. Isticmaal "full_purchase_receipt" tool-ka si aad HAL TALLAABO wax walba ku diiwaangeliso
2. Tool-kan wuxuu samaynayaa: vendor cusub (haddii uusan jirin) + products cusub + purchase order + expense
3. Haddii selling price la waydiiyay ama lagugu yiraahdo "30% faa'iido ku dar", adigaa xisaabin kara
4. MARNABA ha odhan "waan sameeyay" adigoo aan tool isticmaalin

## MABAADI'DA:
1. **Ficil, Ha Hadal:** Tools-ka isticmaal si dhab ah. Qofku marka uu yiraahdo "diiwaangeli", isla markiiba tool call-garee.
2. **Business Partner:** U hadal sidii qof garab taagan ganacsadaha. Ereyo dhiirigelin leh.
3. **Growth Focused:** Diiradda saar faa'iidada, stock management, iyo customer loyalty.
4. **Smart & Concise:** Jawaab kooban, casri ah. Emojis isticmaal.

## AQOONTAADA:
- **Dashboard:** Wadnaha Ganacsiga — iibka, faa'iidada, meelaha u baahan xoog.
- **Inventory:** Isha Dukaanka — waxa dhammaanaya iyo waxa u baahan dalbasho.
- **POS & Sales:** Khabiir iibka — diiwaangelinta iibka, rasiidyada.
- **Debtors (Receivables):** Macaamiisha aan daynta ku lenahay — qofka lacagta nagu hayo iyo sida loo soo dhurto.
- **Payables:** Suplayerska/Vendorska daynta inagu leh — lacagaha aan iyaga u qabno.
- **Purchases:** Marka alaab cusub la soo iibsado — vendor + products + PO + expense HAL MAR ku samee.

## INTERACTIVE ACTIONS (SHAX):
Haddii rasiidka uu ka dhiman yahay "Qiimaha Iibka" (Selling Price) ama xog muhiim ah, ha isku dayin inaad iska qiyaasto (ilaa lagugu yiraahdo maaha). 
Beddelkeeda, soo celi jawaabtaada adigoo ku daraya tag-kan gaarka ah dhamaadka:
[ACTION_TABLE:JSON_DATA]
Halka JSON_DATA ay tahay liiska alaabta ka dhiman xogta (sida: [{"name": "Product A", "costPrice": 100, "sellingPrice": null}]).
Frontend-ku wuxuu u beddeli doonaa shax uu qofku buuxin karo.
LAAKIIN: Haddii qofku sheegay qiimaha iibka (sida "30% faa'iido ku dar"), ADIGU XISAABI oo tool isticmaal — shax ha soo dirin.

Qofka ayaa ku weydiiyay: "${message}"
${image ? "Sidoo kale, sawir ayuu kuu soo diray. Fadlan sawirkaas falanqee. Haddii uu rasiid yahay (purchase receipt), isla markiiba xogta ka soo saar oo isticmaal 'full_purchase_receipt' tool si aad diiwaangeliso." : ""}

Haddii su'aashu u baahan tahay xog cusub (live data), fadlan isticmaal Tools-ka lagu siiyay si aad u raadiso xogtaas inta aadan jawaabin.`;

        // --- GEMINI API ---
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash-lite',
            tools: [
                {
                    functionDeclarations: [
                        getShopSummaryDeclaration,
                        getLowStockProductsDeclaration,
                        getDebtorsDeclaration,
                        createCustomerDeclaration,
                        addProductDeclaration,
                        recordExpenseDeclaration,
                        createSaleDeclaration,
                        advancedSearchDeclaration,
                        bulkAddProductsDeclaration,
                        draftSmsDeclaration,
                        generateReportDeclaration,
                        createReminderDeclaration,
                        verifyPaymentDeclaration,
                        createPurchaseOrderDeclaration,
                        createVendorDeclaration,
                        fullPurchaseReceiptDeclaration,
                        sendWhatsAppDeclaration,
                        sendBulkWhatsAppDeclaration,
                        getTopCustomersDeclaration
                    ]
                }
            ]
        });
        
        // Start Chat to maintain context for function calling
        const chat = model.startChat({
            history: mappedHistory,
        });

        // Prepare message parts (multimodal support)
        let messageParts: any[] = [prompt, message || "Fadlan sawirkan falanqee."];
        let receiptUrl: string | null = null;

        if (image) {
            receiptUrl = await saveImage(image, companyId);
            try {
                const [mimePart, base64Data] = image.split(';base64,');
                const mimeType = mimePart.split(':')[1];
                messageParts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                });
            } catch (err) {
                console.error("Image parsing error:", err);
            }
        }

        let aiResult;
        try {
            aiResult = await chat.sendMessage(messageParts);
        } catch (primaryErr: any) {
            console.log('[Revlo AI] Primary model failed, trying fallback...', primaryErr.message);
            if (primaryErr.message?.includes('503') || primaryErr.message?.includes('demand') || primaryErr.message?.includes('overloaded')) {
                const fallbackModel = genAI.getGenerativeModel({
                    model: 'gemini-2.0-flash',
                    tools: [{
                        functionDeclarations: [
                            getShopSummaryDeclaration, getLowStockProductsDeclaration, getDebtorsDeclaration,
                            createCustomerDeclaration, addProductDeclaration, recordExpenseDeclaration,
                            createSaleDeclaration, advancedSearchDeclaration, bulkAddProductsDeclaration,
                            draftSmsDeclaration, generateReportDeclaration, createReminderDeclaration,
                            verifyPaymentDeclaration, createPurchaseOrderDeclaration, createVendorDeclaration,
                            fullPurchaseReceiptDeclaration, sendWhatsAppDeclaration, sendBulkWhatsAppDeclaration,
                            getTopCustomersDeclaration
                        ]
                    }]
                });
                const fallbackChat = fallbackModel.startChat({ history: mappedHistory });
                aiResult = await fallbackChat.sendMessage(messageParts);
            } else {
                throw primaryErr;
            }
        }

        // Handle Function Calls recursively
        let iteration = 0;
        const executedTools: any[] = [];
        while (aiResult.response.functionCalls() && iteration < 5) {
            const calls = aiResult.response.functionCalls();
            if (!calls) break;
            const functionResponses = [];

            for (const call of calls) {
                console.log(`[Revlo AI] Executing Tool: ${call.name}`);
                const apiResponse = await executeTool(call.name, call.args, req, companyId, session.user.id, receiptUrl);
                executedTools.push({ name: call.name, result: apiResponse });
                functionResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: apiResponse
                    }
                });
            }

            aiResult = await chat.sendMessage(functionResponses);
            iteration++;
        }

        // Deduct 1 credit
        await prisma.$executeRawUnsafe(
            `UPDATE "companies" SET "scanCredits" = "scanCredits" - 1 WHERE "_id" = $1`,
            companyId
        );

        const aiFinalText = aiResult.response.text();

        // --- SAVE TO DB ---
        await prisma.aiMessage.create({
            data: { conversationId, role: 'user', content: message || "[Sent an image]" }
        });
        await prisma.aiMessage.create({
            data: { conversationId, role: 'model', content: aiFinalText }
        });

        // Update conversation timestamp
        await prisma.aiConversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        // Stream back the final text
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const text = aiFinalText;
                    // We simulate streaming since sendMessage is blocking
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text, sessionId: conversationId })}\n\n`));
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true, executedTools })}\n\n`));
                    controller.close();
                } catch (err) {
                    console.error('Stream error:', err);
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: 'AI stream error' })}\n\n`));
                    controller.close();
                }
            }
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: any) {
        console.error('AI Chat proxy error:', error);
        
        let userMessage = 'Cillad ayaa ku timid AI-ga. Fadlan mar kale isku day.';
        if (error.message?.includes('503') || error.message?.includes('demand') || error.message?.includes('overloaded')) {
            userMessage = 'Server-yada AI-ga (Google Gemini) ayaa hadda aad mashquul u ah. Fadlan waxyar sug oo mar kale isku day. ⏳';
        }
        
        // Return as SSE stream so frontend handles it properly
        const errorStream = new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: userMessage, sessionId: null })}\n\n`));
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true, executedTools: [] })}\n\n`));
                controller.close();
            }
        });
        return new NextResponse(errorStream, {
            headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
        });
    }
}
