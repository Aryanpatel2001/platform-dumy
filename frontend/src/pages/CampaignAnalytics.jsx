import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, Eye, MousePointerClick, Mail, Send,
  BarChart3, Calendar, Users, Target, Award, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function CampaignAnalytics() {
  const { id } = useParams();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [stats, setStats] = useState({});
  const [timeSeries, setTimeSeries] = useState([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (id) {
      fetchCampaignData();
      fetchAnalytics();
    }
  }, [id, days]);

  const fetchCampaignData = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/email/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaign(res.data);
    } catch (error) {
      console.error('Failed to fetch campaign:', error);
      toast.error('Failed to load campaign');
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [statsRes, timeSeriesRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/email/campaigns/${id}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:3000/api/email/campaigns/${id}/analytics?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data || {});
      setTimeSeries(timeSeriesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateRate = (value, total) => {
    if (!total || total === 0) return 0;
    return ((value / total) * 100).toFixed(2);
  };

  const openRate = calculateRate(stats.total_opened || 0, stats.total_sent || 0);
  const clickRate = calculateRate(stats.total_clicked || 0, stats.total_sent || 0);
  const bounceRate = calculateRate(stats.total_bounced || 0, stats.total_sent || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-brand-muted dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/email/campaigns"
            className="p-2 hover:bg-brand-surface dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-brand-muted dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-brand-dark dark:text-brand-white">
              Campaign Analytics
            </h1>
            {campaign && (
              <p className="text-brand-muted dark:text-gray-400 text-sm">
                {campaign.name}
              </p>
            )}
          </div>
        </div>

        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-4 py-2 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-700 rounded-xl text-brand-dark dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-brand-primary/10 rounded-xl">
              <Send className="w-6 h-6 text-brand-primary" />
            </div>
            <span className="text-2xl font-bold text-brand-dark dark:text-brand-white">
              {stats.total_sent || 0}
            </span>
          </div>
          <p className="text-sm text-brand-muted dark:text-gray-400">Emails Sent</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-brand-sky/10 rounded-xl">
              <Eye className="w-6 h-6 text-brand-sky" />
            </div>
            <span className="text-2xl font-bold text-brand-dark dark:text-brand-white">
              {openRate}%
            </span>
          </div>
          <p className="text-sm text-brand-muted dark:text-gray-400">Open Rate</p>
          <p className="text-xs text-brand-muted dark:text-gray-500 mt-1">
            {stats.total_opened || 0} opens
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-brand-accent/10 rounded-xl">
              <MousePointerClick className="w-6 h-6 text-brand-accent" />
            </div>
            <span className="text-2xl font-bold text-brand-dark dark:text-brand-white">
              {clickRate}%
            </span>
          </div>
          <p className="text-sm text-brand-muted dark:text-gray-400">Click Rate</p>
          <p className="text-xs text-brand-muted dark:text-gray-500 mt-1">
            {stats.total_clicked || 0} clicks
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-2xl font-bold text-brand-dark dark:text-brand-white">
              {bounceRate}%
            </span>
          </div>
          <p className="text-sm text-brand-muted dark:text-gray-400">Bounce Rate</p>
          <p className="text-xs text-brand-muted dark:text-gray-500 mt-1">
            {stats.total_bounced || 0} bounces
          </p>
        </motion.div>
      </div>

      {/* Time Series Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-brand-dark dark:text-brand-white">
            Performance Over Time
          </h2>
          <BarChart3 className="w-5 h-5 text-brand-muted" />
        </div>

        {timeSeries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-brand-muted dark:text-gray-400">No data available for the selected period</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timeSeries.map((day, index) => {
              const maxValue = Math.max(day.sent || 0, day.opened || 0, day.clicked || 0);
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-brand-dark dark:text-brand-white font-medium">
                      {new Date(day.date).toLocaleDateString()}
                    </span>
                    <span className="text-brand-muted dark:text-gray-400">
                      {day.sent || 0} sent, {day.opened || 0} opened, {day.clicked || 0} clicked
                    </span>
                  </div>
                  <div className="flex gap-2 h-8">
                    <div
                      className="bg-brand-primary rounded"
                      style={{ width: `${maxValue > 0 ? (day.sent / maxValue) * 100 : 0}%` }}
                      title={`Sent: ${day.sent || 0}`}
                    />
                    <div
                      className="bg-brand-sky rounded"
                      style={{ width: `${maxValue > 0 ? (day.opened / maxValue) * 100 : 0}%` }}
                      title={`Opened: ${day.opened || 0}`}
                    />
                    <div
                      className="bg-brand-accent rounded"
                      style={{ width: `${maxValue > 0 ? (day.clicked / maxValue) * 100 : 0}%` }}
                      title={`Clicked: ${day.clicked || 0}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-brand-dark dark:text-brand-white mb-4">
            Delivery Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-brand-muted dark:text-gray-400">Delivered</span>
              <span className="font-medium text-brand-dark dark:text-brand-white">
                {stats.total_delivered || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted dark:text-gray-400">Delivery Rate</span>
              <span className="font-medium text-brand-dark dark:text-brand-white">
                {calculateRate(stats.total_delivered || 0, stats.total_sent || 0)}%
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-brand-dark dark:text-brand-white mb-4">
            Engagement Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-brand-muted dark:text-gray-400">Total Recipients</span>
              <span className="font-medium text-brand-dark dark:text-brand-white">
                {stats.total_recipients || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted dark:text-gray-400">Click-to-Open Rate</span>
              <span className="font-medium text-brand-dark dark:text-brand-white">
                {calculateRate(stats.total_clicked || 0, stats.total_opened || 0)}%
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

