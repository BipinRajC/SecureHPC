const axios = require('axios');
const https = require('https');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

// Wazuh API constants
const TOKEN_EXPIRATION_TIME = 900000; // 15 minutes (900 seconds * 1000)
const DEFAULT_API_PORT = 55000;
const CONNECTION_CHECK_INTERVAL = 60000; // 1 minute
const MAX_CONNECTION_RETRIES = 5;

// Create axios instance with SSL verification disabled for development
const wazuhAxios = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false // Only for development
  }),
  // Add timeout to prevent long hanging requests
  timeout: 10000 // 10 seconds
});

// Add request/response interceptors for better debugging
wazuhAxios.interceptors.request.use(config => {
  console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);
  return config;
}, error => {
  console.error('Request error:', error.message);
  return Promise.reject(error);
});

wazuhAxios.interceptors.response.use(response => {
  console.log(`Response from ${response.config.url}: Status ${response.status}`);
  return response;
}, error => {
  if (error.response) {
    console.error(`Error response from ${error.config?.url}: Status ${error.response.status}`);
  } else if (error.request) {
    console.error(`No response received from ${error.config?.url}: ${error.message}`);
  } else {
    console.error(`Request setup error: ${error.message}`);
  }
  return Promise.reject(error);
});

// Token manager to handle authentication and token renewal
class WazuhTokenManager extends EventEmitter {
  constructor() {
    super();
    this.token = null;
    this.tokenExpiration = null;
    this.apiUrl = null;
    this.credentials = null;
    this.refreshInterval = null;
    this.connectionCheckInterval = null;
    this.connectionRetries = 0;
    this.lastConnectionError = null;
  }

  // Configure the token manager with Wazuh API details
  configure(apiUrl, username, password) {
    // Clear any existing refresh interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Clear any existing connection check interval
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    this.apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash if present
    this.credentials = { username, password };
    this.token = null;
    this.tokenExpiration = null;
    this.connectionRetries = 0;
    this.lastConnectionError = null;
    
    // Set up connection check interval
    this.connectionCheckInterval = setInterval(() => {
      this.checkConnection();
    }, CONNECTION_CHECK_INTERVAL);
    
    return this.authenticate();
  }

  // Check the connection to Wazuh API
  async checkConnection() {
    // Skip check if we're not configured
    if (!this.apiUrl || !this.credentials) {
      return;
    }
    
    try {
      // Try a simple API call to check connection
      await this.authenticate();
      
      // Reset retries on success
      if (this.connectionRetries > 0) {
        console.log('Connection to Wazuh API restored');
        this.emit('connection:restored');
      }
      this.connectionRetries = 0;
      this.lastConnectionError = null;
    } catch (error) {
      this.connectionRetries++;
      this.lastConnectionError = error.message;
      
      console.error(`Connection check failed (attempt ${this.connectionRetries}): ${error.message}`);
      
      if (this.connectionRetries === 1) {
        // First failure
        this.emit('connection:failed', error);
      } else if (this.connectionRetries > MAX_CONNECTION_RETRIES) {
        // Max retries reached
        this.emit('connection:lost', { 
          retries: this.connectionRetries,
          error: error.message 
        });
      }
    }
  }

