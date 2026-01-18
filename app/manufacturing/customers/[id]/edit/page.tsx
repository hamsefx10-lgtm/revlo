'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, User, Building, Phone, Mail, MapPin } from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function EditCustomerPage() {
    const router = useRouter();
    const params = useParams();
    const customerId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        address: '',
        type: 'Business',
        contactPerson: '',
        notes: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/manufacturing/customers/${customerId}`);
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        name: data.customer.name || '',
                        companyName: data.customer.companyName || '',
                        email: data.customer.email || '',
                        phone: data.customer.phone || '', // Using 'phone' as per our API, note Schema has both 'phone' and 'phoneNumber', API maps it.
                        address: data.customer.address || '',
                        type: data.customer.type || 'Business',
                        contactPerson: data.customer.contactPerson || '',
                        notes: data.customer.notes || ''
                    });
                }
            } catch (e) {
                console.error(e);
                setToast({ message: 'Failed to load customer data', type: 'error' });
            } finally {
                setDataLoading(false);
            }
        };
        fetchData();
    }, [customerId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.name) {
            setToast({ message: 'Please enter a customer name.', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/manufacturing/customers/${customerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to update customer');

            setToast({ message: 'Customer updated successfully!', type: 'success' });
            setTimeout(() => router.push(`/manufacturing/customers/${customerId}`), 1000);

        } catch (error) {
            setToast({ message: 'Error updating customer.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (dataLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-[#3498DB]" size={32} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20">

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/manufacturing/customers/${customerId}`} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Edit Customer</h1>
                    <p className="text-sm font-medium text-gray-500">Update client details</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto w-full">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-8">

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Primary Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Customer Name *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="e.g. John Doe"
                                        className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[#3498DB] outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Company Name</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                                        placeholder="e.g. Acme Corp"
                                        className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[#3498DB] outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Customer Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => handleInputChange('type', e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[#3498DB] outline-none"
                            >
                                <option value="Business">Business (B2B)</option>
                                <option value="Individual">Individual (B2C)</option>
                                <option value="Distributor">Distributor</option>
                                <option value="Government">Government</option>
                            </select>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Contact Details</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        placeholder="+252..."
                                        className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[#3498DB] outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        placeholder="john@example.com"
                                        className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[#3498DB] outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Address / Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    placeholder="Street, City, Region"
                                    className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[#3498DB] outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Additional Notes</h3>
                        </div>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder="Any specific delivery instructions or notes..."
                            className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[#3498DB] outline-none min-h-[100px]"
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 bg-[#3498DB] hover:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            Update Customer
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-8 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                    </div>

                </form>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
