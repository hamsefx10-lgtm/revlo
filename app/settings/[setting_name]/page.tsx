// app/settings/[setting_name]/page.tsx - Settings Page Template (10000% Design - Enhanced)
'use client';

import React from 'react';
import Layout from '../../../components/layouts/Layout';
import Link from 'next/link';
import { ArrowLeft, Settings as SettingsIcon, Lightbulb, Info, Plus, UploadCloud } from 'lucide-react'; // Icons

// Replace with actual icon for the page (e.g., Banknote for accounts, Tag for categories)
const PageIcon = SettingsIcon; 
const PageTitle = "General Settings"; // Replace with actual title (e.g., "Bank Accounts")
const PageDescription = "Manage your general application settings here."; // Replace with actual description

export default function Page() {
  return (
    <Layout>
      {/* Page Header - Enhanced */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100 flex items-center mb-4 md:mb-0 animate-fade-in-left">
          <Link href="/settings" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4 p-2 rounded-full hover:bg-lightGray dark:hover:bg-gray-700">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          {PageTitle}
        </h1>
        {/* Quick actions for this page (e.g., Add Account, Add Category) */}
        <div className="flex space-x-3 animate-fade-in-right">
          {/* Example Button (replace with actual functionality) */}
          <button className="bg-primary text-white py-2 px-5 rounded-lg font-semibold text-base hover:bg-blue-700 transition duration-200 shadow-md flex items-center">
            <Plus size={18} className="mr-2" /> Add New
          </button>
          {/* Example Button */}
          <button className="bg-accent text-white py-2 px-5 rounded-lg font-semibold text-base hover:bg-orange-600 transition duration-200 shadow-md flex items-center">
            <UploadCloud size={18} className="mr-2" /> Import
          </button>
        </div>
      </div>

      {/* Main Content Area - Enhanced Design */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center min-h-[400px] flex flex-col items-center justify-center animate-fade-in-up relative overflow-hidden">
        {/* Subtle Background Pattern/Gradient */}
        <div className="absolute inset-0 opacity-5 z-0" style={{ backgroundImage: 'radial-gradient(#3498DB 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/0 dark:from-gray-800/50 dark:to-gray-800/0 z-0"></div>

        <div className="relative z-10 flex flex-col items-center">
          <PageIcon size={72} className="text-primary mb-6 animate-pulse-subtle" /> {/* Larger icon, subtle pulse */}
          <h3 className="text-3xl font-bold text-darkGray dark:text-gray-100 mb-3">{PageTitle}</h3>
          <p className="text-lg text-mediumGray dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-6">{PageDescription}</p>
          
          {/* Suggestion/Tip Box */}
          <div className="bg-lightGray dark:bg-gray-700 p-4 rounded-lg flex items-start space-x-3 max-w-md mx-auto text-left animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Info size={20} className="text-primary mt-1 flex-shrink-0" />
            <p className="text-sm text-darkGray dark:text-gray-300">
              Halkan waxaad ku maamuli doontaa dhammaan settings-ka la xiriira {PageTitle.toLowerCase()}. Fadlan hubi in xogtaadu ay sax tahay.
            </p>
          </div>

          {/* Call to Action for Content */}
          <div className="mt-8">
            <p className="text-mediumGray dark:text-gray-400 mb-4">Diyaar ma u tahay inaad bilawdo habaynta?</p>
            <button className="bg-secondary text-white py-2.5 px-6 rounded-full font-bold text-lg hover:bg-green-600 transition duration-200 shadow-md flex items-center justify-center">
              <Lightbulb size={20} className="mr-2" /> Bilaw Habaynta
            </button>
          </div>

          {/* Placeholder for actual content */}
          <div className="mt-12 w-full max-w-3xl text-left border-t border-lightGray dark:border-gray-700 pt-8">
            <h4 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4">Faahfaahin Dheeraad ah:</h4>
            <p className="text-mediumGray dark:text-gray-400">
              Halkan waxaan ku dhisaynaa foomamka, miisaska, iyo qalabka kale ee aad u baahan tahay si aad u maamusho {PageTitle.toLowerCase()}.
              Tusaale ahaan, haddii ay tahay Bank Accounts, waxaad halkan ku arki doontaa liiska accounts-kaaga, badhamada lagu daro/wax laga beddelo, iyo waxyaabo kale.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
