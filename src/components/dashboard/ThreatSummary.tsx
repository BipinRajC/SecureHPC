import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Assessment } from '../../types/compliance';

interface ThreatSummaryProps {
  assessments: Assessment[];
}

const ThreatSummary: React.FC<ThreatSummaryProps> = ({ assessments }) => {
  // Calculate severity counts from all completed assessments
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };
  
  // Process assessment findings
  assessments
    .filter(a => a.status === 'completed' && a.findings)
    .forEach(assessment => {
      assessment.findings?.forEach(finding => {
        if (finding.status !== 'compliant') {
          severityCounts[finding.severity] += 1;
        }
      });
    });
  
  const data = [
    { 
      name: 'Critical', 
      count: severityCounts.critical,
      color: '#F44336'  // error-500
    },
    { 
      name: 'High', 
      count: severityCounts.high,
      color: '#FF9800'  // warning-500
    },
    { 
      name: 'Medium', 
      count: severityCounts.medium,
      color: '#FFC107'  // warning-300
    },
    { 
      name: 'Low', 
      count: severityCounts.low,
      color: '#4CAF50'  // success-500
    },
    { 
      name: 'Info', 
      count: severityCounts.info,
      color: '#64748B'  // neutral-500
    }
  ];

  const totalIssues = Object.values(severityCounts).reduce((sum, count) => sum + count, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background-card p-3 border border-neutral-700 rounded shadow-lg">
          <p className="font-medium">{`${payload[0].payload.name}: ${payload[0].value}`}</p>
          <p className="text-xs text-neutral-400">{`${Math.round((payload[0].value / totalIssues) * 100)}% of all issues`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-white mb-4">Security Issues by Severity</h2>
      
      {totalIssues > 0 ? (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#94A3B8' }} 
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis 
                tick={{ fill: '#94A3B8' }}
                axisLine={{ stroke: '#334155' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
          <p>No security issues detected yet</p>
          <p className="text-sm mt-2">Run an assessment to identify potential issues</p>
        </div>
      )}
      
      {totalIssues > 0 && (
        <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
          {data.map((item) => (
            <div key={item.name} className="p-2 rounded bg-background-light">
              <div 
                className="h-2 w-full rounded mb-1" 
                style={{ backgroundColor: item.color }}
              ></div>
              <div className="font-medium text-white">{item.count}</div>
              <div className="text-neutral-400">{item.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThreatSummary;