'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
    ArrowLeft, Printer, FileDown, CheckCircle, Building2, User, Calendar
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function TransactionReceiptPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [transaction, setTransaction] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generatingPDF, setGeneratingPDF] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const response = await fetch(`/api/accounting/transactions?id=${id}`);
                if (!response.ok) throw new Error('Failed to fetch transaction');
                const data = await response.json();
                if (data.transactions && data.transactions.length > 0) {
                    setTransaction(data.transactions[0]);
                } else {
                    // Handle not found
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchTransaction();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!receiptRef.current) return;
        setGeneratingPDF(true);
        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`receipt-${transaction?.id.slice(0, 8)}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF');
        } finally {
            setGeneratingPDF(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center string min-h-[500px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    if (!transaction) {
        return (
            <Layout>
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold text-gray-700">Transaction Not Found</h2>
                    <Link href="/accounting/transactions" className="text-primary hover:underline mt-4 inline-block">
                        Back to Transactions
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-3xl mx-auto pb-20">
                <div className="flex justify-between items-center mb-6 no-print">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} className="mr-2" />
                        Back
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Printer size={18} />
                            Print
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={generatingPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FileDown size={18} />
                            {generatingPDF ? 'Generating...' : 'Download PDF'}
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow-lg rounded-xl overflow-hidden print:shadow-none print:w-full" ref={receiptRef}>
                    {/* Receipt Header */}
                    <div className="bg-primary text-white p-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">PAYMENT RECEIPT</h1>
                                <p className="opacity-80">Transaction ID: {transaction.id}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold">REVLO CONSTRUCTION</div>
                                <p className="opacity-80 text-sm">Mogadishu, Somalia</p>
                                <p className="opacity-80 text-sm">+252 61 742 7701</p>
                            </div>
                        </div>
                    </div>

                    {/* Receipt Body */}
                    <div className="p-8">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-6 mb-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Payment Date</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {new Date(transaction.transactionDate).toLocaleDateString(undefined, {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
                                <p className="text-3xl font-bold text-primary">
                                    Br{Math.abs(transaction.amount).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Paid To</h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-white rounded-full shadow-sm">
                                            <Building2 size={16} className="text-primary" />
                                        </div>
                                        <span className="font-semibold text-gray-900">
                                            {transaction.vendor ? transaction.vendor.name :
                                                transaction.employee ? transaction.employee.fullName :
                                                    transaction.customer ? transaction.customer.name : 'Unknown Recipient'}
                                        </span>
                                    </div>
                                    {transaction.expense && (
                                        <div className="text-sm text-gray-600 mt-2 pl-11">
                                            <p>Ref: {transaction.expense.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Payment Details</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Paid From:</span>
                                        <span className="font-medium text-gray-900">{transaction.account?.name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Type:</span>
                                        <span className="font-medium text-gray-900">{transaction.type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Recorded By:</span>
                                        <span className="font-medium text-gray-900">{transaction.user?.fullName || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {transaction.description && (
                            <div className="mb-8">
                                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Description</h3>
                                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    {transaction.description}
                                </p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-end">
                            <div>
                                <div className="h-16 w-32 border-b-2 border-gray-300 mb-2"></div>
                                <p className="text-xs text-gray-500 uppercase">Authorized Signature</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-green-600 font-medium flex items-center gap-1 justify-end">
                                    <CheckCircle size={16} /> Payment Verified
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Thank you for your business</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="bg-gray-50 px-8 py-4 text-xs text-gray-400 text-center border-t border-gray-100">
                        This is a computer-generated receipt. No signature is required. Generated on {new Date().toLocaleString()}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
