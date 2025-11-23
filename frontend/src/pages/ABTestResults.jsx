import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Target, TrendingUp, Award, BarChart3, Eye, MousePointerClick
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function ABTestResults() {
  const { id } = useParams();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (id) {
      fetchABTestResults();
    }
  }, [id]);

  const fetchABTestResults = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/email/campaigns/${id}/ab-test-results`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(res.data);
    } catch (error) {
      console.error('Failed to fetch A/B test results:', error);
      toast.error('Failed to load A/B test results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-brand-muted dark:text-gray-400">Loading A/B test results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/email/campaigns"
            className="p-2 hover:bg-brand-surface dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-brand-muted dark:text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold text-brand-dark dark:text-brand-white">
            A/B Test Results
          </h1>
        </div>
        <div className="bg-brand-white dark:bg-gray-900 border border-brand-surface dark:border-gray-800 rounded-2xl p-12 text-center">
          <p className="text-brand-muted dark:text-gray-400">This campaign is not an A/B test.</p>
        </div>
      </div>
    );
  }

  const { variation_a, variation_b, winner } = results;

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
              A/B Test Results
            </h1>
            {results.campaign && (
              <p className="text-brand-muted dark:text-gray-400 text-sm">
                {results.campaign.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Winner Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl ${
          winner === 'A'
            ? 'bg-gradient-to-r from-brand-primary to-brand-sky text-white'
            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-bold">Variation {winner} Wins!</h2>
            <p className="text-white/90">
              Variation {winner} has a higher open rate ({winner === 'A' ? variation_a.open_rate : variation_b.open_rate}% vs {winner === 'A' ? variation_b.open_rate : variation_a.open_rate}%)
            </p>
          </div>
        </div>
      </motion.div>

      {/* Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Variation A */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-6 rounded-2xl border-2 ${
            winner === 'A'
              ? 'border-brand-primary bg-brand-primary/5'
              : 'border-brand-surface dark:border-gray-800 bg-brand-white dark:bg-gray-900'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-brand-dark dark:text-brand-white">
              Variation A
            </h3>
            {winner === 'A' && (
              <Award className="w-6 h-6 text-brand-primary" />
            )}
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-brand-surface/50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-brand-muted dark:text-gray-400 mb-1">Subject Line</p>
              <p className="font-medium text-brand-dark dark:text-brand-white">
                {results.campaign.metadata?.variation_a?.subject || 'N/A'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-brand-muted dark:text-gray-400 mb-1">Sent</p>
                <p className="text-2xl font-bold text-brand-dark dark:text-brand-white">
                  {variation_a.sent}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-muted dark:text-gray-400 mb-1">Opened</p>
                <p className="text-2xl font-bold text-brand-dark dark:text-brand-white">
                  {variation_a.opened}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted dark:text-gray-400">Open Rate</span>
                <span className="font-bold text-brand-dark dark:text-brand-white">
                  {variation_a.open_rate}%
                </span>
              </div>
              <div className="w-full h-2 bg-brand-surface dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-primary transition-all"
                  style={{ width: `${variation_a.open_rate}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted dark:text-gray-400">Click Rate</span>
                <span className="font-bold text-brand-dark dark:text-brand-white">
                  {variation_a.click_rate}%
                </span>
              </div>
              <div className="w-full h-2 bg-brand-surface dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-accent transition-all"
                  style={{ width: `${variation_a.click_rate}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Variation B */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-6 rounded-2xl border-2 ${
            winner === 'B'
              ? 'border-purple-500 bg-purple-500/5'
              : 'border-brand-surface dark:border-gray-800 bg-brand-white dark:bg-gray-900'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-brand-dark dark:text-brand-white">
              Variation B
            </h3>
            {winner === 'B' && (
              <Award className="w-6 h-6 text-purple-500" />
            )}
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-brand-surface/50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-brand-muted dark:text-gray-400 mb-1">Subject Line</p>
              <p className="font-medium text-brand-dark dark:text-brand-white">
                {results.campaign.metadata?.variation_b?.subject || 'N/A'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-brand-muted dark:text-gray-400 mb-1">Sent</p>
                <p className="text-2xl font-bold text-brand-dark dark:text-brand-white">
                  {variation_b.sent}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-muted dark:text-gray-400 mb-1">Opened</p>
                <p className="text-2xl font-bold text-brand-dark dark:text-brand-white">
                  {variation_b.opened}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted dark:text-gray-400">Open Rate</span>
                <span className="font-bold text-brand-dark dark:text-brand-white">
                  {variation_b.open_rate}%
                </span>
              </div>
              <div className="w-full h-2 bg-brand-surface dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${variation_b.open_rate}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted dark:text-gray-400">Click Rate</span>
                <span className="font-bold text-brand-dark dark:text-brand-white">
                  {variation_b.click_rate}%
                </span>
              </div>
              <div className="w-full h-2 bg-brand-surface dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 transition-all"
                  style={{ width: `${variation_b.click_rate}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

