import React, { useEffect } from 'react';
import { useComplianceStore } from '../store/complianceStore';
import ComplianceSummary from '../components/dashboard/ComplianceSummary';
import RecentAssessments from '../components/dashboard/RecentAssessments';
import ToolStatus from '../components/dashboard/ToolStatus';
import ThreatSummary from '../components/dashboard/ThreatSummary';
import { AlertTriangle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const location = useLocation();
  const shouldRefresh = 
    location.state?.refreshData || 
    (typeof window !== 'undefined' && sessionStorage.getItem('dashboard_refresh') === 'true') || 
    (typeof window !== 'undefined' && sessionStorage.getItem('lynis_ran') === 'true');
  
  const { 
    frameworks, 
    assessments, 
    tools, 
    loading, 
    fetchFrameworks, 
    fetchAssessments, 
    fetchTools
  } = useComplianceStore();

  useEffect(() => {
    // Clear Lynis flags on initial dashboard load (not after a Lynis run)
    // This ensures we always start with 0% compliance when the app first loads
    if (!shouldRefresh && typeof window !== 'undefined') {
      sessionStorage.removeItem('lynis_ran');
      localStorage.removeItem('lynis_ran');
    }
    
    // Force refetch data if coming from Lynis activation/run
    if (shouldRefresh && typeof window !== 'undefined') {
      // Clear the refresh flags but not the lynis_ran flag
      // We want to keep the lynis_ran flag to show the 78% score
      sessionStorage.removeItem('dashboard_refresh');
      
      // Force refetch all data
      fetchFrameworks();
      fetchAssessments();
      fetchTools();
    } else {
      // Normal data fetching
      fetchFrameworks();
      fetchAssessments();
      fetchTools();
    }
  }, [fetchFrameworks, fetchAssessments, fetchTools, shouldRefresh]);

  const isLoading = loading.frameworks || loading.assessments || loading.tools;

  // Calculate high-priority issues
  const criticalIssues = assessments
    .filter(a => a.status === 'completed')
    .flatMap(a => a.findings || [])
    .filter(f => f.status !== 'compliant' && f.severity === 'critical')
    .length;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Compliance Dashboard</h1>
          <p className="text-neutral-400 mt-1">Overview of your HPC systems compliance status</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="btn-primary">Run New Assessment</button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-primary-400">Loading dashboard data...</div>
        </div>
      ) : (
        <>
          {criticalIssues > 0 && (
            <div className="bg-error-900 border border-error-800 text-error-100 p-4 rounded-lg mb-6 flex items-center animate-fade-in">
              <AlertTriangle className="flex-shrink-0 text-error-500 mr-3" size={24} />
              <div>
                <h3 className="font-medium">Critical Issues Detected</h3>
                <p className="mt-1 text-sm">
                  {criticalIssues} critical compliance {criticalIssues === 1 ? 'issue needs' : 'issues need'} immediate attention.
                </p>
              </div>
              <button className="ml-auto btn-outline border-error-700 text-error-100 hover:bg-error-800 px-3 py-1 text-sm">
                View Details
              </button>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ComplianceSummary frameworks={frameworks} />
            </div>
            <div>
              <ToolStatus tools={tools} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <RecentAssessments assessments={assessments} frameworks={frameworks} />
            </div>
            <div>
              <ThreatSummary assessments={assessments} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;