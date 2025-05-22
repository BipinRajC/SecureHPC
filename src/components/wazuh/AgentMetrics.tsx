import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface AgentMetricsProps {
  agentId: string;
}

interface Netiface {
  iface: string;
  rx_packets: number;
  tx_packets: number;
  rx_bytes: number;
  tx_bytes: number;
  rx_dropped: number;
  tx_dropped: number;
}

interface Netproto {
  iface: string;
  type: string;
  gateway: string;
}

interface SyscheckFile {
  path: string;
  perms: string;
  md5: string;
  mtime: string;
}

const AgentMetrics: React.FC<AgentMetricsProps> = ({ agentId }) => {
  const [netiface, setNetiface] = useState<Netiface[]>([]);
  const [netproto, setNetproto] = useState<Netproto[]>([]);
  const [syscheck, setSyscheck] = useState<SyscheckFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      axios.get(`/api/tools/wazuh/agents/${agentId}/netiface`),
      axios.get(`/api/tools/wazuh/agents/${agentId}/netproto`),
      axios.get(`/api/tools/wazuh/agents/${agentId}/syscheck`)
    ])
      .then(([netifaceRes, netprotoRes, syscheckRes]) => {
        // Netiface
        const ifaceItems = netifaceRes.data?.data?.data?.affected_items || [];
        setNetiface(ifaceItems);
        // Netproto
        const protoItems = netprotoRes.data?.data?.data?.affected_items || [];
        setNetproto(protoItems);
        // Syscheck
        const syscheckItems = syscheckRes.data?.data?.data?.affected_items || [];
        // Sort by mtime desc, take latest 10
        const files = syscheckItems
          .filter((f: any) => f.mtime)
          .sort((a: any, b: any) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime())
          .slice(0, 10)
          .map((f: any) => ({
            path: f.path,
            perms: f.perm,
            md5: f.md5,
            mtime: f.mtime
          }));
        setSyscheck(files);
      })
      .catch((err) => {
        setError('Failed to load agent metrics.');
      })
      .finally(() => setLoading(false));
  }, [agentId]);

  if (loading) {
    return <div className="bg-background-light p-4 rounded-lg mb-4 text-neutral-400">Loading agent metrics...</div>;
  }
  if (error) {
    return <div className="bg-error-900 border border-error-700 text-error-300 p-3 rounded mb-4">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Netiface */}
      <div className="card">
        <h3 className="text-lg font-medium text-white mb-2">Network Interface Stats</h3>
        {netiface.length === 0 ? (
          <div className="text-neutral-500">No network interface data available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
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
                {netiface.map((iface) => (
                  <tr key={iface.iface} className="border-t border-neutral-800">
                    <td className="px-2 py-1 font-mono">{iface.iface}</td>
                    <td className="px-2 py-1 text-right">{iface.rx_packets}</td>
                    <td className="px-2 py-1 text-right">{iface.tx_packets}</td>
                    <td className="px-2 py-1 text-right">{iface.rx_bytes}</td>
                    <td className="px-2 py-1 text-right">{iface.tx_bytes}</td>
                    <td className="px-2 py-1 text-right">{iface.rx_dropped}</td>
                    <td className="px-2 py-1 text-right">{iface.tx_dropped}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Netproto */}
      <div className="card">
        <h3 className="text-lg font-medium text-white mb-2">Network Protocols</h3>
        {netproto.length === 0 ? (
          <div className="text-neutral-500">No network protocol data available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-neutral-400">
                  <th className="px-2 py-1 text-left">Iface</th>
                  <th className="px-2 py-1 text-left">Type</th>
                  <th className="px-2 py-1 text-left">Gateway</th>
                </tr>
              </thead>
              <tbody>
                {netproto.map((proto, idx) => (
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
      <div className="card">
        <h3 className="text-lg font-medium text-white mb-2">Recent File Integrity Changes</h3>
        {syscheck.length === 0 ? (
          <div className="text-neutral-500">No recent file changes detected.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-neutral-400">
                  <th className="px-2 py-1 text-left">File Path</th>
                  <th className="px-2 py-1 text-left">Perms</th>
                  <th className="px-2 py-1 text-left">MD5</th>
                  <th className="px-2 py-1 text-left">Modified</th>
                </tr>
              </thead>
              <tbody>
                {syscheck.map((file, idx) => (
                  <tr key={file.path + idx} className="border-t border-neutral-800">
                    <td className="px-2 py-1 font-mono truncate max-w-[200px]" title={file.path}>{file.path}</td>
                    <td className="px-2 py-1">{file.perms}</td>
                    <td className="px-2 py-1 font-mono truncate max-w-[120px]" title={file.md5}>{file.md5}</td>
                    <td className="px-2 py-1">{file.mtime ? new Date(file.mtime).toLocaleString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentMetrics; 