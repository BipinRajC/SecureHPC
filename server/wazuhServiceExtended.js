/**
 * Extended Wazuh Service
 * 
 * This module extends the capabilities of the standard wazuhService with:
 * - Enhanced error handling and retry logic
 * - Filesystem report management
 * - Health monitoring capabilities
 * - Better integration with the MCP architecture
 */

const fs = require('fs').promises;
const path = require('path');
const { wazuhService } = require('./wazuhService');

// Create a wrapper around the existing wazuhService
class WazuhServiceExtended {
  constructor() {
    this.baseService = wazuhService;
    this.reportPath = path.join(__dirname, 'data', 'wazuh-reports');
    this.initialize();
  }
  
  async initialize() {
    try {
      // Ensure report directory exists
      await fs.mkdir(this.reportPath, { recursive: true });
      console.log('WazuhServiceExtended initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WazuhServiceExtended:', error.message);
    }
  }
  
  // Pass-through to base service for standard operations
  get isConnected() {
    return this.baseService.isConnected;
  }
  
  getStatus() {
    return this.baseService.getStatus();
  }
  
  async configure(apiUrl, username, password) {
    return this.baseService.configure(apiUrl, username, password);
  }
  
  /**
   * Run a comprehensive health check on the Wazuh API
   */
  async runHealthCheck() {
    try {
      // Get connection status
      const status = this.getStatus();
      
      if (!status.connected) {
        return {
          healthy: false,
          timestamp: new Date().toISOString(),
          status,
          message: 'Wazuh API is not connected'
        };
      }
      
      // Test basic API operations with proper error handling
      const clusterStatus = await this.safeApiCall('/cluster/status');
      const managerInfo = await this.safeApiCall('/manager/info');
      const agentsSummary = await this.safeApiCall('/agents/summary/status');
      
      // Check overall health based on API responses
      const healthy = 
        clusterStatus.success && 
        managerInfo.success && 
        agentsSummary.success;
      
      return {
        healthy,
        timestamp: new Date().toISOString(),
        connection: status,
        apiChecks: {
          clusterStatus: clusterStatus.success,
          managerInfo: managerInfo.success,
          agentsSummary: agentsSummary.success
        },
        details: {
          clusterStatus: clusterStatus.data,
          managerInfo: managerInfo.data,
          agentsSummary: agentsSummary.data
        }
      };
    } catch (error) {
      return {
        healthy: false,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
  
  /**
   * Make a safe API call with proper error handling
   */
  async safeApiCall(endpoint, method = 'get', data = null) {
    try {
      const result = await this.baseService.request(method, endpoint, data);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get a comprehensive agent profile by collecting data from multiple endpoints
   */
  async getAgentProfile(agentId) {
    const formattedAgentId = this.baseService.formatAgentId(agentId);
    
    // Make parallel requests to gather all agent data
    const [
      hardware,
      os,
      network,
      packages,
      processes,
      sca
    ] = await Promise.all([
      this.safeApiCall(`/syscollector/${formattedAgentId}/hardware`),
      this.safeApiCall(`/syscollector/${formattedAgentId}/os`),
      this.safeApiCall(`/syscollector/${formattedAgentId}/networks`),
      this.safeApiCall(`/syscollector/${formattedAgentId}/packages?limit=100`),
      this.safeApiCall(`/syscollector/${formattedAgentId}/processes?limit=100`),
      this.safeApiCall(`/sca/${formattedAgentId}`)
    ]);
    
    // Compile results
    const profile = {
      agentId: formattedAgentId,
      timestamp: new Date().toISOString(),
      summary: {
        hardware: hardware.success,
        os: os.success,
        network: network.success,
        packages: packages.success,
        processes: processes.success,
        sca: sca.success
      },
      details: {
        hardware: hardware.data,
        os: os.data,
        network: network.data,
        packages: packages.data,
        processes: processes.data,
        sca: sca.data
      }
    };
    
    // Save report
    await this.saveAgentReport(formattedAgentId, 'profile', profile);
    
    return profile;
  }
  
  /**
   * Save an agent report to the filesystem
   */
  async saveAgentReport(agentId, type, data) {
    try {
      const reportDir = path.join(this.reportPath, agentId);
      
      // Ensure directory exists
      await fs.mkdir(reportDir, { recursive: true });
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `${type}_${timestamp}.json`;
      const reportPath = path.join(reportDir, filename);
      
      // Save the report data
      await fs.writeFile(reportPath, JSON.stringify(data, null, 2));
      
      console.log(`Saved ${type} report for agent ${agentId} to ${reportPath}`);
      
      return {
        reportId: `${agentId}_${type}_${timestamp}`,
        path: reportPath,
        filename,
        timestamp
      };
    } catch (error) {
      console.error(`Error saving report for agent ${agentId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get reports for an agent
   */
  async getAgentReports(agentId) {
    try {
      const formattedAgentId = this.baseService.formatAgentId(agentId);
      const reportDir = path.join(this.reportPath, formattedAgentId);
      
      // Check if directory exists
      try {
        await fs.access(reportDir);
      } catch {
        // Directory doesn't exist, no reports yet
        return { reports: [] };
      }
      
      // List report files
      const files = await fs.readdir(reportDir);
      
      // Parse report metadata from filenames
      const reports = files
        .filter(file => file.endsWith('.json'))
        .map(filename => {
          const match = filename.match(/^(.+)_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}.\d{3}Z).json$/);
          if (match) {
            const [, type, timestamp] = match;
            return {
              reportId: `${formattedAgentId}_${type}_${timestamp}`,
              type,
              timestamp: timestamp.replace(/-/g, ':'),
              filename,
              path: path.join(reportDir, filename)
            };
          }
          return null;
        })
        .filter(Boolean);
      
      // Sort by timestamp (newest first)
      reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return { reports };
    } catch (error) {
      console.error(`Error listing reports for agent ${agentId}:`, error.message);
      return { reports: [], error: error.message };
    }
  }
  
  /**
   * Get a specific report
   */
  async getReport(reportId) {
    try {
      // Parse report ID to get agent ID and report path
      const match = reportId.match(/^(\d+)_(.+)_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}.\d{3}Z)$/);
      
      if (!match) {
        throw new Error(`Invalid report ID format: ${reportId}`);
      }
      
      const [, agentId, type, timestamp] = match;
      const formattedAgentId = this.baseService.formatAgentId(agentId);
      const reportPath = path.join(
        this.reportPath, 
        formattedAgentId, 
        `${type}_${timestamp.replace(/:/g, '-')}.json`
      );
      
      // Check if file exists
      try {
        await fs.access(reportPath);
      } catch {
        throw new Error(`Report not found: ${reportId}`);
      }
      
      // Read and parse report
      const data = await fs.readFile(reportPath, 'utf8');
      
      return {
        reportId,
        agentId: formattedAgentId,
        type,
        timestamp,
        data: JSON.parse(data)
      };
    } catch (error) {
      console.error(`Error fetching report ${reportId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get enhanced agent information with report history
   */
  async getEnhancedAgents(limit = 20, offset = 0) {
    // Get base agent list
    const agents = await this.baseService.getAgents(limit, offset);
    
    if (!agents.data || !agents.data.affected_items) {
      throw new Error('Invalid response from Wazuh API');
    }
    
    const enhancedAgents = [];
    
    // Enhance each agent with report information
    for (const agent of agents.data.affected_items) {
      const formattedAgentId = this.baseService.formatAgentId(agent.id);
      
      // Get report history
      const { reports } = await this.getAgentReports(formattedAgentId);
      
      // Create enhanced agent object
      const enhancedAgent = {
        ...agent,
        reports: {
          count: reports.length,
          latest: reports.length > 0 ? reports[0] : null
        },
        // Add more useful fields
        statusSummary: {
          active: agent.status === 'active',
          lastKeepAlive: agent.lastKeepAlive,
          lastScan: reports.length > 0 ? reports[0].timestamp : null
        }
      };
      
      enhancedAgents.push(enhancedAgent);
    }
    
    return {
      agents: enhancedAgents,
      total: agents.data.total_affected_items,
      offset,
      limit
    };
  }
}

// Create and export a singleton instance
const wazuhServiceExtended = new WazuhServiceExtended();

module.exports = {
  wazuhServiceExtended,
  WazuhServiceExtended
}; 