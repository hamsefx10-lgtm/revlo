"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Download,
    Printer,
    MessageCircle,
    TrendingUp,
    History,
    Check,
    Receipt
} from 'lucide-react';
import { format } from 'date-fns';

export default function SaleDetailsPage({ params }: { params: { id: string } }) {
    const [sale, setSale] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sendingWa, setSendingWa] = useState(false);

    useEffect(() => {
        const fetchSale = async () => {
            try {
                const response = await fetch(`/api/shop/sales/${params.id}`);
                const data = await response.json();
                // FIXED: The API returns { sale: { ... } }, so we need to set data.sale
                setSale(data.sale);
            } catch (error) {
                console.error('Error fetching sale:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSale();
    }, [params.id]);

    const handleWhatsApp = async () => {
        setSendingWa(true);
        try {
            await fetch(`/api/shop/sales/${params.id}/whatsapp`, { method: 'POST' });
            alert('WhatsApp message sent successfully!');
        } catch (error) {
            console.error('Error sending WhatsApp:', error);
            alert('Failed to send WhatsApp message.');
        } finally {
            setSendingWa(false);
        }
    };

    const handleExport = async (type: 'download' | 'print') => {
        const url = `/api/public/shop/receipt/${params.id}${type === 'print' ? '?action=view' : ''}`;
        if (type === 'print') {
            window.open(url, '_blank');
        } else {
            window.location.href = url;
        }
    };

    const formatDate = (date: string, compact = false) => {
        if (!date) return '---';
        try {
            return format(new Date(date), compact ? 'MMM dd, yyyy' : 'MMMM dd, yyyy');
        } catch (e) {
            return '---';
        }
    };

    const formatTime = (date: string) => {
        if (!date) return '---';
        try {
            return format(new Date(date), 'hh:mm a');
        } catch (e) {
            return '---';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0F1A]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#3498DB] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Loading Invoice...</p>
                </div>
            </div>
        );
    }

    if (!sale) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0F1A] p-6 text-center">
                <div className="p-6 bg-rose-500/10 rounded-[2rem] text-rose-500 mb-6">
                    <Receipt size={48} />
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Invoice Not Found</h1>
                <p className="text-slate-500 mb-8 max-w-xs">The sale record you are looking for might have been removed or doesn't exist.</p>
                <Link href="/shop/sales" className="px-8 py-4 bg-[#3498DB] hover:bg-[#2980B9] text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2">
                    <ArrowLeft size={18} /> Return to History
                </Link>
            </div>
        );
    }

    const totalCostETB = sale.items?.reduce((sum: number, item: any) => sum + (Number(item.totalCost || 0)), 0) || 0;
    const rate = sale.currency === 'USD' ? (sale.exchangeRate || 1) : 1;
    const revenueBase = Number(sale.subtotal || sale.total - (sale.tax || 0));
    const revenueETB = revenueBase * rate;
    const profitETB = revenueETB - totalCostETB;
    const margin = revenueETB > 0 ? (profitETB / revenueETB) * 100 : 0;

    const currencySymbol = sale.currency === 'USD' ? '$' : 'ETB';

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F1A] animate-fade-in font-sans w-full p-4 lg:p-6 overflow-hidden flex flex-col">

            {/* HEADER - COMPACT TOOLBAR */}
            <div className="flex items-center justify-between mb-6 max-w-[1600px] w-full mx-auto px-2">
                <div className="flex items-center gap-4">
                    <Link href="/shop/sales" className="p-2.5 rounded-xl bg-white dark:bg-[#161B2E] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-[#3498DB] hover:border-[#3498DB]/30 transition-all shadow-sm group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            Invoice <span className="text-[#3498DB]">#{sale.invoiceNumber}</span>
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                            {formatDate(sale.createdAt)} at {formatTime(sale.createdAt)}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleWhatsApp}
                        disabled={sendingWa}
                        title="Send via WhatsApp"
                        className="p-3 rounded-xl bg-[#25D366] hover:bg-[#1ebd5a] text-white shadow-lg shadow-green-500/10 transition-all flex items-center justify-center disabled:opacity-50">
                        <MessageCircle size={20} />
                    </button>
                    <button
                        onClick={() => handleExport('download')}
                        title="Download PDF"
                        className="p-3 rounded-xl bg-white dark:bg-[#161B2E] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center shadow-sm">
                        <Download size={20} />
                    </button>
                    <button
                        onClick={() => handleExport('print')}
                        title="Print Invoice"
                        className="p-3 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center">
                        <Printer size={20} />
                    </button>
                </div>
            </div>

            {/* DASHBOARD GRID */}
            <div className="flex-1 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">

                {/* LEFT PANEL: ITEMS TABLE (Scrollable) */}
                <div className="lg:col-span-8 flex flex-col min-h-0">
                    <div className="bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] shadow-sm flex flex-col h-full overflow-hidden transition-all hover:shadow-md">
                        <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-gradient-to-r from-transparent via-slate-50/50 to-transparent dark:via-slate-800/20">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3498DB] shadow-[0_0_8px_rgba(52,152,219,0.8)]"></span>
                                Itemized Breakdown
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{sale.items?.length || 0} positions</span>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-20 bg-white/95 dark:bg-[#161B2E]/95 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-none">
                                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-3 px-6">Description</th>
                                        <th className="py-3 px-4 text-center">Quantity</th>
                                        <th className="py-3 px-4 text-center">Unit Price</th>
                                        <th className="py-3 px-6 text-right">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50/50 dark:divide-slate-800/30">
                                    {sale.items?.map((item: any, i: number) => (
                                        <tr key={i} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors duration-200">
                                            <td className="py-3 px-6">
                                                <p className="font-black text-slate-800 dark:text-slate-100 text-xs tracking-tight group-hover:text-[#3498DB] transition-colors">{item.productName}</p>
                                                {item.product?.sku && <p className="text-[9px] font-bold text-slate-400 mt-0.5">SKU: {item.product.sku}</p>}
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold text-slate-600 dark:text-slate-400 text-xs">
                                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{item.quantity}</span>
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold text-slate-500 tabular-nums text-xs">
                                                {Number(item.unitPrice).toLocaleString()} <span className="text-[9px] font-black opacity-30 align-top">{currencySymbol}</span>
                                            </td>
                                            <td className="py-3 px-6 text-right font-black text-slate-900 dark:text-white tabular-nums text-sm">
                                                {Number(item.total).toLocaleString()} <span className="text-[9px] font-black opacity-30 align-top">{currencySymbol}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(!sale.items || sale.items.length === 0) && (
                                <div className="py-12 text-center">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">No items found in this invoice</p>
                                </div>
                            )}
                        </div>

                        {/* COMPACT NOTES AT FOOTER */}
                        {sale.notes && (
                            <div className="p-4 bg-amber-50/30 dark:bg-amber-900/10 border-t border-amber-100/50 dark:border-amber-800/30">
                                <h4 className="text-[9px] font-black text-amber-600/70 dark:text-amber-400/70 uppercase tracking-widest mb-1 title-font">Observation / Note</h4>
                                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 italic leading-relaxed">
                                    "{sale.notes}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: SUMMARY & STATS (Sticky) */}
                <div className="lg:col-span-4 flex flex-col gap-6 lg:h-full lg:overflow-y-auto no-scrollbar lg:pb-0 pb-10">

                    {/* STATUS & CUSTOMER CARD */}
                    <div className="bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] shadow-sm p-5 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${sale.paymentStatus === 'Paid' || sale.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                : 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                }`}>
                                {sale.paymentStatus || (sale.status === 'Completed' ? 'PAID' : 'PARTIAL')}
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Process By</p>
                                <p className="text-[11px] font-black text-slate-700 dark:text-slate-300">{sale.user?.fullName?.split(' ')[0] || 'System'}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer Details</h4>
                                <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                    {sale.customer?.name || 'Walk-in Customer'}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                    <p className="text-[11px] font-bold text-slate-500">{sale.customer?.phone || '+251 900 000 000'}</p>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Method</h4>
                                <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#3498DB] shadow-[0_0_6px_rgba(52,152,219,0.8)]"></span>
                                    {sale.paymentMethod || 'Cash'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* FINANCIAL SUMMARY CARD (LIGHT THEME - REFINED) */}
                    <div className="bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm relative overflow-hidden group transition-all duration-300 hover:border-[#3498DB]/40 hover:shadow-md">
                        {/* SUBTLE ACCENT GRADIENT */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#3498DB]/5 blur-[50px] rounded-full pointer-events-none transition-colors duration-700 group-hover:bg-[#3498DB]/10"></div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] opacity-90">
                                <span>Net Subtotal</span>
                                <span className="text-slate-800 dark:text-slate-200 font-bold tracking-tight text-xs">{Number(sale.subtotal || sale.total).toLocaleString()} <span className="text-[8px] opacity-40 ml-0.5">{currencySymbol}</span></span>
                            </div>
                            {sale.tax > 0 && (
                                <div className="flex justify-between items-center text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] opacity-90">
                                    <span>Vat (15%)</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-bold tracking-tight text-xs">{Number(sale.tax).toLocaleString()} <span className="text-[8px] opacity-40 ml-0.5">{currencySymbol}</span></span>
                                </div>
                            )}

                            <div className="py-5 my-3 border-y border-slate-100 dark:border-slate-800/50 flex flex-col gap-1 items-center justify-center bg-slate-50/50 dark:bg-slate-900/30 rounded-[1rem] group-hover:bg-blue-50/20 transition-colors">
                                <span className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">Total Bill Amount</span>
                                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tighter tabular-nums drop-shadow-sm flex items-baseline">
                                    {Number(sale.total).toLocaleString()} <span className="text-[10px] font-black text-[#3498DB] tracking-tight ml-1.5">{currencySymbol}</span>
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 px-4 bg-emerald-50/80 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 transition-all hover:bg-emerald-100/50 dark:hover:bg-emerald-500/10">
                                    <span className="text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-[0.15em]">Paid Amount</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-black text-lg tabular-nums flex items-baseline gap-1">
                                        {Number(sale.paidAmount || 0).toLocaleString()} <span className="text-[8px] opacity-50 uppercase">{currencySymbol}</span>
                                    </span>
                                </div>

                                {Number(sale.total) - Number(sale.paidAmount || 0) > 0 && (
                                    <div className="flex justify-between items-center p-3 px-4 bg-rose-50/80 dark:bg-rose-500/5 rounded-2xl border border-rose-100 dark:border-rose-500/10 transition-all hover:bg-rose-100/50 dark:hover:bg-rose-500/10">
                                        <span className="text-rose-700 dark:text-rose-400 text-[9px] font-black uppercase tracking-[0.15em]">Outstanding</span>
                                        <span className="text-rose-600 dark:text-rose-400 font-black text-lg tabular-nums flex items-baseline gap-1">
                                            {(Number(sale.total) - Number(sale.paidAmount || 0)).toLocaleString()} <span className="text-[8px] opacity-50 uppercase">{currencySymbol}</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PROFIT ANALYTICS CARD (ADVANCED) */}
                    <div className="bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-emerald-200/60 dark:border-emerald-500/30 rounded-[2rem] p-5 relative overflow-hidden group hover:border-emerald-400/60 transition-all duration-300 shadow-sm shadow-emerald-500/5">
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/10 blur-[30px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-colors"></div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                <TrendingUp size={12} /> Profit Insight
                            </h4>
                            <div className="text-[9px] font-black py-0.5 px-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-full" title="Margin = (Revenue ETB - Cost ETB) / Revenue ETB">
                                {margin.toFixed(1)}% Margin
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-500 tracking-tight tabular-nums drop-shadow-sm">
                                {profitETB.toLocaleString()}
                            </span>
                            <span className="text-[9px] font-black text-emerald-500/80 uppercase ml-0.5 mt-1">ETB Fa'iido Net ah</span>
                        </div>
                        <p className="text-[8px] font-bold text-slate-400 mt-1.5 italic leading-tight opacity-80">
                            Xisaabtu waxay ku dhisantahay sicirka birta (ETB). {sale.currency === 'USD' ? `Exchange Rate: ${sale.exchangeRate}` : ''}
                        </p>
                    </div>

                    {/* RECENT SETTLEMENTS (Modern Timeline) */}
                    <div className="bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] p-5 shadow-sm overflow-hidden min-h-[200px]">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                <History size={12} /> Settlement Journey
                            </h4>
                            <span className="text-[8px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                                {sale.payments?.length || 0} Records
                            </span>
                        </div>
                        
                        <div className="space-y-4 relative">
                            {sale.payments && sale.payments.length > 0 ? (
                                sale.payments.map((payment: any, i: number) => (
                                    <div key={i} className="flex gap-3 group">
                                        <div className="flex flex-col items-center">
                                            <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 flex items-center justify-center flex-shrink-0 z-10 transition-transform group-hover:scale-110 shadow-sm shadow-emerald-500/10">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            {i !== sale.payments.length - 1 && (
                                                <div className="w-[2px] flex-1 bg-gradient-to-b from-emerald-200 to-transparent dark:from-emerald-500/20 my-0.5"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 pb-3">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <p className="text-xs font-black text-slate-900 dark:text-white">
                                                    {currencySymbol} {payment.amount.toLocaleString()}
                                                </p>
                                                <span className="text-[8px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded">
                                                    {formatDate(payment.transactionDate, true)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                Deposit to: <span className="text-[#3498DB]">{payment.account?.name || 'Main Account'}</span>
                                            </div>
                                            {payment.description && (
                                                <p className="text-[8px] text-slate-400 mt-1 italic line-clamp-1">{payment.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 opacity-30">
                                    <History size={32} className="mb-2" />
                                    <p className="text-[9px] font-black uppercase tracking-widest text-center">Empty Timeline</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1E293B;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

        </div>
    );
}
