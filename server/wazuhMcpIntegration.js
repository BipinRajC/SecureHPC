/**
 * Wazuh MCP Integration
 * 
 * This module provides integration between the Wazuh service and the MCP (Model-Context-Protocol) architecture.
 * It extends the capabilities of the standard Wazuh service with:
 * - Report generation and persistence
 * - Robust error handling and retry mechanics
 * - Health monitoring
 * - Batch operations
 */

const fs = require('fs').promises;
const path = require('path');
const { wazuhService } = require('./wazuhService');
const { wazuhServiceExtended } = require('./wazuhServiceExtended');
const { mcpService, JobType } = require('./mcpService');
const { EventEmitter } = require('events');

// Report formats supported
const ReportFormat = {
  JSON: 'json',
  HTML: 'html',
  PDF: 'pdf',
  CSV: 'csv'
};

// Report types
const ReportType = {
  AGENT_INVENTORY: 'agent_inventory',
  COMPLIANCE: 'compliance',
  VULNERABILITY: 'vulnerability',
  SECURITY_CONFIGURATION: 'security_configuration',
  CUSTOM: 'custom'
};

class WazuhMcpIntegration extends EventEmitter {
  constructor() {
    super();
    this.reportsPath = path.join(__dirname, 'data', 'wazuh-reports');
    this.maxRetries = 3;
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
      console.log('WazuhMcpIntegration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WazuhMcpIntegration:', error.message);
    }
  }
  
  registerEventListeners() {
    // Listen for MCP job events
    mcpService.on('job:scheduled', (job) => {
      if (job.type === JobType.WAZUH_SCAN) {
        console.log(`WazuhMcpIntegration: Wazuh scan job scheduled: ${job.id}`);
      }
    });
    
    mcpService.on('job:completed', (job) => {
      if (job.type === JobType.WAZUH_SCAN) {
        console.log(`WazuhMcpIntegration: Wazuh scan job completed: ${job.id}`);
        this.emit('scan:completed', job);
      }
    });
    
    mcpService.on('job:failed', (job) => {
      if (job.type === JobType.WAZUH_SCAN) {
        console.log(`WazuhMcpIntegration: Wazuh scan job failed: ${job.id}`);
        this.emit('scan:failed', job);
      }
    });
  }
  
  /**
   * Schedule a Wazuh scan for a specific agent
   * @param {string} agentId - The ID of the agent to scan
   * @param {string} scanType - The type of scan to perform
   * @param {number} priority - Job priority (higher values = higher priority)
   * @returns {Promise<string>} - The job ID
   */
  async scheduleScan(agentId, scanType, priority = 3) {
    // Validate connection
    if (!wazuhService.isConnected) {
      throw new Error('Wazuh service is not connected. Please configure it first.');
    }
    
    // Validate agent ID format
    const formattedAgentId = wazuhService.formatAgentId(agentId);
    
    // Schedule the job
    const jobId = mcpService.scheduleJob(
      JobType.WAZUH_SCAN,
      { agentId: formattedAgentId, scanType },
      priority
    );
    
    return jobId;
  }
  
  /**
   * Schedule a full inventory scan of all agents
   * @param {number} priority - Job priority
   * @returns {Promise<string>} - The job ID
   */
  async scheduleFullInventory(priority = 5) {
    // Validate connection
    if (!wazuhService.isConnected) {
      throw new Error('Wazuh service is not connected. Please configure it first.');
    }
    
    // Schedule the inventory job
    const jobId = mcpService.scheduleJob(
      JobType.AGENT_INVENTORY,
      {},
      priority
    );
    
    return jobId;
  }
  
  /**
   * Generate a report based on collected data
   * @param {string} reportType - The type of report to generate
   * @param {Object} options - Report options
   * @returns {Promise<Object>} - Report metadata
   */
  async generateReport(reportType, options = {}) {
    const {
      format = ReportFormat.JSON,
      agentId = null,
      filters = {},
      includeDetails = true,
      title = `Wazuh ${reportType} Report`,
      description = '',
    } = options;
    
    // Generate a unique report ID
    const reportId = `report-${reportType}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Schedule the report generation job
    const jobId = mcpService.scheduleJob(
      JobType.REPORT_GENERATION,
      {
        format,
        reportType,
        reportId,
        agentId,
        filters,
        includeDetails,
        title,
        description,
        timestamp: new Date().toISOString()
      },
      4 // Higher priority for report generation
    );
    
    return {
      reportId,
      jobId,
      status: 'scheduled',
      options: {
        format,
        reportType,
        agentId,
        title,
        description
      }
    };
  }
  
  /**
   * Check Wazuh health status
   * @returns {Promise<Object>} - Health status information
   */
  async checkHealth() {
    try {
      // Get Wazuh status from the extended service
      const healthStatus = await wazuhServiceExtended.runHealthCheck();
      
      // Get active MCP jobs related to Wazuh
      const mcpJobs = mcpService.getJobs(null, 10, 0);
      const wazuhJobs = mcpJobs.jobs.filter(job => 
        job.type === JobType.WAZUH_SCAN || 
        (job.type === JobType.REPORT_GENERATION && job.params.reportType && job.params.reportType.includes('wazuh'))
      );
      
      return {
        timestamp: new Date().toISOString(),
        wazuh: healthStatus,
        jobs: {
          active: wazuhJobs.filter(j => j.status === 'running').length,
          pending: wazuhJobs.filter(j => j.status === 'pending').length,
          failed: wazuhJobs.filter(j => j.status === 'failed').length,
          completed: wazuhJobs.filter(j => j.status === 'completed').length
        }
      };
    } catch (error) {
      console.error('Error checking Wazuh health:', error.message);
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        wazuh: {
          connected: wazuhService.isConnected
        },
        jobs: {}
      };
    }
  }
  
  /**
   * Get the content of a report by ID
   * @param {string} reportId - The ID of the report to retrieve
   * @returns {Promise<Object>} - Report data and metadata
   */
  async getReport(reportId) {
    try {
      const reportPath = path.join(this.reportsPath, `${reportId}.json`);
      
      // Check if report exists
      try {
        await fs.access(reportPath);
      } catch (error) {
        throw new Error(`Report not found: ${reportId}`);
      }
      
      // Read report file
      const data = await fs.readFile(reportPath, 'utf8');
      
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error retrieving report ${reportId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * List available reports with optional filtering
   * @param {Object} filters - Filter options
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
            type: report.reportType,
            createdAt: report.timestamp,
            agentId: report.agentId,
            format: report.format
          };
          
          // Apply filters
          let include = true;
          
          if (filters.type && filters.type !== metadata.type) {
            include = false;
          }
          
          if (filters.agentId && filters.agentId !== metadata.agentId) {
            include = false;
          }
          
          if (filters.format && filters.format !== metadata.format) {
            include = false;
          }
          
          if (include) {
            reports.push(metadata);
          }
        } catch (error) {
          console.error(`Error processing report file ${file}:`, error.message);
          // Continue with next file
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
   * Delete a report by ID
   * @param {string} reportId - The ID of the report to delete
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
   * Save a report to the filesystem
   * @param {Object} reportData - The report data to save
   * @returns {Promise<Object>} - Report metadata
   */
  async saveReport(reportData) {
    try {
      const { reportId } = reportData;
      
      if (!reportId) {
        throw new Error('Report ID is required');
      }
      
      // Ensure reportData has necessary metadata
      const reportToSave = {
        ...reportData,
        timestamp: reportData.timestamp || new Date().toISOString(),
        format: reportData.format || ReportFormat.JSON,
      };
      
      // Save to file
      const reportPath = path.join(this.reportsPath, `${reportId}.json`);
      await fs.writeFile(reportPath, JSON.stringify(reportToSave, null, 2));
      
      return {
        reportId,
        path: reportPath,
        timestamp: reportToSave.timestamp,
        format: reportToSave.format
      };
    } catch (error) {
      console.error('Error saving report:', error.message);
      throw error;
    }
  }
  
  /**
   * Get all Wazuh agents with enhanced information
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Enhanced agent information
   */
  async getEnhancedAgents(options = {}) {
    const { limit = 50, offset = 0, includeStatus = true } = options;
    
    try {
      // Use the extended service for better agent information
      return await wazuhServiceExtended.getEnhancedAgents(limit, offset);
    } catch (error) {
      console.error('Error fetching enhanced agents:', error.message);
      throw error;
    }
  }
}

// Create and export a singleton instance
const wazuhMcpIntegration = new WazuhMcpIntegration();

module.exports = {
  wazuhMcpIntegration,
  WazuhMcpIntegration,
  ReportFormat,
  ReportType
}; 