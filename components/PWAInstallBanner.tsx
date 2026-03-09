'use client';

import React from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallBanner() {
    return (
        <div
            id="pwa-install-banner"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500 hidden"
        >
            <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] border border-[#3498DB]/30 rounded-3xl p-5 shadow-2xl shadow-[#3498DB]/10 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-[#3498DB] to-[#2980B9] rounded-2xl text-white shadow-lg shadow-blue-500/20">
                            <Download size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight">Ku Shax Nidaamka</h3>
                            <p className="text-[11px] text-gray-400 font-medium">U dagsato Revlo abka ahaan si aad si fudud ugu gasho.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            id="pwa-install-button-main"
                            className="px-5 py-2.5 bg-[#3498DB] hover:bg-[#2980B9] text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-blue-500/10 uppercase tracking-widest active:scale-95"
                        >
                            Install
                        </button>
                        <button
                            onClick={() => {
                                const banner = document.getElementById('pwa-install-banner');
                                if (banner) banner.style.display = 'none';
                            }}
                            className="p-2 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
