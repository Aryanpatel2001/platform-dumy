import { Link } from 'react-router-dom';
import { MessageSquare, Phone, MoreVertical } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

const formatType = (type) => {
  if (!type) return 'Unknown';
  return type === 'voice_call' ? 'Voice Call' : 'Chatbot';
};

const getVoiceName = (agent) => {
  const vs = agent.voiceSettings || agent.voice_settings;
  try {
    const parsed = typeof vs === 'string' ? JSON.parse(vs) : vs;
    return parsed?.voiceId || parsed?.name || '-';
  } catch {
    return '-';
  }
};

const getPhoneNumber = (agent) => {
  const tc = agent.twilioConfig || agent.twilio_config;
  try {
    const parsed = typeof tc === 'string' ? JSON.parse(tc) : tc;
    return parsed?.phoneNumber || parsed?.number || '-';
  } catch {
    return '-';
  }
};

const formatDateTime = (value) => {
  const raw = value || agentFallbackDate(value);
  if (!raw) return '-';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  } catch {
    return '-';
  }
};

const agentFallbackDate = (agent) => {
  return agent?.updated_at || agent?.created_at || agent?.lastActive || agent?.last_active || null;
};

const TypeIcon = ({ type }) => (
  type === 'voice_call' ? (
    <Phone className="w-5 h-5 text-purple-600" />
  ) : (
    <MessageSquare className="w-5 h-5 text-blue-600" />
  )
);

const AgentsTable = ({ agents = [], loading = false }) => {
  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">No agents yet</p>
        <Link to="/dashboard/agent/new" className="btn-primary">Create Agent</Link>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <TableHead className="px-4 py-3">Agent Name</TableHead>
              <TableHead className="px-4 py-3">Agent Type</TableHead>
              <TableHead className="px-4 py-3">Voice</TableHead>
              <TableHead className="px-4 py-3">Phone</TableHead>
              <TableHead className="px-4 py-3">Last Edited</TableHead>
              <TableHead className="px-4 py-3"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <TableCell className="px-4 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <TypeIcon type={agent.type} />
                    </div>
                    <div>
                      <Link to={`/dashboard/agent/${agent.id}`} className="font-medium hover:text-brand-primary">
                        {agent.name}
                      </Link>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium">
                    {formatType(agent.type)}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-4">{getVoiceName(agent)}</TableCell>
                <TableCell className="px-4 py-4">
                  {(() => {
                    const phone = getPhoneNumber(agent);
                    return phone !== '-' ? (
                      <a href={`tel:${phone}`} className="text-brand-sky hover:underline">{phone}</a>
                    ) : (
                      '-' 
                    );
                  })()}
                </TableCell>
                <TableCell className="px-4 py-4">{formatDateTime(agentFallbackDate(agent))}</TableCell>
                <TableCell className="px-4 py-4 text-right">
                  <Link to={`/dashboard/agent/${agent.id}`} className="inline-flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <MoreVertical className="w-5 h-5" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AgentsTable;