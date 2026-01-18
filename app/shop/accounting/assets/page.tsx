'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Monitor, Briefcase, Truck, Plus, MoreHorizontal, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface FixedAsset {
    id: string;
    name: string;
    type: string;
    value: number;
    purchaseDate: string;
    depreciationRate: number;
}

export default function FixedAssetsPage() {
    const [assets, setAssets] = useState<FixedAsset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const res = await fetch('/api/shop/accounting/assets');
                if (res.ok) {
                    const data = await res.json();
                    setAssets(data.assets || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssets();
    }, []);

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/accounting" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Accounting
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-500">
                            <Monitor size={28} />
                        </div>
                        Fixed Assets
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Track physical assets and depreciation.</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={async () => {
                            if (!confirm('Run monthly depreciation for all active assets? This will decrease their book value and create expense entries.')) return;
                            try {
                                const res = await fetch('/api/shop/accounting/assets/depreciate', { method: 'POST' });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error);
                                alert(`Depreciation Run Success! Total: ${data.result.total.toLocaleString()} across ${data.result.count} assets.`);
                                window.location.reload();
                            } catch (e: any) {
                                alert(e.message);
                            }
                        }}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 text-sm"
                    >
                        Run Depreciation
                    </button>
                    <button className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold shadow-lg hover:opacity-90 flex items-center gap-2 transition-all">
                        <Plus size={18} /> Add Asset
                    </button>
                </div>
            </div>

            {/* ASSETS GRID */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-orange-500" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assets.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-500">No fixed assets recorded yet.</div>
                    )}
                    {assets.map((asset) => (
                        <div key={asset.id} className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm hover:shadow-lg transition-all group relative">
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${asset.type === 'Vehicle' ? 'bg-blue-100 text-blue-600' :
                                    asset.type === 'Equipment' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                                    }`}>
                                    {asset.type === 'Vehicle' ? <Truck size={24} /> :
                                        asset.type === 'Equipment' ? <Monitor size={24} /> : <Briefcase size={24} />}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{asset.name}</h3>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1">{asset.type}</p>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Original Value</span>
                                    <span className="font-bold text-gray-900 dark:text-white">ETB {Number(asset.value).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Purchased</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{new Date(asset.purchaseDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Depreciation Rate</span>
                                    <span className="font-bold text-red-500">{asset.depreciationRate}%/yr</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
