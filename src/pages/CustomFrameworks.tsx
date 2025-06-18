import React, { useState, useEffect, useCallback } from 'react';
import useFrameworkStore from '../store/frameworkStore';
import { 
  Shield, FileEdit, Plus, PlusCircle, 
  ClipboardCheck, Copy, Upload, Download, RefreshCw
} from 'lucide-react';
import CreateFrameworkModal from '../components/CreateFrameworkModal';
import FrameworkDetailsModal from '../components/FrameworkDetailsModal';
import { Framework } from '../types/framework';

const CustomFrameworks: React.FC = () => {
  const { frameworks, loading, error, fetchFrameworks, clearError } = useFrameworkStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loadingState, setLoadingState] = useState<string>('initial');
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoadingState('fetching');
      clearError(); // Clear any previous errors
      await fetchFrameworks();
      setLoadingState('success');
    } catch (err) {
      console.error('Error in CustomFrameworks effect:', err);
      setLoadingState('error');
    }
  }, [fetchFrameworks, clearError]);

  useEffect(() => {
    console.log('CustomFrameworks component mounted');
    loadData();
  }, [loadData]);

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleRetry = () => {
    loadData();
  };

  const handleViewDetails = (framework: Framework) => {
    setSelectedFramework(framework);
    setIsDetailsModalOpen(true);
  };

  console.log('Rendering CustomFrameworks. Frameworks:', frameworks);
  console.log('Loading status:', loading, 'Error:', error, 'LoadingState:', loadingState);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Custom Compliance Frameworks</h1>
          <p className="text-neutral-400 mt-1">Create and manage custom security compliance frameworks</p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button 
            className="btn-outline flex items-center"
            onClick={handleRetry}
            disabled={loading}
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            className="btn-primary"
            onClick={handleCreateClick}
          >
            <PlusCircle size={18} className="mr-2" />
            Create New Framework
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-medium text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button 
              className="w-full py-3 px-4 bg-background-light rounded-lg text-left hover:bg-neutral-800 transition-colors flex items-center"
              onClick={handleCreateClick}
            >
              <div className="w-10 h-10 rounded-full bg-primary-900 flex items-center justify-center mr-3">
                <PlusCircle size={20} className="text-primary-500" />
              </div>
              <div>
                <div className="font-medium text-white">Create Framework</div>
                <div className="text-xs text-neutral-400">Start from scratch</div>
              </div>
            </button>
            
            <button className="w-full py-3 px-4 bg-background-light rounded-lg text-left hover:bg-neutral-800 transition-colors flex items-center">
              <div className="w-10 h-10 rounded-full bg-secondary-900 flex items-center justify-center mr-3">
                <Upload size={20} className="text-secondary-500" />
              </div>
              <div>
                <div className="font-medium text-white">Import Framework</div>
                <div className="text-xs text-neutral-400">Upload JSON or XML file</div>
              </div>
            </button>
            
            <button className="w-full py-3 px-4 bg-background-light rounded-lg text-left hover:bg-neutral-800 transition-colors flex items-center">
              <div className="w-10 h-10 rounded-full bg-accent-900 flex items-center justify-center mr-3">
                <ClipboardCheck size={20} className="text-accent-500" />
              </div>
              <div>
                <div className="font-medium text-white">From Template</div>
                <div className="text-xs text-neutral-400">Start from a template</div>
              </div>
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-white mb-4">Your Frameworks</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-neutral-400 mt-2">Loading frameworks... ({loadingState})</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-error-500 mb-3">
                <Shield size={32} className="mx-auto opacity-70" />
              </div>
              <p className="text-error-500 font-medium">{error}</p>
              <p className="text-sm mt-2 text-neutral-400">Loading state: {loadingState}</p>
              <button 
                onClick={handleRetry}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-md text-white flex items-center mx-auto"
              >
                <RefreshCw size={16} className="mr-2" />
                Retry
              </button>
            </div>
          ) : frameworks.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <Shield size={40} className="mx-auto mb-3 opacity-30" />
              <p className="mb-2">No frameworks yet</p>
              <p className="text-sm">Create your first custom framework to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {frameworks.map((framework) => (
                <div 
                  key={framework.id} 
                  className="p-4 bg-background-light rounded-lg border border-neutral-800 hover:border-primary-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        framework.status === 'compliant' ? 'bg-success-500' : 
                        framework.status === 'non-compliant' ? 'bg-error-500' :
                        framework.status === 'in-progress' ? 'bg-warning-500' :
                        'bg-neutral-500'
                      }`} />
                      <h3 className="font-medium text-white">{framework.name}</h3>
                    </div>
                    <span className="text-xs text-neutral-400">v{framework.version}</span>
                  </div>
                  <p className="text-sm text-neutral-300 mb-3">{framework.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-3 text-xs text-neutral-400">
                      <span>{framework.totalControls} controls</span>
                      <span>•</span>
                      <span className="capitalize">{framework.status.replace(/-/g, ' ')}</span>
                    </div>
                    <button 
                      className="btn-outline py-1 px-3 text-sm"
                      onClick={() => handleViewDetails(framework)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateFrameworkModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <FrameworkDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        framework={selectedFramework}
      />
    </div>
  );
};

export default CustomFrameworks;