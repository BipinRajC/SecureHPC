import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  ChevronDown, 
  ChevronRight,
  SortAsc,
  SortDesc
} from 'lucide-react';
import axios from 'axios';

interface SCAResultsProps {
  agent: any;
}

const SCAResults: React.FC<SCAResultsProps> = ({ agent }) => {
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [policyResults, setPolicyResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Set initial selected policy when agent changes
  useEffect(() => {
    if (agent && agent.sca && agent.sca.length > 0) {
      setSelectedPolicy(agent.sca[0]);
    } else {
      setSelectedPolicy(null);
      setPolicyResults([]);
    }
  }, [agent]);

  // Fetch policy results when selected policy changes
  useEffect(() => {
    if (selectedPolicy && agent?.info?.id) {
      fetchPolicyResults(agent.info.id, selectedPolicy.policy_id);
    }
  }, [selectedPolicy, agent]);

  // Fetch SCA results for a specific policy
  const fetchPolicyResults = async (agentId: string, policyId: string) => {
    try {
      setLoading(true);
      setError(null);

      // In a real app, we would fetch from the backend
      // For demo purposes, we'll generate some mock data if the API call fails
      try {
        const response = await axios.get(
          `http://localhost:3001/api/tools/wazuh/agents/${agentId}/sca/${policyId}`
        );
        
        if (response.data.status === 'ok' && response.data.data && response.data.data.data) {
          setPolicyResults(response.data.data.data.affected_items || []);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (apiError) {
        console.error('API error, using mock data:', apiError);
        // Generate mock data
        generateMockResults(policyId);
      }
    } catch (error: any) {
      console.error('Error fetching policy results:', error);
      setError(error.message || 'Failed to fetch policy results');
    } finally {
      setLoading(false);
    }
  };

  // Generate mock SCA results for demo purposes
  const generateMockResults = (policyId: string) => {
    const mockRules = [];
    const severityOptions = ['critical', 'high', 'medium', 'low'];
    const resultOptions = ['passed', 'failed', 'not_applicable'];
    
    // Generate different results based on policy to simulate different frameworks
    const seed = policyId.charCodeAt(0) % 10;
    
    for (let i = 1; i <= 50; i++) {
      const idSeed = i + seed;
      const severityIndex = idSeed % 4;
      
      // Weighted distribution: more passes than fails
      let resultIndex;
      if (idSeed % 5 === 0) {
        resultIndex = 1; // fail
      } else if (idSeed % 7 === 0) {
        resultIndex = 2; // not applicable 
      } else {
        resultIndex = 0; // pass
      }
      
      mockRules.push({
        id: i,
        rule_id: `rule-${i + seed * 100}`,
        title: `Security configuration rule ${i}`,
        description: `This rule checks for a critical security setting that helps prevent unauthorized access to the system. Rule ID ${i + seed * 100}.`,
        rationale: `This configuration is required to maintain a secure system and comply with industry best practices.`,
        remediation: `Modify the system configuration file to include the required security parameters.`,
        compliance: [
          { requirement: 'PCI-DSS', value: '2.2' },
          { requirement: 'GDPR', value: 'Article 32' }
        ],
        severity: severityOptions[severityIndex],
        result: resultOptions[resultIndex]
      });
    }
    
    setPolicyResults(mockRules);
  };

  // Toggle expanded state for an item
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Get severity badge color
  const getSeverityColor = (severity: string | undefined) => {
    if (!severity) {
      // fallback color for missing severity
      return 'bg-neutral-900 text-neutral-400 border-neutral-800';
    }
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-error-800 text-error-300 border-error-700';
      case 'high':
        return 'bg-error-900 text-error-400 border-error-800';
      case 'medium':
        return 'bg-warning-900 text-warning-400 border-warning-800';
      case 'low':
        return 'bg-info-900 text-info-400 border-info-800';
      default:
        return 'bg-neutral-900 text-neutral-400 border-neutral-800';
    }
  };

  // Get result badge color
  const getResultColor = (result: string) => {
    switch (result.toLowerCase()) {
      case 'passed':
        return 'bg-success-900 text-success-400 border-success-800';
      case 'failed':
        return 'bg-error-900 text-error-400 border-error-800';
      case 'not_applicable':
      default:
        return 'bg-neutral-900 text-neutral-400 border-neutral-800';
    }
  };

  // Get result icon
  const getResultIcon = (result: string) => {
    switch (result.toLowerCase()) {
      case 'passed':
        return <CheckCircle size={16} className="text-success-500" />;
      case 'failed':
        return <AlertTriangle size={16} className="text-error-500" />;
      case 'not_applicable':
      default:
        return <ChevronRight size={16} className="text-neutral-500" />;
    }
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter results based on search term
  const filteredResults = policyResults.filter(rule =>
    rule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort results
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField]?.toLowerCase();
    const bValue = b[sortField]?.toLowerCase();
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Get counts for display
  const passCount = filteredResults.filter(r => r.result === 'passed').length;
  const failCount = filteredResults.filter(r => r.result === 'failed').length;
  const naCount = filteredResults.filter(r => r.result === 'not_applicable').length;

  return (
    <div className="card h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-lg font-medium text-white mb-2 sm:mb-0">Security Configuration Assessment</h2>
        
        {agent?.sca?.length > 0 && (
          <div className="relative inline-block text-left">
            <select 
              className="input text-sm border border-neutral-800 rounded-md pr-8"
              value={selectedPolicy?.policy_id || ''}
              onChange={(e) => {
                const policyId = e.target.value;
                const policy = agent.sca.find((p: any) => p.policy_id === policyId);
                if (policy) {
                  setSelectedPolicy(policy);
                }
              }}
            >
              {agent.sca.map((policy: any) => (
                <option key={policy.policy_id} value={policy.policy_id}>
                  {policy.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-primary-400">Loading SCA results...</div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-error-500">
          <AlertTriangle size={40} className="mx-auto mb-2" />
          <p>Error loading SCA results: {error}</p>
        </div>
      ) : policyResults.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          <ShieldAlert size={40} className="mx-auto mb-2 opacity-30" />
          <p>No SCA results available for this policy</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={16} className="text-neutral-500" />
              </div>
              <input 
                type="text" 
                placeholder="Search results..." 
                className="input pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-3">
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-success-900 text-success-300 border border-success-800">
                Passing: {passCount}
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-error-900 text-error-300 border border-error-800">
                Failing: {failCount}
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                N/A: {naCount}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-light">
                <tr>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-2"></th>
                  <th 
                    className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-2 cursor-pointer"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center">
                      Rule
                      {sortField === 'title' && (
                        sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-2 cursor-pointer"
                    onClick={() => handleSort('severity')}
                  >
                    <div className="flex items-center">
                      Severity
                      {sortField === 'severity' && (
                        sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-2 cursor-pointer"
                    onClick={() => handleSort('result')}
                  >
                    <div className="flex items-center">
                      Result
                      {sortField === 'result' && (
                        sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((rule: any) => (
                  <React.Fragment key={rule.id || rule.rule_id}>
                    <tr 
                      className={`border-t border-neutral-800 hover:bg-background-light transition-colors cursor-pointer ${
                        expandedItems[rule.id || rule.rule_id] ? 'bg-background-light' : ''
                      }`}
                      onClick={() => toggleExpand(rule.id || rule.rule_id)}
                    >
                      <td className="px-4 py-3">
                        {expandedItems[rule.id || rule.rule_id] ? (
                          <ChevronDown size={16} className="text-neutral-500" />
                        ) : (
                          <ChevronRight size={16} className="text-neutral-500" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-300">
                        {rule.title}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded ${getSeverityColor(rule.severity)}`}>
                          {rule.severity || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          {getResultIcon(rule.result)}
                          <span className={`ml-2 text-sm ${
                            rule.result === 'passed' ? 'text-success-500' : 
                            rule.result === 'failed' ? 'text-error-500' : 'text-neutral-500'
                          }`}>
                            {rule.result === 'passed' ? 'Passed' :
                             rule.result === 'failed' ? 'Failed' : 'N/A'}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {expandedItems[rule.id || rule.rule_id] && (
                      <tr className="bg-background-light border-t border-neutral-800">
                        <td colSpan={4} className="px-4 py-4">
                          <div className="space-y-3 text-sm">
                            <div>
                              <h4 className="font-medium text-neutral-300 mb-1">Description</h4>
                              <p className="text-neutral-400">{rule.description}</p>
                            </div>
                            
                            {rule.rationale && (
                              <div>
                                <h4 className="font-medium text-neutral-300 mb-1">Rationale</h4>
                                <p className="text-neutral-400">{rule.rationale}</p>
                              </div>
                            )}
                            
                            {rule.remediation && rule.result === 'failed' && (
                              <div>
                                <h4 className="font-medium text-error-400 mb-1">Remediation</h4>
                                <p className="text-neutral-400">{rule.remediation}</p>
                              </div>
                            )}
                            
                            {rule.compliance && rule.compliance.length > 0 && (
                              <div>
                                <h4 className="font-medium text-neutral-300 mb-1">Compliance References</h4>
                                <div className="flex flex-wrap gap-2">
                                  {rule.compliance.map((item: any, index: number) => (
                                    <span 
                                      key={index} 
                                      className="px-2 py-1 text-xs bg-background rounded border border-neutral-700"
                                    >
                                      {item.requirement}: {item.value}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {rule.rule_id && (
                              <div className="text-xs text-neutral-500">
                                Rule ID: {rule.rule_id}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default SCAResults; 