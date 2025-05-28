const axios = require('axios');
const https = require('https');

// Wazuh API constants
const TOKEN_EXPIRATION_TIME = 900000; // 15 minutes (900 seconds * 1000)
const DEFAULT_API_PORT = 55000;

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
class WazuhTokenManager {
  constructor() {
    this.token = null;
    this.tokenExpiration = null;
    this.apiUrl = null;
    this.credentials = null;
    this.refreshInterval = null;
  }

  // Configure the token manager with Wazuh API details
  configure(apiUrl, username, password) {
    // Clear any existing refresh interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash if present
    this.credentials = { username, password };
    this.token = null;
    this.tokenExpiration = null;
    
    return this.authenticate();
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
        
        return {
          success: true,
          message: 'Authentication successful',
          expiresAt: this.tokenExpiration
        };
      } else {
        console.error('Invalid authentication response:', response.data);
        throw new Error('Invalid authentication response from Wazuh API');
      }
    } catch (error) {
      console.error('Wazuh authentication error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
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
  }

  // Get connection status
  getStatus() {
    if (!this.token) {
      return { connected: false, reason: 'No token available' };
    }
    
    if (Date.now() >= this.tokenExpiration) {
      return { connected: false, reason: 'Token expired', expiresAt: this.tokenExpiration };
    }
    
    return { 
      connected: true, 
      expiresAt: this.tokenExpiration,
      timeLeft: Math.floor((this.tokenExpiration - Date.now()) / 1000) + ' seconds'
    };
  }
}

// Wazuh service class for API operations
class WazuhService {
  constructor() {
    this.tokenManager = new WazuhTokenManager();
  }

  // Configure the Wazuh API connection
  async configure(apiUrl, username, password) {
    return this.tokenManager.configure(apiUrl, username, password);
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

  // Make an authenticated request to Wazuh API
  async request(method, endpoint, data = null) {
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
      throw new Error(`Failed to make request to Wazuh API: ${error.message}`);
    }
  }

  // Format agent ID consistently
  formatAgentId(agentId) {
    // Ensure the agent ID is formatted correctly for Wazuh API
    // Wazuh agent IDs are often padded with leading zeros (e.g., "001", "002")
    return agentId.toString().padStart(3, '0');
  }

  // Get a list of all agents with detailed information
  async getAgents(limit = 20, offset = 0) {
    try {
      console.log(`Requesting list of agents (limit: ${limit}, offset: ${offset})`);
      return await this.request('get', `/agents?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error(`Error fetching agents list: ${error.message}`);
      throw error;
    }
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
  async getAgentProcesses(agentId, limit = 1000) {
    const formattedAgentId = this.formatAgentId(agentId);
    console.log(`Requesting processes info for agent ID: ${formattedAgentId} (limit: ${limit})`);
    // If limit is 0 or negative, don't add limit parameter to get all processes
    const limitParam = limit > 0 ? `?limit=${limit}` : '';
    return this.request('get', `/syscollector/${formattedAgentId}/processes${limitParam}`);
  }

  // Get SCA (Security Configuration Assessment) results for an agent
  async getAgentSCA(agentId) {
    const formattedAgentId = this.formatAgentId(agentId);
    console.log(`Requesting SCA info for agent ID: ${formattedAgentId}`);
    return this.request('get', `/sca/${formattedAgentId}`);
  }

  // Get detailed SCA checks for a specific policy
  async getAgentSCAChecks(agentId, policyId) {
    const formattedAgentId = this.formatAgentId(agentId);
    console.log(`Requesting detailed SCA checks for agent ID: ${formattedAgentId}, policy ID: ${policyId}`);
    return this.request('get', `/sca/${formattedAgentId}/checks/${policyId}`);
  }

  // Get Wazuh rules for compliance frameworks
  async getComplianceRules(framework) {
    // Use search filters to get rules for specific compliance frameworks
    // Examples of frameworks: pci_dss, gdpr, hipaa, nist_800_53
    const query = framework ? `?q=rule.groups~${framework}` : '';
    return this.request('get', `/rules${query}`);
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

  // Get network interface statistics for an agent
  async getAgentNetiface(agentId) {
    const formattedAgentId = this.formatAgentId(agentId);
    console.log(`Requesting netiface info for agent ID: ${formattedAgentId}`);
    return this.request('get', `/syscollector/${formattedAgentId}/netiface`);
  }

  // Get network protocol info for an agent
  async getAgentNetproto(agentId) {
    const formattedAgentId = this.formatAgentId(agentId);
    console.log(`Requesting netproto info for agent ID: ${formattedAgentId}`);
    return this.request('get', `/syscollector/${formattedAgentId}/netproto`);
  }

  // Get syscheck info for an agent
  async getAgentSyscheck(agentId) {
    const formattedAgentId = this.formatAgentId(agentId);
    console.log(`Requesting syscheck info for agent ID: ${formattedAgentId}`);
    return this.request('get', `/syscheck/${formattedAgentId}`);
  }

  // Get SCA results for a specific policy (correct endpoint)
  async getAgentSCAResults(agentId, policyId) {
    const formattedAgentId = this.formatAgentId(agentId);
    console.log(`Requesting SCA results for agent ID: ${formattedAgentId}, policy ID: ${policyId}`);
    return this.request('get', `/sca/${formattedAgentId}/checks/${policyId}`);
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