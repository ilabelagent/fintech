/**
 * Automated Build and Restart Service
 *
 * Handles reinstalling dependencies, rebuilding the application,
 * and restarting the server after patches are applied.
 */

import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

export interface BuildStep {
  name: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
  duration?: number;
}

export interface BuildPipeline {
  id: string;
  timestamp: Date;
  steps: BuildStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalDuration?: number;
}

export class AutoBuildService extends EventEmitter {
  private currentPipeline: BuildPipeline | null = null;
  private serverProcess: ChildProcess | null = null;
  private pipelines: BuildPipeline[] = [];

  constructor() {
    super();
  }

  /**
   * Execute full rebuild pipeline
   */
  async executePipeline(
    requiresReinstall: boolean,
    requiresRebuild: boolean,
    requiresRestart: boolean
  ): Promise<BuildPipeline> {
    console.log('[AutoBuild] Starting pipeline...');
    console.log(`  Reinstall: ${requiresReinstall}`);
    console.log(`  Rebuild: ${requiresRebuild}`);
    console.log(`  Restart: ${requiresRestart}`);

    const pipeline: BuildPipeline = {
      id: this.generateId(),
      timestamp: new Date(),
      steps: [],
      status: 'pending',
    };

    this.currentPipeline = pipeline;
    this.pipelines.push(pipeline);

    const startTime = Date.now();

    try {
      pipeline.status = 'running';
      this.emit('pipeline-started', pipeline);

      // Step 1: Reinstall dependencies if needed
      if (requiresReinstall) {
        await this.executeStep(pipeline, {
          name: 'Reinstall Dependencies',
          command: 'npm install',
          status: 'pending',
        });
      }

      // Step 2: Rebuild if needed
      if (requiresRebuild) {
        // Type check first
        await this.executeStep(pipeline, {
          name: 'Type Check',
          command: 'npm run check',
          status: 'pending',
        });

        // Build
        await this.executeStep(pipeline, {
          name: 'Build Application',
          command: 'npm run build',
          status: 'pending',
        });
      }

      // Step 3: Restart server if needed
      if (requiresRestart) {
        await this.restartServer(pipeline);
      }

      // Pipeline completed
      pipeline.status = 'completed';
      pipeline.totalDuration = Date.now() - startTime;

      console.log(`[AutoBuild] Pipeline completed in ${pipeline.totalDuration}ms`);
      this.emit('pipeline-completed', pipeline);

      return pipeline;
    } catch (error) {
      pipeline.status = 'failed';
      pipeline.totalDuration = Date.now() - startTime;

      console.error('[AutoBuild] Pipeline failed:', error);
      this.emit('pipeline-failed', pipeline);

      throw error;
    } finally {
      this.currentPipeline = null;
    }
  }

  /**
   * Execute a single build step
   */
  private async executeStep(pipeline: BuildPipeline, step: BuildStep): Promise<void> {
    pipeline.steps.push(step);
    step.status = 'running';

    console.log(`[AutoBuild] Running: ${step.name}`);
    this.emit('step-started', { pipeline, step });

    const startTime = Date.now();

    try {
      const result = await execAsync(step.command, {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      step.output = result.stdout + result.stderr;
      step.status = 'completed';
      step.duration = Date.now() - startTime;

      console.log(`[AutoBuild] ${step.name} completed in ${step.duration}ms`);
      this.emit('step-completed', { pipeline, step });
    } catch (error: any) {
      step.error = error.message;
      step.output = error.stdout + error.stderr;
      step.status = 'failed';
      step.duration = Date.now() - startTime;

      console.error(`[AutoBuild] ${step.name} failed:`, error.message);
      this.emit('step-failed', { pipeline, step });

      throw new Error(`Build step failed: ${step.name}`);
    }
  }

  /**
   * Restart the server
   */
  private async restartServer(pipeline: BuildPipeline): Promise<void> {
    const step: BuildStep = {
      name: 'Restart Server',
      command: 'npm start',
      status: 'pending',
    };

    pipeline.steps.push(step);
    step.status = 'running';

    console.log('[AutoBuild] Restarting server...');
    this.emit('step-started', { pipeline, step });

    const startTime = Date.now();

    try {
      // Kill existing server process if any
      if (this.serverProcess) {
        console.log('[AutoBuild] Stopping existing server...');
        this.serverProcess.kill('SIGTERM');

        // Wait for graceful shutdown
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Start new server process in background
      this.serverProcess = spawn('npm', ['start'], {
        cwd: process.cwd(),
        detached: true,
        stdio: 'ignore', // Don't pipe output
      });

      // Unref so parent can exit
      this.serverProcess.unref();

      // Wait a bit for server to start
      await new Promise((resolve) => setTimeout(resolve, 3000));

      step.status = 'completed';
      step.duration = Date.now() - startTime;
      step.output = 'Server restarted successfully';

      console.log('[AutoBuild] Server restarted');
      this.emit('step-completed', { pipeline, step });
    } catch (error: any) {
      step.error = error.message;
      step.status = 'failed';
      step.duration = Date.now() - startTime;

      console.error('[AutoBuild] Server restart failed:', error);
      this.emit('step-failed', { pipeline, step });

      throw error;
    }
  }

  /**
   * Quick restart without full pipeline
   */
  async quickRestart(): Promise<void> {
    console.log('[AutoBuild] Quick restart...');

    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    this.serverProcess = spawn('npm', ['start'], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore',
    });

    this.serverProcess.unref();

    console.log('[AutoBuild] Quick restart completed');
  }

  /**
   * Get current pipeline
   */
  getCurrentPipeline(): BuildPipeline | null {
    return this.currentPipeline;
  }

  /**
   * Get pipeline history
   */
  getPipelineHistory(): BuildPipeline[] {
    return [...this.pipelines];
  }

  /**
   * Get pipeline by ID
   */
  getPipeline(id: string): BuildPipeline | undefined {
    return this.pipelines.find((p) => p.id === id);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const autoBuildService = new AutoBuildService();
