'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Printer,
    Download,
    Mail,
    Edit,
    Trash2,
    Truck,
    Calendar,
    DollarSign,
    CheckCircle,
    User,
    CreditCard,
    FileText,
    MapPin,
    Phone,
    Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/shop/ui/StatusBadge';
import { useReactToPrint } from 'react-to-print';

interface PurchaseOrder {
    id: string;
    poNumber: string;
    vendor: {
        name: string;
        email: string;
        phone: string;
        address: string;
        contactPerson: string;
    };
    items: {
        id: string;
        productId: string;
        productName: string;
        quantity: number;
        unitCost: number;
        total: number;
    }[];
    expenses: {
        id: string;
        amount: number;
        expenseDate: string;
        paidFrom: string;
        description: string;
    }[];
    createdAt: string;
    expectedDelivery: string;
    notes: string;
    subtotal: number;
    tax: number;
    total: number;
    paidAmount: number;
    paymentStatus: string;
    status: string;
}

export default function PurchaseOrderDetails({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { toast } = useToast();
    const [po, setPo] = useState<PurchaseOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        // @ts-ignore
        content: () => componentRef.current,
        documentTitle: po ? `${po.poNumber}_Invoice` : 'Purchase_Order',
    });

    useEffect(() => {
        const fetchPo = async () => {
            try {
                const res = await fetch(`/api/shop/purchases/${params.id}`);
                if (!res.ok) throw new Error('Failed to load order');
                const data = await res.json();
                setPo(data.purchaseOrder);
            } catch (error) {
                console.error(error);
                toast({ title: 'Error', description: 'Could not load purchase order.', variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        };
        fetchPo();
    }, [params.id, toast]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1120]">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!po) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC] dark:bg-[#0B1120] text-gray-500">
                <FileText size={48} className="opacity-20" />
                <p>Purchase Order not found.</p>
                <button onClick={() => router.back()} className="text-blue-500 hover:underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] pb-20 font-sans">
            {/* Header Actions */}
            <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-gray-800 dark:bg-[#151C2C]/80">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 rounded-lg py-2 pr-4 text-sm font-bold text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-white"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            <Printer size={16} /> Print
                        </button>
                        {/* <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-blue-500/30">
                            <Download size={16} /> PDF
                        </button> */}
                    </div>
                </div>
            </div>

            {/* Main Content (Printable Area) */}
            <div className="w-full px-4 md:px-8 mt-6">
                <div ref={componentRef} className="rounded-[24px] bg-white p-8 shadow-sm dark:bg-[#151C2C] dark:border dark:border-gray-800 print:text-black print:shadow-none print:dark:bg-white print:dark:text-black">

                    {/* Invoice Header */}
                    <div className="mb-8 flex flex-col justify-between gap-6 border-b border-gray-100 pb-8 dark:border-gray-800 md:flex-row md:items-start">
                        <div>
                            <div className="mb-2 flex items-center gap-3">
                                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-900/20 print:bg-transparent print:text-blue-600">
                                    <Truck size={28} />
                                </div>
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white print:text-black">Purchase Order</h1>
                            </div>
                            <p className="text-sm font-medium text-gray-500">#{po.poNumber}</p>
                            <div className="mt-4 flex gap-2">
                                <StatusBadge status={po.status} />
                                <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${po.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                                    po.paymentStatus === 'Partial' ? 'bg-orange-100 text-orange-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${po.paymentStatus === 'Paid' ? 'bg-green-600' :
                                        po.paymentStatus === 'Partial' ? 'bg-orange-600' :
                                            'bg-red-600'
                                        }`} />
                                    {po.paymentStatus}
                                </span>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="mb-1 text-sm font-bold text-gray-400">Date Issued</div>
                            <div className="mb-4 text-lg font-bold text-gray-900 dark:text-white print:text-black">{format(new Date(po.createdAt), 'MMMM dd, yyyy')}</div>

                            {po.expectedDelivery && (
                                <>
                                    <div className="mb-1 text-sm font-bold text-gray-400">Expected Delivery</div>
                                    <div className="text-md font-medium text-gray-700 dark:text-gray-300 print:text-black">{format(new Date(po.expectedDelivery), 'MMM dd, yyyy')}</div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Vendor and Company Info */}
                    <div className="mb-10 grid grid-cols-1 gap-12 md:grid-cols-2">
                        <div>
                            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">Supplier Details</h3>
                            <div className="space-y-1">
                                <p className="text-xl font-bold text-gray-900 dark:text-white print:text-black">{po.vendor.name}</p>
                                {po.vendor.contactPerson && <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><User size={14} /> {po.vendor.contactPerson}</p>}
                                {po.vendor.email && <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Mail size={14} /> {po.vendor.email}</p>}
                                {po.vendor.phone && <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Phone size={14} /> {po.vendor.phone}</p>}
                                {po.vendor.address && <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><MapPin size={14} /> {po.vendor.address}</p>}
                            </div>
                        </div>
                        {/* We could add generic company info or shipping info here if we had it in state */}
                        <div className="rounded-xl bg-gray-50 p-6 dark:bg-gray-800/50 print:bg-gray-50 print:border print:border-gray-200">
                            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">Notes</h3>
                            <p className="text-sm font-medium italic text-gray-600 dark:text-gray-300 print:text-gray-700">
                                {po.notes || "No additional notes for this order."}
                            </p>
                        </div>
                    </div>

                    {/* Items Table - Desktop */}
                    <div className="hidden md:block mb-10 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Item</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Qty</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Unit Cost</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {po.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4">
                                            {item.productId ? (
                                                <a href={`/shop/inventory/${item.productId}`} className="font-bold text-blue-600 hover:underline dark:text-blue-400 print:text-black print:no-underline">
                                                    {item.productName}
                                                </a>
                                            ) : (
                                                <p className="font-bold text-gray-900 dark:text-white print:text-black">{item.productName}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-600 dark:text-gray-300">{item.quantity}</td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-600 dark:text-gray-300">ETB {item.unitCost.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white print:text-black">ETB {item.total.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Items List - Mobile */}
                    <div className="md:hidden space-y-4 mb-10">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Ordered Items</h3>
                        {po.items.map((item) => (
                            <div key={item.id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-start mb-2">
                                    {item.productId ? (
                                        <a href={`/shop/inventory/${item.productId}`} className="font-bold text-blue-600 hover:underline dark:text-blue-400 text-sm">
                                            {item.productName}
                                        </a>
                                    ) : (
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{item.productName}</p>
                                    )}
                                    <span className="text-xs font-bold bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">x{item.quantity}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Rate: ETB {item.unitCost.toLocaleString()}</span>
                                    <span className="font-bold text-gray-900 dark:text-white">ETB {item.total.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Financial Summary */}
                    <div className="flex flex-col md:flex-row justify-end gap-12">
                        {/* Payment History */}
                        <div className="flex-1">
                            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">Payment History</h3>
                            {po.expenses.length > 0 ? (
                                <ul className="space-y-3">
                                    {po.expenses.map((exp) => (
                                        <li key={exp.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800/10 print:bg-transparent print:border print:border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-full bg-green-100 p-1.5 text-green-600 print:hidden">
                                                    <CheckCircle size={12} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-700 dark:text-gray-300">{format(new Date(exp.expenseDate), 'MMM dd, yyyy')}</p>
                                                    <p className="text-xs text-gray-500">{exp.paidFrom}</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-gray-900 dark:text-white">ETB {exp.amount.toLocaleString()}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No payments recorded yet.</p>
                            )}
                        </div>

                        {/* Totals */}
                        <div className="w-full md:w-80 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-500">Subtotal</span>
                                <span className="font-bold text-gray-900 dark:text-white">ETB {po.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-500">Tax</span>
                                <span className="font-bold text-gray-900 dark:text-white">ETB {po.tax.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-dashed border-gray-200 pt-3 dark:border-gray-700">
                                <div className="flex justify-between text-lg">
                                    <span className="font-bold text-gray-900 dark:text-white">Total</span>
                                    <span className="font-black text-blue-600">ETB {po.total.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex justify-between text-sm text-green-600">
                                <span className="font-bold">Paid</span>
                                <span className="font-bold">- ETB {po.paidAmount.toLocaleString()}</span>
                            </div>
                            <div className="mt-2 flex justify-between rounded-xl bg-gray-900 p-4 text-white dark:bg-gray-800 print:bg-black print:text-white">
                                <span className="font-bold">Balance Due</span>
                                <span className="font-black">ETB {(po.total - po.paidAmount).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Signature Area for print */}
                    <div className="mt-20 hidden pt-8 text-center text-sm text-gray-400 print:block">
                        <div className="border-t border-gray-200 pt-4">
                            <p>Authorized Signature</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
