export interface Control {
  id: string;
  title?: string;
  name?: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  requirements?: string[];
  remediation: string;
  automated?: boolean;
  references?: string[];
}

export interface Framework {
  id: string;
  name: string;
  version: string;
  description: string;
  controls: Control[];
  status: 'not-assessed' | 'in-progress' | 'completed' | 'compliant' | 'non-compliant';
  compliantCount: number;
  totalControls: number;
  supportedTools: string[];
  createdAt?: string;
  updatedAt?: string;
} 