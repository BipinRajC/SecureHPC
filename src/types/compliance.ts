export type ComplianceStatus = 'compliant' | 'non-compliant' | 'partially-compliant' | 'not-assessed';
export type ToolStatus = 'active' | 'inactive' | 'error' | 'configuring';
export type AssessmentStatus = 'completed' | 'in-progress' | 'scheduled' | 'failed';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface ComplianceControl {
  id: string;
  title: string;
  description: string;
  category: string;
  status: ComplianceStatus;
  lastAssessed?: string;
  severity: Severity;
  remediation?: string;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  status: ComplianceStatus;
  compliantCount: number;
  totalControls: number;
  lastAssessed: string | null;
  custom?: boolean;
  findings?: ComplianceFinding[];
}

export interface ComplianceFinding {
  controlId: string;
  status: ComplianceStatus;
  details: string;
  severity: Severity;
  remediation?: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  status: ToolStatus;
  type: 'scanner' | 'monitor' | 'auditor';
  version: string;
  supportedFrameworks: string[];
  lastRun: string | null;
}

export interface Assessment {
  id: string;
  name: string;
  description: string;
  frameworkId: string;
  toolId: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  date: string;
  completedDate?: string;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    day?: number;
    time: string;
  };
  result?: {
    score: number;
    findings: ComplianceFinding[];
  };
}

export interface SystemInfo {
  id: string;
  name: string;
  type: 'compute' | 'storage' | 'network' | 'other';
  location: string;
  ipAddress?: string;
  os?: string;
  complianceStatus: ComplianceStatus;
  lastAssessed?: string;
}

export interface WazuhCredentials {
  apiUrl: string;
  username: string;
  password: string;
}