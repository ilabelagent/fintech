#!/usr/bin/env tsx
/**
 * Valifi Server with Auto-Patch Monitoring
 *
 * Starts the server with full error monitoring and auto-patch capabilities
 */

import 'dotenv/config';
import express from 'express';
import { setupAuth } from './authService';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';
import { setupSecurity } from './securityMiddleware';

// Import auto-patch system
import { AutoPatchOrchestrator } from './autoPatchOrchestrator';
import { errorMonitor } from './errorMonitorService';

const app = express();

// Security middleware MUST be applied BEFORE body parsers
setupSecurity(app);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + '…';
      }

      log(logLine);
    }
  });

  next();
});

// Initialize Auto-Patch System
const autoPatch = new AutoPatchOrchestrator();

// Configure auto-patch behavior
const AUTO_PATCH_ENABLED = process.env.AUTO_PATCH_ENABLED === 'true';
const AUTO_APPLY = process.env.AUTO_PATCH_AUTO_APPLY === 'true';

if (AUTO_PATCH_ENABLED) {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  AUTO-PATCH GUARDIAN SYSTEM');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Status: ENABLED');
  console.log('Auto-Apply: ' + (AUTO_APPLY ? 'YES' : 'NO (requires approval)'));
  console.log('Severity Threshold: MEDIUM');
  console.log('Max Retries: 3');
  console.log('Cooldown: 60 seconds');
  console.log('═══════════════════════════════════════════════════════\n');

  // Start monitoring
  autoPatch.start({
    enabled: true,
    autoApplyPatches: AUTO_APPLY,
    requireApproval: !AUTO_APPLY,
    maxRetries: 3,
    cooldownPeriod: 60000,
    severityThreshold: 'medium',
  });

  // Event listeners
  autoPatch.on('error_detected', (error) => {
    console.log(`\n🚨 Error Detected: ${error.type.toUpperCase()}`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Severity: ${error.severity}`);
    if (error.context.file) {
      console.log(`   Location: ${error.context.file}:${error.context.line || '?'}`);
    }
  });

  autoPatch.on('patch_generated', (session) => {
    console.log(`\n🔧 Patch Generated for ${session.errorId}`);
    if (session.aiSolutions) {
      console.log(`   Solutions: ${session.aiSolutions.solutions.length}`);
      console.log(`   Confidence: ${(session.aiSolutions.selectedSolution.confidence * 100).toFixed(1)}%`);
    }
  });

  autoPatch.on('patch_applied', (session) => {
    console.log(`\n✅ Patch Applied: ${session.id}`);
    if (session.patchApplication) {
      console.log(`   Files Modified: ${session.patchApplication.filesModified.length}`);
    }
  });

  autoPatch.on('rebuild_complete', (session) => {
    console.log(`\n🏗️  Rebuild Complete: ${session.id}`);
    console.log(`   Duration: ${session.duration}ms`);
  });

  autoPatch.on('session_completed', (session) => {
    console.log(`\n🎉 Auto-Patch Session Completed: ${session.id}`);
    console.log(`   Status: ${session.status}`);
    console.log(`   Total Time: ${session.duration}ms`);
  });

  autoPatch.on('session_failed', (session) => {
    console.log(`\n❌ Auto-Patch Session Failed: ${session.id}`);
    console.log(`   Reason: ${session.failureReason}`);
    if (session.requiresManualIntervention) {
      console.log(`   ⚠️  Manual intervention required`);
    }
  });
} else {
  console.log('\n[AutoPatch] Guardian system disabled');
  console.log('Enable with: AUTO_PATCH_ENABLED=true in .env\n');
}

// Error monitoring for console output (even without auto-patch)
const originalConsoleError = console.error;
console.error = function (...args: any[]) {
  if (AUTO_PATCH_ENABLED) {
    const errorMessage = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    errorMonitor.logError(errorMessage);
  }
  originalConsoleError.apply(console, args);
};

// Start server
(async () => {
  try {
    await setupAuth(app);
    const server = await registerRoutes(app);

    // Error handler
    app.use((err: Error & { status?: number; statusCode?: number }, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || 'Internal Server Error';

      console.error('Error handler caught:', err);

      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    });

    // Setup Vite in development or serve static in production
    if (app.get('env') === 'development') {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({ port, host: '0.0.0.0', reusePort: true }, () => {
      console.log(`\n✅ Server running on port ${port}`);
      if (AUTO_PATCH_ENABLED) {
        console.log('🛡️  Auto-Patch Guardian is active\n');
      }
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Shutting down gracefully...');
      if (AUTO_PATCH_ENABLED) {
        autoPatch.stop();
      }
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Fatal error during startup:', error);
    process.exit(1);
  }
})();

// Export for external access
export { autoPatch };
