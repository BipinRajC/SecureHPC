import React, { useState } from 'react';
import { ChevronDown, Computer, X } from 'lucide-react';

interface AgentSelectorProps {
  agents: any[];
  selectedAgentId: string | null;
  onAgentChange: (agentId: string) => void;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({ 
  agents, 
  selectedAgentId, 
  onAgentChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Find the selected agent for display
  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);
  
  // Helper to get agent status indicator color
  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-500';
      case 'disconnected':
        return 'bg-error-500';
      case 'pending':
        return 'bg-warning-500';
      case 'never_connected':
        return 'bg-neutral-500';
      default:
        return 'bg-neutral-500';
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleAgentSelect = (agentId: string) => {
    onAgentChange(agentId);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        className="btn-outline inline-flex w-full justify-between items-center"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {selectedAgent ? (
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${getAgentStatusColor(selectedAgent.status)}`}></div>
            <span className="mr-1">{selectedAgent.name}</span>
            <span className="text-xs text-neutral-500">(ID: {selectedAgent.id})</span>
          </div>
        ) : (
          <span>Select Agent</span>
        )}
        <ChevronDown className="-mr-1 h-4 w-4 ml-2" />
      </button>

      {isOpen && (
        <div
          className="absolute z-10 right-0 mt-2 w-72 rounded-md shadow-lg bg-background-card border border-neutral-700 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          tabIndex={-1}
        >
          <div className="flex justify-between items-center px-4 py-2 border-b border-neutral-700">
            <span className="text-sm font-medium text-neutral-300">Select an agent</span>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="py-1 max-h-60 overflow-auto scrollbar-thin" role="none">
            {agents.length === 0 ? (
              <div className="px-4 py-2 text-sm text-neutral-400">No agents available</div>
            ) : (
              agents.map((agent) => (
                <button
                  key={agent.id}
                  className={`flex items-center w-full px-4 py-2 text-sm ${
                    selectedAgentId === agent.id 
                      ? 'bg-primary-900 text-primary-400' 
                      : 'text-neutral-300 hover:bg-background-light'
                  }`}
                  role="menuitem"
                  onClick={() => handleAgentSelect(agent.id)}
                >
                  <div className={`h-2 w-2 rounded-full mr-2 ${getAgentStatusColor(agent.status)}`}></div>
                  <div className="flex-1">
                    <div className="font-medium flex items-center">
                      <Computer size={14} className="mr-1" />
                      {agent.name}
                    </div>
                    <div className="text-xs text-neutral-500 flex flex-col mt-1">
                      <span>ID: {agent.id}</span>
                      {agent.ip && <span>IP: {agent.ip}</span>}
                      <span className="capitalize">Status: {agent.status}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSelector; 