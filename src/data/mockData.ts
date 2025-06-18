import { 
  ComplianceFramework, 
  Tool, 
  Assessment,
  SystemInfo,
  ComplianceControl,
  Severity,
  ComplianceStatus,
  ToolStatus
} from '../types/compliance';

// Mock NIST Controls for demonstration
export const nistControls: ComplianceControl[] = [
  {
    id: 'AC-1',
    title: 'Access Control Policy and Procedures',
    description: 'The organization develops, documents, and disseminates an access control policy.',
    category: 'Access Control',
    status: 'compliant',
    lastAssessed: '2025-03-01T10:30:00Z',
    severity: 'high',
    remediation: 'Ensure access control policies are properly documented and reviewed periodically.'
  },
  {
    id: 'AC-2',
    title: 'Account Management',
    description: 'The organization manages information system accounts, including establishing, activating, modifying, reviewing, disabling, and removing accounts.',
    category: 'Access Control',
    status: 'partially-compliant',
    lastAssessed: '2025-03-01T10:30:00Z',
    severity: 'high',
    remediation: 'Implement automated account management procedures and regular reviews.'
  },
  {
    id: 'CM-2',
    title: 'Baseline Configuration',
    description: 'The organization develops, documents, and maintains a current baseline configuration of the information system.',
    category: 'Configuration Management',
    status: 'non-compliant',
    lastAssessed: '2025-03-01T10:30:00Z',
    severity: 'critical',
    remediation: 'Establish baseline configurations for all system components and maintain documentation.'
  },
  {
    id: 'IA-2',
    title: 'Identification and Authentication',
    description: 'The information system uniquely identifies and authenticates organizational users.',
    category: 'Identification and Authentication',
    status: 'compliant',
    lastAssessed: '2025-03-01T10:30:00Z',
    severity: 'critical',
    remediation: 'Enforce multi-factor authentication for all privileged accounts.'
  },
  {
    id: 'SC-7',
    title: 'Boundary Protection',
    description: 'The information system monitors and controls communications at the external boundary of the system and at key internal boundaries within the system.',
    category: 'System and Communications Protection',
    status: 'partially-compliant',
    lastAssessed: '2025-03-01T10:30:00Z',
    severity: 'high',
    remediation: 'Implement boundary protection devices and monitor all incoming and outgoing communications.'
  },
];

// More controls for CIS
export const cisControls: ComplianceControl[] = [
  {
    id: 'CIS-1.1',
    title: 'Maintain Detailed Asset Inventory',
    description: 'Maintain an inventory of all enterprise assets with the potential to store, process, or transmit information.',
    category: 'Asset Management',
    status: 'partially-compliant',
    lastAssessed: '2025-02-15T14:20:00Z',
    severity: 'medium',
    remediation: 'Implement an automated asset discovery tool and inventory management system.'
  },
  {
    id: 'CIS-3.3',
    title: 'Configure Data Access Control Lists',
    description: 'Configure data access control lists based on a users need to know.',
    category: 'Data Protection',
    status: 'compliant',
    lastAssessed: '2025-02-15T14:20:00Z',
    severity: 'high',
    remediation: 'Review and update access control lists regularly.'
  },
  {
    id: 'CIS-5.2',
    title: 'Use Unique Passwords',
    description: 'Use unique passwords for all enterprise assets.',
    category: 'Account Management',
    status: 'non-compliant',
    lastAssessed: '2025-02-15T14:20:00Z',
    severity: 'critical',
    remediation: 'Implement password policy requiring complex, unique passwords and periodic changes.'
  },
];

// Mock frameworks data
export const mockFrameworks: ComplianceFramework[] = [
  {
    id: 'framework-1',
    name: 'CIS Benchmark',
    description: 'Center for Internet Security benchmarks for secure configuration',
    category: 'System Hardening',
    version: '1.0.0',
    status: 'compliant',
    compliantCount: 85,
    totalControls: 100,
    lastAssessed: '2023-03-15T10:00:00Z',
    findings: []
  },
  {
    id: 'framework-2',
    name: 'NIST SP 800-53',
    description: 'Security controls for federal information systems',
    category: 'Compliance',
    version: '5.1',
    status: 'partially-compliant',
    compliantCount: 120,
    totalControls: 200,
    lastAssessed: '2023-03-10T08:30:00Z',
    findings: []
  },
  {
    id: 'framework-3',
    name: 'PCI DSS',
    description: 'Payment Card Industry Data Security Standard',
    category: 'Financial',
    version: '4.0',
    status: 'non-compliant',
    compliantCount: 45,
    totalControls: 120,
    lastAssessed: '2023-03-05T14:15:00Z',
    findings: []
  }
];

// Mock tools data
export const mockTools: Tool[] = [
  {
    id: 'tool-1',
    name: 'Lynis',
    description: 'Security auditing tool for Unix/Linux systems',
    status: 'active',
    type: 'scanner',
    version: '3.0.8',
    supportedFrameworks: ['CIS Benchmark', 'NIST SP 800-53'],
    lastRun: '2023-03-15T10:00:00Z'
  },
  {
    id: 'tool-2',
    name: 'OpenSCAP',
    description: 'SCAP content interpretation, evaluation and remediation',
    status: 'active',
    type: 'scanner',
    version: '1.3.7',
    supportedFrameworks: ['CIS Benchmark', 'NIST SP 800-53', 'PCI DSS'],
    lastRun: '2023-03-14T09:30:00Z'
  },
  {
    id: 'tool-3',
    name: 'Wazuh',
    description: 'Security monitoring, threat detection and response',
    status: 'configuring',
    type: 'monitor',
    version: '4.4.0',
    supportedFrameworks: ['PCI DSS', 'GDPR'],
    lastRun: null
  }
];

// Mock assessments data
export const mockAssessments: Assessment[] = [
  {
    id: 'assessment-1',
    name: 'Weekly CIS Scan',
    description: 'Weekly system scan against CIS benchmarks',
    frameworkId: 'framework-1',
    toolId: 'tool-1',
    status: 'completed',
    date: '2023-03-15T10:00:00Z',
    completedDate: '2023-03-15T10:15:30Z',
    schedule: {
      frequency: 'weekly',
      day: 1, // Monday
      time: '10:00'
    },
    result: {
      score: 85,
      findings: []
    }
  },
  {
    id: 'assessment-2',
    name: 'Monthly NIST Assessment',
    description: 'Monthly compliance check for NIST requirements',
    frameworkId: 'framework-2',
    toolId: 'tool-2',
    status: 'scheduled',
    date: '2023-04-01T09:00:00Z',
    schedule: {
      frequency: 'monthly',
      day: 1,
      time: '09:00'
    }
  }
];

// Mock system information
export const mockSystems: SystemInfo[] = [
  {
    id: 'hpc-cluster-1',
    name: 'Main HPC Cluster',
    type: 'compute',
    location: 'Data Center A',
    os: 'Linux CentOS 8.5',
    complianceStatus: 'partially-compliant',
    lastAssessed: '2025-03-05T11:45:00Z'
  },
  {
    id: 'storage-system-1',
    name: 'Primary Storage Array',
    type: 'storage',
    location: 'Data Center A',
    complianceStatus: 'partially-compliant',
    lastAssessed: '2025-03-01T10:30:00Z'
  },
  {
    id: 'network-system-1',
    name: 'Core Network Switch',
    type: 'network',
    location: 'Data Center A',
    ipAddress: '10.0.1.1',
    complianceStatus: 'compliant',
    lastAssessed: '2025-02-15T14:20:00Z'
  },
  {
    id: 'payment-processing-node',
    name: 'Payment Processing Server',
    type: 'compute',
    location: 'Data Center B',
    os: 'Linux RHEL 9.0',
    complianceStatus: 'not-assessed'
  },
  {
    id: 'database-server',
    name: 'Main Database Server',
    type: 'compute',
    location: 'Data Center B',
    os: 'Linux RHEL 9.0',
    complianceStatus: 'not-assessed'
  },
  {
    id: 'data-storage-cluster',
    name: 'Medical Data Storage',
    type: 'storage',
    location: 'Data Center C',
    complianceStatus: 'not-assessed'
  },
  {
    id: 'compute-node-1',
    name: 'Compute Node 1',
    type: 'compute',
    location: 'Data Center C',
    os: 'Linux CentOS 8.5',
    complianceStatus: 'not-assessed'
  },
  {
    id: 'compute-node-2',
    name: 'Compute Node 2',
    type: 'compute',
    location: 'Data Center C',
    os: 'Linux CentOS 8.5',
    complianceStatus: 'not-assessed'
  }
];