  // Authenticate with Wazuh API
  async authenticate() {
    try {
      console.log(`Authenticating with Wazuh API at ${this.apiUrl} with username ${this.credentials.username}`);
      
      const response = await wazuhAxios.post(
        `${this.apiUrl}/security/user/authenticate`, 
        {},
        {
          auth: {
            username: this.credentials.username,
            password: this.credentials.password
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.data && response.data.data.token) {
        this.token = response.data.data.token;
        this.tokenExpiration = Date.now() + TOKEN_EXPIRATION_TIME;
        
        console.log(`Wazuh API authentication successful. Token valid until ${new Date(this.tokenExpiration).toISOString()}`);
        
        // Setup auto-renewal of token, running 1 minute before expiration
        this.setupTokenRenewal();
        
        // Emit authentication success event
        this.emit('auth:success', {
          expiresAt: this.tokenExpiration
        });
        
        return {
          success: true,
          message: 'Authentication successful',
          expiresAt: this.tokenExpiration
        };
      } else {
        console.error('Invalid authentication response:', response.data);
        const error = new Error('Invalid authentication response from Wazuh API');
        this.emit('auth:error', error);
        throw error;
      }
    } catch (error) {
      console.error('Wazuh authentication error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      // Emit authentication error event
      this.emit('auth:error', error);
      
      throw new Error(`Failed to authenticate with Wazuh API: ${error.message}`);
    }
  }

  // Set up automatic token renewal
  setupTokenRenewal() {
    // Clear any existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Set up a new interval to refresh token before it expires
    this.refreshInterval = setInterval(async () => {
      try {
        console.log('Renewing Wazuh API token...');
        await this.authenticate();
        console.log('Wazuh API token renewed successfully');
      } catch (error) {
        console.error('Failed to renew Wazuh API token:', error.message);
        
        // Emit token renewal failure event
        this.emit('token:renewal:failed', error);
        
        // Try to check connection
        this.checkConnection();
      }
    }, TOKEN_EXPIRATION_TIME - 60000); // Renew 1 minute before expiration
  }

  // Get the current token or authenticate if needed
  async getToken() {
    if (!this.token || !this.tokenExpiration || Date.now() >= this.tokenExpiration) {
      await this.authenticate();
    }
    return this.token;
  }

  // Clean up resources
  dispose() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  // Get connection status
  getStatus() {
    if (!this.token) {
      return { 
        connected: false, 
        reason: 'No token available',
        connectionRetries: this.connectionRetries,
        lastError: this.lastConnectionError
      };
    }
    
    if (Date.now() >= this.tokenExpiration) {
      return { 
        connected: false, 
        reason: 'Token expired', 
        expiresAt: this.tokenExpiration,
        connectionRetries: this.connectionRetries,
        lastError: this.lastConnectionError
      };
    }
    
    return { 
      connected: true, 
      expiresAt: this.tokenExpiration,
      timeLeft: Math.floor((this.tokenExpiration - Date.now()) / 1000) + ' seconds',
      connectionRetries: this.connectionRetries,
      apiUrl: this.apiUrl
    };
  }
}

// Wazuh service class for API operations
class WazuhService extends EventEmitter {
  constructor() {
    super();
    this.tokenManager = new WazuhTokenManager();
    this.reportPath = path.join(__dirname, 'data', 'reports');
    
    // Forward token manager events
    this.tokenManager.on('auth:success', (data) => {
      this.emit('auth:success', data);
    });
    
    this.tokenManager.on('auth:error', (error) => {
      this.emit('auth:error', error);
    });
    
    this.tokenManager.on('token:renewal:failed', (error) => {
      this.emit('token:renewal:failed', error);
    });
    
    this.tokenManager.on('connection:failed', (error) => {
      this.emit('connection:failed', error);
    });
    
    this.tokenManager.on('connection:lost', (data) => {
      this.emit('connection:lost', data);
    });
    
    this.tokenManager.on('connection:restored', () => {
      this.emit('connection:restored');
    });
    
    // Initialize the service
    this.initialize();
  }
  
  // Initialize the service
  async initialize() {
    try {
      // Ensure report directory exists
      await fs.mkdir(this.reportPath, { recursive: true });
      console.log('WazuhService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WazuhService:', error.message);
    }
  }

  // Configure the Wazuh API connection
  async configure(apiUrl, username, password) {
    try {
      const result = await this.tokenManager.configure(apiUrl, username, password);
      
      // Save configuration for later recovery
      await this.saveConfiguration(apiUrl, username, password);
      
      return result;
    } catch (error) {
      console.error('Failed to configure Wazuh service:', error.message);
      throw error;
    }
  }
  
  // Save configuration to disk for potential recovery
  async saveConfiguration(apiUrl, username, password) {
    try {
      const configPath = path.join(__dirname, 'data', 'wazuh_config.json');
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      
      // Save config (in production, encrypt the password)
      const config = {
        apiUrl,
        username,
        password: Buffer.from(password).toString('base64'), // Simple obfuscation, not secure
        timestamp: new Date().toISOString()
      };
      
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Failed to save Wazuh configuration:', error.message);
    }
  }
  
  // Try to restore configuration from disk
  async tryRestoreConfiguration() {
    try {
      const configPath = path.join(__dirname, 'data', 'wazuh_config.json');
      const data = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(data);
      
      if (config.apiUrl && config.username && config.password) {
        console.log('Restoring Wazuh API configuration');
        
        // Decode password
        const password = Buffer.from(config.password, 'base64').toString();
        
        // Configure connection
        return await this.configure(config.apiUrl, config.username, password);
      }
    } catch (error) {
      // File might not exist, or config might be invalid
      console.error('Failed to restore Wazuh configuration:', error.message);
      return null;
    }
  }

  // Get connection status
  getStatus() {
    return this.tokenManager.getStatus();
  }

  // Check if connected
  get isConnected() {
    const status = this.tokenManager.getStatus();
    return status.connected;
  }

  // Get the current token (undefined if not authenticated)
  get token() {
    return this.tokenManager.token;
  }

  // Make an authenticated request to Wazuh API with retry logic
  async request(method, endpoint, data = null, retryCount = 0) {
    try {
      const token = await this.tokenManager.getToken();
      
      const config = {
        method,
        url: `${this.tokenManager.apiUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      if (data && (method.toLowerCase() === 'post' || method.toLowerCase() === 'put')) {
        config.data = data;
      }

      const response = await wazuhAxios(config);
      return response.data;
    } catch (error) {
      console.error(`Wazuh API request error (${endpoint}):`, error.message);
      
      // Check if it's an authentication error or token expired
      if (error.response && error.response.status === 401 && retryCount < 2) {
        console.log('Token might be expired, trying to re-authenticate...');
        await this.tokenManager.authenticate();
        return this.request(method, endpoint, data, retryCount + 1);
      }
      
      // Check for server connection issues
      if (!error.response && retryCount < 2) {
        console.log('Connection issue, retrying after delay...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.request(method, endpoint, data, retryCount + 1);
      }
      
      throw new Error(`Failed to make request to Wazuh API: ${error.message}`);
    }
  }

  // Format agent ID consistently
  formatAgentId(agentId) {
    // Ensure the agent ID is formatted correctly for Wazuh API
    // Wazuh agent IDs are often padded with leading zeros (e.g., "001", "002")
    return agentId.toString().padStart(3, '0');
  }

  // Get a list of all agents with detailed information with pagination and filtering
  async getAgents(limit = 20, offset = 0, filters = {}) {
    try {
      console.log(`Requesting list of agents (limit: ${limit}, offset: ${offset})`);
      
      // Build query parameters
      let queryParams = `limit=${limit}&offset=${offset}`;
      
      // Add filters if provided
      if (filters.status) {
        queryParams += `&status=${filters.status}`;
      }
      
      if (filters.q) {
        queryParams += `&q=${encodeURIComponent(filters.q)}`;
      }
      
      return await this.request('get', `/agents?${queryParams}`);
    } catch (error) {
      console.error(`Error fetching agents list: ${error.message}`);
      throw error;
    }
  }

  // Get agent summary statistics
  async getAgentsSummary() {
    console.log('Requesting agents summary statistics');
    return this.request('get', '/agents/summary/status');
  }

  // Get hardware information for an agent
  async getAgentHardware(agentId) {
    const formattedAgentId = this.formatAgentId(agentId);
    console.log(`Requesting hardware info for agent ID: ${formattedAgentId}`);
    return this.request('get', `/syscollector/${formattedAgentId}/hardware`);
  }

  // Get network information for an agent
  async getAgentNetwork(agentId) {
    const formattedAgentId = this.formatAgentId(agentId);
    console.log(`Requesting network info for agent ID: ${formattedAgentId}`);
    return this.request('get', `/syscollector/${formattedAgentId}/networks`);
  }

  // Get OS information for an agent
  async getAgentOS(agentId) {
    const formattedAgentId = this.formatAgentId(agentId);
    console.log(`Requesting OS info for agent ID: ${formattedAgentId}`);
    return this.request('get', `/syscollector/${formattedAgentId}/os`);
  }

  // Get network addresses for an agent
  async getAgentNetaddr(agentId) {
    const formattedAgentId = this.formatAgentId(agentId);
    console.log(`Requesting network addresses for agent ID: ${formattedAgentId}`);
    return this.request('get', `/syscollector/${formattedAgentId}/netaddr`);
  }

  // Get ports information for an agent
  async getAgentPorts(agentId) {
    const formattedAgentId = this.formatAgentId(agentId);
    console.log(`Requesting ports info for agent ID: ${formattedAgentId}`);
    return this.request('get', `/syscollector/${formattedAgentId}/ports`);
  }

  // Get packages information for an agent
  async getAgentPackages(agentId, limit = 10) {
    const formattedAgentId = this.formatAgentId(agentId);
    console.log(`Requesting packages info for agent ID: ${formattedAgentId} (limit: ${limit})`);
    return this.request('get', `/syscollector/${formattedAgentId}/packages?limit=${limit}`);
  }

  // Get processes information for an agent
  async getAgentProcesses(agentId, limit = 10) {
    const formattedAgentId = this.formatAgentId(agentId);
    console.log(`Requesting processes info for agent ID: ${formattedAgentId} (limit: ${limit})`);
    return this.request('get', `/syscollector/${formattedAgentId}/processes?limit=${limit}`);
  }

  // Get SCA (Security Configuration Assessment) results for an agent
  async getAgentSCA(agentId) {
    const formattedAgentId = this.formatAgentId(agentId);
    console.log(`Requesting SCA info for agent ID: ${formattedAgentId}`);
    return this.request('get', `/sca/${formattedAgentId}`);
  }

  // Get SCA results for a specific policy
  async getAgentSCAResults(agentId, policyId) {
    const formattedAgentId = this.formatAgentId(agentId);
    console.log(`Requesting SCA results for agent ID: ${formattedAgentId}, policy ID: ${policyId}`);
    return this.request('get', `/sca/${formattedAgentId}/results/${policyId}`);
  }

  // Get Wazuh rules for compliance frameworks
  async getComplianceRules(framework) {
    // Use search filters to get rules for specific compliance frameworks
    // Examples of frameworks: pci_dss, gdpr, hipaa, nist_800_53
    const query = framework ? `?q=rule.groups~${framework}` : '';
    return this.request('get', `/rules${query}`);
  }

  // Save scan results to a report file
  async saveScanReport(agentId, type, data) {
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
  
  // Get list of reports for an agent
  async getAgentReports(agentId) {
    try {
      const reportDir = path.join(this.reportPath, agentId);
      
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
      const reports = files.map(filename => {
        const match = filename.match(/^(.+)_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}.\d{3}Z).json$/);
        if (match) {
          const [, type, timestamp] = match;
          return {
            reportId: `${agentId}_${type}_${timestamp}`,
            type,
            timestamp: timestamp.replace(/-/g, ':'),
            filename,
            path: path.join(reportDir, filename)
          };
        }
        return null;
      }).filter(Boolean);
      
      // Sort by timestamp (newest first)
      reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return { reports };
    } catch (error) {
      console.error(`Error listing reports for agent ${agentId}:`, error.message);
      throw error;
    }
  }
  
  // Get a specific report
  async getReport(agentId, reportId) {
    try {
      const reports = await this.getAgentReports(agentId);
      const report = reports.reports.find(r => r.reportId === reportId);
      
      if (!report) {
        throw new Error(`Report not found: ${reportId}`);
      }
      
      // Read the report file
      const data = await fs.readFile(report.path, 'utf8');
      
      return {
        metadata: report,
        data: JSON.parse(data)
      };
    } catch (error) {
      console.error(`Error fetching report ${reportId}:`, error.message);
      throw error;
    }
  }
  
  // Run a health check on the Wazuh API
  async runHealthCheck() {
    try {
      // Test authentication
      await this.tokenManager.authenticate();
      
      // Try basic API operations
      const [clusterStatus, managerInfo, agentsSummary] = await Promise.all([
        this.request('get', '/cluster/status').catch(e => ({ error: e.message })),
        this.request('get', '/manager/info').catch(e => ({ error: e.message })),
        this.request('get', '/agents/summary/status').catch(e => ({ error: e.message }))
      ]);
      
      // Check API response content
      const healthy = !clusterStatus.error && !managerInfo.error && !agentsSummary.error;
      
      return {
        healthy,
        timestamp: new Date().toISOString(),
        api: {
          url: this.tokenManager.apiUrl,
          connected: this.isConnected,
          tokenStatus: this.tokenManager.getStatus()
        },
        checks: {
          authentication: !this.tokenManager.getStatus().error,
          clusterStatus: !clusterStatus.error,
          managerInfo: !managerInfo.error,
          agentsSummary: !agentsSummary.error
        },
        details: {
          clusterStatus,
          managerInfo,
          agentsSummary
        }
      };
    } catch (error) {
      return {
        healthy: false,
        timestamp: new Date().toISOString(),
        error: error.message,
        api: {
          url: this.tokenManager.apiUrl,
          connected: false
        }
      };
    }
  }

  // Trigger a SCA scan (if the API allows)
  async triggerSCAScan(agentId) {
    // Note: Wazuh API might not have a direct endpoint for this
    // This is a placeholder - actual implementation depends on Wazuh's capabilities
    try {
      // In a real implementation, you might need to use Wazuh's API or other means
      return {
        success: true,
        message: `SCA scan requested for agent ${agentId}`
      };
    } catch (error) {
      console.error('Error triggering SCA scan:', error);
      throw new Error(`Failed to trigger SCA scan: ${error.message}`);
    }
  }

  // Clean up resources
  dispose() {
    this.tokenManager.dispose();
  }
}

// Create and export a singleton instance
const wazuhService = new WazuhService();

module.exports = {
  wazuhService,
  WazuhService
};