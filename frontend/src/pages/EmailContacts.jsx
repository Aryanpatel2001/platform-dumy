import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, X, Trash2, Edit2, Search, List,
    Mail, Info, Download, Upload, CheckCircle2, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function EmailContacts() {
    const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' or 'lists'
    const [contacts, setContacts] = useState([]);
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    console.log("Lists:", lists);

    // Modals
    const [contactModal, setContactModal] = useState(false);
    const [listModal, setListModal] = useState(false);
    const [addToListModal, setAddToListModal] = useState(false);

    // Forms
    const [contactForm, setContactForm] = useState({
        email: '',
        first_name: '',
        last_name: '',
        company_name: '',
        phone: ''
    });

    const [listForm, setListForm] = useState({
        name: '',
        description: ''
    });

    const [selectedContactId, setSelectedContactId] = useState(null);
    const [selectedListId, setSelectedListId] = useState(null);

    const { token } = useAuth();
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    // Also refresh when modal closes to ensure counts are updated
    useEffect(() => {
        if (!addToListModal && !contactModal && !listModal) {
            // Small delay to ensure backend has processed the update
            const timer = setTimeout(() => {
                fetchData();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [addToListModal, contactModal, listModal]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'contacts') {
                const res = await axios.get('http://localhost:3000/api/email/contacts', { headers });
                setContacts(res.data || []);
            } else {
                const res = await axios.get('http://localhost:3000/api/email/lists', { headers });
                setLists(res.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Contact Management
    const handleSaveContact = async (e) => {
        e.preventDefault();

        // Validate email
        if (!contactForm.email || !contactForm.email.trim()) {
            toast.error('Email is required');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactForm.email.trim())) {
            toast.error('Please enter a valid email address');
            return;
        }

        try {
            const payload = {
                email: contactForm.email.trim(),
                first_name: contactForm.first_name?.trim() || null,
                last_name: contactForm.last_name?.trim() || null,
                company_name: contactForm.company_name?.trim() || null, // Backend will handle both company_name and company
                phone: contactForm.phone?.trim() || null
            };

            if (selectedContactId) {
                await axios.put(`http://localhost:3000/api/email/contacts/${selectedContactId}`, payload, { headers });
                toast.success('Contact updated successfully!');
            } else {
                await axios.post('http://localhost:3000/api/email/contacts', payload, { headers });
                toast.success('Contact created successfully!');
            }
            setContactModal(false);
            resetContactForm();
            fetchData();
        } catch (error) {
            console.error('Failed to save contact:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to save contact';
            toast.error(errorMessage);
        }
    };

    const handleDeleteContact = async (id) => {
        if (!confirm('Delete this contact?')) return;
        try {
            await axios.delete(`http://localhost:3000/api/email/contacts/${id}`, { headers });
            toast.success('Contact deleted');
            fetchData();
        } catch (error) {
            console.error('Failed to delete contact:', error);
            toast.error('Failed to delete contact');
        }
    };

    const resetContactForm = () => {
        setContactForm({ email: '', first_name: '', last_name: '', company_name: '', phone: '' });
        setSelectedContactId(null);
    };

    // List Management
    const handleSaveList = async (e) => {
        e.preventDefault();
        try {
            if (selectedListId) {
                await axios.put(`http://localhost:3000/api/email/lists/${selectedListId}`, listForm, { headers });
                toast.success('List updated');
            } else {
                await axios.post('http://localhost:3000/api/email/lists', listForm, { headers });
                toast.success('List created');
            }
            setListModal(false);
            resetListForm();
            fetchData();
        } catch (error) {
            console.error('Failed to save list:', error);
            toast.error('Failed to save list');
        }
    };

    const handleDeleteList = async (id) => {
        if (!confirm('Delete this list?')) return;
        try {
            await axios.delete(`http://localhost:3000/api/email/lists/${id}`, { headers });
            toast.success('List deleted');
            fetchData();
        } catch (error) {
            console.error('Failed to delete list:', error);
            toast.error('Failed to delete list');
        }
    };

    const resetListForm = () => {
        setListForm({ name: '', description: '' });
        setSelectedListId(null);
    };

    // Add contact to list
    const handleAddToList = async (e) => {
        e.preventDefault();

        if (!selectedListId) {
            toast.error('Please select a list');
            return;
        }

        if (!selectedContactId) {
            toast.error('No contact selected');
            return;
        }

        try {
            await axios.post(`http://localhost:3000/api/email/lists/${selectedListId}/contacts`, {
                contactIds: [selectedContactId]
            }, { headers });
            toast.success('Contact added to list successfully!');
            setAddToListModal(false);
            setSelectedContactId(null);
            setSelectedListId(null);
            // Refresh lists to update contact counts - force refresh both tabs
            if (activeTab === 'lists') {
                fetchData();
            } else {
                // If on contacts tab, switch to lists tab to show updated count
                setActiveTab('lists');
                setTimeout(() => fetchData(), 100);
            }
        } catch (error) {
            console.error('Failed to add contact to list:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to add contact to list';
            toast.error(errorMessage);
        }
    };

    const filteredContacts = contacts.filter(c => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            c.email?.toLowerCase().includes(query) ||
            c.first_name?.toLowerCase().includes(query) ||
            c.last_name?.toLowerCase().includes(query) ||
            (c.company_name || c.company)?.toLowerCase().includes(query) ||
            (Array.isArray(c.tags) && c.tags.some(tag => tag?.toLowerCase().includes(query)))
        );
    });

    const filteredLists = lists.filter(l =>
        l.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // CSV Import/Export
    const handleExportContacts = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/email/contacts/export', {
                headers,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Contacts exported successfully!');
        } catch (error) {
            console.error('Failed to export contacts:', error);
            toast.error('Failed to export contacts');
        }
    };

    const handleImportContacts = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast.error('Please select a CSV file');
            return;
        }

        try {
            const fileContent = await file.text();

            const response = await axios.post(
                'http://localhost:3000/api/email/contacts/import',
                { csvData: fileContent },
                { headers }
            );

            if (response.data.results) {
                const { success, failed } = response.data.results;
                if (failed > 0) {
                    toast.success(`Imported ${success} contacts. ${failed} failed. Check console for details.`);
                } else {
                    toast.success(`Successfully imported ${success} contacts!`);
                }
            } else {
                toast.success('Contacts imported successfully!');
            }

            fetchData();
            e.target.value = ''; // Reset file input
        } catch (error) {
            console.error('Failed to import contacts:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to import contacts';
            toast.error(errorMessage);
            e.target.value = ''; // Reset file input
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-brand-sky to-brand-primary rounded-xl">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-sky to-brand-primary bg-clip-text text-transparent">
                                Contacts & Lists
                            </h1>
                            <p className="text-brand-muted dark:text-gray-400 mt-1">
                                Manage your email contacts and organize them into lists
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {activeTab === 'contacts' && (
                        <>
                            <label className="inline-flex items-center gap-2 px-4 py-2 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-700 text-brand-dark dark:text-brand-white rounded-xl hover:bg-brand-surface dark:hover:bg-gray-800 transition-colors cursor-pointer">
                                <Upload className="w-4 h-4" />
                                Import CSV
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleImportContacts}
                                    className="hidden"
                                />
                            </label>
                            <button
                                onClick={handleExportContacts}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-700 text-brand-dark dark:text-brand-white rounded-xl hover:bg-brand-surface dark:hover:bg-gray-800 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => {
                            if (activeTab === 'contacts') {
                                resetContactForm();
                                setContactModal(true);
                            } else {
                                resetListForm();
                                setListModal(true);
                            }
                        }}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        {activeTab === 'contacts' ? 'Add Contact' : 'Create List'}
                    </button>
                </div>
            </motion.div>

            {/* Info Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-3 p-4 bg-brand-sky/5 border border-brand-sky/20 rounded-xl"
            >
                <Info className="w-5 h-5 text-brand-sky mt-0.5 flex-shrink-0" />
                <div className="text-sm text-brand-dark dark:text-brand-white">
                    <p className="font-medium mb-1">Organize Your Audience</p>
                    <p className="text-brand-muted dark:text-gray-400">
                        Create contact lists to segment your audience. Add contacts to multiple lists for targeted campaigns.
                    </p>
                </div>
            </motion.div>

            {/* Tabs & Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden"
            >
                <div className="p-6 border-b border-brand-surface dark:border-gray-800">
                    <div className="flex items-center justify-between gap-4">
                        {/* Tabs */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('contacts')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'contacts'
                                    ? 'bg-brand-primary text-white'
                                    : 'text-brand-muted dark:text-gray-400 hover:bg-brand-surface dark:hover:bg-gray-800'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Contacts ({contacts.length})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('lists')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'lists'
                                    ? 'bg-brand-primary text-white'
                                    : 'text-brand-muted dark:text-gray-400 hover:bg-brand-surface dark:hover:bg-gray-800'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <List className="w-4 h-4" />
                                    Lists ({lists.length})
                                </div>
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted dark:text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search ${activeTab}...`}
                                className="w-full pl-10 pr-4 py-2 bg-brand-surface dark:bg-gray-800 border border-transparent rounded-lg text-brand-dark dark:text-brand-white placeholder-brand-muted dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-brand-muted dark:text-gray-400">Loading...</p>
                            </div>
                        </div>
                    ) : activeTab === 'contacts' ? (
                        /* Contacts Table */
                        filteredContacts.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="inline-flex p-4 bg-brand-surface dark:bg-gray-800 rounded-full mb-4">
                                    <Mail className="w-8 h-8 text-brand-muted dark:text-gray-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-brand-dark dark:text-brand-white mb-2">
                                    No contacts yet
                                </h3>
                                <p className="text-brand-muted dark:text-gray-400 mb-6">
                                    Add your first contact to start building your audience
                                </p>
                                <button
                                    onClick={() => {
                                        resetContactForm();
                                        setContactModal(true);
                                    }}
                                    className="btn-primary inline-flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Contact
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-brand-surface dark:border-gray-800">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-brand-dark dark:text-brand-white">Email</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-brand-dark dark:text-brand-white">Name</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-brand-dark dark:text-brand-white">Company</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-brand-dark dark:text-brand-white">Tags</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-brand-dark dark:text-brand-white">Status</th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-brand-dark dark:text-brand-white">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredContacts.map((contact) => (
                                            <motion.tr
                                                key={contact.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="border-b border-brand-surface dark:border-gray-800 hover:bg-brand-surface/30 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-brand-muted dark:text-gray-400" />
                                                        <span className="text-sm text-brand-dark dark:text-brand-white">{contact.email}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm text-brand-dark dark:text-brand-white">
                                                        {(() => {
                                                            const firstName = contact.first_name?.trim() || '';
                                                            const lastName = contact.last_name?.trim() || '';
                                                            const fullName = `${firstName} ${lastName}`.trim();
                                                            return fullName || <span className="text-brand-muted dark:text-gray-400 italic">No name</span>;
                                                        })()}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm text-brand-muted dark:text-gray-400">
                                                        {(contact.company_name || contact.company)?.trim() || <span className="italic">-</span>}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {contact.tags && Array.isArray(contact.tags) && contact.tags.length > 0 ? (
                                                            contact.tags.map((tag, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-brand-muted dark:text-gray-500 italic">No tags</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${contact.is_unsubscribed
                                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                        }`}>
                                                        {contact.is_unsubscribed ? (
                                                            <><AlertCircle className="w-3 h-3" /> Unsubscribed</>
                                                        ) : (
                                                            <><CheckCircle2 className="w-3 h-3" /> Active</>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedContactId(contact.id);
                                                                setAddToListModal(true);
                                                            }}
                                                            className="p-1.5 hover:bg-brand-surface dark:hover:bg-gray-800 rounded-lg text-brand-sky transition-colors"
                                                            title="Add to list"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedContactId(contact.id);
                                                                // Map database fields to form fields
                                                                setContactForm({
                                                                    email: contact.email || '',
                                                                    first_name: contact.first_name || '',
                                                                    last_name: contact.last_name || '',
                                                                    company_name: contact.company_name || contact.company || '',
                                                                    phone: contact.phone || ''
                                                                });
                                                                setContactModal(true);
                                                            }}
                                                            className="p-1.5 hover:bg-brand-surface dark:hover:bg-gray-800 rounded-lg text-brand-primary transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteContact(contact.id)}
                                                            className="p-1.5 hover:bg-brand-surface dark:hover:bg-gray-800 rounded-lg text-brand-accent transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        /* Lists Grid */
                        filteredLists.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="inline-flex p-4 bg-brand-surface dark:bg-gray-800 rounded-full mb-4">
                                    <List className="w-8 h-8 text-brand-muted dark:text-gray-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-brand-dark dark:text-brand-white mb-2">
                                    No lists yet
                                </h3>
                                <p className="text-brand-muted dark:text-gray-400 mb-6">
                                    Create your first contact list to organize your audience
                                </p>
                                <button
                                    onClick={() => {
                                        resetListForm();
                                        setListModal(true);
                                    }}
                                    className="btn-primary inline-flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create List
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredLists.map((list) => (
                                    <motion.div
                                        key={list.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-6 bg-brand-surface/30 dark:bg-gray-800/50 border border-brand-surface dark:border-gray-700 rounded-xl hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-2 bg-brand-primary/10 rounded-lg">
                                                <List className="w-5 h-5 text-brand-primary" />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedListId(list.id);
                                                        setListForm({ name: list.name, description: list.description || '' });
                                                        setListModal(true);
                                                    }}
                                                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-brand-surface dark:hover:bg-gray-700 rounded-lg text-brand-primary transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteList(list.id)}
                                                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-brand-surface dark:hover:bg-gray-700 rounded-lg text-brand-accent transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <h3 className="font-semibold text-brand-dark dark:text-brand-white mb-2">
                                            {list.name}
                                        </h3>
                                        {list.description && (
                                            <p className="text-sm text-brand-muted dark:text-gray-400 mb-4 line-clamp-2">
                                                {list.description}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between pt-4 border-t border-brand-surface dark:border-gray-700">
                                            <div className="flex items-center gap-2 text-sm text-brand-muted dark:text-gray-400">
                                                <Users className="w-4 h-4" />
                                                <span>{list.contact_count || 0} contacts</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </motion.div>

            {/* Contact Modal */}
            <AnimatePresence>
                {contactModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setContactModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-brand-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-brand-primary to-brand-sky p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold">
                                        {selectedContactId ? 'Edit Contact' : 'Add New Contact'}
                                    </h2>
                                    <button
                                        onClick={() => setContactModal(false)}
                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSaveContact} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                                        Email <span className="text-brand-accent">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={contactForm.email}
                                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                        className="w-full px-4 py-2 bg-brand-surface dark:bg-gray-800 border border-brand-surface dark:border-gray-700 rounded-lg text-brand-dark dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            value={contactForm.first_name}
                                            onChange={(e) => setContactForm({ ...contactForm, first_name: e.target.value })}
                                            className="w-full px-4 py-2 bg-brand-surface dark:bg-gray-800 border border-brand-surface dark:border-gray-700 rounded-lg text-brand-dark dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={contactForm.last_name}
                                            onChange={(e) => setContactForm({ ...contactForm, last_name: e.target.value })}
                                            className="w-full px-4 py-2 bg-brand-surface dark:bg-gray-800 border border-brand-surface dark:border-gray-700 rounded-lg text-brand-dark dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                                        Company
                                    </label>
                                    <input
                                        type="text"
                                        value={contactForm.company_name}
                                        onChange={(e) => setContactForm({ ...contactForm, company_name: e.target.value })}
                                        className="w-full px-4 py-2 bg-brand-surface dark:bg-gray-800 border border-brand-surface dark:border-gray-700 rounded-lg text-brand-dark dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                        placeholder="Acme Corp"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={contactForm.phone}
                                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                        className="w-full px-4 py-2 bg-brand-surface dark:bg-gray-800 border border-brand-surface dark:border-gray-700 rounded-lg text-brand-dark dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                        placeholder="+1234567890"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setContactModal(false)}
                                        className="flex-1 px-4 py-2 bg-brand-surface dark:bg-gray-800 text-brand-dark dark:text-brand-white rounded-lg hover:bg-brand-surface/70 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
                                    >
                                        {selectedContactId ? 'Update' : 'Add Contact'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List Modal */}
            <AnimatePresence>
                {listModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setListModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-brand-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-brand-sky to-brand-primary p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold">
                                        {selectedListId ? 'Edit List' : 'Create New List'}
                                    </h2>
                                    <button
                                        onClick={() => setListModal(false)}
                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSaveList} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                                        List Name <span className="text-brand-accent">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={listForm.name}
                                        onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-brand-surface dark:bg-gray-800 border border-brand-surface dark:border-gray-700 rounded-lg text-brand-dark dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                        placeholder="e.g., Newsletter Subscribers"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={listForm.description}
                                        onChange={(e) => setListForm({ ...listForm, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-brand-surface dark:bg-gray-800 border border-brand-surface dark:border-gray-700 rounded-lg text-brand-dark dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                                        placeholder="Describe this list..."
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setListModal(false)}
                                        className="flex-1 px-4 py-2 bg-brand-surface dark:bg-gray-800 text-brand-dark dark:text-brand-white rounded-lg hover:bg-brand-surface/70 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
                                    >
                                        {selectedListId ? 'Update' : 'Create List'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add to List Modal */}
            <AnimatePresence>
                {addToListModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setAddToListModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-brand-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-brand-primary to-brand-sky p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold">Add to List</h2>
                                    <button
                                        onClick={() => setAddToListModal(false)}
                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleAddToList} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                                        Select List <span className="text-brand-accent">*</span>
                                    </label>
                                    <select
                                        required
                                        value={selectedListId || ''}
                                        onChange={(e) => setSelectedListId(e.target.value)}
                                        className="w-full px-4 py-2 bg-brand-surface dark:bg-gray-800 border border-brand-surface dark:border-gray-700 rounded-lg text-brand-dark dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    >
                                        <option value="">Choose a list...</option>
                                        {lists.map((list) => (
                                            <option key={list.id} value={list.id}>
                                                {list.name} {list.contact_count > 0 && `(${list.contact_count} contacts)`}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedContactId && (
                                        <div className="p-3 bg-brand-surface/50 dark:bg-gray-800/50 rounded-lg text-sm">
                                            <p className="text-brand-muted dark:text-gray-400 mb-1">Adding contact:</p>
                                            <p className="text-brand-dark dark:text-brand-white font-medium">
                                                {(() => {
                                                    const contact = contacts.find(c => c.id === selectedContactId);
                                                    if (!contact) return 'Unknown';
                                                    const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
                                                    return name || contact.email;
                                                })()}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setAddToListModal(false)}
                                        className="flex-1 px-4 py-2 bg-brand-surface dark:bg-gray-800 text-brand-dark dark:text-brand-white rounded-lg hover:bg-brand-surface/70 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
                                    >
                                        Add to List
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}