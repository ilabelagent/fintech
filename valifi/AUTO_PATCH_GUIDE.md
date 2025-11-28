# Auto-Patch Guardian System - Complete Guide

The Valifi Platform includes an advanced Auto-Patch Guardian System that automatically detects errors, generates fixes using AI, and applies patches with minimal downtime.

---

## 🎯 Overview

The Auto-Patch System consists of 5 integrated services:

### 1. **Error Monitor Service** (`errorMonitorService.ts`)
- Monitors application logs in real-time
- Detects TypeScript errors, runtime errors, build failures
- Classifies errors by type and severity
- Extracts context (file, line, function, stack trace)

### 2. **Multi-Agent Patch Service** (`multiAgentPatchService.ts`)
- Uses multiple AI agents to generate patch solutions
- Compares solutions and selects the best one
- Validates patches before application
- Supports different AI providers (Anthropic, OpenAI, Gemini)

### 3. **Patch Application Service** (`patchApplicationService.ts`)
- Safely applies patches to source files
- Creates backups before modifications
- Supports rollback on failure
- Tracks all file changes

### 4. **Auto-Build Service** (`autoBuildService.ts`)
- Automatically rebuilds project after patches
- Runs tests to verify fixes
- Handles build failures gracefully
- Logs build pipeline results

### 5. **Auto-Patch Orchestrator** (`autoPatchOrchestrator.ts`)
- Coordinates all services
- Manages patch sessions
- Enforces retry limits and cooldowns
- Provides real-time event notifications

---

## 🚀 Quick Start

### Enable Auto-Patch (Read-Only Mode)

```bash
# Start with monitoring enabled, manual approval required
AUTO_PATCH_ENABLED=true ./start-monitored.sh
```

### Enable Full Auto-Patch (Auto-Apply Mode)

```bash
# Start with automatic patch application (USE WITH CAUTION)
AUTO_PATCH_ENABLED=true AUTO_PATCH_AUTO_APPLY=true ./start-monitored.sh
```

### Environment Variables

Add to your `.env` file:

```bash
# Enable the auto-patch system
AUTO_PATCH_ENABLED=true

# Automatically apply patches (false = require manual approval)
AUTO_PATCH_AUTO_APPLY=false

# Minimum severity to trigger patches
AUTO_PATCH_SEVERITY_THRESHOLD=medium

# Max retry attempts per error
AUTO_PATCH_MAX_RETRIES=3

# Cooldown between patches (ms)
AUTO_PATCH_COOLDOWN=60000
```

---

## 📊 How It Works

### Workflow

```
1. Error Detected
   ↓
2. Error Analysis & Classification
   ↓
3. Multi-Agent Patch Generation
   ↓
4. Solution Comparison & Selection
   ↓
5. Patch Application (with backup)
   ↓
6. Automated Rebuild
   ↓
7. Verification Tests
   ↓
8. Success or Rollback
```

### Example Session

```
🚨 Error Detected: TYPESCRIPT
   Message: Property 'userId' does not exist on type 'Request'
   Severity: high
   Location: backend/src/routes.ts:42

🔧 Patch Generated
   Solutions: 3
   Confidence: 87.5%
   Selected: Add AuthenticatedRequest interface

✅ Patch Applied
   Files Modified: 1
   - backend/src/routes.ts

🏗️  Rebuild Complete
   Duration: 2341ms
   Tests: PASSED

🎉 Auto-Patch Session Completed
   Status: completed
   Total Time: 5120ms
```

---

## 🔒 Safety Features

### Automatic Backups
Every file modification creates a timestamped backup:
```
backend/src/routes.ts.backup.1732753200000
```

### Rollback Support
If a patch causes new errors:
```typescript
autoPatch.rollback(sessionId);
```

### Retry Limits
- Maximum 3 attempts per error
- 60-second cooldown between attempts
- Prevents infinite patch loops

### Manual Approval Mode
When `AUTO_PATCH_AUTO_APPLY=false`:
- Patches are generated but not applied
- Admin must review and approve
- View pending patches via API

### Severity Thresholds
Only patch errors at or above threshold:
- `low` - All errors (not recommended)
- `medium` - Medium, high, critical
- `high` - Only high and critical
- `critical` - Only critical errors

---

## 📡 Real-Time Events

Subscribe to auto-patch events:

```typescript
import { autoPatch } from './startWithMonitoring';

// Error detected
autoPatch.on('error_detected', (error) => {
  console.log(`New error: ${error.message}`);
});

// Patch generated
autoPatch.on('patch_generated', (session) => {
  console.log(`Patch ready: ${session.id}`);
});

// Patch applied
autoPatch.on('patch_applied', (session) => {
  console.log(`Files modified: ${session.patchApplication.filesModified.length}`);
});

// Rebuild complete
autoPatch.on('rebuild_complete', (session) => {
  console.log(`Build time: ${session.duration}ms`);
});

// Session completed
autoPatch.on('session_completed', (session) => {
  console.log(`Total time: ${session.duration}ms`);
});

// Session failed
autoPatch.on('session_failed', (session) => {
  console.log(`Reason: ${session.failureReason}`);
});
```

