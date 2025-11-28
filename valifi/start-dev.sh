#!/bin/bash
cd /teamspace/studios/this_studio/fintech-deploy/valifi
export NODE_ENV=development
exec npx tsx backend/src/index.ts
