import React from 'react';
import { format } from 'date-fns';
import { Assessment, ComplianceFramework } from '../../types/compliance';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentAssessmentsProps {
  assessments: Assessment[];
  frameworks: ComplianceFramework[];
}

const RecentAssessments: React.FC<RecentAssessmentsProps> = ({ assessments, frameworks }) => {
  // Filter completed assessments and sort by date (newest first)
  const completedAssessments = assessments
    .filter(a => a.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getFrameworkName = (frameworkId: string) => {
    const framework = frameworks.find(f => f.id === frameworkId);
    return framework ? framework.name : 'Unknown Framework';
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

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Recent Assessments</h2>
        <Link to="/assessments" className="text-primary-400 hover:text-primary-300 flex items-center text-sm">
          View all <ArrowRight size={16} className="ml-1" />
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-neutral-400 border-b border-neutral-800">
            <tr>
              <th className="px-4 py-3">Assessment</th>
              <th className="px-4 py-3">Framework</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {completedAssessments.map((assessment) => (
              <tr key={assessment.id} className="hover:bg-background-light transition-colors">
                <td className="px-4 py-3 font-medium text-white">{assessment.name}</td>
                <td className="px-4 py-3">{getFrameworkName(assessment.frameworkId)}</td>
                <td className="px-4 py-3">{format(new Date(assessment.date), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3">{getStatusBadge(assessment.summaryScore)}</td>
              </tr>
            ))}
            
            {completedAssessments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  No completed assessments yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 pt-4 border-t border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-neutral-400">
              Next scheduled assessment:
            </span>
            {assessments.filter(a => a.status === 'scheduled').length > 0 ? (
              <div className="mt-1 text-white">
                {assessments.filter(a => a.status === 'scheduled')
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]?.name}
              </div>
            ) : (
              <div className="mt-1 text-neutral-500">None scheduled</div>
            )}
          </div>
          <Link to="/scheduled" className="btn-primary">
            Schedule New
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecentAssessments;