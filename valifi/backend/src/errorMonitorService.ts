/**
 * Error Monitoring Service
 *
 * Monitors application logs, detects errors, and triggers auto-patch workflow.
 * Watches multiple log sources:
 * - Application console output
 * - Server logs
 * - Build logs
 * - Runtime errors
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

export interface DetectedError {
  id: string;
  timestamp: Date;
  type: 'runtime' | 'build' | 'typescript' | 'dependency' | 'database' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stackTrace?: string;
  context: {
    file?: string;
    line?: number;
    function?: string;
  };
  metadata: Record<string, any>;
}

export interface ErrorPattern {
  pattern: RegExp;
  type: DetectedError['type'];
  severity: DetectedError['severity'];
  extractContext: (match: RegExpMatchArray, fullLog: string) => Partial<DetectedError>;
}

export class ErrorMonitorService extends EventEmitter {
  private isMonitoring = false;
  private logBuffer: string[] = [];
  private errorHistory: DetectedError[] = [];
  private readonly maxBufferSize = 1000;
  private readonly maxHistorySize = 100;

  // Error patterns for detection
  private readonly errorPatterns: ErrorPattern[] = [
    // TypeScript errors
    {
      pattern: /error TS(\d+):\s*(.+?)(?:\s+in\s+(.+?):(\d+):(\d+))?/i,
      type: 'typescript',
      severity: 'high',
      extractContext: (match, fullLog) => ({
        message: `TypeScript Error TS${match[1]}: ${match[2]}`,
        context: {
          file: match[3],
          line: match[4] ? parseInt(match[4]) : undefined,
        },
        metadata: { errorCode: `TS${match[1]}` },
      }),
    },

    // Runtime errors
    {
      pattern: /Error:\s*(.+?)(?:\s+at\s+(.+?)\s+\((.+?):(\d+):(\d+)\))?/,
      type: 'runtime',
      severity: 'high',
      extractContext: (match, fullLog) => ({
        message: match[1],
        stackTrace: this.extractStackTrace(fullLog, match.index || 0),
        context: {
          function: match[2],
          file: match[3],
          line: match[4] ? parseInt(match[4]) : undefined,
        },
      }),
    },

    // Module not found
    {
      pattern: /Cannot find module\s+'(.+?)'/i,
      type: 'dependency',
      severity: 'critical',
      extractContext: (match) => ({
        message: `Missing module: ${match[1]}`,
        metadata: { module: match[1] },
      }),
    },

    // Database errors
    {
      pattern: /database\s+error|postgres\s+error|connection\s+refused.*5432/i,
      type: 'database',
      severity: 'critical',
      extractContext: (match, fullLog) => ({
        message: match[0],
        stackTrace: this.extractStackTrace(fullLog, match.index || 0),
      }),
    },

    // Build errors
    {
      pattern: /Build\s+failed|Compilation\s+error/i,
      type: 'build',
      severity: 'high',
      extractContext: (match, fullLog) => ({
        message: match[0],
        stackTrace: this.extractBuildContext(fullLog, match.index || 0),
      }),
    },

    // Port already in use
    {
      pattern: /EADDRINUSE.*:(\d+)|port\s+(\d+)\s+is\s+already\s+in\s+use/i,
      type: 'runtime',
      severity: 'high',
      extractContext: (match) => ({
        message: `Port already in use: ${match[1] || match[2]}`,
        metadata: { port: match[1] || match[2] },
      }),
    },

    // Package.json errors
    {
      pattern: /npm\s+ERR!|package\.json.*error/i,
      type: 'dependency',
      severity: 'medium',
      extractContext: (match, fullLog) => ({
        message: match[0],
        stackTrace: this.extractNpmError(fullLog, match.index || 0),
      }),
    },
  ];

  constructor() {
    super();
    this.setupProcessHandlers();
  }

  /**
   * Start monitoring for errors
   */
  start() {
    if (this.isMonitoring) {
      console.log('[ErrorMonitor] Already monitoring');
      return;
    }

    this.isMonitoring = true;
    console.log('[ErrorMonitor] Started monitoring for errors');

    // Intercept console.error
    this.interceptConsoleError();

    // Watch log files if they exist
    this.watchLogFiles();
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.isMonitoring = false;
    console.log('[ErrorMonitor] Stopped monitoring');
  }

  /**
   * Manually report an error
   */
  reportError(error: Error | string, context?: Partial<DetectedError>) {
    const errorMessage = error instanceof Error ? error.message : error;
    const stackTrace = error instanceof Error ? error.stack : undefined;

    const detectedError: DetectedError = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      type: context?.type || 'runtime',
      severity: context?.severity || 'medium',
      message: errorMessage,
      stackTrace,
      context: context?.context || {},
      metadata: context?.metadata || {},
    };

    this.processDetectedError(detectedError);
  }

  /**
   * Get error history
   */
  getErrorHistory(): DetectedError[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearHistory() {
    this.errorHistory = [];
  }

  /**
   * Setup process-level error handlers
   */
  private setupProcessHandlers() {
    process.on('uncaughtException', (error) => {
      this.reportError(error, { severity: 'critical', type: 'runtime' });
    });

    process.on('unhandledRejection', (reason) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.reportError(error, { severity: 'high', type: 'runtime' });
    });
  }

  /**
   * Intercept console.error to catch errors
   */
  private interceptConsoleError() {
    const originalError = console.error;

    console.error = (...args: any[]) => {
      // Call original console.error
      originalError.apply(console, args);

      // Process the error
      const message = args
        .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
        .join(' ');

      this.processLogMessage(message);
    };
  }

  /**
   * Watch log files for errors
   */
  private watchLogFiles() {
    const logPaths = [
      path.join(process.cwd(), 'logs', 'app.log'),
      path.join(process.cwd(), 'logs', 'error.log'),
    ];

    logPaths.forEach((logPath) => {
      if (fs.existsSync(logPath)) {
        fs.watch(logPath, (eventType) => {
          if (eventType === 'change') {
            this.readLogFile(logPath);
          }
        });
      }
    });
  }

  /**
   * Read and process log file
   */
  private readLogFile(logPath: string) {
    try {
      const content = fs.readFileSync(logPath, 'utf-8');
      const lines = content.split('\n').slice(-100); // Last 100 lines

      lines.forEach((line) => this.processLogMessage(line));
    } catch (error) {
      // Ignore read errors
    }
  }

  /**
   * Process a log message and detect errors
   */
  private processLogMessage(message: string) {
    if (!this.isMonitoring) return;

    // Add to buffer
    this.logBuffer.push(message);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Check against error patterns
    for (const pattern of this.errorPatterns) {
      const match = message.match(pattern.pattern);
      if (match) {
        const fullLog = this.logBuffer.join('\n');
        const contextData = pattern.extractContext(match, fullLog);

        const detectedError: DetectedError = {
          id: this.generateErrorId(),
          timestamp: new Date(),
          type: pattern.type,
          severity: pattern.severity,
          message: contextData.message || match[0],
          stackTrace: contextData.stackTrace,
          context: contextData.context || {},
          metadata: contextData.metadata || {},
        };

        this.processDetectedError(detectedError);
        break; // Only match first pattern
      }
    }
  }

  /**
   * Process and emit detected error
   */
  private processDetectedError(error: DetectedError) {
    // Check for duplicates in recent history (last 10 errors)
    const recentErrors = this.errorHistory.slice(-10);
    const isDuplicate = recentErrors.some(
      (e) => e.message === error.message && Date.now() - e.timestamp.getTime() < 5000 // Within 5 seconds
    );

    if (isDuplicate) {
      return; // Skip duplicate errors
    }

    // Add to history
    this.errorHistory.push(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }

    // Emit event
    console.log(`[ErrorMonitor] Detected ${error.severity} ${error.type} error: ${error.message}`);
    this.emit('error-detected', error);
  }

  /**
   * Extract stack trace from log
   */
  private extractStackTrace(log: string, startIndex: number): string {
    const lines = log.substring(startIndex).split('\n').slice(0, 10);
    return lines.filter((line) => line.trim().startsWith('at ')).join('\n');
  }

  /**
   * Extract build context
   */
  private extractBuildContext(log: string, startIndex: number): string {
    const lines = log.substring(startIndex).split('\n').slice(0, 20);
    return lines.join('\n');
  }

  /**
   * Extract npm error details
   */
  private extractNpmError(log: string, startIndex: number): string {
    const lines = log.substring(startIndex).split('\n').slice(0, 15);
    return lines.filter((line) => line.includes('npm ERR!')).join('\n');
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const errorMonitor = new ErrorMonitorService();
