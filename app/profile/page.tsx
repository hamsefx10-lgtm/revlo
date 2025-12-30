// app/profile/page.tsx - My Profile Page (Current User) - Enhanced Version
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/layouts/Layout';
import {
  User, Mail, Phone, Building, Briefcase, Settings, Edit, Loader2, DollarSign,
  Calendar, Clock, RefreshCw, Activity, Shield
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

export default function MyProfilePage() {
  const { addNotification } = useNotifications();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setUserProfile(null);

    fetch('/api/settings/users/me')
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'User not found');
        }
        return res.json();
      })
      .then((data) => {
        setUserProfile(data.user);
      })
      .catch((err) => {
        setError(err.message || 'User not found');
        addNotification({ type: 'error', message: err.message || 'Failed to load profile' });
      })
      .finally(() => setLoading(false));
  }, [addNotification]);

  const handleRefresh = () => {
    addNotification({ type: 'info', message: 'Refreshing profile data...' });
    window.location.reload();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px] text-darkGray dark:text-gray-100">
          <Loader2 className="animate-spin mr-3" size={32} /> Loading Profile...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center p-8 text-redError">
          {error}
        </div>
      </Layout>
    );
  }

  if (!userProfile) {
    return (
      <Layout>
        <div className="text-center p-8 text-redError">
          User not found.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">My Profile</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href={`/profile/edit/${userProfile.id}`} className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center justify-center">
            <Edit size={20} className="mr-2" /> Edit Profile
          </Link>
          <button onClick={handleRefresh} className="bg-secondary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-green-600 transition duration-200 shadow-md flex items-center justify-center">
            <RefreshCw size={20} className="mr-2" /> Refresh
          </button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md mb-8 animate-fade-in-up">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 mb-6 pb-6 border-b border-lightGray dark:border-gray-700">
          <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-white text-6xl font-bold flex-shrink-0 border-4 border-primary/50 shadow-lg">
            {userProfile.avatarChar || (userProfile.name ? userProfile.name[0] : '?')}
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-4xl font-bold text-darkGray dark:text-gray-100 mb-2">{userProfile.name}</h3>
            <p className="text-xl text-mediumGray dark:text-gray-400 mb-1 flex items-center justify-center md:justify-start space-x-2">
              <User size={20} className="text-primary" /> <span>{userProfile.role}</span>
            </p>
            <p className="text-xl text-mediumGray dark:text-gray-400 mb-1 flex items-center justify-center md:justify-start space-x-2">
              <Building size={20} className="text-primary" /> <span>{userProfile.companyName}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-darkGray dark:text-gray-100">
          <p className="flex items-center space-x-2"><Mail size={18} className="text-primary" /><span>{userProfile.email}</span></p>
          <p className="flex items-center space-x-2"><Phone size={18} className="text-primary" /><span>{userProfile.phone || 'N/A'}</span></p>
          <p className="flex items-center space-x-2"><Briefcase size={18} className="text-primary" /><span>{userProfile.projectsCount ?? 0} Projects</span></p>
          <p className="flex items-center space-x-2"><DollarSign size={18} className="text-primary" /><span>{userProfile.expensesCount ?? 0} Expenses Recorded</span></p>
          <p className="flex items-center space-x-2"><Calendar size={18} className="text-primary" /><span>Member Since: {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}</span></p>
          <p className="flex items-center space-x-2"><Clock size={18} className="text-primary" /><span>Last Login: {userProfile.lastLogin ? new Date(userProfile.lastLogin).toLocaleString() : 'N/A'}</span></p>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-mediumGray dark:text-gray-400">Total Projects</p>
              <p className="text-3xl font-bold text-darkGray dark:text-gray-100">{userProfile.projectsCount ?? 0}</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <Briefcase size={24} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-mediumGray dark:text-gray-400">Total Expenses</p>
              <p className="text-3xl font-bold text-darkGray dark:text-gray-100">{userProfile.expensesCount ?? 0}</p>
            </div>
            <div className="bg-secondary/10 p-3 rounded-full">
              <DollarSign size={24} className="text-secondary" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-mediumGray dark:text-gray-400">Account Status</p>
              <p className="text-2xl font-bold text-green-600">Active</p>
            </div>
            <div className="bg-accent/10 p-3 rounded-full">
              <Activity size={24} className="text-accent" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-mediumGray dark:text-gray-400">Security</p>
              <p className="text-2xl font-bold text-darkGray dark:text-gray-100">{userProfile.twoFAEnabled ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <Shield size={24} className="text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Account Information Section */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md mb-8">
        <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-lightGray/30 dark:bg-gray-700/30 p-4 rounded-lg">
            <h4 className="font-semibold text-darkGray dark:text-gray-100 mb-3 flex items-center">
              <User size={20} className="mr-2 text-primary" />
              Personal Details
            </h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium text-mediumGray dark:text-gray-400">Full Name:</span> <span className="text-darkGray dark:text-gray-100">{userProfile.name}</span></p>
              <p><span className="font-medium text-mediumGray dark:text-gray-400">Email:</span> <span className="text-darkGray dark:text-gray-100">{userProfile.email}</span></p>
              <p><span className="font-medium text-mediumGray dark:text-gray-400">Phone:</span> <span className="text-darkGray dark:text-gray-100">{userProfile.phone || 'N/A'}</span></p>
              <p><span className="font-medium text-mediumGray dark:text-gray-400">Role:</span> <span className="text-darkGray dark:text-gray-100">{userProfile.role}</span></p>
            </div>
          </div>

          <div className="bg-lightGray/30 dark:bg-gray-700/30 p-4 rounded-lg">
            <h4 className="font-semibold text-darkGray dark:text-gray-100 mb-3 flex items-center">
              <Shield size={20} className="mr-2 text-primary" />
              Security & Privacy
            </h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium text-mediumGray dark:text-gray-400">2FA Status:</span> <span className={`font-semibold ${userProfile.twoFAEnabled ? 'text-green-600' : 'text-redError'}`}>{userProfile.twoFAEnabled ? 'Enabled' : 'Disabled'}</span></p>
              <p><span className="font-medium text-mediumGray dark:text-gray-400">Account Status:</span> <span className="text-green-600 font-semibold">Active</span></p>
              <p><span className="font-medium text-mediumGray dark:text-gray-400">Last Login:</span> <span className="text-darkGray dark:text-gray-100">{userProfile.lastLogin ? new Date(userProfile.lastLogin).toLocaleString() : 'N/A'}</span></p>
              <p><span className="font-medium text-mediumGray dark:text-gray-400">Member Since:</span> <span className="text-darkGray dark:text-gray-100">{userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
        <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href={`/profile/edit/${userProfile.id}`} className="flex items-center p-4 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors duration-200">
            <Edit size={20} className="text-primary mr-3" />
            <div>
              <p className="font-semibold text-darkGray dark:text-gray-100">Edit Profile</p>
              <p className="text-xs text-mediumGray dark:text-gray-400">Update your information</p>
            </div>
          </Link>

          <Link href="/settings" className="flex items-center p-4 bg-secondary/10 hover:bg-secondary/20 rounded-lg transition-colors duration-200">
            <Settings size={20} className="text-secondary mr-3" />
            <div>
              <p className="font-semibold text-darkGray dark:text-gray-100">Settings</p>
              <p className="text-xs text-mediumGray dark:text-gray-400">Manage your preferences</p>
            </div>
          </Link>

          <Link href="/projects" className="flex items-center p-4 bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors duration-200">
            <Briefcase size={20} className="text-accent mr-3" />
            <div>
              <p className="font-semibold text-darkGray dark:text-gray-100">My Projects</p>
              <p className="text-xs text-mediumGray dark:text-gray-400">View all your projects</p>
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
