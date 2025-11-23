import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Check } from 'lucide-react';

const CalComFunctionModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    type: 'cal_com',
    name: '',
    description: '',
    apiKey: '',
    eventTypeId: '',
    timezone: 'America/Los_Angeles',
    subType: 'check_availability' // or 'book_appointment'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        type: 'cal_com',
        name: '',
        description: '',
        apiKey: '',
        eventTypeId: '',
        timezone: 'America/Los_Angeles',
        subType: 'check_availability'
      });
    }
  }, [initialData, isOpen]);

  const functionTypes = [
    {
      id: 'check_availability',
      name: 'Check Availability',
      description: 'Check available time slots on calendar'
    },
    {
      id: 'book_appointment',
      name: 'Book Appointment',
      description: 'Book an appointment on the calendar'
    }
  ];

  const timezones = [
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Asia/Kolkata'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const functionData = {
      ...formData,
      name: formData.name || `${formData.subType === 'check_availability' ? 'Check Availability' : 'Book Appointment'}`,
      description: formData.description || functionTypes.find(t => t.id === formData.subType)?.description || ''
    };
    
    onSave(functionData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Cal.com Integration</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure calendar function
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Function Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Function Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {functionTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, subType: type.id })}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.subType === type.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{type.name}</h4>
                      {formData.subType === type.id && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Function Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Function Name (Optional)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., check_availability_cal"
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use default name
              </p>
            </div>

            {/* Cal.com API Key */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Cal.com API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="cal_live_..."
                className="input-field font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from{' '}
                <a
                  href="https://app.cal.com/settings/developer/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  Cal.com API settings
                </a>
              </p>
            </div>

            {/* Event Type ID */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Event Type ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.eventTypeId}
                onChange={(e) => setFormData({ ...formData, eventTypeId: e.target.value })}
                placeholder="e.g., 123456"
                className="input-field"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this in your Cal.com event type settings
              </p>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="input-field"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Custom description for this function"
                rows={3}
                className="textarea-field"
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary"
              >
                Save Function
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CalComFunctionModal;

