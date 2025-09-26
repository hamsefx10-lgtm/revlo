// app/settings/personalization/page.tsx - Personalization Settings Page (10000% Design - Enhanced Further)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, Palette, Save, X, Loader2, Info, 
  Sun, Moon, Monitor, Globe, Home, Bell, DollarSign, Calendar, Rows, User, CheckCircle, XCircle,
  Type, Volume2, Image as ImageIcon, Accessibility, Download, Upload, UploadCloud // New icons for new features
} from 'lucide-react';
import Toast from '../../../components/common/Toast'; // Reuse Toast component

// --- Dummy Data ---
const dummyPersonalizationSettings = {
  theme: 'system', // 'light', 'dark', 'system'
  language: 'so', // 'en', 'so'
  defaultHomePage: '/dashboard', // '/dashboard', '/projects', '/expenses'
  notifications: {
    email: true,
    inApp: true,
    sms: false,
    lowStock: true,
    overdueProjects: true,
  },
  currency: 'ETB', // 'ETB', 'USD', 'EUR'
  dateFormat: 'DD/MM/YYYY', // 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'
  tableDensity: 'comfortable', // 'compact', 'comfortable'
  avatarColor: '#3498DB', // Primary color for avatar
  customFont: 'Inter', // New: Custom Font
  notificationSound: 'default', // New: Notification Sound
  profilePicture: '', // New: Profile Picture URL (base64 or URL)
  highContrast: false, // New: Accessibility setting
  textSize: 'medium', // New: Accessibility setting
  defaultExportFormat: 'CSV', // New: Data export preference
};

