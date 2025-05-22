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

// Mock compliance frameworks
export const mockFrameworks: ComplianceFramework[] = [
  {
    id: 'pci-dss',
    name: 'PCI-DSS',
    description: 'Payment Card Industry Data Security Standard',
    category: 'Financial',
    version: '4.0',
    status: 'not-assessed' as ComplianceStatus,
    compliantCount: 0,
    totalControls: 12,
    lastAssessed: null
  },
  {
    id: 'hipaa',
    name: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act',
    category: 'Healthcare',
    version: '2.0',
    status: 'not-assessed' as ComplianceStatus,
    compliantCount: 0,
    totalControls: 18,
    lastAssessed: null
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    description: 'General Data Protection Regulation',
    category: 'Privacy',
    version: '1.0',
    status: 'not-assessed' as ComplianceStatus,
    compliantCount: 0,
    totalControls: 10,
    lastAssessed: null
  },
  {
    id: 'nist-800-53',
    name: 'NIST 800-53',
    description: 'National Institute of Standards and Technology Special Publication 800-53',
    category: 'Government',
    version: 'Rev. 5',
    status: 'not-assessed' as ComplianceStatus,
    compliantCount: 0,
    totalControls: 20,
    lastAssessed: null
  }
];

// Mock tool integrations
export const mockTools: Tool[] = [
  {
    id: 'lynis',
    name: 'Lynis',
    description: 'Security auditing tool for Unix/Linux systems',
    status: 'inactive' as ToolStatus,
    type: 'scanner',
    version: '3.0.8',
    supportedFrameworks: ['pci-dss', 'hipaa', 'nist-800-53'],
    lastRun: null
  },
  {
    id: 'openscap',
    name: 'OpenSCAP',
    description: 'Security compliance and vulnerability scanning',
    status: 'inactive' as ToolStatus,
    type: 'scanner',
    version: '1.3.6',
    supportedFrameworks: ['pci-dss', 'nist-800-53'],
    lastRun: null
  },
  {
    id: 'wazuh',
    name: 'Wazuh',
    description: 'Open source security monitoring solution',
    status: 'inactive' as ToolStatus,
    type: 'scanner',
    version: '4.4.0',
    supportedFrameworks: ['pci-dss', 'hipaa', 'gdpr', 'nist-800-53'],
    lastRun: null
  },
  {
    id: 'prowler',
    name: 'Prowler',
    description: 'Open source security tool to perform AWS security best practices assessments, audits, incident response, and compliance.',
    type: 'auditor',
    status: 'inactive',
    version: '3.0.0',
    supportedFrameworks: ['cis-controls'],
    configOptions: [
      {
        name: 'aws_region',
        type: 'text',
        required: true,
        defaultValue: 'us-east-1'
      },
      {
        name: 'aws_profile',
        type: 'text',
        required: false
      },
      {
        name: 'compliance_framework',
        type: 'select',
        required: true,
        options: ['cis', 'hipaa', 'gdpr', 'all'],
        defaultValue: 'cis'
      }
    ]
  },
  {
    id: 'custom-scanner',
    name: 'HPC Custom Scanner',
    description: 'Custom-built security scanner for HPC environments.',
    type: 'scanner',
    status: 'active',
    version: '1.2.3',
    lastRun: '2025-03-05T11:45:00Z',
    supportedFrameworks: ['custom-hpc'],
    configOptions: [
      {
        name: 'scan_depth',
        type: 'select',
        required: true,
        options: ['quick', 'standard', 'deep'],
        defaultValue: 'standard'
      },
      {
        name: 'scan_components',
        type: 'text',
        required: true,
        defaultValue: 'compute,storage,network,scheduler'
      },
      {
        name: 'enable_remediation',
        type: 'boolean',
        required: false,
        defaultValue: false
      }
    ]
  }
];

// Mock assessment data
export const mockAssessments: Assessment[] = [
  {
    id: 'assessment-1',
    name: 'Monthly PCI-DSS Scan',
    description: 'Monthly compliance scan for PCI-DSS requirements',
    frameworkId: 'pci-dss',
    toolId: 'lynis',
    status: 'completed',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    completedDate: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
    schedule: {
      frequency: 'monthly',
      day: 1,
      time: '01:00'
    },
    result: {
      score: 85,
    findings: [
      {
          controlId: 'AUTH-01',
          status: 'non-compliant' as ComplianceStatus,
          details: 'Password policy not enforced',
        severity: 'high'
      },
      {
          controlId: 'ENCR-02',
          status: 'compliant' as ComplianceStatus,
          details: 'Disk encryption enabled',
          severity: 'medium'
      }
      ]
    }
  },
  {
    id: 'assessment-2',
    name: 'Weekly HIPAA Check',
    description: 'Weekly compliance check for HIPAA requirements',
    frameworkId: 'hipaa',
    toolId: 'openscap',
    status: 'scheduled',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    schedule: {
      frequency: 'weekly',
      day: 1, // Monday
      time: '02:00'
    }
  },
  {
    id: 'assessment-3',
    name: 'GDPR Assessment',
    description: 'Assessment of GDPR compliance',
    frameworkId: 'gdpr',
    toolId: 'wazuh',
    status: 'failed',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    completedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    result: {
      score: 0,
      findings: [
        {
          controlId: 'ERROR-01',
          status: 'non-compliant' as ComplianceStatus,
          details: 'Failed to connect to scanning tool',
          severity: 'critical'
        }
      ]
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