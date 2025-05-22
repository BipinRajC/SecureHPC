import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useComplianceStore } from '../store/complianceStore';
import AgentSelector from '../components/wazuh/AgentSelector';
import ComplianceOverview from '../components/wazuh/ComplianceOverview';
import SystemInformation from '../components/wazuh/SystemInformation';
import SCAResults from '../components/wazuh/SCAResults';
import ProcessesTable from '../components/wazuh/ProcessesTable';
import PortsTable from '../components/wazuh/PortsTable';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import AgentMetrics from '../components/wazuh/AgentMetrics';

const WazuhResult: React.FC = () => {
  const navigate = useNavigate();
  const { wazuhCredentials } = useComplianceStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentDetails, setAgentDetails] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // On component mount, check if we should redirect to configuration page
  useEffect(() => {
    console.log('WazuhResult: Component mounted');
    console.log('WazuhResult: Checking credentials...', wazuhCredentials ? 'Found' : 'Not found');
    
    // Check localStorage first (in case store state was lost)
    const isConfigured = localStorage.getItem('wazuh_configured') === 'true';
    console.log('WazuhResult: localStorage wazuh_configured:', isConfigured);
    
    if (!wazuhCredentials && !isConfigured) {
      console.log("No Wazuh credentials found, redirecting to config page");
      window.location.href = 'http://localhost:5173/integrations/wazuh-config';
      return;
    }
    
    // We have credentials, fetch agents
    console.log("Fetching agents data...");
    fetchAgents();
  }, []);

  // Fetch list of agents
  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Sending API request to fetch agents...");
      const response = await axios.get('http://localhost:3001/api/tools/wazuh/agents');
      console.log("API response for agents:", response.data);
      
      if (response.data.status === 'ok' && response.data.data && response.data.data.data && response.data.data.data.affected_items) {
        const agentList = response.data.data.data.affected_items;
        console.log(`Found ${agentList.length} agents`);
        setAgents(agentList);
        
        // Log all agent IDs for debugging
        if (agentList.length > 0) {
          console.log("Available agent IDs:", agentList.map((agent: { id: string }) => agent.id));
        }
        
        // Select first active agent by default
        const activeAgent = agentList.find((agent: { status: string }) => agent.status === 'active');
        if (activeAgent) {
          console.log("Selected active agent:", activeAgent.id);
          setSelectedAgentId(activeAgent.id);
        } else if (agentList.length > 0) {
          console.log("No active agents, selecting first agent:", agentList[0].id);
          setSelectedAgentId(agentList[0].id);
        } else {
          console.log("No agents found");
          setError('No agents found in Wazuh. Please ensure agents are properly registered.');
        }
      } else {
        console.error("Invalid API response format:", response.data);
        setError('Failed to fetch agents data: Invalid API response format');
      }
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  // When agent is selected, fetch its details
  useEffect(() => {
    if (selectedAgentId) {
      console.log(`Fetching details for agent: ${selectedAgentId}`);
      fetchAgentDetails(selectedAgentId);
    }
  }, [selectedAgentId]);

  // Fetch agent details
  const fetchAgentDetails = async (agentId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching info for agent ${agentId}...`);
      
      // Use a fallback approach to handle potential API inconsistencies
      let agentData: any = {
        info: null,
        os: null,
        hardware: null,
        netaddr: [],
        ports: [],
        packages: [],
        processes: [],
        sca: [],
        netiface: [],
        netproto: [],
        syscheck: []
      };
      
      // Get agent basic info from the agents list instead of a direct API call
      try {
        console.log("Getting agent info from agents list instead of direct API call");
        const agentsResponse = await axios.get('http://localhost:3001/api/tools/wazuh/agents');
        
        if (agentsResponse.data.status === 'ok' && 
            agentsResponse.data.data?.data?.data?.affected_items?.length > 0) {
          
          // Find the specific agent in the list
          const agent = agentsResponse.data.data.data.data.affected_items.find(
            (a: any) => a.id === agentId
          );
          
          if (agent) {
            console.log(`Found agent in list: ${agent.name} (ID: ${agent.id})`);
            // Use the agent data from the list as basic info
            agentData.info = agent;
          } else {
            console.warn(`Agent with ID ${agentId} not found in the agents list`);
            // Create a minimal info object
            agentData.info = {
              id: agentId,
              name: `Agent ${agentId}`,
              status: 'unknown'
            };
          }
        } else {
          throw new Error('Invalid response format from agents list');
        }
      } catch (infoError: any) {
        console.error(`Error getting agent info from list: ${infoError.message}`);
        // Create a minimal info object
        agentData.info = {
          id: agentId,
          name: `Agent ${agentId}`,
          status: 'unknown'
        };
      }
      
      // Fetch all other data
      try {
        console.log(`Fetching OS info for agent ${agentId}...`);
        const osResponse = await axios.get(`http://localhost:3001/api/tools/wazuh/agents/${agentId}/os`);
        if (osResponse.data.status === 'ok') {
          agentData.os = osResponse.data.data.data.affected_items?.[0] || null;
        }
        
        console.log(`Fetching hardware info for agent ${agentId}...`);
        const hardwareResponse = await axios.get(`http://localhost:3001/api/tools/wazuh/agents/${agentId}/hardware`);
        if (hardwareResponse.data.status === 'ok') {
          agentData.hardware = hardwareResponse.data.data.data.affected_items?.[0] || null;
        }
        
        console.log(`Fetching network addresses for agent ${agentId}...`);
        const netaddrResponse = await axios.get(`http://localhost:3001/api/tools/wazuh/agents/${agentId}/netaddr`);
        if (netaddrResponse.data.status === 'ok') {
          agentData.netaddr = netaddrResponse.data.data.data.affected_items || [];
        }
        
        console.log(`Fetching ports for agent ${agentId}...`);
        const portsResponse = await axios.get(`http://localhost:3001/api/tools/wazuh/agents/${agentId}/ports`);
        if (portsResponse.data.status === 'ok') {
          agentData.ports = portsResponse.data.data.data.affected_items || [];
        }
        
        console.log(`Fetching packages for agent ${agentId}...`);
        const packagesResponse = await axios.get(`http://localhost:3001/api/tools/wazuh/agents/${agentId}/packages?limit=20`);
        if (packagesResponse.data.status === 'ok') {
          agentData.packages = packagesResponse.data.data.data.affected_items || [];
        }
        
        console.log(`Fetching processes for agent ${agentId}...`);
        const processesResponse = await axios.get(`http://localhost:3001/api/tools/wazuh/agents/${agentId}/processes?limit=20`);
        if (processesResponse.data.status === 'ok') {
          agentData.processes = processesResponse.data.data.data.affected_items || [];
        }
        
        console.log(`Fetching SCA results for agent ${agentId}...`);
        const scaResponse = await axios.get(`http://localhost:3001/api/tools/wazuh/agents/${agentId}/sca`);
        if (scaResponse.data.status === 'ok') {
          agentData.sca = scaResponse.data.data.data.affected_items || [];
        }
        
        console.log(`Fetching netiface for agent ${agentId}...`);
        const netifaceResponse = await axios.get(`http://localhost:3001/api/tools/wazuh/agents/${agentId}/netiface`);
        if (netifaceResponse.data.status === 'ok') {
          agentData.netiface = netifaceResponse.data.data.data.affected_items || [];
        }
        
        console.log(`Fetching netproto for agent ${agentId}...`);
        const netprotoResponse = await axios.get(`http://localhost:3001/api/tools/wazuh/agents/${agentId}/netproto`);
        if (netprotoResponse.data.status === 'ok') {
          agentData.netproto = netprotoResponse.data.data.data.affected_items || [];
        }
        
        console.log(`Fetching syscheck for agent ${agentId}...`);
        const syscheckResponse = await axios.get(`http://localhost:3001/api/tools/wazuh/agents/${agentId}/syscheck`);
        if (syscheckResponse.data.status === 'ok') {
          // Syscheck: sort by date desc, take latest 10
          const syscheckItems = syscheckResponse.data.data.data.affected_items || [];
          const files = syscheckItems
            .filter((f: any) => f.date)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)
            .map((f: any) => ({
              file: f.file,
              perm: f.perm,
              md5: f.md5,
              mtime: f.date
            }));
          agentData.syscheck = files;
        }
        
        // If we have the basic agent info from the list and at least one additional data source,
        // we can display the agent
        if (agentData.info && (agentData.os || agentData.hardware || agentData.netaddr.length > 0)) {
          console.log("Agent data retrieved successfully (at least partially)");
          setAgentDetails(agentData);
        } else {
          throw new Error(`No data available for agent ${agentId}`);
        }
      } catch (apiError: any) {
        // If we at least have the basic info, we can show a minimal view
        if (agentData.info) {
          console.warn(`Failed to fetch some agent details: ${apiError.message}`);
          console.log("Showing agent with minimal data...");
          setAgentDetails(agentData);
        } else {
          // Handle 404 errors for agent ID
          if (apiError.response && apiError.response.status === 404) {
            console.error(`Agent with ID ${agentId} was not found in syscollector data.`);
            setError(`Agent with ID ${agentId} was found in the agents list but has no syscollector data. The agent might not be active or properly configured.`);
          } else {
            throw apiError; // Re-throw other errors to be caught by the outer catch block
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching agent details:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch agent details');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAgentDetails(selectedAgentId as string)
      .finally(() => {
        setTimeout(() => setRefreshing(false), 500);
      });
  };

  // Handle agent change
  const handleAgentChange = (agentId: string) => {
    console.log(`Changing selected agent to: ${agentId}`);
    setSelectedAgentId(agentId);
  };

  if (loading && !agentDetails) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-neutral-300">Loading Wazuh data...</p>
          <p className="text-neutral-500 text-sm mt-2">Connecting to Wazuh server and retrieving agent information...</p>
        </div>
      </div>
    );
  }

  if (error && !agentDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertTriangle className="h-12 w-12 text-error-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Wazuh Data</h2>
        <p className="text-neutral-400 mb-2">{error}</p>
        <div className="text-neutral-500 text-sm max-w-md text-center mb-4">
          <p className="mb-2">
            This could be due to connection issues with the Wazuh server or invalid credentials.
            Please verify your server is running and try reconfiguring.
          </p>
          <div className="bg-background-light p-3 rounded text-left mt-3">
            <p className="text-neutral-400 mb-2 font-medium">Debugging steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-neutral-500">
              <li>Check if the Wazuh server is reachable at the specified URL</li>
              <li>Verify your Wazuh API credentials are correct</li>
              <li>Ensure the agent is properly registered and active</li>
              <li>Check if your Wazuh API version is compatible (v4.x+)</li>
            </ol>
          </div>
        </div>
        <button 
          className="btn-primary"
          onClick={() => window.location.href = 'http://localhost:5173/integrations/wazuh-config'}
        >
          Reconfigure Wazuh
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Wazuh Security Dashboard</h1>
          <p className="text-neutral-400 mt-1">Agent security status and compliance overview</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <AgentSelector 
            agents={agents} 
            selectedAgentId={selectedAgentId} 
            onAgentChange={handleAgentChange}
          />
          
          <button 
            className={`btn-outline p-2 ${refreshing ? 'opacity-50' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && agentDetails ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary-500" />
            <p className="text-neutral-300">Refreshing agent data...</p>
          </div>
        </div>
      ) : agents.length > 0 && selectedAgentId && !agentDetails && !loading ? (
        <div className="flex flex-col items-center justify-center h-96">
          <AlertTriangle className="h-12 w-12 text-warning-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Agent Data Unavailable</h2>
          <p className="text-neutral-400 mb-2">
            Could not retrieve data for the selected agent (ID: {selectedAgentId}).
          </p>
          <div className="text-neutral-500 text-sm max-w-md text-center mb-4">
            <p className="mb-2">
              The agent might be offline or still initializing. Try selecting a different agent or refreshing.
            </p>
            <div className="bg-background-light p-3 rounded text-left mt-3">
              <p className="text-neutral-400 mb-2 font-medium">Available agents:</p>
              <ul className="list-disc list-inside space-y-1 text-neutral-500">
                {agents.map(agent => (
                  <li key={agent.id} className={agent.id === selectedAgentId ? 'text-primary-400' : ''}>
                    {agent.name} (ID: {agent.id}, Status: {agent.status})
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              className="btn-secondary"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </button>
            <button 
              className="btn-primary"
              onClick={() => window.location.href = 'http://localhost:5173/integrations/wazuh-config'}
            >
              Reconfigure Wazuh
            </button>
          </div>
        </div>
      ) : (
        <>
          {agentDetails && (
            <div className="space-y-6">
              <ComplianceOverview agent={agentDetails} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <SystemInformation agent={agentDetails} />
                </div>
                <div className="lg:col-span-2">
                  <SCAResults agent={agentDetails} />
                </div>
              </div>
              
              {/* Add processes and ports information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ProcessesTable processes={agentDetails.processes || []} />
                </div>
                <div>
                  <PortsTable ports={agentDetails.ports || []} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WazuhResult; 