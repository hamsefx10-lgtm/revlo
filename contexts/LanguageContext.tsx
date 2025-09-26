'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Language Types
export type Language = 'so' | 'en';

// Translation Interface
interface Translations {
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    view: string;
    search: string;
    filter: string;
    clear: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    submit: string;
    confirm: string;
    yes: string;
    no: string;
    ok: string;
    retry: string;
    refresh: string;
    sync: string;
    online: string;
    offline: string;
    connected: string;
    disconnected: string;
    reconnecting: string;
  };
  
  // Navigation
  navigation: {
    dashboard: string;
    expenses: string;
    projects: string;
    employees: string;
    customers: string;
    vendors: string;
    reports: string;
    settings: string;
    profile: string;
    logout: string;
  };
  
  // Notifications
  notifications: {
    title: string;
    noNotifications: string;
    markAsRead: string;
    clearAll: string;
    viewAll: string;
    newNotification: string;
    notificationTypes: {
      info: string;
      success: string;
      warning: string;
      error: string;
    };
    messages: {
      dataSynced: string;
      syncError: string;
      newDataAvailable: string;
      expenseUpdated: string;
      expenseApproved: string;
      expenseRejected: string;
      newComment: string;
      fileUploaded: string;
      systemAlert: string;
    };
  };
  
  // Expenses
  expenses: {
    title: string;
    addExpense: string;
    editExpense: string;
    deleteExpense: string;
    expenseDetails: string;
    amount: string;
    date: string;
    category: string;
    subCategory: string;
    description: string;
    note: string;
    receipt: string;
    approved: string;
    pending: string;
    rejected: string;
    paidFrom: string;
    project: string;
    employee: string;
    vendor: string;
    customer: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
  
  // Actions
  actions: {
    print: string;
    download: string;
    duplicate: string;
    export: string;
    approve: string;
    reject: string;
    compare: string;
    timeline: string;
    files: string;
    fullscreen: string;
    notifications: string;
    comments: string;
    attachments: string;
    related: string;
    analytics: string;
  };
  
  // Status
  status: {
    active: string;
    inactive: string;
    pending: string;
    completed: string;
    cancelled: string;
    overdue: string;
    low: string;
    medium: string;
    high: string;
    critical: string;
  };
}

// Language Context Type
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
}

