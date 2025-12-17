/**
 * Test: Incremental Sync with Buffer
 * 
 * Simulates an incremental sync scenario:
 * - LAST_SYNC_WRITE_DATE: When we last successfully synced
 * - BUFFER: Safety buffer (10 minutes) to catch edge cases
 * - NOW: Current time (locked at start of sync)
 * - Pagination: id > lastId within the date range
 * - Order: id asc for deterministic results
 * 
 * This handles:
 * ✅ Data bursts (many records with same timestamp)
 * ✅ Upserts (same id with newer write_date)
 * ✅ Clock skew and transaction timing issues
 */

import xmlrpc from 'xmlrpc';

const ODOO_URL = 'http://localhost:8069';
const DB_NAME = 'odoo_db';
const USERNAME = 'admin@test.com';
const PASSWORD = 'password';

// Sync configuration
const LAST_SYNC_WRITE_DATE = '2025-12-11 14:11:55';  // Last successful sync
const BUFFER_MINUTES = 10;                            // Safety buffer
const NOW = '2025-12-11 14:30:00';                   // Current time (locked)
const BATCH_SIZE = 10;
// No MAX_PAGES - we'll fetch ALL records until done

/**
 * Calculate start date with buffer
 */
function getStartDateWithBuffer(lastSyncDate, bufferMinutes) {
    const date = new Date(lastSyncDate);
    date.setMinutes(date.getMinutes() - bufferMinutes);
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

const START_DATE = getStartDateWithBuffer(LAST_SYNC_WRITE_DATE, BUFFER_MINUTES);

console.log('=== INCREMENTAL SYNC TEST ===\n');
console.log('Configuration:');
console.log(`  Last sync:        ${LAST_SYNC_WRITE_DATE}`);
console.log(`  Buffer:           ${BUFFER_MINUTES} minutes`);
console.log(`  Start date:       ${START_DATE} ← (last sync - buffer)`);
console.log(`  Now (locked):     ${NOW}`);
console.log(`  Date range:       ${START_DATE} to ${NOW}`);
console.log(`  Batch size:       ${BATCH_SIZE}`);
console.log(`  Order by:         'id asc' ← CRITICAL!\n`);

/**
 * Authenticate
 */
async function authenticate() {
    return new Promise((resolve, reject) => {
        const client = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/common` });
        client.methodCall('authenticate', [DB_NAME, USERNAME, PASSWORD, {}], (error, userId) => {
            if (error) reject(error);
            else resolve(userId);
        });
    });
}

/**
 * Execute Odoo method
 */
async function executeOdoo(userId, model, method, args, kwargs = {}) {
    return new Promise((resolve, reject) => {
        const client = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/object` });
        client.methodCall('execute_kw', [DB_NAME, userId, PASSWORD, model, method, args, kwargs], (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });
}

/**
 * Build domain for incremental sync
 * 
 * Simple approach:
 * - Date range: write_date > (LAST_SYNC - BUFFER) AND write_date <= NOW
 * - Cursor: id > lastId
 * - Order: id asc
 */
function buildDomain(lastId) {
    if (lastId === undefined) {
        // First page: Just date range
        return [
            '&',
            ['write_date', '>', START_DATE],
            ['write_date', '<=', NOW]
        ];
    }

    // Subsequent pages: Date range AND id > lastId
    return [
        '&',
        '&',
        ['write_date', '>', START_DATE],
        ['write_date', '<=', NOW],
        ['id', '>', lastId]
    ];
}

/**
 * Main test
 */
async function testIncrementalSync() {
    const userId = await authenticate();
    console.log(`✓ Authenticated as user ${userId}\n`);

    // STEP 1: Get total count using search_count
    console.log('=== STEP 1: GET TOTAL COUNT ===');
    const countDomain = [
        '&',
        ['write_date', '>', START_DATE],
        ['write_date', '<=', NOW]
    ];

    console.log(`Domain: ${JSON.stringify(countDomain)}\n`);

    const totalCount = await executeOdoo(
        userId,
        'sale.order',
        'search_count',
        [countDomain],
        {}
    );

    console.log(`✓ Total records in range: ${totalCount}\n`);

    // STEP 2: Fetch ALL records using pagination
    console.log('=== STEP 2: FETCH ALL RECORDS ===\n');

    const allRecords = [];
    const recordsByWriteDate = new Map();
    const duplicateIds = new Set();
    let lastId;
    let pageNum = 0;

    while (true) {
        pageNum++;
        const domain = buildDomain(lastId);

        console.log(`--- PAGE ${pageNum} ---`);
        if (pageNum <= 3 || pageNum % 10 === 0) {
            console.log(`Domain: ${JSON.stringify(domain)}`);
            console.log(`Order: 'id asc', Limit: ${BATCH_SIZE}`);
            if (lastId !== undefined) {
                console.log(`Cursor: id > ${lastId}`);
            }
        }

        const records = await executeOdoo(
            userId,
            'sale.order',
            'search_read',
            [domain, ['id', 'name', 'write_date']],
            { limit: BATCH_SIZE, order: 'id asc' }
        );

        if (records.length === 0) {
            console.log(`\n✓ No more records - pagination complete after ${pageNum - 1} pages\n`);
            break;
        }

        // Only show first few and last few pages in detail
        const showDetails = pageNum <= 3 || pageNum % 10 === 0;

        if (showDetails) {
            console.log(`Received ${records.length} records:`);
        }

        for (const rec of records) {
            if (showDetails && pageNum <= 3) {
                console.log(`  id=${rec.id}, write_date=${rec.write_date}, name=${rec.name}`);
            }

            // Track duplicates
            if (allRecords.some(r => r.id === rec.id)) {
                console.log(`    ⚠️  DUPLICATE ID! (Already seen id=${rec.id})`);
                duplicateIds.add(rec.id);
            }

            allRecords.push(rec);

            // Track write_date distribution
            if (!recordsByWriteDate.has(rec.write_date)) {
                recordsByWriteDate.set(rec.write_date, []);
            }
            recordsByWriteDate.get(rec.write_date).push(rec.id);
        }

        lastId = records[records.length - 1].id;

        if (showDetails) {
            console.log(`Cursor updated to: id > ${lastId}`);
            console.log(`Progress: ${allRecords.length}/${totalCount} records\n`);
        } else if (pageNum % 10 === 0) {
            console.log(`Progress: ${allRecords.length}/${totalCount} records (${Math.round(allRecords.length / totalCount * 100)}%)\n`);
        }
    }

    console.log('=== SUMMARY ===');
    console.log(`Total pages fetched: ${pageNum - 1}`);
    console.log(`Expected records:    ${totalCount}`);
    console.log(`Actual records:      ${allRecords.length}`);
    console.log(`Unique IDs:          ${new Set(allRecords.map(r => r.id)).size}`);
    console.log(`Duplicate IDs:       ${duplicateIds.size}`);

    // CRITICAL: Verify we got everything
    if (allRecords.length === totalCount) {
        console.log(`\n✅ SUCCESS: Got all ${totalCount} records!`);
    } else {
        console.log(`\n❌ MISMATCH: Expected ${totalCount} but got ${allRecords.length}`);
        console.log(`   Missing: ${totalCount - allRecords.length} records`);
    }

    if (duplicateIds.size > 0) {
        console.log(`⚠️  Duplicates found: ${Array.from(duplicateIds).join(', ')}`);
    } else {
        console.log(`✓ No duplicates - perfect pagination!`);
    }

    console.log(`\nWrite_date distribution:`);
    const sortedDates = Array.from(recordsByWriteDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]));

    for (const [date, ids] of sortedDates) {
        console.log(`  ${date}: ${ids.length} records (ids: ${ids.slice(0, 5).join(', ')}${ids.length > 5 ? '...' : ''})`);
    }

    // Check if we're handling bursts correctly
    const burstyDates = sortedDates.filter(([_, ids]) => ids.length >= 3);
    if (burstyDates.length > 0) {
        console.log(`\n✓ Successfully handled ${burstyDates.length} timestamp burst(s):`);
        for (const [date, ids] of burstyDates) {
            console.log(`  ${date}: ${ids.length} records paginated correctly`);
        }
    }

    // Check if IDs are in ascending order (they should be)
    const allIds = allRecords.map(r => r.id);
    const isAscending = allIds.every((id, i) => i === 0 || id > allIds[i - 1]);
    console.log(`\n${isAscending ? '✓' : '✗'} IDs are in ascending order: ${isAscending}`);

    // Simulate upsert scenario
    console.log(`\n=== UPSERT SIMULATION ===`);
    console.log(`In a real sync, these ${allRecords.length} records would be upserted by ID:`);
    console.log(`  - New records: INSERTed`);
    console.log(`  - Existing records: UPDATEd with newer write_date`);
    console.log(`  - Result: Latest version of each record in MongoDB`);
}

testIncrementalSync().catch(console.error);
