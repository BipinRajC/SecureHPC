const express = require('express');
const cors = require('cors');
const { runLynisScan, parseLynisReport, getLynisReportStatus } = require('./lynisService');
const { wazuhService } = require('./wazuhService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok', 
    message: 'Server is up and running',
    time: new Date().toISOString(),
    services: {
      wazuh: wazuhService.isConnected ? 'connected' : 'not connected'
    },
    env: {
      node: process.version,
      port: PORT
    }
  });
});

// Lynis endpoints
app.post('/api/tools/lynis/run', async (req, res) => {
  try {
    // Start the Lynis scan in the background
    runLynisScan()
      .then(() => {
        console.log('Lynis scan completed successfully');
      })
      .catch((error) => {
        console.error('Lynis scan failed:', error);
      });
    
    // Immediately return a response that the scan has started
    res.json({ 
      status: 'ok', 
      message: 'Lynis scan has been started in the background',
      job_id: `lynis-${Date.now()}`  // Generate a simple job ID for tracking
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/api/tools/lynis/report', async (req, res) => {
  try {
    const report = await parseLynisReport();
    res.json({ status: 'ok', data: report });
  } catch (error) {
    res.status(404).json({ status: 'error', message: error.message || 'No report available' });
  }
});

app.get('/api/tools/lynis/status', async (req, res) => {
  try {
    const status = await getLynisReportStatus();
    res.json({ status: 'ok', data: status });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Wazuh endpoints
app.post('/api/tools/wazuh/configure', async (req, res) => {
  try {
    const { apiUrl, username, password } = req.body;
    
    console.log(`Attempting to connect to Wazuh API at ${apiUrl} with username: ${username}`);
    
    if (!apiUrl || !username || !password) {
      console.error('Missing required Wazuh API parameters');
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameters: apiUrl, username, password'
      });
    }
    
    const result = await wazuhService.configure(apiUrl, username, password);
    console.log('Wazuh API authentication successful');
    
    res.json({
      status: 'ok',
      message: 'Wazuh API configured successfully',
      data: result
    });
  } catch (error) {
    console.error('Wazuh API authentication error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/api/tools/wazuh/agents', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const agents = await wazuhService.getAgents(limit, offset);
    res.json({
      status: 'ok',
      data: agents
    });
  } catch (error) {
    console.error(`Error fetching agents: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/api/tools/wazuh/agents/:agentId/hardware', async (req, res) => {
  try {
    const { agentId } = req.params;
    const hardware = await wazuhService.getAgentHardware(agentId);
    res.json({
      status: 'ok',
      data: hardware
    });
  } catch (error) {
    console.error(`Error fetching hardware for agent ${req.params.agentId}: ${error.message}`);
    res.status(error.message.includes('404') ? 404 : 500).json({
      status: 'error',
      message: error.message,
      agentId: req.params.agentId
    });
  }
});

app.get('/api/tools/wazuh/agents/:agentId/os', async (req, res) => {
  try {
    const { agentId } = req.params;
    const os = await wazuhService.getAgentOS(agentId);
    res.json({
      status: 'ok',
      data: os
    });
  } catch (error) {
    console.error(`Error fetching OS info for agent ${req.params.agentId}: ${error.message}`);
    res.status(error.message.includes('404') ? 404 : 500).json({
      status: 'error',
      message: error.message,
      agentId: req.params.agentId
    });
  }
});

app.get('/api/tools/wazuh/agents/:agentId/network', async (req, res) => {
  try {
    const { agentId } = req.params;
    const network = await wazuhService.getAgentNetwork(agentId);
    res.json({
      status: 'ok',
      data: network
    });
  } catch (error) {
    console.error(`Error fetching network info for agent ${req.params.agentId}: ${error.message}`);
    res.status(error.message.includes('404') ? 404 : 500).json({
      status: 'error',
      message: error.message,
      agentId: req.params.agentId
    });
  }
});

app.get('/api/tools/wazuh/agents/:agentId/netaddr', async (req, res) => {
  try {
    const { agentId } = req.params;
    const netaddr = await wazuhService.getAgentNetaddr(agentId);
    res.json({
      status: 'ok',
      data: netaddr
    });
  } catch (error) {
    console.error(`Error fetching network addresses for agent ${req.params.agentId}: ${error.message}`);
    res.status(error.message.includes('404') ? 404 : 500).json({
      status: 'error',
      message: error.message,
      agentId: req.params.agentId
    });
  }
});

app.get('/api/tools/wazuh/agents/:agentId/ports', async (req, res) => {
  try {
    const { agentId } = req.params;
    const ports = await wazuhService.getAgentPorts(agentId);
    res.json({
      status: 'ok',
      data: ports
    });
  } catch (error) {
    console.error(`Error fetching ports for agent ${req.params.agentId}: ${error.message}`);
    res.status(error.message.includes('404') ? 404 : 500).json({
      status: 'error',
      message: error.message,
      agentId: req.params.agentId
    });
  }
});

app.get('/api/tools/wazuh/agents/:agentId/packages', async (req, res) => {
  try {
    const { agentId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const packages = await wazuhService.getAgentPackages(agentId, limit);
    res.json({
      status: 'ok',
      data: packages
    });
  } catch (error) {
    console.error(`Error fetching packages for agent ${req.params.agentId}: ${error.message}`);
    res.status(error.message.includes('404') ? 404 : 500).json({
      status: 'error',
      message: error.message,
      agentId: req.params.agentId
    });
  }
});

app.get('/api/tools/wazuh/agents/:agentId/processes', async (req, res) => {
  try {
    const { agentId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const processes = await wazuhService.getAgentProcesses(agentId, limit);
    res.json({
      status: 'ok',
      data: processes
    });
  } catch (error) {
    console.error(`Error fetching processes for agent ${req.params.agentId}: ${error.message}`);
    res.status(error.message.includes('404') ? 404 : 500).json({
      status: 'error',
      message: error.message,
      agentId: req.params.agentId
    });
  }
});

app.get('/api/tools/wazuh/agents/:agentId/sca', async (req, res) => {
  try {
    const { agentId } = req.params;
    const sca = await wazuhService.getAgentSCA(agentId);
    res.json({
      status: 'ok',
      data: sca
    });
  } catch (error) {
    console.error(`Error fetching SCA results for agent ${req.params.agentId}: ${error.message}`);
    res.status(error.message.includes('404') ? 404 : 500).json({
      status: 'error',
      message: error.message,
      agentId: req.params.agentId
    });
  }
});

app.get('/api/tools/wazuh/agents/:agentId/sca/:policyId', async (req, res) => {
  try {
    const { agentId, policyId } = req.params;
    const scaResults = await wazuhService.getAgentSCAResults(agentId, policyId);
    res.json({
      status: 'ok',
      data: scaResults
    });
  } catch (error) {
    console.error(`Error fetching SCA policy results for agent ${req.params.agentId}, policy ${req.params.policyId}: ${error.message}`);
    res.status(error.message.includes('404') ? 404 : 500).json({
      status: 'error',
      message: error.message,
      agentId: req.params.agentId,
      policyId: req.params.policyId
    });
  }
});

app.get('/api/tools/wazuh/agents/:agentId/sca/:policyId/checks', async (req, res) => {
  try {
    const { agentId, policyId } = req.params;
    const scaChecks = await wazuhService.getAgentSCAChecks(agentId, policyId);
    res.json({
      status: 'ok',
      data: scaChecks
    });
  } catch (error) {
    console.error(`Error fetching detailed SCA checks for agent ${req.params.agentId}, policy ${req.params.policyId}: ${error.message}`);
    res.status(error.message.includes('404') ? 404 : 500).json({
      status: 'error',
      message: error.message,
      agentId: req.params.agentId,
      policyId: req.params.policyId
    });
  }
});

app.get('/api/tools/wazuh/compliance/:framework', async (req, res) => {
  try {
    const { framework } = req.params;
    const rules = await wazuhService.getComplianceRules(framework);
    res.json({
      status: 'ok',
      data: rules
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Wazuh status endpoint
app.get('/api/tools/wazuh/status', (req, res) => {
  try {
    const status = wazuhService.getStatus();
    res.json({
      status: 'ok',
      data: status
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/api/tools/wazuh/agents/:agentId/netiface', async (req, res) => {
  try {
    const { agentId } = req.params;
    const netiface = await wazuhService.getAgentNetiface(agentId);
    res.json({
      status: 'ok',
      data: netiface
    });
  } catch (error) {
    console.error(`Error fetching netiface for agent ${req.params.agentId}: ${error.message}`);
    res.status(error.message.includes('404') ? 404 : 500).json({
      status: 'error',
      message: error.message,
      agentId: req.params.agentId
    });
  }
});

app.get('/api/tools/wazuh/agents/:agentId/netproto', async (req, res) => {
  try {
    const { agentId } = req.params;
    const netproto = await wazuhService.getAgentNetproto(agentId);
    res.json({
      status: 'ok',
      data: netproto
    });
  } catch (error) {
    console.error(`Error fetching netproto for agent ${req.params.agentId}: ${error.message}`);
    res.status(error.message.includes('404') ? 404 : 500).json({
      status: 'error',
      message: error.message,
      agentId: req.params.agentId
    });
  }
});

app.get('/api/tools/wazuh/agents/:agentId/syscheck', async (req, res) => {
  try {
    const { agentId } = req.params;
    const syscheck = await wazuhService.getAgentSyscheck(agentId);
    res.json({
      status: 'ok',
      data: syscheck
    });
  } catch (error) {
    console.error(`Error fetching syscheck for agent ${req.params.agentId}: ${error.message}`);
    res.status(error.message.includes('404') ? 404 : 500).json({
      status: 'error',
      message: error.message,
      agentId: req.params.agentId
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 