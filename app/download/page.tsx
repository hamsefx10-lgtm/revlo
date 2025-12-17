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
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  useEffect(() => {
    // Detect user's OS
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.includes('win')) {
        setOs('windows');
      } else if (userAgent.includes('mac')) {
        setOs('mac');
      } else if (userAgent.includes('linux')) {
        setOs('linux');
      }
    }
  }, []);

  const handleDownload = (platform: string) => {
    // In production, this would point to your actual installer files
    // For now, we'll use a placeholder API endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    
    switch (platform) {
      case 'windows':
        window.open(`${baseUrl}/api/download/windows`, '_blank');
        break;
      case 'mac':
        window.open(`${baseUrl}/api/download/mac`, '_blank');
        break;
      case 'linux':
        window.open(`${baseUrl}/api/download/linux`, '_blank');
        break;
    }
  };

  const features = [
    {
      icon: <Wifi className="w-6 h-6" />,
      title: 'Online & Offline',
      description: 'Shaqeeyso online iyo offline, xogta si toos ah ayay u sync-gareysaa'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Performance Fiican',
      description: 'Desktop app-ka wuxuu ka dhakhso badan yahay web app-ka'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Security',
      description: 'Xogtaada waa amaan, encryption leh'
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: 'Auto-Sync',
      description: 'Marka online noqoto, xogta si toos ah ayay u sync-gareysaa'
    }
  ];

  return (
    <div className="min-h-screen bg-lightGray dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center text-primary hover:text-blue-700">
            <ArrowLeft size={20} className="mr-2" />
            Dib ugu noqo Homepage
          </Link>
          <h1 className="text-2xl font-bold text-darkGray dark:text-gray-100">
            Revl<span className="text-secondary">o</span> Desktop App
          </h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-blue-600 to-blue-800 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Monitor size={64} className="mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            Soo Deji Desktop App-ka Revlo
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Shaqeeyso online iyo offline, performance fiican, iyo security xoog leh
          </p>
        </div>
      </section>

      {/* Download Section */}
      <section className="max-w-6xl mx-auto py-12 px-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6 text-center">
            Dooro Nooca Computer-kaaga
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Windows */}
            <div className={`border-2 rounded-xl p-6 transition-all cursor-pointer ${
              os === 'windows' 
                ? 'border-primary bg-blue-50 dark:bg-blue-900/20' 
                : 'border-lightGray dark:border-gray-700 hover:border-primary'
            }`} onClick={() => handleDownload('windows')}>
              <Monitor size={48} className="mx-auto mb-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-xl font-bold text-center text-darkGray dark:text-gray-100 mb-2">
                Windows
              </h4>
              <p className="text-center text-mediumGray dark:text-gray-400 mb-4">
                Windows 10 iyo ka korreeya
              </p>
              <button className="w-full bg-primary text-white py-3 px-6 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center">
                <Download size={20} className="mr-2" />
                Soo Deji Windows
              </button>
            </div>

            {/* Mac */}
            <div className={`border-2 rounded-xl p-6 transition-all cursor-pointer ${
              os === 'mac' 
                ? 'border-primary bg-blue-50 dark:bg-blue-900/20' 
                : 'border-lightGray dark:border-gray-700 hover:border-primary'
            }`} onClick={() => handleDownload('mac')}>
              <Apple size={48} className="mx-auto mb-4 text-gray-800 dark:text-gray-200" />
              <h4 className="text-xl font-bold text-center text-darkGray dark:text-gray-100 mb-2">
                macOS
              </h4>
              <p className="text-center text-mediumGray dark:text-gray-400 mb-4">
                macOS 10.15 iyo ka korreeya
              </p>
              <button className="w-full bg-primary text-white py-3 px-6 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center">
                <Download size={20} className="mr-2" />
                Soo Deji macOS
              </button>
            </div>

            {/* Linux */}
            <div className={`border-2 rounded-xl p-6 transition-all cursor-pointer ${
              os === 'linux' 
                ? 'border-primary bg-blue-50 dark:bg-blue-900/20' 
                : 'border-lightGray dark:border-gray-700 hover:border-primary'
            }`} onClick={() => handleDownload('linux')}>
              <HardDrive size={48} className="mx-auto mb-4 text-orange-600 dark:text-orange-400" />
              <h4 className="text-xl font-bold text-center text-darkGray dark:text-gray-100 mb-2">
                Linux
              </h4>
              <p className="text-center text-mediumGray dark:text-gray-400 mb-4">
                AppImage iyo DEB
              </p>
              <button className="w-full bg-primary text-white py-3 px-6 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center">
                <Download size={20} className="mr-2" />
                Soo Deji Linux
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6 text-center">
            Astaamaha Desktop App-ka
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg text-primary">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-mediumGray dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6">
            Sida loo Rakibto
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="text-darkGray dark:text-gray-100 font-semibold">Step 1: Soo Deji Installer-ka</p>
                <p className="text-mediumGray dark:text-gray-400">Dooro nooca computer-kaaga oo soo deji installer-ka</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="text-darkGray dark:text-gray-100 font-semibold">Step 2: Fur Installer-ka</p>
                <p className="text-mediumGray dark:text-gray-400">Fur file-ka la soo dejiyay oo raac tilmaamaha</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="text-darkGray dark:text-gray-100 font-semibold">Step 3: Bilaaw Isticmaalka</p>
                <p className="text-mediumGray dark:text-gray-400">Marka rakibka dhammaysto, fur app-ka oo bilaw isticmaalka</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

