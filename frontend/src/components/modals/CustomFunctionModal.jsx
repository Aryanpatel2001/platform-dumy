import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Plus, Trash2 } from 'lucide-react';

const CustomFunctionModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    type: 'custom',
    name: '',
    description: '',
    method: 'GET',
    url: '',
    headers: [{ key: '', value: '' }],
    bodyTemplate: '',
    parameters: [{ name: '', type: 'string', required: true, description: '' }]
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        type: 'custom',
        name: '',
        description: '',
        method: 'GET',
        url: '',
        headers: [{ key: '', value: '' }],
        bodyTemplate: '',
        parameters: [{ name: '', type: 'string', required: true, description: '' }]
      });
    }
  }, [initialData, isOpen]);

  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const parameterTypes = ['string', 'number', 'boolean', 'object', 'array'];

  const addHeader = () => {
    setFormData({
      ...formData,
      headers: [...formData.headers, { key: '', value: '' }]
    });
  };

  const removeHeader = (index) => {
    setFormData({
      ...formData,
      headers: formData.headers.filter((_, i) => i !== index)
    });
  };

  const updateHeader = (index, field, value) => {
    const newHeaders = [...formData.headers];
    newHeaders[index][field] = value;
    setFormData({ ...formData, headers: newHeaders });
  };

  const addParameter = () => {
    setFormData({
      ...formData,
      parameters: [...formData.parameters, { name: '', type: 'string', required: true, description: '' }]
    });
  };

  const removeParameter = (index) => {
    setFormData({
      ...formData,
      parameters: formData.parameters.filter((_, i) => i !== index)
    });
  };

  const updateParameter = (index, field, value) => {
    const newParams = [...formData.parameters];
    newParams[index][field] = value;
    setFormData({ ...formData, parameters: newParams });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
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
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Custom Function</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect to any API endpoint
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
            {/* Function Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Function Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., send_email, get_user_data"
                className="input-field"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use lowercase with underscores (snake_case)
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does this function do?"
                rows={3}
                className="textarea-field"
                required
              />
            </div>

            {/* HTTP Method and URL */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-2">
                  Method
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="input-field"
                >
                  {httpMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-2">
                  API Endpoint URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://api.example.com/endpoint"
                  className="input-field font-mono text-sm"
                  required
                />
              </div>
            </div>

            {/* Headers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  Headers (Optional)
                </label>
                <button
                  type="button"
                  onClick={addHeader}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Header</span>
                </button>
              </div>
              
              <div className="space-y-2">
                {formData.headers.map((header, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => updateHeader(index, 'key', e.target.value)}
                      placeholder="Header Key (e.g., Authorization)"
                      className="flex-1 input-field"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => updateHeader(index, 'value', e.target.value)}
                      placeholder="Header Value (e.g., Bearer ${API_KEY})"
                      className="flex-1 input-field"
                    />
                    <button
                      type="button"
                      onClick={() => removeHeader(index)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Body Template (for POST/PUT/PATCH) */}
            {['POST', 'PUT', 'PATCH'].includes(formData.method) && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Request Body Template (JSON)
                </label>
                <textarea
                  value={formData.bodyTemplate}
                  onChange={(e) => setFormData({ ...formData, bodyTemplate: e.target.value })}
                  placeholder={'{\n  "key": "${parameter_name}",\n  "value": "static_value"\n}'}
                  rows={6}
                  className="textarea-field font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use ${'{parameter_name}'} to insert dynamic values from parameters
                </p>
              </div>
            )}

            {/* Parameters */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  Function Parameters
                </label>
                <button
                  type="button"
                  onClick={addParameter}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Parameter</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.parameters.map((param, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        value={param.name}
                        onChange={(e) => updateParameter(index, 'name', e.target.value)}
                        placeholder="Parameter name"
                        className="input-field"
                      />
                      <div className="flex space-x-2">
                        <select
                          value={param.type}
                          onChange={(e) => updateParameter(index, 'type', e.target.value)}
                          className="flex-1 input-field"
                        >
                          {parameterTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center space-x-2 px-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg">
                          <input
                            type="checkbox"
                            checked={param.required}
                            onChange={(e) => updateParameter(index, 'required', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Required</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={param.description}
                        onChange={(e) => updateParameter(index, 'description', e.target.value)}
                        placeholder="Parameter description"
                        className="flex-1 input-field"
                      />
                      <button
                        type="button"
                        onClick={() => removeParameter(index)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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

export default CustomFunctionModal;

