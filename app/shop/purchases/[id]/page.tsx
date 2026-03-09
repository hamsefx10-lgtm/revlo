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
    Loader2,
    Barcode,
    ExternalLink,
    ChevronRight,
    Tag,
    Layers,
    Clock,
    Plus,
    X,
    MoreVertical,
    AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import BarcodeComponent from 'react-barcode';
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
    currency: string;
    exchangeRate: number;
    shippingCost: number;
    customsFee: number;
    otherExpenses: number;
    status: string;
    items: {
        id: string;
        productId: string;
        productName: string;
        quantity: number;
        unitCost: number;
        total: number;
        unitCostUSD?: number;
        product?: {
            sku: string;
            sellingPrice: number;
        };
    }[];
}

const BarcodePrintTemplate = React.forwardRef(({ items }: { items: any[] }, ref: any) => (
    <div ref={ref} className="p-10 bg-white min-h-screen">
        <div className="grid grid-cols-2 gap-8">
            {items.map((item, idx) => (
                <div key={idx} className="border-2 border-black p-4 flex flex-col items-center justify-center text-center break-inside-avoid mb-6">
                    <p className="font-bold text-lg mb-1 truncate w-full">{item.productName}</p>
                    <div className="scale-90">
                        <BarcodeComponent
                            value={item.product?.sku || 'NO-SKU'}
                            width={1.5}
                            height={50}
                            fontSize={14}
                        />
                    </div>
                    <p className="font-bold mt-1">ETB {item.product?.sellingPrice?.toLocaleString() || 'N/A'}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Order Item: {idx + 1}</p>
                </div>
            ))}
        </div>
    </div>
));
BarcodePrintTemplate.displayName = 'BarcodePrintTemplate';

