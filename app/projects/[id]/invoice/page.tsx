
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/admin/auth';
import InvoicePrintStyles from '@/components/invoice/InvoicePrintStyles';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export default async function ProjectInvoicePage({ params }: { params: { id: string } }) {
    const companyId = await getSessionCompanyId();
    if (!companyId) return <div>Unauthorized</div>;

    const project = await prisma.project.findUnique({
        where: { id: params.id },
        include: {
            customer: true,
            company: true,
            payments: true,
        }
    });

    if (!project || project.companyId !== companyId) {
        return notFound();
    }

    // --- Calculations ---
    // 1. Total Agreement
    const totalAmount = Number(project.agreementAmount);

    // 2. Total Paid = Advance Paid (if any) + All Payments Record
    const paymentsSum = project.payments.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
    const totalPaid = Number(project.advancePaid || 0) + paymentsSum;

    // 3. Balance Due = Agreement - Total Paid
    const balanceDue = totalAmount - totalPaid;

    // Formatting (ETB Currency)
    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 flex flex-col items-center gap-6 print:bg-white print:p-0 font-sans">

            {/* ACTION BAR (Hidden on Print) */}
            <div className="w-full max-w-[210mm] flex justify-between items-center print:hidden">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">Invoice Preview</h1>
                    <p className="text-sm text-gray-500">Project: {project.name}</p>
                </div>
                <PrintButton />
            </div>

            {/* A4 INVOICE CONTAINER */}
            <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl relative flex flex-col print:shadow-none print:w-full print:h-full overflow-hidden text-gray-800">

                {/* Top Decorative / Brand Bar */}
                <div className="h-4 w-full bg-primary print:bg-primary" style={{ backgroundColor: '#2563EB' }}></div>

                <div className="p-[15mm] flex-1 flex flex-col">
                    {/* HEADER */}
                    <div className="flex justify-between items-start mb-16">
                        <div>
                            {/* Company Logo Or Name */}
                            <div className="mb-6">
                                {project.company.logoUrl ? (
                                    <img src={project.company.logoUrl} alt={project.company.name} className="h-20 w-auto object-contain" />
                                ) : (
                                    <h2 className="text-3xl font-bold text-primary">{project.company.name}</h2>
                                )}
                            </div>
                            <div className="text-sm text-gray-500 leading-relaxed">
                                <p className="font-semibold text-gray-900">{project.company.name}</p>
                                <p>{project.company.address}</p>
                                <p>{project.company.email}</p>
                                <p>{project.company.phone}</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <h1 className="text-6xl font-black text-gray-100 tracking-tighter mb-2">INVOICE</h1>
                            <p className="text-gray-500 font-medium tracking-widest text-sm uppercase mb-1">Invoice No.</p>
                            <p className="font-bold text-xl text-gray-800">#{project.id.substring(0, 8).toUpperCase()}</p>

                            <div className="mt-6 flex flex-col gap-1 items-end">
                                <div className="flex gap-4 text-sm">
                                    <span className="text-gray-400 font-medium uppercase min-w-[80px]">Issued</span>
                                    <span className="font-semibold">{new Date().toLocaleDateString()}</span>
                                </div>
                                <div className="flex gap-4 text-sm">
                                    <span className="text-gray-400 font-medium uppercase min-w-[80px]">Due Date</span>
                                    <span className="font-semibold text-primary">
                                        {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Upon Receipt'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BILL TO */}
                    <div className="flex mb-16">
                        <div className="w-1/2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 inline-block">Bill To</h3>
                            <p className="text-xl font-bold text-gray-900 mb-1">{project.customer.name}</p>
                            <div className="text-sm text-gray-500 space-y-1">
                                <p>{project.customer.companyName}</p>
                                <p>{project.customer.email}</p>
                                <p>{project.customer.phone}</p>
                                <p className="max-w-[200px]">{project.customer.address}</p>
                            </div>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="flex-1">
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="border-b-2 border-gray-900">
                                    <th className="text-left py-3 text-xs font-bold text-gray-900 uppercase tracking-wider">Description</th>
                                    <th className="text-right py-3 text-xs font-bold text-gray-900 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {/* 1. Agreement */}
                                <tr className="border-b border-gray-100">
                                    <td className="py-5 pr-4">
                                        <p className="font-bold text-gray-800 text-base mb-1">Project Agreement</p>
                                        <p className="text-gray-500">Project: {project.name}</p>
                                        {project.description && <p className="text-gray-400 text-xs mt-1">{project.description}</p>}
                                    </td>
                                    <td className="py-5 text-right font-bold text-gray-800 align-top">
                                        {formatMoney(totalAmount)}
                                    </td>
                                </tr>

                                {/* 2. Advance (If exists) */}
                                {Number(project.advancePaid) > 0 && (
                                    <tr className="border-b border-gray-100 bg-green-50/30 print:bg-transparent">
                                        <td className="py-4 pl-4 text-green-700 font-medium">
                                            Less: Advance Payment
                                        </td>
                                        <td className="py-4 text-right text-green-700 font-medium">
                                            - {formatMoney(Number(project.advancePaid))}
                                        </td>
                                    </tr>
                                )}

                                {/* 3. Other Payments */}
                                {project.payments.map(payment => (
                                    <tr key={payment.id} className="border-b border-gray-100 bg-green-50/30 print:bg-transparent">
                                        <td className="py-4 pl-4 text-green-700 font-medium">
                                            Less: Payment Received ({new Date(payment.paymentDate).toLocaleDateString()})
                                            <span className="ml-2 text-xs text-green-600/70 uppercase border border-green-200 px-1 rounded">{payment.paymentType}</span>
                                        </td>
                                        <td className="py-4 text-right text-green-700 font-medium">
                                            - {formatMoney(Number(payment.amount))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* SUMMARY */}
                    <div className="flex justify-end mb-20 break-inside-avoid">
                        <div className="w-[80mm]">
                            <div className="flex justify-between py-2 text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span className="font-medium text-gray-900">{formatMoney(totalAmount)}</span>
                            </div>

                            {totalPaid > 0 && (
                                <div className="flex justify-between py-2 text-sm text-green-600 border-b border-gray-200">
                                    <span>Total Paid</span>
                                    <span className="font-medium">- {formatMoney(totalPaid)}</span>
                                </div>
                            )}

                            <div className="flex justify-between py-4 items-center mt-2">
                                <span className="font-bold text-xl text-primary uppercase tracking-wide">Balance Due</span>
                                <span className="font-black text-3xl text-primary">{formatMoney(balanceDue)}</span>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="border-t-4 border-gray-100 pt-8 mt-auto">
                        <div className="flex justify-between items-end">
                            <div className="max-w-[60%]">
                                <h4 className="font-bold text-gray-900 mb-2">Terms & Conditions</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Payment is due within 14 days. Please make checks payable to <span className="font-semibold">{project.company.name}</span>.
                                    Thank you for your business.
                                </p>
                            </div>
                            <div className="text-right">
                                {/* Signature Line */}
                                <div className="w-48 border-b border-gray-300 mb-2"></div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Authorized Signature</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Decorative Bar */}
                <div className="h-4 w-full bg-gray-900 print:bg-gray-900"></div>

            </div>

            <InvoicePrintStyles />
        </div>
    );
}
