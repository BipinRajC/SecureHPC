/**
 * Management Control Plane (MCP) Service
 * 
 * This service implements the Model-Context-Protocol pattern to provide:
 * - Job queue management and scheduling
 * - Persistent state management
 * - Retry mechanisms and failure handling
 * - Health monitoring and reporting
 * - Scalable service architecture
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const { wazuhService } = require('./wazuhService');

// Job status enumeration
const JobStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// Job type enumeration
const JobType = {
  WAZUH_SCAN: 'wazuh_scan',
  LYNIS_SCAN: 'lynis_scan',
  AGENT_INVENTORY: 'agent_inventory',
  REPORT_GENERATION: 'report_generation',
};

class MCPService extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.queue = [];
    this.running = false;
    this.maxConcurrent = 3; // Maximum number of concurrent jobs
    this.activeJobs = 0;
    this.persistPath = path.join(__dirname, 'data', 'mcp_state.json');
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
    };
    
    // Initialize the service
    this.initialize();
  }

  async initialize() {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
      
      // Load persisted state, if available
      await this.loadState();
      
      // Start job processor
      this.startJobProcessor();
      
      console.log('MCP Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MCP Service:', error.message);
    }
  }

  async loadState() {
    try {
      const data = await fs.readFile(this.persistPath, 'utf8');
      const state = JSON.parse(data);
      
      // Restore jobs
      if (state.jobs) {
        for (const [id, job] of Object.entries(state.jobs)) {
          this.jobs.set(id, job);
        }
      }
      
      // Restore queue (for jobs that were pending)
      if (state.queue) {
        this.queue = state.queue.filter(jobId => {
          const job = this.jobs.get(jobId);
          return job && job.status === JobStatus.PENDING;
        });
      }
      
      console.log(`Loaded MCP state: ${this.jobs.size} jobs, ${this.queue.length} queued`);
    } catch (error) {
      // If file doesn't exist or is invalid, start with empty state
      if (error.code !== 'ENOENT') {
        console.error('Error loading MCP state:', error.message);
      }
    }
  }

  async saveState() {
    try {
      // Convert jobs Map to object for serialization
      const jobsObj = {};
      for (const [id, job] of this.jobs.entries()) {
        jobsObj[id] = job;
      }
      
      const state = {
        jobs: jobsObj,
        queue: this.queue,
        timestamp: new Date().toISOString(),
      };
      
      await fs.writeFile(this.persistPath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('Error saving MCP state:', error.message);
    }
  }

  // Schedule a new job
  scheduleJob(type, params, priority = 1) {
    const jobId = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const job = {
      id: jobId,
      type,
      params,
      priority,
      status: JobStatus.PENDING,
      createdAt: new Date().toISOString(),
      retries: 0,
      logs: [`Job created at ${new Date().toISOString()}`],
    };
    
    // Store the job
    this.jobs.set(jobId, job);
    
    // Add to queue based on priority
    if (priority > 5) {
      // High priority - add to front of queue
      this.queue.unshift(jobId);
    } else {
      // Normal priority - add to end of queue
      this.queue.push(jobId);
    }
    
    // Persist state
    this.saveState();
    
    // Emit event
    this.emit('job:scheduled', job);
    
    console.log(`Job scheduled: ${jobId} (${type})`);
    return jobId;
  }

  // Start processing jobs from the queue
  startJobProcessor() {
    if (this.running) return;
    
    this.running = true;
    this.processNextJob();
    
    console.log('MCP job processor started');
  }

  // Stop the job processor
  stopJobProcessor() {
    this.running = false;
    console.log('MCP job processor stopped');
  }

  // Process the next job in the queue
  async processNextJob() {
    if (!this.running || this.activeJobs >= this.maxConcurrent || this.queue.length === 0) {
      // Schedule next check if we're still running
      if (this.running) {
        setTimeout(() => this.processNextJob(), 1000);
      }
      return;
    }
    
    const jobId = this.queue.shift();
    const job = this.jobs.get(jobId);
    
    if (!job) {
      // Job not found, move to next
      this.processNextJob();
      return;
    }
    
    // Update job status
    job.status = JobStatus.RUNNING;
    job.startedAt = new Date().toISOString();
    job.logs.push(`Job started at ${job.startedAt}`);
    this.activeJobs++;
    
    // Persist state
    this.saveState();
    
    // Emit event
    this.emit('job:started', job);
    
    console.log(`Processing job: ${jobId} (${job.type})`);
    
    try {
      // Execute job based on type
      let result;
      
      switch (job.type) {
        case JobType.WAZUH_SCAN:
          result = await this.executeWazuhScan(job);
          break;
        case JobType.LYNIS_SCAN:
          result = await this.executeLynisScan(job);
          break;
        case JobType.AGENT_INVENTORY:
          result = await this.executeAgentInventory(job);
          break;
        case JobType.REPORT_GENERATION:
          result = await this.executeReportGeneration(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }
      
      // Update job with success
      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date().toISOString();
      job.result = result;
      job.logs.push(`Job completed successfully at ${job.completedAt}`);
      
      // Emit event
      this.emit('job:completed', job);
      
      console.log(`Job completed: ${jobId}`);
    } catch (error) {
      console.error(`Job failed: ${jobId}`, error);
      
      job.logs.push(`Job failed: ${error.message}`);
      
      // Check if we should retry
      if (job.retries < this.retryConfig.maxRetries) {
        job.retries++;
        job.status = JobStatus.PENDING;
        job.logs.push(`Scheduling retry ${job.retries}/${this.retryConfig.maxRetries}`);
        
        // Add back to queue with delay
        setTimeout(() => {
          this.queue.push(jobId);
          console.log(`Job ${jobId} requeued for retry ${job.retries}/${this.retryConfig.maxRetries}`);
        }, this.retryConfig.retryDelay * job.retries);
        
        // Emit event
        this.emit('job:retry', job);
      } else {
        // Max retries reached, mark as failed
        job.status = JobStatus.FAILED;
        job.error = error.message;
        job.failedAt = new Date().toISOString();
        job.logs.push(`Job failed permanently after ${job.retries} retries at ${job.failedAt}`);
        
        // Emit event
        this.emit('job:failed', job);
      }
    } finally {
      this.activeJobs--;
      
      // Persist state
      this.saveState();
      
      // Process next job
      this.processNextJob();
    }
  }

  // Execute a Wazuh scan job
  async executeWazuhScan(job) {
    const { agentId, scanType } = job.params;
    
    // Validate Wazuh connection
    if (!wazuhService.isConnected) {
      throw new Error('Wazuh service is not connected. Please configure it first.');
    }
    
    // Log the step
    job.logs.push(`Starting Wazuh scan for agent ${agentId}, type: ${scanType}`);
    
    let result;
    
    // Execute the appropriate scan type
    switch (scanType) {
      case 'sca':
        // Security Configuration Assessment
        result = await wazuhService.getAgentSCA(agentId);
        break;
      case 'hardware':
        result = await wazuhService.getAgentHardware(agentId);
        break;
      case 'os':
        result = await wazuhService.getAgentOS(agentId);
        break;
      case 'network':
        result = await wazuhService.getAgentNetwork(agentId);
        break;
      case 'packages':
        result = await wazuhService.getAgentPackages(agentId);
        break;
      case 'processes':
        result = await wazuhService.getAgentProcesses(agentId);
        break;
      case 'ports':
        result = await wazuhService.getAgentPorts(agentId);
        break;
      case 'full':
        // Combine multiple scan types
        const [hardware, os, network, packages, processes, ports, sca] = await Promise.all([
          wazuhService.getAgentHardware(agentId).catch(e => ({ error: e.message })),
          wazuhService.getAgentOS(agentId).catch(e => ({ error: e.message })),
          wazuhService.getAgentNetwork(agentId).catch(e => ({ error: e.message })),
          wazuhService.getAgentPackages(agentId, 100).catch(e => ({ error: e.message })),
          wazuhService.getAgentProcesses(agentId, 100).catch(e => ({ error: e.message })),
          wazuhService.getAgentPorts(agentId).catch(e => ({ error: e.message })),
          wazuhService.getAgentSCA(agentId).catch(e => ({ error: e.message }))
        ]);
        
        result = {
          hardware,
          os,
          network,
          packages,
          processes,
          ports,
          sca,
          timestamp: new Date().toISOString()
        };
        break;
      default:
        throw new Error(`Unknown scan type: ${scanType}`);
    }
    
    // Store scan results
    await this.storeScanResults(agentId, scanType, result);
    
    return { success: true, data: result };
  }
  
  // Placeholder for Lynis scan execution
  async executeLynisScan(job) {
    // Implementation would depend on lynisService
    job.logs.push(`Lynis scan functionality to be implemented`);
    return { success: true, message: 'Lynis scan not yet implemented in MCP' };
  }

  // Execute agent inventory collection
  async executeAgentInventory(job) {
    // Get all agents from Wazuh
    const agents = await wazuhService.getAgents(500, 0);
    
    job.logs.push(`Retrieved ${agents.data?.affected_items?.length || 0} agents from Wazuh`);
    
    // Schedule individual agent scans
    const agentIds = agents.data?.affected_items?.map(agent => agent.id) || [];
    
    for (const agentId of agentIds) {
      this.scheduleJob(JobType.WAZUH_SCAN, { agentId, scanType: 'full' }, 2);
    }
    
    return { 
      success: true, 
      agentsScheduled: agentIds.length,
      agentIds 
    };
  }
  
  // Execute report generation
  async executeReportGeneration(job) {
    const { format, filters } = job.params;
    
    job.logs.push(`Generating ${format} report with filters: ${JSON.stringify(filters)}`);
    
    // Implementation would depend on reporting needs
    // Placeholder for now
    
    return { 
      success: true, 
      message: 'Report generation placeholder',
      format,
      generatedAt: new Date().toISOString()
    };
  }

  // Store scan results to filesystem
  async storeScanResults(agentId, scanType, data) {
    const storageDir = path.join(__dirname, 'data', 'scans', agentId);
    
    // Ensure directory exists
    await fs.mkdir(storageDir, { recursive: true });
    
    // Write results to file
    const filename = `${scanType}_${new Date().toISOString().replace(/:/g, '-')}.json`;
    await fs.writeFile(
      path.join(storageDir, filename),
      JSON.stringify(data, null, 2)
    );
    
    return { path: path.join(storageDir, filename) };
  }

  // Get all jobs
  getJobs(status = null, limit = 50, offset = 0) {
    let result = Array.from(this.jobs.values());
    
    // Filter by status if provided
    if (status) {
      result = result.filter(job => job.status === status);
    }
    
    // Sort by creation date (newest first)
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    return {
      total: result.length,
      jobs: result.slice(offset, offset + limit)
    };
  }

  // Get a specific job by ID
  getJob(jobId) {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    
    return job;
  }

  // Cancel a job
  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    
    // Can only cancel pending jobs
    if (job.status !== JobStatus.PENDING) {
      throw new Error(`Cannot cancel job with status: ${job.status}`);
    }
    
    // Remove from queue
    const index = this.queue.indexOf(jobId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
    
    // Update job
    job.status = JobStatus.CANCELLED;
    job.cancelledAt = new Date().toISOString();
    job.logs.push(`Job cancelled at ${job.cancelledAt}`);
    
    // Persist state
    this.saveState();
    
    // Emit event
    this.emit('job:cancelled', job);
    
    return job;
  }

  // Get MCP service status
  getStatus() {
    const jobCounts = {
      total: this.jobs.size,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    };
    
    // Count jobs by status
    for (const job of this.jobs.values()) {
      jobCounts[job.status]++;
    }
    
    return {
      queueLength: this.queue.length,
      activeJobs: this.activeJobs,
      maxConcurrent: this.maxConcurrent,
      running: this.running,
      jobCounts,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  // Cleanup old jobs (keep only last N)
  async cleanupJobs(keepLast = 100) {
    const jobs = Array.from(this.jobs.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Keep the specified number of most recent jobs
    const jobsToDelete = jobs.slice(keepLast);
    
    for (const job of jobsToDelete) {
      this.jobs.delete(job.id);
    }
    
    // Persist state
    await this.saveState();
    
    return { deletedCount: jobsToDelete.length };
  }
}

// Create singleton instance
const mcpService = new MCPService();

module.exports = {
  mcpService,
  MCPService,
  JobStatus,
  JobType
}; 