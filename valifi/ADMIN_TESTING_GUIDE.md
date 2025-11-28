# Valifi Admin Testing Guide

Complete guide to create, configure, and test admin functionality.

---

## Option 1: Quick Admin Setup (API Method)

### Step 1: Register a New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@valifi.com",
    "password": "Admin123!@#",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "admin@valifi.com",
    "firstName": "Admin",
    "lastName": "User",
    "isAdmin": false
  }
}
```

**Save the token** - you'll need it for authenticated requests.

### Step 2: Promote User to Admin (Database)

You need to update the database directly to promote the user to admin:

```bash
# Using psql (if you have access to the database)
psql $DATABASE_URL -c "UPDATE users SET is_admin = true WHERE email = 'admin@valifi.com';"

# OR create admin_users entry
psql $DATABASE_URL -c "
INSERT INTO admin_users (user_id, role, permissions, is_active)
SELECT id, 'SuperAdmin', '[\"all\"]', true FROM users WHERE email = 'admin@valifi.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'SuperAdmin', is_active = true;
"
```

### Step 3: Login as Admin

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@valifi.com",
    "password": "Admin123!@#"
  }'
```

**Expected Response:**
```json
{
  "message": "Logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "admin@valifi.com",
    "firstName": "Admin",
    "lastName": "User",
    "isAdmin": true  ← Should be true now
  }
}
```

**Copy the new token** - this is your admin authentication token.

---

## Option 2: Using the createAdmin Script

### Method A: Environment Variables

```bash
export ADMIN_EMAIL=admin@valifi.com
export ADMIN_PASSWORD='Admin123!@#'
npx tsx backend/src/scripts/createAdmin.ts --role=SuperAdmin
```

### Method B: Inline

```bash
ADMIN_EMAIL=admin@valifi.com ADMIN_PASSWORD='Admin123!@#' \
  npx tsx backend/src/scripts/createAdmin.ts --role=SuperAdmin
```

**Expected Output:**
```
══════════════════════════════════════════════════════════════════════
VALIFI SUPER ADMIN PROVISIONING
══════════════════════════════════════════════════════════════════════
Email: admin@valifi.com
Role: SuperAdmin
══════════════════════════════════════════════════════════════════════

🔐 Hashing password securely (bcrypt, 10 rounds)...
📝 Creating Super Admin account in database...

✅ SUPER ADMIN CREATED SUCCESSFULLY
══════════════════════════════════════════════════════════════════════
User ID: uuid-here
Email: admin@valifi.com
Name: Super Admin
Admin Status: YES
KYC Status: approved
══════════════════════════════════════════════════════════════════════

✅ ADMIN ACCESS VERIFIED - READY FOR LOGIN

🎉 SUPER ADMIN PROVISIONING COMPLETE
```

---

## Testing Admin Endpoints

### Set Your Admin Token

```bash
# Replace with your actual token from login
export ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 1. Get Admin Analytics

```bash
curl -X GET http://localhost:5000/api/admin/analytics \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "totalUsers": 1,
  "activeBots": 0,
  "totalLearningSessions": 0,
  "avgWinRate": 0
}
```

### 2. List All Users (Paginated)

```bash
curl -X GET "http://localhost:5000/api/admin/users?limit=10&offset=0" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "admin@valifi.com",
      "firstName": "Admin",
      "lastName": "User",
      "isAdmin": true,
      "kycStatus": "approved"
    }
  ],
  "total": 1
}
```

### 3. Update User (Make Another User Admin)

```bash
curl -X PATCH http://localhost:5000/api/admin/users/USER_ID_HERE \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isAdmin": true
  }'
```

### 4. List Trading Bots

```bash
curl -X GET "http://localhost:5000/api/admin/bots?limit=10&offset=0" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 5. Get Bot Training Data

```bash
curl -X GET http://localhost:5000/api/admin/bots/BOT_ID/training \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 6. Train a Bot

```bash
curl -X POST http://localhost:5000/api/admin/bots/BOT_ID/train \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionType": "supervised",
    "trainingDataset": "historical_trades_2024"
  }'
```

**Valid sessionType values:** `supervised`, `reinforcement`, `transfer`

### 7. Send Broadcast Message

```bash
curl -X POST http://localhost:5000/api/admin/chat/send \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Welcome to Valifi Platform!",
    "targetUserIds": []
  }'
