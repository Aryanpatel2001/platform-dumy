import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, Send, Users, FileText, Plus, TrendingUp, 
  Eye, MousePointerClick, XCircle, CheckCircle2, 
  Clock, ArrowRight, Info, Sparkles
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function EmailDashboard() {
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalContacts: 0,
    totalTemplates: 0,
    recentCampaigns: []
  });
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch campaigns, contacts, and templates
      const [campaignsRes, contactsRes, templatesRes] = await Promise.all([
        axios.get('http://localhost:3000/api/email/campaigns', { headers }),
        axios.get('http://localhost:3000/api/email/contacts', { headers }),
        axios.get('http://localhost:3000/api/email/templates', { headers })
      ]);

      const campaigns = campaignsRes.data || [];
      const recentCampaigns = campaigns
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setStats({
        totalCampaigns: campaigns.length,
        totalContacts: (contactsRes.data || []).length,
        totalTemplates: (templatesRes.data || []).length,
        recentCampaigns
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Campaigns',
      value: stats.totalCampaigns,
      icon: Send,
      color: 'brand-primary',
      bgColor: 'bg-brand-primary/10',
      link: '/dashboard/email/campaigns',
      description: 'View all email campaigns'
    },
    {
      title: 'Total Contacts',
      value: stats.totalContacts,
      icon: Users,
      color: 'brand-sky',
      bgColor: 'bg-brand-sky/10',
      link: '/dashboard/email/contacts',
      description: 'Manage your contact lists'
    },
    {
      title: 'Email Templates',
      value: stats.totalTemplates,
      icon: FileText,
      color: 'brand-accent',
      bgColor: 'bg-brand-accent/10',
      link: '/dashboard/email/templates',
      description: 'Create and edit templates'
    }
  ];

  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', icon: Clock },
      scheduled: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: Clock },
      sending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: TrendingUp },
      sent: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: CheckCircle2 },
      failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: XCircle }
    };
    return badges[status] || badges.draft;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-brand-muted dark:text-gray-400">Loading email dashboard...</p>
        </div>
      </div>
    );
  }

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
            <div className="p-3 bg-gradient-to-br from-brand-primary to-brand-sky rounded-xl">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-sky bg-clip-text text-transparent">
                Email Marketing
              </h1>
              <p className="text-brand-muted dark:text-gray-400 mt-1">
                Create campaigns, manage contacts, and track performance
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/dashboard/email/campaigns/new"
          className="btn-primary inline-flex items-center gap-2 group"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>

      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-brand-primary via-brand-sky to-brand-primary bg-[length:200%_100%] animate-gradient p-6 rounded-2xl shadow-lg text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-xl font-bold">Welcome to Email Marketing</h2>
            </div>
            <p className="text-white/90 max-w-2xl">
              Send personalized campaigns to your contacts with dynamic templates. Track opens, clicks, 
              and engagement in real-time. Build your audience and grow your business.
            </p>
          </div>
          <Info className="w-5 h-5 opacity-70 flex-shrink-0" />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Link
                to={card.link}
                className="block p-6 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`inline-flex p-3 ${card.bgColor} rounded-xl mb-4`}>
                      <Icon className={`w-6 h-6 text-${card.color}`} style={{ color: `var(--color-${card.color}, #34569D)` }} />
                    </div>
                    <p className="text-brand-muted dark:text-gray-400 text-sm mb-1">
                      {card.title}
                    </p>
                    <p className="text-4xl font-bold text-brand-dark dark:text-brand-white mb-2">
                      {card.value}
                    </p>
                    <p className="text-xs text-brand-muted dark:text-gray-500">
                      {card.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-brand-muted dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Campaigns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-brand-surface dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-brand-dark dark:text-brand-white">
                Recent Campaigns
              </h2>
              <p className="text-brand-muted dark:text-gray-400 text-sm mt-1">
                Your latest email campaigns and their performance
              </p>
            </div>
            <Link
              to="/dashboard/email/campaigns"
              className="text-brand-primary hover:text-brand-sky transition-colors text-sm font-medium inline-flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="divide-y divide-brand-surface dark:divide-gray-800">
          {stats.recentCampaigns.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex p-4 bg-brand-surface dark:bg-gray-800 rounded-full mb-4">
                <Mail className="w-8 h-8 text-brand-muted dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-brand-dark dark:text-brand-white mb-2">
                No campaigns yet
              </h3>
              <p className="text-brand-muted dark:text-gray-400 mb-6 max-w-md mx-auto">
                Create your first email campaign to start reaching your audience with personalized messages.
              </p>
              <Link
                to="/dashboard/email/campaigns/new"
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create First Campaign
              </Link>
            </div>
          ) : (
            stats.recentCampaigns.map((campaign) => {
              const badge = getStatusBadge(campaign.status);
              const StatusIcon = badge.icon;
              
              return (
                <Link
                  key={campaign.id}
                  to={`/dashboard/email/campaigns/${campaign.id}`}
                  className="p-6 hover:bg-brand-surface/30 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-brand-dark dark:text-brand-white group-hover:text-brand-primary transition-colors">
                          {campaign.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {campaign.status}
                        </span>
                      </div>
                      
                      {campaign.subject && (
                        <p className="text-sm text-brand-muted dark:text-gray-400 mb-3">
                          {campaign.subject}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-xs text-brand-muted dark:text-gray-500">
                        <div className="flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          <span>{campaign.total_recipients || 0} recipients</span>
                        </div>
                        {campaign.sent_count > 0 && (
                          <>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{campaign.opened_count || 0} opens</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MousePointerClick className="w-3 h-3" />
                              <span>{campaign.clicked_count || 0} clicks</span>
                            </div>
                          </>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-brand-muted dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Link
          to="/dashboard/email/campaigns/new"
          className="p-4 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-xl hover:border-brand-primary dark:hover:border-brand-primary transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-lg group-hover:bg-brand-primary/20 transition-colors">
              <Send className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <p className="font-semibold text-brand-dark dark:text-brand-white">
                Create Campaign
              </p>
              <p className="text-xs text-brand-muted dark:text-gray-400">
                Send emails to your lists
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/email/contacts"
          className="p-4 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-xl hover:border-brand-sky dark:hover:border-brand-sky transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-sky/10 rounded-lg group-hover:bg-brand-sky/20 transition-colors">
              <Users className="w-5 h-5 text-brand-sky" />
            </div>
            <div>
              <p className="font-semibold text-brand-dark dark:text-brand-white">
                Manage Contacts
              </p>
              <p className="text-xs text-brand-muted dark:text-gray-400">
                Add and organize contacts
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/email/templates"
          className="p-4 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-xl hover:border-brand-accent dark:hover:border-brand-accent transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-accent/10 rounded-lg group-hover:bg-brand-accent/20 transition-colors">
              <FileText className="w-5 h-5 text-brand-accent" />
            </div>
            <div>
              <p className="font-semibold text-brand-dark dark:text-brand-white">
                Edit Templates
              </p>
              <p className="text-xs text-brand-muted dark:text-gray-400">
                Design email templates
              </p>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}


