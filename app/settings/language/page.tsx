'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/layouts/Layout';
import { Globe, ArrowLeft, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSettingsPage() {
    const router = useRouter();
    const { language, setLanguage, t } = useLanguage();

    const languages = [
        { id: 'so', name: 'Somali', nativeName: 'Af-Soomaali', flag: '🇸🇴' },
        { id: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    ];

    const handleLanguageChange = (langId: 'so' | 'en') => {
        setLanguage(langId);
        // Optional: Refresh or notify user
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center mb-8">
                    <button
                        onClick={() => router.back()}
                        className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ArrowLeft size={24} className="text-darkGray dark:text-white" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-darkGray dark:text-white flex items-center gap-2">
                            <Globe className="text-primary" />
                            {language === 'so' ? ' luuqada' : 'Language'}
                        </h1>
                        <p className="text-mediumGray dark:text-gray-400 text-sm">
                            {language === 'so' ? 'Dooro luuqada aad rabto inaad ku isticmaasho barnaamijka.' : 'Choose the language you want to use in the application.'}
                        </p>
                    </div>
                </div>

                {/* Language Selection Cards */}
                <div className="grid gap-4">
                    {languages.map((lang) => (
                        <button
                            key={lang.id}
                            onClick={() => handleLanguageChange(lang.id as 'so' | 'en')}
                            className={`
                relative p-6 rounded-xl border-2 transition-all duration-300 flex items-center justify-between group
                ${language === lang.id
                                    ? 'border-primary bg-primary/5 shadow-md'
                                    : 'border-transparent bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm hover:shadow-md'
                                }
              `}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">{lang.flag}</span>
                                <div className="text-left">
                                    <h3 className={`font-bold text-lg ${language === lang.id ? 'text-primary' : 'text-darkGray dark:text-white'}`}>
                                        {lang.nativeName}
                                    </h3>
                                    <p className="text-sm text-mediumGray dark:text-gray-400">{lang.name}</p>
                                </div>
                            </div>

                            {language === lang.id && (
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white animate-fade-in">
                                    <Check size={18} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Preview Section */}
                <div className="mt-12 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-darkGray dark:text-white mb-4">Preview / Tijaabo</h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-mediumGray">Common.Save</span>
                            <span className="font-mono font-bold text-darkGray dark:text-white">{t.common.save}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span className="text-mediumGray">Navigation.Dashboard</span>
                            <span className="font-mono font-bold text-darkGray dark:text-white">{t.navigation.dashboard}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-mediumGray">Expenses.Add</span>
                            <span className="font-mono font-bold text-darkGray dark:text-white">{t.expenses.addExpense}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
