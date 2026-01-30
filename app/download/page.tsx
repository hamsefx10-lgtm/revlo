// app/download/page.tsx - Desktop App Download Page
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  Monitor,
  Apple,
  CheckCircle,
  ArrowLeft,
  Wifi,
  WifiOff,
  Cloud,
  Shield,
  Zap,
  HardDrive
} from 'lucide-react';

export default function DownloadPage() {
  const [os, setOs] = useState<string>('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.includes('win')) setOs('windows');
      else if (userAgent.includes('mac')) setOs('mac');
      else if (userAgent.includes('linux')) setOs('linux');

      // Listen for PWA install prompt
      const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleDownload = async (platform: string) => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Fallback for when prompt isn't available (e.g. already installed or iOS)
      alert("Si aad u rakibato:\n1. Riix 'Install' oo ka muuqda Browser-kaaga (Settings menu).\n2. Ama haddii aad iOS isticmaalayso, riix Share > Add to Home Screen.");
    }
  };

  const features = [
    { icon: <WifiOff className="w-6 h-6" />, title: 'Offline Mode', desc: 'Shaqo internet la\'aan ah. Xogtu waa kuu kaydsan tahay.' },
    { icon: <Zap className="w-6 h-6" />, title: 'High Performance', desc: 'Degdeg iyo awood dheeri ah oo loogu talagalay ganacsigaaga.' },
    { icon: <Shield className="w-6 h-6" />, title: 'Bank-Grade Security', desc: 'Encryption heer sare ah oo ilaalinaya xogtaada muhiimka ah.' },
    { icon: <Cloud className="w-6 h-6" />, title: 'Auto Sync', desc: 'Is-waafajin toos ah marka aad internet-ka hesho.' }
  ];

  const DownloadCard = ({ id, title, icon: Icon, desc, active }: { id: string, title: string, icon: any, desc: string, active: boolean }) => (
    <div
      onClick={() => handleDownload(id)}
      className={`relative group p-8 rounded-3xl transition-all duration-300 cursor-pointer border-2 
        ${active
          ? 'bg-white dark:bg-gray-800 border-cyan-500 shadow-2xl shadow-cyan-500/10 scale-105 z-10'
          : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-cyan-400 hover:shadow-xl'
        }`}
    >
      {active && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md whitespace-nowrap">
          Recommended for you
        </div>
      )}
      <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-colors
            ${active ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20' : 'bg-gray-50 text-gray-400 dark:bg-gray-700 dark:text-gray-300 group-hover:bg-cyan-50 group-hover:text-cyan-600'}`}>
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-center text-darkGray dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-center text-gray-500 mb-6">{desc}</p>

      <button className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors
            ${active
          ? 'bg-cyan-600 text-white hover:bg-cyan-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
        }`}>
        <Download size={18} />
        <span className="text-sm">Download</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Navbar Placeholder / Back Button */}
      <nav className="absolute top-0 w-full z-50 p-6 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
        <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/10 hover:bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
          <ArrowLeft size={18} />
          <span className="font-bold text-sm">Back to Home</span>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-darkGray">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-950 to-cyan-900"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-900/50 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-md">
            <Monitor size={14} /> Desktop Version 1.0.2
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
            Awoodda Revlo, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Kombiyuutarkaaga.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Khibrad degdeg ah, shaqo internet la'aan ah, iyo maamul buuxa. Soo deji maanta.
          </p>
        </div>
      </section>

      {/* Downloads Grid - Overlapping Hero */}
      <section className="relative z-20 px-6 -mt-16 sm:-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DownloadCard
              id="windows"
              title="Windows"
              icon={Monitor}
              desc="Windows 10, 11 (64-bit)"
              active={os === 'windows'}
            />
            <DownloadCard
              id="mac"
              title="macOS"
              icon={Apple}
              desc="macOS 11.0+ (Intel/M1)"
              active={os === 'mac'}
            />
            <DownloadCard
              id="linux"
              title="Linux"
              icon={HardDrive}
              desc="Ubuntu, Debian, Fedora"
              active={os === 'linux'}
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-cyan-600 uppercase tracking-widest mb-2">Maxaad u dooranaysaa Desktop?</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-darkGray dark:text-white">Waxqabad Aan Xad Lahayn</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h4 className="text-lg font-bold text-darkGray dark:text-white mb-2">{f.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-darkGray dark:text-white mb-8 text-center">Sida Loo Rakibo</h3>
          <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 md:before:left-8 before:h-full before:w-0.5 before:bg-gray-100 dark:before:bg-gray-700">
            {[
              { title: "Soo Deji (Download)", desc: "Dooro nooca kombiyuutarkaaga sare oo riix badhanka 'Download'." },
              { title: "Rakib (Install-soon)", desc: "Fur faylka soo degay (Installer file). Raac tilmaamaha shaashada." },
              { title: "Gal (Login)", desc: "Fur Revlo app, kadibna ku gal akoonkaaga ganacsi ama sameyso mid cusub." }
            ].map((step, i) => (
              <div key={i} className="relative flex gap-6 md:gap-8 items-start">
                <div className="flex-shrink-0 w-8 h-8 md:w-16 md:h-16 bg-white dark:bg-gray-800 border-4 border-cyan-100 dark:border-cyan-900 rounded-full flex items-center justify-center z-10">
                  <span className="text-cyan-600 font-bold text-lg">{i + 1}</span>
                </div>
                <div className="pt-1 md:pt-4">
                  <h4 className="text-lg font-bold text-darkGray dark:text-white mb-1">{step.title}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

