'use client';

import React from 'react';
import Link from 'next/link';
import Layout from '../../components/layouts/Layout';
import {
  Settings, Banknote, Tag, Landmark, Users, Building, Database, Palette, User, HardDrive, Bell, Key, Info, Globe
} from 'lucide-react';

export default function SettingsOverviewPage() {
  return (
    <Layout>
      {/* Page Header - Compact & Modern */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-darkGray dark:text-gray-100 flex items-center mb-2 md:mb-0 animate-fade-in-left">
          <Settings size={32} className="text-primary mr-2" />
          Settings
        </h1>
      </div>

      {/* Main Content Area - Refined Design */}
      <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-xl shadow-2xl text-center min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Subtle Background Pattern/Gradient */}
        <div className="absolute inset-0 opacity-5 z-0" style={{ backgroundImage: 'radial-gradient(#3498DB 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/0 dark:from-gray-800/50 dark:to-gray-800/0 z-0"></div>

        <div className="relative z-10 flex flex-col items-center w-full">
          <Settings size={56} className="text-primary mb-3 animate-pulse-subtle" />
          <h3 className="text-xl md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-1">Maamul Dejinta App-kaaga</h3>
          <p className="text-sm md:text-base text-mediumGray dark:text-gray-400 max-w-xl mx-auto leading-relaxed mb-5">
            Halkan waxaad ka heli kartaa dhammaan dejinta iyo habaynta app-kaaga Revlo.
            Ka dhig Revlo mid ku habboon ganacsigaaga gaarka ah, oo hubi in xogtaadu ay ammaan tahay.
          </p>
          {/* Suggestion/Tip Box */}
          <div className="bg-lightGray dark:bg-gray-700 p-3 rounded-lg flex items-start space-x-2 max-w-sm mx-auto text-left animate-fade-in mb-6" style={{ animationDelay: '300ms' }}>
            <Info size={18} className="text-primary mt-1 flex-shrink-0" />
            <p className="text-xs text-darkGray dark:text-gray-300">
              Dejinta saxda ah waxay hagaajinaysaa waxtarka iyo amniga xogtaada. Fadlan si taxaddar leh u maamul.
              Qayb kasta oo dejin ah waxay leedahay shaqooyin gaar ah oo kaa caawinaya maamulka.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Sections - Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 animate-fade-in-up">
        {/* Language - New Addition */}
        <Link href="/settings/language" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-6 group">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 p-4 rounded-full group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-200">
            <Globe size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-1">Language / Luuqada</h3>
            <p className="text-xs text-mediumGray dark:text-gray-400">English / Somali</p>
          </div>
        </Link>
        <Link href="/settings/accounts" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-6 group">
          <div className="bg-primary/10 text-primary p-4 rounded-full group-hover:bg-primary group-hover:text-white transition-colors duration-200">
            <Banknote size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-1">Bank Accounts</h3>
            <p className="text-xs text-mediumGray dark:text-gray-400">Maamul xisaabaadkaaga bangiga iyo E-Dirhamka.</p>
          </div>
        </Link>
        <Link href="/settings/categories" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-6 group">
          <div className="bg-secondary/10 text-secondary p-4 rounded-full group-hover:bg-secondary group-hover:text-white transition-colors duration-200">
            <Tag size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-1">Expense Categories</h3>
            <p className="text-xs text-mediumGray dark:text-gray-400">Habayso noocyada kharashaadkaaga.</p>
          </div>
        </Link>
        <Link href="/settings/assets" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-6 group">
          <div className="bg-accent/10 text-accent p-4 rounded-full group-hover:bg-accent group-hover:text-white transition-colors duration-200">
            <Landmark size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-1">Fixed Assets</h3>
            <p className="text-xs text-mediumGray dark:text-gray-400">Diiwaan geli oo maamul hantida shirkaddaada.</p>
          </div>
        </Link>
        <Link href="/settings/users" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-6 group">
          <div className="bg-primary/10 text-primary p-4 rounded-full group-hover:bg-primary group-hover:text-white transition-colors duration-200">
            <Users size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-1">User Management</h3>
            <p className="text-xs text-mediumGray dark:text-gray-400">Abuur oo maamul users-ka iyo rukhsadahooda.</p>
          </div>
        </Link>
        <Link href="/settings/company-profile" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-6 group">
          <div className="bg-secondary/10 text-secondary p-4 rounded-full group-hover:bg-secondary group-hover:text-white transition-colors duration-200">
            <Building size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-1">Company Profile</h3>
            <p className="text-xs text-mediumGray dark:text-gray-400">Cusboonaysii macluumaadka shirkaddaada.</p>
          </div>
        </Link>
        <Link href="/settings/backup" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-6 group">
          <div className="bg-redError/10 text-redError p-4 rounded-full group-hover:bg-redError group-hover:text-white transition-colors duration-200">
            <Database size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-1">Backup & Restore</h3>
            <p className="text-xs text-mediumGray dark:text-gray-400">Badbaadi ama soo celi xogtaada.</p>
          </div>
        </Link>
        <Link href="/settings/personalization" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-6 group">
          <div className="bg-primary/10 text-primary p-4 rounded-full group-hover:bg-primary group-hover:text-white transition-colors duration-200">
            <Palette size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-1">Personalization</h3>
            <p className="text-xs text-mediumGray dark:text-gray-400">U habayso muuqaalka app-kaaga.</p>
          </div>
        </Link>
        <Link href="/settings/shareholders" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-6 group">
          <div className="bg-secondary/10 text-secondary p-4 rounded-full group-hover:bg-secondary group-hover:text-white transition-colors duration-200">
            <User size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-1">Shareholders</h3>
            <p className="text-xs text-mediumGray dark:text-gray-400">Maamul saamileyda shirkadda.</p>
          </div>
        </Link>
        <Link href="/settings/notifications" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-6 group">
          <div className="bg-secondary/10 text-secondary p-4 rounded-full group-hover:bg-secondary group-hover:text-white transition-colors duration-200">
            <Bell size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-1">Notifications</h3>
            <p className="text-xs text-mediumGray dark:text-gray-400">Habayso digniinaha app-ka iyo sida aad u heli lahayd.</p>
          </div>
        </Link>
        <Link href="/settings/security" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-6 group">
          <div className="bg-secondary/10 text-secondary p-4 rounded-full group-hover:bg-secondary group-hover:text-white transition-colors duration-200">
            <Key size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-1">Security</h3>
            <p className="text-xs text-mediumGray dark:text-gray-400">Maamul settings-ka amniga akoonkaaga iyo password-kaaga.</p>
          </div>
        </Link>
        <Link href="/settings/assets-register" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-6 group">
          <div className="bg-accent/10 text-accent p-4 rounded-full group-hover:bg-accent group-hover:text-white transition-colors duration-200">
            <HardDrive size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-1">Assets Register</h3>
            <p className="text-xs text-mediumGray dark:text-gray-400">Diiwaan geli oo maamul hantida shirkaddaada.</p>
          </div>
        </Link>
      </div>
    </Layout>
  );
}