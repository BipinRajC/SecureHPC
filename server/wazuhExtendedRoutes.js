/**
 * Wazuh Extended Routes
 * 
 * This file contains API endpoints for the enhanced Wazuh service features,
 * including MCP integration and extended reporting capabilities.
 */

const express = require('express');
const { wazuhServiceExtended } = require('./wazuhServiceExtended');
const { wazuhMcpIntegration, ReportFormat, ReportType } = require('./wazuhMcpIntegration');

// Create a router
const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await wazuhMcpIntegration.checkHealth();
    
    res.json({
      status: 'ok',
      data: health
    });
  } catch (error) {
    console.error('Error checking Wazuh health:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get enhanced agent information
router.get('/agents', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const agents = await wazuhServiceExtended.getEnhancedAgents(limit, offset);
    
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

// Get detailed agent profile
router.get('/agents/:agentId/profile', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    const profile = await wazuhServiceExtended.getAgentProfile(agentId);
    
    res.json({
      status: 'ok',
      data: profile
    });
  } catch (error) {
    console.error(`Error fetching agent profile for ${req.params.agentId}:`, error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get agent reports
router.get('/agents/:agentId/reports', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    const reports = await wazuhServiceExtended.getAgentReports(agentId);
    
    res.json({
      status: 'ok',
      data: reports
    });
  } catch (error) {
    console.error(`Error fetching reports for agent ${req.params.agentId}:`, error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get a specific report
router.get('/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await wazuhServiceExtended.getReport(reportId);
    
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

// Schedule a scan via MCP
router.post('/scan', async (req, res) => {
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

// Schedule full inventory via MCP
router.post('/inventory', async (req, res) => {
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

// Generate a report
router.post('/reports/generate', async (req, res) => {
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

// List available reports
router.get('/reports', async (req, res) => {
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

// Delete a report
router.delete('/reports/:reportId', async (req, res) => {
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

module.exports = router; 