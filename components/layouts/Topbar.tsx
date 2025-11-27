'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, Menu, LogOut, Settings, User as UserIcon, ChevronFirst, ChevronLast, X, CheckCircle, Globe, Languages } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface TopbarProps {
  onOpenSidebar: () => void; // mobile menu
  onToggleSidebar?: () => void; // desktop collapse/expand
  isSidebarCollapsed?: boolean; // desktop state
  currentUser: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: string;
  };
  currentCompany: {
    name: string;
    logoUrl?: string | null;
  };
  handleLogout: () => Promise<void>;
  rounded?: boolean;
}

const Topbar: React.FC<TopbarProps> = ({
  onOpenSidebar,
  onToggleSidebar,
  isSidebarCollapsed,
  currentUser,
  currentCompany,
  handleLogout,
  rounded,
}) => {
  const { notifications, unreadCount, markAsRead, removeNotification, clearAllNotifications } = useNotifications();
  const { language, setLanguage, t } = useLanguage();
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  return (
    <header className={`w-full flex items-center justify-between bg-white dark:bg-gray-800 shadow-md py-3 px-4 md:px-8 border-b border-lightGray dark:border-gray-700 z-20 transition-all duration-300
      ${rounded ? 'rounded-lg' : ''}`}>
      {/* Left: Mobile Sidebar Toggle & Desktop Collapse Button */}
      <div className="flex items-center space-x-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenSidebar}
          title="Open mobile menu"
          className="md:hidden p-2 rounded-lg bg-lightGray dark:bg-gray-700 shadow-sm text-darkGray dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
        >
          <Menu size={24} />
        </button>
        {/* Desktop collapse/expand button */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden md:inline-flex p-2 rounded-lg bg-lightGray dark:bg-gray-700 shadow-sm text-darkGray dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            {isSidebarCollapsed ? <ChevronLast size={22} /> : <ChevronFirst size={22} />}
          </button>
        )}
        {currentCompany.logoUrl ? (
          <img
            src={currentCompany.logoUrl}
            alt={currentCompany.name || 'Company Logo'}
            className="hidden md:inline h-8 w-auto rounded-md object-contain bg-lightGray/40 dark:bg-gray-700/60 px-2 py-1"
          />
        ) : (
        <span className="text-2xl font-extrabold text-primary hidden md:inline select-none">
          Revl<span className="text-secondary">o</span>.
        </span>
        )}
        <span className="hidden md:inline text-mediumGray dark:text-gray-400 font-semibold ml-4">{currentCompany.name}</span>
      </div>

      {/* Right: Language, Notifications, User Profile */}
      <div className="flex items-center space-x-4">
        {/* Language Toggle */}
        <div className="relative">
          <button 
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="p-2 rounded-full bg-lightGray dark:bg-gray-700 shadow-sm text-darkGray dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 relative group"
            title={t.navigation.settings}
          >
            <Globe size={20} />
            <span className="absolute -bottom-1 -right-1 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
              {language.toUpperCase()}
            </span>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              {language === 'so' ? 'Soomaali' : 'English'}
            </div>
          </button>

          {/* Language Dropdown */}
          {showLanguageDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-lightGray dark:border-gray-700 z-50">
              <div className="p-2">
                <button 
                  onClick={() => {
                    setLanguage('so');
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
                    language === 'so' 
                      ? 'bg-primary text-white' 
                      : 'text-darkGray dark:text-gray-100 hover:bg-lightGray dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">🇸🇴</span>
                  <span>Soomaali</span>
                </button>
                <button 
                  onClick={() => {
                    setLanguage('en');
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
                    language === 'en' 
                      ? 'bg-primary text-white' 
                      : 'text-darkGray dark:text-gray-100 hover:bg-lightGray dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">🇺🇸</span>
                  <span>English</span>
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Enhanced Notifications Button */}
        <div className="relative">
          <button 
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            title="View notifications"
            className="p-2 rounded-full bg-lightGray dark:bg-gray-700 shadow-sm text-darkGray dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 relative group"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-redError text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              {unreadCount > 0 ? `${unreadCount} ${t.notifications.newNotification}` : t.notifications.noNotifications}
            </div>
          </button>

          {/* Notification Dropdown */}
          {showNotificationDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-lightGray dark:border-gray-700 z-50 max-h-96 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-lightGray dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-darkGray dark:text-gray-100">{t.notifications.title}</h3>
                  <div className="flex items-center space-x-2">
                    {notifications.length > 0 && (
                      <button 
                        onClick={clearAllNotifications}
                        className="text-sm text-red-500 hover:text-red-600 transition-colors duration-200"
                      >
                        {t.notifications.clearAll}
                      </button>
                    )}
                    <button 
                      onClick={() => setShowNotificationDropdown(false)}
                      title="Close notifications"
                      className="text-mediumGray hover:text-darkGray dark:hover:text-gray-100 transition-colors duration-200"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.slice(0, 10).map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border-b border-lightGray dark:border-gray-700 hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-200 ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">
                              {notification.type === 'error' ? '⚠️' : 
                               notification.type === 'warning' ? '⚠️' : 
                               notification.type === 'success' ? '✅' : 'ℹ️'}
                            </span>
                            <span className={`text-sm font-medium capitalize ${
                              notification.type === 'success' ? 'text-green-600' :
                              notification.type === 'error' ? 'text-red-600' :
                              notification.type === 'warning' ? 'text-yellow-600' :
                              'text-blue-600'
                            }`}>
                              {t.notifications.notificationTypes[notification.type]}
                            </span>
                            {notification.source && (
                              <span className="text-xs text-mediumGray dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {notification.source}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-darkGray dark:text-gray-100">{notification.message}</p>
                          <p className="text-xs text-mediumGray dark:text-gray-400 mt-1">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <button 
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200"
                              title={t.notifications.markAsRead}
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => removeNotification(notification.id)}
                            className="p-1 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200"
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell size={48} className="mx-auto text-mediumGray dark:text-gray-500 mb-3" />
                    <p className="text-mediumGray dark:text-gray-400 font-medium">
                      {t.notifications.noNotifications}.
                    </p>
                    <p className="text-sm text-mediumGray dark:text-gray-500 mt-1">
                      {t.notifications.newNotification} ayaa halkan ku muujin doona.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-lightGray dark:border-gray-700 bg-lightGray dark:bg-gray-700">
                  <Link 
                    href="/settings/notifications"
                    className="block text-center text-sm text-primary hover:text-blue-600 transition-colors duration-200"
                    onClick={() => setShowNotificationDropdown(false)}
                  >
                    {t.notifications.viewAll}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
        {/* User Profile Dropdown */}
        <div className="relative group">
          <button className="flex items-center space-x-2 text-darkGray dark:text-gray-100 bg-lightGray dark:bg-gray-700 p-2 rounded-full shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            {currentCompany.logoUrl ? (
              <img
                src={currentCompany.logoUrl}
                alt={currentCompany.name || 'Company Logo'}
                className="w-8 h-8 rounded-full object-contain bg-white"
              />
            ) : (
              <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                {currentUser.avatar}
              </span>
            )}
            <span className="hidden lg:block text-md">{currentUser.name}</span>
          </button>
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-xl py-2 hidden group-hover:block z-50">
            <Link href={`/profile/${currentUser.id}`} className="block px-4 py-2 text-darkGray dark:text-gray-100 hover:bg-lightGray dark:hover:bg-gray-600 transition-colors duration-200 flex items-center space-x-2">
              <UserIcon size={18} /> <span>Profile</span>
            </Link>
            <Link href="/settings" className="block px-4 py-2 text-darkGray dark:text-gray-100 hover:bg-lightGray dark:hover:bg-gray-600 transition-colors duration-200 flex items-center space-x-2">
              <Settings size={18} /> <span>Settings</span>
            </Link>
            <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-redError hover:bg-redError/10 transition-colors duration-200 flex items-center space-x-2">
              <LogOut size={18} /> <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;