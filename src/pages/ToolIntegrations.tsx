import React, { useEffect, useState } from 'react';
import { useComplianceStore } from '../store/complianceStore';
import { useNavigate } from 'react-router-dom';
import { 
  GitMerge, AlertTriangle, CheckCircle2, Clock, 
  Settings, Search, Info, PlusCircle, Hammer, ShieldAlert, 
  Loader2
} from 'lucide-react';

const ToolIntegrations: React.FC = () => {
  const { 
    tools, 
    loading, 
    error, 
    fetchTools, 
    runLynisScan,
    runOpenScapScan,
    activateTool
  } = useComplianceStore();
  const [scanningTool, setScanningTool] = useState<string | null>(null);
  const [activatingTool, setActivatingTool] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const handleRunTool = async (toolId: string) => {
    // Show loading state
    setScanningTool(toolId);
    
    if (toolId === 'lynis') {
      try {
        // Set the lynis_ran flag for the hardcoded 78% compliance score
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('lynis_ran', 'true');
          localStorage.setItem('lynis_ran', 'true');
        }
        
        // Call the store method to generate data
        await runLynisScan();
        
        // Set a flag in sessionStorage to indicate dashboard should refresh data
        sessionStorage.setItem('dashboard_refresh', 'true');
        
        // Wait briefly then navigate to dashboard
        setTimeout(() => {
          setScanningTool(null);
          navigate('/', { state: { refreshData: true } });
        }, 1000);
      } catch (error) {
        console.error('Error:', error);
        setScanningTool(null);
        // Still navigate even if there's an error
        navigate('/');
      }
    } else if (toolId === 'openscap') {
      try {
        // For OpenSCAP, run the scan and navigate to the OVAL report page
        await runOpenScapScan();
        
        // Navigate to the OpenSCAP report page
        setTimeout(() => {
          setScanningTool(null);
          navigate('/openscap-report');
        }, 500);
      } catch (error) {
        console.error('Error running OpenSCAP:', error);
        setScanningTool(null);
      }
    } else {
      // Generic handling for other tools
      try {
        await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate running the tool
        
        // Just show completed status
        setScanningTool(null);
        alert(`${toolId} scan completed successfully!`);
      } catch (error) {
        console.error(`Error running ${toolId}:`, error);
        setScanningTool(null);
      }
    }
  };

  const handleActivateTool = async (toolId: string) => {
    try {
      setActivatingTool(toolId);
      
      // Set the lynis_ran flag for the hardcoded 78% compliance score
      if (toolId === 'lynis' && typeof window !== 'undefined') {
        sessionStorage.setItem('lynis_ran', 'true');
        localStorage.setItem('lynis_ran', 'true');
      }
      
      await activateTool(toolId);
      setActivatingTool(null);
      
      // If activating Lynis, navigate to dashboard after a short delay
      if (toolId === 'lynis') {
        // Add a small delay for better UX - allowing time for the store to run the scan
        setTimeout(() => {
          navigate('/', { state: { refreshData: true } });
        }, 1500); // Longer delay to ensure data is processed
      }
    } catch (error) {
      console.error('Failed to activate tool:', error);
      setActivatingTool(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 size={18} className="text-success-500" />;
      case 'inactive':
        return <Clock size={18} className="text-neutral-500" />;
      case 'error':
        return <AlertTriangle size={18} className="text-error-500" />;
      case 'configuring':
        return <Settings size={18} className="text-warning-500" />;
      default:
        return <Clock size={18} className="text-neutral-500" />;
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scanner':
        return <ShieldAlert size={18} className="text-primary-400" />;
      case 'monitor':
        return <Info size={18} className="text-secondary-400" />;
      case 'auditor':
        return <Hammer size={18} className="text-accent-400" />;
      default:
        return <GitMerge size={18} className="text-neutral-400" />;
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Tool Integrations</h1>
          <p className="text-neutral-400 mt-1">Manage connections to security assessment and monitoring tools</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="btn-primary">
            <PlusCircle size={18} className="mr-2" />
            Add New Tool
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
          <div className="text-lg font-medium text-white flex items-center">
            <GitMerge className="mr-2 text-primary-500" />
            Configured Tools
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-neutral-500" />
            </div>
            <input 
              type="text" 
              placeholder="Search tools..." 
              className="input pl-10 w-full md:w-64"
            />
          </div>
        </div>
        
        {loading.tools ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-primary-400">Loading tool integrations...</div>
          </div>
        ) : error.tools ? (
          <div className="text-center py-8 text-error-500">
            <AlertTriangle size={40} className="mx-auto mb-2" />
            <p>Error loading tools: {error.tools}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tools.map((tool) => (
              <div key={tool.id} className="bg-background-light p-4 rounded-lg border border-neutral-800 hover:border-primary-700 transition-colors">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="mb-4 md:mb-0">
                    <div className="flex items-center mb-2">
                      {getTypeIcon(tool.type)}
                      <h3 className="font-medium text-white ml-2">{tool.name}</h3>
                      <div className="ml-3 flex items-center">
                        {getStatusIcon(tool.status)}
                        <span className="text-sm ml-1">{getStatusText(tool.status)}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-neutral-300 mb-2">
                      {tool.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      {tool.supportedFrameworks.map((frameworkId) => (
                        <span key={frameworkId} className="badge-neutral">
                          {frameworkId.replace(/-/g, ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-between items-end">
                    <div className="text-sm text-neutral-400 mb-2">
                      Version: {tool.version || 'Unknown'}
                    </div>
                    
                    <div className="flex space-x-2 md:justify-end justify-start w-full">
                      <button 
                        className="btn-outline py-1 px-3 text-sm w-24"
                        onClick={() => {
                          if (tool.id === 'wazuh') {
                            window.location.href = 'http://localhost:5173/integrations/wazuh-config';
                          } else {
                            alert(`Configure ${tool.name} - Feature coming soon!`);
                          }
                        }}
                      >
                        Configure
                      </button>
                      {tool.status === 'active' ? (
                        <>
                          {tool.id === 'wazuh' && (
                            <button 
                              className="btn-secondary py-1 px-3 text-sm"
                              onClick={() => window.location.href = 'http://localhost:5173/wazuh-result'}
                            >
                              View Dashboard
                            </button>
                          )}
                        <button 
                          className={`btn-primary py-1 px-3 text-sm w-24 ${scanningTool === tool.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                          onClick={() => handleRunTool(tool.id)}
                          disabled={scanningTool === tool.id || loading.lynisRunning}
                        >
                          {scanningTool === tool.id ? (
                            <>
                              <Loader2 size={16} className="mr-1 animate-spin" />
                              Running...
                            </>
                          ) : 'Run'}
                        </button>
                        </>
                      ) : (
                        <button 
                          className={`btn-secondary py-1 px-3 text-sm w-24 ${activatingTool === tool.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                          onClick={() => handleActivateTool(tool.id)}
                          disabled={activatingTool === tool.id}
                        >
                          {activatingTool === tool.id ? (
                            <>
                              <Loader2 size={16} className="mr-1 animate-spin" />
                              Activating...
                            </>
                          ) : 'Activate'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {tools.length === 0 && (
              <div className="text-center py-12 text-neutral-500">
                <GitMerge size={40} className="mx-auto mb-3 opacity-30" />
                <p className="mb-2">No tools configured</p>
                <p className="text-sm">Add your first security tool integration to get started</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-medium text-white mb-4">Available Integrations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-background-light rounded-lg border border-neutral-800 hover:border-primary-700 transition-colors cursor-pointer">
              <div className="flex items-center mb-2">
                <ShieldAlert size={20} className="text-primary-400" />
                <h3 className="font-medium text-white ml-2">Wazuh</h3>
              </div>
              <p className="text-sm text-neutral-300 mb-3">
                Open source security monitoring solution
              </p>
              <button 
                className="text-primary-400 text-sm hover:text-primary-300"
                onClick={() => window.location.href = 'http://localhost:5173/integrations/wazuh-config'}
              >
                Configure now
              </button>
            </div>
            
            <div className="p-4 bg-background-light rounded-lg border border-neutral-800 hover:border-primary-700 transition-colors cursor-pointer">
              <div className="flex items-center mb-2">
                <ShieldAlert size={20} className="text-primary-400" />
                <h3 className="font-medium text-white ml-2">OpenSCAP</h3>
              </div>
              <p className="text-sm text-neutral-300 mb-3">
                Security compliance and vulnerability scanning
              </p>
              <button className="text-primary-400 text-sm hover:text-primary-300">
                Learn more
              </button>
            </div>

            <div className="p-4 bg-background-light rounded-lg border border-neutral-800 hover:border-primary-400 transition-colors">
              <div className="flex items-center mb-2">
                <ShieldAlert size={20} className="text-primary-400" />
                <h3 className="font-medium text-white ml-2">Falco</h3>
             </div>
             <p className="text-sm text-neutral-300 mb-3">
                Runtime security monitoring for cloud-native environments.
             </p>
             <button className="text-primary-400 text-sm hover:text-primary-300">
               Learn more
             </button>
           </div>
            
            <div className="p-4 bg-background-light rounded-lg border border-neutral-800 hover:border-primary-700 transition-colors cursor-pointer">
              <div className="flex items-center mb-2">
                <ShieldAlert size={20} className="text-primary-400" />
                <h3 className="font-medium text-white ml-2">Prowler</h3>
              </div>
              <p className="text-sm text-neutral-300 mb-3">
                AWS security assessment and auditing
              </p>
              <button className="text-primary-400 text-sm hover:text-primary-300">
                Learn more
              </button>
            </div>
            
            <div className="p-4 bg-background-light rounded-lg border border-neutral-800 hover:border-primary-700 transition-colors cursor-pointer">
              <div className="flex items-center mb-2">
                <ShieldAlert size={20} className="text-primary-400" />
                <h3 className="font-medium text-white ml-2">Lynis</h3>
              </div>
              <p className="text-sm text-neutral-300 mb-3">
                Security auditing for Unix/Linux systems
              </p>
              <button className="text-primary-400 text-sm hover:text-primary-300">
                Learn more
              </button>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-lg font-medium text-white mb-4">Integration Documentation</h2>
          <p className="text-neutral-300 mb-4">
            Learn how to integrate security tools with the HPC Security Compliance Framework.
          </p>
          
          <div className="space-y-3">
            <div className="p-3 bg-background-light rounded flex items-center">
              <Info size={20} className="text-primary-400 mr-3" />
              <div>
                <h3 className="font-medium text-white">Wazuh Integration Guide</h3>
                <p className="text-xs text-neutral-400">Setting up and configuring Wazuh agents</p>
              </div>
            </div>
            
            <div className="p-3 bg-background-light rounded flex items-center">
              <Info size={20} className="text-primary-400 mr-3" />
              <div>
                <h3 className="font-medium text-white">OpenSCAP Integration Guide</h3>
                <p className="text-xs text-neutral-400">Configuring compliance profiles and scans</p>
              </div>
            </div>
            
            <div className="p-3 bg-background-light rounded flex items-center">
              <Info size={20} className="text-primary-400 mr-3" />
              <div>
                <h3 className="font-medium text-white">API Integration</h3>
                <p className="text-xs text-neutral-400">Using the REST API for custom tool integration</p>
              </div>
            </div>
            
            <div className="p-3 bg-background-light rounded flex items-center">
              <Info size={20} className="text-primary-400 mr-3" />
              <div>
                <h3 className="font-medium text-white">Troubleshooting Guide</h3>
                <p className="text-xs text-neutral-400">Common integration issues and solutions</p>
              </div>
            </div>
          </div>
          
          <button className="btn-outline w-full mt-4">View All Documentation</button>
        </div>
      </div>
    </div>
  );
};

export default ToolIntegrations;
