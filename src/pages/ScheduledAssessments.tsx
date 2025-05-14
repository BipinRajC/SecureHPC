import React, { useEffect } from 'react';
import { useComplianceStore } from '../store/complianceStore';
import { Clock, Calendar, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const ScheduledAssessments: React.FC = () => {
  const { 
    assessments, 
    frameworks, 
    tools, 
    loading, 
    error, 
    fetchAssessments, 
    fetchFrameworks, 
    fetchTools 
  } = useComplianceStore();

  useEffect(() => {
    fetchAssessments();
    fetchFrameworks();
    fetchTools();
  }, [fetchAssessments, fetchFrameworks, fetchTools]);
  
  const scheduledAssessments = assessments
    .filter(a => a.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const getFrameworkName = (frameworkId: string) => {
    const framework = frameworks.find(f => f.id === frameworkId);
    return framework ? framework.name : 'Unknown Framework';
  };
  
  const getToolName = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    return tool ? tool.name : 'Unknown Tool';
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Scheduled Assessments</h1>
          <p className="text-neutral-400 mt-1">Manage and schedule upcoming security assessments</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="btn-primary">Schedule New Assessment</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <div className="flex items-center mb-4">
              <Clock size={20} className="text-primary-500 mr-2" />
              <h2 className="text-xl font-semibold text-white">Upcoming Assessments</h2>
            </div>
            
            {loading.assessments || loading.frameworks || loading.tools ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-primary-400">Loading scheduled assessments...</div>
              </div>
            ) : error.assessments ? (
              <div className="text-center py-8 text-error-500">
                <AlertTriangle size={40} className="mx-auto mb-2" />
                <p>Error loading assessments: {error.assessments}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledAssessments.map((assessment) => (
                  <div key={assessment.id} className="bg-background-light p-4 rounded-lg border border-neutral-800">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="mb-3 md:mb-0">
                        <h3 className="font-medium text-white">{assessment.name}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-400 mt-1">
                          <div>Framework: {getFrameworkName(assessment.frameworkId)}</div>
                          <div>Tool: {getToolName(assessment.toolId)}</div>
                          <div>
                            <Calendar size={14} className="inline-block mr-1" />
                            {format(new Date(assessment.date), 'MMM d, yyyy HH:mm')}
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <span className="text-xs bg-primary-900 text-primary-300 py-1 px-2 rounded">
                            {assessment.targetSystems.length} Target Systems
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button className="btn-outline py-1 px-3 text-sm">Edit</button>
                        <button className="btn-outline py-1 px-3 text-sm text-error-500 border-error-800 hover:bg-error-900">Cancel</button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {scheduledAssessments.length === 0 && (
                  <div className="text-center py-12 text-neutral-500">
                    <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="mb-2">No assessments scheduled</p>
                    <p className="text-sm">Schedule your first assessment to get started</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="card mb-6">
            <div className="flex items-center mb-4">
              <CalendarIcon size={20} className="text-primary-500 mr-2" />
              <h2 className="text-lg font-medium text-white">Schedule Assessment</h2>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Assessment Name
                </label>
                <input 
                  type="text" 
                  className="input w-full"
                  placeholder="Enter assessment name"
                />
              </div>
              
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Compliance Framework
                </label>
                <select className="select w-full">
                  <option value="">Select a framework</option>
                  {frameworks.map(framework => (
                    <option key={framework.id} value={framework.id}>
                      {framework.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Assessment Tool
                </label>
                <select className="select w-full">
                  <option value="">Select a tool</option>
                  {tools
                    .filter(tool => tool.status === 'active')
                    .map(tool => (
                      <option key={tool.id} value={tool.id}>
                        {tool.name}
                      </option>
                    ))
                  }
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Target Systems
                </label>
                <select className="select w-full" multiple size={4}>
                  <option value="hpc-cluster-1">Main HPC Cluster</option>
                  <option value="storage-system-1">Primary Storage Array</option>
                  <option value="network-system-1">Core Network Switch</option>
                  <option value="compute-node-1">Compute Node 1</option>
                  <option value="compute-node-2">Compute Node 2</option>
                </select>
                <p className="text-xs text-neutral-500 mt-1">
                  Hold Ctrl/Cmd to select multiple systems
                </p>
              </div>
              
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Schedule Date & Time
                </label>
                <input 
                  type="datetime-local" 
                  className="input w-full"
                />
              </div>
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="repeat"
                  className="w-4 h-4 text-primary-600 bg-background-light border-neutral-600 rounded focus:ring-primary-500 focus:ring-2"
                />
                <label htmlFor="repeat" className="ml-2 text-sm text-neutral-300">
                  Repeat this assessment
                </label>
              </div>
              
              <button type="submit" className="btn-primary w-full">
                Schedule Assessment
              </button>
            </form>
          </div>
          
          <div className="card">
            <h2 className="text-lg font-medium text-white mb-4">Quick Tips</h2>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-background-light rounded">
                <p className="text-neutral-200">
                  <span className="font-medium text-primary-400">💡 Best Practice:</span> Schedule assessments during off-peak hours to minimize impact on system performance.
                </p>
              </div>
              
              <div className="p-3 bg-background-light rounded">
                <p className="text-neutral-200">
                  <span className="font-medium text-primary-400">💡 Recommendation:</span> Set up recurring assessments for critical systems to maintain continuous compliance monitoring.
                </p>
              </div>
              
              <div className="p-3 bg-background-light rounded">
                <p className="text-neutral-200">
                  <span className="font-medium text-primary-400">💡 Note:</span> Different frameworks may require different assessment tools. Ensure compatibility before scheduling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledAssessments;