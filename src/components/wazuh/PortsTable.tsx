import React from 'react';
import { WifiIcon, ShieldAlert, Globe } from 'lucide-react';

interface PortsTableProps {
  ports: any[];
}

const PortsTable: React.FC<PortsTableProps> = ({ ports }) => {
  if (!ports || ports.length === 0) {
    return (
      <div className="card h-full">
        <h2 className="text-lg font-medium text-white mb-4">Open Ports</h2>
        <div className="text-center text-neutral-500 py-8">
          No port information available
        </div>
      </div>
    );
  }

  // Sort ports by local.port
  const sortedPorts = [...ports].sort((a, b) => {
    const portA = a.local?.port || 0;
    const portB = b.local?.port || 0;
    return portA - portB;
  });

  // Define common service names for standard ports
  const getServiceName = (port: number, protocol: string): string => {
    const commonPorts: Record<number, Record<string, string>> = {
      21: { tcp: 'FTP' },
      22: { tcp: 'SSH' },
      23: { tcp: 'Telnet' },
      25: { tcp: 'SMTP' },
      53: { tcp: 'DNS', udp: 'DNS' },
      80: { tcp: 'HTTP' },
      110: { tcp: 'POP3' },
      123: { udp: 'NTP' },
      143: { tcp: 'IMAP' },
      443: { tcp: 'HTTPS' },
      465: { tcp: 'SMTPS' },
      587: { tcp: 'SMTP' },
      993: { tcp: 'IMAPS' },
      995: { tcp: 'POP3S' },
      3306: { tcp: 'MySQL' },
      3389: { tcp: 'RDP' },
      5432: { tcp: 'PostgreSQL' },
      8080: { tcp: 'HTTP-ALT' },
      8443: { tcp: 'HTTPS-ALT' },
    };

    // Use common service name if known, otherwise return an empty string
    return (commonPorts[port] && commonPorts[port][protocol.toLowerCase()]) || '';
  };

  // Determine security risk level
  const getSecurityLevel = (port: number, protocol: string, state: string): string => {
    // This is a simple heuristic - a real implementation would be more sophisticated
    if (port < 1024 && state === 'listening') {
      if ([22, 443, 80, 53].includes(port)) {
        return 'normal'; // Common services
      }
      if ([21, 23, 25].includes(port)) {
        return 'warning'; // Potentially risky services if not secured
      }
    }
    
    // Ephemeral ports are usually outgoing connections
    if (port >= 32768 && port <= 65535) {
      return 'normal';
    }
    
    // Default to info level
    return 'info';
  };

  return (
    <div className="card h-full">
      <div className="flex items-center mb-4">
        <WifiIcon className="h-5 w-5 text-primary-500 mr-2" />
        <h2 className="text-lg font-medium text-white">Open Network Ports</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="text-left py-2 px-3 text-neutral-400 font-medium">Port</th>
              <th className="text-left py-2 px-3 text-neutral-400 font-medium">Protocol</th>
              <th className="text-left py-2 px-3 text-neutral-400 font-medium">State</th>
              <th className="text-left py-2 px-3 text-neutral-400 font-medium">Service</th>
              <th className="text-left py-2 px-3 text-neutral-400 font-medium">Process</th>
              <th className="text-left py-2 px-3 text-neutral-400 font-medium">Remote Address</th>
            </tr>
          </thead>
          <tbody>
            {sortedPorts.slice(0, 10).map((port, index) => {
              const securityLevel = getSecurityLevel(
                port.local?.port, 
                port.protocol, 
                port.state
              );
              
              return (
                <tr 
                  key={`${port.protocol}-${port.local?.port}-${index}`} 
                  className="border-b border-neutral-800 hover:bg-background-light"
                >
                  <td className="py-2 px-3 text-neutral-300">
                    {port.local?.port || 'N/A'}
                  </td>
                  <td className="py-2 px-3 text-neutral-400 uppercase">
                    {port.protocol || 'N/A'}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      port.state === 'listening' 
                        ? 'bg-success-900 text-success-400' 
                        : 'bg-secondary-900 text-secondary-400'
                    }`}>
                      {port.state || 'N/A'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-neutral-400">
                    {getServiceName(port.local?.port, port.protocol) || 'Custom'}
                  </td>
                  <td className="py-2 px-3 text-neutral-400 truncate max-w-[140px]" title={port.process?.name || ''}>
                    {port.process?.name || 'N/A'}
                    {port.process?.pid ? ` (${port.process.pid})` : ''}
                  </td>
                  <td className="py-2 px-3 text-neutral-400">
                    {port.remote?.ip ? `${port.remote.ip}:${port.remote.port}` : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-center mt-4 text-xs text-neutral-500">
        <div className="flex items-center">
          <ShieldAlert className="h-4 w-4 mr-1" />
          <span>Ports may present security risks if exposed</span>
        </div>
        <div className="flex items-center">
          <Globe className="h-4 w-4 mr-1" />
          <span>Top 10 ports shown</span>
        </div>
      </div>
    </div>
  );
};

export default PortsTable; 