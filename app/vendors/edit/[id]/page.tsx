// app/vendors/edit/[id]/page.tsx - Edit Vendor Page (10000% Design - API Integration)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation'; // Import useParams
import Layout from '../../../../components/layouts/Layout';
import { 
  X, Loader2, Info, CheckCircle, User as UserIcon, Building, Mail, Phone, MapPin, MessageSquare, Edit,
  ArrowLeft, Tag, Briefcase as BriefcaseIcon, ChevronRight // Added Tag for vendor type, BriefcaseIcon for products/services, and ChevronRight for dropdown
} from 'lucide-react';
import Toast from '../../../../components/common/Toast'; // Reuse Toast component

export default function EditVendorPage() {
  const router = useRouter();
  const { id } = useParams(); // Get vendor ID from URL
  
  const [name, setName] = useState('');
  const [type, setType] = useState(''); // e.g., "Material", "Labor", "Transport", "Other"
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [productsServices, setProductsServices] = useState(''); // Description of products/services provided
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true); // Set to true for initial fetch
  const [submitting, setSubmitting] = useState(false); // For form submission loading
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const vendorTypes = ['Material', 'Labor', 'Transport', 'Other'];

  // --- Fetch Vendor Details ---
  useEffect(() => {
    const fetchVendorDetails = async () => {
      if (!id) return; // Don't fetch if ID is not available yet

      setLoading(true);
      try {
        const response = await fetch(`/api/vendors/${id}`);
        if (!response.ok) throw new Error('Failed to fetch vendor details');
        const data = await response.json();
        
        // Set form fields with fetched data
        setName(data.vendor.name);
        setType(data.vendor.type);
        setPhone(data.vendor.phone || '');
        setEmail(data.vendor.email || '');
        setAddress(data.vendor.address || '');
        setProductsServices(data.vendor.productsServices || '');
        setNotes(data.vendor.notes || '');

      } catch (error: any) {
        console.error('Error fetching vendor details for edit:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka faahfaahinta iibiyaha la soo gelinayay.', type: 'error' });
        // Redirect if vendor not found or error
        router.push('/vendors'); 
      } finally {
        setLoading(false);
      }
    };
    fetchVendorDetails();
  }, [id, router]); // Re-fetch if ID changes or router updates

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Magaca waa waajib.';
    if (!type) newErrors.type = 'Nooca waa waajib.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Fadlan geli email sax ah.';
    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setValidationErrors({});
    setToastMessage(null);

    if (!validateForm()) {
      setSubmitting(false);
      setToastMessage({ message: 'Fadlan sax khaladaadka foomka.', type: 'error' });
      return;
    }

    try {
      const vendorData = {
        name,
        type,
        phone: phone || null,
        email: email || null,
        address: address || null,
        productsServices: productsServices || null,
        notes: notes || null,
      };

      const response = await fetch(`/api/vendors/${id}`, { // Use PUT method for update
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorData),
      });

      const data = await response.json();

      if (response.ok) {
        setToastMessage({ message: data.message || 'Iibiyaha si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
        router.push(`/vendors/${id}`); // Redirect to vendor details page after update
      } else {
        setToastMessage({ message: data.message || 'Cilad ayaa dhacday marka iibiyaha la cusboonaysiinayay.', type: 'error' });
      }
    } catch (error: any) {
      console.error('Vendor Edit API error:', error);
      setToastMessage({ message: 'Cilad shabakadeed ayaa dhacday. Fadlan isku day mar kale.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Vendor Data...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href={`/vendors/${id}`} className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Edit Iibiye: {name}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vendor Name */}
          <div>
            <label htmlFor="name" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca <span className="text-redError">*</span></label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tusaale: Material Supplier A"
                className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.name ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
              />
            </div>
            {validationErrors.name && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{validationErrors.name}</p>}
          </div>

          {/* Vendor Type */}
          <div>
            <label htmlFor="type" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Iibiyaha <span className="text-redError">*</span></label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.type ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
              >
                <option value="">-- Dooro Nooca Iibiyaha --</option>
                {vendorTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
            </div>
            {validationErrors.type && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{validationErrors.type}</p>}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Email (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tusaale@ganacsi.com"
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.email ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {validationErrors.email && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{validationErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taleefan (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="063-XXXXXXX"
                  className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Cinwaan (Optional)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Wadada 1, Guriga 20, Hargeisa"
                className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
              ></textarea>
            </div>
          </div>

          {/* Products/Services */}
          <div>
            <label htmlFor="productsServices" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Adeegyada/Alaabta Ay Bixiyaan (Optional)</label>
            <div className="relative">
              <BriefcaseIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <textarea
                id="productsServices"
                value={productsServices}
                onChange={(e) => setProductsServices(e.target.value)}
                rows={2}
                placeholder="Tusaale: Qoryaha, Biraha, Adeegyada Gaadiidka"
                className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
              ></textarea>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Fiiro Gaar Ah (Optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Wixii faahfaahin dheeraad ah ee iibiyaha..."
              className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105 flex items-center justify-center"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <Edit className="mr-2" size={20} />
            )}
            {submitting ? 'Cusboonaysiinaya Iibiye...' : 'Cusboonaysii Iibiye'}
          </button>
        </form>
      </div>
      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
