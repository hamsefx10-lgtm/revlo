import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
    const data = [
        {
            "Name": "Example Product",
            "SKU": "PROD-001",
            "Category": "Electronics",
            "Cost Price": 50,
            "Selling Price": 80,
            "Stock": 100,
            "Min Stock": 10
        },
        {
            "Name": "Another Item",
            "SKU": "PROD-002",
            "Category": "General",
            "Cost Price": 10,
            "Selling Price": 20,
            "Stock": 50,
            "Min Stock": 5
        }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="inventory_template.xlsx"'
        }
    });
}
