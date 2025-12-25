# Render Deployment Guide

## Overview

The StayInn application uses a split deployment:

-   **Frontend:** Deployed on Vercel (Next.js)
-   **Backend:** Deployed on Render with **two separate services**:
    1. **Web Service** - Main API server
    2. **Background Worker** - Odoo sync cron job

---

## Services Configuration

### 1. Backend API Service (`stayinn-backend`)

**Type:** Web Service  
**Purpose:** Handles all HTTP API requests

**Configuration:**

-   Runtime: Node.js
-   Build Command: `yarn install && yarn build`
-   Start Command: `yarn start`
-   Health Check: `/health`

**Runs:** Express server on configured PORT

---

### 2. Odoo Sync Cron Service (`stayinn-odoo-sync-cron`)

**Type:** Background Worker  
**Purpose:** Continuously syncs Odoo data to MongoDB

**Configuration:**

-   Runtime: Node.js
-   Build Command: `yarn install && yarn build`
-   Start Command: `yarn cron:start`

**Runs:** Node-cron job that:

-   Checks for new users every 10 seconds (configurable in `sync.config.ts`)
-   Prepares initial 90-day sync for new connections
-   Processes batches for 15 Odoo modules
-   Generates incremental batches after initial sync completes

---

## Environment Variables

Both services need the following environment variables:

### Required

-   `NODE_ENV=production`
-   `MONGODB_URI` - MongoDB Atlas connection string
-   `FIREBASE_ADMIN_SDK` - Firebase service account JSON
-   `JWT_SECRET` - Secret for JWT tokens

### Optional (if using Odoo features)

-   `ODOO_URL` - Default Odoo instance URL
-   `ODOO_DB` - Default database name
-   `ODOO_USERNAME` - Default username
-   `ODOO_PASSWORD` - Default password
-   `OPENAI_API_KEY` - For AI features
-   `PINECONE_API_KEY` - For vector search

**Note:** Users provide their own Odoo credentials via the UI, so the default values are optional.

---

## Deployment Steps

### Using render.yaml (Recommended)

1. **Ensure render.yaml is in backend directory**

    ```bash
    # File should be at: apps/backend/render.yaml
    ls apps/backend/render.yaml
    ```

2. **Push to repository**

    ```bash
    git add apps/backend/render.yaml
    git commit -m "Add Render deployment config"
    git push origin main
    ```

3. **Connect to Render**
    - Go to https://render.com
    - Click "New" → "Blueprint"
    - Select your repository
    - **Set root directory to `apps/backend`**
    - Render will detect `render.yaml` and create both services
    - Render dashboard → Select each service
    - Go to "Environment" tab
    - Add all required variables

### Manual Setup (Alternative)

If not using render.yaml:

#### Backend API

1. New Web Service
2. Connect repository
3. **Set root directory to `apps/backend`**
4. Build Command: `yarn install && yarn build`
5. Start Command: `yarn start`
6. Add environment variables

#### Cron Worker

1. New Background Worker
2. Connect same repository
3. **Set root directory to `apps/backend`**
4. Build Command: `yarn install && yarn build`
5. Start Command: `yarn cron:start`
6. Add same environment variables

---

## Monitoring

### Backend API Health

-   Endpoint: `https://your-backend-url.onrender.com/health`
-   Returns: `{"status":"ok","timestamp":"2025-12-17T..."}`

### Cron Job Health

-   Check Render logs for:
    ```
    [OdooSyncCron] === Cycle #N starting ===
    [OdooSyncCron] Users needing initial sync prep: X
    ```
-   Should see cycles every 10 seconds

### MongoDB Monitoring

-   Check `odoosyncstatuses` collection for user sync status
-   Check `odoosyncbatches` collection for batch processing
-   Use admin endpoints: `GET /api/admin/sync-history`

---

## Scaling Considerations

### Current Configuration

