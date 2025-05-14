import React, { useEffect, useState } from 'react';
import { useComplianceStore } from '../store/complianceStore';
import { Shield, AlertTriangle, CheckCircle, CircleSlash, ArrowUpDown, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ComplianceFramework } from '../types/compliance';

const ComplianceFrameworks: React.FC = () => {
  const { frameworks, loading, error, fetchFrameworks } = useComplianceStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'status' | 'compliantCount'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchFrameworks();
  }, [fetchFrameworks]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle size={16} className="text-success-500" />;
      case 'partially-compliant':
        return <AlertTriangle size={16} className="text-warning-500" />;
      case 'non-compliant':
        return <AlertTriangle size={16} className="text-error-500" />;
      case 'not-assessed':
        return <CircleSlash size={16} className="text-neutral-500" />;
      default:
        return <CircleSlash size={16} className="text-neutral-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'compliant':
        return <span className="text-success-500">Compliant</span>;
      case 'partially-compliant':
        return <span className="text-warning-500">Partially Compliant</span>;
      case 'non-compliant':
        return <span className="text-error-500">Non-Compliant</span>;
      case 'not-assessed':
        return <span className="text-neutral-500">Not Assessed</span>;
      default:
        return <span className="text-neutral-500">Unknown</span>;
    }
  };

  const handleSort = (field: 'name' | 'status' | 'compliantCount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortFrameworks = (a: ComplianceFramework, b: ComplianceFramework) => {
    const statusOrder = {
      'compliant': 0,
      'partially-compliant': 1,
      'non-compliant': 2,
      'not-assessed': 3
    };
    
    if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortField === 'status') {
      const aOrder = statusOrder[a.status as keyof typeof statusOrder];
      const bOrder = statusOrder[b.status as keyof typeof statusOrder];
      return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
    } else if (sortField === 'compliantCount') {
      const aPercentage = a.totalControls > 0 ? (a.compliantCount / a.totalControls) : 0;
      const bPercentage = b.totalControls > 0 ? (b.compliantCount / b.totalControls) : 0;
      return sortDirection === 'asc' ? aPercentage - bPercentage : bPercentage - aPercentage;
    }
    return 0;
  };

  const filteredFrameworks = frameworks
    .filter(fw => fw.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  fw.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort(sortFrameworks);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Compliance Frameworks</h1>
          <p className="text-neutral-400 mt-1">Manage and assess against security compliance frameworks</p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Link to="/custom-frameworks" className="btn-secondary">Create Custom Framework</Link>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-col md:flex-row justify-between gap-4">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-neutral-500" />
            </div>
            <input 
              type="text" 
              placeholder="Search frameworks..." 
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <button 
              className="btn-outline text-sm"
              onClick={() => handleSort('name')}
            >
              Name
              <ArrowUpDown size={14} className="ml-1" />
            </button>
            <button 
              className="btn-outline text-sm"
              onClick={() => handleSort('status')}
            >
              Status
              <ArrowUpDown size={14} className="ml-1" />
            </button>
            <button 
              className="btn-outline text-sm"
              onClick={() => handleSort('compliantCount')}
            >
              Compliance
              <ArrowUpDown size={14} className="ml-1" />
            </button>
          </div>
        </div>
        
        {loading.frameworks ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-primary-400">Loading frameworks...</div>
          </div>
        ) : error.frameworks ? (
          <div className="text-center py-8 text-error-500">
            <AlertTriangle size={40} className="mx-auto mb-2" />
            <p>Error loading frameworks: {error.frameworks}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFrameworks.map((framework) => {
              const compliancePercentage = framework.totalControls > 0 
                ? Math.round((framework.compliantCount / framework.totalControls) * 100) 
                : 0;
              
              let progressColor = 'bg-error-500';
              if (compliancePercentage >= 80) progressColor = 'bg-success-500';
              else if (compliancePercentage >= 50) progressColor = 'bg-warning-500';
              
              return (
                <div key={framework.id} className="bg-background-light p-5 rounded-lg border border-neutral-800 hover:border-primary-700 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <Shield size={20} className="text-primary-500 mr-2" />
                      <h3 className="font-medium text-white">{framework.name}</h3>
                    </div>
                    {framework.custom && (
                      <span className="badge-neutral">Custom</span>
                    )}
                  </div>
                  
                  <p className="text-sm text-neutral-300 mb-4 line-clamp-2">
                    {framework.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center">
                      <span className="mr-1">{getStatusIcon(framework.status)}</span>
                      {getStatusText(framework.status)}
                    </div>
                    <div className="text-neutral-400">v{framework.version}</div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Compliance</span>
                      <span>{compliancePercentage}%</span>
                    </div>
                    <div className="w-full bg-background-dark rounded-full h-1.5">
                      <div 
                        className={`${progressColor} h-1.5 rounded-full transition-all duration-500`}
                        style={{ width: `${compliancePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-neutral-400 mb-4">
                    {framework.status !== 'not-assessed' && framework.lastAssessed ? (
                      <span>Last assessed on {new Date(framework.lastAssessed).toLocaleDateString()}</span>
                    ) : (
                      <span>Not yet assessed</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between">
                    <button className="btn-outline py-1 px-3 text-sm">View Details</button>
                    <button className="btn-primary py-1 px-3 text-sm">Run Assessment</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {!loading.frameworks && filteredFrameworks.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            <Shield size={40} className="mx-auto mb-3 opacity-30" />
            <p className="mb-2">No frameworks found</p>
            <p className="text-sm">
              {searchTerm ? 
                `No results for "${searchTerm}"` : 
                "Add a compliance framework to get started"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceFrameworks;