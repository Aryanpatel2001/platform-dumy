import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, CheckCircle, Trash2, Phone, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const initialForm = {
  label: '',
  phoneNumber: '',
  twilioConfig: {
    accountSid: '',
    authToken: '',
    phoneNumber: ''
  },
  isPrimary: false
};

export default function PhoneNumbers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const { token } = useAuth();

  const headers = { Authorization: `Bearer ${token}` };

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/phone-numbers', { headers });
      setItems(res.data);
    } catch (err) {
      console.error('Fetch phone numbers error:', err);
      toast.error('Failed to load phone numbers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('twilio.')) {
      const key = name.split('.')[1];
      setForm((prev) => ({ ...prev, twilioConfig: { ...prev.twilioConfig, [key]: value } }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation
    if (!/^\+[1-9]\d{1,14}$/.test(form.phoneNumber)) {
      toast.error('Main phone number must be E.164 (e.g., +18314809309)');
      return;
    }
    if (!/^\+[1-9]\d{1,14}$/.test(form.twilioConfig.phoneNumber)) {
      toast.error('Twilio phone number must be E.164');
      return;
    }
    if (!form.twilioConfig.accountSid || !form.twilioConfig.authToken) {
      toast.error('Twilio Account SID and Auth Token are required');
      return;
    }

    try {
      // Validate Twilio credentials before creating
      const validateRes = await axios.post('http://localhost:3000/api/twilio/validate', {
        accountSid: form.twilioConfig.accountSid,
        authToken: form.twilioConfig.authToken,
        phoneNumber: form.twilioConfig.phoneNumber,
      }, { headers });

      if (!validateRes.data?.valid) {
        toast.error(validateRes.data?.error || 'Invalid Twilio credentials');
        return;
      }

      const res = await axios.post('http://localhost:3000/api/phone-numbers', form, { headers });
      setItems((prev) => [res.data, ...prev]);
      setOpen(false);
      setForm(initialForm);
      toast.success('Phone number added');
    } catch (err) {
      console.error('Create phone number error:', err);
      toast.error(err.response?.data?.message || 'Failed to add number');
    }
  };

  const makePrimary = async (id) => {
    try {
      const res = await axios.post(`http://localhost:3000/api/phone-numbers/${id}/make-primary`, {}, { headers });
      setItems((prev) => prev.map((i) => ({ ...i, is_primary: i.id === id })));
      toast.success('Primary number updated');
    } catch (err) {
      console.error('Set primary error:', err);
      toast.error('Failed to set primary');
    }
  };

  const remove = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/phone-numbers/${id}`, { headers });
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success('Phone number removed');
    } catch (err) {
      console.error('Delete phone number error:', err);
      toast.error('Failed to remove number');
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
          <h1 className="text-3xl font-bold text-brand-dark dark:text-brand-white mb-2">Phone Numbers</h1>
          <p className="text-brand-muted dark:text-gray-400">Manage your Twilio phone numbers for voice calls</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setOpen(true)} 
          className="btn-primary inline-flex items-center gap-2 shadow-lg shadow-brand-primary/20"
        >
          <Plus className="w-4 h-4" />
          Add Number
        </motion.button>
      </motion.div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-brand-white dark:bg-gray-800 rounded-2xl shadow-lg border border-brand-surface dark:border-gray-700 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-surface/30 dark:bg-gray-900/50">
              <tr className="border-b border-brand-surface dark:border-gray-700">
                <th className="px-6 py-4 text-left text-xs font-semibold text-brand-dark dark:text-gray-300 uppercase tracking-wider">
                  Label
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-brand-dark dark:text-gray-300 uppercase tracking-wider">
                  Main Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-brand-dark dark:text-gray-300 uppercase tracking-wider">
                  Twilio Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-brand-dark dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-brand-dark dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-surface/50 dark:divide-gray-700/50">
            {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
                      <span className="text-brand-muted">Loading phone numbers...</span>
                    </div>
                  </td>
                </tr>
            ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Phone className="w-12 h-12 mx-auto mb-3 text-brand-muted opacity-50" />
                    <p className="text-brand-muted text-lg mb-2">No phone numbers yet</p>
                    <p className="text-sm text-brand-muted">Add your first Twilio number to start making calls</p>
                  </td>
                </tr>
            ) : (
                items.map((i, index) => (
                  <motion.tr 
                    key={i.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-brand-surface/20 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-primary to-brand-sky flex items-center justify-center">
                          <Phone className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-brand-dark dark:text-brand-white">{i.label || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-brand-dark dark:text-gray-300">{i.phone_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-brand-muted dark:text-gray-400">{i.twilio_config?.phoneNumber || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                    {i.is_primary ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-sm font-medium">
                          <CheckCircle className="w-4 h-4"/>
                          Primary
                        </span>
                    ) : (
                        <button 
                          onClick={() => makePrimary(i.id)}
                          className="text-sm text-brand-muted hover:text-brand-primary transition-colors"
                        >
                          Make Primary
                        </button>
                    )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => remove(i.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </motion.button>
                    </td>
                  </motion.tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Number Modal */}
      <AnimatePresence>
      {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-brand-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-brand-surface dark:border-gray-700 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-primary to-brand-sky p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Add Phone Number</h2>
                        <p className="text-white/80 text-sm">Connect your Twilio number</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setOpen(false)}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
            </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                    <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                      Label
                    </label>
                    <input
                      name="label"
                      value={form.label}
                      onChange={handleChange}
                      placeholder="e.g., Sales Line"
                      className="w-full px-4 py-3 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-700 rounded-xl text-brand-dark dark:text-brand-white placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                    />
              </div>

              <div>
                    <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                      Main Phone Number (E.164 format)
                    </label>
                    <input
                      name="phoneNumber"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      placeholder="+18314809309"
                      className="w-full px-4 py-3 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-700 rounded-xl text-brand-dark dark:text-brand-white placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all font-mono"
                    />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                      <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                        Twilio Account SID
                      </label>
                      <input
                        name="twilio.accountSid"
                        value={form.twilioConfig.accountSid}
                        onChange={handleChange}
                        placeholder="ACxxxxxxxx"
                        className="w-full px-4 py-3 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-700 rounded-xl text-brand-dark dark:text-brand-white placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all font-mono"
                      />
                </div>
                <div>
                      <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                        Twilio Auth Token
                      </label>
                      <input
                        name="twilio.authToken"
                        type="password"
                        value={form.twilioConfig.authToken}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-700 rounded-xl text-brand-dark dark:text-brand-white placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                      />
                </div>
              </div>

              <div>
                    <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                      Twilio Phone Number (E.164 format)
                    </label>
                    <input
                      name="twilio.phoneNumber"
                      value={form.twilioConfig.phoneNumber}
                      onChange={handleChange}
                      placeholder="+18314809309"
                      className="w-full px-4 py-3 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-700 rounded-xl text-brand-dark dark:text-brand-white placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all font-mono"
                    />
              </div>

                  <div className="flex items-center gap-3 p-4 bg-brand-surface/30 dark:bg-gray-900/30 rounded-xl">
                    <input
                      type="checkbox"
                      id="isPrimary"
                      checked={form.isPrimary}
                      onChange={(e) => setForm((prev) => ({ ...prev, isPrimary: e.target.checked }))}
                      className="w-5 h-5 text-brand-primary bg-brand-white border-brand-surface rounded focus:ring-brand-primary focus:ring-2"
                    />
                    <label htmlFor="isPrimary" className="text-sm font-medium text-brand-dark dark:text-brand-white">
                      Set as primary number
                    </label>
              </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-surface dark:border-gray-700">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setOpen(false)}
                      className="px-6 py-2.5 border border-brand-surface dark:border-gray-700 text-brand-dark dark:text-brand-white rounded-xl font-medium hover:bg-brand-surface/50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-primary px-6 py-2.5 shadow-lg shadow-brand-primary/20"
                    >
                      Save Number
                    </motion.button>
              </div>
            </form>
              </motion.div>
            </motion.div>
          </>
      )}
      </AnimatePresence>
    </div>
  );
}