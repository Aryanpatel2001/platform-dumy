import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, X, Trash2, Edit2, Search, Eye,
  Info, Code, Save, Sparkles, Copy, CheckCircle2
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    subject_template: '',
    html_content: ''
  });

  const { token } = useAuth();
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/email/templates', { headers });
      setTemplates(res.data || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    
    // Validate html_content
    if (!form.html_content || form.html_content.trim() === '') {
      toast.error('HTML content is required. Please add your email template content.');
      return;
    }

    // Validate template name
    if (!form.name || form.name.trim() === '') {
      toast.error('Template name is required');
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        subject_template: form.subject_template?.trim() || null,
        html_content: form.html_content.trim()
      };

      if (selectedTemplate) {
        await axios.put(`http://localhost:3000/api/email/templates/${selectedTemplate}`, payload, { headers });
        toast.success('Template updated');
      } else {
        await axios.post('http://localhost:3000/api/email/templates', payload, { headers });
        toast.success('Template created');
      }
      setShowModal(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error(error.response?.data?.error || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Delete this template? This cannot be undone.')) return;
    try {
      await axios.delete(`http://localhost:3000/api/email/templates/${id}`, { headers });
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handlePreview = (template) => {
    let html = template.html_content || '';
    // Replace with sample data
    html = html.replace(/{{firstName}}/g, 'John');
    html = html.replace(/{{lastName}}/g, 'Doe');
    html = html.replace(/{{email}}/g, 'john.doe@example.com');
    html = html.replace(/{{companyName}}/g, 'Example Corp');
    html = html.replace(/{{phone}}/g, '+1234567890');
    
    setPreviewHtml(html);
    setPreviewModal(true);
  };

  const handleDuplicate = async (template) => {
    try {
      const newTemplate = {
        name: `${template.name} (Copy)`,
        description: template.description,
        subject_template: template.subject_template,
        html_content: template.html_content
      };
      await axios.post('http://localhost:3000/api/email/templates', newTemplate, { headers });
      toast.success('Template duplicated');
      fetchTemplates();
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      subject_template: '',
      html_content: ''
    });
    setSelectedTemplate(null);
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('html_content');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = form.html_content;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setForm({
      ...form,
      html_content: before + `{{${variable}}}` + after
    });

    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + variable.length + 4;
      textarea.focus();
    }, 0);
  };

  const filteredTemplates = templates.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sampleTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #34569D 0%, #81a0ce 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; }
    .button { display: inline-block; padding: 12px 30px; background: #34569D; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Hello {{firstName}}!</h1>
    </div>
    <div class="content">
      <p>Hi {{firstName}} {{lastName}},</p>
      <p>Welcome to our platform! We're excited to have you here.</p>
      <p>Your email: {{email}}</p>
      <a href="#" class="button">Get Started</a>
    </div>
    <div class="footer">
      <p>&copy; 2024 Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

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
            <div className="p-3 bg-gradient-to-br from-brand-accent to-brand-primary rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-accent to-brand-primary bg-clip-text text-transparent">
                Email Templates
              </h1>
              <p className="text-brand-muted dark:text-gray-400 mt-1">
                Create and manage reusable email templates with dynamic variables
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-start gap-3 p-4 bg-brand-accent/5 border border-brand-accent/20 rounded-xl"
      >
        <Sparkles className="w-5 h-5 text-brand-accent mt-0.5 flex-shrink-0" />
        <div className="text-sm text-brand-dark dark:text-brand-white">
          <p className="font-medium mb-1">Dynamic Variables</p>
          <p className="text-brand-muted dark:text-gray-400">
            Use variables like <code className="px-1.5 py-0.5 bg-brand-surface dark:bg-gray-800 rounded text-xs">{`{{firstName}}`}</code>, <code className="px-1.5 py-0.5 bg-brand-surface dark:bg-gray-800 rounded text-xs">{`{{email}}`}</code>, <code className="px-1.5 py-0.5 bg-brand-surface dark:bg-gray-800 rounded text-xs">{`{{companyName}}`}</code> to personalize emails for each recipient.
          </p>
        </div>
      </motion.div>

      {/* Search & Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-brand-surface dark:border-gray-800">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted dark:text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 bg-brand-surface dark:bg-gray-800 border border-transparent rounded-lg text-brand-dark dark:text-brand-white placeholder-brand-muted dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-brand-muted dark:text-gray-400">Loading templates...</p>
              </div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex p-4 bg-brand-surface dark:bg-gray-800 rounded-full mb-4">
                <FileText className="w-8 h-8 text-brand-muted dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-brand-dark dark:text-brand-white mb-2">
                No templates yet
              </h3>
              <p className="text-brand-muted dark:text-gray-400 mb-6">
                Create your first email template to use in campaigns
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-brand-surface/30 dark:bg-gray-800/50 border border-brand-surface dark:border-gray-700 rounded-xl hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-brand-accent/10 rounded-lg">
                      <FileText className="w-5 h-5 text-brand-accent" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePreview(template)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-brand-surface dark:hover:bg-gray-700 rounded-lg text-brand-sky transition-all"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(template)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-brand-surface dark:hover:bg-gray-700 rounded-lg text-brand-primary transition-all"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setForm({
                            name: template.name,
                            description: template.description || '',
                            subject_template: template.subject_template || '',
                            html_content: template.html_content || ''
                          });
                          setShowModal(true);
                        }}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-brand-surface dark:hover:bg-gray-700 rounded-lg text-brand-primary transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-brand-surface dark:hover:bg-gray-700 rounded-lg text-brand-accent transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-brand-dark dark:text-brand-white mb-2 line-clamp-1">
                    {template.name}
                  </h3>
                  
                  {template.description && (
                    <p className="text-sm text-brand-muted dark:text-gray-400 mb-3 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  {template.subject_template && (
                    <div className="mb-3 p-2 bg-brand-surface dark:bg-gray-800 rounded text-xs">
                      <p className="text-brand-muted dark:text-gray-500 mb-1">Subject:</p>
                      <p className="text-brand-dark dark:text-brand-white line-clamp-1">
                        {template.subject_template}
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-brand-surface dark:border-gray-700">
                    <p className="text-xs text-brand-muted dark:text-gray-400">
                      Updated {new Date(template.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Create/Edit Template Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-brand-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-brand-accent to-brand-primary p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedTemplate ? 'Edit Template' : 'Create New Template'}
                    </h2>
                    <p className="text-white/80 text-sm mt-1">
                      Design your email template with HTML and dynamic variables
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveTemplate} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                      Template Name <span className="text-brand-accent">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2 bg-brand-surface dark:bg-gray-800 border border-brand-surface dark:border-gray-700 rounded-lg text-brand-dark dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      placeholder="e.g., Welcome Email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                      Subject Template
                    </label>
                    <input
                      type="text"
                      value={form.subject_template}
                      onChange={(e) => setForm({ ...form, subject_template: e.target.value })}
                      className="w-full px-4 py-2 bg-brand-surface dark:bg-gray-800 border border-brand-surface dark:border-gray-700 rounded-lg text-brand-dark dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      placeholder="Welcome {`{{firstName}}`}!"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 bg-brand-surface dark:bg-gray-800 border border-brand-surface dark:border-gray-700 rounded-lg text-brand-dark dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                    placeholder="Describe this template..."
                  />
                </div>

                {/* Variable Buttons */}
                <div>
                  <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                    Available Variables
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['firstName', 'lastName', 'email', 'companyName', 'phone'].map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => insertVariable(variable)}
                        className="px-3 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-lg text-sm font-mono transition-colors"
                      >
                        {`{{${variable}}}`}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-brand-muted dark:text-gray-500 mt-2">
                    Click to insert variables into your HTML content
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-brand-dark dark:text-brand-white">
                      HTML Content <span className="text-brand-accent">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, html_content: sampleTemplate })}
                      className="text-xs text-brand-primary hover:text-brand-sky transition-colors flex items-center gap-1"
                    >
                      <Code className="w-3 h-3" />
                      Use Sample Template
                    </button>
                  </div>
                  <textarea
                    id="html_content"
                    required
                    value={form.html_content}
                    onChange={(e) => setForm({ ...form, html_content: e.target.value })}
                    rows={15}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-lg text-brand-dark dark:text-brand-white focus:outline-none focus:ring-2 resize-none font-mono text-sm ${
                      form.html_content && form.html_content.trim() !== ''
                        ? 'border-brand-surface dark:border-gray-700 focus:ring-brand-primary'
                        : 'border-brand-accent/50 focus:ring-brand-accent'
                    }`}
                    placeholder="Paste your HTML email template here... (Required)"
                  />
                  <p className="text-xs text-brand-muted dark:text-gray-500 mt-1">
                    HTML content is required. Click "Use Sample Template" to get started with a basic template.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-brand-surface dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 bg-brand-surface dark:bg-gray-800 text-brand-dark dark:text-brand-white rounded-lg hover:bg-brand-surface/70 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors font-medium inline-flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {selectedTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-brand-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="bg-gradient-to-r from-brand-primary to-brand-sky p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    <h2 className="text-xl font-bold">Template Preview</h2>
                  </div>
                  <button
                    onClick={() => setPreviewModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-white/80 text-sm mt-1">
                  Preview with sample data
                </p>
              </div>

              <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto bg-gray-50 dark:bg-gray-800">
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-4">
                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