```

### 8. Get Audit Logs

```bash
curl -X GET "http://localhost:5000/api/admin/audit-logs?limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 9. Mint Ethereal Element (Kingdom Feature)

```bash
curl -X POST http://localhost:5000/api/assets/ethereal/mint \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Divine Spark",
    "rarity": "legendary",
    "metadata": {
      "power": 100,
      "element": "light"
    }
  }'
```

**Valid rarity values:** `common`, `uncommon`, `rare`, `epic`, `legendary`

---

## Testing in Browser

### Access Admin Panel

1. **Navigate to:** http://localhost:5000/login
2. **Login with:**
   - Email: `admin@valifi.com`
   - Password: `Admin123!@#`
3. **After login, go to:** http://localhost:5000/admin

### Admin Panel Features

The admin panel should show:
- Dashboard with analytics
- User management (list, edit, promote/demote)
- Bot management (list, training dashboard)
- Broadcast messaging
- Audit logs
- System settings

---

## Validation Testing

### Test Input Validation

#### Invalid Email (Should Fail)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "Admin123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected:** 400 Bad Request with validation errors

#### Weak Password (Should Fail)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "weak",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected:** 400 Bad Request - password must be 8+ chars with uppercase, lowercase, and numbers

### Test Rate Limiting

Run this command **6 times quickly**:
```bash
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@valifi.com","password":"wrong"}' \
    -w "\nRequest $i: %{http_code}\n"
  sleep 0.5
done
```

**Expected:** First 5 requests should get 400 (invalid credentials), 6th should get **429 Too Many Requests**

### Test Security Headers

```bash
curl -I http://localhost:5000/
```

**You should see:**
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'...
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
```

---

## Troubleshooting

### Issue: 403 Forbidden on Admin Endpoints

**Cause:** User is not in `admin_users` table

**Fix:**
```sql
INSERT INTO admin_users (user_id, role, permissions, is_active)
SELECT id, 'SuperAdmin', '["all"]', true FROM users WHERE email = 'admin@valifi.com'
ON CONFLICT (user_id) DO UPDATE SET is_active = true;
```

### Issue: 401 Unauthorized

**Cause:** Token expired (1 hour expiry) or invalid

**Fix:** Login again to get a fresh token

### Issue: Cannot Access Database

**Cause:** `DATABASE_URL` not set or incorrect

**Fix:** Check `.env` file has correct Neon PostgreSQL connection string

---

## Quick Test Script

Save this as `test-admin.sh`:

```bash
#!/bin/bash

echo "🧪 Valifi Admin Testing Suite"
echo "================================"

# Step 1: Register admin user
echo -e "\n1️⃣ Registering admin user..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@valifi.com",
    "password": "Admin123!@#",
    "firstName": "Admin",
    "lastName": "User"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

# Extract user ID
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')
echo "User ID: $USER_ID"

# Step 2: Login
echo -e "\n2️⃣ Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@valifi.com",
    "password": "Admin123!@#"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
echo "Token: ${TOKEN:0:50}..."

# Step 3: Get user info
echo -e "\n3️⃣ Getting user info..."
curl -s -X GET http://localhost:5000/api/auth/user \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Step 4: Get wallets
echo -e "\n4️⃣ Getting wallets..."
curl -s -X GET http://localhost:5000/api/wallets \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo -e "\n✅ Basic tests complete!"
echo "Next: Manually promote user to admin in database"
echo "Then test admin endpoints with: export ADMIN_TOKEN=$TOKEN"
```

Run with:
```bash
chmod +x test-admin.sh
./test-admin.sh
```

---

## Security Notes

⚠️ **IMPORTANT:**
- Admin passwords should be **strong** and **unique**
- Store admin credentials securely (password manager)
- Never commit real credentials to git
- Change default password immediately in production
- Enable 2FA for admin accounts (future feature)
- Monitor admin actions via audit logs
- Restrict admin panel access by IP if possible

---

## Support

If you encounter issues:
1. Check server logs: `tail -f /tmp/valifi_dev.log`
2. Verify database connection: Check `DATABASE_URL` in `.env`
3. Confirm server is running: `curl http://localhost:5000/`
4. Review security audit report: `SECURITY_AUDIT_REPORT.md`

**Admin Credentials for Testing:**
- Email: `admin@valifi.com`
- Password: `Admin123!@#`

🎯 You're ready to test admin functionality!
