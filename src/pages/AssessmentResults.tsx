import React, { useEffect, useState } from 'react';
import { useComplianceStore } from '../store/complianceStore';
import { 
  Database, AlertTriangle, Search, ArrowDownUp,
  CheckCircle2, AlertCircle, CircleSlash, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { Assessment } from '../types/compliance';

const AssessmentResults: React.FC = () => {
  const { assessments, frameworks, loading, error, fetchAssessments, fetchFrameworks } = useComplianceStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchAssessments();
    fetchFrameworks();
  }, [fetchAssessments, fetchFrameworks]);

  const getFrameworkName = (frameworkId: string) => {
    const framework = frameworks.find(f => f.id === frameworkId);
    return framework ? framework.name : 'Unknown Framework';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-success-500" />;
      case 'in-progress':
        return <AlertCircle size={16} className="text-warning-500" />;
      case 'scheduled':
        return <AlertCircle size={16} className="text-primary-500" />;
      case 'failed':
        return <AlertTriangle size={16} className="text-error-500" />;
      default:
        return <CircleSlash size={16} className="text-neutral-500" />;
    }
  };

  const getStatusBadge = (score?: number) => {
    if (score === undefined) return <span className="badge-neutral">No Score</span>;
    
    if (score >= 80) {
      return <span className="badge-success">{score}%</span>;
    } else if (score >= 50) {
      return <span className="badge-warning">{score}%</span>;
    } else {
      return <span className="badge-error">{score}%</span>;
    }
  };

  const filteredAssessments = assessments
    .filter(assessment => 
      (statusFilter === 'all' || assessment.status === statusFilter) &&
      (assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       getFrameworkName(assessment.frameworkId).toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Assessment Results</h1>
          <p className="text-neutral-400 mt-1">View and analyze security assessment results</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="btn-primary">Export Reports</button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <div className="relative w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-neutral-500" />
            </div>
            <input 
              type="text" 
              placeholder="Search assessments..." 
              className="input pl-10 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <select 
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="scheduled">Scheduled</option>
              <option value="failed">Failed</option>
            </select>
            
            <button className="btn-outline">
              <ArrowDownUp size={16} />
              <span className="ml-2 hidden md:inline">Sort</span>
            </button>
          </div>
        </div>
        
        {loading.assessments || loading.frameworks ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-primary-400">Loading assessment results...</div>
          </div>
        ) : error.assessments ? (
          <div className="text-center py-8 text-error-500">
            <AlertTriangle size={40} className="mx-auto mb-2" />
            <p>Error loading assessments: {error.assessments}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="px-4 py-3">Assessment</th>
                  <th className="px-4 py-3">Framework</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredAssessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-background-light transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{assessment.name}</td>
                    <td className="px-4 py-3">{getFrameworkName(assessment.frameworkId)}</td>
                    <td className="px-4 py-3">{format(new Date(assessment.date), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {getStatusIcon(assessment.status)}
                        <span className="ml-2 capitalize">{assessment.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {assessment.status === 'completed' ? getStatusBadge(assessment.summaryScore) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end space-x-2">
                        {assessment.status === 'completed' && (
                          <button className="btn-outline py-1 px-3 text-xs inline-flex items-center">
                            <ExternalLink size={14} className="mr-1" />
                            View Report
                          </button>
                        )}
                        <button className="btn-primary py-1 px-3 text-xs">Details</button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredAssessments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                      <Database size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="mb-1">No assessment results found</p>
                      <p className="text-sm">
                        {searchTerm || statusFilter !== 'all' ? 
                          "Try adjusting your search or filters" : 
                          "Run your first assessment to see results here"
                        }
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="text-lg font-medium text-white mb-4">Assessment Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background-light p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-white">
                {assessments.filter(a => a.status === 'completed').length}
              </div>
              <div className="text-sm text-neutral-400">Completed</div>
            </div>
            <div className="bg-background-light p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-white">
                {assessments.filter(a => a.status === 'in-progress').length}
              </div>
              <div className="text-sm text-neutral-400">In Progress</div>
            </div>
            <div className="bg-background-light p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-white">
                {assessments.filter(a => a.status === 'scheduled').length}
              </div>
              <div className="text-sm text-neutral-400">Scheduled</div>
            </div>
            <div className="bg-background-light p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-white">
                {assessments.filter(a => a.status === 'failed').length}
              </div>
              <div className="text-sm text-neutral-400">Failed</div>
            </div>
          </div>
        </div>
        
        <div className="card md:col-span-2">
          <h2 className="text-lg font-medium text-white mb-4">Recent Issues</h2>
          <div className="space-y-3">
            {assessments
              .filter(a => a.status === 'completed' && a.findings)
              .flatMap(a => (a.findings || [])
                .filter(f => f.status !== 'compliant')
                .map(finding => ({
                  assessmentName: a.name,
                  assessmentId: a.id,
                  ...finding
                }))
              )
              .sort((a, b) => {
                const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
                return severityOrder[a.severity as keyof typeof severityOrder] - 
                       severityOrder[b.severity as keyof typeof severityOrder];
              })
              .slice(0, 4)
              .map((issue, index) => (
                <div key={`${issue.assessmentId}-${issue.controlId}-${index}`} className="p-3 bg-background-light rounded-lg">
                  <div className="flex items-start">
                    <div className="mt-0.5">
                      {issue.severity === 'critical' && <AlertTriangle size={16} className="text-error-500" />}
                      {issue.severity === 'high' && <AlertTriangle size={16} className="text-warning-500" />}
                      {issue.severity === 'medium' && <AlertTriangle size={16} className="text-accent-500" />}
                      {(issue.severity === 'low' || issue.severity === 'info') && <AlertCircle size={16} className="text-neutral-400" />}
                    </div>
                    <div className="ml-2">
                      <div className="flex items-center">
                        <h3 className="font-medium text-white">{issue.controlId}</h3>
                        <span className={`ml-2 text-xs py-0.5 px-1.5 rounded-full ${
                          issue.severity === 'critical' ? 'bg-error-900 text-error-100' :
                          issue.severity === 'high' ? 'bg-warning-900 text-warning-100' :
                          issue.severity === 'medium' ? 'bg-accent-900 text-accent-100' :
                          'bg-neutral-700 text-neutral-200'
                        }`}>
                          {issue.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-300 mt-1">{issue.details}</p>
                      <div className="text-xs text-neutral-400 mt-1">
                        From assessment: {issue.assessmentName}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
            
            {assessments.filter(a => a.status === 'completed' && a.findings).length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <CheckCircle2 size={32} className="mx-auto mb-2 opacity-30" />
                <p>No compliance issues found</p>
                <p className="text-sm">All assessed controls are compliant</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResults;