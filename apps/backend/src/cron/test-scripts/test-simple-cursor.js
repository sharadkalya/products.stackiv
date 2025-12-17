/**
 * Simplified cursor pagination test
 * Tests with small batch size (10) and specific timestamp
 */

import xmlrpc from 'xmlrpc';

const ODOO_URL = 'http://localhost:8069';
const DB_NAME = 'odoo_db';
const USERNAME = 'admin@test.com';
const PASSWORD = 'password';

// Target a date range (Dec 11, 2025)
const START_DATE = '2025-12-11 00:00:00';
const END_DATE = '2025-12-12 00:00:00';
const BATCH_SIZE = 10;
const MAX_PAGES = 3;

/**
 * Authenticate and get user ID
 */
async function authenticate() {
    return new Promise((resolve, reject) => {
        const client = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/common` });
        client.methodCall(
            'authenticate',
            [DB_NAME, USERNAME, PASSWORD, {}],
            (error, userId) => {
                if (error) reject(error);
                else resolve(userId);
            }
        );
    });
}

/**
 * Execute Odoo method
 */
async function executeOdoo(userId, model, method, args, kwargs = {}) {
    return new Promise((resolve, reject) => {
        const client = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/object` });
        client.methodCall(
            'execute_kw',
            [DB_NAME, userId, PASSWORD, model, method, args, kwargs],
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
    });
}

/**
 * Build cursor domain - SIMPLIFIED VERSION
 * 
 * YOUR QUESTION: "do we really need all these three conditions?"
 * Answer: Let's test the SIMPLEST possible approach
 */
function buildDomain(lastId) {
    if (lastId === undefined) {
        // First page: Date range only
        return [
            '&',
            ['write_date', '>=', START_DATE],
            ['write_date', '<', END_DATE]
        ];
    }

    // Subsequent pages: Date range AND id > lastId
    // This is the SIMPLEST cursor: just id > X within the date window
    return [
        '&',
        '&',
        ['write_date', '>=', START_DATE],
        ['write_date', '<', END_DATE],
        ['id', '>', lastId]
    ];
}

/**
 * Main test
 */
async function testSimpleCursor() {
    console.log('=== SIMPLIFIED CURSOR TEST ===\n');
    console.log(`Date range: ${START_DATE} to ${END_DATE}`);
    console.log(`Batch size: ${BATCH_SIZE}`);
    console.log(`Max pages: ${MAX_PAGES}`);
    console.log(`Order by: 'id asc' ← CRITICAL!\n`);

    const userId = await authenticate();
    console.log(`✓ Authenticated as user ${userId}\n`);

    const allRecords = [];
    const seenIds = new Set();
    let lastId;

    for (let page = 1; page <= MAX_PAGES; page++) {
        const domain = buildDomain(lastId);

        console.log(`--- PAGE ${page} ---`);
        console.log(`Domain: ${JSON.stringify(domain)}`);
        console.log(`Order: 'id asc'`);
        console.log(`Limit: ${BATCH_SIZE}`);
        if (lastId !== undefined) {
            console.log(`Cursor: id > ${lastId}`);
        }

        const records = await executeOdoo(
            userId,
            'sale.order',
            'search_read',
            [domain, ['id', 'name', 'write_date']],
            {
                limit: BATCH_SIZE,
                order: 'id asc'  // IMPORTANT: Order by ID ascending
            }
        );

        console.log(`\nReceived ${records.length} records:`);

        if (records.length === 0) {
            console.log('No more records - done!\n');
            break;
        }

        // Check for duplicates
        let duplicates = 0;
        const newRecords = [];

        for (const rec of records) {
            console.log(`  id=${rec.id}, write_date=${rec.write_date}, name=${rec.name}`);

            if (seenIds.has(rec.id)) {
                console.log(`    ⚠️  DUPLICATE!`);
                duplicates++;
            } else {
                seenIds.add(rec.id);
                newRecords.push(rec);
                allRecords.push(rec);
            }
        }

        if (duplicates > 0) {
            console.log(`\n⚠️  Found ${duplicates} duplicate(s) on this page!`);
        }

        // Update cursor to last ID from this batch
        lastId = records[records.length - 1].id;
        console.log(`\nUpdated cursor to: id > ${lastId}`);
        console.log(`Total unique records so far: ${allRecords.length}\n`);
    }

    console.log('=== SUMMARY ===');
    console.log(`Total pages fetched: ${Math.min(MAX_PAGES, Math.ceil(allRecords.length / BATCH_SIZE))}`);
    console.log(`Total unique records: ${allRecords.length}`);
    console.log(`Total IDs seen: ${seenIds.size}`);
    console.log(`\nRecord ID range: ${Math.min(...Array.from(seenIds))} to ${Math.max(...Array.from(seenIds))}`);

    // Check if IDs are consecutive
    const sortedIds = Array.from(seenIds).sort((a, b) => a - b);
    let gaps = 0;
    for (let i = 1; i < sortedIds.length; i++) {
        if (sortedIds[i] !== sortedIds[i - 1] + 1) {
            gaps++;
            console.log(`Gap detected: ${sortedIds[i - 1]} -> ${sortedIds[i]}`);
        }
    }

    if (gaps === 0) {
        console.log('✓ IDs are consecutive - perfect pagination!');
    } else {
        console.log(`⚠️  Found ${gaps} gap(s) in ID sequence`);
    }
}

testSimpleCursor().catch(console.error);
