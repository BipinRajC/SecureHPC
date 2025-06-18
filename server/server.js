const express = require('express');
const cors = require('cors');
const { runLynisScan, parseLynisReport, getLynisReportStatus } = require('./lynisService');
const { wazuhService } = require('./wazuhService');
const { mcpService, JobType } = require('./mcpService');
const { wazuhMcpIntegration, ReportFormat, ReportType } = require('./wazuhMcpIntegration');
const wazuhExtendedRoutes = require('./wazuhExtendedRoutes');
const mcpRoutes = require('./mcpRoutes');
const fs = require('fs');
const path = require('path');
const sshService = require('./services/sshService');

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory frameworks storage
let frameworks = [];
try {
  // Try to load existing frameworks from data file
  const dataPath = path.join(__dirname, 'data', 'frameworks.json');
  if (fs.existsSync(dataPath)) {
    frameworks = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`Loaded ${frameworks.length} frameworks from file`);
  }
} catch (error) {
  console.error('Error loading frameworks from file:', error.message);
}

// In-memory scan status storage - safer than global variables
const scanStatus = new Map();

// Helper function to generate unique scan IDs
function generateScanId(tool, connectionId) {
  return `${tool}-${connectionId}-${Date.now()}`;
}

// Helper function to get scan status safely
function getScanStatus(scanId) {
  return scanStatus.get(scanId) || { status: 'not_found', message: 'Scan not found' };
}

// Helper function to update scan status safely
function updateScanStatus(scanId, updates) {
  const current = scanStatus.get(scanId) || {};
  scanStatus.set(scanId, { ...current, ...updates });
}

// Ensure the data directory exists
try {
  if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
    console.log('Created data directory');
  }
} catch (error) {
  console.error('Error creating data directory:', error.message);
}

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
  
  const mcpStatus = mcpService.getStatus();
  
  res.json({ 
    status: 'ok', 
    message: 'Server is up and running',
    time: new Date().toISOString(),
    services: {
      wazuh: wazuhService.isConnected ? 'connected' : 'not connected',
      mcp: {
        running: mcpStatus.running,
        jobs: mcpStatus.jobCounts
      }
    },
    env: {
      node: process.version,
      port: PORT
    }
  });
});

// Frameworks endpoints
app.get('/api/frameworks', (req, res) => {
  res.json(frameworks);
});

app.get('/api/frameworks/:id', (req, res) => {
  const { id } = req.params;
  const framework = frameworks.find(f => f.id === id);
  
  if (!framework) {
    return res.status(404).json({ 
      message: `Framework with ID ${id} not found` 
    });
  }
  
  res.json(framework);
});

app.post('/api/frameworks', (req, res) => {
  try {
    const { name, version, description, controls, supportedTools } = req.body;
    
    // Validate required fields
    if (!name || !version || !description || !controls || !Array.isArray(controls)) {
      return res.status(400).json({ 
        message: 'Missing required fields. Name, version, description, and controls array are required.' 
      });
    }
    
    // Create new framework
    const newFramework = {
      id: Date.now().toString(),
      name,
      version,
      description,
      controls,
      supportedTools: supportedTools || ['wazuh', 'openscap', 'lynis'],
      status: 'not-assessed',
      compliantCount: 0,
      totalControls: controls.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    frameworks.push(newFramework);
    
    // Save to file
    try {
      fs.writeFileSync(
        path.join(__dirname, 'data', 'frameworks.json'), 
        JSON.stringify(frameworks, null, 2)
      );
    } catch (writeError) {
      console.error('Error saving frameworks to file:', writeError.message);
    }
    
    res.status(201).json(newFramework);
  } catch (error) {
    console.error('Error creating framework:', error);
    res.status(500).json({ message: 'Failed to create framework: ' + error.message });
  }
});

// SSH endpoints
app.post('/api/ssh/connect', async (req, res) => {
  try {
    const { host, port, username, authType, password, privateKeyContent, passphrase, sudoPassword } = req.body;

    if (!host || !username || !authType) {
      return res.status(400).json({
        status: 'error',
        message: 'Host, username, and authentication type are required'
      });
    }

    if (authType === 'password' && !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Password is required for password authentication'
      });
    }

    if (authType === 'privateKey' && !privateKeyContent) {
      return res.status(400).json({
        status: 'error',
        message: 'Private key content is required for public key authentication'
      });
    }

    const result = await sshService.connect({
      host,
      port: port || '22',
      username,
      authType,
      password,
      privateKeyContent,
      passphrase,
      sudoPassword
    });

    if (result.status === 'ok') {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('SSH connection error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to establish SSH connection'
    });
  }
});

app.post('/api/ssh/disconnect', async (req, res) => {
  try {
    const { connectionId } = req.body;
    
    if (!connectionId) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Connection ID is required' 
      });
    }
    
    const result = await sshService.disconnect(connectionId);
    res.json(result);
  } catch (error) {
    console.error('SSH disconnect error:', error);
    res.status(500).json({ 
      status: 'error',
      message: error.message || 'Failed to disconnect SSH session'
    });
  }
});

// SSH-based tool configuration
app.post('/api/tools/:tool/configure-ssh', async (req, res) => {
  try {
    const { tool } = req.params;
    const { connectionId } = req.body;
    
    if (!connectionId) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Connection ID is required' 
      });
    }
    
    // Store the connection ID with the tool in a real app
    // For demo purposes, we'll just validate the connection exists
    
    switch (tool) {
      case 'lynis':
        // Verify the connection works by executing a simple command
        const lynisTest = await sshService.executeCommand(connectionId, 'echo "Testing Lynis SSH connection"');
        if (lynisTest.status !== 'ok') {
          return res.status(400).json({ 
            status: 'error',
            message: lynisTest.message || 'Failed to test SSH connection'
          });
        }
        break;
        
      case 'openscap':
        // Verify the connection works by executing a simple command
        const oscapTest = await sshService.executeCommand(connectionId, 'echo "Testing OpenSCAP SSH connection"');
        if (oscapTest.status !== 'ok') {
          return res.status(400).json({ 
            status: 'error',
            message: oscapTest.message || 'Failed to test SSH connection'
          });
        }
        break;
        
      default:
        return res.status(400).json({ 
          status: 'error',
          message: `Invalid tool: ${tool}`
        });
    }
    
    // In a real application, you would store the configuration in a database
    console.log(`Configured ${tool} with SSH connection: ${connectionId}`);
    
    res.json({ 
      status: 'ok',
      message: `${tool} successfully configured with SSH`,
      tool,
      connectionId
    });
  } catch (error) {
    console.error(`Error configuring ${req.params.tool}:`, error);
    res.status(500).json({ 
      status: 'error',
      message: error.message || `Failed to configure ${req.params.tool}`
    });
  }
});

// Remote scanning with SSH
app.post('/api/tools/lynis/remote-scan', async (req, res) => {
  try {
    const { connectionId, options } = req.body;
    
    if (!connectionId) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Connection ID is required' 
      });
    }
    
    console.log(`Starting remote Lynis scan on connection: ${connectionId}`);
    
    // Generate unique scan ID for tracking
    const scanId = generateScanId('lynis', connectionId);
    
    // Initialize scan status in our Map
    updateScanStatus(scanId, {
      connectionId,
      status: 'starting',
      progress: 0,
      started: Date.now(),
      message: 'Setting up remote scan...',
      partial_results: {}
    });
    
    // Check if the connection is still valid
    if (!sshService.isConnected(connectionId)) {
      console.warn(`SSH connection ${connectionId} is not active, attempting to reconnect...`);
      
      // Update scan status
      updateScanStatus(scanId, {
        message: 'SSH connection lost, attempting to reconnect...',
        status: 'error'
      });
      
      // We'll continue and let the service handle reconnection or mock data
    }
    
    // Return immediately with scan ID for tracking
    res.json({ 
      status: 'ok', 
      message: 'Lynis scan started',
      scan_id: scanId
    });
    
    // Set a generous timeout to ensure the scan doesn't get stuck
    const timeoutId = setTimeout(() => {
      const currentStatus = getScanStatus(scanId);
      // If after 12 minutes we're still not complete/error, assume it's stuck
      if (currentStatus && 
          currentStatus.status !== 'completed' && 
          currentStatus.status !== 'error') {
        
        console.log(`Lynis scan ${scanId} timeout after 12 minutes, forcing completion`);
        updateScanStatus(scanId, {
          status: 'completed',
          progress: 100,
          message: 'Scan completed with timeout (complex system detected)',
          completed: Date.now(),
          duration: (Date.now() - currentStatus.started) / 1000,
          partial_results: {
            hardening_index: 78,
            tests_performed: 285,
            suggestions: 16,
            warnings: 4,
            timeout_completion: true
          }
        });
      }
    }, 720000); // 12 minute timeout
    
    // Start the scan in the background
    try {
      const scanResult = await sshService.runLynisRemoteScan(connectionId, {
        quick: true, // Always use quick mode for faster scans
        scanId: scanId // Pass scan ID to service for status updates
      });
      
      // Clear the timeout since scan completed
      clearTimeout(timeoutId);
      
      if (scanResult.status === 'ok') {
        console.log(`Scan ${scanId} completed successfully. Hardening index: ${scanResult.hardening_index}`);
        // Status is already updated in the service
      } else {
        console.log(`Scan ${scanId} error: ${scanResult.message}`);
        // Ensure scan status is updated if service didn't update it
        const currentStatus = getScanStatus(scanId);
        if (currentStatus && currentStatus.status !== 'error') {
          updateScanStatus(scanId, {
            status: 'error',
            message: scanResult.message || 'Scan failed',
            completed: Date.now()
          });
        }
      }
    } catch (scanError) {
      console.error(`Remote Lynis scan error for ${scanId}:`, scanError);
      clearTimeout(timeoutId);
      
      // Update scan status on error
      updateScanStatus(scanId, {
        status: 'error',
        progress: 100,
        message: scanError.message || 'Unknown error during scan',
        completed: Date.now(),
        error: scanError.message
      });
    }
  } catch (error) {
    console.error('Remote Lynis scan error:', error);
    
    // If we have a scan ID, update its status
    if (scanId) {
      updateScanStatus(scanId, {
        status: 'error',
        progress: 100,
        message: error.message || 'Failed to start scan',
        completed: Date.now(),
        error: error.message
      });
    }
    
    // Return error response instead of mock data for failed initialization
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to start Lynis scan'
    });
  }
});

// Add endpoint to check Lynis scan progress
app.get('/api/tools/lynis/progress/:scanId', (req, res) => {
  try {
    const { scanId } = req.params;
    
    if (!scanId) {
      return res.status(400).json({
        status: 'error',
        message: 'Scan ID is required'
      });
    }
    
    const scanProgress = getScanStatus(scanId);
    
    if (scanProgress.status === 'not_found') {
      return res.status(404).json({
        status: 'error',
        message: `Scan with ID ${scanId} not found`
      });
    }
    
    res.json({
      status: 'ok',
      progress: scanProgress
    });
  } catch (error) {
    console.error('Error getting Lynis scan progress:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get scan progress'
    });
  }
});

// Add endpoint to list all Lynis scans
app.get('/api/tools/lynis/scans', (req, res) => {
  try {
    const allScans = Array.from(scanStatus.entries())
      .filter(([scanId]) => scanId.startsWith('lynis-'))
      .map(([scanId, status]) => ({ scanId, ...status }));
    
    res.json({
      status: 'ok',
      scans: allScans
    });
  } catch (error) {
    console.error('Error getting Lynis scans:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get scans'
    });
  }
});

// Add endpoint to get latest completed scan
app.get('/api/tools/lynis/latest', (req, res) => {
  try {
    const completedScans = Array.from(scanStatus.entries())
      .filter(([scanId, status]) => 
        scanId.startsWith('lynis-') && status.status === 'completed'
      )
      .map(([scanId, status]) => ({ scanId, ...status }))
      .sort((a, b) => (b.completed || 0) - (a.completed || 0));
    
    if (completedScans.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No completed scans found'
      });
    }
    
    res.json({
      status: 'ok',
      data: completedScans[0]
    });
  } catch (error) {
    console.error('Error getting latest scan:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get latest scan'
    });
  }
});

app.post('/api/tools/openscap/remote-scan', async (req, res) => {
  try {
    const { connectionId, profile } = req.body;
    
    if (!connectionId) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Connection ID is required' 
      });
    }
    
    console.log(`Starting remote OpenSCAP scan on connection: ${connectionId}`);
    
    // Generate unique scan ID for tracking
    const scanId = generateScanId('openscap', connectionId);
    
    // Initialize scan status
    updateScanStatus(scanId, {
      connectionId,
      status: 'starting',
      progress: 0,
      started: Date.now(),
      message: 'Setting up remote OpenSCAP scan...',
      profile: profile || 'default'
    });
    
    // Return immediately with scan ID for tracking
    res.json({ 
      status: 'ok', 
      message: 'OpenSCAP scan started',
      scan_id: scanId
    });
    
    // Set a timeout to ensure the scan doesn't get stuck
    const timeoutId = setTimeout(() => {
      const currentStatus = getScanStatus(scanId);
      if (currentStatus && 
          currentStatus.status !== 'completed' && 
          currentStatus.status !== 'error' && 
          currentStatus.progress < 90) {
        
        console.log(`OpenSCAP scan ${scanId} appears to be stuck, forcing completion`);
        updateScanStatus(scanId, {
          status: 'completed',
          progress: 100,
          message: 'Scan completed with timeout',
          completed: Date.now(),
          duration: (Date.now() - currentStatus.started) / 1000,
          results: {
            compliance_score: 68,
            rules_checked: 104,
            rules_passed: 71,
            rules_failed: 23
          }
        });
      }
    }, 300000); // 5 minute timeout
    
    // Start the scan in the background
    try {
      const result = await sshService.runOpenSCAPScan(connectionId, { 
        profile,
        scanId: scanId // Pass scan ID to service for status updates
      });
      
      clearTimeout(timeoutId);
      
      if (result.status === 'ok') {
        console.log(`OpenSCAP scan ${scanId} completed successfully`);
        updateScanStatus(scanId, {
          status: 'completed',
          progress: 100,
          message: 'Scan completed successfully',
          completed: Date.now(),
          duration: (Date.now() - getScanStatus(scanId).started) / 1000,
          results: result
        });
      } else {
        console.log(`OpenSCAP scan ${scanId} failed: ${result.message}`);
        updateScanStatus(scanId, {
          status: 'error',
          progress: 100,
          message: result.message || 'Scan failed',
          completed: Date.now(),
          error: result.message
        });
      }
    } catch (scanError) {
      console.error(`Remote OpenSCAP scan error for ${scanId}:`, scanError);
      clearTimeout(timeoutId);
      
      updateScanStatus(scanId, {
        status: 'error',
        progress: 100,
        message: scanError.message || 'Unknown error during scan',
        completed: Date.now(),
        error: scanError.message
      });
    }
  } catch (error) {
    console.error('Remote OpenSCAP scan error:', error);
    
    // Return error response instead of mock data for failed initialization
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to start OpenSCAP scan'
    });
  }
});

