// app/download/page.tsx - Web App Installation Page (PWA)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  Apple,
  ArrowLeft,
  WifiOff,
  Cloud,
  Shield,
  Zap,
  Smartphone,
  Info
} from 'lucide-react';

export default function DownloadPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBrowserFallback, setShowBrowserFallback] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();

      // Detect iOS
      if (/ipad|iphone|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
        setIsIOS(true);
      }

      // Detect if already installed / running standalone
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsStandalone(true);
      }

      // Check for global deferred prompt set by pwa-register.js
      if ((window as any).deferredPrompt) {
        setDeferredPrompt((window as any).deferredPrompt);
      }

      // Listen for the prompt ready event
      const readyHandler = () => {
        if ((window as any).deferredPrompt) {
          setDeferredPrompt((window as any).deferredPrompt);
        }
      };

      window.addEventListener('pwa-prompt-ready', readyHandler);
      return () => window.removeEventListener('pwa-prompt-ready', readyHandler);
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the native install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        (window as any).deferredPrompt = null;
        setIsStandalone(true); // Assuming they accepted
      }
    } else if (isIOS) {
       // Scroll smoothly or show instruction
       setShowBrowserFallback(true);
    } else {
      // Show elegant fallback instead of alert
      setShowBrowserFallback(true);
      setTimeout(() => setShowBrowserFallback(false), 8000);
    }
  };

  const features = [
    { icon: <WifiOff className="w-6 h-6" />, title: 'Offline Mode', desc: 'Shaqo internet la\'aan ah. Xogtu waa kuu kaydsan tahay inta internet-ka ka imaanayo.' },
    { icon: <Zap className="w-6 h-6" />, title: 'High Performance', desc: 'Degdeg iyo awood dheeri ah oo loogu talagalay maamulka ganacsigaaga.' },
    { icon: <Shield className="w-6 h-6" />, title: 'Bank-Grade Security', desc: 'Xogtaadu waa mid si adag loo ilaaliyay oo ammaan ah (Encrypted).' },
    { icon: <Cloud className="w-6 h-6" />, title: 'Auto Sync', desc: 'Is-waafajin toos ah oo lala xiriirinayo Cloud-ka marka aad internet-ka hesho.' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Navbar Placeholder / Back Button */}
      <nav className="absolute top-0 w-full z-50 p-6 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
        <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 hover:bg-black/40 px-5 py-2.5 rounded-full backdrop-blur-md">
          <ArrowLeft size={18} />
          <span className="font-bold text-sm">Ku noqo Guriga (Home)</span>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-darkGray">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-950 to-cyan-900"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-900/50 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-md">
            <Smartphone size={16} /> Rakibo App-ka
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
            Awoodda Revlo, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Kombiyuutarkaaga & Mobile-ka.</span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Khibrad degdeg ah, shaqo internet la'aan ah, iyo gelitaan fudud adoon u baahnayn App Store.
          </p>

          {/* Main Install Action Area */}
          <div className="max-w-md mx-auto relative relative z-20">
            {isStandalone ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 backdrop-blur-md">
                <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Wuu Rakiban Yahay!</h3>
                <p className="text-green-100 text-sm">Waxaad hore u rakibatay Revlo App. Waad sii wadi kartaa isticmaalkiisa.</p>
                <Link href="/dashboard" className="mt-6 inline-block w-full py-3 px-6 bg-white text-darkGray font-bold rounded-xl hover:bg-gray-100 transition-colors">
                  Aad Dashboard-ka
                </Link>
              </div>
            ) : isIOS ? (
              <div className="bg-white/10 border border-white/20 rounded-3xl p-8 backdrop-blur-xl text-left shadow-2xl">
                <div className="flex items-center justify-center mb-6">
                  <Apple size={40} className="text-white mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4 text-center">Sida loogu rakibo iPhone/iPad</h3>
                <ol className="space-y-4 text-gray-200 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white text-xs">1</span>
                    <span>Qaybta hoose ee shaashadda, taabo badhanka <strong>Share</strong> (Khaanad fallaadhu kor uga baxayso <span className="inline-block border border-gray-400 px-1 rounded text-xs">↑</span>).</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white text-xs">2</span>
                    <span>Hoos u yara dhaadhac oo dooro <strong>"Add to Home Screen"</strong> <span className="inline-block border border-gray-400 px-1 rounded text-xs">+</span>.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white text-xs">3</span>
                    <span>Ugu dambayn, taabo <strong>"Add"</strong> geeska kore midig.</span>
                  </li>
                </ol>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="group w-full relative inline-flex items-center justify-center px-8 py-5 text-lg font-bold text-white transition-all duration-300 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl hover:from-cyan-500 hover:to-blue-500 shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                <span className="relative flex items-center gap-3">
                  <Download size={24} />
                  Rakibo App-ka (Install)
                </span>
              </button>
            )}

            {!isIOS && !isStandalone && (
              <div className="mt-6 flex flex-col gap-3">
                <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
                  <Info size={16} /> Haddii uusan shaqayn, isticmaal Settings-ka Browser-ka.
                </p>
                
                {showBrowserFallback && (
                  <div className="animate-fade-in-up bg-cyan-900/40 border border-cyan-500/50 p-4 rounded-xl text-cyan-100 text-sm text-left backdrop-blur-md shadow-lg">
                    <div className="flex gap-3">
                      <div className="mt-0.5"><Info size={20} className="text-cyan-400" /></div>
                      <div>
                        <strong className="block text-cyan-300 font-bold mb-1">Tilmaanta Rakibaada (Install)</strong>
                        Browser-kaagu ma ogola in toos loo rakibo. Fadlan taabo summada khaanada Browser-kaaga <strong>(⋮)</strong> ama <strong>(⋯)</strong> kadibna dooro <strong>"Install App"</strong> ama <strong>"Add to Home Screen"</strong>.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative z-30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-cyan-600 uppercase tracking-widest mb-2">Maxaad u rakibanaysaa?</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-darkGray dark:text-white">Faa'iidooyinka App-ka</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-8 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="w-14 h-14 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-cyan-100 transition-all duration-300">
                  {f.icon}
                </div>
                <h4 className="text-xl font-bold text-darkGray dark:text-white mb-3">{f.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
