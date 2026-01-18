'use client';

import React from 'react';
import { Printer, Download, Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function InvoicePage({ params }: { params: { id: string } }) {
    // Mock Data
    const invoice = {
        id: 'INV-1001',
        date: 'Jan 15, 2026',
        customer: {
            name: 'Ahmed Yassin',
            phone: '+252 61 500 0000',
            address: 'Hodan District, Mogadishu'
        },
        company: {
            name: 'Revlo Doors & Aluminium',
            address: 'Industrial Area, Jigjiga Yar',
            phone: '+252 63 400 0000',
            email: 'sales@revlo.com'
        },
        items: [
            { id: 1, desc: 'Ganjeelo Bir ah (4x3m) - Heavy Duty', qty: 1, price: 54000, total: 54000 },
            { id: 2, desc: 'Installation Fee', qty: 1, price: 3000, total: 3000 },
            { id: 3, desc: 'Transport / Xamaal', qty: 1, price: 1500, total: 1500 },
        ],
        subtotal: 58500,
        tax: 0,
        total: 58500,
        paid: 30000,
        balance: 28500
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 md:p-8 p-4 print:p-0 print:bg-white">

            {/* TOOLBAR (Hidden when printing) */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <Link href="/sales" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold text-sm">
                    <ArrowLeft size={18} /> Back
                </Link>
                <div className="flex gap-3">
                    <button onClick={handlePrint} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 px-4 py-2 rounded-lg font-bold shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-2 hover:bg-gray-50">
                        <Printer size={18} /> Print
                    </button>
                    <button className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 hover:bg-black">
                        <Download size={18} /> Download PDF
                    </button>
                </div>
            </div>

            {/* INVOICE PAPER */}
            <div className="max-w-4xl mx-auto bg-white text-gray-900 shadow-2xl rounded-none md:rounded-lg overflow-hidden min-h-[1000px] flex flex-col print:shadow-none print:min-h-0">

                {/* HEADER */}
                <div className="bg-gray-900 text-white p-12 print:bg-gray-900 print:text-white print:-mx-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight mb-2">INVOICE</h1>
                            <p className="opacity-70 font-mono">#{invoice.id}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold">{invoice.company.name}</h2>
                            <p className="opacity-80 mt-1 text-sm">{invoice.company.address}</p>
                            <p className="opacity-80 text-sm">{invoice.company.phone}</p>
                        </div>
                    </div>
                </div>

                <div className="p-12 flex-1">

                    {/* BILL TO DETAILS */}
                    <div className="flex justify-between border-b-2 border-gray-100 pb-8 mb-8">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Invoiced To:</h3>
                            <h4 className="text-xl font-bold mb-1">{invoice.customer.name}</h4>
                            <p className="text-gray-500 text-sm">{invoice.customer.address}</p>
                            <p className="text-gray-500 text-sm">{invoice.customer.phone}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Invoice Date:</h3>
                            <h4 className="text-xl font-bold mb-1">{invoice.date}</h4>
                            <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold uppercase">
                                Partial Payment
                            </span>
                        </div>
                    </div>

                    {/* ITEMS TABLE */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="text-left border-b-2 border-gray-900">
                                <th className="py-3 font-bold uppercase text-xs w-1/2">Item Description</th>
                                <th className="py-3 font-bold uppercase text-xs text-center">Qty</th>
                                <th className="py-3 font-bold uppercase text-xs text-right">Price</th>
                                <th className="py-3 font-bold uppercase text-xs text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoice.items.map(item => (
                                <tr key={item.id}>
                                    <td className="py-4 font-semibold text-gray-700">{item.desc}</td>
                                    <td className="py-4 text-center font-mono text-gray-500">{item.qty}</td>
                                    <td className="py-4 text-right font-mono text-gray-500">{item.price.toLocaleString()}</td>
                                    <td className="py-4 text-right font-mono font-bold text-gray-900">{item.total.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* TOTALS */}
                    <div className="flex justify-end">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-sm font-bold text-gray-500">
                                <span>Subtotal</span>
                                <span>{invoice.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-gray-500">
                                <span>Tax (0%)</span>
                                <span>{invoice.tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xl font-black text-gray-900 border-t-2 border-gray-900 pt-3">
                                <span>Total</span>
                                <span>{invoice.total.toLocaleString()}</span>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <div className="flex justify-between text-sm font-bold text-green-600 mb-1">
                                    <span>Amount Paid</span>
                                    <span>- {invoice.paid.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-lg font-black text-red-600">
                                    <span>Balance Due</span>
                                    <span>{invoice.balance.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="bg-gray-50 p-12 border-t border-gray-100 print:bg-white print:border-gray-200">
                    <h5 className="font-bold text-center text-sm mb-2">Thank you for your business!</h5>
                    <p className="text-center text-xs text-gray-500 max-w-md mx-auto">
                        Please include invoice number on your check. Terms: 50% deposit required to confirm order. Balance due upon completion/delivery.
                    </p>
                </div>

            </div>
        </div>
    );
}
