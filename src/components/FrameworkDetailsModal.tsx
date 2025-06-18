import React from 'react';
import { X, Shield, AlertTriangle, CheckCircle, FileText, Terminal, ClipboardCheck } from 'lucide-react';
import { Framework } from '../types/framework';

interface FrameworkDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  framework: Framework | null;
}

const FrameworkDetailsModal: React.FC<FrameworkDetailsModalProps> = ({
  isOpen,
  onClose,
  framework
}) => {
  if (!isOpen || !framework) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-error-500';
      case 'high': return 'text-error-400';
      case 'medium': return 'text-warning-500';
      case 'low': return 'text-success-500';
      default: return 'text-neutral-400';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <span className="badge-error">Critical</span>;
      case 'high':
        return <span className="badge-error">High</span>;
      case 'medium':
        return <span className="badge-warning">Medium</span>;
      case 'low':
        return <span className="badge-success">Low</span>;
      default:
        return <span className="badge-neutral">Unknown</span>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-background-light rounded-lg w-full max-w-4xl p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-900 flex items-center justify-center mr-3">
              <Shield size={20} className="text-primary-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{framework.name}</h2>
              <div className="flex items-center space-x-2 text-sm text-neutral-400">
                <span>v{framework.version}</span>
                <span>•</span>
                <span>{framework.totalControls} controls</span>
                <span>•</span>
                <span>Created: {formatDate(framework.createdAt)}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-neutral-400 hover:text-white"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="border-b border-neutral-700 pb-4">
            <h3 className="text-lg font-medium text-white mb-2">Description</h3>
            <p className="text-neutral-300">{framework.description}</p>
          </div>

          <div className="border-b border-neutral-700 pb-4">
            <h3 className="text-lg font-medium text-white mb-2">Framework Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background-dark p-4 rounded-lg">
                <div className="text-sm text-neutral-400 mb-1">Status</div>
                <div className="text-white font-medium capitalize">{framework.status.replace(/-/g, ' ')}</div>
              </div>
              <div className="bg-background-dark p-4 rounded-lg">
                <div className="text-sm text-neutral-400 mb-1">Supported Tools</div>
                <div className="flex flex-wrap gap-2">
                  {framework.supportedTools.map(tool => (
                    <span 
                      key={tool}
                      className="px-2 py-1 bg-neutral-800 rounded text-xs text-white"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-background-dark p-4 rounded-lg">
                <div className="text-sm text-neutral-400 mb-1">Last Updated</div>
                <div className="text-white font-medium">{formatDate(framework.updatedAt)}</div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Controls ({framework.totalControls})</h3>
              <div className="text-sm text-neutral-400">
                Sorted by severity
              </div>
            </div>

            <div className="space-y-4">
              {framework.controls
                .sort((a, b) => {
                  const severityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
                  return severityOrder[a.severity] - severityOrder[b.severity];
                })
                .map(control => (
                  <div key={control.id} className="border border-neutral-700 rounded-lg overflow-hidden">
                    <div className="bg-background-dark p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <span className="text-white font-medium mr-2">{control.title || control.name}</span>
                          <span className="text-neutral-400 text-xs">{control.id}</span>
                        </div>
                        <div>
                          {getSeverityBadge(control.severity)}
                        </div>
                      </div>
                      <p className="text-neutral-300 text-sm">{control.description}</p>
                    </div>
                    <div className="p-4 bg-background-light border-t border-neutral-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-white mb-2 flex items-center">
                            <AlertTriangle size={14} className="mr-1 text-warning-500" />
                            Requirements
                          </h4>
                          {control.requirements && control.requirements.length > 0 ? (
                            <ul className="text-sm text-neutral-300 list-disc pl-5 space-y-1">
                              {control.requirements.map((req, index) => (
                                <li key={index}>{req}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-neutral-400">No specific requirements defined</p>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white mb-2 flex items-center">
                            <CheckCircle size={14} className="mr-1 text-success-500" />
                            Remediation
                          </h4>
                          <p className="text-sm text-neutral-300">{control.remediation}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex justify-between items-center text-xs text-neutral-400">
                          <div className="flex items-center">
                            <span className="mr-4">Category: <span className="text-neutral-300">{control.category}</span></span>
                            {control.automated !== undefined && (
                              <span>
                                {control.automated ? (
                                  <span className="text-success-500 flex items-center">
                                    <Terminal size={12} className="mr-1" />
                                    Automated
                                  </span>
                                ) : (
                                  <span>Manual check required</span>
                                )}
                              </span>
                            )}
                          </div>
                          
                          {control.references && control.references.length > 0 && (
                            <div className="flex items-center">
                              <FileText size={12} className="mr-1" />
                              <span>
                                {control.references.length} reference{control.references.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {control.references && control.references.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-neutral-800">
                            <h4 className="text-xs text-neutral-400 mb-1">References</h4>
                            <div className="flex flex-wrap gap-1">
                              {control.references.map((ref, index) => (
                                <span 
                                  key={index}
                                  className="px-1.5 py-0.5 bg-neutral-800 rounded text-xs text-neutral-300"
                                >
                                  {ref}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={onClose}
            className="btn-outline"
          >
            Close
          </button>
          <button
            onClick={() => {
              // This would navigate to an evaluation page in a real implementation
              alert('This would start an evaluation of the framework');
            }}
            className="btn-primary flex items-center"
          >
            <ClipboardCheck size={16} className="mr-2" />
            Evaluate Framework
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrameworkDetailsModal; 