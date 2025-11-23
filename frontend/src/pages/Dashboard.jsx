import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import AgentsTable from '../components/AgentsTable';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (isAuthenticated() && token) {
      fetchAgents();
    }
  }, [isAuthenticated, token]);

  const fetchAgents = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/agents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Fetched agents:', response.data);
      setAgents(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setLoading(false);
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
        navigate('/login');
      } else {
        toast.error('Failed to fetch agents');
        // Set empty array for development
        setAgents([]);
      }
    }
  };

  const filteredAgents = agents.filter(a => a.name?.toLowerCase().includes(query.toLowerCase()));


  console.log('Agents:', agents);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Agents</h1>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
            />
          </div>
          <Link to="/dashboard/agent/new" className="btn-primary inline-flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create an Agent</span>
          </Link>
        </div>
      </div>

      <AgentsTable agents={filteredAgents} loading={loading} />
    </div>
  );
};

export default Dashboard;

