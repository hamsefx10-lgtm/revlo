'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import {
  ArrowLeft, Shield, Lock, Unlock, Users, Eye, EyeOff, Key, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, Settings, Activity, Clock, Database,
  Server, FileText, Download, Upload, Trash2, Edit, Plus, Search, Filter
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: Date;
  loginCount: number;
  permissions: string[];
  createdAt: Date;
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'permission_denied' | 'data_access' | 'system_change';
  description: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'resolved' | 'pending' | 'investigating';
}

interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // days
  };
  sessionSettings: {
    timeout: number; // minutes
    maxConcurrentSessions: number;
    requireReauth: boolean;
  };
  accessControl: {
    ipWhitelist: string[];
    ipBlacklist: string[];
    requireMFA: boolean;
    allowedCountries: string[];
  };
  auditLogging: {
    enabled: boolean;
    retentionDays: number;
    logLevel: 'basic' | 'detailed' | 'comprehensive';
  };
}

export default function SecurityPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [settings, setSettings] = useState<SecuritySettings>({
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90
    },
    sessionSettings: {
      timeout: 30,
      maxConcurrentSessions: 3,
      requireReauth: false
    },
    accessControl: {
      ipWhitelist: [],
      ipBlacklist: [],
      requireMFA: false,
      allowedCountries: []
    },
    auditLogging: {
      enabled: true,
      retentionDays: 365,
      logLevel: 'detailed'
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'events' | 'settings'>('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const [usersRes, eventsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/security/users'),
        fetch('/api/admin/security/events'),
        fetch('/api/admin/security/settings')
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setSecurityEvents(eventsData.events || []);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData.settings || settings);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/security/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        fetchSecurityData();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const resetUserPassword = async (userId: string) => {
    if (!confirm('Are you sure you want to reset this user\'s password?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/security/users/${userId}/reset-password`, {
        method: 'POST'
      });
      
      if (res.ok) {
        alert('Password reset email sent to user');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  const updateSecuritySettings = async () => {
    try {
      const res = await fetch('/api/admin/security/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (res.ok) {
        setShowSettingsModal(false);
        alert('Security settings updated successfully');
      }
    } catch (error) {
      console.error('Error updating security settings:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'MANAGER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'USER': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/admin" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Security Management
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="bg-secondary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-green-700 transition duration-200 shadow-md flex items-center"
          >
            <Settings size={20} className="mr-2" />
            Security Settings
          </button>
          <button
            onClick={fetchSecurityData}
            disabled={loading}
            className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center disabled:opacity-50"
          >
            <RefreshCw size={20} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Users size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Total Users</h4>
          <p className="text-2xl font-extrabold text-blue-600">{users.length}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Active Users</h4>
          <p className="text-2xl font-extrabold text-green-600">
            {users.filter(u => u.status === 'active').length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Security Events</h4>
          <p className="text-2xl font-extrabold text-red-600">{securityEvents.length}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Shield size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">High Risk Events</h4>
          <p className="text-2xl font-extrabold text-yellow-600">
            {securityEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6">
        <div className="border-b border-lightGray dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'users', label: 'Users', icon: Users },
              { id: 'events', label: 'Security Events', icon: Activity },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-300'
                }`}
              >
                <tab.icon size={20} className="mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <div className="p-6 border-b border-lightGray dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">
                User Management ({filteredUsers.length})
              </h3>
              <button
                onClick={() => setShowUserModal(true)}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Add User
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="USER">User</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw size={32} className="animate-spin text-primary mx-auto mb-4" />
              <p className="text-mediumGray dark:text-gray-400">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                <thead className="bg-lightGray dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                      Login Count
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-darkGray dark:text-gray-100">
                            {user.name}
                          </div>
                          <div className="text-sm text-mediumGray dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                          {user.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-mediumGray dark:text-gray-300">
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-darkGray dark:text-gray-100">
                        {user.loginCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => toggleUserStatus(user.id, user.status)}
                            className={`${
                              user.status === 'active' 
                                ? 'text-red-600 hover:text-red-700' 
                                : 'text-green-600 hover:text-green-700'
                            } transition-colors`}
                            title={user.status === 'active' ? 'Suspend User' : 'Activate User'}
                          >
                            {user.status === 'active' ? <Lock size={16} /> : <Unlock size={16} />}
                          </button>
                          <button
                            onClick={() => resetUserPassword(user.id)}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="Reset Password"
                          >
                            <Key size={16} />
                          </button>
                          <button
                            onClick={() => { setSelectedUser(user); setShowUserModal(true); }}
                            className="text-gray-600 hover:text-gray-700 transition-colors"
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Security Events Tab */}
      {activeTab === 'events' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <div className="p-6 border-b border-lightGray dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">
                Security Events ({filteredEvents.length})
              </h3>
            </div>
            
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw size={32} className="animate-spin text-primary mx-auto mb-4" />
              <p className="text-mediumGray dark:text-gray-400">Loading security events...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                <thead className="bg-lightGray dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-darkGray dark:text-gray-100">
                            {event.type.replace('_', ' ').toUpperCase()}
                          </div>
                          <div className="text-sm text-mediumGray dark:text-gray-400">
                            {event.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-darkGray dark:text-gray-100">
                          {event.userEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-mediumGray dark:text-gray-300">
                        {event.ipAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(event.severity)}`}>
                          {event.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-mediumGray dark:text-gray-300">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          event.status === 'resolved' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                            : event.status === 'investigating'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                        }`}>
                          {event.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-6">
            Security Settings
          </h3>
          
          <div className="space-y-8">
            {/* Password Policy */}
            <div>
              <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4">
                Password Policy
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                    Minimum Length
                  </label>
                  <input
                    type="number"
                    value={settings.passwordPolicy.minLength}
                    onChange={(e) => setSettings({
                      ...settings,
                      passwordPolicy: { ...settings.passwordPolicy, minLength: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                    Max Age (days)
                  </label>
                  <input
                    type="number"
                    value={settings.passwordPolicy.maxAge}
                    onChange={(e) => setSettings({
                      ...settings,
                      passwordPolicy: { ...settings.passwordPolicy, maxAge: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                {[
                  { key: 'requireUppercase', label: 'Require Uppercase Letters' },
                  { key: 'requireLowercase', label: 'Require Lowercase Letters' },
                  { key: 'requireNumbers', label: 'Require Numbers' },
                  { key: 'requireSpecialChars', label: 'Require Special Characters' }
                ].map((req) => (
                  <label key={req.key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.passwordPolicy[req.key as keyof typeof settings.passwordPolicy] as boolean}
                      onChange={(e) => setSettings({
                        ...settings,
                        passwordPolicy: { ...settings.passwordPolicy, [req.key]: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-darkGray dark:text-gray-100">{req.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Session Settings */}
            <div>
              <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4">
                Session Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.sessionSettings.timeout}
                    onChange={(e) => setSettings({
                      ...settings,
                      sessionSettings: { ...settings.sessionSettings, timeout: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                    Max Concurrent Sessions
                  </label>
                  <input
                    type="number"
                    value={settings.sessionSettings.maxConcurrentSessions}
                    onChange={(e) => setSettings({
                      ...settings,
                      sessionSettings: { ...settings.sessionSettings, maxConcurrentSessions: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.sessionSettings.requireReauth}
                    onChange={(e) => setSettings({
                      ...settings,
                      sessionSettings: { ...settings.sessionSettings, requireReauth: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-darkGray dark:text-gray-100">Require Re-authentication for Sensitive Operations</span>
                </label>
              </div>
            </div>

            {/* Access Control */}
            <div>
              <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4">
                Access Control
              </h4>
              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.accessControl.requireMFA}
                    onChange={(e) => setSettings({
                      ...settings,
                      accessControl: { ...settings.accessControl, requireMFA: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-darkGray dark:text-gray-100">Require Multi-Factor Authentication</span>
                </label>
                
                <div>
                  <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                    IP Whitelist (one per line)
                  </label>
                  <textarea
                    value={settings.accessControl.ipWhitelist.join('\n')}
                    onChange={(e) => setSettings({
                      ...settings,
                      accessControl: { ...settings.accessControl, ipWhitelist: e.target.value.split('\n').filter(ip => ip.trim()) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={3}
                    placeholder="192.168.1.1&#10;10.0.0.1"
                  />
                </div>
              </div>
            </div>

            {/* Audit Logging */}
            <div>
              <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4">
                Audit Logging
              </h4>
              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.auditLogging.enabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      auditLogging: { ...settings.auditLogging, enabled: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-darkGray dark:text-gray-100">Enable Audit Logging</span>
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                      Retention Period (days)
                    </label>
                    <input
                      type="number"
                      value={settings.auditLogging.retentionDays}
                      onChange={(e) => setSettings({
                        ...settings,
                        auditLogging: { ...settings.auditLogging, retentionDays: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                      Log Level
                    </label>
                    <select
                      value={settings.auditLogging.logLevel}
                      onChange={(e) => setSettings({
                        ...settings,
                        auditLogging: { ...settings.auditLogging, logLevel: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="basic">Basic</option>
                      <option value="detailed">Detailed</option>
                      <option value="comprehensive">Comprehensive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-lightGray dark:border-gray-700">
              <button
                onClick={updateSecuritySettings}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Settings size={16} className="mr-2" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
