#!/bin/bash

##############################################################################
# Valifi Platform - Start with Auto-Patch Monitoring
##############################################################################

echo "═══════════════════════════════════════════════════════════════════"
echo "  VALIFI PLATFORM - AUTO-PATCH MONITORING MODE"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Check if server is already running
if pgrep -f "tsx.*backend" > /dev/null; then
  echo "⚠️  Server is already running. Stopping it..."
  pkill -f "tsx.*backend"
  sleep 2
fi

# Configuration
ENABLE_AUTO_PATCH="${AUTO_PATCH_ENABLED:-true}"
AUTO_APPLY="${AUTO_PATCH_AUTO_APPLY:-false}"

echo "Configuration:"
echo "  • Auto-Patch Enabled: $ENABLE_AUTO_PATCH"
echo "  • Auto-Apply Patches: $AUTO_APPLY"
echo "  • Environment: ${NODE_ENV:-development}"
echo ""

# Set environment variables
export AUTO_PATCH_ENABLED="$ENABLE_AUTO_PATCH"
export AUTO_PATCH_AUTO_APPLY="$AUTO_APPLY"
export NODE_ENV="${NODE_ENV:-development}"

# Create logs directory
mkdir -p logs

# Start server with monitoring
echo "🚀 Starting server with monitoring..."
echo "📝 Logs: logs/valifi-monitored.log"
echo ""
echo "Press Ctrl+C to stop"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Run server with tsx and log output
npx tsx backend/src/startWithMonitoring.ts 2>&1 | tee logs/valifi-monitored.log
