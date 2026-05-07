'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, X, Clock, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ApprovalRequest {
    id: string;
    type: string;
    entityType: string;
    entityId: string;
    reason: string | null;
    status: string;
    createdAt: string;
    requestedBy: {
        fullName: string;
        role: string;
    };
}

export default function ApprovalsPage() {
    const [requests, setRequests] = useState<ApprovalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/shop/approvals');
            const data = await res.json();
            if (data.approvals) {
                setRequests(data.approvals);
            }
        } catch (error) {
            console.error('Failed to fetch approvals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async (id: string, action: 'APPROVE' | 'REJECT') => {
        setProcessingId(id);
        try {
            const res = await fetch(`/api/shop/approvals/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });

            if (res.ok) {
                toast.success(`Codsiga waa la ${action === 'APPROVE' ? 'aqbalay' : 'diiday'}!`);
                fetchRequests();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Khalad ayaa dhacay');
            }
        } catch (error) {
            toast.error('Ku guuldareystay in la fuliyo');
        } finally {
            setProcessingId(null);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'PENDING');
    const pastRequests = requests.filter(r => r.status !== 'PENDING');

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-[#0B1120] pb-20 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/60 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/shop/settings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                        <ArrowLeft size={20} className="text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck className="text-amber-500" size={24} />
                            Nidaamka Ansixinta (Approvals)
                        </h1>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Maamul codsiyada xasaasiga ah ee shaqaalaha</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6 mt-4 space-y-8">
                
                {/* Pending Requests */}
                <section>
                    <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Codsiyada Sugaya ({pendingRequests.length})
                    </h2>

                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber-500" /></div>
                    ) : pendingRequests.length === 0 ? (
                        <div className="bg-white dark:bg-[#151f32] border border-gray-100 dark:border-gray-800/60 rounded-[2rem] p-8 text-center text-gray-400">
                            <ShieldCheck size={40} className="mx-auto mb-3 opacity-20" />
                            <p className="font-bold">Ma jiraan codsiyo sugaya</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="bg-white dark:bg-[#151f32] border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded text-[10px] font-black uppercase tracking-wider">
                                                    {req.type.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock size={12} /> {format(new Date(req.createdAt), 'dd MMM yyyy, hh:mm a')}
                                                </span>
                                            </div>
                                            <p className="font-bold text-gray-900 dark:text-white mb-1">
                                                {req.requestedBy.fullName} <span className="text-gray-400 font-normal">ayaa codsaday.</span>
                                            </p>
                                            {req.reason && (
                                                <div className="flex items-start gap-2 mt-2 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-800/30 text-sm text-amber-800 dark:text-amber-200">
                                                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                                    <p>"{req.reason}"</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleProcess(req.id, 'REJECT')}
                                                disabled={processingId === req.id}
                                                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                                            >
                                                <X size={16} /> Diid (Reject)
                                            </button>
                                            <button 
                                                onClick={() => handleProcess(req.id, 'APPROVE')}
                                                disabled={processingId === req.id}
                                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                                            >
                                                <Check size={16} /> Oggolow (Approve)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Past Requests */}
                <section>
                    <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4 mt-8">Codsiyadii Hore</h2>
                    {pastRequests.length > 0 ? (
                        <div className="bg-white dark:bg-[#151f32] border border-gray-100 dark:border-gray-800/60 rounded-[2rem] overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                                    {pastRequests.map(req => (
                                        <tr key={req.id}>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{req.requestedBy.fullName}</p>
                                                <p className="text-[10px] text-gray-500">{req.type.replace('_', ' ')}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                                                    req.status === 'APPROVED' 
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs text-gray-500">
                                                {format(new Date(req.createdAt), 'dd MMM yyyy')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">Ma jiraan codsiyo hore.</p>
                    )}
                </section>

            </div>
        </div>
    );
}
