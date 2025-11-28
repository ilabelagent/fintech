/**
 * Auto-Patch Orchestrator (Guardian)
 *
 * Main orchestrator that ties together error monitoring, multi-agent
 * patch generation, patch application, and automated rebuilds.
 *
 * This guardian loop continuously monitors for errors and automatically
 * applies fixes with AI agent collaboration.
 */

import { EventEmitter } from 'events';
import { errorMonitor, type DetectedError } from './errorMonitorService';
import { multiAgentPatchService, type ComparisonResult } from './multiAgentPatchService';
import { patchApplicationService, type PatchApplication } from './patchApplicationService';
import { autoBuildService, type BuildPipeline } from './autoBuildService';
import { db } from './db';
import { autoPatchSessions } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface AutoPatchSession {
  id: string;
  errorId: string;
  error: DetectedError;
  status:
    | 'analyzing'
    | 'generating_patch'
    | 'applying_patch'
    | 'rebuilding'
    | 'completed'
    | 'failed'
    | 'rolled_back';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  aiSolutions?: ComparisonResult;
  patchApplication?: PatchApplication;
  buildPipeline?: BuildPipeline;
  failureReason?: string;
  requiresManualIntervention: boolean;
}

export interface OrchestratorConfig {
  enabled: boolean;
  autoApplyPatches: boolean;
  requireApproval: boolean;
  maxRetries: number;
  cooldownPeriod: number; // ms between patch attempts
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
}

export class AutoPatchOrchestrator extends EventEmitter {
  private config: OrchestratorConfig = {
    enabled: false, // Start disabled for safety
    autoApplyPatches: false,
    requireApproval: true,
    maxRetries: 3,
    cooldownPeriod: 60000, // 1 minute
    severityThreshold: 'medium',
  };

  private activeSessions = new Map<string, AutoPatchSession>();
  private sessionHistory: AutoPatchSession[] = [];
  private lastPatchTime: number = 0;
  private retryCount = new Map<string, number>();

  constructor() {
    super();
    this.setupEventListeners();
  }

  /**
   * Start the guardian loop
   */
  start(config?: Partial<OrchestratorConfig>) {
    if (this.config.enabled) {
      console.log('[AutoPatch] Already running');
      return;
    }

    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.config.enabled = true;
    console.log('[AutoPatch] Guardian started with config:', this.config);

    // Start error monitoring
    errorMonitor.start();

    this.emit('started', this.config);
  }

  /**
   * Stop the guardian loop
   */
  stop() {
    if (!this.config.enabled) {
      console.log('[AutoPatch] Not running');
      return;
    }

    this.config.enabled = false;
    errorMonitor.stop();

    console.log('[AutoPatch] Guardian stopped');
    this.emit('stopped');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OrchestratorConfig>) {
    this.config = { ...this.config, ...config };
    console.log('[AutoPatch] Config updated:', this.config);
    this.emit('config-updated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): OrchestratorConfig {
    return { ...this.config };
  }

  /**
   * Manually trigger patch generation for an error
   */
  async triggerPatch(errorId: string, autoApply: boolean = false): Promise<AutoPatchSession> {
    const error = errorMonitor.getErrorHistory().find((e) => e.id === errorId);

    if (!error) {
      throw new Error(`Error not found: ${errorId}`);
    }

    return await this.handleError(error, autoApply);
  }

  /**
   * Approve and apply a pending patch
   */
  async approvePatch(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.status !== 'generating_patch') {
      throw new Error(`Session not in approvable state: ${session.status}`);
    }

    if (!session.aiSolutions) {
      throw new Error('No AI solutions available');
    }

    console.log(`[AutoPatch] Patch approved for session ${sessionId}`);
    await this.applyPatch(session);
  }

  /**
   * Reject a pending patch
   */
  rejectPatch(sessionId: string, reason?: string) {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'failed';
    session.failureReason = reason || 'Rejected by user';
    session.requiresManualIntervention = true;
    session.endTime = new Date();
    session.duration = session.endTime.getTime() - session.startTime.getTime();

    this.activeSessions.delete(sessionId);
    this.sessionHistory.push(session);

    console.log(`[AutoPatch] Patch rejected for session ${sessionId}: ${reason}`);
    this.emit('patch-rejected', session);
  }

