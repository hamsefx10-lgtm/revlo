'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../components/layouts/Layout';
import { Trash2, RotateCcw, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DeletedItem {
    id: string;
    modelName: string;
    originalId: string;
    data: any;
    deletedAt: string;
    deletedBy: string;
    user?: { fullName: string };
}

export default function RecycleBinPage() {
    const [items, setItems] = useState<DeletedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoring, setRestoring] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/shop/recycle-bin');
            if (res.ok) {
                const data = await res.json();
                setItems(data.items || []);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleRestore = async (id: string) => {
        if (!window.confirm('Are you sure you want to restore this item?')) return;
        setRestoring(id);
        setMessage(null);
        try {
            const res = await fetch('/api/shop/recycle-bin', {
                method: 'POST',
                body: JSON.stringify({ id }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Item restored successfully!' });
                setItems(prev => prev.filter(i => i.id !== id));
            } else {
                const err = await res.json();
                setMessage({ type: 'error', text: err.error || 'Failed to restore' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Network error occurred' });
        }
        setRestoring(null);
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
                <header className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                        <Trash2 size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Recycle Bin</h1>
                        <p className="text-gray-500 font-medium">View and restore deleted items.</p>
                    </div>
                </header>

                {message && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span className="font-bold text-sm">{message.text}</span>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="p-10 text-center text-gray-400">Loading deleted items...</div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Trash2 size={48} className="mb-4 opacity-20" />
                            <p className="font-medium">Recycle Bin is empty.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4">Item</th>
                                        <th className="px-6 py-4">Deleted Date</th>
                                        <th className="px-6 py-4">Deleted By</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {items.map((item) => (
                                        <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 dark:text-white text-sm">{item.modelName}</span>
                                                    <span className="text-xs text-gray-500 line-clamp-1">{item.data?.description || 'No description'}</span>
                                                    {item.data?.amount && <span className="text-xs font-mono text-gray-400">{item.data.amount} ETB</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                                    <Clock size={14} />
                                                    {new Date(item.deletedAt).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                    {item.user?.fullName || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleRestore(item.id)}
                                                    disabled={restoring === item.id}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 font-bold text-xs uppercase transition-all disabled:opacity-50"
                                                >
                                                    {restoring === item.id ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <RotateCcw size={14} />}
                                                    Restore
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
