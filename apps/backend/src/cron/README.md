# Odoo Sync Cron Job

This directory contains the cron job that runs the Odoo sync engine in the background.

## Running the Cron Job

### Development Mode

```bash
yarn cron:dev
```

This will run the cron job with hot-reloading enabled.

### Production Mode

```bash
yarn build
yarn cron:start
```

Or using PM2:

```bash
pm2 start dist/cron/odooSyncCron.js --name=odoo-sync-cron
```

## Configuration

The cron schedule and other sync parameters can be configured in:

```
src/config/sync.config.ts
```

Current default: Every 10 seconds

## How It Works

The cron job:

1. Runs on the configured schedule (default: every 10 seconds)
2. Checks for users with `syncStatus: 'not_started'` and calls `prepareSync()`
3. Checks for users with `syncStatus: 'in_progress'` and calls `processNextBatch()`
4. Processes batches sequentially per user, but in parallel across users
5. Updates sync status to `'done'` when all batches are complete

## Monitoring

Check sync status via the API endpoint:

```
GET /odoo/status
```

This returns:

-   `connectionInfoAvailable`: Whether connection details are saved
-   `syncStatus`: Current sync state (not_started, in_progress, done, failed)
-   `progress`: Sync progress details (when in_progress)
