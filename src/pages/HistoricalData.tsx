import React, { useEffect, useState } from 'react';
import { useComplianceStore } from '../store/complianceStore';
import { 
  History, 
  LineChart as LineChartIcon, 
  Calendar, 
  Filter,
  Download,
  ArrowRight,
  Check,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { format, parseISO, subMonths } from 'date-fns';

const HistoricalData: React.FC = () => {
  const { assessments, frameworks, loading, fetchAssessments, fetchFrameworks } = useComplianceStore();
  const [timeRange, setTimeRange] = useState('6m');
  const [frameworkFilter, setFrameworkFilter] = useState('all');

  useEffect(() => {
    fetchAssessments();
    fetchFrameworks();
  }, [fetchAssessments, fetchFrameworks]);

  // Generate trend data for the chart
  const generateTrendData = () => {
    // Only use completed assessments
    const completedAssessments = assessments
      .filter(a => a.status === 'completed' && a.summaryScore !== undefined);
    
    if (completedAssessments.length === 0) return [];
    
    // Sort by date
    completedAssessments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate timeframe cutoff
    const now = new Date();
    let cutoffDate;
    
    switch (timeRange) {
      case '1m':
        cutoffDate = subMonths(now, 1);
        break;
      case '3m':
        cutoffDate = subMonths(now, 3);
        break;
      case '6m':
        cutoffDate = subMonths(now, 6);
        break;
      case '1y':
        cutoffDate = subMonths(now, 12);
        break;
      default:
        cutoffDate = subMonths(now, 6);
    }
    
    // Filter by timeframe and framework if applicable
    const filteredAssessments = completedAssessments
      .filter(a => new Date(a.date) >= cutoffDate)
      .filter(a => frameworkFilter === 'all' || a.frameworkId === frameworkFilter);
    
    // Group by frameworks for the chart
    const frameworkIds = [...new Set(filteredAssessments.map(a => a.frameworkId))];
    
    // Create data points for each assessment date
    return filteredAssessments.map(assessment => {
      const result = {
        date: format(new Date(assessment.date), 'MMM d, yyyy'),
        dateObj: new Date(assessment.date),
        [assessment.frameworkId]: assessment.summaryScore,
      };
      
      return result;
    });
  };
  
  const trendData = generateTrendData();
  
  // Get unique framework IDs present in the trend data
  const frameworksInData = [...new Set(trendData.flatMap(Object.keys))].filter(key => key !== 'date' && key !== 'dateObj');
  
  const getFrameworkName = (frameworkId: string) => {
    const framework = frameworks.find(f => f.id === frameworkId);
    return framework ? framework.name : frameworkId;
  };
  
  const getFrameworkColor = (frameworkId: string, index: number) => {
    const colors = ['#3361E3', '#28B5B1', '#FF9800', '#4CAF50', '#F44336'];
    return colors[index % colors.length];
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background-card p-3 border border-neutral-700 rounded shadow-lg">
          <p className="text-white font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center text-sm">
              <div 
                className="w-3 h-3 mr-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-neutral-300">{getFrameworkName(entry.dataKey)}:</span>
              <span className="ml-1 font-medium text-white">{entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Historical Compliance Data</h1>
          <p className="text-neutral-400 mt-1">Track compliance trends and changes over time</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="btn-outline inline-flex items-center">
            <Download size={16} className="mr-2" />
            Export Data
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center">
            <LineChartIcon size={20} className="text-primary-500 mr-2" />
            <h2 className="text-xl font-semibold text-white">Compliance Score Trends</h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 mt-3 md:mt-0">
            <div className="flex items-center">
              <Calendar size={16} className="text-neutral-400 mr-2" />
              <select 
                className="select"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="1m">Last Month</option>
                <option value="3m">Last 3 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last Year</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <Filter size={16} className="text-neutral-400 mr-2" />
              <select 
                className="select"
                value={frameworkFilter}
                onChange={(e) => setFrameworkFilter(e.target.value)}
              >
                <option value="all">All Frameworks</option>
                {frameworks.map(framework => (
                  <option key={framework.id} value={framework.id}>
                    {framework.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {loading.assessments || loading.frameworks ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-primary-400">Loading historical data...</div>
          </div>
        ) : trendData.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <History size={40} className="mx-auto mb-3 opacity-30" />
            <p className="mb-2">No historical data available</p>
            <p className="text-sm">
              Complete assessments to build historical compliance data
            </p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#94A3B8' }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fill: '#94A3B8' }}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  formatter={(value) => <span className="text-neutral-300">{getFrameworkName(value)}</span>}
                />
                {frameworksInData.map((frameworkId, index) => (
                  <Line
                    key={frameworkId}
                    type="monotone"
                    dataKey={frameworkId}
                    name={frameworkId}
                    stroke={getFrameworkColor(frameworkId, index)}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4">Compliance Changes</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Framework</th>
                    <th className="px-4 py-3">Change</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  <tr className="hover:bg-background-light transition-colors">
                    <td className="px-4 py-3">Mar 8, 2025</td>
                    <td className="px-4 py-3">NIST SP 800-53</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center">
                        <Check size={16} className="text-success-500 mr-1" />
                        <span className="text-success-500">+12%</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">Implemented enhanced access controls (AC-2, AC-3)</td>
                  </tr>
                  <tr className="hover:bg-background-light transition-colors">
                    <td className="px-4 py-3">Feb 15, 2025</td>
                    <td className="px-4 py-3">CIS Controls</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center">
                        <X size={16} className="text-error-500 mr-1" />
                        <span className="text-error-500">-5%</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">Password policy violations detected (CIS-5.2)</td>
                  </tr>
                  <tr className="hover:bg-background-light transition-colors">
                    <td className="px-4 py-3">Jan 10, 2025</td>
                    <td className="px-4 py-3">HPC Security Standard</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center">
                        <Check size={16} className="text-success-500 mr-1" />
                        <span className="text-success-500">+8%</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">Added network segmentation for HPC clusters</td>
                  </tr>
                  <tr className="hover:bg-background-light transition-colors">
                    <td className="px-4 py-3">Dec 20, 2024</td>
                    <td className="px-4 py-3">NIST SP 800-53</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center">
                        <Check size={16} className="text-success-500 mr-1" />
                        <span className="text-success-500">+3%</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">Improved configuration management (CM-2)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-center">
              <button className="text-primary-400 hover:text-primary-300 inline-flex items-center">
                View More Changes
                <ArrowRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <div className="card mb-6">
            <h2 className="text-lg font-medium text-white mb-4">Analysis Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Trend Analysis Periods
                </label>
                <select className="select w-full">
                  <option value="daily">Daily</option>
                  <option value="weekly" selected>Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Significance Threshold
                </label>
                <select className="select w-full">
                  <option value="1">1% (Detect Small Changes)</option>
                  <option value="5" selected>5% (Standard)</option>
                  <option value="10">10% (Major Changes Only)</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="ignore-pending" 
                  checked
                  className="w-4 h-4 text-primary-600 bg-background-light border-neutral-600 rounded focus:ring-primary-500 focus:ring-2"
                />
                <label htmlFor="ignore-pending" className="ml-2 text-sm text-neutral-300">
                  Ignore pending changes in analysis
                </label>
              </div>
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="show-projections" 
                  className="w-4 h-4 text-primary-600 bg-background-light border-neutral-600 rounded focus:ring-primary-500 focus:ring-2"
                />
                <label htmlFor="show-projections" className="ml-2 text-sm text-neutral-300">
                  Show trend projections
                </label>
              </div>
              
              <button className="btn-primary w-full">Apply Settings</button>
            </div>
          </div>
          
          <div className="card">
            <h2 className="text-lg font-medium text-white mb-4">Export Options</h2>
            <div className="space-y-3">
              <button className="w-full py-2 px-4 bg-background-light rounded flex items-center hover:bg-neutral-800 transition-colors">
                <Download size={18} className="text-primary-400 mr-2" />
                <span>Export as PDF Report</span>
              </button>
              
              <button className="w-full py-2 px-4 bg-background-light rounded flex items-center hover:bg-neutral-800 transition-colors">
                <Download size={18} className="text-primary-400 mr-2" />
                <span>Export as CSV Data</span>
              </button>
              
              <button className="w-full py-2 px-4 bg-background-light rounded flex items-center hover:bg-neutral-800 transition-colors">
                <Download size={18} className="text-primary-400 mr-2" />
                <span>Export as JSON Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalData;