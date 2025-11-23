# Valifi Migration Guide

## Quick Migration Checklist

### 1. Database Migration

**Export from Replit:**
```bash
pg_dump $DATABASE_URL > valifi_backup.sql
```

**Import to new server:**
```bash
psql postgresql://newuser:newpass@newhost:5432/newdb < valifi_backup.sql
```

### 2. Environment Variables

Copy these from Replit Secrets to your new environment:

```env
# Database (get from Replit Secrets tab)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Authentication (get from Replit Secrets or env vars)
JWT_SECRET=your-jwt-secret-from-replit

# Application
NODE_ENV=production
PORT=5000
```

**To get your actual credentials:**
1. Go to Replit **Secrets** tab (lock icon in left sidebar)
2. Copy each secret value:
   - `DATABASE_URL` (complete PostgreSQL connection string)
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
   - `JWT_SECRET` (from environment variables)

### 3. Application Files

**Clone or download:**
```bash
git clone <your-repo-url>
cd valifi
npm install
```

### 4. Deploy to New Server

**Option A: Docker (Recommended)**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t valifi-app .
docker run -d -p 5000:5000 --env-file .env valifi-app
```

**Option B: Direct Deploy (VPS/Cloud)**
```bash
npm install
npm run build
npm start
```

**Option C: Platform-as-a-Service (Heroku, Railway, Render)**
```bash
# Most PaaS platforms auto-detect Node.js
# Just set environment variables in their dashboard
# Deploy via Git push
```

### 5. Verify Migration

```bash
# Test registration
curl -X POST http://your-new-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","fullName":"Test User","username":"testuser"}'

# Test login
curl -X POST http://your-new-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Test protected route
curl http://your-new-domain.com/api/assets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Files to Migrate

**Essential:**
- ✅ `database_export_*.sql` (created for you)
- ✅ All `valifi/` folder contents
- ✅ `package.json` and `package-lock.json`
- ✅ Environment variables (from Replit Secrets)

**Optional but recommended:**
- `.gitignore` file
- Any custom configuration files

## Important Notes

- **JWT_SECRET**: Must be minimum 32 characters (current one is valid)
- **Database**: PostgreSQL 14.x or higher required
- **Node.js**: Version 20.x or higher required
- **Port**: Default is 5000 (serves both frontend + backend)
- **Hot Reload**: Only works in development mode (`NODE_ENV=development`)

## Post-Migration Checklist

- [ ] Database imported successfully
- [ ] All environment variables set
- [ ] Application starts without errors
- [ ] Registration flow works
- [ ] Login flow works
- [ ] Protected routes require authentication
- [ ] Database queries working
- [ ] No console errors in browser/server

## Common Issues

**Database connection fails:**
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/dbname`
- Check PostgreSQL server is running
- Verify firewall allows connections on port 5432

**JWT errors:**
- Ensure `JWT_SECRET` is set and ≥32 characters
- Check it matches between environments

**Port already in use:**
- Change `PORT` environment variable
- Kill existing process: `lsof -ti:5000 | xargs kill`

## Support

For issues, check:
1. Server logs: `npm run dev` output
2. Browser console: DevTools → Console tab
3. Database logs: Check PostgreSQL logs
4. Environment: Verify all vars are set correctly
