// app/customers/edit/[id]/page.tsx - Edit Customer Page (10000% Design - API Integration)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation'; // Import useParams
import Layout from '../../../../components/layouts/Layout';
import { 
  X, Loader2, Info, CheckCircle, User as UserIcon, Building, Mail, Phone, MapPin, MessageSquare, Edit,
  ArrowLeft // For back button
} from 'lucide-react';
import Toast from '../../../../components/common/Toast'; // Reuse Toast component

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = useParams(); // Get customer ID from URL
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'Individual' | 'Company'>('Individual');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true); // Set to true for initial fetch
  const [submitting, setSubmitting] = useState(false); // For form submission loading
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- Fetch Customer Details ---
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!id) return; // Don't fetch if ID is not available yet

      setLoading(true);
      try {
        const response = await fetch(`/api/customers/${id}`);
        if (!response.ok) throw new Error('Failed to fetch customer details');
        const data = await response.json();
        
        // Set form fields with fetched data
        setName(data.customer.name);
        setType(data.customer.type);
        setCompanyName(data.customer.companyName || '');
        setPhone(data.customer.phone || '');
        setEmail(data.customer.email || '');
        setAddress(data.customer.address || '');
        setNotes(data.customer.notes || '');

      } catch (error: any) {
        console.error('Error fetching customer details for edit:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka faahfaahinta macmiilka la soo gelinayay.', type: 'error' });
        // Redirect if customer not found or error
        router.push('/customers'); 
      } finally {
        setLoading(false);
      }
    };
    fetchCustomerDetails();
  }, [id, router]); // Re-fetch if ID changes or router updates

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Magaca waa waajib.';
    if (!type) newErrors.type = 'Nooca waa waajib.';
    if (type === 'Company' && !companyName.trim()) newErrors.companyName = 'Magaca shirkadda waa waajib haddii nooca uu yahay "Company".';
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
      const customerData = {
        name,
        type,
        companyName: type === 'Company' ? companyName : null, 
        phone: phone || null,
        email: email || null,
        address: address || null,
        notes: notes || null,
      };

      const response = await fetch(`/api/customers/${id}`, { // Use PUT method for update
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });

      const data = await response.json();

      if (response.ok) {
        setToastMessage({ message: data.message || 'Macmiilka si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
        router.push(`/customers/${id}`); // Redirect to customer details page after update
      } else {
        setToastMessage({ message: data.message || 'Cilad ayaa dhacday marka macmiilka la cusboonaysiinayay.', type: 'error' });
      }
    } catch (error: any) {
      console.error('Customer Edit API error:', error);
      setToastMessage({ message: 'Cilad shabakadeed ayaa dhacday. Fadlan isku day mar kale.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Customer Data...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href={`/customers/${id}`} className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Edit Macmiil: {name}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Type */}
          <div>
            <label htmlFor="type" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Macmiilka <span className="text-redError">*</span></label>
            <div className="flex space-x-3">
              <button 
                type="button" 
                onClick={() => setType('Individual')} 
                className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${type === 'Individual' ? 'bg-primary text-white border-primary' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 border-lightGray dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                <UserIcon size={20}/> <span>Shakhsi</span>
              </button>
              <button 
                type="button" 
                onClick={() => setType('Company')} 
                className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${type === 'Company' ? 'bg-primary text-white border-primary' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 border-lightGray dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                <Building size={20}/> <span>Shirkad</span>
              </button>
            </div>
            {validationErrors.type && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{validationErrors.type}</p>}
          </div>

          {/* Customer Name */}
          <div>
            <label htmlFor="name" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca <span className="text-redError">*</span></label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'Individual' ? "Tusaale: Axmed Maxamed" : "Tusaale: Client X Furniture Co."}
                className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.name ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
              />
            </div>
            {validationErrors.name && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{validationErrors.name}</p>}
          </div>

          {/* Company Name (Conditional) */}
          {type === 'Company' && (
            <div className="animate-fade-in">
              <label htmlFor="companyName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Shirkadda <span className="text-redError">*</span></label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="text"
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Tusaale: My Furniture Co."
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.companyName ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {validationErrors.companyName && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{validationErrors.companyName}</p>}
            </div>
          )}

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

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Fiiro Gaar Ah (Optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Wixii faahfaahin dheeraad ah ee macmiilka..."
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
            {submitting ? 'Cusboonaysiinaya Macmiil...' : 'Cusboonaysii Macmiil'}
          </button>
        </form>
      </div>
      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
