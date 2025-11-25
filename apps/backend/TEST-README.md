# Odoo Sync Engine v2 - Test Scripts

## ⭐ PRIMARY TEST: test-complete-sync.js

**Always use this script to validate the sync engine!**

**This is a complete standalone test - no manual cleanup needed!**

```bash
npx tsx test-complete-sync.js
```

**What it does:**

-   ✅ **Clears all previous data automatically** (fresh test every time)
-   ✅ Processes ALL batches for ALL modules until complete
-   ✅ Handles Sales Orders, Invoices, Contacts, and Employees
-   ✅ Real-time progress monitoring
-   ✅ **Verifies MongoDB counts match Odoo source counts**
-   ✅ Comprehensive data quality checks
-   ✅ Shows sample records with rich business data
-   ✅ Batch status summary

**Expected Output:**

```
✅ PERFECT MATCH: All records synced correctly!
   1785 records match exactly between MongoDB and Odoo

✅ Sales Orders: MongoDB 520 | Odoo 520
✅ Invoices: MongoDB 682 | Odoo 682
✅ Contacts: MongoDB 563 | Odoo 563
✅ Employees: MongoDB 20 | Odoo 20

MongoDB Total: 1785
Odoo Total: 1785
Total Batches: 16 done, 0 failed
```

**When to use:** After any changes to sync engine, field configs, or Odoo settings.

---

## Overview

This directory contains comprehensive test scripts to validate the Odoo Sync Engine v2 implementation. The tests verify that data flows correctly from Odoo through the sync engine into MongoDB.

## Test Configuration

**Current Settings:**

-   **Sync Range**: 3 days (configured in `src/config/sync.config.ts`)
-   **User ID**: `aYPEyMA39LdyTktykmiQ0mkNh523`
-   **Odoo URL**: `http://localhost:8069`
-   **Database**: `odoo_db`

## All Test Scripts

### 1. `test-complete-sync.js` ⭐ **PRIMARY TEST**

**Purpose**: Full end-to-end sync test for all modules with Odoo verification.

**What it does:**

-   Processes ALL batches for ALL modules until complete
-   Handles all 4 modules: Sales Orders, Invoices, Contacts, Employees
-   Provides real-time progress updates
-   **Connects to Odoo to verify synced counts match source counts**
-   Comprehensive data quality checks
-   Shows sample records with business data

**Run:**

```bash
npx tsx test-complete-sync.js
```

**Expected Output:**

```
✅ PERFECT MATCH: All records synced correctly!
   1785 records match exactly between MongoDB and Odoo

✅ Sales Orders: MongoDB 520 | Odoo 520
✅ Invoices: MongoDB 682 | Odoo 682
✅ Contacts: MongoDB 563 | Odoo 563
✅ Employees: MongoDB 20 | Odoo 20
```

**Key Feature:** This is the ONLY test that verifies MongoDB record counts exactly match Odoo source counts, ensuring no data loss during sync.

### 2. `test-odoo-records.js` - Odoo Connection Test

**Purpose**: Verify Odoo is accessible and count available records.

**What it does:**

-   Connects to Odoo via XML-RPC
-   Counts records in each module (last 3 days)
-   Shows sample records with metadata
-   Identifies which modules have data to sync

**Run:**

```bash
node test-odoo-records.js
```

**Expected Output:**

-   Authentication success
-   Record counts for all 4 modules
-   Sample records with IDs, names, and timestamps
-   Warnings if no data found

### 3. `test-trigger-sync.js` - Sync Trigger Test

