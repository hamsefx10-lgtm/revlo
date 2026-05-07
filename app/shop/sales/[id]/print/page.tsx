'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

export default function PrintReceiptPage({ params }: { params: { id: string } }) {
    const [sale, setSale] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [company, setCompany] = useState<any>(null);
    const searchParams = useSearchParams();
    const autoPrint = searchParams.get('auto') === '1';
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (sale && autoPrint) {
            setTimeout(() => window.print(), 800);
        }
    }, [sale, autoPrint]);

    const fetchData = async () => {
        try {
            const [saleRes, companyRes] = await Promise.all([
                fetch(`/api/shop/sales/${params.id}`),
                fetch('/api/settings/company')
            ]);
            const saleData = await saleRes.json();
            const companyData = await companyRes.json();
            setSale(saleData.sale);
            setCompany(companyData.company);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-400 font-bold">Loading receipt...</p>
                </div>
            </div>
        );
    }

    if (!sale) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <p className="text-red-500 font-bold">Receipt not found</p>
            </div>
        );
    }

    const total = Number(sale.total || 0);
    const paid = Number(sale.paidAmount || 0);
    const balance = Math.max(0, total - paid);
    const isFullyPaid = balance <= 0;
    const isRefunded = sale.status === 'Refunded' || sale.status === 'PartialRefund';
    const companyName = company?.name || 'Revlo Shop';
    const currencySymbol = sale.currency === 'USD' ? '$' : 'ETB';

    return (
        <>
            <style jsx global>{`
                @media print {
                    body { margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                    .print-area { 
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                }
                @page {
                    size: A4;
                    margin: 12mm 15mm;
                }
            `}</style>

            {/* Print Controls (Hidden on print) */}
            <div className="no-print sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => window.history.back()} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-600 transition-all">
                        ← Dib u noqo
                    </button>
                    <h1 className="text-sm font-black text-gray-900">
                        Receipt #{sale.invoiceNumber}
                    </h1>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => window.print()} 
                        className="px-6 py-2.5 bg-[#3498DB] hover:bg-[#2980B9] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                        🖨️ Daabac (Print)
                    </button>
                </div>
            </div>

            {/* RECEIPT */}
            <div className="min-h-screen bg-gray-50 flex justify-center py-8 no-print-bg">
                <div ref={printRef} className="print-area bg-white w-full max-w-[800px] shadow-xl border border-gray-100 relative overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
                    
                    {/* Watermark */}
                    {isFullyPaid && !isRefunded && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03]">
                            <span className="text-[140px] font-black text-green-500 -rotate-30 whitespace-nowrap tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                PAID
                            </span>
                        </div>
                    )}
                    {isRefunded && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.04]">
                            <span className="text-[120px] font-black text-red-500 -rotate-30 whitespace-nowrap tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                REFUNDED
                            </span>
                        </div>
                    )}

                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex justify-between items-start p-10 pb-0">
                            {/* Left: Company Info */}
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-10 h-10 bg-[#0f172a] rounded-xl flex items-center justify-center">
                                        <span className="text-white font-black text-sm">{companyName.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-[#0f172a] tracking-tight">{companyName}</h2>
                                        <p className="text-[10px] text-gray-400 font-bold">Official Receipt Document</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Invoice Info */}
                            <div className="text-right">
                                <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                    RECEIPT
                                </h1>
                                <p className="text-sm font-bold text-[#3498DB] mt-1">#{sale.invoiceNumber}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-1">
                                    {format(new Date(sale.createdAt), 'MMMM dd, yyyy • hh:mm a')}
                                </p>
                            </div>
                        </div>

                        {/* Status + Customer Info Bar */}
                        <div className="mx-10 mt-6 flex gap-4">
                            {/* Bill To */}
                            <div className="flex-1 bg-[#0f172a] text-white p-5 rounded-xl">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Bill To</p>
                                <p className="font-black text-lg">{sale.customer?.name || 'Walk-in Customer'}</p>
                                {sale.customer?.phone && (
                                    <p className="text-xs text-gray-400 mt-1">{sale.customer.phone}</p>
                                )}
                                {sale.customer?.email && (
                                    <p className="text-xs text-gray-400">{sale.customer.email}</p>
                                )}
                            </div>
                            
                            {/* Payment Info */}
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 flex flex-col justify-center">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Payment Method</p>
                                        <p className="text-sm font-black text-[#0f172a]">{sale.paymentMethod || 'Cash'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider mt-0.5 ${
                                            isRefunded ? 'bg-red-50 text-red-600 border border-red-100' :
                                            isFullyPaid ? 'bg-green-50 text-green-600 border border-green-100' : 
                                            'bg-amber-50 text-amber-600 border border-amber-100'
                                        }`}>
                                            {isRefunded ? (sale.status === 'PartialRefund' ? 'Partial Refund' : 'Refunded') : (isFullyPaid ? 'Paid' : 'Partial')}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Currency</p>
                                        <p className="text-sm font-black text-[#0f172a]">{sale.currency || 'ETB'}</p>
                                    </div>
                                    {sale.currency === 'USD' && sale.exchangeRate && (
                                        <div>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Exchange Rate</p>
                                            <p className="text-sm font-black text-[#0f172a]">{sale.exchangeRate} ETB/USD</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mx-10 mt-6">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-[#0f172a] text-white">
                                        <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-widest">#</th>
                                        <th className="text-left py-3 px-4 text-[9px] font-bold uppercase tracking-widest">Description</th>
                                        <th className="text-center py-3 px-4 text-[9px] font-bold uppercase tracking-widest">Qty</th>
                                        <th className="text-right py-3 px-4 text-[9px] font-bold uppercase tracking-widest">Unit Price</th>
                                        <th className="text-right py-3 px-4 text-[9px] font-bold uppercase tracking-widest">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sale.items?.map((item: any, i: number) => (
                                        <tr key={i} className="border-b border-gray-100 last:border-b-2 last:border-[#0f172a]">
                                            <td className="py-3 px-4 text-xs text-gray-400 font-bold">{i + 1}</td>
                                            <td className="py-3 px-4">
                                                <p className="font-black text-[#0f172a] text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>{item.productName}</p>
                                            </td>
                                            <td className="py-3 px-4 text-center text-xs font-bold text-gray-500">{item.quantity}</td>
                                            <td className="py-3 px-4 text-right text-xs font-bold text-gray-500">
                                                {Number(item.unitPrice).toLocaleString()} <span className="text-[8px] text-gray-300">{currencySymbol}</span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-black text-[#0f172a] text-sm">
                                                {Number(item.total).toLocaleString()} <span className="text-[8px] text-gray-300">{currencySymbol}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary */}
                        <div className="mx-10 mt-6 flex justify-end">
                            <div className="w-[320px]">
                                <div className="flex justify-between py-2 text-sm text-gray-500">
                                    <span>Subtotal</span>
                                    <span className="font-bold text-[#0f172a]">{Number(sale.subtotal || sale.total).toLocaleString()} {currencySymbol}</span>
                                </div>
                                {(sale.tax || 0) > 0 && (
                                    <div className="flex justify-between py-2 text-sm text-gray-500">
                                        <span>Tax (VAT)</span>
                                        <span className="font-bold text-[#0f172a]">{Number(sale.tax).toLocaleString()} {currencySymbol}</span>
                                    </div>
                                )}
                                {(sale.discountAmount || 0) > 0 && (
                                    <div className="flex justify-between py-2 text-sm text-green-600">
                                        <span>Discount</span>
                                        <span className="font-bold">-{Number(sale.discountAmount).toLocaleString()} {currencySymbol}</span>
                                    </div>
                                )}
                                
                                {/* Grand Total */}
                                <div className="flex justify-between items-center py-4 mt-2 border-t-2 border-b border-[#0f172a]">
                                    <span className="text-lg font-black text-[#0f172a]" style={{ fontFamily: "'Outfit', sans-serif" }}>Grand Total</span>
                                    <span className="text-xl font-black text-[#3498DB]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                        {total.toLocaleString()} {currencySymbol}
                                    </span>
                                </div>

                                {/* Paid */}
                                <div className="flex justify-between py-3 text-green-600">
                                    <div>
                                        <span className="font-bold text-sm">Amount Paid</span>
                                    </div>
                                    <span className="font-black text-sm">{paid.toLocaleString()} {currencySymbol}</span>
                                </div>

                                {/* Balance */}
                                {balance > 0 && (
                                    <div className="flex justify-between py-3 text-red-500 font-black text-sm">
                                        <span>Balance Due</span>
                                        <span>{balance.toLocaleString()} {currencySymbol}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Refund Info */}
                        {isRefunded && sale.notes && (
                            <div className="mx-10 mt-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Refund Note</p>
                                <p className="text-xs text-red-700">{sale.notes}</p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="mx-10 mt-10 mb-10 pt-6 border-t border-gray-200 flex justify-between items-end">
                            <div>
                                <h4 className="font-black text-sm text-[#0f172a] mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                    Thank you for your business!
                                </h4>
                                <p className="text-[10px] text-gray-400 leading-relaxed">
                                    If you have any questions, please contact us.<br />
                                    <span className="text-gray-300 text-[9px] font-bold">
                                        Generated by Revlo Premium System • REF: {sale.id?.substring(sale.id.length - 12).toUpperCase()}
                                    </span>
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="w-[120px] h-[2px] bg-[#0f172a] mb-2 ml-auto"></div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Authorized Signature</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
