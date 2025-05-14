import React from 'react';
import { 
  Monitor, 
  Cpu, 
  HardDrive, 
  Network, 
  Layers,
  Package
} from 'lucide-react';

interface SystemInformationProps {
  agent: any;
}

const SystemInformation: React.FC<SystemInformationProps> = ({ agent }) => {
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Get the primary network interface info
  const getPrimaryInterface = () => {
    if (!agent.netaddr || !Array.isArray(agent.netaddr) || agent.netaddr.length === 0) {
      return null;
    }
    
    // Try to find a non-loopback IPv4 address
    const primaryAddr = agent.netaddr.find((addr: any) => 
      addr.iface !== 'lo' && addr.proto === 'ipv4'
    );
    
    return primaryAddr || agent.netaddr[0];
  };

  // Get MAC address from interfaces
  const getMacAddress = () => {
    if (!agent.netaddr || !Array.isArray(agent.netaddr) || agent.netaddr.length === 0) {
      return agent.info?.mac || 'Unknown';
    }
    
    // Find first non-loopback interface with a MAC
    const interfaceWithMac = agent.netaddr.find((addr: any) => 
      addr.iface !== 'lo' && addr.mac
    );
    
    return interfaceWithMac?.mac || agent.info?.mac || 'Unknown';
  };

  // Get the primary IP address
  const getPrimaryIpAddress = () => {
    // First check netaddr data if available
    const primaryInterface = getPrimaryInterface();
    if (primaryInterface) {
      return primaryInterface.address || agent.info?.ip || 'Unknown';
    }
    
    // Fall back to the IP from the agents list
    return agent.info?.ip || 'Unknown';
  };

  // Get open ports count
  const getOpenPortsCount = () => {
    if (!agent.ports || !Array.isArray(agent.ports)) {
      return 'Unknown';
    }
    
    return agent.ports.length.toString();
  };

  // Get installed packages count
  const getPackagesCount = () => {
    if (!agent.packages || !Array.isArray(agent.packages)) {
      return 'Unknown';
    }
    
    return agent.packages.length > 0 ? `${agent.packages.length}+` : '0';
  };

  return (
    <div className="card h-full">
      <h2 className="text-lg font-medium text-white mb-4">System Information</h2>
      
      {agent ? (
        <div className="space-y-4">
          <div className="bg-background-light p-3 rounded-lg">
            <div className="flex items-center mb-2">
              <Monitor className="h-5 w-5 text-primary-400 mr-2" />
              <h3 className="text-neutral-100 font-medium">Operating System</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">OS</span>
                <span className="text-neutral-300">
                  {agent.os?.name || agent.os?.os?.name || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Version</span>
                <span className="text-neutral-300">
                  {agent.os?.version || agent.os?.os?.version || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Architecture</span>
                <span className="text-neutral-300">
                  {agent.os?.architecture || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Hostname</span>
                <span className="text-neutral-300">
                  {agent.info?.hostname || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-background-light p-3 rounded-lg">
            <div className="flex items-center mb-2">
              <Cpu className="h-5 w-5 text-primary-400 mr-2" />
              <h3 className="text-neutral-100 font-medium">Hardware</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">CPU Model</span>
                <span className="text-neutral-300 text-right">
                  {agent.hardware?.cpu?.name || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Cores</span>
                <span className="text-neutral-300">
                  {agent.hardware?.cpu?.cores || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">RAM</span>
                <span className="text-neutral-300">
                  {agent.hardware?.ram?.total ? formatBytes(parseInt(agent.hardware.ram.total)) : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Board Serial</span>
                <span className="text-neutral-300 truncate max-w-[180px]" title={agent.hardware?.board_serial || 'Unknown'}>
                  {agent.hardware?.board_serial || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-background-light p-3 rounded-lg">
            <div className="flex items-center mb-2">
              <HardDrive className="h-5 w-5 text-primary-400 mr-2" />
              <h3 className="text-neutral-100 font-medium">Storage</h3>
            </div>
            <div className="space-y-2 text-sm">
              {agent.hardware?.scan?.time ? (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Last Scan</span>
                  <span className="text-neutral-300">
                    {new Date(agent.hardware.scan.time).toLocaleString()}
                  </span>
                </div>
              ) : null}

              {agent.processes ? (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Running Processes</span>
                  <span className="text-neutral-300">{agent.processes.length}+</span>
                </div>
              ) : null}

              {agent.ports ? (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Open Ports</span>
                  <span className="text-neutral-300">{getOpenPortsCount()}</span>
                </div>
              ) : null}
            </div>
          </div>
          
          <div className="bg-background-light p-3 rounded-lg">
            <div className="flex items-center mb-2">
              <Network className="h-5 w-5 text-primary-400 mr-2" />
              <h3 className="text-neutral-100 font-medium">Network</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">IP Address</span>
                <span className="text-neutral-300">
                  {getPrimaryIpAddress()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">MAC Address</span>
                <span className="text-neutral-300">
                  {getMacAddress()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Agent Version</span>
                <span className="text-neutral-300">
                  {agent.info?.version || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-background-light p-3 rounded-lg">
            <div className="flex items-center mb-2">
              <Package className="h-5 w-5 text-primary-400 mr-2" />
              <h3 className="text-neutral-100 font-medium">Packages</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Installed Packages</span>
                <span className="text-neutral-300">
                  {getPackagesCount()}
                </span>
              </div>
              {agent.packages && agent.packages.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Latest Package</span>
                  <span className="text-neutral-300 truncate max-w-[160px]" title={agent.packages[0]?.name || 'Unknown'}>
                    {agent.packages[0]?.name || 'Unknown'}
                  </span>
                </div>
              )}
              {agent.os?.scan?.time && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Last Scanned</span>
                  <span className="text-neutral-300">
                    {new Date(agent.os.scan.time).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-background-light p-3 rounded-lg">
            <div className="flex items-center mb-2">
              <Layers className="h-5 w-5 text-primary-400 mr-2" />
              <h3 className="text-neutral-100 font-medium">Agent Status</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Status</span>
                <span className={`font-medium ${agent.info?.status === 'active' ? 'text-success-500' : 'text-error-500'}`}>
                  {agent.info?.status 
                    ? agent.info.status.charAt(0).toUpperCase() + agent.info.status.slice(1) 
                    : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Last Keep Alive</span>
                <span className="text-neutral-300">
                  {agent.info?.lastKeepAlive 
                    ? new Date(agent.info.lastKeepAlive).toLocaleString()
                    : agent.info?.last_keepalive 
                      ? new Date(agent.info.last_keepalive).toLocaleString()
                      : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Last SCA Scan</span>
                <span className="text-neutral-300">
                  {agent.sca?.[0]?.end_scan 
                    ? new Date(agent.sca[0].end_scan).toLocaleString()
                    : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Agent ID</span>
                <span className="text-neutral-300 truncate max-w-[140px]" title={agent.info?.id || 'Unknown'}>
                  {agent.info?.id || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-neutral-500 text-center py-6">
          No system information available
        </div>
      )}
    </div>
  );
};

export default SystemInformation; 