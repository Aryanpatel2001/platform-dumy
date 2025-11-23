import { useState } from 'react';
import { Plus, Calendar, Trash2, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CalComFunctionModal from '../modals/CalComFunctionModal';
import CustomFunctionModal from '../modals/CustomFunctionModal';

const FunctionConfiguration = ({ functions, onChange }) => {
  const [showCalComModal, setShowCalComModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingFunction, setEditingFunction] = useState(null);

  const handleAddFunction = (functionData) => {
    if (editingFunction) {
      onChange(functions.map(f => f.id === editingFunction.id ? functionData : f));
    } else {
      onChange([...functions, { ...functionData, id: Date.now().toString() }]);
    }
    setEditingFunction(null);
    setShowCalComModal(false);
    setShowCustomModal(false);
  };

  const handleEditFunction = (func) => {
    setEditingFunction(func);
    if (func.type === 'cal_com') {
      setShowCalComModal(true);
    } else {
      setShowCustomModal(true);
    }
  };

  const handleDeleteFunction = (id) => {
    onChange(functions.filter(f => f.id !== id));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Function Configuration</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Add default or custom functions to give your agent special capabilities
        </p>
      </div>

      {/* Add Function Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => {
            setEditingFunction(null);
            setShowCalComModal(true);
          }}
          className="card hover:shadow-xl transition-all duration-300 flex items-center justify-between p-4 group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Cal.com Integration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Default calendar functions
              </p>
            </div>
          </div>
          <Plus className="w-5 h-5 text-gray-400 group-hover:text-brand-primary" />
        </button>

        <button
          onClick={() => {
            setEditingFunction(null);
            setShowCustomModal(true);
          }}
          className="card hover:shadow-xl transition-all duration-300 flex items-center justify-between p-4 group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-brand-light dark:bg-brand-primary/20 rounded-xl group-hover:scale-110 transition-transform">
              <Settings className="w-6 h-6 text-brand-secondary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Custom Function</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect any API
              </p>
            </div>
          </div>
          <Plus className="w-5 h-5 text-gray-400 group-hover:text-brand-primary" />
        </button>
      </div>

      {/* Functions List */}
      {functions.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            Configured Functions ({functions.length})
          </h3>
          <AnimatePresence>
            {functions.map((func) => (
              <motion.div
                key={func.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card p-4 flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    func.type === 'cal_com'
                      ? 'bg-brand-light dark:bg-brand-primary/20'
                      : 'bg-brand-light dark:bg-brand-primary/20'
                  }`}>
                    {func.type === 'cal_com' ? (
                      <Calendar className="w-5 h-5 text-brand-primary" />
                    ) : (
                      <Settings className="w-5 h-5 text-brand-secondary" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{func.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {func.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditFunction(func)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFunction(func.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            No functions configured yet
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Add functions to enhance your agent's capabilities
          </p>
        </div>
      )}

      {/* Modals */}
      <CalComFunctionModal
        isOpen={showCalComModal}
        onClose={() => {
          setShowCalComModal(false);
          setEditingFunction(null);
        }}
        onSave={handleAddFunction}
        initialData={editingFunction}
      />

      <CustomFunctionModal
        isOpen={showCustomModal}
        onClose={() => {
          setShowCustomModal(false);
          setEditingFunction(null);
        }}
        onSave={handleAddFunction}
        initialData={editingFunction}
      />
    </div>
  );
};

export default FunctionConfiguration;