---

## 🛠️ API Endpoints

### Get Active Sessions

```bash
GET /api/auto-patch/sessions
```

**Response:**
```json
{
  "active": [
    {
      "id": "session_123",
      "errorId": "error_456",
      "status": "applying_patch",
      "startTime": "2025-11-28T00:15:30.000Z"
    }
  ],
  "history": []
}
```

### Get Session Details

```bash
GET /api/auto-patch/sessions/:id
```

### Approve Pending Patch

```bash
POST /api/auto-patch/sessions/:id/approve
```

### Reject Pending Patch

```bash
POST /api/auto-patch/sessions/:id/reject
```

### Rollback Patch

```bash
POST /api/auto-patch/sessions/:id/rollback
```

### Get Error History

```bash
GET /api/auto-patch/errors
```

### Manual Trigger

```bash
POST /api/auto-patch/trigger
Content-Type: application/json

{
  "errorMessage": "Cannot find module 'missing-package'",
  "errorType": "dependency",
  "severity": "high"
}
```

---

## 📋 Supported Error Types

### TypeScript Errors
- Type mismatches
- Missing properties
- Invalid function signatures
- Import errors

**Auto-Fix Capabilities:**
- Add missing type definitions
- Create interfaces
- Fix import paths
- Add type assertions

### Runtime Errors
- Null/undefined references
- Function not found
- Property access errors

**Auto-Fix Capabilities:**
- Add null checks
- Add optional chaining
- Fix function calls
- Add default values

### Build Errors
- Module resolution failures
- Compilation errors
- Syntax errors

**Auto-Fix Capabilities:**
- Fix import paths
- Add missing dependencies
- Fix syntax issues

### Dependency Errors
- Missing packages
- Version conflicts
- Peer dependency issues

**Auto-Fix Capabilities:**
- Install missing packages
- Update package versions
- Resolve conflicts

### Database Errors
- Connection failures
- Query errors
- Schema mismatches

**Auto-Fix Capabilities:**
- Update connection strings
- Fix query syntax
- Run migrations

---

## 🧪 Testing Auto-Patch

### Simulate TypeScript Error

```bash
# Create intentional error
echo "const x: number = 'string';" >> backend/src/test-error.ts

# Watch auto-patch detect and fix
tail -f logs/valifi-monitored.log
```

### Simulate Missing Dependency

```typescript
// In any .ts file
import { nonExistentPackage } from 'missing-package';
```

Auto-patch will:
1. Detect: `Cannot find module 'missing-package'`
2. Generate: `npm install missing-package`
3. Apply: Run installation
4. Rebuild: Verify fix

### Simulate Runtime Error

```typescript
// Create null reference error
function testError() {
  const obj = null;
  return obj.property; // Will crash
}
```

---

## 📊 Monitoring & Logging

### Log Files

**Main Log:**
```bash
tail -f logs/valifi-monitored.log
```

**Error Log:**
```bash
tail -f logs/errors.log
```

**Patch Log:**
```bash
tail -f logs/patches.log
```

### Database Tables

**Patch Sessions:**
```sql
SELECT * FROM auto_patch_sessions ORDER BY created_at DESC LIMIT 10;
```

**Error History:**
```sql
SELECT * FROM error_logs ORDER BY timestamp DESC LIMIT 20;
```

---

## ⚙️ Configuration

### OrchestratorConfig

```typescript
interface OrchestratorConfig {
  enabled: boolean;                // Master enable switch
  autoApplyPatches: boolean;       // Auto-apply or require approval
  requireApproval: boolean;        // Inverse of autoApplyPatches
  maxRetries: number;              // Max attempts per error (3)
  cooldownPeriod: number;          // Delay between attempts (60000ms)
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
}
```

### Custom Configuration

```typescript
autoPatch.start({
  enabled: true,
  autoApplyPatches: false,
  maxRetries: 5,
  cooldownPeriod: 120000, // 2 minutes
  severityThreshold: 'high',
});
```

---

## 🚨 Troubleshooting

### Auto-Patch Not Detecting Errors

**Check:**
1. `AUTO_PATCH_ENABLED=true` in `.env`
2. Server started with `start-monitored.sh`
3. Logs show "[AutoPatch] Guardian started"

**Debug:**
```bash
# Check if monitoring is active
curl http://localhost:5000/api/auto-patch/status
```

### Patches Not Being Applied

