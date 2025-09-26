// app/settings/notifications/page.tsx - Notifications Settings Page (Live Data Integration)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, Bell, Plus, Search, Filter, Edit, Trash2, X, Loader2, Info, 
  Mail, Smartphone, MessageSquare, CheckCircle, XCircle, ChevronRight, Volume2, 
  Tag, Clock, Briefcase, Package, User, CheckSquare, RefreshCw,
  List, LayoutGrid // Added for view toggle
} from 'lucide-react';
import Toast from '../../../components/common/Toast'; // Reuse Toast component

// --- Types ---
interface Notification {
  id: string;
  message: string;
  type: string;
  date: string;
  read: boolean;
  details?: string;
  userDisplayName?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationStats {
  total: number;
  unread: number;
}

interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  stats: NotificationStats;
}

// --- Notification Card Component (for both Desktop & Mobile Card View) ---
const NotificationCard: React.FC<{ notification: Notification; onMarkRead: (id: string) => void; onDelete: (id: string) => void }> = ({ notification, onMarkRead, onDelete }) => (
  <div className={`bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md animate-fade-in-up border-l-4 ${!notification.read ? 'border-primary' : 'border-lightGray dark:border-gray-700'} relative`}>
    <div className="flex justify-between items-start mb-3">
      <h4 className="font-semibold text-darkGray dark:text-gray-100 text-lg flex items-center space-x-2">
        {!notification.read ? <CheckCircle size={20} className="text-primary"/> : <CheckCircle size={20} className="text-mediumGray"/>}
        <span>{notification.message}</span>
      </h4>
      <div className="flex space-x-2 flex-shrink-0">
        {!notification.read && (
          <button onClick={() => onMarkRead(notification.id)} className="p-1 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="Mark as Read">
            <CheckCircle size={16} />
          </button>
        )}
        <button onClick={() => onDelete(notification.id)} className="p-1 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Notification">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
    <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
      <Tag size={14} className="text-secondary"/> <span>Nooca: {notification.type}</span>
    </p>
    <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
      <Clock size={14}/> <span>Taariikhda: {new Date(notification.date).toLocaleString()}</span>
    </p>
    {notification.details && ( // Display detailed message if available
      <p className="text-sm text-darkGray dark:text-gray-200 mt-2 p-2 bg-lightGray dark:bg-gray-700 rounded-lg border border-lightGray dark:border-gray-600">
        <Info size={14} className="inline mr-1 text-primary"/> {notification.details}
      </p>
    )}
    {notification.userDisplayName && ( // Display user if available (for User Activity)
      <p className="text-sm text-mediumGray dark:text-gray-400 mt-1 flex items-center space-x-2">
        <User size={14}/> <span>User: {notification.userDisplayName}</span>
      </p>
    )}
  </div>
);