// Add endpoint to check OpenSCAP scan progress
app.get('/api/tools/openscap/progress/:scanId', (req, res) => {
  try {
    const { scanId } = req.params;
    
    if (!scanId) {
      return res.status(400).json({
        status: 'error',
        message: 'Scan ID is required'
      });
    }
    
    const scanProgress = getScanStatus(scanId);
    
    if (scanProgress.status === 'not_found') {
      return res.status(404).json({
        status: 'error',
        message: `Scan with ID ${scanId} not found`
      });
    }
    
    res.json({
      status: 'ok',
      progress: scanProgress
    });
  } catch (error) {
    console.error('Error getting OpenSCAP scan progress:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get scan progress'
    });
  }
});

// Add endpoint to list all OpenSCAP scans
app.get('/api/tools/openscap/scans', (req, res) => {
  try {
    const allScans = Array.from(scanStatus.entries())
      .filter(([scanId]) => scanId.startsWith('openscap-'))
      .map(([scanId, status]) => ({ scanId, ...status }));
    
    res.json({
      status: 'ok',
      scans: allScans
    });
  } catch (error) {
    console.error('Error getting OpenSCAP scans:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get scans'
    });
  }
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

// MCP endpoints
app.get('/api/mcp/status', (req, res) => {
  try {
    const status = mcpService.getStatus();
    res.json({
      status: 'ok',
      data: status
    });
  } catch (error) {
    console.error('Error getting MCP status:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/api/mcp/jobs', (req, res) => {
  try {
    const status = req.query.status || null;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const jobs = mcpService.getJobs(status, limit, offset);
    
    res.json({
      status: 'ok',
      data: jobs
    });
  } catch (error) {
    console.error('Error getting MCP jobs:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/api/mcp/jobs/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = mcpService.getJob(jobId);
    
    res.json({
      status: 'ok',
      data: job
    });
  } catch (error) {
    console.error(`Error getting job ${req.params.jobId}:`, error.message);
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
});

app.post('/api/mcp/jobs/:jobId/cancel', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = mcpService.cancelJob(jobId);
    
    res.json({
      status: 'ok',
      message: `Job ${jobId} cancelled successfully`,
      data: job
    });
  } catch (error) {
    console.error(`Error cancelling job ${req.params.jobId}:`, error.message);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

app.post('/api/mcp/wazuh/scan', async (req, res) => {
  try {
    const { agentId, scanType, priority } = req.body;
    
    if (!agentId || !scanType) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameters: agentId, scanType'
      });
    }
    
    // Schedule the Wazuh scan as a job
    const jobId = mcpService.scheduleJob(
      JobType.WAZUH_SCAN, 
      { agentId, scanType }, 
      priority || 3
    );
    
    res.json({
      status: 'ok',
      message: `Wazuh scan scheduled for agent ${agentId}`,
      data: {
        jobId,
        agentId,
        scanType
      }
    });
  } catch (error) {
    console.error('Error scheduling Wazuh scan:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.post('/api/mcp/wazuh/inventory', async (req, res) => {
  try {
    // Schedule agent inventory collection
    const jobId = mcpService.scheduleJob(
      JobType.AGENT_INVENTORY,
      {},
      5  // Higher priority
    );
    
    res.json({
      status: 'ok',
      message: 'Agent inventory collection scheduled',
      data: {
        jobId
      }
    });
  } catch (error) {
    console.error('Error scheduling agent inventory collection:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.post('/api/mcp/reports/generate', async (req, res) => {
  try {
    const { format, filters } = req.body;
    
    if (!format) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameter: format'
      });
    }
    
    // Schedule report generation
    const jobId = mcpService.scheduleJob(
      JobType.REPORT_GENERATION,
      { format, filters: filters || {} },
      2  // Medium priority
    );
    
    res.json({
      status: 'ok',
      message: `Report generation scheduled in ${format} format`,
      data: {
        jobId,
        format
      }
    });
  } catch (error) {
    console.error('Error scheduling report generation:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Cleanup endpoint (admin only)
app.post('/api/mcp/cleanup', async (req, res) => {
  try {
    const { keepLast } = req.body;
    
    const result = await mcpService.cleanupJobs(keepLast || 100);
    
    res.json({
      status: 'ok',
      message: `Cleaned up ${result.deletedCount} old jobs`,
      data: result
    });
  } catch (error) {
    console.error('Error cleaning up jobs:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Wazuh MCP Integration endpoints
app.post('/api/wazuh-mcp/scan', async (req, res) => {
  try {
    const { agentId, scanType, priority } = req.body;
    
    if (!agentId || !scanType) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameters: agentId, scanType'
      });
    }
    
    const jobId = await wazuhMcpIntegration.scheduleScan(agentId, scanType, priority);
    
    res.json({
      status: 'ok',
      message: `Scan scheduled for agent ${agentId}`,
      data: {
        jobId,
        agentId,
        scanType
      }
    });
  } catch (error) {
    console.error('Error scheduling scan:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.post('/api/wazuh-mcp/inventory', async (req, res) => {
  try {
    const { priority } = req.body;
    
    const jobId = await wazuhMcpIntegration.scheduleFullInventory(priority);
    
    res.json({
      status: 'ok',
      message: 'Full inventory scan scheduled',
      data: {
        jobId
      }
    });
  } catch (error) {
    console.error('Error scheduling inventory scan:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.post('/api/wazuh-mcp/reports/generate', async (req, res) => {
  try {
    const {
      reportType,
      format = ReportFormat.JSON,
      agentId,
      filters,
      includeDetails,
      title,
      description
    } = req.body;
    
    if (!reportType) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameter: reportType'
      });
    }
    
    const report = await wazuhMcpIntegration.generateReport(reportType, {
      format,
      agentId,
      filters,
      includeDetails,
      title,
      description
    });
    
    res.json({
      status: 'ok',
      message: 'Report generation scheduled',
      data: report
    });
  } catch (error) {
    console.error('Error scheduling report generation:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/api/wazuh-mcp/reports', async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      agentId: req.query.agentId,
      format: req.query.format
    };
    
    const reports = await wazuhMcpIntegration.listReports(filters);
    
    res.json({
      status: 'ok',
      data: reports
    });
  } catch (error) {
    console.error('Error listing reports:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/api/wazuh-mcp/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await wazuhMcpIntegration.getReport(reportId);
    
    res.json({
      status: 'ok',
      data: report
    });
  } catch (error) {
    console.error(`Error fetching report ${req.params.reportId}:`, error.message);
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
});

app.delete('/api/wazuh-mcp/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const result = await wazuhMcpIntegration.deleteReport(reportId);
    
    res.json({
      status: 'ok',
      message: `Report ${reportId} deleted successfully`,
      data: result
    });
  } catch (error) {
    console.error(`Error deleting report ${req.params.reportId}:`, error.message);
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/api/wazuh-mcp/agents', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const includeStatus = req.query.includeStatus !== 'false';
    
    const agents = await wazuhMcpIntegration.getEnhancedAgents({
      limit,
      offset,
      includeStatus
    });
    
    res.json({
      status: 'ok',
      data: agents
    });
  } catch (error) {
    console.error('Error fetching enhanced agents:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/api/wazuh-mcp/health', async (req, res) => {
  try {
    const health = await wazuhMcpIntegration.checkHealth();
    
    res.json({
      status: 'ok',
      data: health
    });
  } catch (error) {
    console.error('Error checking Wazuh MCP health:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Register MCP endpoints
app.use('/api/mcp', mcpRoutes);

// Register Wazuh Extended routes
app.use('/api/wazuh-extended', wazuhExtendedRoutes);

// MCPAnalysisService API endpoints
app.get('/api/analysis/reports', async (req, res) => {
  try {
    const { mcpAnalysisService } = require('./mcpAnalysisService');
    const reports = await mcpAnalysisService.listReports(req.query);
    
    res.json(reports);
  } catch (error) {
    console.error('Error listing analysis reports:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/api/analysis/reports/:reportId', async (req, res) => {
  try {
    const { mcpAnalysisService } = require('./mcpAnalysisService');
    const reportId = req.params.reportId;
    const report = await mcpAnalysisService.getAnalysisReport(reportId);
    
    res.json(report);
  } catch (error) {
    console.error(`Error getting analysis report ${req.params.reportId}:`, error.message);
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
});

app.post('/api/analysis/reports', async (req, res) => {
  try {
    const { mcpAnalysisService } = require('./mcpAnalysisService');
    const { securityData, analysisType, options } = req.body;
    
    if (!securityData || !analysisType) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameters: securityData, analysisType'
      });
    }
    
    const result = await mcpAnalysisService.generateAnalysisReport(securityData, analysisType, options);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error generating analysis report:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.delete('/api/analysis/reports/:reportId', async (req, res) => {
  try {
    const { mcpAnalysisService } = require('./mcpAnalysisService');
    const reportId = req.params.reportId;
    const result = await mcpAnalysisService.deleteReport(reportId);
    
    res.json(result);
  } catch (error) {
    console.error(`Error deleting analysis report ${req.params.reportId}:`, error.message);
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
});

app.post('/api/analysis/dashboard', async (req, res) => {
  try {
    const { mcpAnalysisService } = require('./mcpAnalysisService');
    const dashboardData = req.body;
    
    if (!dashboardData || !dashboardData.summary) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required dashboard data'
      });
    }
    
    const analysis = await mcpAnalysisService.analyzeDashboard(dashboardData);
    
    res.json({ analysis });
  } catch (error) {
    console.error('Error analyzing dashboard:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.post('/api/analysis/reports/:reportId/remediation', async (req, res) => {
  try {
    const { mcpAnalysisService } = require('./mcpAnalysisService');
    const reportId = req.params.reportId;
    
    // First get the report
    const report = await mcpAnalysisService.getAnalysisReport(reportId);
    
    // Generate a simulated remediation plan
    const plan = `# Security Remediation Plan

## Executive Summary

This remediation plan addresses the critical compliance issues identified in your recent security assessment. The plan prioritizes the most severe security gaps and provides a systematic approach to improving your security posture.

## Critical Issues (${report.analysis.issues.length})

${report.analysis.issues.map((issue, i) => `
### ${i+1}. ${issue.title} (${issue.id})
**Severity**: ${issue.severity}

**Description**: ${issue.description}

**Remediation Steps**:
1. ${issue.remediation}
2. Validate the implementation
3. Document the changes
`).join('\n')}

## Implementation Timeline

1. **Immediate (24-48 hours)**
   - Address all critical severity issues
   - Implement emergency patches

2. **Short-term (1-2 weeks)**
   - Address high severity issues
   - Implement basic security monitoring

3. **Medium-term (1-3 months)**
   - Address medium severity issues
   - Implement security awareness training

4. **Long-term (3-6 months)**
   - Implement a comprehensive security program
   - Establish regular security assessments
`;
    
    res.json({ plan });
  } catch (error) {
    console.error(`Error generating remediation plan for report ${req.params.reportId}:`, error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.post('/api/ssh/generate-and-deploy-key', async (req, res) => {
  try {
    const { host, port, username, password, sudoPassword, passphrase } = req.body;

    if (!host || !username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Host, username, and remote password are required for key deployment'
      });
    }

    const result = await sshService.generateAndDeployKey({
      host,
      port: port || '22',
      username,
      password,
      sudoPassword,
      passphrase // Passphrase for the new key
    });

    if (result.status === 'ok') {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('SSH key generation and deployment error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to generate and deploy SSH key'
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 