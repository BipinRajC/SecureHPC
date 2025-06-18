/**
 * MCP Analysis Service
 * 
 * This service provides AI-powered analysis of security scan data from Wazuh
 * and generates detailed compliance reports, remediation plans, and security insights.
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const { mcpService, JobType } = require('./mcpService');

// Report formats supported
const ReportFormat = {
  JSON: 'json',
  HTML: 'html',
  PDF: 'pdf',
  CSV: 'csv',
  MARKDOWN: 'markdown'
};

// Security frameworks
const SecurityFramework = {
  CIS: 'cis',
  PCI_DSS: 'pci_dss',
  GDPR: 'gdpr',
  HIPAA: 'hipaa',
  NIST: 'nist',
  ISO27001: 'iso27001'
};

// Available analysis types
const AnalysisType = {
  COMPLIANCE: 'compliance',
  VULNERABILITY: 'vulnerability',
  CONFIGURATION: 'configuration',
  NETWORK: 'network',
  MULTI_FRAMEWORK: 'multi_framework'
};

class MCPAnalysisService extends EventEmitter {
  constructor() {
    super();
    this.reportsPath = path.join(__dirname, 'data', 'analysis-reports');
    this.initialized = false;
    
    // Initialize
    this.initialize();
  }
  
  async initialize() {
    try {
      // Create reports directory if it doesn't exist
      await fs.mkdir(this.reportsPath, { recursive: true });
      
      // Register event listeners for MCP job events
      this.registerEventListeners();
      
      this.initialized = true;
      console.log('MCP Analysis Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MCP Analysis Service:', error.message);
    }
  }
  
  registerEventListeners() {
    // Listen for MCP job events
    mcpService.on('job:completed', (job) => {
      if (job.type === JobType.REPORT_GENERATION) {
        console.log(`MCPAnalysisService: Report generation job completed: ${job.id}`);
        this.emit('report:generated', job);
      }
    });
    
    mcpService.on('job:failed', (job) => {
      if (job.type === JobType.REPORT_GENERATION) {
        console.log(`MCPAnalysisService: Report generation job failed: ${job.id}`);
        this.emit('report:failed', job);
      }
    });
  }
  
  /**
   * Generate a security analysis report
   * @param {Object} securityData - The security data to analyze
   * @param {string} analysisType - Type of analysis to perform
   * @param {Object} options - Report options
   * @returns {Promise<Object>} - Analysis results
   */
  async generateAnalysisReport(securityData, analysisType, options = {}) {
    const {
      format = ReportFormat.JSON,
      framework = SecurityFramework.CIS,
      includeDetails = true,
      title = `${analysisType.toUpperCase()} Security Analysis Report`,
      description = '',
    } = options;
    
    // Format report ID
    const reportId = `report-${analysisType}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Generate a simulated AI analysis based on the data and type
    const analysis = this.generateAIAnalysis(securityData, analysisType, framework);
    
    // Create full report
    const report = {
      reportId,
      title,
      description,
      analysisType,
      framework,
      timestamp: new Date().toISOString(),
      format,
      analysis,
      rawData: includeDetails ? securityData : undefined
    };
    
    // Save report to disk
    await this.saveReport(report);
    
    return {
      reportId,
      title,
      analysisType,
      framework,
      timestamp: report.timestamp,
      format
    };
  }
  
  /**
   * Get a specific analysis report by ID
   * @param {string} reportId - Report ID
   * @returns {Promise<Object>} - The full report
   */
  async getAnalysisReport(reportId) {
    try {
      const reportPath = path.join(this.reportsPath, `${reportId}.json`);
      
      // Check if report exists
      try {
        await fs.access(reportPath);
      } catch (error) {
        throw new Error(`Report not found: ${reportId}`);
      }
      
      // Read report
      const data = await fs.readFile(reportPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error retrieving report ${reportId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * List available analysis reports
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - List of report metadata
   */
  async listReports(filters = {}) {
    try {
      // Get all report files
      const files = await fs.readdir(this.reportsPath);
      
      // Process only JSON files
      const reportFiles = files.filter(file => file.endsWith('.json'));
      
      // Read metadata from each file
      const reports = [];
      for (const file of reportFiles) {
        try {
          const data = await fs.readFile(path.join(this.reportsPath, file), 'utf8');
          const report = JSON.parse(data);
          
          // Extract metadata
          const metadata = {
            reportId: report.reportId,
            title: report.title,
            analysisType: report.analysisType,
            framework: report.framework,
            createdAt: report.timestamp,
            format: report.format
          };
          
          // Apply filters
          let include = true;
          
          if (filters.analysisType && filters.analysisType !== metadata.analysisType) {
            include = false;
          }
          
          if (filters.framework && filters.framework !== metadata.framework) {
            include = false;
          }
          
          if (include) {
            reports.push(metadata);
          }
        } catch (error) {
          console.error(`Error processing report file ${file}:`, error.message);
          // Continue with the next file
        }
      }
      
      // Sort by creation date (newest first)
      reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return reports;
    } catch (error) {
      console.error('Error listing reports:', error.message);
      throw error;
    }
  }
  
  /**
   * Delete an analysis report
   * @param {string} reportId - Report ID to delete
   * @returns {Promise<Object>} - Result of the delete operation
   */
  async deleteReport(reportId) {
    try {
      const reportPath = path.join(this.reportsPath, `${reportId}.json`);
      
      // Check if report exists
      try {
        await fs.access(reportPath);
      } catch (error) {
        throw new Error(`Report not found: ${reportId}`);
      }
      
      // Delete the file
      await fs.unlink(reportPath);
      
      return {
        success: true,
        message: `Report ${reportId} deleted successfully`
      };
    } catch (error) {
      console.error(`Error deleting report ${reportId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Save a report to disk
   * @param {Object} report - The report to save
   * @returns {Promise<Object>} - Metadata about the saved report
   */
  async saveReport(report) {
    try {
      const { reportId } = report;
      
      if (!reportId) {
        throw new Error('Report ID is required');
      }
      
      // Ensure directory exists
      await fs.mkdir(this.reportsPath, { recursive: true });
      
      // Save to file
      const reportPath = path.join(this.reportsPath, `${reportId}.json`);
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      return {
        reportId,
        path: reportPath,
        timestamp: report.timestamp
      };
    } catch (error) {
      console.error('Error saving report:', error.message);
      throw error;
    }
  }
  
  /**
   * Generate AI analysis of security data (currently simulated)
   * @param {Object} securityData - Security data to analyze
   * @param {string} analysisType - Type of analysis
   * @param {string} framework - Security framework to use
   * @returns {Object} - Analysis results
   */
  generateAIAnalysis(securityData, analysisType, framework) {
    // In a real implementation, this would call an LLM or AI service
    // For now, we'll return a simulated response
    
    // Extract key metrics from the security data
    const metrics = this.extractSecurityMetrics(securityData);
    
    // Base analysis structure
    const analysis = {
      summary: this.generateSummary(metrics, analysisType, framework),
      complianceStatus: this.generateComplianceStatus(metrics, framework),
      issues: this.generateIssuesList(metrics, framework),
      recommendations: this.generateRecommendations(metrics, framework),
      overallRiskRating: this.calculateRiskRating(metrics),
      maturityLevel: this.calculateMaturityLevel(metrics),
      frameworkSpecific: this.generateFrameworkSpecificAnalysis(metrics, framework)
    };
    
    return analysis;
  }
  
  /**
   * Extract key security metrics from raw data
   * @param {Object} securityData - Raw security data
   * @returns {Object} - Extracted metrics
   */
  extractSecurityMetrics(securityData) {
    // Extract agent counts
    const agentCount = securityData.agents?.length || 0;
    const activeAgentCount = securityData.agents?.filter(a => a.status === 'active').length || 0;
    
    // Extract vulnerability metrics (if available)
    const vulnerabilities = securityData.vulnerabilities || [];
    const criticalVulnerabilities = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highVulnerabilities = vulnerabilities.filter(v => v.severity === 'high').length;
    
    // Extract SCA metrics (if available)
    const scaResults = securityData.sca || [];
    const passedChecks = scaResults.reduce((sum, r) => sum + (r.pass || 0), 0);
    const failedChecks = scaResults.reduce((sum, r) => sum + (r.fail || 0), 0);
    const totalChecks = passedChecks + failedChecks;
    const complianceScore = totalChecks ? (passedChecks / totalChecks) * 100 : 0;
    
    // Return compiled metrics
    return {
      agentCount,
      activeAgentCount,
      criticalVulnerabilities,
      highVulnerabilities,
      totalVulnerabilities: vulnerabilities.length,
      passedChecks,
      failedChecks,
      totalChecks,
      complianceScore,
      framework: securityData.framework || 'unknown'
    };
  }
  
  /**
   * Generate executive summary of security findings
   */
  generateSummary(metrics, analysisType, framework) {
    const { complianceScore, criticalVulnerabilities, highVulnerabilities, failedChecks } = metrics;
    
    if (analysisType === AnalysisType.COMPLIANCE) {
      return `Security analysis reveals a ${complianceScore.toFixed(1)}% compliance rate with ${framework.toUpperCase()} standards. 
      The scan identified ${failedChecks} non-compliant controls requiring remediation, 
      including ${criticalVulnerabilities} critical and ${highVulnerabilities} high severity issues that represent significant security risks.`;
    }
    
    if (analysisType === AnalysisType.VULNERABILITY) {
      return `Vulnerability assessment detected ${metrics.totalVulnerabilities} security vulnerabilities 
      across ${metrics.agentCount} systems, including ${criticalVulnerabilities} critical and ${highVulnerabilities} high severity issues 
      that require immediate attention. These findings indicate potential exposure to known exploit vectors.`;
    }
    
    return `Security analysis complete with ${complianceScore.toFixed(1)}% overall security rating.
    The assessment identified ${failedChecks} security issues requiring remediation
    including ${criticalVulnerabilities} critical and ${highVulnerabilities} high priority items.`;
  }
  
  /**
   * Generate compliance status details
   */
  generateComplianceStatus(metrics, framework) {
    const { complianceScore } = metrics;
    
    let frameworkSpecificStatus = {};
    
    // Framework-specific assessments
    if (framework === SecurityFramework.CIS) {
      frameworkSpecificStatus = {
        implementationGroups: {
          ig1: {
            description: "Basic CIS Controls - Essential cyber hygiene",
            compliance: Math.min(complianceScore + 15, 100),
          },
          ig2: {
            description: "Foundational CIS Controls - Security best practices",
            compliance: Math.max(complianceScore - 10, 0),
          },
          ig3: {
            description: "Organizational CIS Controls - Advanced security capabilities",
            compliance: Math.max(complianceScore - 25, 0),
          }
        }
      };
    } else if (framework === SecurityFramework.PCI_DSS) {
      frameworkSpecificStatus = {
        requirements: {
          "Requirement 1": { description: "Install and maintain network security controls", compliance: Math.random() * 100 },
          "Requirement 2": { description: "Apply secure configurations to all systems", compliance: Math.random() * 100 },
          "Requirement 6": { description: "Develop and maintain secure systems", compliance: Math.random() * 100 },
          "Requirement 11": { description: "Test security systems and processes regularly", compliance: Math.random() * 100 }
        }
      };
    }
    
    return {
      overallCompliance: complianceScore,
      rating: this.getComplianceRating(complianceScore),
      maturityLevel: this.calculateMaturityLevel(metrics),
      frameworkSpecificStatus
    };
  }
  
  /**
   * Generate a list of identified security issues
   */
  generateIssuesList(metrics, framework) {
    // In a real implementation, this would analyze actual security findings
    // Here we'll generate a simulated list
    
    const issues = [];
    
    if (framework === SecurityFramework.CIS) {
      issues.push({
        id: "CIS-1.4",
        title: "Maintain Detailed Asset Inventory",
        severity: "high",
        description: "Maintain detailed asset inventory information in a database or spreadsheet, with ability to track system owner.",
        impact: "Without a complete asset inventory, the organization cannot effectively manage security risks, leading to potential unpatched systems and security blind spots.",
        remediation: "Implement an automated asset discovery tool and maintain a centralized inventory database with ownership and patch status information."
      });
      
      issues.push({
        id: "CIS-3.11",
        title: "Encrypt Sensitive Data in Transit",
        severity: "critical",
        description: "Encrypt Sensitive Data in Transit across trusted and untrusted networks.",
        impact: "Unencrypted sensitive data in transit can be intercepted, leading to data breaches and potential regulatory violations.",
        remediation: "Implement TLS 1.2+ for all data transmissions, configure web servers to use HTTPS, and use secure transfer protocols like SFTP instead of FTP."
      });
    } else if (framework === SecurityFramework.PCI_DSS) {
      issues.push({
        id: "PCI-DSS-1.3.6",
        title: "Restrict outbound traffic from cardholder data environment",
        severity: "high",
        description: "Restrict outbound traffic from the cardholder data environment to the Internet to only authorized IP addresses.",
        impact: "Unrestricted outbound traffic could allow data exfiltration and command and control connections from malware.",
        remediation: "Implement egress filtering on all connections from the cardholder data environment, allowing only necessary outbound connections."
      });
    }
    
    return issues;
  }
  
  /**
   * Generate remediation recommendations
   */
  generateRecommendations(metrics, framework) {
    return [
      {
        id: "REC-1",
        title: "Implement Comprehensive Patch Management",
        priority: "high",
        description: "Establish a robust patch management process to address identified vulnerabilities and ensure systems are kept up-to-date with the latest security patches.",
        steps: [
          "Inventory all systems and applications requiring updates",
          "Define patch testing procedures to validate patches before deployment",
          "Establish maintenance windows for patch deployment",
          "Implement automated patch deployment where possible",
          "Maintain documentation of patch levels and exceptions"
        ]
      },
      {
        id: "REC-2",
        title: "Enhance Access Control Mechanisms",
        priority: "critical",
        description: "Strengthen access controls across the environment to restrict unauthorized access to sensitive systems and data.",
        steps: [
          "Implement multi-factor authentication for all administrative accounts",
          "Review and enforce least privilege access principles",
          "Enable account lockout after repeated failed attempts",
          "Implement privileged access management for administrative accounts",
          "Regularly audit access control configurations"
        ]
      },
      {
        id: "REC-3",
        title: "Improve Security Monitoring Capabilities",
        priority: "medium",
        description: "Enhance security monitoring to detect and respond to potential security incidents more effectively.",
        steps: [
          "Centralize security logs to a SIEM solution",
          "Implement automated alerting for suspicious activities",
          "Establish baseline normal behavior for systems and networks",
          "Develop and test incident response procedures",
          "Configure endpoint detection and response tools on critical systems"
        ]
      }
    ];
  }
  
  /**
   * Generate framework-specific analysis details
   */
  generateFrameworkSpecificAnalysis(metrics, framework) {
    if (framework === SecurityFramework.CIS) {
      return {
        controlFamilies: {
          "Basic CIS Controls (IG1)": {
            description: "Essential cyber hygiene - the foundation of a cybersecurity program",
            compliance: Math.min(metrics.complianceScore + 10, 100),
            findings: `${Math.round(metrics.failedChecks * 0.4)} non-compliant controls in IG1`
          },
          "Security Best Practices (IG2)": {
            description: "Security best practices for medium-sized organizations",
            compliance: Math.max(metrics.complianceScore - 15, 0),
            findings: `${Math.round(metrics.failedChecks * 0.4)} non-compliant controls in IG2`
          },
          "Advanced Security (IG3)": {
            description: "Advanced security capabilities for complex organizations",
            compliance: Math.max(metrics.complianceScore - 30, 0),
            findings: `${Math.round(metrics.failedChecks * 0.2)} non-compliant controls in IG3`
          }
        },
        overallAssessment: "The system demonstrates partial compliance with CIS Controls, with significant gaps in the Advanced Security controls. Basic cyber hygiene controls are generally well-implemented, but security best practices need improvement."
      };
    }
    
    if (framework === SecurityFramework.PCI_DSS) {
      return {
        requirementGroups: {
          "Network Security": {
            compliance: Math.random() * 100,
            requirements: ["1.1", "1.2", "1.3", "1.4"]
          },
          "System Security": {
            compliance: Math.random() * 100,
            requirements: ["2.1", "2.2", "2.3", "2.4"]
          },
          "Access Control": {
            compliance: Math.random() * 100,
            requirements: ["7.1", "7.2", "7.3", "8.1", "8.2"]
          },
          "Testing and Monitoring": {
            compliance: Math.random() * 100,
            requirements: ["10.1", "10.2", "11.1", "11.2", "11.3"]
          }
        },
        overallAssessment: "The environment shows varying levels of compliance with PCI DSS requirements. Significant improvements are needed in system security and access control areas to achieve full compliance."
      };
    }
    
    return {
      message: "Framework-specific analysis not available for the selected framework."
    };
  }
  
  /**
   * Calculate the overall risk rating based on metrics
   */
  calculateRiskRating(metrics) {
    const { complianceScore, criticalVulnerabilities, highVulnerabilities } = metrics;
    
    if (criticalVulnerabilities > 5 || (complianceScore < 60 && criticalVulnerabilities > 0)) {
      return "Critical Risk";
    }
    
    if (criticalVulnerabilities > 0 || highVulnerabilities > 5 || complianceScore < 70) {
      return "High Risk";
    }
    
    if (highVulnerabilities > 0 || complianceScore < 85) {
      return "Medium Risk";
    }
    
    if (complianceScore < 95) {
      return "Low Risk";
    }
    
    return "Minimal Risk";
  }
  
  /**
   * Calculate security maturity level
   */
  calculateMaturityLevel(metrics) {
    const { complianceScore } = metrics;
    
    if (complianceScore < 40) {
      return {
        level: "Initial (1)",
        description: "Security processes are unpredictable, poorly controlled, and reactive"
      };
    }
    
    if (complianceScore < 60) {
      return {
        level: "Repeatable (2)",
        description: "Basic security management processes established"
      };
    }
    
    if (complianceScore < 80) {
      return {
        level: "Defined (3)",
        description: "Security processes documented, standardized, and integrated"
      };
    }
    
    if (complianceScore < 95) {
      return {
        level: "Managed (4)",
        description: "Security processes measured and controlled"
      };
    }
    
    return {
      level: "Optimized (5)",
      description: "Focus on continuous improvement of security processes"
    };
  }
  
  /**
   * Get a descriptive compliance rating
   */
  getComplianceRating(score) {
    if (score < 50) return "Non-Compliant";
    if (score < 70) return "Minimal Compliance";
    if (score < 85) return "Partial Compliance";
    if (score < 95) return "Substantial Compliance";
    return "Fully Compliant";
  }
  
  /**
   * Analyze a dashboard with security metrics
   * @param {Object} dashboardData - Dashboard data to analyze
   * @returns {Promise<string>} - Analysis in markdown format
   */
  async analyzeDashboard(dashboardData) {
    // In a real implementation, this would call an LLM service
    // For now, we'll generate a simulated response
    
    const { summary, toolStatus } = dashboardData;
    
    // Count tools by status
    const activeTools = toolStatus.filter(t => t.status === 'Active').length;
    const errorTools = toolStatus.filter(t => t.status === 'Error').length;
    const inactiveTools = toolStatus.filter(t => t.status === 'Inactive').length;
    
    return `# Dashboard Analysis

I've analyzed your security compliance dashboard and identified several key insights:

## Compliance Status

Your systems are currently at ${Math.round(summary.overallCompliance)}% compliance, ${summary.overallCompliance < 70 ? 'indicating significant security gaps' : 'showing reasonably good security posture'} across all frameworks. ${summary.overallCompliance < 70 ? 'This requires immediate attention to improve your security posture.' : 'Continue strengthening your security controls to reach higher compliance levels.'}

## Critical Issues

${dashboardData.criticalIssues.length} critical compliance issues require attention, particularly in:

${dashboardData.criticalIssues.map(issue => `- **${issue.standard} ${issue.rule}**: ${issue.description}`).join('\n')}

## Tool Status Analysis

From your security toolset:

- **${activeTools} tools** are active and functioning properly
- **${errorTools} tools** are in an error state${errorTools > 0 ? ` (${toolStatus.find(t => t.status === 'Error')?.name || 'None'})` : ''}
- **${inactiveTools} tools** are inactive${inactiveTools > 0 ? ` (${toolStatus.find(t => t.status === 'Inactive')?.name || 'None'})` : ''}

${errorTools > 0 || inactiveTools > 0 ? 'Tool issues may be contributing to your compliance gaps.' : 'All your security tools are functioning properly, which is excellent for maintaining security controls.'}

## Framework Breakdown

${Object.entries(summary.frameworkCompliance || {}).map(([framework, score]) => 
  `- **${framework}**: ${Math.round(Number(score))}% compliant`
).join('\n')}

## Recommendations

1. ${summary.overallCompliance < 80 ? 'Address the critical issues immediately, starting with the highest severity findings' : 'Continue monitoring compliance and implementing security improvements'}
${errorTools > 0 ? `2. Resolve the ${toolStatus.find(t => t.status === 'Error')?.name || 'tools in error state'}` : ''}
${inactiveTools > 0 ? `${errorTools > 0 ? '3' : '2'}. Activate the ${toolStatus.find(t => t.status === 'Inactive')?.name || 'inactive tools'}` : ''}
${errorTools > 0 || inactiveTools > 0 ? `${errorTools > 0 && inactiveTools > 0 ? '4' : '3'}. Run a new comprehensive assessment after these fixes` : '2. Schedule regular security assessments to maintain your security posture'}

I recommend ${summary.overallCompliance < 80 ? 'generating a detailed remediation plan to systematically address all compliance gaps.' : 'continuing to improve your security program with regular assessments and continuous improvement.'}`;
  }
}

// Create and export singleton instance
const mcpAnalysisService = new MCPAnalysisService();

module.exports = {
  mcpAnalysisService,
  MCPAnalysisService,
  ReportFormat,
  SecurityFramework,
  AnalysisType
}; 