  /**
   * Rollback a session
   */
  async rollback(sessionId: string): Promise<void> {
    const session =
      this.activeSessions.get(sessionId) || this.sessionHistory.find((s) => s.id === sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (!session.patchApplication) {
      throw new Error('No patch application to rollback');
    }

    console.log(`[AutoPatch] Rolling back session ${sessionId}`);

    try {
      await patchApplicationService.rollback(session.patchApplication.id);

      session.status = 'rolled_back';
      session.endTime = new Date();
      session.duration = session.endTime.getTime() - session.startTime.getTime();

      this.emit('rolled-back', session);
    } catch (error) {
      console.error('[AutoPatch] Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): AutoPatchSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get session history
   */
  getSessionHistory(): AutoPatchSession[] {
    return [...this.sessionHistory];
  }

  /**
   * Get session by ID
   */
  getSession(id: string): AutoPatchSession | undefined {
    return this.activeSessions.get(id) || this.sessionHistory.find((s) => s.id === id);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners() {
    errorMonitor.on('error-detected', async (error: DetectedError) => {
      if (!this.config.enabled) return;

      // Check if error meets severity threshold
      const severityLevel = { low: 1, medium: 2, high: 3, critical: 4 };
      const errorLevel = severityLevel[error.severity];
      const thresholdLevel = severityLevel[this.config.severityThreshold];

      if (errorLevel < thresholdLevel) {
        console.log(`[AutoPatch] Ignoring error below threshold: ${error.severity}`);
        return;
      }

      // Check cooldown
      const now = Date.now();
      if (now - this.lastPatchTime < this.config.cooldownPeriod) {
        console.log('[AutoPatch] In cooldown period, skipping');
        return;
      }

      // Check retry limit
      const retries = this.retryCount.get(error.message) || 0;
      if (retries >= this.config.maxRetries) {
        console.log('[AutoPatch] Max retries reached for this error');
        return;
      }

      try {
        await this.handleError(error, this.config.autoApplyPatches);
      } catch (error) {
        console.error('[AutoPatch] Failed to handle error:', error);
      }
    });
  }

  /**
   * Handle a detected error
   */
  private async handleError(error: DetectedError, autoApply: boolean): Promise<AutoPatchSession> {
    const session: AutoPatchSession = {
      id: this.generateId(),
      errorId: error.id,
      error,
      status: 'analyzing',
      startTime: new Date(),
      requiresManualIntervention: false,
    };

    this.activeSessions.set(session.id, session);
    console.log(`[AutoPatch] Started session ${session.id} for error ${error.id}`);
    this.emit('session-started', session);

    try {
      // Generate patches using multi-agent system
      session.status = 'generating_patch';
      this.emit('session-status-changed', session);

      const solutions = await multiAgentPatchService.generatePatches(error);
      session.aiSolutions = solutions;

      console.log(
        `[AutoPatch] Generated patches with ${solutions.allSolutions.length} agent solutions (agreement: ${solutions.comparisonAnalysis.agreement}%)`
      );

      this.emit('patches-generated', session);

      // If approval required, wait for manual approval
      if (this.config.requireApproval && !autoApply) {
        console.log('[AutoPatch] Waiting for approval...');
        this.emit('approval-required', session);
        return session;
      }

      // Apply patch automatically
      await this.applyPatch(session);

      return session;
    } catch (error: any) {
      session.status = 'failed';
      session.failureReason = error.message;
      session.requiresManualIntervention = true;
      session.endTime = new Date();
      session.duration = session.endTime.getTime() - session.startTime.getTime();

      this.activeSessions.delete(session.id);
      this.sessionHistory.push(session);

      console.error('[AutoPatch] Session failed:', error);
      this.emit('session-failed', session);

      // Increment retry count
      const retries = this.retryCount.get(error.message) || 0;
      this.retryCount.set(error.message, retries + 1);

      throw error;
    }
  }

  /**
   * Apply patches from a session
   */
  private async applyPatch(session: AutoPatchSession): Promise<void> {
    if (!session.aiSolutions) {
      throw new Error('No AI solutions available');
    }

    try {
      // Apply patches
      session.status = 'applying_patch';
      this.emit('session-status-changed', session);

      const solution =
        session.aiSolutions.improvedSolution || session.aiSolutions.recommendedSolution;
      const application = await patchApplicationService.applyPatches(solution);
      session.patchApplication = application;

      this.emit('patches-applied', session);

      // Check if application was successful
      if (!application.result?.success) {
        throw new Error('Patch application failed');
      }

      // Rebuild and restart
      session.status = 'rebuilding';
      this.emit('session-status-changed', session);

      const pipeline = await autoBuildService.executePipeline(
        solution.solution.requiresReinstall,
        solution.solution.requiresRebuild,
        solution.solution.requiresRestart
      );
      session.buildPipeline = pipeline;

      this.emit('rebuild-completed', session);

      // Session completed successfully
      session.status = 'completed';
      session.endTime = new Date();
      session.duration = session.endTime.getTime() - session.startTime.getTime();

      this.activeSessions.delete(session.id);
      this.sessionHistory.push(session);

      this.lastPatchTime = Date.now();

      console.log(`[AutoPatch] Session ${session.id} completed in ${session.duration}ms`);
      this.emit('session-completed', session);

      // Clear retry count on success
      this.retryCount.delete(session.error.message);
    } catch (error: any) {
      session.status = 'failed';
      session.failureReason = error.message;
      session.requiresManualIntervention = true;
      session.endTime = new Date();
      session.duration = session.endTime.getTime() - session.startTime.getTime();

      this.activeSessions.delete(session.id);
      this.sessionHistory.push(session);

      console.error('[AutoPatch] Patch application failed:', error);
      this.emit('session-failed', session);

      throw error;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const autoPatchOrchestrator = new AutoPatchOrchestrator();
