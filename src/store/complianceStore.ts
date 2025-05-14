import { create } from 'zustand';
import { ComplianceFramework, Tool, Assessment, ToolStatus, ComplianceStatus, Severity, WazuhCredentials } from '../types/compliance';
import { mockFrameworks, mockTools, mockAssessments } from '../data/mockData';

interface ComplianceStoreState {
  frameworks: ComplianceFramework[];
  tools: Tool[];
  assessments: Assessment[];
  loading: {
    frameworks: boolean;
    tools: boolean;
    assessments: boolean;
    lynisRunning: boolean;
    openscapRunning: boolean;
    wazuh: boolean;
  };
  error: {
    frameworks: string | null;
    tools: string | null;
    assessments: string | null;
    lynisScan: string | null;
    openscapScan: string | null;
    wazuh: string | null;
  };
  lynisJobId: string | null;
  openscapReportHtml: string | null;
  wazuhCredentials: WazuhCredentials | null;
  
  // Actions
  fetchFrameworks: () => Promise<void>;
  fetchTools: () => Promise<void>;
  fetchAssessments: () => Promise<void>;
  addCustomFramework: (framework: Omit<ComplianceFramework, 'id'>) => Promise<void>;
  addTool: (tool: Omit<Tool, 'id'>) => Promise<void>;
  scheduleAssessment: (assessment: Omit<Assessment, 'id' | 'date' | 'status'>) => Promise<void>;
  runLynisScan: () => Promise<void | string>;
  runOpenScapScan: () => Promise<void | string>;
  activateTool: (toolId: string) => Promise<void>;
  
  // Wazuh-specific actions
  setWazuhCredentials: (credentials: WazuhCredentials) => void;
  clearWazuhCredentials: () => void;
  setWazuhLoading: (isLoading: boolean) => void;
  setWazuhError: (error: string | null) => void;
}

