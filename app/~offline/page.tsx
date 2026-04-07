'use client';

import React from 'react';
import { WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OfflineFallbackPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#020617] flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-[2rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] text-center border border-gray-100 dark:border-gray-700/50 animate-fade-in-up relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-red-400/10 blur-3xl rounded-full pointer-events-none"></div>

        <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-100/50 dark:border-red-500/20">
          <WifiOff size={48} className="animate-pulse" />
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
          Internet la'aan
        </h1>
        
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-8 leading-relaxed">
          Khadka internet-ku wuu go'an yahay. Revlo App hadda wuxuu ku jiraa <span className="text-cyan-600 dark:text-cyan-400 font-bold">Offline Mode</span>. Fadlan hubi xiriirkaaga (Connection) si aad shaqada ula jaanqaado.
        </p>

        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black py-4.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_10px_30px_rgba(8,_112,_184,_0.3)] hover:shadow-[0_15px_40px_rgba(8,_112,_184,_0.5)] hover:-translate-y-1 active:scale-95 text-lg"
        >
          <RefreshCw size={22} className="shrink-0" /> Dib u Hubi (Retry)
        </button>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700/50">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white font-bold flex items-center justify-center gap-2 transition-colors duration-300">
            <ArrowLeft size={16} /> Ku noqo Bogga Hore
          </Link>
        </div>
      </div>
    </div>
  );
}
