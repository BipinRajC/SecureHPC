import React from 'react';
import { Terminal, Cpu, Clock } from 'lucide-react';

interface ProcessesTableProps {
  processes: any[];
}

const ProcessesTable: React.FC<ProcessesTableProps> = ({ processes }) => {
  if (!processes || processes.length === 0) {
    return (
      <div className="card h-full">
        <h2 className="text-lg font-medium text-white mb-4">Running Processes</h2>
        <div className="text-center text-neutral-500 py-8">
          No process information available
        </div>
      </div>
    );
  }

  // Sort processes by CPU usage (if available) or by name
  const sortedProcesses = [...processes].sort((a, b) => {
    if (a.cpu_usage !== undefined && b.cpu_usage !== undefined) {
      return parseFloat(b.cpu_usage) - parseFloat(a.cpu_usage);
    }
    return (a.name || '').localeCompare(b.name || '');
  });

  // Format process state to be more readable
  const formatProcessState = (state: string) => {
    const states: Record<string, string> = {
      R: 'Running',
      S: 'Sleeping',
      D: 'Disk Sleep',
      Z: 'Zombie',
      T: 'Stopped',
      t: 'Tracing Stop',
      X: 'Dead',
      P: 'Parked'
    };
    
    return states[state] || state;
  };

  return (
    <div className="card h-full">
      <div className="flex items-center mb-4">
        <Terminal className="h-5 w-5 text-primary-500 mr-2" />
        <h2 className="text-lg font-medium text-white">Running Processes</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="text-left py-2 px-3 text-neutral-400 font-medium">Name</th>
              <th className="text-left py-2 px-3 text-neutral-400 font-medium">PID</th>
              <th className="text-left py-2 px-3 text-neutral-400 font-medium">State</th>
              <th className="text-left py-2 px-3 text-neutral-400 font-medium">CPU</th>
              <th className="text-left py-2 px-3 text-neutral-400 font-medium">Memory</th>
              <th className="text-left py-2 px-3 text-neutral-400 font-medium">Priority</th>
            </tr>
          </thead>
          <tbody>
            {sortedProcesses.slice(0, 20).map((process, index) => (
              <tr 
                key={`${process.pid}-${index}`} 
                className="border-b border-neutral-800 hover:bg-background-light"
              >
                <td className="py-2 px-3 text-neutral-300 truncate max-w-[160px]" title={process.name || ''}>
                  {process.name || 'Unknown'}
                </td>
                <td className="py-2 px-3 text-neutral-400">
                  {process.pid || 'N/A'}
                </td>
                <td className="py-2 px-3 text-neutral-400">
                  {process.state ? formatProcessState(process.state) : 'N/A'}
                </td>
                <td className="py-2 px-3 text-neutral-400">
                  {process.cpu_usage ? `${process.cpu_usage}%` : 'N/A'}
                </td>
                <td className="py-2 px-3 text-neutral-400">
                  {process.memory_usage ? `${process.memory_usage}%` : 'N/A'}
                </td>
                <td className="py-2 px-3 text-neutral-400">
                  {process.priority !== undefined ? process.priority : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-center mt-4 text-xs text-neutral-500">
        <div className="flex items-center">
          <Cpu className="h-4 w-4 mr-1" />
          <span>Top 20 processes shown</span>
          {processes.length > 20 && (
            <span className="ml-2 text-neutral-400">({processes.length} total - export HTML for complete data)</span>
          )}
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>Real-time data from agent</span>
        </div>
      </div>
    </div>
  );
};

export default ProcessesTable; 