// Main Personalization Page Component
export default function PersonalizationSettingsPage() {
  const [settings, setSettings] = useState(dummyPersonalizationSettings);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/personalization');
      if (!response.ok) throw new Error('Failed to fetch personalization settings');
      const data = await response.json();
      setSettings(data.settings || dummyPersonalizationSettings);
    } catch (error) {
      console.error('Error fetching personalization settings:', error);
      setToastMessage({ message: 'Qalad ayaa dhacay markii la soo saarayay dejinta', type: 'error' });
    } finally {
      setInitialLoading(false);
    }
  };

  // Form states for editing
  const [editTheme, setEditTheme] = useState(settings.theme);
  const [editLanguage, setEditLanguage] = useState(settings.language);
  const [editDefaultHomePage, setEditDefaultHomePage] = useState(settings.defaultHomePage);
  const [editNotifications, setEditNotifications] = useState(settings.notifications);
  const [editCurrency, setEditCurrency] = useState(settings.currency);
  const [editDateFormat, setEditDateFormat] = useState(settings.dateFormat);
  const [editTableDensity, setEditTableDensity] = useState(settings.tableDensity);
  const [editAvatarColor, setEditAvatarColor] = useState(settings.avatarColor);
  const [editCustomFont, setEditCustomFont] = useState(settings.customFont); // New
  const [editNotificationSound, setEditNotificationSound] = useState(settings.notificationSound); // New
  const [editProfilePicture, setEditProfilePicture] = useState<string | null>(settings.profilePicture); // New
  const [editHighContrast, setEditHighContrast] = useState(settings.highContrast); // New
  const [editTextSize, setEditTextSize] = useState(settings.textSize); // New
  const [editDefaultExportFormat, setEditDefaultExportFormat] = useState(settings.defaultExportFormat); // New

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedSettings = {
        theme: editTheme,
        language: editLanguage,
        defaultHomePage: editDefaultHomePage,
        notifications: editNotifications,
        currency: editCurrency,
        dateFormat: editDateFormat,
        tableDensity: editTableDensity,
        avatarColor: editAvatarColor,
        customFont: editCustomFont,
        notificationSound: editNotificationSound,
        profilePicture: editProfilePicture || '',
        highContrast: editHighContrast,
        textSize: editTextSize,
        defaultExportFormat: editDefaultExportFormat,
      };

      const response = await fetch('/api/settings/personalization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) throw new Error('Failed to save personalization settings');

      const data = await response.json();
      setSettings(data.settings);
      setToastMessage({ message: 'Dejinta shakhsiyaynta si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
    } catch (error: any) {
      console.error("Failed to save personalization settings:", error);
      setToastMessage({ message: 'Cilad ayaa dhacday marka la cusboonaysiinayay dejinta.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProfilePicture(reader.result as string);
        setToastMessage({ message: 'Sawirka profile-ka waa la shubay!', type: 'success' });
      };
      reader.readAsDataURL(file); // Read as Base64 for display
    }
  };


  if (initialLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4" size={48} />
            <div className="text-mediumGray dark:text-gray-400">Waa la soo saarayaa dejinta...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/settings" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Personalization
        </h1>
        <button onClick={handleSave} className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center" disabled={loading}>
          {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save size={20} className="mr-2"/>} Badbaadi Dejinta
        </button>
      </div>

      {/* Main Sections */}
      <div className="space-y-8">
        {/* Appearance & Feel */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up">
          <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6 flex items-center space-x-3">
            <Palette size={28} className="text-primary"/> <span>Muuqaalka App-ka & Dareenka</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theme Selector */}
            <div>
              <label htmlFor="theme" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Mawduuca App-ka</label>
              <div className="flex space-x-3">
                <button onClick={() => setEditTheme('light')} className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${editTheme === 'light' ? 'bg-primary text-white border-primary' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 border-lightGray dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  <Sun size={20}/> <span>Iftiin</span>
                </button>
                <button onClick={() => setEditTheme('dark')} className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${editTheme === 'dark' ? 'bg-primary text-white border-primary' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 border-lightGray dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  <Moon size={20}/> <span>Mugdi</span>
                </button>
                <button onClick={() => setEditTheme('system')} className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${editTheme === 'system' ? 'bg-primary text-white border-primary' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 border-lightGray dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  <Monitor size={20}/> <span>Nidaam</span>
                </button>
              </div>
            </div>
            {/* Language Selector */}
            <div>
              <label htmlFor="language" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Luuqadda</label>
              <select id="language" value={editLanguage} onChange={(e) => setEditLanguage(e.target.value)} className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none">
                <option value="so">Soomaali</option>
                <option value="en">English</option>
              </select>
            </div>
            {/* Default Home Page */}
            <div>
              <label htmlFor="defaultHomePage" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Bogga Guriga ee Default</label>
              <select id="defaultHomePage" value={editDefaultHomePage} onChange={(e) => setEditDefaultHomePage(e.target.value)} className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none">
                <option value="/dashboard">Dashboard</option>
                <option value="/projects">Projects</option>
                <option value="/expenses">Expenses</option>
                <option value="/accounting">Accounting</option>
              </select>
            </div>
            {/* Avatar Color Selector */}
            <div>
              <label htmlFor="avatarColor" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Midabka Avatar-kaaga</label>
              <input type="color" id="avatarColor" value={editAvatarColor} onChange={(e) => setEditAvatarColor(e.target.value)} className="w-full h-10 p-1 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 cursor-pointer"/>
            </div>
            {/* Custom Font Selector */}
            <div>
              <label htmlFor="customFont" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Font-ka Custom-ka ah</label>
              <select id="customFont" value={editCustomFont} onChange={(e) => setEditCustomFont(e.target.value)} className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none">
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Roboto">Roboto</option>
                <option value="Montserrat">Montserrat</option>
              </select>
            </div>
            {/* Profile Picture Upload */}
            <div>
              <label htmlFor="profilePicture" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Sawirka Profile-ka</label>
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 rounded-full bg-lightGray dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-lightGray dark:border-gray-600">
                  {editProfilePicture ? (
                    <img src={editProfilePicture} alt="Profile" className="w-full h-full object-cover"/>
                  ) : (
                    <User size={32} className="text-mediumGray dark:text-gray-400"/>
                  )}
                </div>
                <input type="file" id="profilePicture" accept="image/*" onChange={handleProfilePictureUpload} className="hidden"/>
                <label htmlFor="profilePicture" className="bg-primary text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-blue-700 cursor-pointer transition-colors duration-200">
                  <UploadCloud size={18} className="inline mr-1"/> Shub Sawir
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Data Display Preferences */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up">
          <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6 flex items-center space-x-3">
            <Info size={28} className="text-secondary"/> <span>Dejinta Muujinta Xogta</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Default Currency */}
            <div>
              <label htmlFor="currency" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Lacagta Default</label>
              <select id="currency" value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)} className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none">
                <option value="ETB">ETB</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            {/* Date Format */}
            <div>
              <label htmlFor="dateFormat" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qaabka Taariikhda</label>
              <select id="dateFormat" value={editDateFormat} onChange={(e) => setEditDateFormat(e.target.value)} className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none">
                <option value="DD/MM/YYYY">DD/MM/YYYY (25/07/2025)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (07/25/2025)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2025-07-25)</option>
              </select>
            </div>
            {/* Table Density */}
            <div>
              <label htmlFor="tableDensity" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Cufnaanta Miiska</label>
              <div className="flex space-x-3">
                <button onClick={() => setEditTableDensity('compact')} className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${editTableDensity === 'compact' ? 'bg-primary text-white border-primary' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 border-lightGray dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  <Rows size={20}/> <span>Yar</span>
                </button>
                <button onClick={() => setEditTableDensity('comfortable')} className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${editTableDensity === 'comfortable' ? 'bg-primary text-white border-primary' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 border-lightGray dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  <Rows size={20} className="transform rotate-90"/> <span>Caadi</span>
                </button>
              </div>
            </div>
            {/* Default Export Format */}
            <div>
              <label htmlFor="defaultExportFormat" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qaabka Dhoofinta Default</label>
              <select id="defaultExportFormat" value={editDefaultExportFormat} onChange={(e) => setEditDefaultExportFormat(e.target.value)} className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none">
                <option value="CSV">CSV</option>
                <option value="JSON">JSON</option>
                <option value="PDF">PDF</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md mb-8 animate-fade-in-up">
          <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6 flex items-center space-x-3">
            <Bell size={28} className="text-accent"/> <span>Dejinta Digniinaha</span>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="notifEmail" className="text-darkGray dark:text-gray-300 text-md font-medium">Digniin Email ah</label>
              <input type="checkbox" id="notifEmail" checked={editNotifications.email} onChange={(e) => setEditNotifications(prev => ({ ...prev, email: e.target.checked }))} className="h-5 w-5 text-primary rounded border-mediumGray dark:border-gray-600 focus:ring-primary"/>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="notifInApp" className="text-darkGray dark:text-gray-300 text-md font-medium">Digniin App-ka Gudihiisa ah</label>
              <input type="checkbox" id="notifInApp" checked={editNotifications.inApp} onChange={(e) => setEditNotifications(prev => ({ ...prev, inApp: e.target.checked }))} className="h-5 w-5 text-primary rounded border-mediumGray dark:border-gray-600 focus:ring-primary"/>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="notifSMS" className="text-darkGray dark:text-gray-300 text-md font-medium">Digniin SMS ah (Lacag dheeraad ah)</label>
              <input type="checkbox" id="notifSMS" checked={editNotifications.sms} onChange={(e) => setEditNotifications(prev => ({ ...prev, sms: e.target.checked }))} className="h-5 w-5 text-primary rounded border-mediumGray dark:border-gray-600 focus:ring-primary"/>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="notifLowStock" className="text-darkGray dark:text-gray-300 text-md font-medium">Digniin Alaab Yar</label>
              <input type="checkbox" id="notifLowStock" checked={editNotifications.lowStock} onChange={(e) => setEditNotifications(prev => ({ ...prev, lowStock: e.target.checked }))} className="h-5 w-5 text-primary rounded border-mediumGray dark:border-gray-600 focus:ring-primary"/>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="notifOverdueProjects" className="text-darkGray dark:text-gray-300 text-md font-medium">Digniin Mashaariic Dib U Dhacday</label>
              <input type="checkbox" id="notifOverdueProjects" checked={editNotifications.overdueProjects} onChange={(e) => setEditNotifications(prev => ({ ...prev, overdueProjects: e.target.checked }))} className="h-5 w-5 text-primary rounded border-mediumGray dark:border-gray-600 focus:ring-primary"/>
            </div>
            {/* Notification Sound Selector */}
            <div>
              <label htmlFor="notificationSound" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Codka Digniinta</label>
              <select id="notificationSound" value={editNotificationSound} onChange={(e) => setEditNotificationSound(e.target.value)} className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none">
                <option value="default">Default</option>
                <option value="alert1">Alert 1</option>
                <option value="chime">Chime</option>
              </select>
            </div>
          </div>
        </div>

        {/* Accessibility Preferences */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md mb-8 animate-fade-in-up">
          <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6 flex items-center space-x-3">
            <Accessibility size={28} className="text-primary"/> <span>Dejinta Helitaanka</span>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="highContrast" className="text-darkGray dark:text-gray-300 text-md font-medium">Qaabka Contrast Sare</label>
              <input type="checkbox" id="highContrast" checked={editHighContrast} onChange={(e) => setEditHighContrast(e.target.checked)} className="h-5 w-5 text-primary rounded border-mediumGray dark:border-gray-600 focus:ring-primary"/>
            </div>
            <div>
              <label htmlFor="textSize" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Size-ka Qoraalka</label>
              <div className="flex space-x-3">
                <button onClick={() => setEditTextSize('small')} className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${editTextSize === 'small' ? 'bg-primary text-white border-primary' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 border-lightGray dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  <span>Yar</span>
                </button>
                <button onClick={() => setEditTextSize('medium')} className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${editTextSize === 'medium' ? 'bg-primary text-white border-primary' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 border-lightGray dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  <span>Dhexdhexaad</span>
                </button>
                <button onClick={() => setEditTextSize('large')} className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${editTextSize === 'large' ? 'bg-primary text-white border-primary' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 border-lightGray dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  <span>Weynaan</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {toastMessage && (
          <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
        )}
      </div>
    </Layout>
  );
}
