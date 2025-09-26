// app/admin/page.tsx - Admin Tools Dashboard (10000% Design - Global Standard)
'use client';

import React from 'react';
import Link from 'next/link';
import Layout from '../../components/layouts/Layout';
import { 
  ArrowLeft, Shield, Database, Settings, Users, FileText, AlertTriangle, 
  CheckCircle, XCircle, RefreshCw, Download, Upload, Trash2, Edit,
  BarChart, PieChart, LineChart, Activity, Clock, DollarSign, Briefcase,
  Building, CreditCard, Truck, Package, Calendar, Mail, Bell, Search,
  Filter, Plus, Eye, Lock, Unlock, Archive, RotateCcw, Zap, Target
} from 'lucide-react';

export default function AdminToolsPage() {
  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Admin Tools
        </h1>
        <div className="flex space-x-3">
          <button className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center">
            <RefreshCw size={20} className="mr-2" /> Refresh System
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">System Status</h4>
          <p className="text-2xl font-extrabold text-green-600">Online</p>
          <p className="text-sm text-mediumGray dark:text-gray-400 mt-1">All services running</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Database size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Database</h4>
          <p className="text-2xl font-extrabold text-blue-600">Healthy</p>
          <p className="text-sm text-mediumGray dark:text-gray-400 mt-1">No issues detected</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Users size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Active Users</h4>
          <p className="text-2xl font-extrabold text-yellow-600">12</p>
          <p className="text-sm text-mediumGray dark:text-gray-400 mt-1">Currently online</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <div className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Activity size={32} />
          </div>
          <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">API Calls</h4>
          <p className="text-2xl font-extrabold text-purple-600">1,247</p>
          <p className="text-sm text-mediumGray dark:text-gray-400 mt-1">Last 24 hours</p>
        </div>
      </div>

      {/* Admin Tools Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
        
        {/* Data Management */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 p-3 rounded-full mr-4">
              <Database size={24} />
            </div>
            <h3 className="text-xl font-bold text-darkGray dark:text-gray-100">Data Management</h3>
          </div>
          <p className="text-mediumGray dark:text-gray-400 mb-4">Manage and maintain system data integrity.</p>
          <div className="space-y-2">
            <Link href="/admin/check-transactions" className="block p-3 rounded-lg bg-lightGray dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText size={18} className="mr-3 text-primary" />
                  <span className="text-darkGray dark:text-gray-100 font-medium">Check Transactions</span>
                </div>
                <ArrowLeft size={16} className="text-mediumGray dark:text-gray-400 transform rotate-180" />
              </div>
            </Link>
            <Link href="/admin/fix-data" className="block p-3 rounded-lg bg-lightGray dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings size={18} className="mr-3 text-accent" />
                  <span className="text-darkGray dark:text-gray-100 font-medium">Fix Data Issues</span>
                </div>
                <ArrowLeft size={16} className="text-mediumGray dark:text-gray-400 transform rotate-180" />
              </div>
            </Link>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 p-3 rounded-full mr-4">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold text-darkGray dark:text-gray-100">User Management</h3>
          </div>
          <p className="text-mediumGray dark:text-gray-400 mb-4">Manage users, roles, and permissions.</p>
          <div className="space-y-2">
            <Link href="/settings/users" className="block p-3 rounded-lg bg-lightGray dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users size={18} className="mr-3 text-secondary" />
                  <span className="text-darkGray dark:text-gray-100 font-medium">Manage Users</span>
                </div>
                <ArrowLeft size={16} className="text-mediumGray dark:text-gray-400 transform rotate-180" />
              </div>
            </Link>
            <Link href="/settings/company-profile" className="block p-3 rounded-lg bg-lightGray dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building size={18} className="mr-3 text-primary" />
                  <span className="text-darkGray dark:text-gray-100 font-medium">Company Profile</span>
                </div>
                <ArrowLeft size={16} className="text-mediumGray dark:text-gray-400 transform rotate-180" />
              </div>
            </Link>
          </div>
        </div>

        {/* System Monitoring */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200 p-3 rounded-full mr-4">
              <Activity size={24} />
            </div>
            <h3 className="text-xl font-bold text-darkGray dark:text-gray-100">System Monitoring</h3>
          </div>
          <p className="text-mediumGray dark:text-gray-400 mb-4">Monitor system performance and health.</p>
          <div className="space-y-2">
            <Link href="/admin/performance-metrics" className="block p-3 rounded-lg bg-lightGray dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart size={18} className="mr-3 text-accent" />
                  <span className="text-darkGray dark:text-gray-100 font-medium">Performance Metrics</span>
                </div>
                <ArrowLeft size={16} className="text-mediumGray dark:text-gray-400 transform rotate-180" />
              </div>
            </Link>
            <Link href="/admin/error-logs" className="block p-3 rounded-lg bg-lightGray dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle size={18} className="mr-3 text-yellow-600" />
                  <span className="text-darkGray dark:text-gray-100 font-medium">Error Logs</span>
                </div>
                <ArrowLeft size={16} className="text-mediumGray dark:text-gray-400 transform rotate-180" />
              </div>
            </Link>
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <div className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200 p-3 rounded-full mr-4">
              <Download size={24} />
            </div>
            <h3 className="text-xl font-bold text-darkGray dark:text-gray-100">Backup & Restore</h3>
          </div>
          <p className="text-mediumGray dark:text-gray-400 mb-4">Manage data backups and system restore.</p>
          <div className="space-y-2">
            <Link href="/admin/backup-restore" className="block p-3 rounded-lg bg-lightGray dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Download size={18} className="mr-3 text-secondary" />
                  <span className="text-darkGray dark:text-gray-100 font-medium">Backup & Restore</span>
                </div>
                <ArrowLeft size={16} className="text-mediumGray dark:text-gray-400 transform rotate-180" />
              </div>
            </Link>
            <Link href="/admin/backup-restore" className="block p-3 rounded-lg bg-lightGray dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Upload size={18} className="mr-3 text-primary" />
                  <span className="text-darkGray dark:text-gray-100 font-medium">Restore Data</span>
                </div>
                <ArrowLeft size={16} className="text-mediumGray dark:text-gray-400 transform rotate-180" />
              </div>
            </Link>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <div className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200 p-3 rounded-full mr-4">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold text-darkGray dark:text-gray-100">Security</h3>
          </div>
          <p className="text-mediumGray dark:text-gray-400 mb-4">Manage security settings and access control.</p>
          <div className="space-y-2">
            <Link href="/admin/security" className="block p-3 rounded-lg bg-lightGray dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Lock size={18} className="mr-3 text-red-600" />
                  <span className="text-darkGray dark:text-gray-100 font-medium">Security Management</span>
                </div>
                <ArrowLeft size={16} className="text-mediumGray dark:text-gray-400 transform rotate-180" />
              </div>
            </Link>
            <Link href="/admin/security" className="block p-3 rounded-lg bg-lightGray dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity size={18} className="mr-3 text-accent" />
                  <span className="text-darkGray dark:text-gray-100 font-medium">Audit Logs</span>
                </div>
                <ArrowLeft size={16} className="text-mediumGray dark:text-gray-400 transform rotate-180" />
              </div>
            </Link>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <div className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200 p-3 rounded-full mr-4">
              <Settings size={24} />
            </div>
            <h3 className="text-xl font-bold text-darkGray dark:text-gray-100">System Settings</h3>
          </div>
          <p className="text-mediumGray dark:text-gray-400 mb-4">Configure system-wide settings and preferences.</p>
          <div className="space-y-2">
            <Link href="/settings" className="block p-3 rounded-lg bg-lightGray dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings size={18} className="mr-3 text-primary" />
                  <span className="text-darkGray dark:text-gray-100 font-medium">General Settings</span>
                </div>
                <ArrowLeft size={16} className="text-mediumGray dark:text-gray-400 transform rotate-180" />
              </div>
            </Link>
            <Link href="/admin/maintenance" className="block p-3 rounded-lg bg-lightGray dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Zap size={18} className="mr-3 text-yellow-600" />
                  <span className="text-darkGray dark:text-gray-100 font-medium">System Maintenance</span>
                </div>
                <ArrowLeft size={16} className="text-mediumGray dark:text-gray-400 transform rotate-180" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up mt-8">
        <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/live-transactions" className="p-4 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200 flex items-center justify-center">
            <Activity size={20} className="mr-2" />
            Live Transactions
          </Link>
          <button className="p-4 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary hover:text-white transition-colors duration-200 flex items-center justify-center">
            <Database size={20} className="mr-2" />
            Optimize DB
          </button>
          <button className="p-4 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200 flex items-center justify-center">
            <Download size={20} className="mr-2" />
            Export Logs
          </button>
          <button className="p-4 rounded-lg bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors duration-200 flex items-center justify-center">
            <AlertTriangle size={20} className="mr-2" />
            System Check
          </button>
        </div>
      </div>
    </Layout>
  );
}
