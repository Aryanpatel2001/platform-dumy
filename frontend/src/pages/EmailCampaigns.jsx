import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Send, Plus, Search, Filter, Eye, MousePointerClick,
  Clock, CheckCircle2, XCircle, TrendingUp, ArrowRight,
  Mail, AlertCircle, Info, Target
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { token } = useAuth();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/email/campaigns', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(res.data || []);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

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

  const calculateOpenRate = (campaign) => {
    if (!campaign.sent_count || campaign.sent_count === 0) return 0;
    return ((campaign.opened_count || 0) / campaign.sent_count * 100).toFixed(1);
  };

  const calculateClickRate = (campaign) => {
    if (!campaign.sent_count || campaign.sent_count === 0) return 0;
    return ((campaign.clicked_count || 0) / campaign.sent_count * 100).toFixed(1);
  };

  const filteredCampaigns = campaigns
    .filter(c => {
      const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           c.subject?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const stats = {
    total: campaigns.length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    sent: campaigns.filter(c => c.status === 'sent').length,
    sending: campaigns.filter(c => c.status === 'sending').length
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
            <div className="p-3 bg-gradient-to-br from-brand-primary to-brand-sky rounded-xl">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-sky bg-clip-text text-transparent">
                Email Campaigns
              </h1>
              <p className="text-brand-muted dark:text-gray-400 mt-1">
                View and manage all your email campaigns
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

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Campaigns', value: stats.total, color: 'brand-primary', icon: Send },
          { label: 'Draft', value: stats.draft, color: 'gray-500', icon: Clock },
          { label: 'Sent', value: stats.sent, color: 'green-600', icon: CheckCircle2 },
          { label: 'Sending', value: stats.sending, color: 'yellow-600', icon: TrendingUp }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="p-4 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-muted dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-brand-dark dark:text-brand-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 bg-${stat.color}/10 rounded-lg`}>
                  <Icon className={`w-5 h-5 text-${stat.color}`} style={{ color: `var(--color-${stat.color}, #34569D)` }} />
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-brand-surface dark:border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted dark:text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full pl-10 pr-4 py-2 bg-brand-surface dark:bg-gray-800 border border-transparent rounded-lg text-brand-dark dark:text-brand-white placeholder-brand-muted dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-muted dark:text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-brand-surface dark:bg-gray-800 border border-transparent rounded-lg text-brand-dark dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="sending">Sending</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="divide-y divide-brand-surface dark:divide-gray-800">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-brand-muted dark:text-gray-400">Loading campaigns...</p>
              </div>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex p-4 bg-brand-surface dark:bg-gray-800 rounded-full mb-4">
                <Mail className="w-8 h-8 text-brand-muted dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-brand-dark dark:text-brand-white mb-2">
                {searchQuery || filterStatus !== 'all' ? 'No campaigns found' : 'No campaigns yet'}
              </h3>
              <p className="text-brand-muted dark:text-gray-400 mb-6">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first email campaign to start reaching your audience'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <Link
                  to="/dashboard/email/campaigns/new"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create First Campaign
                </Link>
              )}
            </div>
          ) : (
            filteredCampaigns.map((campaign) => {
              const badge = getStatusBadge(campaign.status);
              const StatusIcon = badge.icon;
              const openRate = calculateOpenRate(campaign);
              const clickRate = calculateClickRate(campaign);

              return (
                <Link
                  key={campaign.id}
                  to={`/dashboard/email/campaigns/${campaign.id}`}
                  className="p-6 hover:bg-brand-surface/30 dark:hover:bg-gray-800/50 transition-colors group block"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-brand-dark dark:text-brand-white group-hover:text-brand-primary transition-colors truncate">
                          {campaign.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text} flex-shrink-0`}>
                          <StatusIcon className="w-3 h-3" />
                          {campaign.status}
                        </span>
                        {campaign.status === 'sent' && (
                          <>
                            <Link
                              to={`/dashboard/email/campaigns/${campaign.id}/analytics`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors"
                            >
                              <TrendingUp className="w-3 h-3" />
                              Analytics
                            </Link>
                            {(() => {
                              try {
                                const metadata = typeof campaign.metadata === 'string' 
                                  ? JSON.parse(campaign.metadata) 
                                  : campaign.metadata;
                                if (metadata?.is_ab_test) {
                                  return (
                                    <Link
                                      to={`/dashboard/email/campaigns/${campaign.id}/ab-test`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors"
                                    >
                                      <Target className="w-3 h-3" />
                                      A/B Test
                                    </Link>
                                  );
                                }
                              } catch (e) {
                                // Ignore parse errors
                              }
                              return null;
                            })()}
                          </>
                        )}
                      </div>

                      {campaign.subject && (
                        <p className="text-sm text-brand-muted dark:text-gray-400 mb-3 line-clamp-1">
                          Subject: {campaign.subject}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-brand-muted dark:text-gray-500">
                        <div className="flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          <span>{campaign.total_recipients || 0} recipients</span>
                        </div>

                        {campaign.sent_count > 0 && (
                          <>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{campaign.opened_count || 0} opens ({openRate}%)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MousePointerClick className="w-3 h-3" />
                              <span>{campaign.clicked_count || 0} clicks ({clickRate}%)</span>
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

                  {/* Progress Bar for sending campaigns */}
                  {campaign.status === 'sending' && campaign.sent_count > 0 && campaign.total_recipients > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-brand-muted dark:text-gray-400 mb-1">
                        <span>Sending progress</span>
                        <span>{Math.round((campaign.sent_count / campaign.total_recipients) * 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-brand-surface dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-primary to-brand-sky transition-all duration-300"
                          style={{ width: `${(campaign.sent_count / campaign.total_recipients) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}