**Possible Reasons:**
1. `AUTO_PATCH_AUTO_APPLY=false` (requires manual approval)
2. Severity below threshold
3. Max retries exceeded
4. In cooldown period

**Check Session Status:**
```bash
curl http://localhost:5000/api/auto-patch/sessions
```

### Build Failures After Patch

**Auto-patch will:**
1. Detect build failure
2. Automatically rollback patch
3. Mark session as failed
4. Log rollback in database

**Manual Rollback:**
```bash
curl -X POST http://localhost:5000/api/auto-patch/sessions/:id/rollback
```

### High CPU Usage

**Cause:** Too many concurrent patch sessions

**Solution:**
```bash
# Increase cooldown period
AUTO_PATCH_COOLDOWN=300000  # 5 minutes

# Increase severity threshold
AUTO_PATCH_SEVERITY_THRESHOLD=high
```

---

## 📈 Performance Impact

### Resource Usage

| Component | CPU Impact | Memory Impact |
|-----------|-----------|---------------|
| Error Monitor | ~1% | ~10MB |
| Patch Generator | ~5-10% | ~50MB |
| Auto-Builder | ~20-30% | ~100MB |
| Total (Active) | ~30% | ~160MB |

### Patch Timing

| Operation | Average Time |
|-----------|-------------|
| Error Detection | <100ms |
| Patch Generation | 2-5s |
| Patch Application | 100-500ms |
| Rebuild | 5-15s |
| **Total** | **8-21s** |

---

## 🔐 Security Considerations

### Code Review

**Always review patches before production:**
```bash
# View patch diff
curl http://localhost:5000/api/auto-patch/sessions/:id/diff
```

### Backup Strategy

**Restore from backup:**
```bash
cp backend/src/routes.ts.backup.1732753200000 backend/src/routes.ts
```

### Access Control

**Restrict auto-patch API:**
```typescript
app.use('/api/auto-patch', isAdmin, autoPatchRouter);
```

---

## 🎓 Best Practices

### 1. Start with Manual Approval
```bash
AUTO_PATCH_ENABLED=true
AUTO_PATCH_AUTO_APPLY=false  # Review patches first
```

### 2. Use Appropriate Thresholds
```bash
# Development
AUTO_PATCH_SEVERITY_THRESHOLD=medium

# Production
AUTO_PATCH_SEVERITY_THRESHOLD=critical
```

### 3. Monitor Patch Success Rate
```sql
SELECT
  status,
  COUNT(*) as count,
  AVG(duration) as avg_duration_ms
FROM auto_patch_sessions
GROUP BY status;
```

### 4. Regular Backup Cleanup
```bash
# Delete backups older than 7 days
find . -name "*.backup.*" -mtime +7 -delete
```

### 5. Test Patches in Staging
```bash
# Apply to staging first
AUTO_PATCH_ENABLED=true npm run start:staging

# If successful, promote to production
```

---

## 📚 Examples

### Example 1: Auto-Fix TypeScript Error

**Error:**
```typescript
// backend/src/routes.ts
app.get('/api/users', (req, res) => {
  const userId = req.userId; // Error: Property 'userId' does not exist
});
```

**Auto-Generated Patch:**
```typescript
interface AuthenticatedRequest extends Request {
  userId?: string;
}

app.get('/api/users', (req: AuthenticatedRequest, res) => {
  const userId = req.userId; // ✅ Fixed
});
```

### Example 2: Auto-Install Missing Dependency

**Error:**
```
Cannot find module 'uuid'
```

**Auto-Generated Patch:**
```bash
npm install uuid @types/uuid
```

### Example 3: Auto-Fix Null Reference

**Error:**
```typescript
function getUser(id: string) {
  const user = users.find(u => u.id === id);
  return user.name; // Error: Object is possibly 'undefined'
}
```

**Auto-Generated Patch:**
```typescript
function getUser(id: string) {
  const user = users.find(u => u.id === id);
  return user?.name ?? 'Unknown'; // ✅ Fixed with optional chaining
}
```

---

## 🆘 Support

**View Logs:**
```bash
tail -f logs/valifi-monitored.log
```

**Check Status:**
```bash
curl http://localhost:5000/api/auto-patch/status
```

**Manual Intervention:**
If auto-patch fails repeatedly, check:
1. Error logs for root cause
2. Database for session history
3. Backup files for manual restoration

---

## 🎯 Summary

The Auto-Patch Guardian System provides:
- ✅ Automatic error detection
- ✅ AI-powered patch generation
- ✅ Safe patch application with rollback
- ✅ Automated rebuild and testing
- ✅ Real-time monitoring and events
- ✅ Manual approval workflow
- ✅ Comprehensive logging and history

**Start monitoring now:**
```bash
./start-monitored.sh
```

Your code is now self-healing! 🛡️
