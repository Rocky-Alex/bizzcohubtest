# Troubleshooting: User Data Not Fetching in Vercel Deployment

## Problem
User data is not being fetched from the database when deployed to Vercel, but works fine locally.

## Common Causes & Solutions

### 1. **Missing Environment Variables** ⚠️ MOST COMMON

**Check:**
- Go to your Vercel project dashboard
- Navigate to **Settings** → **Environment Variables**
- Verify that the following variables are set:
  - `POSTGRES_URL` or `DATABASE_URL`
  - Any other database-related variables

**Solution:**
1. Add the missing environment variables in Vercel:
   ```
   POSTGRES_URL=your_neon_database_connection_string
   ```
   or
   ```
   DATABASE_URL=your_database_connection_string
   ```

2. **Important:** After adding environment variables, you MUST:
   - Redeploy your application
   - Or trigger a new deployment from the Deployments tab

**How to get your Neon database URL:**
1. Go to your Neon dashboard (https://console.neon.tech)
2. Select your project
3. Go to "Connection Details"
4. Copy the connection string
5. Paste it in Vercel as `POSTGRES_URL`

---

### 2. **Database Connection String Format**

**Neon Database URL Format:**
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

**Ensure:**
- The connection string includes `?sslmode=require` at the end
- No extra spaces or line breaks
- The password is URL-encoded if it contains special characters

---

### 3. **Vercel Serverless Function Timeout**

**Issue:** Database queries might timeout in serverless environment

**Solution:**
Add to your `vercel.json`:
```json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

---

### 4. **Database IP Whitelist** (if using IP restrictions)

**Issue:** Vercel's serverless functions use dynamic IPs

**Solution:**
- In your Neon dashboard, ensure "Allow all IP addresses" is enabled
- Or use Neon's connection pooler which works better with serverless

---

### 5. **Check Vercel Logs**

**How to check:**
1. Go to your Vercel project
2. Click on the latest deployment
3. Click "Functions" tab
4. Look for `/api/admin/users` function
5. Check the logs for errors

**What to look for:**
- `❌ POSTGRES_URL or DATABASE_URL environment variable is not set!`
- Connection timeout errors
- Authentication errors
- SQL syntax errors

---

## Diagnostic Steps

### Step 1: Test Health Endpoint
I've created a health check endpoint. After deploying, visit:
```
https://your-app.vercel.app/api/health
```

This will show:
- Environment variable status
- Database connection status
- Any connection errors

### Step 2: Check Browser Console
1. Open your deployed app
2. Go to Admin → Users
3. Open browser DevTools (F12)
4. Check Console tab for errors
5. Check Network tab for failed API calls

### Step 3: Test API Directly
Visit your API endpoint directly:
```
https://your-app.vercel.app/api/admin/users
```

Expected responses:
- **403 Unauthorized**: You're not logged in as admin (this is OK, means API is working)
- **500 Error**: Database connection issue (check error message)
- **200 with data**: Everything is working!

---

## Quick Fix Checklist

- [ ] Environment variables are set in Vercel
- [ ] `POSTGRES_URL` or `DATABASE_URL` is correct
- [ ] Redeployed after adding environment variables
- [ ] Database allows connections from any IP (or Vercel IPs)
- [ ] Connection string includes `?sslmode=require`
- [ ] Checked Vercel function logs for errors
- [ ] Tested `/api/health` endpoint
- [ ] Cleared browser cache and tried again

---

## Still Not Working?

### Get Detailed Logs:

1. **Check Vercel Function Logs:**
   - Vercel Dashboard → Your Project → Deployments
   - Click on latest deployment
   - Go to "Functions" tab
   - Find `/api/admin/users`
   - Check real-time logs

2. **Check Browser Network Tab:**
   - F12 → Network tab
   - Filter by "Fetch/XHR"
   - Look for `/api/admin/users` request
   - Check the response

3. **Enable Verbose Logging:**
   The users API now has detailed logging. Check Vercel logs for:
   ```
   [Users API] GET request received
   [Users API] Checking admin authorization...
   [Users API] Authorization passed, fetching users from database...
   [Users API] Query executed successfully
   [Users API] Number of users fetched: X
   ```

---

## Environment Variable Setup (Step-by-Step)

### In Vercel:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Settings" tab
4. Click "Environment Variables" in left sidebar
5. Click "Add New"
6. Enter:
   - **Key:** `POSTGRES_URL`
   - **Value:** Your Neon connection string
   - **Environment:** Production, Preview, Development (select all)
7. Click "Save"
8. Go to "Deployments" tab
9. Click "..." on latest deployment
10. Click "Redeploy"

---

## Testing Locally vs Production

### Local (.env.local):
```env
POSTGRES_URL=postgresql://user:password@host/database?sslmode=require
```

### Vercel (Environment Variables):
Same value, but set in Vercel dashboard, not in a file.

**Important:** `.env.local` is NOT deployed to Vercel. You must set environment variables in Vercel dashboard.

---

## Contact Points for Further Help

If still having issues, provide:
1. Screenshot of Vercel environment variables (hide sensitive values)
2. Vercel function logs for `/api/admin/users`
3. Response from `/api/health` endpoint
4. Browser console errors
5. Network tab showing the failed request
