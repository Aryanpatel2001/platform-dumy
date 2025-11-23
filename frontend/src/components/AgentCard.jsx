import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Phone, Settings, Play, Trash2, MoreVertical } from 'lucide-react';
import { useState } from 'react';

const AgentCard = ({ agent }) => {
  const [showMenu, setShowMenu] = useState(false);

  console.log('Agenttttt:', agent);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'draft':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'voice_call' ? (
      <Phone className="w-5 h-5" />
    ) : (
      <MessageSquare className="w-5 h-5" />
    );
  };

  const getTypeColor = (type) => {
    return type === 'voice_call'
      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
      : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="card relative group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getTypeColor(agent.type)}`}>
            {getTypeIcon(agent.type)}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{agent.name}</h3>
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(agent.status)}`}>
              {agent.status}
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <Link
                to={`/dashboard/agent/${agent.id}`}
                className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
              
              <button
                className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
        {agent.description || 'No description provided'}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-500">Conversations</p>
          <p className="text-lg font-semibold">{agent.conversations || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-500">Functions</p>
          <p className="text-lg font-semibold">{agent.functions?.length || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-500">Success</p>
          <p className="text-lg font-semibold">{agent.successRate || 0}%</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        {agent.type !== 'voice_call' && (
          <Link
            to={`/dashboard/agent/${agent.id}/test`}
            className="flex-1 btn-primary text-center text-sm"
          >
            Test Agent
          </Link>
        )}
        <Link
          to={`/dashboard/agent/${agent.id}`}
          className="flex-1 btn-secondary text-center text-sm"
        >
          Configure
        </Link>
      </div>

      {/* Last active */}
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
        Last active: {agent.lastActive || 'Never'}
      </p>
    </motion.div>
  );
};

export default AgentCard;

