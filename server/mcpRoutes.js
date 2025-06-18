/**
 * MCP Routes
 * 
 * This file contains API endpoints for the MCP (Management Control Plane) service.
 */

const express = require('express');
const { mcpService, JobType } = require('./mcpService');

// Create a router
const router = express.Router();

// Get MCP status
router.get('/status', (req, res) => {
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

// Get all jobs
router.get('/jobs', (req, res) => {
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

// Get a specific job
router.get('/jobs/:jobId', (req, res) => {
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

// Cancel a job
router.post('/jobs/:jobId/cancel', (req, res) => {
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

// Cleanup old jobs
router.post('/cleanup', async (req, res) => {
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

module.exports = router; 