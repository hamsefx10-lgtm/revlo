import React from 'react';
import prisma from '@/lib/db';
import { format } from 'date-fns';
import { Download, CheckCircle, FileText, Building, User, Calendar, Receipt, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

async function getSaleData(id: string) {
    try {
        const sale = await (prisma as any).sale.findUnique({
            where: { id },
            include: {
                customer: true,
                items: true,
                company: true,
                user: true, // Cashier
            },
        });
        return sale;
    } catch (error) {
        console.error('Error fetching receipt data:', error);
        return null;
    }
}

export default async function PublicShopReceiptPage({ params }: { params: { id: string } }) {
    const sale = await getSaleData(params.id);

    if (!sale) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Rasiidka lama helin</h1>
                    <p className="text-gray-600 mb-6">Fadlan hubi in link-gu uu sax yahay ama kala xidhiidh shirkadda.</p>
                    <div className="text-sm text-gray-400">ID: {params.id}</div>
                </div>
            </div>
        );
    }

    const companyName = sale.company?.name || 'Revlo Business';
    const customerName = sale.customer?.name || 'Walk-in Customer';
    const amount = Number(sale.total);
    const date = sale.createdAt ? format(new Date(sale.createdAt), 'PPP') : 'N/A';
    const items = sale.items || [];
    const isPaid = sale.paymentStatus === 'Paid' || sale.status === 'Paid';
    const balanceDue = isPaid ? 0 : (sale.total - (sale.paidAmount || 0));

    // Status visuals
    const statusText = isPaid ? 'Rasmi: Waa la bixiyay' : (balanceDue > 0 ? 'Haraa / Qayb baa la bixiyay' : 'Rasmi: Waa la bixiyay');

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-20 selection:bg-indigo-100">
            <style dangerouslySetInnerHTML={{
                __html: `
            @keyframes fadeInUp {
                from {opacity: 0; transform: translateY(20px); }
            to {opacity: 1; transform: translateY(0); }
        }
            .animate-fade-in-up {
                animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
            .glass {
                background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
      `}} />

            {/* Premium Navbar */}
            <nav className="sticky top-0 z-50 glass border-b border-slate-200/50 py-4 px-6">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-3 group">
                        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">R</div>
                        <span className="text-xl font-black tracking-tight text-slate-800 uppercase group-hover:text-indigo-600 transition-colors">{companyName}</span>
                    </div>
                    <div className={`px-4 py-1.5 text-[10px] font-black rounded-full flex items-center uppercase tracking-[0.1em] border shadow-sm ${isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                        <CheckCircle size={14} className="mr-1.5" /> {statusText}
                    </div>
                </div>
            </nav >

            <div className="max-w-3xl mx-auto p-6 mt-8">
                <div className="relative animate-fade-in-up">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50 -z-10"></div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10"></div>

                    <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-100">
                        <div className="bg-slate-900 p-12 text-white text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
                            <div className="relative z-10">
                                <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm border border-white/10">
                                    <ShoppingBag className="text-indigo-300" size={32} />
                                </div>
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Wadarta Guud ee Iibka</h2>
                                <div className="text-6xl font-black tracking-tighter flex items-baseline justify-center">
                                    <span className="text-2xl font-medium text-slate-500 mr-2">ETB</span>
                                    {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                {balanceDue > 0 && (
                                    <div className="mt-4 inline-flex px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 text-red-100 text-sm font-bold uppercase tracking-widest backdrop-blur-md">
                                        Haraa (Balance) ETB {balanceDue.toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-10 pt-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 border-b border-slate-50 pb-12">
                                <div className="space-y-8">
                                    <div className="flex items-start group">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Macmiilka (Customer)</h3>
                                            <p className="font-bold text-slate-800 text-lg leading-tight">{customerName}</p>
                                            <p className="text-sm text-slate-500 mt-1 font-medium">{sale.customer?.phone || 'Lambarka ma jiro'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start group">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Taariikhda (Date)</h3>
                                            <p className="font-bold text-slate-800 text-lg leading-tight">{date}</p>
                                            <p className="text-sm text-slate-500 mt-1 font-medium italic">{format(new Date(sale.createdAt || Date.now()), 'hh:mm a')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-start group">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <Building size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Shirkadda (Company)</h3>
                                            <p className="font-bold text-slate-800 text-lg leading-tight">{companyName}</p>
                                            <p className="text-sm text-slate-500 mt-1 font-medium italic">Cashier: {sale.user?.fullName || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start group">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Tixraaca (Invoice No)</h3>
                                            <p className="font-bold text-slate-800 text-lg leading-tight">#{sale.invoiceNumber}</p>
                                            <p className="text-sm text-indigo-600 mt-1 font-black uppercase tracking-widest">{sale.paymentMethod || 'CASH'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-12">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Faahfaahinta Alaabta (Items)</h3>
                                    <div className="h-px bg-slate-100 flex-grow ml-6"></div>
                                </div>

                                {items && items.length > 0 ? (
                                    <div className="space-y-4">
                                        {items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all border border-transparent hover:border-slate-100">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm">
                                                        <span className="text-xs font-black">{idx + 1}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 uppercase tracking-tight">{item.productName || 'Alaab'}</p>
                                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{item.quantity} × {Number(item.unitPrice).toLocaleString()} ETB</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-slate-900 italic">{(Number(item.unitPrice) * Number(item.quantity)).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="mt-8 space-y-3 px-6 text-right">
                                            <div className="flex justify-end text-slate-500 font-bold">
                                                <span className="tracking-widest uppercase text-xs w-32">Subtotal:</span>
                                                <span className="w-32">{Number(sale.subtotal || sale.total).toLocaleString()}</span>
                                            </div>
                                            {sale.taxAmount ? (
                                                <div className="flex justify-end text-slate-500 font-bold">
                                                    <span className="tracking-widest uppercase text-xs w-32">Tax:</span>
                                                    <span className="w-32">{Number(sale.taxAmount).toLocaleString()}</span>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="flex items-center justify-between p-8 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100 mt-6">
                                            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Wadarta Guud (Grand Total)</p>
                                            <p className="text-3xl font-black italic">{amount.toLocaleString()} <span className="text-sm opacity-60 ml-1">ETB</span></p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                                        <p className="font-bold text-slate-800 mb-1">Cilad baa dhacday</p>
                                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Ma jiraan alaabo</p>
                                    </div>
                                )}
                            </div>

                            {sale.notes && (
                                <div className="mb-12 p-8 bg-amber-50 rounded-[2rem] border border-amber-100 relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform">
                                        <Receipt size={80} />
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 mb-3 ml-1">Xusuusin (Notes)</h4>
                                    <p className="text-amber-900 font-bold text-lg leading-relaxed italic relative z-10">"{sale.notes}"</p>
                                </div>
                            )}

                            {/* Download CTA */}
                            <div className="space-y-6 pt-6">
                                <a
                                    href={`/api/public/shop/receipt/${sale.id}`}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-6 rounded-[1.5rem] font-black flex items-center justify-center transition-all shadow-xl shadow-indigo-100 hover:shadow-indigo-200 active:scale-[0.98] group"
                                >
                                    <Download size={22} className="mr-3 group-hover:rotate-12 transition-transform" />
                                    <span className="tracking-wider uppercase">SOO DEJI RASIIDKA GAARKA AH (PDF)</span>
                                </a>
                                <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                                    Nidaamka waxaa iska leh <strong className="text-slate-600">Revlo Business Solutions</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <Link href="https://revlo.so" className="inline-flex items-center space-x-2 text-slate-400 hover:text-indigo-600 transition-colors group">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Kala soco wararkayaga</span>
                        <div className="w-6 h-px bg-slate-200 group-hover:bg-indigo-200 transition-colors"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Revlo.so</span>
                    </Link>
                </div>
            </div >
        </div >
    );
}
