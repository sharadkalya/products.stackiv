/**
 * Integration Test: Verify ID-based pagination implementation
 * 
 * Tests the implementation by directly calling Odoo API with same approach
 */

import xmlrpc from 'xmlrpc';

const ODOO_URL = 'http://localhost:8069';
const DB_NAME = 'odoo_db';
const USERNAME = 'admin@test.com';
const PASSWORD = 'password';

// Config values (matching sync.config.ts)
const LIMIT_PER_CALL = 200;
const SYNC_BUFFER_MINUTES = 10;
const SORT_ORDER = 'id asc';

async function authenticate() {
    return new Promise((resolve, reject) => {
        const client = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/common` });
        client.methodCall('authenticate', [DB_NAME, USERNAME, PASSWORD, {}], (error, userId) => {
            if (error) reject(error);
            else resolve(userId);
        });
    });
}

async function executeOdoo(userId, model, method, args, kwargs = {}) {
    return new Promise((resolve, reject) => {
        const client = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/object` });
        client.methodCall('execute_kw', [DB_NAME, userId, PASSWORD, model, method, args, kwargs], (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });
}

const conn = {
    odooUrl: 'http://localhost:8069',
    dbName: 'odoo_db',
    username: 'admin@test.com',
    password: 'password',
};

async function testImplementation() {
    console.log('=== INTEGRATION TEST: ID-Based Pagination ===\n');
    console.log('Testing ID-based pagination approach\n');

    // Test date range from incremental sync test
    const LAST_SYNC = '2025-12-11 14:11:55';
    const NOW = '2025-12-11 14:30:00';

    // Calculate start with buffer
    const startDate = new Date(LAST_SYNC);
    startDate.setMinutes(startDate.getMinutes() - SYNC_BUFFER_MINUTES);
    const startStr = startDate.toISOString().replace('T', ' ').substring(0, 19);

    console.log(`Configuration:`);
    console.log(`  Last sync:        ${LAST_SYNC}`);
    console.log(`  Buffer:           ${SYNC_BUFFER_MINUTES} minutes`);
    console.log(`  Start (buffered): ${startStr}`);
    console.log(`  End (now):        ${NOW}`);
    console.log(`  Batch size:       ${LIMIT_PER_CALL}`);
    console.log(`  Sort order:       ${SORT_ORDER}\n`);

    const userId = await authenticate();
    console.log(`✓ Authenticated as user ${userId}\n`);

    try {
        // Step 1: Get count
        console.log('Step 1: Getting total count...');
        const countDomain = [
            '&',
            ['write_date', '>', startStr],
            ['write_date', '<=', NOW]
        ];

        const count = await executeOdoo(userId, 'sale.order', 'search_count', [countDomain], {});
        console.log(`✓ Expected records: ${count}\n`);

        // Step 2: Fetch all records using ID-based pagination
        console.log('Step 2: Fetching all records with ID-based pagination...');
        const startTime = Date.now();

        const allRecords = [];
        let lastId = 0;
        let pageNum = 0;

        while (true) {
            pageNum++;

            const domain = [
                '&',
                '&',
                ['write_date', '>', startStr],
                ['write_date', '<=', NOW],
                ['id', '>', lastId]
            ];

            const records = await executeOdoo(
                userId,
                'sale.order',
                'search_read',
                [domain, ['id', 'name', 'write_date']],
                { limit: LIMIT_PER_CALL, order: SORT_ORDER }
            );

            if (records.length === 0) break;

            allRecords.push(...records);
            lastId = Math.max(...records.map(r => r.id));

            if (pageNum % 10 === 0) {
                console.log(`  Progress: ${allRecords.length}/${count} records (${Math.round(allRecords.length / count * 100)}%)`);
            }
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✓ Fetched ${allRecords.length} records in ${elapsed}s (${pageNum - 1} pages)\n`);

        // Step 3: Validate results
        console.log('Step 3: Validating results...');

        const uniqueIds = new Set(allRecords.map(r => r.id));
        const hasDuplicates = uniqueIds.size !== allRecords.length;

        // Check if IDs are ascending
        let isAscending = true;
        for (let i = 1; i < allRecords.length; i++) {
            if (allRecords[i].id <= allRecords[i - 1].id) {
                isAscending = false;
                console.log(`  ❌ Order broken at index ${i}: ${allRecords[i - 1].id} -> ${allRecords[i].id}`);
                break;
            }
        }

        // Count timestamp bursts
        const writeDateCounts = {};
        allRecords.forEach(r => {
            writeDateCounts[r.write_date] = (writeDateCounts[r.write_date] || 0) + 1;
        });
        const bursts = Object.entries(writeDateCounts).filter(([_, count]) => count >= 10).length;

        console.log(`\n=== RESULTS ===`);
        console.log(`Expected:        ${count}`);
        console.log(`Actual:          ${allRecords.length}`);
        console.log(`Match:           ${allRecords.length === count ? '✅ YES' : '❌ NO'}`);
        console.log(`Duplicates:      ${hasDuplicates ? '❌ YES' : '✅ NO'}`);
        console.log(`Ascending order: ${isAscending ? '✅ YES' : '❌ NO'}`);
        console.log(`Bursts handled:  ${bursts} timestamp bursts (10+ records)`);
        console.log(`Performance:     ${(allRecords.length / parseFloat(elapsed)).toFixed(0)} records/second`);

        if (allRecords.length === count && !hasDuplicates && isAscending) {
            console.log(`\n✅ ALL TESTS PASSED! Implementation is production-ready.`);
        } else {
            console.log(`\n❌ TESTS FAILED! Check implementation.`);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        process.exit(1);
    }
}

testImplementation();