export const useComplianceStore = create<ComplianceStoreState>((set, get) => ({
  frameworks: [],
  tools: [],
  assessments: [],
  lynisJobId: null,
  openscapReportHtml: null,
  wazuhCredentials: null,
  loading: {
    frameworks: false,
    tools: false,
    assessments: false,
    lynisRunning: false,
    openscapRunning: false,
    wazuh: false
  },
  error: {
    frameworks: null,
    tools: null,
    assessments: null,
    lynisScan: null,
    openscapScan: null,
    wazuh: null
  },
  
  fetchFrameworks: async () => {
    set((state) => ({
      loading: { ...state.loading, frameworks: true },
      error: { ...state.error, frameworks: null },
    }));
    
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/frameworks');
      // const data = await response.json();
      
      // Using mock data for now
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set((state) => ({
        frameworks: mockFrameworks,
        loading: { ...state.loading, frameworks: false },
      }));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      set((state) => ({
        loading: { ...state.loading, frameworks: false },
        error: { ...state.error, frameworks: 'Failed to fetch frameworks' },
      }));
    }
  },
  
  fetchTools: async () => {
    set((state) => ({
      loading: { ...state.loading, tools: true },
      error: { ...state.error, tools: null },
    }));
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Add Wazuh to the tools list if it's not already there
      const wazuhTool = {
        id: 'wazuh',
        name: 'Wazuh',
        description: 'Open source security monitoring solution',
        status: get().wazuhCredentials ? 'active' as ToolStatus : 'inactive' as ToolStatus,
        type: 'scanner',
        version: '4.4.0',
        supportedFrameworks: ['pci-dss', 'hipaa', 'gdpr', 'nist-800-53'],
        lastRun: get().wazuhCredentials ? new Date().toISOString() : null
      };
      
      // Find if Wazuh exists in the tools array
      const tools = [...mockTools];
      const wazuhIndex = tools.findIndex(tool => tool.id === 'wazuh');
      
      if (wazuhIndex >= 0) {
        // Update existing Wazuh entry
        tools[wazuhIndex] = {
          ...tools[wazuhIndex],
          status: get().wazuhCredentials ? 'active' as ToolStatus : 'inactive' as ToolStatus,
          lastRun: get().wazuhCredentials ? new Date().toISOString() : tools[wazuhIndex].lastRun
        };
      } else {
        // Add Wazuh to tools
        tools.push(wazuhTool);
      }
      
      set((state) => ({
        tools,
        loading: { ...state.loading, tools: false },
      }));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      set((state) => ({
        loading: { ...state.loading, tools: false },
        error: { ...state.error, tools: 'Failed to fetch tools' },
      }));
    }
  },
  
  fetchAssessments: async () => {
    set((state) => ({
      loading: { ...state.loading, assessments: true },
      error: { ...state.error, assessments: null },
    }));
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set((state) => ({
        assessments: mockAssessments,
        loading: { ...state.loading, assessments: false },
      }));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      set((state) => ({
        loading: { ...state.loading, assessments: false },
        error: { ...state.error, assessments: 'Failed to fetch assessments' },
      }));
    }
  },
  
  addCustomFramework: async (framework) => {
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newFramework: ComplianceFramework = {
        id: `custom-${Date.now()}`,
        ...framework,
        custom: true,
      };
      
      set((state) => ({
        frameworks: [...state.frameworks, newFramework],
      }));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      set((state) => ({
        error: { ...state.error, frameworks: 'Failed to add custom framework' },
      }));
    }
  },
  
  addTool: async (tool) => {
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newTool: Tool = {
        id: `tool-${Date.now()}`,
        ...tool,
        status: 'inactive',
      };
      
      set((state) => ({
        tools: [...state.tools, newTool],
      }));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      set((state) => ({
        error: { ...state.error, tools: 'Failed to add tool' },
      }));
    }
  },
  
  scheduleAssessment: async (assessment) => {
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newAssessment: Assessment = {
        id: `assessment-${Date.now()}`,
        ...assessment,
        date: new Date().toISOString(),
        status: 'scheduled',
      };
      
      set((state) => ({
        assessments: [...state.assessments, newAssessment],
      }));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      set((state) => ({
        error: { ...state.error, assessments: 'Failed to schedule assessment' },
      }));
    }
  },

  runLynisScan: async () => {
    // Set loading state
    set(state => ({
      ...state,
      loading: { ...state.loading, lynisRunning: true }
    }));

    // Generate a job ID
    const jobId = `job-${Date.now()}`;

    try {
      // Clear any existing flags first to ensure consistent behavior
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('lynis_ran');
        localStorage.removeItem('lynis_ran');
      }
      
      // Set flag that Lynis has run (for compliance display)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('lynis_ran', 'true');
        localStorage.setItem('lynis_ran', 'true');
      }
      
      // Generate a compliance score
      const complianceScore = 78; // 78%
      
      // Update all frameworks to show compliance
      const updatedFrameworks = get().frameworks.map(framework => {
        const total = framework.totalControls || 100;
        const compliantCount = Math.floor(total * (complianceScore / 100));
        
        return {
          ...framework,
          compliantCount,
          totalControls: total,
          status: 'compliant' as ComplianceStatus,
          lastAssessed: new Date().toISOString()
        };
      });
      
      // Set mostly compliant findings
      const findings = [
        {
          controlId: 'SSH-01',
          status: 'compliant' as ComplianceStatus,
          details: 'SSH daemon configured with secure settings',
          severity: 'high' as Severity
        },
        {
          controlId: 'AUTH-02',
          status: 'compliant' as ComplianceStatus,
          details: 'Password policies enforced correctly',
          severity: 'high' as Severity
        },
        {
          controlId: 'FILE-03',
          status: 'non-compliant' as ComplianceStatus,
          details: 'World-writable files found in system directories',
          severity: 'medium' as Severity
        },
        {
          controlId: 'KERNEL-04',
          status: 'compliant' as ComplianceStatus,
          details: 'Kernel parameters configured securely',
          severity: 'high' as Severity
        },
        {
          controlId: 'NET-05',
          status: 'compliant' as ComplianceStatus,
          details: 'Network configuration follows security best practices',
          severity: 'medium' as Severity
        }
      ];
      
      // Create a new assessment
      const newAssessment: Assessment = {
        id: `assessment-${Date.now()}`,
        name: 'Lynis Security Scan',
        frameworkId: 'nist-800-53',
        toolId: 'lynis',
        date: new Date().toISOString(),
        status: 'completed',
        targetSystems: ['hpc-node-01', 'hpc-master'],
        summaryScore: 78,
        findings
      };
      
      // Update tool status
      const updatedTools = get().tools.map(tool => {
        if (tool.id === 'lynis') {
          return {
            ...tool,
            lastRun: new Date().toISOString(),
            status: 'active' as ToolStatus
          };
        }
        return tool;
      });
      
      // Immediately update state
      set({
        frameworks: updatedFrameworks,
        assessments: [...get().assessments, newAssessment],
        tools: updatedTools,
        lynisJobId: jobId,
        loading: {
          frameworks: false,
          tools: false,
          assessments: false,
          lynisRunning: false,
          openscapRunning: false
        },
        error: {
          frameworks: null,
          tools: null,
          assessments: null,
          lynisScan: null,
          openscapScan: null
        }
      });
      
      return jobId;
    } catch (error) {
      console.error('Error generating Lynis data:', error);
      
      // Reset loading state on error
      set(state => ({
        ...state,
        loading: { ...state.loading, lynisRunning: false },
        error: { ...state.error, lynisScan: 'Error generating assessment data' }
      }));
      
      throw error;
    }
  },

  runOpenScapScan: async () => {
    // Set loading state
    set(state => ({
      ...state,
      loading: { ...state.loading, openscapRunning: true }
    }));

    try {
      // In a real app, this would make an API call to run OpenSCAP
      // The sequence of commands would be:
      // 1. wget https://security-metadata.canonical.com/oval/com.ubuntu.$(lsb_release -cs).usn.oval.xml.bz2
      // 2. bzip2 -d com.ubuntu.$(lsb_release -cs).usn.oval.xml.bz2
      // 3. oscap oval eval --report oval-$(lsb_release -cs).html com.ubuntu.$(lsb_release -cs).usn.oval.xml
      // 4. xdg-open oval-$(lsb_release -cs).html (if in desktop environment)
      
      // For the demo, we'll simulate the scan with mock data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Raw output from running the commands as it would appear in the terminal
      const rawOvalOutput = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="generator" content="oscap" />
    <title>OpenSCAP Security Report</title>
    <style type="text/css">
      body {
        font-family: Verdana, sans-serif;
        font-size: 12pt;
        margin: 0;
        padding: 0;
        background-color: #fff;
        color: #000;
      }
      h1 {
        font-size: 24pt;
        border-bottom: 4px solid #999;
        margin: 0.5em 0;
        padding-bottom: 0.2em;
      }
      h2 {
        font-size: 18pt;
        padding-top: 0.5em;
        margin: 0.5em 0;
      }
      p {
        margin: 1em 0;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
      }
      th, td {
        border: 1px solid #ccc;
        padding: 0.5em;
        text-align: left;
        vertical-align: top;
      }
      th {
        background-color: #eee;
        font-weight: bold;
      }
      th:first-child {
        width: 25%;
      }
      ul {
        margin: 0.5em 0 0.5em 2em;
        padding: 0;
      }
      .pass {
        color: #090;
        font-weight: bold;
      }
      .fail {
        color: #900;
        font-weight: bold;
      }
      .warn {
        color: #960;
        font-weight: bold;
      }
      .info {
        color: #333;
      }
      .cve {
        color: #900;
        font-weight: bold;
      }
      pre {
        background-color: #eee;
        border: 1px solid #ccc;
        padding: 0.5em;
        overflow: auto;
        font-family: monospace;
        white-space: pre-wrap;
      }
      .score {
        color: #900;
        font-weight: bold;
        font-size: 120%;
      }
      .rule-table {
        margin-top: 1em;
      }
      .result-overview {
        margin-top: 1em;
      }
      .oval-report {
        margin: 1em;
      }
    </style>
  </head>
  <body>
    <div class="oval-report">
      <h1>OVAL Security Compliance Report</h1>
      <p>This report shows the results of an OVAL vulnerability scan.</p>
      <p><b>Scan Date:</b> ${new Date().toISOString().split('T')[0]}</p>
      <p><b>Host:</b> Ubuntu $(lsb_release -cs)</p>

      <h2>Vulnerability Summary</h2>
      <table class="result-overview">
        <tr>
          <th>Total Definitions</th>
          <td>197</td>
        </tr>
        <tr>
          <th>Compliant</th>
          <td class="pass">153 (78%)</td>
        </tr>
        <tr>
          <th>Non-Compliant</th>
          <td class="fail">44 (22%)</td>
        </tr>
        <tr>
          <th>Error</th>
          <td>0</td>
        </tr>
        <tr>
          <th>Unknown</th>
          <td>0</td>
        </tr>
      </table>

      <h2>Command Information</h2>
      <pre>wget https://security-metadata.canonical.com/oval/com.ubuntu.$(lsb_release -cs).usn.oval.xml.bz2
bzip2 -d com.ubuntu.$(lsb_release -cs).usn.oval.xml.bz2
oscap oval eval --report oval-$(lsb_release -cs).html com.ubuntu.$(lsb_release -cs).usn.oval.xml
cat oval-$(lsb_release -cs).html</pre>

      <h2>Vulnerability Details</h2>
      <table class="rule-table">
        <tr>
          <th>CVE ID</th>
          <th>Result</th>
          <th>Severity</th>
          <th>Description</th>
        </tr>
        <tr>
          <td class="cve">CVE-2023-1234</td>
          <td class="fail">fail</td>
          <td>High</td>
          <td>Buffer overflow in OpenSSL allows remote attackers to execute arbitrary code via crafted packets.</td>
        </tr>
        <tr>
          <td class="cve">CVE-2023-5678</td>
          <td class="fail">fail</td>
          <td>High</td>
          <td>A race condition in the Linux kernel can lead to local privilege escalation.</td>
        </tr>
        <tr>
          <td class="cve">CVE-2023-9012</td>
          <td class="fail">fail</td>
          <td>High</td>
          <td>Bash allows command execution through specially crafted environment variables.</td>
        </tr>
        <tr>
          <td class="cve">CVE-2023-3456</td>
          <td class="fail">fail</td>
          <td>Medium</td>
          <td>Nginx information disclosure vulnerability allows remote attackers to view sensitive information.</td>
        </tr>
        <tr>
          <td class="cve">CVE-2023-7890</td>
          <td class="fail">fail</td>
          <td>Medium</td>
          <td>Python 3 path traversal vulnerability in standard library functions.</td>
        </tr>
        <tr>
          <td class="cve">CVE-2022-1111</td>
          <td class="pass">pass</td>
          <td>Low</td>
          <td>OpenSSH server denial of service through crafted authentication requests.</td>
        </tr>
      </table>

      <h2>Technical Details</h2>
      <h3>CVE-2023-1234 (openssl)</h3>
      <pre>
Definition oval:com.ubuntu.focal:def:202300001
Title: CVE-2023-1234: Buffer overflow in OpenSSL
Result: fail

Referenced tests:
  Test oval:com.ubuntu.focal:tst:202300001 (Test for installed package version of openssl)
    Result: true
    Tested object: dpkginfo_object (openssl)
    Evaluated state: dpkginfo_state (version < 1.1.1f-1ubuntu2.17)
      Version: 1.1.1f-1ubuntu2.16 (true)
      </pre>

      <h3>CVE-2023-5678 (Linux kernel)</h3>
      <pre>
Definition oval:com.ubuntu.focal:def:202300002
Title: CVE-2023-5678: Race condition in Linux kernel
Result: fail  

Referenced tests:
  Test oval:com.ubuntu.focal:tst:202300002 (Test for installed package version of linux-image)
    Result: true
    Tested object: dpkginfo_object (linux-image-5.4.0-42-generic)
    Evaluated state: dpkginfo_state (version < 5.4.0-42.46)
      Version: 5.4.0-42.45 (true)
      </pre>

      <h2>Remediation</h2>
      <p>To address the identified vulnerabilities, run the following commands:</p>
      <pre>sudo apt update
sudo apt upgrade -y</pre>
      <p>After upgrading, reboot the system to apply all changes:</p>
      <pre>sudo reboot</pre>
      
      <h2>References</h2>
      <ul>
        <li><a href="https://security-metadata.canonical.com/">Ubuntu Security Information</a></li>
        <li><a href="https://oval.cisecurity.org/">OVAL Repository</a></li>
      </ul>
      
      <p><small>OpenSCAP Version: 1.3.6</small></p>
    </div>
  </body>
</html>`;
      
      // Create a new assessment for OpenSCAP
      const newAssessment: Assessment = {
        id: `assessment-${Date.now()}`,
        name: 'OpenSCAP OVAL Scan',
        frameworkId: 'nist-800-53',
        toolId: 'openscap',
        date: new Date().toISOString(),
        status: 'completed',
        targetSystems: ['hpc-node-01', 'hpc-master'],
        summaryScore: 78,
        findings: [
          {
            controlId: 'OVAL-CVE-2023-1234',
            status: 'non-compliant' as ComplianceStatus,
            details: 'OpenSSL vulnerability detected',
            severity: 'high' as Severity
          },
          {
            controlId: 'OVAL-CVE-2023-5678',
            status: 'non-compliant' as ComplianceStatus,
            details: 'Kernel vulnerability detected',
            severity: 'high' as Severity
          },
          {
            controlId: 'OVAL-CVE-2023-9012',
            status: 'non-compliant' as ComplianceStatus,
            details: 'Bash vulnerability detected',
            severity: 'high' as Severity
          }
        ]
      };
      
      // Update tool status
      const updatedTools = get().tools.map(tool => {
        if (tool.id === 'openscap') {
          return {
            ...tool,
            lastRun: new Date().toISOString(),
            status: 'active' as ToolStatus
          };
        }
        return tool;
      });
      
      // Update state
      set({
        assessments: [...get().assessments, newAssessment],
        tools: updatedTools,
        openscapReportHtml: rawOvalOutput,
        loading: {
          ...get().loading,
          openscapRunning: false
        },
        error: {
          ...get().error,
          openscapScan: null
        }
      });
      
      // If in a browser environment, set localStorage/sessionStorage flags
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('openscap_ran', 'true');
      }
      
      return 'success';
    } catch (error) {
      console.error('Error generating OpenSCAP data:', error);
      
      // Reset loading state on error
      set(state => ({
        ...state,
        loading: { ...state.loading, openscapRunning: false },
        error: { ...state.error, openscapScan: 'Error generating OpenSCAP report' }
      }));
      
      throw error;
    }
  },

  activateTool: async (toolId: string) => {
    try {
      // In a real app, this would be an API call to activate the tool
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const currentTools = get().tools;
      const updatedTools = currentTools.map((tool) => {
        if (tool.id === toolId) {
          return {
            ...tool,
            status: 'active' as ToolStatus
          };
        }
        return tool;
      });
      
      set({
        tools: updatedTools,
        error: {
          frameworks: null,
          tools: null,
          assessments: null,
          lynisScan: null,
          openscapScan: null
        }
      });

      // If Lynis was activated, automatically run a scan
      if (toolId === 'lynis') {
        // Set a timeout to allow UI to update first
        setTimeout(async () => {
          await get().runLynisScan();
          
          // Set a flag that the dashboard should refresh
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('dashboard_refresh', 'true');
          }
        }, 300);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      set({
        error: { 
          frameworks: null,
          tools: 'Failed to activate tool',
          assessments: null,
          lynisScan: null,
          openscapScan: null
        }
      });
    }
  },

  // Wazuh-specific actions
  setWazuhCredentials: (credentials: WazuhCredentials) => {
    console.log('Setting Wazuh credentials in store:', {
      apiUrl: credentials.apiUrl,
      username: credentials.username,
      hasPassword: !!credentials.password
    });
    
    set((state) => ({ 
      wazuhCredentials: credentials,
      // Update tools to mark Wazuh as active
      tools: state.tools.map(tool => 
        tool.id === 'wazuh' 
          ? { ...tool, status: 'active' as ToolStatus, lastRun: new Date().toISOString() } 
          : tool
      )
    }));
    
    // Store credentials in sessionStorage for persistence
    try {
      if (typeof window !== 'undefined') {
        // Store basic info without passwords
        const credToStore = {
          apiUrl: credentials.apiUrl,
          username: credentials.username,
          // Don't store passwords in sessionStorage
          configured: true
        };
        console.log('Storing Wazuh credentials in sessionStorage:', credToStore);
        sessionStorage.setItem('wazuh_credentials', JSON.stringify(credToStore));
        
        // Also set a flag that can be checked on page load
        localStorage.setItem('wazuh_configured', 'true');
      }
    } catch (e) {
      console.error('Failed to store Wazuh credentials:', e);
    }
  },
  
  clearWazuhCredentials: () => {
    set((state) => ({ 
      wazuhCredentials: null,
      // Update tools to mark Wazuh as inactive
      tools: state.tools.map(tool => 
        tool.id === 'wazuh' 
          ? { ...tool, status: 'inactive' as ToolStatus } 
          : tool
      )
    }));
    
    // Clear from sessionStorage
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('wazuh_credentials');
      }
    } catch (e) {
      console.error('Failed to clear Wazuh credentials:', e);
    }
  },
  
  setWazuhLoading: (isLoading: boolean) => {
    set((state) => ({
      loading: { ...state.loading, wazuh: isLoading }
    }));
  },
  
  setWazuhError: (error: string | null) => {
    set((state) => ({
      error: { ...state.error, wazuh: error }
    }));
  },
}));