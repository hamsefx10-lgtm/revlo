// app/profile/page.tsx - My Profile Page (Current User)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/layouts/Layout';
import { User, Mail, Phone, Building, Briefcase, Settings, Edit, Loader2, DollarSign, Calendar, Clock } from 'lucide-react';

export default function MyProfilePage() {
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
      })
      .finally(() => setLoading(false));
  }, []);

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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">My Profile</h1>
        <Link href={`/profile/edit/${userProfile.id}`} className="bg-accent text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-orange-600 transition duration-200 shadow-md flex items-center">
          <Edit size={20} className="mr-2" /> Edit Profile
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md mb-8 animate-fade-in-up">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 mb-6 pb-6 border-b border-lightGray dark:border-gray-700">
          <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-white text-6xl font-bold flex-shrink-0 border-4 border-primary/50 shadow-lg">
            {userProfile.avatarChar || (userProfile.name ? userProfile.name[0] : '?')}
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-4xl font-bold text-darkGray dark:text-gray-100 mb-2">{userProfile.name}</h3>
            <p className="text-xl text-mediumGray dark:text-gray-400 mb-1 flex items-center justify-center md:justify-start space-x-2">
                <User size={20} className="text-primary"/> <span>{userProfile.role}</span>
            </p>
            <p className="text-xl text-mediumGray dark:text-gray-400 mb-1 flex items-center justify-center md:justify-start space-x-2">
                <Building size={20} className="text-primary"/> <span>{userProfile.companyName}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-darkGray dark:text-gray-100">
            <p className="flex items-center space-x-2"><Mail size={18} className="text-primary"/><span>{userProfile.email}</span></p>
            <p className="flex items-center space-x-2"><Phone size={18} className="text-primary"/><span>{userProfile.phone || 'N/A'}</span></p>
            <p className="flex items-center space-x-2"><Briefcase size={18} className="text-primary"/><span>{userProfile.projectsCount ?? 0} Projects</span></p>
            <p className="flex items-center space-x-2"><DollarSign size={18} className="text-primary"/><span>{userProfile.expensesCount ?? 0} Expenses Recorded</span></p>
            <p className="flex items-center space-x-2"><Calendar size={18} className="text-primary"/><span>Member Since: {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}</span></p>
            <p className="flex items-center space-x-2"><Clock size={18} className="text-primary"/><span>Last Login: {userProfile.lastLogin ? new Date(userProfile.lastLogin).toLocaleString() : 'N/A'}</span></p>
        </div>
      </div>

      {/* User Activity (Placeholder for future content) */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up">
        <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Recent Activity</h3>
        <p className="text-mediumGray dark:text-gray-400">User-ka dhaqdhaqaaqa ugu dambeeyay wuxuu halkan ku jiri doonaa...</p>
      </div>
    </Layout>
  );
}