**Purpose**: Trigger sync and monitor progress (but doesn't wait for completion).

**What it does:**

-   Connects to MongoDB
-   Clears existing batches (fresh start)
-   Calls `OdooSyncService.prepareSync()`
-   Processes batches manually
-   Monitors progress in real-time
-   Reports status (but may not complete all batches)

**Run:**

```bash
npx tsx test-trigger-sync.js
```

**Expected Output:**

-   Batch preparation progress
-   Real-time sync progress updates
-   Completion confirmation
-   Final batch statistics

**Notes:**

-   May take 2-5 minutes depending on data volume
-   Shows live progress: `Done: X/Y | In Progress: Z`
-   Automatically detects if sync is already running

### 3. `test-verify-records.js` - Data Validation Test

**Purpose**: Verify synced records in MongoDB match expectations.

**What it does:**

-   Connects to MongoDB
-   Counts records in each collection
-   Validates required fields (odooId, name, writeDate)
-   Shows sample records with business data
-   Compares batch stats with actual data
-   Reports data quality issues

**Run:**

```bash
npx tsx test-verify-records.js
```

**Expected Output:**

-   Record counts per collection
-   Date ranges of synced data
-   Sample records with rich field data
-   Data quality validation results
-   Batch completion statistics

**Validation Checks:**

-   ✓ All records have `odooId`
-   ✓ All records have `name`
-   ✓ All records have `writeDate`
-   ✓ Business fields populated (amounts, partners, etc.)
-   ✓ Batch counts match collection counts

## Quick Test Scripts

### `quick-test.sh` - Run Individual or All Tests

**Usage:**

```bash
# Run all tests in sequence
./quick-test.sh all

# Run only Odoo connection test
./quick-test.sh odoo

# Run only sync trigger
./quick-test.sh sync

# Run only record verification
./quick-test.sh verify
```

### `run-all-tests.sh` - Full Test Suite with Pauses

**Usage:**

```bash
./run-all-tests.sh
```

**Features:**

-   Runs all 3 test phases in order
-   Pauses between phases for review
-   Color-coded output
-   Final summary report

## Test Workflow

### Recommended Testing Sequence

1. **First Time Setup**

    ```bash
    # Clear any existing data
    npx tsx clear-data.js

    # Verify Odoo has data
    node test-odoo-records.js
    ```

2. **Run Sync**

    ```bash
    # Trigger and monitor sync
    npx tsx test-trigger-sync.js
    ```

3. **Verify Results**

    ```bash
    # Check MongoDB data
    npx tsx test-verify-records.js
    ```

4. **Full Automated Test**
    ```bash
    # Or run everything at once
    ./quick-test.sh all
    ```

## Expected Results

### Healthy Test Output

**Phase 1 (Odoo):**

```
✓ Authenticated with UID: 2
📅 Date Range: 2025-11-22 to 2025-11-25

📊 Sales Orders (sale.order)
   Total records: 520
   Sample records (showing 3):
   1. ID: 6 | S00006
```

**Phase 2 (Sync):**

```
✓ Sync prepared
[45s] Done: 12/12 | In Progress: 0 | Failed: 0
✓ Sync completed!
```

**Phase 3 (Verify):**

```
📦 Sales Orders:
  Total records: 520
  Records with odooId: 520
  Records with name: 520
  Records with writeDate: 520
  ✓ All records have required fields
```

### Common Issues

**Issue**: "No records found in the last 3 days"

-   **Solution**: Create test data in Odoo or increase `INITIAL_SYNC_RANGE_DAYS`

**Issue**: "Connection test failed"

-   **Solution**: Check Odoo is running at `http://localhost:8069`
-   Verify credentials in test scripts match Odoo

**Issue**: "Authentication failed"

-   **Solution**: Update USERNAME/PASSWORD in test scripts
-   Check Odoo user exists and has access

**Issue**: Sync gets stuck at "In Progress"

-   **Solution**: Check backend logs for errors
-   Verify Odoo API is responding
-   Check MongoDB connection

**Issue**: Record counts don't match between Odoo and MongoDB

-   **Solution**: Check for failed batches in Phase 3
-   Review `lastError` in failed batches
-   Re-run sync for failed modules

## Modifying Test Configuration

### Change Sync Time Range

Edit `src/config/sync.config.ts`:

```typescript
INITIAL_SYNC_RANGE_DAYS: 7,  // Change from 3 to 7 days
```

### Change Batch Window Size

Edit `src/config/sync.config.ts`:

```typescript
WINDOW_HOURS: 12,  // Change from 24 to 12 hours
```

### Change Odoo Connection

Edit test scripts and update:

```javascript
const ODOO_URL = 'http://localhost:8069';
const DB_NAME = 'odoo_db';
const USERNAME = 'admin@test.com';
const PASSWORD = 'admin';
```

### Change User ID

Edit test scripts and update:

```javascript
const USER_ID = 'your-user-id-here';
```

## Debugging Tips

### View Real-Time Sync Logs

The backend server shows detailed sync logs:

```bash
# Start backend in development mode
yarn run dev

# Watch the logs for sync activity
# Look for lines starting with [OdooSync]
```

### Inspect MongoDB Directly

```bash
# Connect to MongoDB
mongosh "your-mongodb-uri"

# Count records
db.odoosaleorders.countDocuments()
db.odooinvoices.countDocuments()

# Check batch status
db.odoosyncbatches.find({ status: "failed" })

# View sample record
db.odoosaleorders.findOne()
```

### Check Odoo API Directly

```bash
# Test Odoo is accessible
curl http://localhost:8069/web/login

# If connection refused, start Odoo
# (depends on your Odoo installation method)
```

### Reset Everything and Start Fresh

```bash
# 1. Clear MongoDB data
npx tsx clear-data.js

# 2. Verify Odoo has data
node test-odoo-records.js

# 3. Run full test suite
./quick-test.sh all
```

## Performance Benchmarks

**Typical Performance (last 3 days):**

-   Sales Orders (500 records): ~30s
-   Invoices (700 records): ~40s
-   Contacts (600 records): ~35s
-   Employees (20 records): ~5s
-   **Total**: ~2 minutes for ~1800 records

**Performance Factors:**

-   Network latency to Odoo
-   MongoDB write speed
-   Number of records per module
-   Odoo server load
-   `LIMIT_PER_CALL` setting (200 records/page)
-   `API_CALL_DELAY_MS` setting (1000ms between calls)

## v2 Specific Tests

### Test ID-Based Pagination

The v2 engine uses ID-based pagination. To verify:

1. Check logs show "ID-based pagination" messages
2. Verify no "data too dense" errors occur
3. Create 1000+ records in Odoo with same timestamp
4. Sync should complete without errors

### Test Fixed Windows

Verify 24-hour fixed windows:

1. Check batch `startTime` and `endTime` in MongoDB
2. All windows should be exactly 24 hours apart
3. No window should be smaller than 24 hours

### Test Deduplication

Verify upsert prevents duplicates:

1. Run sync once
2. Count records: `db.odoosaleorders.countDocuments()`
3. Run sync again (should retry same data)
4. Count should be identical (no duplicates)

### Test All-or-Nothing

Verify batch atomicity:

1. Kill backend mid-batch
2. Check MongoDB - should have complete batches only
3. Restart sync
4. Failed batch should retry from scratch

## Next Steps

After successful tests:

1. ✅ Increase `INITIAL_SYNC_RANGE_DAYS` to 30 or 90
2. ✅ Enable automated cron sync
3. ✅ Monitor production sync in dashboard
4. ✅ Set up alerts for failed batches
5. ✅ Plan for incremental sync (new data only)

## Support

If tests fail:

1. Check all services are running (Odoo, MongoDB, Backend)
2. Review error messages in test output
3. Check backend server logs
4. Verify network connectivity
5. Confirm Odoo credentials
6. See "Common Issues" section above
