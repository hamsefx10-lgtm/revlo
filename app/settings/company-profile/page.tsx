'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import {
  ArrowLeft, Building, Edit, Save, X, Loader2, Info,
  Mail, Phone, MapPin, Globe, ClipboardList, CheckCircle, Calendar, FileText
} from 'lucide-react';
import Toast from '../../../components/common/Toast';

export default function CompanyProfileSettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form states for editing
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editTaxId, setEditTaxId] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');

  // Fetch company profile from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/settings/company');
        const data = await res.json();
        if (res.ok && data.company) {
          setProfile(data.company);
          setEditName(data.company.name || '');
          setEditEmail(data.company.email || '');
          setEditPhone(data.company.phone || '');
          setEditAddress(data.company.address || '');
          setEditWebsite(data.company.website || '');
          setEditIndustry(data.company.industry || '');
          setEditTaxId(data.company.taxId || '');
          setEditLogoUrl(data.company.logoUrl || '');
        } else {
          setToastMessage({ message: data.message || 'Profile-ka shirkadda lama helin.', type: 'error' });
        }
      } catch (error) {
        setToastMessage({ message: 'Cilad ayaa dhacday marka profile-ka la soo gelinayay.', type: 'error' });
      }
    };
    fetchProfile();
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!editName.trim()) newErrors.name = 'Magaca shirkadda waa waajib.';
    if (!editEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) newErrors.email = 'Email sax ah waa waajib.';
    if (editPhone.trim() && !/^\d+$/.test(editPhone.replace(/-/g, ''))) newErrors.phone = 'Taleefanku waa inuu lambarro kaliya ka koobnaadaa.';
    if (!editIndustry.trim()) newErrors.industry = 'Warshaddu waa waajib.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setToastMessage({ message: 'Fadlan sax khaladaadka foomka.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
          address: editAddress,
          website: editWebsite,
          industry: editIndustry,
          taxId: editTaxId,
          logoUrl: editLogoUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.company);
        setToastMessage({ message: data.message || 'Macluumaadka shirkadda waa la cusboonaysiiyay!', type: 'success' });
        setIsEditing(false);
      } else {
        setToastMessage({ message: data.message || 'Cilad ayaa dhacday marka la cusboonaysiinayay profile-ka.', type: 'error' });
      }
    } catch (error) {
      setToastMessage({ message: 'Cilad ayaa dhacday marka la cusboonaysiinayay profile-ka.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setEditName(profile.name || '');
      setEditEmail(profile.email || '');
      setEditPhone(profile.phone || '');
      setEditAddress(profile.address || '');
      setEditWebsite(profile.website || '');
      setEditIndustry(profile.industry || '');
      setEditTaxId(profile.taxId || '');
    }
    setErrors({});
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/uploads/company-logo', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setToastMessage({ message: data.message || 'Logo upload failed.', type: 'error' });
        return;
      }
      setEditLogoUrl(data.url);
      setProfile((prev: any) => ({ ...prev, logoUrl: data.url }));
      setToastMessage({ message: 'Logo-ga waa la cusboonaysiiyay.', type: 'success' });
    } catch (error) {
      setToastMessage({ message: 'Cilad ayaa dhacday marka logo la soo gelinayay.', type: 'error' });
    } finally {
      setLogoUploading(false);
      event.target.value = '';
    }
  };

  if (!profile) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="animate-spin mr-2" size={28} />
          <span>Profile-ka shirkadda waa la soo gelinayaa...</span>
        </div>
        {toastMessage && (
          <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
        )}
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/settings" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Company Profile
        </h1>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center">
            <Edit size={20} className="mr-2" /> Wax ka Beddel
          </button>
        ) : (
          <div className="flex space-x-3">
            <button onClick={handleCancel} className="bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 py-2 px-4 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition">
              <X size={20} className="mr-2" /> Jooji
            </button>
            <button onClick={handleSave} className="bg-secondary text-white py-2 px-4 rounded-lg font-bold hover:bg-green-600 transition duration-200 shadow-md flex items-center" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save size={20} className="mr-2" />} Badbaadi
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md mb-8 animate-fade-in-up">
        {/* Company Logo and Basic Info */}
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 mb-6 pb-6 border-b border-lightGray dark:border-gray-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={profile.logoUrl || 'https://placehold.co/120x120/3498DB/FFFFFF?text=LOGO'} alt={`${profile.name} Logo`} className="w-28 h-28 rounded-full object-cover border-4 border-primary/50 shadow-lg flex-shrink-0" />
          {isEditing && (
            <div className="text-center md:text-left">
              <label className="block text-sm font-semibold text-darkGray dark:text-gray-200 mb-2">Logo Shirkadda</label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <label className="cursor-pointer bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center">
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                  {logoUploading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Soo raraya...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Upload Logo
                    </>
                  )}
                </label>
                {editLogoUrl && <span className="text-xs text-mediumGray dark:text-gray-400 truncate max-w-[200px]">{editLogoUrl}</span>}
              </div>
              <p className="text-xs text-mediumGray dark:text-gray-400 mt-2">Faylasha la ogol yahay: PNG, JPG, WEBP, SVG (max 4MB)</p>
            </div>
          )}
          <div className="text-center md:text-left flex-1">
            <h3 className="text-4xl font-bold text-darkGray dark:text-gray-100 mb-2">{profile.name}</h3>
            <p className="text-lg text-mediumGray dark:text-gray-400 mb-1 flex items-center justify-center md:justify-start space-x-2">
              <Building size={20} className="text-primary" /> <span>{profile.industry}</span>
            </p>
            <p className="text-sm text-mediumGray dark:text-gray-400 flex items-center justify-center md:justify-start space-x-2">
              <Calendar size={16} className="text-primary" /> <span>Diiwaan Gashan: {profile.registrationDate ? new Date(profile.registrationDate).toLocaleDateString() : 'N/A'}</span>
            </p>
          </div>
        </div>

        {/* Company Details Form / Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label htmlFor="companyName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Shirkadda <span className="text-redError">*</span></label>
            {isEditing ? (
              <input type="text" id="companyName" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Magaca Shirkadda" className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${errors.name ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`} />
            ) : (
              <p className="p-3 bg-lightGray dark:bg-gray-700 rounded-lg text-darkGray dark:text-gray-100 flex items-center space-x-2"><Building size={20} className="text-primary" /><span>{profile.name}</span></p>
            )}
            {errors.name && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1" />{errors.name}</p>}
          </div>
          {/* Email */}
          <div>
            <label htmlFor="companyEmail" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Email <span className="text-redError">*</span></label>
            {isEditing ? (
              <input type="email" id="companyEmail" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="info@example.com" className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${errors.email ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`} />
            ) : (
              <p className="p-3 bg-lightGray dark:bg-gray-700 rounded-lg text-darkGray dark:text-gray-100 flex items-center space-x-2"><Mail size={20} className="text-primary" /><span>{profile.email}</span></p>
            )}
            {errors.email && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1" />{errors.email}</p>}
          </div>
          {/* Phone */}
          <div>
            <label htmlFor="companyPhone" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taleefan</label>
            {isEditing ? (
              <input type="tel" id="companyPhone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="063-XXXXXXX" className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${errors.phone ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`} />
            ) : (
              <p className="p-3 bg-lightGray dark:bg-gray-700 rounded-lg text-darkGray dark:text-gray-100 flex items-center space-x-2"><Phone size={20} className="text-primary" /><span>{profile.phone || 'N/A'}</span></p>
            )}
            {errors.phone && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1" />{errors.phone}</p>}
          </div>
          {/* Address */}
          <div>
            <label htmlFor="companyAddress" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Cinwaan</label>
            {isEditing ? (
              <textarea id="companyAddress" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} rows={3} placeholder="Wadada 1, Guriga 20, Hargeisa" className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary"></textarea>
            ) : (
              <p className="p-3 bg-lightGray dark:bg-gray-700 rounded-lg text-darkGray dark:text-gray-100 flex items-center space-x-2"><MapPin size={20} className="text-primary" /><span>{profile.address || 'N/A'}</span></p>
            )}
          </div>
          {/* Website */}
          <div>
            <label htmlFor="companyWebsite" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Website</label>
            {isEditing ? (
              <input type="url" id="companyWebsite" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="https://www.example.com" className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary" />
            ) : (
              <p className="p-3 bg-lightGray dark:bg-gray-700 rounded-lg text-darkGray dark:text-gray-100 flex items-center space-x-2"><Globe size={20} className="text-primary" /><span>{profile.website || 'N/A'}</span></p>
            )}
          </div>
          {/* Industry */}
          <div>
            <label htmlFor="companyIndustry" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Warshad <span className="text-redError">*</span></label>
            {isEditing ? (
              <input type="text" id="companyIndustry" value={editIndustry} onChange={(e) => setEditIndustry(e.target.value)} placeholder="Tusaale: Furniture Manufacturing" className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${errors.industry ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`} />
            ) : (
              <p className="p-3 bg-lightGray dark:bg-gray-700 rounded-lg text-darkGray dark:text-gray-100 flex items-center space-x-2"><ClipboardList size={20} className="text-primary" /><span>{profile.industry}</span></p>
            )}
            {errors.industry && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1" />{errors.industry}</p>}
          </div>
          {/* Tax ID */}
          <div>
            <label htmlFor="companyTaxId" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Aqoonsiga Canshuurta (TIN)</label>
            {isEditing ? (
              <input type="text" id="companyTaxId" value={editTaxId} onChange={(e) => setEditTaxId(e.target.value)} placeholder="Tusaale: REVLO-TIN-12345" className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary" />
            ) : (
              <p className="p-3 bg-lightGray dark:bg-gray-700 rounded-lg text-darkGray dark:text-gray-100 flex items-center space-x-2"><FileText size={20} className="text-primary" /><span>{profile.taxId || 'N/A'}</span></p>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log / Recent Activity (Placeholder) */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up">
        <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Diiwaanka Dhaqdhaqaaqa Dhawaan</h3>
        <p className="text-mediumGray dark:text-gray-400">Dhammaan isbeddelada lagu sameeyay profile-ka shirkadda ayaa halkan ka muuqan doona.</p>
        <ul className="mt-4 space-y-2 text-mediumGray dark:text-gray-400 text-sm">
          <li className="flex items-center space-x-2"><CheckCircle size={16} className="text-secondary" /><span>Profile-ka la cusboonaysiiyay - Axmed Cali (2025-07-24)</span></li>
          <li className="flex items-center space-x-2"><CheckCircle size={16} className="text-secondary" /><span>Magaca shirkadda la beddelay - Faadumo Maxamed (2025-06-15)</span></li>
        </ul>
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}