// Create Context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations: Record<Language, Translations> = {
  so: {
    common: {
      loading: 'Soo gelinaya...',
      error: 'Cilad',
      success: 'Guul',
      cancel: 'Jooji',
      save: 'Badbaadi',
      delete: 'Tirtir',
      edit: 'Wax ka beddel',
      view: 'Fiiri',
      search: 'Raadi',
      filter: 'Shaandhay',
      clear: 'Nadiif',
      close: 'Xidh',
      back: 'Ku laabo',
      next: 'Xiga',
      previous: 'Hore',
      submit: 'Gudbi',
      confirm: 'Xaqiiji',
      yes: 'Haa',
      no: 'Maya',
      ok: 'Waa hagaag',
      retry: 'Dib u day',
      refresh: 'Cusboonaysii',
      sync: 'Isku mid ahaa',
      online: 'La xidhiidhay',
      offline: 'La jebiyay',
      connected: 'La xidhiidhay',
      disconnected: 'La jebiyay',
      reconnecting: 'Dib u xidhiidhaya',
    },
    navigation: {
      dashboard: 'Dashboard',
      expenses: 'Kharashyada',
      projects: 'Mashruucyada',
      employees: 'Shaqaalaha',
      customers: 'Macaamiisha',
      vendors: 'Kiriyaha',
      reports: 'Warbixinta',
      settings: 'Dejinta',
      profile: 'Profile',
      logout: 'Ka bax',
    },
    notifications: {
      title: 'Digniinaha',
      noNotifications: 'Ma jiraan digniinaha',
      markAsRead: 'Akhri',
      clearAll: 'Tirtir Dhammaan',
      viewAll: 'Fiiri Dhammaan',
      newNotification: 'Digniin cusub',
      notificationTypes: {
        info: 'Macluumaad',
        success: 'Guul',
        warning: 'Digniin',
        error: 'Cilad',
      },
      messages: {
        dataSynced: 'Xogta si guul leh ayaa la isku mid ahaa!',
        syncError: 'Cilad ayaa dhacday isku mid ahaanta xogta.',
        newDataAvailable: 'Xogta cusub ayaa la helay',
        expenseUpdated: 'Kharashka waa la cusboonaysiiyay',
        expenseApproved: 'Kharashka waa la ansixiyay',
        expenseRejected: 'Kharashka waa la diiday',
        newComment: 'Fikrad cusub ayaa la dhigay',
        fileUploaded: 'Fayl cusub ayaa la soo geliyay',
        systemAlert: 'Digniin nidaamka ayaa la helay',
      },
    },
    expenses: {
      title: 'Kharashyada',
      addExpense: 'Ku dar Kharash',
      editExpense: 'Wax ka beddel Kharash',
      deleteExpense: 'Tirtir Kharash',
      expenseDetails: 'Faahfaahinta Kharashka',
      amount: 'Qadarka',
      date: 'Taariikhda',
      category: 'Qaybta',
      subCategory: 'Qaybta Hoose',
      description: 'Sharaxaad',
      note: 'Fiiro Gaar Ah',
      receipt: 'Rasiidhka',
      approved: 'La ansixiyay',
      pending: 'La sugayo',
      rejected: 'La diiday',
      paidFrom: 'Laga Bixiyay',
      project: 'Mashruuc',
      employee: 'Shaqaale',
      vendor: 'Kiriye',
      customer: 'Macaamiil',
      createdBy: 'Diiwaan Geliyay',
      createdAt: 'La Diiwaan Geliyay',
      updatedAt: 'La Cusboonaysiiyay',
    },
    actions: {
      print: 'Daabac',
      download: 'Soo Degso',
      duplicate: 'Ku Duub',
      export: 'Dhoofin',
      approve: 'Ansixi',
      reject: 'Diid',
      compare: 'Isu Barbar Dhiib',
      timeline: 'Taariikhda',
      files: 'Faylalka',
      fullscreen: 'Buuxa Shaashada',
      notifications: 'Digniinaha',
      comments: 'Fikradaha',
      attachments: 'Lifaaqyada',
      related: 'La Mid Ah',
      analytics: 'Tirakoobka',
    },
    status: {
      active: 'Firfircoon',
      inactive: 'Firfircoonayn',
      pending: 'La sugayo',
      completed: 'Dhammaaday',
      cancelled: 'La joojiyay',
      overdue: 'Dhaafay',
      low: 'Hoos',
      medium: 'Dhexe',
      high: 'Sare',
      critical: 'Muhiim',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      search: 'Search',
      filter: 'Filter',
      clear: 'Clear',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      retry: 'Retry',
      refresh: 'Refresh',
      sync: 'Sync',
      online: 'Online',
      offline: 'Offline',
      connected: 'Connected',
      disconnected: 'Disconnected',
      reconnecting: 'Reconnecting',
    },
    navigation: {
      dashboard: 'Dashboard',
      expenses: 'Expenses',
      projects: 'Projects',
      employees: 'Employees',
      customers: 'Customers',
      vendors: 'Vendors',
      reports: 'Reports',
      settings: 'Settings',
      profile: 'Profile',
      logout: 'Logout',
    },
    notifications: {
      title: 'Notifications',
      noNotifications: 'No notifications',
      markAsRead: 'Mark as Read',
      clearAll: 'Clear All',
      viewAll: 'View All',
      newNotification: 'New notification',
      notificationTypes: {
        info: 'Info',
        success: 'Success',
        warning: 'Warning',
        error: 'Error',
      },
      messages: {
        dataSynced: 'Data synced successfully!',
        syncError: 'Error occurred while syncing data.',
        newDataAvailable: 'New data available',
        expenseUpdated: 'Expense updated',
        expenseApproved: 'Expense approved',
        expenseRejected: 'Expense rejected',
        newComment: 'New comment added',
        fileUploaded: 'New file uploaded',
        systemAlert: 'System alert received',
      },
    },
    expenses: {
      title: 'Expenses',
      addExpense: 'Add Expense',
      editExpense: 'Edit Expense',
      deleteExpense: 'Delete Expense',
      expenseDetails: 'Expense Details',
      amount: 'Amount',
      date: 'Date',
      category: 'Category',
      subCategory: 'Sub Category',
      description: 'Description',
      note: 'Note',
      receipt: 'Receipt',
      approved: 'Approved',
      pending: 'Pending',
      rejected: 'Rejected',
      paidFrom: 'Paid From',
      project: 'Project',
      employee: 'Employee',
      vendor: 'Vendor',
      customer: 'Customer',
      createdBy: 'Created By',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
    },
    actions: {
      print: 'Print',
      download: 'Download',
      duplicate: 'Duplicate',
      export: 'Export',
      approve: 'Approve',
      reject: 'Reject',
      compare: 'Compare',
      timeline: 'Timeline',
      files: 'Files',
      fullscreen: 'Fullscreen',
      notifications: 'Notifications',
      comments: 'Comments',
      attachments: 'Attachments',
      related: 'Related',
      analytics: 'Analytics',
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      completed: 'Completed',
      cancelled: 'Cancelled',
      overdue: 'Overdue',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical',
    },
  },
};

// Language Provider Component
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('so'); // Default to Somali

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'so' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage when changed
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const isRTL = language === 'so'; // Somali is RTL

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