export default function PurchaseOrderDetails({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { toast } = useToast();
    const [po, setPo] = useState<PurchaseOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const componentRef = useRef<HTMLDivElement>(null);
    const barcodeRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        // @ts-ignore
        content: () => componentRef.current,
        documentTitle: po ? `${po.poNumber}_Invoice` : 'Purchase_Order',
    });

    const handlePrintBarcodes = useReactToPrint({
        // @ts-ignore
        content: () => barcodeRef.current,
        documentTitle: po ? `${po.poNumber}_Barcodes` : 'Item_Barcodes',
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
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] pb-20 font-sans animate-fade-in">
            {/* STICKY ACTION HEADER */}
            <div className="sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 bg-white/70 dark:bg-[#151C2C]/70 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8 py-3">
                    <button
                        onClick={() => router.back()}
                        className="group flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm font-black text-gray-500 transition-all hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white border border-gray-100 dark:border-gray-700"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden sm:inline">Return to Logistics</span>
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-5 py-2 text-sm font-black text-gray-700 dark:text-gray-200 transition-all hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none sm:px-6"
                        >
                            <Printer size={18} /> <span className="hidden sm:inline">Print Document</span>
                        </button>
                        <Link
                            href={`/shop/purchases/edit/${po.id}`}
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-black text-white shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-blue-500/30 sm:px-6"
                        >
                            <Edit size={18} /> <span className="hidden sm:inline">Modify Order</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 md:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: MAIN ORDER INFO */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* INVOICE CARD */}
                        <div ref={componentRef} className="rounded-[2.5rem] bg-white dark:bg-[#151C2C] p-8 md:p-12 shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-gray-800 relative overflow-hidden print:shadow-none print:border-none print:p-0">

                            {/* Decorative Accent */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

                            {/* DOCUMENT HEADER */}
                            <div className="flex flex-col md:flex-row justify-between gap-8 mb-12 relative">
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl text-white shadow-lg shadow-blue-500/30">
                                            <Truck size={36} />
                                        </div>
                                        <div>
                                            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Purchase Order</h2>
                                            <p className="text-blue-600 font-black tracking-widest text-[10px] uppercase mt-1">Official Requisition Document</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-6">
                                        <div className="px-4 py-1.5 bg-gray-900 dark:bg-gray-800 text-white rounded-full text-xs font-black tracking-widest uppercase">
                                            #{po.poNumber}
                                        </div>
                                        <StatusBadge status={po.status} />
                                        <span className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ${po.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {po.paymentStatus}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right flex flex-col justify-end">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Issue Date</p>
                                    <p className="text-xl font-black text-gray-900 dark:text-white">{format(new Date(po.createdAt), 'MMMM dd, yyyy')}</p>
                                    {po.expectedDelivery && (
                                        <div className="mt-4">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Expected Arrival</p>
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{format(new Date(po.expectedDelivery), 'MMM dd, yyyy')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ENTITIES GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 border-y border-gray-100 dark:border-gray-800 py-10">
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Supplier Information</h4>
                                    <div className="space-y-4">
                                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{po.vendor.name}</p>
                                        <div className="space-y-2">
                                            {po.vendor.contactPerson && <p className="flex items-center gap-3 text-sm text-gray-500 font-medium"><User size={16} className="text-blue-500" /> {po.vendor.contactPerson}</p>}
                                            {po.vendor.phone && <p className="flex items-center gap-3 text-sm text-gray-500 font-medium"><Phone size={16} className="text-blue-500" /> {po.vendor.phone}</p>}
                                            {po.vendor.email && <p className="flex items-center gap-3 text-sm text-gray-500 font-medium"><Mail size={16} className="text-blue-500" /> {po.vendor.email}</p>}
                                            {po.vendor.address && <p className="flex items-center gap-3 text-sm text-gray-500 font-medium"><MapPin size={16} className="text-blue-500" /> {po.vendor.address}</p>}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800/30 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700/50">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Internal Memo</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic font-medium">
                                        {po.notes || "No specific instructions or internal notes provided for this procurement cycle."}
                                    </p>
                                </div>
                            </div>

                            {/* ITEMS TABLE */}
                            <div className="mb-12">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-2">Manifest Details</h4>
                                <div className="overflow-hidden rounded-3xl border border-gray-100 dark:border-gray-800">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Requisition Item</th>
                                                <th className="px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty</th>
                                                <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit Value</th>
                                                <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Extension</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                            {po.items.map((item) => (
                                                <tr key={item.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                                {item.productName}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-wider">SKU: {item.product?.sku || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center font-black text-gray-700 dark:text-gray-300">{item.quantity}</td>
                                                    <td className="px-6 py-5 text-right">
                                                        <p className="text-sm font-black text-gray-900 dark:text-white">ETB {item.unitCost.toLocaleString()}</p>
                                                        {po.currency === 'USD' && item.unitCostUSD && (
                                                            <p className="text-[10px] font-bold text-blue-500 mt-0.5">$ {item.unitCostUSD.toLocaleString()}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <p className="text-sm font-black text-gray-900 dark:text-white">ETB {item.total.toLocaleString()}</p>
                                                        {po.currency === 'USD' && item.unitCostUSD && (
                                                            <p className="text-[10px] font-bold text-blue-500 mt-0.5">$ {(item.unitCostUSD * item.quantity).toLocaleString()}</p>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* SIGNATURE AREA (PRINT ONLY) */}
                            <div className="mt-20 hidden print:block pt-12 border-t border-gray-200">
                                <div className="flex justify-between items-end">
                                    <div className="text-center w-64">
                                        <div className="border-b-2 border-black mb-2" />
                                        <p className="text-sm font-bold uppercase tracking-widest">Vendor Acceptance</p>
                                    </div>
                                    <div className="text-center w-64">
                                        <div className="border-b-2 border-black mb-2" />
                                        <p className="text-sm font-bold uppercase tracking-widest">Authorized Signature</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STOCK LABELING SECTION */}
                        <div className="rounded-[2.5rem] bg-white dark:bg-[#151C2C] p-10 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-none">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-2xl">
                                        <Barcode size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">Stock Labeling</h3>
                                        <p className="text-sm text-gray-500 font-medium">Generate barcodes for batch item processing.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handlePrintBarcodes}
                                    className="flex items-center justify-center gap-2 rounded-2xl bg-gray-900 hover:bg-black px-8 py-4 text-sm font-black text-white shadow-xl shadow-gray-900/20 transition-all active:scale-95"
                                >
                                    <Printer size={18} /> Print Bulk Labels
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {po.items.map((item, idx) => (
                                    <div key={idx} className="p-6 rounded-3xl border-2 border-gray-100 dark:border-gray-800 flex flex-col items-center group hover:border-blue-500/30 transition-all bg-gray-50/30 dark:bg-gray-800/20">
                                        <p className="font-black text-gray-800 dark:text-gray-200 mb-4 text-center line-clamp-1 w-full">{item.productName}</p>
                                        <div className="bg-white p-4 rounded-xl shadow-sm dark:bg-white group-hover:scale-105 transition-transform duration-300">
                                            <BarcodeComponent
                                                value={item.product?.sku || 'NO-SKU'}
                                                width={1.2}
                                                height={40}
                                                fontSize={12}
                                                background="transparent"
                                            />
                                        </div>
                                        <div className="mt-4 flex items-center justify-between w-full pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Extension</span>
                                            <span className="text-sm font-black text-gray-900 dark:text-white">x{item.quantity}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: FINANCIALS & HISTORY */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* REQUISITION SUMMARY */}
                        <div className="rounded-[2.5rem] bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 p-10 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full -mb-24 -mr-24 blur-3xl pointer-events-none" />

                            <h3 className="text-lg font-black uppercase tracking-[0.2em] mb-8 opacity-60">Financial View</h3>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center opacity-80">
                                    <span className="text-sm font-bold">Subtotal Value</span>
                                    <span className="text-lg font-black">ETB {po.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center opacity-80">
                                    <span className="text-sm font-bold">Calculated Tax</span>
                                    <span className="text-lg font-black">ETB {po.tax.toLocaleString()}</span>
                                </div>

                                {po.currency === 'USD' && (
                                    <div className="py-6 border-y border-white/10 space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#3498DB]">Landed Costs (USD)</p>
                                        <div className="flex justify-between text-sm opacity-80">
                                            <span>S&F / Freight</span>
                                            <span className="font-bold">$ {po.shippingCost.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm opacity-80">
                                            <span>Customs / Duty</span>
                                            <span className="font-bold">$ {po.customsFee.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm opacity-80">
                                            <span>Brokerage / Misc</span>
                                            <span className="font-bold">$ {po.otherExpenses.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-bold opacity-60">Grand Total</span>
                                        <span className="text-4xl font-black text-[#3498DB] leading-none">ETB {po.total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 text-green-400">
                                        <span className="text-xs font-black uppercase tracking-widest">Liquidated</span>
                                        <span className="text-lg font-black">- ETB {po.paidAmount.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="mt-8 p-6 bg-white/10 rounded-[2rem] border border-white/10 backdrop-blur-md">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-black uppercase tracking-widest opacity-60 text-red-300">Net Liability</span>
                                        {po.paymentStatus === 'Paid' && <CheckCircle size={16} className="text-green-400" />}
                                    </div>
                                    <p className="text-3xl font-black tracking-tighter">ETB {(po.total - po.paidAmount).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* TRANSACTIONAL LOG */}
                        <div className="rounded-[2.5rem] bg-white dark:bg-[#151C2C] p-10 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-none">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                                    <Clock size={24} />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">Audit Trail</h3>
                            </div>

                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-gray-100 before:to-gray-100 dark:before:via-gray-800 dark:before:to-gray-800">
                                {po.expenses.length > 0 ? po.expenses.map((exp) => (
                                    <div key={exp.id} className="relative pl-10 group">
                                        <div className="absolute left-0 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-blue-500 ring-4 ring-blue-500/10 group-hover:scale-150 transition-transform dark:border-[#151C2C]" />
                                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 group-hover:border-blue-500/30 transition-all">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-sm font-black text-gray-900 dark:text-white">ETB {exp.amount.toLocaleString()}</p>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{format(new Date(exp.expenseDate), 'MMM dd')}</p>
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{exp.paidFrom}</p>
                                            {exp.description && <p className="text-[10px] text-gray-400 italic mt-2 line-clamp-1">{exp.description}</p>}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 opacity-40">
                                        <AlertTriangle size={32} className="mx-auto mb-2" />
                                        <p className="text-xs font-bold uppercase tracking-widest">No Activity Logged</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* BARCODE PRINT TEMPLATE (HIDDEN) */}
            <div className="hidden">
                <BarcodePrintTemplate ref={barcodeRef} items={po.items} />
            </div>
        </div>
    );
}