-   **Cron Frequency:** Every 10 seconds (`CRON_SCHEDULE` in `sync.config.ts`)
-   **Concurrent Users:** 3 users processed in parallel (`CONCURRENT_USER_LIMIT`)
-   **Batch Size:** 200 records per API call (`LIMIT_PER_CALL`)
-   **API Delay:** 1 second between calls (`API_CALL_DELAY_MS`)

### Tuning for Scale

**For more users:**

-   Increase `CONCURRENT_USER_LIMIT` to 5-10
-   Upgrade worker plan for more memory/CPU

**For faster sync:**

-   Reduce `CRON_SCHEDULE` to `*/5 * * * * *` (every 5 seconds)
-   Increase `LIMIT_PER_CALL` to 500
-   Reduce `API_CALL_DELAY_MS` to 500ms

**For Odoo rate limits:**

-   Increase `API_CALL_DELAY_MS` to 2000ms
-   Decrease `LIMIT_PER_CALL` to 100

---

## Troubleshooting

### Cron Not Running

**Check:**

1. Worker service is running (Render dashboard)
2. Logs show cron cycles
3. Environment variables are set correctly

**Common Issues:**

-   Missing `MONGODB_URI` - cron can't connect to DB
-   Wrong Odoo credentials - batches fail with auth errors
-   Out of memory - upgrade worker plan

### Sync Failures

**Check:**

1. `odoosyncstatuses` collection - look for `hasFailedBatches: true`
2. `odoosyncbatches` collection - filter by `status: 'failed'`
3. Admin endpoint: `GET /api/admin/batches?userId=XXX&status=failed`

**Common Causes:**

-   Invalid Odoo field names (add/remove in `moduleFields.config.ts`)
-   Network timeout (increase timeout in `odooClient.service.ts`)
-   Odoo server down (users need to fix their instance)

### Memory Issues

**Symptoms:**

-   Worker crashes
-   Out of memory errors in logs

**Solutions:**

1. Reduce `CONCURRENT_USER_LIMIT`
2. Reduce `LIMIT_PER_CALL`
3. Upgrade worker plan
4. Add `--max-old-space-size=512` flag (already in `cron:start` script)

---

## Local Development

### Running Both Services Locally

```bash
# Terminal 1: Run everything (frontend + backend + cron)
yarn dev

# Or separately:
# Terminal 1: Frontend + Backend
yarn dev

# Terminal 2: Cron job
yarn workspace backend cron:dev
```

### Testing Sync Locally

```bash
# Clear all data
yarn workspace backend test:clear

# Run full 90-day sync
npx tsx apps/backend/src/cron/test-scripts/full-90day-sync.js

# Verify results
npx tsx apps/backend/src/cron/test-scripts/verify-sync.js
```

---

## Production Checklist

-   [ ] `render.yaml` committed to repository
-   [ ] Both services created in Render
-   [ ] All environment variables set
-   [ ] MongoDB Atlas whitelist includes Render IPs (or set to 0.0.0.0/0)
-   [ ] `/health` endpoint returns 200 OK
-   [ ] Cron logs show cycles starting
-   [ ] Test user can save connection
-   [ ] Test user sync completes successfully
-   [ ] Admin dashboard shows sync history

---

## Cost Optimization

### Free Tier Options

-   Use Render free tier for testing
-   Free tier spins down after 15 min inactivity
-   **Warning:** Cron worker needs paid plan to run continuously

### Recommended Setup

-   **Backend API:** Starter plan ($7/month) - stays always on
-   **Cron Worker:** Starter plan ($7/month) - runs continuously
-   **Total:** ~$14/month

### Alternative: Single Service

For cost savings, you could combine API + cron in one service, but this is **not recommended** because:

-   Less resilient (if API crashes, cron stops)
-   Harder to scale independently
-   Logs are mixed together
-   Can't restart one without affecting the other

---

## Support

For issues or questions:

-   Check Render logs first
-   Review MongoDB collections for sync status
-   Use admin endpoints for debugging
-   Check this guide for common solutions
