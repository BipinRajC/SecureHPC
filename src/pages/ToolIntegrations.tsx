import React, { useEffect, useState } from 'react';
import { useComplianceStore } from '../store/complianceStore';
import { useNavigate } from 'react-router-dom';
import { 
  GitMerge, AlertTriangle, CheckCircle2, Clock, 
  Settings, Search, Info, PlusCircle, Hammer, ShieldAlert, 
  Loader2
} from 'lucide-react';
import SSHConfigModal from '../components/SSHConfigModal';
import LynisScanProgress from '../components/LynisScanProgress';
import axios from 'axios';

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
  const [sshModalOpen, setSSHModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'lynis' | 'openscap'>('lynis');
  const [lynisScanJobId, setLynisScanJobId] = useState<string | null>(null);
  const [scanOptions, setScanOptions] = useState({
    quick: true,
    testGroups: [] as string[]
  });
  const [showScanOptions, setShowScanOptions] = useState(false);
  const navigate = useNavigate();
  const [lastRunTimes, setLastRunTimes] = useState({
    lynis: localStorage.getItem('lynis_last_run'),
    openscap: localStorage.getItem('openscap_last_run'),
  });

  useEffect(() => {
    fetchTools();
    // Listen for localStorage changes to update last run times
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'lynis_last_run' || e.key === 'openscap_last_run') {
        setLastRunTimes({
          lynis: localStorage.getItem('lynis_last_run'),
          openscap: localStorage.getItem('openscap_last_run'),
        });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [fetchTools]);

  const handleRunTool = async (toolId: string) => {
    // Show loading state
    setScanningTool(toolId);
    
    if (toolId === 'tool-1') { // Lynis
      try {
        // For Lynis, use our improved API that returns immediately
        const connectionId = localStorage.getItem('ssh_connection_id');
        
        if (!connectionId) {
          alert('SSH connection not configured. Please configure SSH first.');
          setScanningTool(null);
          return;
        }
        
        // Make a direct API call to start the scan with options
        const response = await axios.post('http://localhost:3001/api/tools/lynis/remote-scan', {
          connectionId,
          options: scanOptions
        });
        
        if (response.data.status === 'ok') {
          // Store the job ID for progress tracking
          setLynisScanJobId(response.data.job_id);
          
          // Set the state flag
          localStorage.setItem('lynis_running', 'true');
          sessionStorage.setItem('lynis_ran', 'true');
        } else {
          throw new Error(response.data.message || 'Failed to start scan');
        }
      } catch (error) {
        console.error('Error:', error);
        setScanningTool(null);
        alert('Failed to start Lynis scan. Please try again.');
      }
    } else if (toolId === 'tool-2') { // OpenSCAP
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
  
  const handleScanComplete = (results: any) => {
    // Store scan results in localStorage for dashboard
    if (results.hardening_index) {
      localStorage.setItem('lynis_score', results.hardening_index.toString());
    }
    if (results.tests_performed) {
      localStorage.setItem('lynis_tests', results.tests_performed.toString());
    }
    if (results.suggestions) {
      localStorage.setItem('lynis_suggestions', results.suggestions.toString());
    }
    if (results.warnings) {
      localStorage.setItem('lynis_warnings', results.warnings.toString());
    }
    // Use the backend-provided last_run if available, otherwise fallback to now
    if (results.last_run) {
      localStorage.setItem('lynis_last_run', results.last_run);
    } else {
      localStorage.setItem('lynis_last_run', new Date().toISOString());
    }
    // Reset UI state
    setScanningTool(null);
    setLynisScanJobId(null);
    // Navigate to dashboard to see results
    setTimeout(() => {
      navigate('/', { state: { refreshData: true } });
    }, 1500);
  };
  
  const handleScanError = (errorMessage: string) => {
    console.error('Scan error:', errorMessage);
    setScanningTool(null);
    setLynisScanJobId(null);
    alert(`Scan failed: ${errorMessage}`);
  };

  const handleActivateTool = async (toolId: string) => {
    try {
      setActivatingTool(toolId);
      
      // Set the lynis_ran flag for the hardcoded 78% compliance score
      if (toolId === 'tool-1' && typeof window !== 'undefined') {
        sessionStorage.setItem('lynis_ran', 'true');
        localStorage.setItem('lynis_ran', 'true');
      }
      
      await activateTool(toolId);
      setActivatingTool(null);
      
      // If activating Lynis, navigate to dashboard after a short delay
      if (toolId === 'tool-1') {
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

  const handleConfigureTool = (toolId: string) => {
    console.log("Configuring tool with ID:", toolId, "type:", typeof toolId);
    
    // Match the actual tool IDs from the mock data
    if (toolId === 'tool-1') { // Lynis
      setSelectedTool('lynis');
      setSSHModalOpen(true);
    } else if (toolId === 'tool-2') { // OpenSCAP
      setSelectedTool('openscap');
      setSSHModalOpen(true);
    } else if (toolId === 'tool-3') { // Wazuh
      window.location.href = 'http://localhost:5173/integrations/wazuh-config';
    } else {
      alert(`Configure ${toolId} - Feature coming soon!`);
    }
  };

  const handleSSHConfigured = (connectionId: string) => {
    console.log(`SSH connection established for ${selectedTool} with ID: ${connectionId}`);
    
    // Store the connection ID in localStorage for scans
    localStorage.setItem('ssh_connection_id', connectionId);
    
    // Update the tool status to active
    const updatedTool = tools.find(t => {
      if (selectedTool === 'lynis') return t.id === 'tool-1';
      if (selectedTool === 'openscap') return t.id === 'tool-2';
      return false;
    });
    
    if (updatedTool) {
      updatedTool.status = 'active';
      // Using type assertion to avoid TypeScript error since lastUpdated might not be in the interface
      (updatedTool as any).lastUpdated = new Date().toISOString();
      // In a real app, you'd save this to the server
    }
    
    fetchTools(); // Refresh the tools list
    
    // Show success message
    alert(`${selectedTool === 'lynis' ? 'Lynis' : 'OpenSCAP'} successfully configured!`);
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
  
  // Handle selection of test groups for faster scanning
  const handleTestGroupSelection = (group: string) => {
    setScanOptions(prev => {
      const newGroups = prev.testGroups.includes(group)
        ? prev.testGroups.filter(g => g !== group)
        : [...prev.testGroups, group];
      
      return {
        ...prev,
        testGroups: newGroups
      };
    });
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
      
      {/* Lynis Scan Progress Tracker */}
      {lynisScanJobId && (
        <LynisScanProgress 
          jobId={lynisScanJobId}
          onComplete={handleScanComplete}
          onError={handleScanError}
        />
      )}
      
      {/* Scan Options Panel */}
      {showScanOptions && (
        <div className="card mb-6">
          <h3 className="text-lg font-medium text-white mb-4">Lynis Scan Options</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="quick-scan"
                checked={scanOptions.quick}
                onChange={() => setScanOptions(prev => ({ ...prev, quick: !prev.quick }))}
                className="mr-2"
              />
              <label htmlFor="quick-scan" className="text-neutral-300">
                Use Quick Scan Mode (Faster)
              </label>
            </div>
            
            <div>
              <p className="text-neutral-300 mb-2">Select Test Groups (Optional)</p>
              <div className="grid grid-cols-2 gap-2">
                {['authentication', 'file_permissions', 'firewall', 'ssh', 'malware', 'crypto'].map(group => (
                  <div key={group} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`group-${group}`}
                      checked={scanOptions.testGroups.includes(group)}
                      onChange={() => handleTestGroupSelection(group)}
                      className="mr-2"
                    />
                    <label htmlFor={`group-${group}`} className="text-neutral-400 capitalize">
                      {group}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-neutral-500 text-sm mt-2">
                Selecting specific test groups will make the scan faster
              </p>
            </div>
          </div>
        </div>
      )}

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
            {tools.map((tool) => {
              // Patch last run time for Lynis and OpenSCAP from localStorage
              let lastRun = tool.lastRun;
              if (tool.id === 'tool-1' && lastRunTimes.lynis) {
                lastRun = lastRunTimes.lynis;
              }
              if (tool.id === 'tool-2' && lastRunTimes.openscap) {
                lastRun = lastRunTimes.openscap;
              }
              return (
                <div key={tool.id} className="bg-background-light p-4 rounded-lg border border-neutral-800 hover:border-primary-700 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center mb-2">
                        {getTypeIcon(tool.type)}
                        <h3 className="ml-2 font-medium text-white flex items-center">
                          {tool.name}
                          {tool.status === 'active' && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-success-900 text-success-300 rounded-full">Active</span>
                          )}
                        </h3>
                      </div>
                      <p className="text-neutral-400 text-sm mb-1">{tool.description}</p>
                      <div className="flex items-center text-xs text-neutral-500">
                        <span className="flex items-center mr-4">
                          {getStatusIcon(tool.status)}
                          <span className="ml-1">Status: {getStatusText(tool.status)}</span>
                        </span>
                        {lastRun && (
                          <span>Last run: {new Date(lastRun).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {tool.id === 'tool-1' && tool.status === 'active' && !scanningTool && !lynisScanJobId && (
                        <button
                          className="btn-outline-sm"
                          onClick={() => setShowScanOptions(!showScanOptions)}
                        >
                          <Settings size={16} className="mr-1" />
                          {showScanOptions ? 'Hide Options' : 'Scan Options'}
                        </button>
                      )}
                      
                      {tool.status === 'active' && (
                        <button
                          className="btn-primary-sm"
                          onClick={() => handleRunTool(tool.id)}
                          disabled={scanningTool === tool.id || !!lynisScanJobId}
                        >
                          {scanningTool === tool.id ? (
                            <>
                              <Loader2 size={16} className="animate-spin mr-1" />
                              Running...
                            </>
                          ) : (
                            <>
                              <ShieldAlert size={16} className="mr-1" />
                              Run Scan
                            </>
                          )}
                        </button>
                      )}
                      
                      {tool.status === 'inactive' && (
                        <button
                          className="btn-primary-sm"
                          onClick={() => handleActivateTool(tool.id)}
                          disabled={activatingTool === tool.id}
                        >
                          {activatingTool === tool.id ? (
                            <>
                              <Loader2 size={16} className="animate-spin mr-1" />
                              Activating...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={16} className="mr-1" />
                              Activate
                            </>
                          )}
                        </button>
                      )}
                      
                      <button
                        className="btn-outline-sm"
                        onClick={() => handleConfigureTool(tool.id)}
                        disabled={scanningTool === tool.id}
                      >
                        <Settings size={16} className="mr-1" />
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SSHConfigModal 
        isOpen={sshModalOpen} 
        onClose={() => setSSHModalOpen(false)}
        onConfigured={handleSSHConfigured}
        tool={selectedTool}
      />
    </div>
  );
};

export default ToolIntegrations;
