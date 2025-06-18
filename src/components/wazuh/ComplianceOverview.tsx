import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ShieldCheck, ShieldX, Info, Clock, FileText } from 'lucide-react';
import { useComplianceStore } from '../../store/complianceStore';
import ReactMarkdown from 'react-markdown';

interface ComplianceOverviewProps {
  agent: any;
}

// Compliance frameworks
const COMPLIANCE_FRAMEWORKS = [
  { id: 'pci_dss', name: 'PCI-DSS', color: '#3b82f6' }, 
  { id: 'gdpr', name: 'GDPR', color: '#10b981' }, 
  { id: 'hipaa', name: 'HIPAA', color: '#f59e0b' },
  { id: 'nist_800_53', name: 'NIST', color: '#8b5cf6' }
];

const ComplianceOverview: React.FC<ComplianceOverviewProps> = ({ agent }) => {
  const [selectedFramework, setSelectedFramework] = useState(COMPLIANCE_FRAMEWORKS[0]);
  const [complianceData, setComplianceData] = useState({
    pass: 0,
    fail: 0,
    notApplicable: 0,
    total: 0,
  });
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showRemediationModal, setShowRemediationModal] = useState(false);
  
  const { 
    loading, 
    dashboardAnalysis, 
    remediationPlan,
    analyzeDashboard, 
    generateCISAnalysis, 
    generateRemediationPlan 
  } = useComplianceStore();

  // This would normally fetch data from the backend based on the agent and framework
  // For demonstration, we're generating random data
  useEffect(() => {
    if (agent) {
      // In a real app, we would fetch compliance status for the selected framework
      // For this demo, we'll generate randomized data for each framework
      const generateComplianceData = () => {
        const frameworkSeed = selectedFramework.id.charCodeAt(0);
        const agentSeed = parseInt(agent.info?.id || '0');
        const seed = (frameworkSeed + agentSeed) % 100;
        
        // Generate data with a slight bias toward passing (better visuals for demo)
        const total = 70 + Math.floor(seed % 30);
        const pass = Math.floor(total * (0.6 + (seed % 20) / 100));
        const fail = Math.floor(total * (0.1 + (seed % 15) / 100));
        const notApplicable = total - pass - fail;
        
        setComplianceData({
          pass,
          fail, 
          notApplicable,
          total
        });
      };
      
      generateComplianceData();
    }
  }, [agent, selectedFramework]);

  // Chart data
  const chartData = [
    { name: 'Pass', value: complianceData.pass },
    { name: 'Fail', value: complianceData.fail },
    { name: 'N/A', value: complianceData.notApplicable }
  ];

  const COLORS = ['#10b981', '#ef4444', '#6b7280'];
  
  // Calculate compliance percentage
  const compliancePercentage = complianceData.total > 0 
    ? Math.round((complianceData.pass / (complianceData.pass + complianceData.fail)) * 100)
    : 0;
    
  // Handle CIS compliance analysis
  const handleAnalyzeCISCompliance = async () => {
    // Create dashboard data for analysis
    const criticalFindings = [{
      standard: selectedFramework.name,
      rule: 'System Configuration',
      description: `${complianceData.fail} failing controls detected in ${agent.info?.name || 'agent'}`
    }];
    
    // Create dashboard data for analysis
    const dashboardData = {
      summary: {
        overallCompliance: compliancePercentage,
        frameworkCompliance: {
          [selectedFramework.name]: compliancePercentage
        }
      },
      criticalIssues: criticalFindings,
      toolStatus: [{
        name: 'Wazuh',
        status: 'Active'
      }]
    };
    
    // Call the dashboard analysis function
    await analyzeDashboard(dashboardData);
    
    // Show the analysis modal
    setShowAnalysisModal(true);
  };
  
  // Handle remediation plan generation
  const handleGenerateRemediationPlan = async () => {
    // Generate a CIS analysis first if needed
    await generateCISAnalysis();
    
    // Generate remediation plan based on the analysis
    await generateRemediationPlan();
    
    // Show the remediation plan modal
    setShowRemediationModal(true);
  };

  return (
    <div className="card">
      <h2 className="text-lg font-medium text-white mb-4">Compliance Status</h2>
      
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-1/3 mb-6 lg:mb-0">
          <div className="flex flex-wrap gap-2 mb-4">
            {COMPLIANCE_FRAMEWORKS.map(framework => (
              <button
                key={framework.id}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedFramework.id === framework.id 
                    ? 'bg-primary-900 text-primary-400 border border-primary-700'
                    : 'text-neutral-400 border border-neutral-800 hover:border-neutral-700'
                }`}
                onClick={() => setSelectedFramework(framework)}
              >
                {framework.name}
              </button>
            ))}
          </div>
          
          <div className="text-center mb-4">
            <div className="text-4xl font-bold" style={{ color: compliancePercentage >= 70 ? '#10b981' : '#ef4444' }}>
              {compliancePercentage}%
            </div>
            <div className="text-neutral-400 text-sm">Overall Compliance</div>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-success-500"></div>
              <div className="text-sm">
                <span className="text-neutral-300">{complianceData.pass} Passing</span>
                <span className="text-neutral-600 ml-2">
                  ({Math.round((complianceData.pass / complianceData.total) * 100)}%)
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-error-500"></div>
              <div className="text-sm">
                <span className="text-neutral-300">{complianceData.fail} Failing</span>
                <span className="text-neutral-600 ml-2">
                  ({Math.round((complianceData.fail / complianceData.total) * 100)}%)
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-neutral-500"></div>
              <div className="text-sm">
                <span className="text-neutral-300">{complianceData.notApplicable} Not Applicable</span>
                <span className="text-neutral-600 ml-2">
                  ({Math.round((complianceData.notApplicable / complianceData.total) * 100)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:w-2/3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-background-light p-4 rounded-lg mt-4">
        <div className="flex items-start">
          <div className="mr-3">
            {compliancePercentage >= 70 ? (
              <ShieldCheck className="h-5 w-5 text-success-500" />
            ) : (
              <ShieldX className="h-5 w-5 text-error-500" />
            )}
          </div>
          <div>
            <h3 className="text-white font-medium">
              {selectedFramework.name} Compliance Status: {compliancePercentage >= 70 ? 'Passing' : 'Failing'}
            </h3>
            <p className="text-neutral-400 text-sm mt-1">
              {compliancePercentage >= 70 
                ? `The agent meets ${compliancePercentage}% of the ${selectedFramework.name} requirements.`
                : `The agent fails to meet ${selectedFramework.name} requirements with only ${compliancePercentage}% compliance.`
              }
            </p>
            
            <div className="flex items-center mt-3">
              <Info className="h-4 w-4 text-primary-400 mr-2" />
              <span className="text-xs text-primary-400">
                View detailed {selectedFramework.name} compliance report
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        <button 
          className={`px-4 py-2 rounded-md flex items-center ${loading.dashboardAnalysis ? 'opacity-75 cursor-not-allowed' : ''}`}
          style={{ backgroundColor: '#4CAF50', color: 'white' }} 
          onClick={handleAnalyzeCISCompliance}
          disabled={loading.dashboardAnalysis}
        >
          <Clock className="h-4 w-4 mr-2" />
          {loading.dashboardAnalysis ? 'Analyzing...' : 'Analyze CIS Compliance'}
        </button>
        <button 
          className={`px-4 py-2 rounded-md flex items-center ${loading.remediationPlan ? 'opacity-75 cursor-not-allowed' : ''}`}
          style={{ backgroundColor: '#3f51b5', color: 'white' }} 
          onClick={handleGenerateRemediationPlan}
          disabled={loading.remediationPlan}
        >
          <FileText className="h-4 w-4 mr-2" />
          {loading.remediationPlan ? 'Generating...' : 'Generate Remediation Plan'}
        </button>
      </div>
      
      {/* Analysis Modal */}
      {showAnalysisModal && dashboardAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-white">CIS Compliance Analysis</h2>
                <button 
                  className="text-neutral-400 hover:text-white"
                  onClick={() => setShowAnalysisModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{dashboardAnalysis}</ReactMarkdown>
              </div>
              <div className="flex justify-end mt-6">
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setShowAnalysisModal(false);
                    handleGenerateRemediationPlan();
                  }}
                >
                  Generate Remediation Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Remediation Plan Modal */}
      {showRemediationModal && remediationPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-white">Security Remediation Plan</h2>
                <button 
                  className="text-neutral-400 hover:text-white"
                  onClick={() => setShowRemediationModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{remediationPlan}</ReactMarkdown>
              </div>
              <div className="flex justify-end mt-6">
                <button 
                  className="btn-primary"
                  onClick={() => setShowRemediationModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceOverview; 