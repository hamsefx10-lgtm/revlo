// app/projects/edit/[id]/page.tsx - Edit Project Page (MATCHING ADD PAGE DESIGN)
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../../../components/layouts/Layout';
import Toast from '../../../../components/common/Toast';
import { 
    Loader2, ArrowLeft, AlertTriangle, Save, X, FileText, User, DollarSign, 
    Tag, Calendar, Activity, Pencil 
} from 'lucide-react';

const EditProjectPage: React.FC = () => {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [project, setProject] = useState<any>(null);
    const [customers, setCustomers] = useState<any[]>([]);
    const [form, setForm] = useState<any>({});
    const [errors, setErrors] = useState<any>({});
    const [toastMessage, setToastMessage] = useState<any>(null);

    useEffect(() => {
        if (id) {
            fetchProject();
            fetchCustomers();
        }
    }, [id]);

    // --- Data Fetching & Submission Logic (No Changes) ---
    const fetchProject = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/projects/${id}`);
            const data = await res.json();
            if (res.ok) {
                setProject(data.project);
                setForm({
                    name: data.project.name,
                    description: data.project.description || '',
                    agreementAmount: data.project.agreementAmount,
                    advancePaid: data.project.advancePaid,
                    projectType: data.project.projectType,
                    expectedCompletionDate: data.project.expectedCompletionDate?.slice(0, 10) || '',
                    actualCompletionDate: data.project.actualCompletionDate?.slice(0, 10) || '',
                    notes: data.project.notes || '',
                    customerId: data.project.customer.id,
                    status: data.project.status,
                });
            } else {
                setToastMessage({ message: data.message || 'Project not found', type: 'error' });
            }
        } catch (e) {
            setToastMessage({ message: 'Error fetching project data.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/customers');
            const data = await res.json();
            if (res.ok) setCustomers(data.customers);
        } catch {}
    };

    const validate = () => {
        const errs: any = {};
        if (!form.name?.trim()) errs.name = 'Magaca mashruuca waa loo baahan yahay.';
        if (!form.agreementAmount || isNaN(form.agreementAmount) || form.agreementAmount <= 0) errs.agreementAmount = 'Qiimaha heshiiska waa qasab.';
        if (form.advancePaid < 0 || form.advancePaid === '' || form.advancePaid === null) errs.advancePaid = 'Horumarisku waa inuu ahaadaa eber ama ka badan.';
        if (parseFloat(form.advancePaid) > parseFloat(form.agreementAmount)) errs.advancePaid = 'Horumarisku kama badnaan karo qiimaha guud.';
        if (!form.projectType?.trim()) errs.projectType = 'Nooca mashruuca waa qasab.';
        if (!form.expectedCompletionDate) errs.expectedCompletionDate = 'Taariikhda la filayo waa qasab.';
        if (!form.customerId) errs.customerId = 'Waa in la doortaa macmiil.';
        
        // Validate date format
        if (form.expectedCompletionDate) {
            const date = new Date(form.expectedCompletionDate);
            if (isNaN(date.getTime())) {
                errs.expectedCompletionDate = 'Taariikhda ma sax ah.';
            }
        }
        
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            setToastMessage({ message: 'Fadlan sax khaladaadka ka hor intaadan keydin.', type: 'error' });
            return;
        }
        setSaving(true);
        setErrors({}); // Clear previous errors
        
        try {
            // Prepare form data with proper validation
            const formData = {
                name: form.name?.trim(),
                description: form.description?.trim() || null,
                agreementAmount: parseFloat(form.agreementAmount),
                advancePaid: parseFloat(form.advancePaid || 0),
                projectType: form.projectType?.trim(),
                expectedCompletionDate: form.expectedCompletionDate || null,
                actualCompletionDate: form.actualCompletionDate || null,
                notes: form.notes?.trim() || null,
                customerId: form.customerId,
                status: form.status || 'Active',
            };

            console.log('Submitting project edit with data:', formData);

            const res = await fetch(`/api/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            
            const data = await res.json();
            console.log('API response:', { status: res.status, data });
            
            if (res.ok) {
                setToastMessage({ message: 'Mashruuca si guul leh ayaa loo cusbooneysiiyey!', type: 'success' });
                // Dispatch storage event for real-time updates
                localStorage.setItem('projectUpdated', JSON.stringify({ projectId: id, timestamp: Date.now() }));
                window.dispatchEvent(new StorageEvent('storage'));
                // Redirect after a short delay to show success message
                setTimeout(() => {
                    router.push(`/projects/${id}`);
                }, 1500);
            } else {
                console.error('API error response:', data);
                setToastMessage({ message: data.message || 'Cusbooneysiinta waa fashilantay.', type: 'error' });
            }
        } catch (error: any) {
            console.error('Project update error:', error);
            setToastMessage({ message: 'Cilad xagga shabakadda ah ayaa dhacday.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <Layout>
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <h2 className="text-2xl font-semibold text-darkGray dark:text-gray-200">Waa la soo kaxaynayaa...</h2>
            </div>
        </Layout>
    );

    if (!project) return (
        <Layout>
            <div className="max-w-2xl mx-auto text-center p-8 mt-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col items-center gap-4">
                <AlertTriangle size={48} className="text-redError"/>
                <h2 className="text-2xl font-bold text-redError">Mashruucaan Lama Helin</h2>
                <Link href="/projects" className="mt-4 inline-flex items-center gap-2 bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition">
                    <ArrowLeft size={18}/> Ku noqo Liiska Mashaariicda
                </Link>
            </div>
        </Layout>
    );
    
    // --- Common Styles for Inputs ---
    const inputContainerStyle = "relative";
    const iconStyle = "absolute left-3 top-1/2 -translate-y-1/2 text-mediumGray dark:text-gray-400";
    const inputBaseStyle = "w-full p-3 pl-10 border-transparent rounded-lg bg-lightGray dark:bg-gray-700/50 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200";
    const inputErrorStyle = "ring-2 ring-redError";

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link href={`/projects/${id}`} className="inline-flex items-center gap-2 text-primary hover:underline font-semibold mb-4">
                        <ArrowLeft size={20} /> Ku noqo Faahfaahinta Mashruuca
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold text-darkGray dark:text-gray-100">Beddel Mashruuc</h1>
                    <p className="text-mediumGray dark:text-gray-400 mt-1">Cusbooneysii faahfaahinta <span className="font-semibold text-primary">{project.name}</span>.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg animate-fade-in-up">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            
                            {/* Project Name */}
                            <div className="md:col-span-2">
                                <label className="block text-md font-semibold mb-2">Magaca Mashruuca <span className="text-redError">*</span></label>
                                <div className={inputContainerStyle}>
                                    <FileText size={20} className={iconStyle} />
                                    <input type="text" name="name" value={form.name || ''} onChange={handleChange} className={`${inputBaseStyle} ${errors.name ? inputErrorStyle : 'focus:ring-primary'}`} title="Magaca Mashruuca" />
                                </div>
                                {errors.name && <p className="text-redError text-sm mt-1">{errors.name}</p>}
                            </div>

                            {/* Customer */}
                            <div>
                                <label className="block text-md font-semibold mb-2">Macmiil <span className="text-redError">*</span></label>
                                <div className={inputContainerStyle}>
                                    <User size={20} className={iconStyle} />
                                    <select name="customerId" value={form.customerId || ''} onChange={handleChange} className={`${inputBaseStyle} ${errors.customerId ? inputErrorStyle : 'focus:ring-primary'}`} title="Dooro Macmiil">
                                        <option value="">-- Dooro Macmiil --</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                {errors.customerId && <p className="text-redError text-sm mt-1">{errors.customerId}</p>}
                            </div>

                            {/* Project Type */}
                            <div>
                                <label className="block text-md font-semibold mb-2">Nooca Mashruuca <span className="text-redError">*</span></label>
                                <div className={inputContainerStyle}>
                                    <Tag size={20} className={iconStyle} />
                                    <input type="text" name="projectType" value={form.projectType || ''} onChange={handleChange} className={`${inputBaseStyle} ${errors.projectType ? inputErrorStyle : 'focus:ring-primary'}`} title="Nooca Mashruuca" />
                                </div>
                                {errors.projectType && <p className="text-redError text-sm mt-1">{errors.projectType}</p>}
                            </div>
                            
                            {/* Agreement Amount */}
                            <div>
                                <label className="block text-md font-semibold mb-2">Qiimaha Heshiiska ($) <span className="text-redError">*</span></label>
                                <div className={inputContainerStyle}>
                                    <DollarSign size={20} className={iconStyle} />
                                    <input type="number" name="agreementAmount" value={form.agreementAmount || ''} placeholder="Tusaale: 5000" onChange={handleChange} className={`${inputBaseStyle} ${errors.agreementAmount ? inputErrorStyle : 'focus:ring-primary'}`} />
                                </div>
                                {errors.agreementAmount && <p className="text-redError text-sm mt-1">{errors.agreementAmount}</p>}
                            </div>

                            {/* Advance Paid */}
                            <div>
                                <label className="block text-md font-semibold mb-2">Horumaris La Bixiyey ($) <span className="text-redError">*</span></label>
                                 <div className={inputContainerStyle}>
                                    <DollarSign size={20} className={iconStyle} />
                                    <input type="number" name="advancePaid" value={form.advancePaid ?? 0} placeholder="Tusaale: 1500" onChange={handleChange} className={`${inputBaseStyle} ${errors.advancePaid ? inputErrorStyle : 'focus:ring-primary'}`} />
                                </div>
                                {errors.advancePaid && <p className="text-redError text-sm mt-1">{errors.advancePaid}</p>}
                            </div>

                            {/* Expected Completion Date */}
                             <div>
                                <label className="block text-md font-semibold mb-2">Taariikhda Dhammaystirka <span className="text-redError">*</span></label>
                                <div className={inputContainerStyle}>
                                    <Calendar size={20} className={iconStyle} />
                                    <input type="date" name="expectedCompletionDate" value={form.expectedCompletionDate || ''} onChange={handleChange} className={`${inputBaseStyle} ${errors.expectedCompletionDate ? inputErrorStyle : 'focus:ring-primary'}`} title="Taariikhda Dhammaystirka" />
                                </div>
                                {errors.expectedCompletionDate && <p className="text-redError text-sm mt-1">{errors.expectedCompletionDate}</p>}
                            </div>

                            {/* Actual Completion Date */}
                            <div>
                                <label className="block text-md font-semibold mb-2">Taariikhda Dhammaystirka Dhabta ah</label>
                                <div className={inputContainerStyle}>
                                    <Calendar size={20} className={iconStyle} />
                                    <input type="date" name="actualCompletionDate" value={form.actualCompletionDate || ''} onChange={handleChange} className={`${inputBaseStyle} focus:ring-primary`} title="Taariikhda Dhammaystirka Dhabta ah" />
                                </div>
                            </div>
                            
                            {/* Status */}
                            <div>
                                <label className="block text-md font-semibold mb-2">Heerka Mashruuca</label>
                                <div className={inputContainerStyle}>
                                    <Activity size={20} className={iconStyle} />
                                    <select name="status" value={form.status || 'Active'} onChange={handleChange} className={`${inputBaseStyle} focus:ring-primary`} title="Heerka Mashruuca">
                                        <option value="Active">Active</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Nearing Deadline">Nearing Deadline</option>
                                        <option value="Overdue">Overdue</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Description and Notes with icons in the label */}
                            <div className="md:col-span-2">
                                <label className="block text-md font-semibold mb-2 flex items-center gap-2"><Pencil size={16}/> Faahfaahin</label>
                                <textarea name="description" value={form.description || ''} onChange={handleChange} className={`${inputBaseStyle} pl-4`} rows={3} placeholder="Faahfaahin kooban oo ku saabsan mashruuca..."></textarea>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-md font-semibold mb-2 flex items-center gap-2"><Pencil size={16}/> Xusuus Qor</label>
                                <textarea name="notes" value={form.notes || ''} onChange={handleChange} className={`${inputBaseStyle} pl-4`} rows={3} placeholder="Xusuus qor hoose ama faahfaahin dheeraad ah..."></textarea>
                            </div>

                            {/* Action Buttons */}
                            <div className="md:col-span-2 flex flex-col sm:flex-row justify-end items-center gap-4 mt-6">
                                <Link href={`/projects/${id}`} className="w-full sm:w-auto text-center px-6 py-3 rounded-lg font-bold text-mediumGray hover:bg-lightGray dark:hover:bg-gray-700 transition duration-200">
                                    Iska daa
                                </Link>
                                <button type="submit" className="w-full sm:w-auto bg-primary text-white py-3 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-lg hover:shadow-primary/40 flex items-center justify-center disabled:bg-primary/50 disabled:cursor-not-allowed" disabled={saving}>
                                    {saving ? (<Loader2 className="animate-spin mr-2" size={20} />) : <Save size={20} className="mr-2"/>}
                                    {saving ? 'Waa la keydinayaa...' : 'Update Garee'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {toastMessage && (
                <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
            )}
        </Layout>
    );
};

export default EditProjectPage;