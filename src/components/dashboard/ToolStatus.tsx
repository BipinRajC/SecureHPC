import React, { useEffect, useState } from 'react';
import { Tool } from '../../types/compliance';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, Settings, ArrowRight } from 'lucide-react';

interface ToolStatusProps {
  tools: Tool[];
}

const ToolStatus: React.FC<ToolStatusProps> = ({ tools }) => {
  const [lastRuns, setLastRuns] = useState<{ [tool: string]: string | null }>({});

  useEffect(() => {
    // Always get the latest from localStorage
    setLastRuns({
      lynis: localStorage.getItem('lynis_last_run'),
      openscap: localStorage.getItem('openscap_last_run'),
    });
    // Listen for storage changes (cross-tab)
    const handler = () => setLastRuns({
      lynis: localStorage.getItem('lynis_last_run'),
      openscap: localStorage.getItem('openscap_last_run'),
    });
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 size={16} className="text-success-500" />;
      case 'inactive':
        return <Clock size={16} className="text-neutral-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-error-500" />;
      case 'configuring':
        return <Settings size={16} className="text-warning-500" />;
      default:
        return <Clock size={16} className="text-neutral-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="text-success-500">Active</span>;
      case 'inactive':
        return <span className="text-neutral-500">Inactive</span>;
      case 'error':
        return <span className="text-error-500">Error</span>;
      case 'configuring':
        return <span className="text-warning-500">Configuring</span>;
      default:
        return <span className="text-neutral-500">Unknown</span>;
    }
  };

  const getLastRun = (tool: Tool) => {
    if (tool.name.toLowerCase().includes('lynis')) {
      return lastRuns.lynis;
    }
    if (tool.name.toLowerCase().includes('openscap')) {
      return lastRuns.openscap;
    }
    return tool.lastRun;
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Tool Status</h2>
        <Link to="/integrations" className="text-primary-400 hover:text-primary-300 flex items-center text-sm">
          Manage <ArrowRight size={16} className="ml-1" />
        </Link>
      </div>
      
      <div className="space-y-4">
        {tools.map((tool) => {
          const lastRun = getLastRun(tool);
          return (
            <div key={tool.id} className="flex items-center justify-between p-3 bg-background-light rounded-lg">
              <div className="flex items-center">
                <div className="mr-3">{getStatusIcon(tool.status)}</div>
                <div>
                  <h3 className="font-medium text-white">{tool.name}</h3>
                  <p className="text-xs text-neutral-400">
                    {lastRun ? `Last run: ${new Date(lastRun).toLocaleString()}` : 'Never run'}
                  </p>
                </div>
              </div>
              <div className="text-sm">{getStatusText(tool.status)}</div>
            </div>
          );
        })}
        
        {tools.length === 0 && (
          <div className="text-center py-6 text-neutral-500">
            No tools configured
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <Link to="/integrations" className="btn-outline w-full">
          Add Tool Integration
        </Link>
      </div>
    </div>
  );
};

export default ToolStatus;