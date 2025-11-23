import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Settings, Trash2, Calendar, Phone, MessageSquare, Edit, Power, PowerOff, Zap, TrendingUp, Boxes, Copy, Check } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  useEffect(() => {
    fetchAgent();
  }, [id]);

  const fetchAgent = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/agents/${id}`);
      setAgent(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching agent:', error);
      toast.error('Failed to load agent');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this agent?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3000/api/agents/${id}`);
      toast.success('Agent deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = agent.status === 'active' ? 'paused' : 'active';
    
    try {
      const updateData = {
        name: agent.name,
        type: agent.type,
        systemPrompt: agent.system_prompt,
        description: agent.description,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.max_tokens,
        status: newStatus,
        voiceSettings: agent.voice_settings,
        twilioConfig: agent.twilio_config,
        functions: agent.functions || []
      };

      await axios.put(`http://localhost:3000/api/agents/${id}`, updateData);
      setAgent(prev => ({ ...prev, status: newStatus }));
      toast.success(`Agent ${newStatus === 'active' ? 'activated' : 'paused'} successfully`);
    } catch (error) {
      console.error('Error updating agent status:', error);
      toast.error('Failed to update agent status');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(agent.system_prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
    toast.success('Prompt copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-slate-200 border-t-[#34569D] rounded-full"
        />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Agent Not Found</h2>
        <p className="text-gray-600 mb-6">The agent you're looking for doesn't exist</p>
        <Link to="/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const brandColors = {
    primary: '#34569D',
    secondary: '#3f6293',
    accent: '#d3976a',
    sky: '#81a0ce',
    light: '#cbe3ff',
    surface: '#dfe2ec',
    muted: '#756569',
    dark: '#1e1e24'
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 pb-16">
      <div className="max-w-full mx-auto px-4 py-8">
        
        {/* Header Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white/50 transition-all duration-300 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>

          {/* Action Buttons */}
          <motion.div 
            className="flex gap-3 flex-wrap justify-end"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link 
              to={`/dashboard/agent/${id}/test`} 
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 text-[#1e1e24] shadow-lg hover:shadow-xl"
              style={{ backgroundColor: '#dfe2ec', border: `1px solid #dfe2ec` }}
            >
              <Play className="w-4 h-4" />
              <span>Test Agent</span>
            </Link>
            <Link 
              to={`/dashboard/agent/${id}/edit`} 
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 bg-[#dfe2ec] text-gray-700 border border-gray-200 shadow-md hover:shadow-lg hover:border-gray-300"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </Link>
            <button
              onClick={handleToggleStatus}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 bg-white border shadow-md hover:shadow-lg"
              style={{
                borderColor: agent.status === 'active' ? '#ea580c' : '#16a34a',
                color: agent.status === 'active' ? '#ea580c' : '#16a34a'
              }}
            >
              {agent.status === 'active' ? (
                <>
                  <PowerOff className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Power className="w-4 h-4" />
                  <span>Activate</span>
                </>
              )}
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 bg-white text-red-600 border border-red-200 shadow-md hover:shadow-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </motion.div>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 rounded-2xl shadow-xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${brandColors.primary} 10%, ${brandColors.secondary} 100%)`
          }}
        >
          <div className="px-8 py-10 relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20" style={{ backgroundColor: brandColors.accent, filter: 'blur(40px)' }} />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-20" style={{ backgroundColor: brandColors.light, filter: 'blur(40px)' }} />
            
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-start space-x-6 flex-1">
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="p-5 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex-shrink-0"
                >
                  {agent.type === 'voice_call' ? (
                    <Phone className="w-10 h-10 text-white" />
                  ) : (
                    <MessageSquare className="w-10 h-10 text-white" />
                  )}
                </motion.div>
                
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2">{agent.name}</h1>
                  <p className="text-blue-100 text-lg font-medium mb-3">
                    {agent.type === 'voice_call' ? '📞 Voice Call Agent' : '💬 Chatbot Agent'}
                  </p>
                  {agent.description && (
                    <p className="text-blue-50 leading-relaxed max-w-3xl">{agent.description}</p>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-6 py-3 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm flex-shrink-0"
                style={{
                  backgroundColor: agent.status === 'active' ? '#dcfce7' : agent.status === 'paused' ? '#fef3c7' : '#f1f5f9',
                  color: agent.status === 'active' ? '#166534' : agent.status === 'paused' ? '#92400e' : '#475569'
                }}
              >
                {agent.status === 'active' ? '🟢 Active' : agent.status === 'paused' ? '⏸️ Paused' : '📋 Draft'}
              </motion.span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
     

        {/* Two Column Layout: Left (Prompt) and Right (Configuration) */}
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">
          {/* Left Column: System Prompt (Full Height) */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 rounded-xl shadow-lg overflow-hidden bg-white border border-slate-100 hover:shadow-xl transition-shadow duration-300 flex flex-col"
          >
            <div className="p-6 border-b border-slate-100" style={{ borderTop: `2px solid ${brandColors.accent}` }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center" style={{ color: brandColors.accent }}>
                  <MessageSquare className="w-5 h-5 mr-2" />
                  System Prompt
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copy prompt"
                >
                  {copiedPrompt ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </motion.button>
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {agent.system_prompt?.length || 0} characters
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="rounded-lg p-4" style={{ backgroundColor: brandColors.dark + '08', border: `1px solid ${brandColors.light}` }}>
                <p className="text-sm font-mono text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                  {agent.system_prompt}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Configuration and Voice Settings */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Model Configuration */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl shadow-lg overflow-hidden bg-white border border-slate-100 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="p-6" style={{ borderTop: `2px solid ${brandColors.primary}` }}>
                <h3 className="text-lg font-bold mb-6 flex items-center" style={{ color: brandColors.primary }}>
                  <Settings className="w-5 h-5 mr-2" />
                  Model Configuration
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border border-slate-100" style={{ backgroundColor: brandColors.light + '30' }}>
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Model</span>
                    <p className="font-bold mt-2" style={{ color: brandColors.primary }}>{agent.model}</p>
                  </div>
                  <div className="p-4 rounded-lg border border-slate-100" style={{ backgroundColor: brandColors.sky + '30' }}>
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Temperature</span>
                    <p className="font-bold mt-2" style={{ color: brandColors.secondary }}>{agent.temperature}</p>
                  </div>
                  <div className="p-4 rounded-lg border border-slate-100" style={{ backgroundColor: brandColors.accent + '20' }}>
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Max Tokens</span>
                    <p className="font-bold mt-2" style={{ color: brandColors.accent }}>{agent.max_tokens}</p>
                  </div>
                </div>
              </div>
            </motion.div>

               <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <motion.div variants={itemVariants} className="rounded-xl shadow-lg overflow-hidden bg-white border border-slate-100 hover:shadow-xl transition-shadow duration-300">
            <div className="p-6" style={{ borderTop: `2px solid ${brandColors.primary}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Conversations</span>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                  <Zap className="w-5 h-5" style={{ color: brandColors.accent }} />
                </motion.div>
              </div>
              <p className="text-3xl font-bold" style={{ color: brandColors.primary }}>{agent.conversations_count || 0}</p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-xl shadow-lg overflow-hidden bg-white border border-slate-100 hover:shadow-xl transition-shadow duration-300">
            <div className="p-6" style={{ borderTop: `2px solid ${brandColors.accent}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Success Rate</span>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-600">{agent.success_rate || 0}%</p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-xl shadow-lg overflow-hidden bg-white border border-slate-100 hover:shadow-xl transition-shadow duration-300">
            <div className="p-6" style={{ borderTop: `2px solid ${brandColors.sky}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Functions</span>
                <Boxes className="w-5 h-5" style={{ color: brandColors.sky }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: brandColors.secondary }}>{agent.functions?.length || 0}</p>
            </div>
          </motion.div>
        </motion.div>

            {/* Functions Section */}
            {agent.functions && agent.functions.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="rounded-xl shadow-lg overflow-hidden bg-white border border-slate-100 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="p-6" style={{ borderTop: `2px solid ${brandColors.sky}` }}>
                  <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: brandColors.sky }}>
                    <Boxes className="w-5 h-5 mr-2" />
                    Configured Functions ({agent.functions.length})
                  </h3>
                  <div className="space-y-3">
                    {agent.functions.map((func, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ x: 4 }}
                        className="flex items-center space-x-4 p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-300"
                        style={{ backgroundColor: brandColors.light + '20' }}
                      >
                        <div 
                          className="flex-shrink-0 p-2 rounded-lg"
                          style={{ backgroundColor: func.type === 'cal_com' ? brandColors.primary + '20' : brandColors.accent + '20' }}
                        >
                          {func.type === 'cal_com' ? (
                            <Calendar className="w-4 h-4" style={{ color: brandColors.primary }} />
                          ) : (
                            <Settings className="w-4 h-4" style={{ color: brandColors.accent }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm">{func.name}</h4>
                          <p className="text-xs text-gray-600 truncate">{func.description}</p>
                        </div>
                        <span 
                          className="text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap flex-shrink-0"
                          style={{ backgroundColor: brandColors.primary + '20', color: brandColors.primary }}
                        >
                          {func.type === 'cal_com' ? '📅' : '⚙️'}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Voice Settings */}
            {agent.type === 'voice_call' && agent.voiceSettings && (
              <motion.div
                variants={itemVariants}
                className="rounded-xl shadow-lg overflow-hidden bg-white border border-slate-100 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="p-6" style={{ borderTop: `2px solid ${brandColors.primary}` }}>
                  <h3 className="text-lg font-bold mb-5 flex items-center" style={{ color: brandColors.primary }}>
                    <Phone className="w-5 h-5 mr-2" />
                    Voice Settings
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="p-3 rounded-lg border border-slate-100" style={{ backgroundColor: brandColors.light + '30' }}>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Voice ID</span>
                      <p className="font-bold mt-2 text-sm" style={{ color: brandColors.primary }}>{agent.voiceSettings.voiceId}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-100" style={{ backgroundColor: brandColors.sky + '30' }}>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Speed</span>
                      <p className="font-bold mt-2 text-sm" style={{ color: brandColors.secondary }}>{agent.voiceSettings.speed}x</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-100" style={{ backgroundColor: brandColors.accent + '20' }}>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Stability</span>
                      <p className="font-bold mt-2 text-sm" style={{ color: brandColors.accent }}>{agent.voiceSettings.stability}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-100" style={{ backgroundColor: brandColors.light + '30' }}>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Similarity</span>
                      <p className="font-bold mt-2 text-sm" style={{ color: brandColors.primary }}>{agent.voiceSettings.similarityBoost}</p>
                    </div>
                  </div>

                  {agent.voiceSettings.greeting && (
                    <div className="p-4 rounded-lg border-l-4" style={{ borderColor: brandColors.accent, backgroundColor: brandColors.light + '40', borderTop: `1px solid ${brandColors.light}`, borderRight: `1px solid ${brandColors.light}`, borderBottom: `1px solid ${brandColors.light}` }}>
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Greeting Message</span>
                      <p className="mt-2 text-sm text-gray-800 leading-relaxed">{agent.voiceSettings.greeting}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AgentDetail;