// Main Notifications Page Component
export default function NotificationsSettingsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterReadStatus, setFilterReadStatus] = useState('All');
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards'); // Default to cards view
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0 });
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0, hasMore: false });

  // Notification Preferences (from Personalization page, simulated here)
  const [emailNotif, setEmailNotif] = useState(true);
  const [inAppNotif, setInAppNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [lowStockNotif, setLowStockNotif] = useState(true);
  const [overdueProjectsNotif, setOverdueProjectsNotif] = useState(true);
  const [notificationSound, setNotificationSound] = useState('default'); // 'default', 'alert1', 'chime'

  // Statistics
  const totalNotifications = stats?.total || 0;
  const unreadNotifications = stats?.unread || 0;

  const notificationTypes = ['All', 'Overdue Project', 'Low Stock', 'New Payment', 'User Activity', 'New Expense', 'System Activity']; 
  const readStatuses = ['All', 'Read', 'Unread'];
  const notificationSounds = ['default', 'alert1', 'chime'];

  // Fetch notifications from API
  const fetchNotifications = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const params = new URLSearchParams();
      if (filterType !== 'All') params.append('type', filterType);
      if (filterReadStatus !== 'All') params.append('read', filterReadStatus);
      if (searchTerm) params.append('search', searchTerm);
      params.append('limit', '50');
      params.append('offset', '0');

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data: NotificationResponse = await response.json();
      setNotifications(data.notifications);
      setStats(data.stats);
      setPagination(data.pagination);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      setToastMessage({ message: 'Cilad ayaa dhacday marka digniinaha la soo gelinayay', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load notifications on component mount and when filters change
  useEffect(() => {
    fetchNotifications();
  }, [filterType, filterReadStatus, searchTerm]);

  const handleMarkRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      setNotifications(prev => prev.map(notif => notif.id === id ? { ...notif, read: true } : notif));
      setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      setToastMessage({ message: 'Digniinta waa la akhriyay!', type: 'success' });
    } catch (error) {
      console.error('Error marking as read:', error);
      setToastMessage({ message: 'Cilad ayaa dhacday marka la akhriyay', type: 'error' });
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!window.confirm('Ma hubtaa inaad tirtirto digniintan?')) return;

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete notification');

      const wasUnread = notifications.find(n => n.id === id)?.read === false;
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      setStats(prev => ({ 
        total: prev.total - 1, 
        unread: wasUnread ? Math.max(0, prev.unread - 1) : prev.unread 
      }));
      setToastMessage({ message: 'Digniinta waa la tirtiray!', type: 'success' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      setToastMessage({ message: 'Cilad ayaa dhacday marka la tirtiray', type: 'error' });
    }
  };

  const handleClearAllNotifications = async () => {
    if (!window.confirm('Ma hubtaa inaad tirtirto dhammaan digniinaha?')) return;

    try {
      const response = await fetch('/api/notifications?deleteAll=true', {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to clear all notifications');

      setNotifications([]);
      setStats({ total: 0, unread: 0 });
      setToastMessage({ message: 'Dhammaan digniinaha waa la tirtiray!', type: 'success' });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      setToastMessage({ message: 'Cilad ayaa dhacday marka la tirtiray', type: 'error' });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // Mark all unread notifications as read
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      for (const id of unreadIds) {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, read: true })
        });
      }

      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setStats(prev => ({ ...prev, unread: 0 }));
      setToastMessage({ message: 'Dhammaan digniinaha waa la akhriyay!', type: 'success' });
    } catch (error) {
      console.error('Error marking all as read:', error);
      setToastMessage({ message: 'Cilad ayaa dhacday marka la akhriyay', type: 'error' });
    }
  };

  const handleSavePreferences = () => {
    console.log("Saving Notification Preferences:", { emailNotif, inAppNotif, smsNotif, lowStockNotif, overdueProjectsNotif, notificationSound });
    setToastMessage({ message: 'Dejinta digniinaha waa la badbaadiyay!', type: 'success' });
  };

  const handleRefresh = () => {
    fetchNotifications(true);
  };

  const handleSeedData = async () => {
    try {
      const response = await fetch('/api/notifications/seed', {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to seed data');

      setToastMessage({ message: 'Digniinaha tijaabada ayaa la abuuray!', type: 'success' });
      fetchNotifications(true); // Refresh the list
    } catch (error) {
      console.error('Error seeding data:', error);
      setToastMessage({ message: 'Cilad ayaa dhacday marka la abuuraynayay', type: 'error' });
    }
  };


  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/settings" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Notifications
        </h1>
        <div className="flex space-x-3">
          <button 
            onClick={handleSeedData}
            className="bg-accent text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-purple-600 transition duration-200 shadow-md flex items-center"
          >
            <Plus size={20} className="mr-2" /> 
            Seed Data
          </button>
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="bg-secondary text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-blue-600 transition duration-200 shadow-md flex items-center disabled:opacity-50"
          >
            <RefreshCw size={20} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} /> 
            {refreshing ? 'Loading...' : 'Refresh'}
          </button>
          <button onClick={handleSavePreferences} className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center">
            <CheckCircle size={20} className="mr-2" /> Badbaadi Dejinta
          </button>
        </div>
      </div>

      {/* Notification Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Digniinaha</h4>
          <p className="text-3xl font-extrabold text-primary">{totalNotifications}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Digniinaha Aan La Akhrin</h4>
          <p className="text-3xl font-extrabold text-redError">{unreadNotifications}</p>
        </div>
      </div>

      {/* Notification Preferences Section */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md mb-8 animate-fade-in-up">
        <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6 flex items-center space-x-3">
          <Bell size={28} className="text-primary"/> <span>Dejinta Digniinaha</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Delivery Channels */}
          <div>
            <h4 className="text-lg font-semibold text-darkGray dark:text-gray-300 mb-3">Habka Gaarsiinta</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="prefEmail" className="text-darkGray dark:text-gray-300 text-md font-medium flex items-center space-x-2"><Mail size={18}/><span>Email</span></label>
                <input type="checkbox" id="prefEmail" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} className="h-5 w-5 text-primary rounded border-mediumGray dark:border-gray-600 focus:ring-primary"/>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="prefInApp" className="text-darkGray dark:text-gray-300 text-md font-medium flex items-center space-x-2"><Smartphone size={18}/><span>App-ka Gudihiisa</span></label>
                <input type="checkbox" id="prefInApp" checked={inAppNotif} onChange={(e) => setInAppNotif(e.target.checked)} className="h-5 w-5 text-primary rounded border-mediumGray dark:border-gray-600 focus:ring-primary"/>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="prefSMS" className="text-darkGray dark:text-gray-300 text-md font-medium flex items-center space-x-2"><MessageSquare size={18}/><span>SMS (Lacag dheeraad ah)</span></label>
                <input type="checkbox" id="prefSMS" checked={smsNotif} onChange={(e) => setSmsNotif(e.target.checked)} className="h-5 w-5 text-primary rounded border-mediumGray dark:border-gray-600 focus:ring-primary"/>
              </div>
            </div>
          </div>
          {/* Specific Event Types */}
          <div>
            <h4 className="text-lg font-semibold text-darkGray dark:text-gray-300 mb-3">Noocyada Digniinaha</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="prefLowStock" className="text-darkGray dark:text-gray-300 text-md font-medium flex items-center space-x-2"><Package size={18}/><span>Alaab Yar</span></label>
                <input type="checkbox" id="prefLowStock" checked={lowStockNotif} onChange={(e) => setLowStockNotif(e.target.checked)} className="h-5 w-5 text-primary rounded border-mediumGray dark:border-gray-600 focus:ring-primary"/>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="prefOverdueProjects" className="text-darkGray dark:text-gray-300 text-md font-medium flex items-center space-x-2"><Briefcase size={18}/><span>Mashaariic Dib U Dhacday</span></label>
                <input type="checkbox" id="prefOverdueProjects" checked={overdueProjectsNotif} onChange={(e) => setOverdueProjectsNotif(e.target.checked)} className="h-5 w-5 text-primary rounded border-mediumGray dark:border-gray-600 focus:ring-primary"/>
              </div>
              {/* Notification Sound Selector */}
              <div>
                <label htmlFor="notifSound" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Codka Digniinta</label>
                <select id="notifSound" value={notificationSound} onChange={(e) => setNotificationSound(e.target.value)} className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none">
                  {notificationSounds.map(sound => <option key={sound} value={sound}>{sound}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
      </div>
        <div className="flex justify-between items-center p-6 border-b border-lightGray dark:border-gray-700">
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">Diiwaanka Digniinaha</h3>
          <div className="flex space-x-3">
            <button onClick={handleMarkAllRead} className="bg-primary/10 text-primary py-2 px-4 rounded-lg font-semibold flex items-center hover:bg-primary hover:text-white transition duration-200">
                <CheckSquare size={18} className="mr-2"/> Dhammaan Akhri
            </button>
            <button onClick={handleClearAllNotifications} className="bg-redError/10 text-redError py-2 px-4 rounded-lg font-semibold flex items-center hover:bg-redError hover:text-white transition duration-200">
                <Trash2 size={18} className="mr-2"/> Tirtir Dhammaan
            </button>
          </div>
        </div>

        {/* Filters for History */}
        <div className="p-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 border-b border-lightGray dark:border-gray-700">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            />
          </div>
          <div className="relative w-full md:w-48">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)} 
              title="Filter by notification type"
              className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            >
              {notificationTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400"><ChevronRight className="transform rotate-90" size={20} /></div>
          </div>
          <div className="relative w-full md:w-48">
            <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
            <select 
              value={filterReadStatus} 
              onChange={(e) => setFilterReadStatus(e.target.value)} 
              title="Filter by read status"
              className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            >
              {readStatuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400"><ChevronRight className="transform rotate-90" size={20} /></div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex space-x-2 w-full justify-center mb-6">
            <button 
              onClick={() => setViewMode('list')} 
              title="List View"
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`}
            >
                <List size={20} />
            </button>
            <button 
              onClick={() => setViewMode('cards')} 
              title="Cards View"
              className={`p-2 rounded-lg ${viewMode === 'cards' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`}
            >
                <LayoutGrid size={20} />
            </button>
        </div>


        {/* Loading State */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md text-center animate-fade-in">
            <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
            <p className="text-mediumGray dark:text-gray-400">Digniinaha la soo gelinayaa...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in">
            <Bell size={48} className="mx-auto mb-4 text-lightGray dark:text-gray-600" />
            <p className="text-lg">Ma jiraan digniino la helay.</p>
            <p className="text-sm mt-2">Digniinaha cusub ayaa halkan ku soo baxaya marka dhaqdhaqaaqyo cusub ay dhacaan.</p>
          </div>
        ) : viewMode === 'list' ? (
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-md animate-fade-in">
                <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                    <thead className="bg-lightGray dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Fariin</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Taariikhda</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Ficillo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                        {notifications.map(notif => (
                            <tr key={notif.id}>
                                <td className="px-4 py-3 text-darkGray dark:text-gray-100">{notif.message}</td>
                                <td className="px-4 py-3 text-mediumGray dark:text-gray-400">{notif.type}</td>
                                <td className="px-4 py-3 text-mediumGray dark:text-gray-400">{new Date(notif.date).toLocaleString()}</td>
                                <td className="px-4 py-3 text-right">
                                    {!notif.read && (
                                        <button onClick={() => handleMarkRead(notif.id)} className="text-primary hover:underline mr-2">
                                            Mark as Read
                                        </button>
                                    )}
                                    <button onClick={() => handleDeleteNotification(notif.id)} className="text-redError hover:underline">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Pagination */}
                <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
                    <button 
                      disabled={pagination.offset === 0}
                      className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Hore
                    </button>
                    <span className="text-sm text-darkGray dark:text-gray-100">
                      Bogga {Math.floor(pagination.offset / pagination.limit) + 1} ee {Math.ceil(pagination.total / pagination.limit) || 1}
                    </span>
                    <button 
                      disabled={!pagination.hasMore}
                      className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Xiga
                    </button>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {notifications.map(notif => (
                    <NotificationCard 
                        key={notif.id} 
                        notification={notif} 
                        onMarkRead={handleMarkRead} 
                        onDelete={handleDeleteNotification} 
                    />
                ))}
            </div>
        )}

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
