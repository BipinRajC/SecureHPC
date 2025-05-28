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

  // Debug logging
  console.log('SystemInformation agent:', agent);
  console.log('SystemInformation agent.info.id:', agent?.info?.id);

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
      {/* Additional system info */}
      <div className="mt-4">
        <h3 className="text-neutral-100 font-medium mb-2">Additional System Metrics</h3>
        {/* Netiface */}
        <div className="mb-4">
          <h4 className="text-neutral-200 font-medium mb-1">Network Interface Stats</h4>
          {(!agent.netiface || agent.netiface.length === 0) ? (
            <div className="text-neutral-500">No network interface data available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-neutral-400">
                    <th className="px-2 py-1 text-left">Iface</th>
                    <th className="px-2 py-1 text-right">RX Packets</th>
                    <th className="px-2 py-1 text-right">TX Packets</th>
                    <th className="px-2 py-1 text-right">RX Bytes</th>
                    <th className="px-2 py-1 text-right">TX Bytes</th>
                    <th className="px-2 py-1 text-right">RX Dropped</th>
                    <th className="px-2 py-1 text-right">TX Dropped</th>
                  </tr>
                </thead>
                <tbody>
                  {agent.netiface.map((iface: any, idx: number) => (
                    <tr key={(iface.name || iface.iface || idx)} className="border-t border-neutral-800">
                      <td className="px-2 py-1 font-mono">{iface.name || iface.iface || 'N/A'}</td>
                      <td className="px-2 py-1 text-right">{iface.rx?.packets ?? ''}</td>
                      <td className="px-2 py-1 text-right">{iface.tx?.packets ?? ''}</td>
                      <td className="px-2 py-1 text-right">{iface.rx?.bytes ?? ''}</td>
                      <td className="px-2 py-1 text-right">{iface.tx?.bytes ?? ''}</td>
                      <td className="px-2 py-1 text-right">{iface.rx?.dropped ?? ''}</td>
                      <td className="px-2 py-1 text-right">{iface.tx?.dropped ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Netproto */}
        <div className="mb-4">
          <h4 className="text-neutral-200 font-medium mb-1">Network Protocols</h4>
          {(!agent.netproto || agent.netproto.length === 0) ? (
            <div className="text-neutral-500">No network protocol data available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-neutral-400">
                    <th className="px-2 py-1 text-left">Iface</th>
                    <th className="px-2 py-1 text-left">Type</th>
                    <th className="px-2 py-1 text-left">Gateway</th>
                  </tr>
                </thead>
                <tbody>
                  {agent.netproto.map((proto: any, idx: number) => (
                    <tr key={proto.iface + idx} className="border-t border-neutral-800">
                      <td className="px-2 py-1 font-mono">{proto.iface}</td>
                      <td className="px-2 py-1">{proto.type}</td>
                      <td className="px-2 py-1">{proto.gateway}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Syscheck */}
        <div className="mb-4">
          <h4 className="text-neutral-200 font-medium mb-1">Recent File Integrity Changes</h4>
          {(!agent.syscheck || agent.syscheck.length === 0) ? (
            <div className="text-neutral-500">No recent file changes detected.</div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-neutral-400">
                      <th className="px-2 py-1 text-left">File Path</th>
                      <th className="px-2 py-1 text-left">Perms</th>
                      <th className="px-2 py-1 text-left">MD5</th>
                      <th className="px-2 py-1 text-left">Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agent.syscheck.slice(0, 20).map((file: any, idx: number) => (
                      <tr key={(file.file || file.path || idx)} className="border-t border-neutral-800">
                        <td className="px-2 py-1 font-mono truncate max-w-[200px]" title={file.file || file.path}>{file.file || file.path || 'N/A'}</td>
                        <td className="px-2 py-1">{file.perm || file.perms || ''}</td>
                        <td className="px-2 py-1 font-mono truncate max-w-[120px]" title={file.md5}>{file.md5}</td>
                        <td className="px-2 py-1">{file.mtime ? new Date(file.mtime).toLocaleString() : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {agent.syscheck.length > 20 && (
                <div className="mt-2 text-xs text-neutral-500 text-center">
                  Showing 20 of {agent.syscheck.length} file changes. Export HTML report for complete data.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemInformation; 