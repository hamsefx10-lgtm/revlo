
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import Layout from '../../../components/layouts/Layout';
import {
    ArrowLeft, Building, Plus, Search, Filter, MoreVertical,
    Edit, Trash2, Users, Briefcase, Calendar, CheckCircle, XCircle,
    Loader2, Globe
} from 'lucide-react';
import Toast from '../../../components/common/Toast';

interface Company {
    id: string;
    name: string;
    planType: string;
    industry: string | null;
    status: string;
    usersCount: number;
    projectsCount: number;
    createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CompaniesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCompany, setNewCompany] = useState({
        name: '',
        industry: '',
        planType: 'COMBINED',
        email: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Fetch Companies
    const { data, error, isLoading, mutate } = useSWR(
        `/api/admin/companies?search=${searchTerm}`,
        fetcher
    );

    const companies: Company[] = data?.companies || [];

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/admin/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCompany)
            });

            const result = await res.json();

            if (result.success) {
                setToast({ message: 'Company created successfully!', type: 'success' });
                setShowCreateModal(false);
                setNewCompany({ name: '', industry: '', planType: 'COMBINED', email: '' });
                mutate(); // Refresh list
            } else {
                setToast({ message: result.message || 'Failed to create company', type: 'error' });
            }
        } catch (err: any) {
            setToast({ message: err.message || 'An error occurred', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCompany = async (id: string) => {
        if (!confirm('Are you sure? This is a destructive action.')) return;

        try {
            const res = await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' });
            const result = await res.json();

            if (result.success) {
                setToast({ message: 'Company deleted.', type: 'success' });
                mutate();
            } else {
                setToast({ message: result.message || 'Delete failed', type: 'error' });
            }
        } catch (err: any) {
            setToast({ message: 'Error deleting company', type: 'error' });
        }
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
                    <Link href="/admin" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
                        <ArrowLeft size={28} className="inline-block" />
                    </Link>
                    Company Management
                </h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center"
                >
                    <Plus size={20} className="mr-2" />
                    Add Company
                </button>
            </div>

            {/* Search & Filter */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search companies by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-lightGray dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                    />
                </div>
                <div className="flex gap-2">
                    {/* Filter buttons could go here */}
                </div>
            </div>

            {/* Companies List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="animate-spin text-primary mx-auto mb-4" size={32} />
                        <p className="text-gray-500">Loading companies...</p>
                    </div>
                ) : companies.length === 0 ? (
                    <div className="p-12 text-center">
                        <Building className="text-gray-300 mx-auto mb-4" size={48} />
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No Companies Found</h3>
                        <p className="text-gray-500 mt-2">Get started by adding your first tenant.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {companies.map((company) => (
                                    <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                                    <Building className="text-blue-600" size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{company.name}</div>
                                                    <div className="text-xs text-gray-500">{company.industry || 'No industry'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {company.planType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1" title="Users">
                                                    <Users size={14} /> {company.usersCount}
                                                </span>
                                                <span className="flex items-center gap-1" title="Projects">
                                                    <Briefcase size={14} /> {company.projectsCount}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(company.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                {/* <button className="text-indigo-600 hover:text-indigo-900"><Edit size={18} /></button> */}
                                                <button
                                                    onClick={() => handleDeleteCompany(company.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete Company"
                                                >
                                                    <Trash2 size={18} />
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

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Company</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCompany} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name *</label>
                                <input
                                    required
                                    type="text"
                                    value={newCompany.name}
                                    onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="e.g. Acme Construction"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Items of Business (Industry)</label>
                                <input
                                    type="text"
                                    value={newCompany.industry}
                                    onChange={e => setNewCompany({ ...newCompany, industry: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="e.g. General Construction"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Type</label>
                                <select
                                    value={newCompany.planType}
                                    onChange={e => setNewCompany({ ...newCompany, planType: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="PROJECTS_ONLY">Projects Only</option>
                                    <option value="FACTORIES_ONLY">Factories Only</option>
                                    <option value="SHOPS_ONLY">Shops Only</option>
                                    <option value="COMBINED">Combined (All Features)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Email (Optional)</label>
                                <input
                                    type="email"
                                    value={newCompany.email}
                                    onChange={e => setNewCompany({ ...newCompany, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="admin@company.com"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                                >
                                    {isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
                                    Create Company
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </Layout>
    );
}
