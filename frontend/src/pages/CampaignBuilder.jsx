import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Send, Eye, Save, Mail,
  Users, FileText, CheckCircle2, Info, Sparkles, AlertCircle, Calendar, Clock, Wand2, Loader2, Target, X, Sliders
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import StepIndicator from '../components/StepIndicator';

export default function CampaignBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isEditMode = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [lists, setLists] = useState([]);
  const [previewHtml, setPreviewHtml] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showABTestModal, setShowABTestModal] = useState(false);
  const [abTestData, setABTestData] = useState({
    name: '',
    subject_a: '',
    subject_b: '',
    html_content_a: '',
    html_content_b: '',
    split_percentage: 50
  });

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    template_id: '',
    selectedLists: [],
    scheduled_at: null
  });

  const steps = [
    { id: 1, name: 'Details', description: 'Campaign info' },
    { id: 2, name: 'Template', description: 'Choose template' },
    { id: 3, name: 'Recipients', description: 'Select lists' },
    { id: 4, name: 'Review', description: 'Preview & send' }
  ];

  useEffect(() => {
    fetchTemplates();
    fetchLists();
    if (isEditMode) {
      fetchCampaign();
    }
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/email/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(res.data || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const fetchLists = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/email/lists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLists(res.data || []);
    } catch (error) {
      console.error('Failed to fetch lists:', error);
      toast.error('Failed to load contact lists');
    }
  };

  const fetchCampaign = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/email/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const campaign = res.data;
      setFormData({
        name: campaign.name || '',
        subject: campaign.subject || '',
        template_id: campaign.template_id || '',
        selectedLists: [], // Would need to fetch campaign lists
        scheduled_at: campaign.scheduled_at ? new Date(campaign.scheduled_at).toISOString().slice(0, 16) : null
      });
    } catch (error) {
      console.error('Failed to fetch campaign:', error);
      toast.error('Failed to load campaign');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleList = (listId) => {
    setFormData(prev => ({
      ...prev,
      selectedLists: prev.selectedLists.includes(listId)
        ? prev.selectedLists.filter(id => id !== listId)
        : [...prev.selectedLists, listId]
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          toast.error('Campaign name is required');
          return false;
        }
        if (!formData.subject.trim()) {
          toast.error('Email subject is required');
          return false;
        }
        return true;
      case 2:
        if (!formData.template_id) {
          toast.error('Please select a template');
          return false;
        }
        return true;
      case 3:
        if (formData.selectedLists.length === 0) {
          toast.error('Please select at least one contact list');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2 && formData.template_id) {
        // Generate preview when moving from template step
        generatePreview();
      }
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const generatePreview = async () => {
    try {
      const template = templates.find(t =>
        t.id === formData.template_id || t.id.toString() === formData.template_id
      );
      if (!template) return;

      // Simple preview with placeholder data
      let html = template.html_content || '';
      html = html.replace(/{{firstName}}/g, 'John');
      html = html.replace(/{{lastName}}/g, 'Doe');
      html = html.replace(/{{email}}/g, 'john.doe@example.com');
      html = html.replace(/{{companyName}}/g, 'Example Corp');

      setPreviewHtml(html);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  };

  const saveDraft = async () => {
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        subject: formData.subject,
        template_id: formData.template_id || null,
        status: 'draft'
      };

      if (isEditMode) {
        await axios.put(`http://localhost:3000/api/email/campaigns/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Campaign draft saved');
      } else {
        const res = await axios.post('http://localhost:3000/api/email/campaigns', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Campaign draft created');
        navigate(`/dashboard/email/campaigns/${res.data.id}`);
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const sendCampaign = async (schedule = false) => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      toast.error('Please complete all required fields');
      return;
    }

    // Validate scheduling
    if (schedule && !formData.scheduled_at) {
      toast.error('Please select a date and time to schedule the campaign');
      return;
    }

    if (schedule && new Date(formData.scheduled_at) <= new Date()) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    setLoading(true);
    try {
      // Create or update campaign
      let campaignId = id;
      const payload = {
        name: formData.name,
        subject: formData.subject,
        template_id: formData.template_id || null,
        status: 'draft'
      };

      if (!campaignId) {
        const res = await axios.post('http://localhost:3000/api/email/campaigns', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        campaignId = res.data.id;
      } else {
        await axios.put(`http://localhost:3000/api/email/campaigns/${campaignId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Validate lists
      if (formData.selectedLists.length === 0) {
        toast.error('Please select at least one contact list');
        setLoading(false);
        return;
      }

      if (schedule) {
        // Schedule the campaign
        const scheduleResponse = await axios.post(
          `http://localhost:3000/api/email/campaigns/${campaignId}/schedule`,
          {
            scheduled_at: formData.scheduled_at,
            listIds: formData.selectedLists
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success(scheduleResponse.data.message || 'Campaign scheduled successfully!');
        navigate('/dashboard/email/campaigns');
      } else {
        // Send immediately
        const sendResponse = await axios.post(
          `http://localhost:3000/api/email/campaigns/${campaignId}/send`,
          { listIds: formData.selectedLists },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success(sendResponse.data.message || 'Campaign sent successfully!');
        navigate('/dashboard/email/campaigns');
      }
    } catch (error) {
      console.error('Failed to send/schedule campaign:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/email/campaigns')}
            className="p-2 hover:bg-brand-surface dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-brand-muted dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-dark dark:text-brand-white">
              {isEditMode ? 'Edit Campaign' : 'Create New Campaign'}
            </h1>
            <p className="text-brand-muted dark:text-gray-400 text-sm">
              Follow the steps to create and send your email campaign
            </p>
          </div>
        </div>

        <button
          onClick={saveDraft}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-700 text-brand-dark dark:text-brand-white rounded-xl hover:bg-brand-surface/50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          Save Draft
        </button>
      </div>

      {/* Step Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-2xl p-8 shadow-sm"
      >
        <StepIndicator steps={steps} currentStep={currentStep} />
      </motion.div>

      {/* Step Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {/* Step 1: Campaign Details */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              <div className="flex items-start gap-3 p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl">
                <Info className="w-5 h-5 text-brand-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-brand-dark dark:text-brand-white flex-1">
                  <p className="font-medium mb-1">Campaign Details</p>
                  <p className="text-brand-muted dark:text-gray-400">
                    Give your campaign a name and create a compelling subject line that will grab your recipients' attention.
                  </p>
                </div>
                <button
                  onClick={() => setShowABTestModal(true)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium text-sm disabled:opacity-50 shadow-lg hover:shadow-xl"
                >
                  <Target className="w-4 h-4" />
                  Create A/B Test
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                    Campaign Name <span className="text-brand-accent">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Summer Sale 2024"
                    className="w-full px-4 py-3 bg-brand-white dark:bg-gray-800 border border-brand-surface dark:border-gray-700 rounded-xl text-brand-dark dark:text-brand-white placeholder-brand-muted dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                  />
                  <p className="text-xs text-brand-muted dark:text-gray-500 mt-1">
                    Internal name to help you identify this campaign
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-brand-dark dark:text-brand-white">
                      Email Subject <span className="text-brand-accent">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        const userPrompt = window.prompt('Describe your email campaign (e.g., "Summer sale with 50% off all products"):');
                        if (!userPrompt || !userPrompt.trim()) return;

                        setAiGenerating(true);
                        try {
                          const res = await axios.post('http://localhost:3000/api/email/ai/generate-subject',
                            { prompt: userPrompt },
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          handleChange('subject', res.data.subject);
                          toast.success('Subject line generated!');
                        } catch (error) {
                          toast.error(error.response?.data?.message || 'Failed to generate subject');
                        } finally {
                          setAiGenerating(false);
                        }
                      }}
                      disabled={aiGenerating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-primary hover:text-brand-sky bg-brand-primary/10 hover:bg-brand-primary/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {aiGenerating ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3 h-3" />
                          AI Generate
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    placeholder="e.g., Don't miss our summer deals! 🌞"
                    className="w-full px-4 py-3 bg-brand-white dark:bg-gray-800 border border-brand-surface dark:border-gray-700 rounded-xl text-brand-dark dark:text-brand-white placeholder-brand-muted dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                  />
                  <p className="text-xs text-brand-muted dark:text-gray-500 mt-1">
                    This will be shown in your recipients' inbox
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Template Selection */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              <div className="flex items-start gap-3 p-4 bg-brand-sky/5 border border-brand-sky/20 rounded-xl">
                <Sparkles className="w-5 h-5 text-brand-sky mt-0.5 flex-shrink-0" />
                <div className="text-sm text-brand-dark dark:text-brand-white flex-1">
                  <p className="font-medium mb-1">Choose Your Template</p>
                  <p className="text-brand-muted dark:text-gray-400">
                    Select an email template to use for this campaign. Templates support dynamic variables like {`{{firstName}}`} and {`{{email}}`}.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const userPrompt = window.prompt('Describe your email campaign (e.g., "Promotional email for summer sale with 50% discount"):');
                    if (!userPrompt || !userPrompt.trim()) return;

                    setAiGenerating(true);
                    try {
                      const res = await axios.post('http://localhost:3000/api/email/ai/generate-content',
                        { prompt: userPrompt },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );

                      // Create a new template with AI-generated content
                      const templateRes = await axios.post('http://localhost:3000/api/email/templates', {
                        name: `AI Generated - ${new Date().toLocaleDateString()}`,
                        description: `AI-generated template: ${userPrompt}`,
                        html_content: res.data.html,
                        subject_template: formData.subject || 'AI Generated Subject'
                      }, { headers: { Authorization: `Bearer ${token}` } });

                      // Refresh templates and select the new one
                      await fetchTemplates();
                      handleChange('template_id', templateRes.data.id.toString());
                      toast.success('AI template created and selected!');
                    } catch (error) {
                      toast.error(error.response?.data?.message || 'Failed to generate template');
                    } finally {
                      setAiGenerating(false);
                    }
                  }}
                  disabled={aiGenerating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-sky text-white rounded-xl hover:opacity-90 transition-opacity font-medium text-sm disabled:opacity-50"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate with AI
                    </>
                  )}
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 bg-brand-surface dark:bg-gray-800 rounded-full mb-4">
                    <FileText className="w-8 h-8 text-brand-muted dark:text-gray-500" />
                  </div>
                  <p className="text-brand-muted dark:text-gray-400 mb-4">
                    No templates available. Create a template first.
                  </p>
                  <button
                    onClick={() => navigate('/dashboard/email/templates/new')}
                    className="btn-primary"
                  >
                    Create Template
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <motion.div
                      key={template.id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.template_id === template.id.toString()
                        ? 'border-brand-primary bg-brand-primary/5'
                        : 'border-brand-surface dark:border-gray-700 hover:border-brand-primary/50'
                        }`}
                      onClick={() => handleChange('template_id', template.id.toString())}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${formData.template_id === template.id.toString()
                          ? 'bg-brand-primary text-white'
                          : 'bg-brand-surface dark:bg-gray-800 text-brand-muted'
                          }`}>
                          {formData.template_id === template.id.toString() ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <FileText className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-brand-dark dark:text-brand-white truncate">
                            {template.name}
                          </h3>
                          {template.description && (
                            <p className="text-sm text-brand-muted dark:text-gray-400 mt-1 line-clamp-2">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Recipients */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              <div className="flex items-start gap-3 p-4 bg-brand-accent/5 border border-brand-accent/20 rounded-xl">
                <Users className="w-5 h-5 text-brand-accent mt-0.5 flex-shrink-0" />
                <div className="text-sm text-brand-dark dark:text-brand-white">
                  <p className="font-medium mb-1">Select Recipients</p>
                  <p className="text-brand-muted dark:text-gray-400">
                    Choose which contact lists should receive this campaign. You can select multiple lists.
                  </p>
                </div>
              </div>

              {/* Selected Template Summary */}
              {formData.template_id && (() => {
                const selectedTemplate = templates.find(t => t.id === formData.template_id || t.id.toString() === formData.template_id);
                return selectedTemplate ? (
                  <div className="p-4 bg-brand-sky/5 border border-brand-sky/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-brand-sky/10 rounded-lg">
                        <FileText className="w-5 h-5 text-brand-sky" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-brand-muted dark:text-gray-400 mb-1">Selected Template</p>
                        <h3 className="font-semibold text-brand-dark dark:text-brand-white mb-1">
                          {selectedTemplate.name}
                        </h3>
                        {selectedTemplate.description && (
                          <p className="text-sm text-brand-muted dark:text-gray-400">
                            {selectedTemplate.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {lists.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 bg-brand-surface dark:bg-gray-800 rounded-full mb-4">
                    <Users className="w-8 h-8 text-brand-muted dark:text-gray-500" />
                  </div>
                  <p className="text-brand-muted dark:text-gray-400 mb-4">
                    No contact lists available. Create a list and add contacts first.
                  </p>
                  <button
                    onClick={() => navigate('/dashboard/email/contacts')}
                    className="btn-primary"
                  >
                    Manage Contacts
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {lists.map((list) => (
                    <motion.div
                      key={list.id}
                      whileHover={{ scale: 1.01 }}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.selectedLists.includes(list.id)
                        ? 'border-brand-primary bg-brand-primary/5'
                        : 'border-brand-surface dark:border-gray-700 hover:border-brand-primary/50'
                        }`}
                      onClick={() => toggleList(list.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${formData.selectedLists.includes(list.id)
                          ? 'bg-brand-primary text-white'
                          : 'bg-brand-surface dark:bg-gray-800 text-brand-muted'
                          }`}>
                          {formData.selectedLists.includes(list.id) ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Users className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-brand-dark dark:text-brand-white">
                            {list.name}
                          </h3>
                          {list.description && (
                            <p className="text-sm text-brand-muted dark:text-gray-400">
                              {list.description}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-brand-muted dark:text-gray-400">
                          {list.contact_count || 0} contacts
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Review & Send */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-brand-dark dark:text-brand-white">
                  <p className="font-medium mb-1">Ready to Send</p>
                  <p className="text-brand-muted dark:text-gray-400">
                    Review your campaign details below and send when ready.
                  </p>
                </div>
              </div>

              {/* Campaign Summary */}
              <div className="space-y-4">
                <div className="p-4 bg-brand-surface/30 dark:bg-gray-800/50 rounded-xl">
                  <h3 className="font-semibold text-brand-dark dark:text-brand-white mb-3">
                    Campaign Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-brand-muted dark:text-gray-400">Campaign Name</p>
                      <p className="font-medium text-brand-dark dark:text-brand-white">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-brand-muted dark:text-gray-400">Subject Line</p>
                      <p className="font-medium text-brand-dark dark:text-brand-white">{formData.subject}</p>
                    </div>
                    <div>
                      <p className="text-brand-muted dark:text-gray-400">Template</p>
                      <p className="font-medium text-brand-dark dark:text-brand-white">
                        {templates.find(t =>
                          t.id === formData.template_id || t.id.toString() === formData.template_id
                        )?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-brand-muted dark:text-gray-400">Recipient Lists</p>
                      <p className="font-medium text-brand-dark dark:text-brand-white">
                        {formData.selectedLists.length} list(s)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Scheduling Option */}
                <div className="p-4 bg-brand-sky/5 border border-brand-sky/20 rounded-xl">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-brand-sky/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-brand-sky" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-brand-dark dark:text-brand-white mb-1">
                        Schedule Campaign (Optional)
                      </h3>
                      <p className="text-sm text-brand-muted dark:text-gray-400">
                        Send now or schedule for later
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.scheduled_at !== null}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            setFormData(prev => ({ ...prev, scheduled_at: null }));
                          } else {
                            // Set default to 1 hour from now
                            const defaultTime = new Date();
                            defaultTime.setHours(defaultTime.getHours() + 1);
                            setFormData(prev => ({ ...prev, scheduled_at: defaultTime.toISOString().slice(0, 16) }));
                          }
                        }}
                        className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary"
                      />
                      <span className="text-sm text-brand-dark dark:text-brand-white">
                        Schedule for later
                      </span>
                    </label>

                    {formData.scheduled_at && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-brand-muted" />
                        <input
                          type="datetime-local"
                          value={formData.scheduled_at}
                          onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                          min={new Date().toISOString().slice(0, 16)}
                          className="px-3 py-2 bg-brand-white dark:bg-gray-800 border border-brand-surface dark:border-gray-700 rounded-lg text-brand-dark dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                      </div>
                    )}

                    {formData.scheduled_at && (
                      <p className="text-xs text-brand-muted dark:text-gray-400">
                        Campaign will be sent on: {new Date(formData.scheduled_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-brand-dark dark:text-brand-white">
                      Email Preview
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-brand-muted dark:text-gray-400">
                      <Eye className="w-3 h-3" />
                      <span>Preview with sample data</span>
                    </div>
                  </div>
                  <div className="border border-brand-surface dark:border-gray-700 rounded-xl overflow-hidden">
                    <div className="bg-brand-surface/50 dark:bg-gray-800 p-3 border-b border-brand-surface dark:border-gray-700">
                      <p className="text-xs text-brand-muted dark:text-gray-400">Subject:</p>
                      <p className="font-medium text-brand-dark dark:text-brand-white">{formData.subject}</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-900 max-h-96 overflow-y-auto">
                      {previewHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                      ) : (
                        <p className="text-brand-muted dark:text-gray-400">
                          Preview not available
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 bg-brand-surface/30 dark:bg-gray-800/50 border-t border-brand-surface dark:border-gray-800">
          <div className="flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="inline-flex items-center gap-2 px-4 py-2 text-brand-dark dark:text-brand-white hover:bg-brand-surface dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep === 4 && (
              <button
                onClick={() => {
                  const email = prompt('Enter email address for test:');
                  if (email) {
                    setLoading(true);
                    axios.post(`http://localhost:3000/api/email/campaigns/${id}/test`, { testEmail: email }, {
                      headers: { Authorization: `Bearer ${token}` }
                    })
                      .then(() => toast.success(`Test email sent to ${email}`))
                      .catch(err => toast.error(err.response?.data?.message || 'Failed to send test email'))
                      .finally(() => setLoading(false));
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-surface dark:bg-gray-700 hover:bg-brand-surface/80 dark:hover:bg-gray-600 text-brand-dark dark:text-brand-white rounded-xl transition-colors border border-brand-surface dark:border-gray-600"
              >
                <Mail className="w-4 h-4" />
                Send Test Email
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-brand-muted dark:text-gray-400">
              Step {currentStep} of {steps.length}
            </span>
          </div>

          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl transition-colors font-medium"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {formData.scheduled_at ? (
                <button
                  onClick={() => sendCampaign(true)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-brand-sky hover:bg-brand-sky/90 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Schedule Campaign
                    </>
                  )}
                </button>
              ) : null}
              <button
                onClick={() => sendCampaign(false)}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Now
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* A/B Test Creation Modal */}
      <AnimatePresence>
        {showABTestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowABTestModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-brand-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Create A/B Test Campaign</h2>
                      <p className="text-white/90 text-sm mt-1">
                        Test two variations to see which performs better
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowABTestModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!abTestData.name || !abTestData.subject_a || !abTestData.subject_b) {
                    toast.error('Please fill in all required fields');
                    return;
                  }

                  setLoading(true);
                  try {
                    const res = await axios.post(
                      'http://localhost:3000/api/email/campaigns/ab-test',
                      {
                        name: abTestData.name,
                        subject_a: abTestData.subject_a,
                        subject_b: abTestData.subject_b,
                        html_content_a: abTestData.html_content_a || '<p>Variation A</p>',
                        html_content_b: abTestData.html_content_b || '<p>Variation B</p>',
                        split_percentage: abTestData.split_percentage
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    toast.success('A/B test campaign created!');
                    setShowABTestModal(false);
                    navigate(`/dashboard/email/campaigns/${res.data.id}`);
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to create A/B test');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="p-6 space-y-6 max-h-[70vh] overflow-y-auto"
              >
                {/* Campaign Name */}
                <div>
                  <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                    Campaign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={abTestData.name}
                    onChange={(e) => setABTestData({ ...abTestData, name: e.target.value })}
                    placeholder="e.g., Summer Sale A/B Test"
                    className="w-full px-4 py-3 bg-brand-white dark:bg-gray-800 border border-brand-surface dark:border-gray-700 rounded-xl text-brand-dark dark:text-brand-white placeholder-brand-muted dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    required
                  />
                </div>

                {/* Split Percentage */}
                <div>
                  <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                    Split Percentage: <span className="text-purple-600 dark:text-purple-400 font-bold">{abTestData.split_percentage}%</span> to Variation A, <span className="text-pink-600 dark:text-pink-400 font-bold">{100 - abTestData.split_percentage}%</span> to Variation B
                  </label>
                  <div className="flex items-center gap-4">
                    <Sliders className="w-5 h-5 text-brand-muted" />
                    <input
                      type="range"
                      min="10"
                      max="90"
                      step="5"
                      value={abTestData.split_percentage}
                      onChange={(e) => setABTestData({ ...abTestData, split_percentage: parseInt(e.target.value) })}
                      className="flex-1 h-2 bg-brand-surface dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                  <p className="text-xs text-brand-muted dark:text-gray-500 mt-2">
                    Adjust how many recipients receive each variation
                  </p>
                </div>

                {/* Variation A */}
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="px-3 py-1 bg-purple-500 text-white rounded-lg font-semibold text-sm">
                      Variation A
                    </div>
                    <span className="text-xs text-brand-muted dark:text-gray-400">
                      {abTestData.split_percentage}% of recipients
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                        Subject Line <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={abTestData.subject_a}
                        onChange={(e) => setABTestData({ ...abTestData, subject_a: e.target.value })}
                        placeholder="e.g., Don't miss our summer sale! 🌞"
                        className="w-full px-4 py-3 bg-brand-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-xl text-brand-dark dark:text-brand-white placeholder-brand-muted dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                        HTML Content <span className="text-xs text-brand-muted">(Optional - leave empty to use template)</span>
                      </label>
                      <textarea
                        value={abTestData.html_content_a}
                        onChange={(e) => setABTestData({ ...abTestData, html_content_a: e.target.value })}
                        placeholder="<p>Your HTML content here...</p>"
                        rows="4"
                        className="w-full px-4 py-3 bg-brand-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-xl text-brand-dark dark:text-brand-white placeholder-brand-muted dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-mono text-sm"
                      />
                      <p className="text-xs text-brand-muted dark:text-gray-500 mt-1">
                        Supports Handlebars variables like {`{{firstName}}`}, {`{{email}}`}, etc.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Variation B */}
                <div className="p-4 bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-200 dark:border-pink-800 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="px-3 py-1 bg-pink-500 text-white rounded-lg font-semibold text-sm">
                      Variation B
                    </div>
                    <span className="text-xs text-brand-muted dark:text-gray-400">
                      {100 - abTestData.split_percentage}% of recipients
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                        Subject Line <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={abTestData.subject_b}
                        onChange={(e) => setABTestData({ ...abTestData, subject_b: e.target.value })}
                        placeholder="e.g., Summer Sale: Up to 50% Off! 🎉"
                        className="w-full px-4 py-3 bg-brand-white dark:bg-gray-800 border border-pink-300 dark:border-pink-700 rounded-xl text-brand-dark dark:text-brand-white placeholder-brand-muted dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                        HTML Content <span className="text-xs text-brand-muted">(Optional - leave empty to use template)</span>
                      </label>
                      <textarea
                        value={abTestData.html_content_b}
                        onChange={(e) => setABTestData({ ...abTestData, html_content_b: e.target.value })}
                        placeholder="<p>Your HTML content here...</p>"
                        rows="4"
                        className="w-full px-4 py-3 bg-brand-white dark:bg-gray-800 border border-pink-300 dark:border-pink-700 rounded-xl text-brand-dark dark:text-brand-white placeholder-brand-muted dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all font-mono text-sm"
                      />
                      <p className="text-xs text-brand-muted dark:text-gray-500 mt-1">
                        Supports Handlebars variables like {`{{firstName}}`}, {`{{email}}`}, etc.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-brand-sky/10 border border-brand-sky/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-brand-sky mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-brand-dark dark:text-brand-white">
                      <p className="font-medium mb-1">How A/B Testing Works</p>
                      <ul className="list-disc list-inside space-y-1 text-brand-muted dark:text-gray-400 text-xs">
                        <li>Recipients are automatically split between the two variations</li>
                        <li>Open rates and click rates are tracked separately for each variation</li>
                        <li>After sending, you can view results and see which variation performed better</li>
                        <li>The winning variation is determined by the highest open rate</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-surface dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowABTestModal(false)}
                    className="px-6 py-2.5 bg-brand-surface dark:bg-gray-800 text-brand-dark dark:text-brand-white rounded-xl hover:bg-brand-surface/80 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !abTestData.name || !abTestData.subject_a || !abTestData.subject_b}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4" />
                        Create A/B Test
                      </>
                    )}
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


