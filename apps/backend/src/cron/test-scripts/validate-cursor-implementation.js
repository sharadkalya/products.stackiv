/**
 * Validation Script: Cursor-Based Pagination Implementation
 * 
 * This script validates the v3 cursor implementation by testing:
 * 1. Multi-field ordering support in Odoo
 * 2. Cursor domain syntax
 * 3. Combined domain (date bounds + cursor)
 * 4. formatForOdoo() output format
 */

import xmlrpc from 'xmlrpc';
import dotenv from 'dotenv';

dotenv.config();

const ODOO_URL = 'http://localhost:8069';
const DB_NAME = 'odoo_db';
const USERNAME = 'admin@test.com';
const PASSWORD = 'password';

function formatForOdoo(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function authenticate() {
    return new Promise((resolve, reject) => {
        const client = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/common` });
        client.methodCall('authenticate', [DB_NAME, USERNAME, PASSWORD, {}], (error, uid) => {
            if (error) reject(error);
            else resolve(uid);
        });
    });
}

async function searchRecords(uid, domain, order, limit = 10) {
    return new Promise((resolve, reject) => {
        const client = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/object` });
        const fields = ['id', 'write_date', 'name'];

        client.methodCall(
            'execute_kw',
            [DB_NAME, uid, PASSWORD, 'sale.order', 'search_read', [domain, fields], { order, limit }],
            (error, records) => {
                if (error) reject(error);
                else resolve(records);
            }
        );
    });
}

async function searchCount(uid, domain) {
    return new Promise((resolve, reject) => {
        const client = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/object` });

        client.methodCall(
            'execute_kw',
            [DB_NAME, uid, PASSWORD, 'sale.order', 'search_count', [domain], {}],
            (error, count) => {
                if (error) reject(error);
                else resolve(count);
            }
        );
    });
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  CURSOR IMPLEMENTATION VALIDATION                             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const uid = await authenticate();
    console.log(`✓ Authenticated (UID: ${uid})\n`);

    // Test 1: Multi-field ordering
    console.log('─'.repeat(60));
    console.log('TEST 1: Multi-Field Ordering Support');
    console.log('─'.repeat(60));

    try {
        const records = await searchRecords(uid, [], 'write_date asc, id asc', 5);
        console.log(`✓ Multi-field ordering works!`);
        console.log(`  Retrieved ${records.length} records ordered by (write_date, id)`);

        // Verify ordering
        for (let i = 0; i < records.length; i++) {
            console.log(`  ${i + 1}. ID: ${records[i].id}, write_date: ${records[i].write_date}`);

            if (i > 0) {
                const prev = records[i - 1];
                const curr = records[i];
                const isOrdered =
                    (prev.write_date < curr.write_date) ||
                    (prev.write_date === curr.write_date && prev.id < curr.id);

                if (!isOrdered) {
                    console.log(`  ⚠️  Ordering violation at index ${i}`);
                }
            }
        }
        console.log();
    } catch (error) {
        console.error(`✗ Multi-field ordering FAILED:`, error.message);
        console.log();
    }

    // Test 2: formatForOdoo() output
    console.log('─'.repeat(60));
    console.log('TEST 2: formatForOdoo() Output Format');
    console.log('─'.repeat(60));

    const testDate = new Date('2025-12-11T10:28:35.123Z');
    const formatted = formatForOdoo(testDate);
    console.log(`  Input:  ${testDate.toISOString()}`);
    console.log(`  Output: ${formatted}`);

    const expectedFormat = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (expectedFormat.test(formatted)) {
        console.log(`  ✓ Format is correct: YYYY-MM-DD HH:mm:ss`);
    } else {
        console.log(`  ✗ Format is INCORRECT!`);
    }
    console.log();

    // Test 3: Simple cursor domain
    console.log('─'.repeat(60));
    console.log('TEST 3: Cursor Domain Syntax');
    console.log('─'.repeat(60));

    try {
        // First, get a record to use as cursor
        const initialRecords = await searchRecords(uid, [], 'write_date asc, id asc', 1);
        if (initialRecords.length === 0) {
            console.log('  ⚠️  No records in database to test cursor');
        } else {
            const testRecord = initialRecords[0];
            console.log(`  Using cursor: write_date='${testRecord.write_date}', id=${testRecord.id}`);

            // Build cursor domain (records AFTER this cursor)
            const cursorDomain = [
                '|',
                ['write_date', '>', testRecord.write_date],
                '&',
                ['write_date', '=', testRecord.write_date],
                ['id', '>', testRecord.id],
            ];

            const afterCursor = await searchRecords(uid, cursorDomain, 'write_date asc, id asc', 5);
            console.log(`  ✓ Cursor domain works!`);
            console.log(`  Retrieved ${afterCursor.length} records after cursor`);

            // Verify all records are after cursor
            for (const record of afterCursor) {
                const isAfter =
                    (record.write_date > testRecord.write_date) ||
                    (record.write_date === testRecord.write_date && record.id > testRecord.id);

                if (!isAfter) {
                    console.log(`  ✗ Cursor violation: record ${record.id} should not be included`);
                } else {
                    console.log(`  ✓ Record ${record.id} correctly after cursor`);
                }
            }
        }
        console.log();
    } catch (error) {
        console.error(`✗ Cursor domain FAILED:`, error.message);
        console.log();
    }

    // Test 4: Combined domain (date bounds + cursor)
    console.log('─'.repeat(60));
    console.log('TEST 4: Combined Domain (Date Bounds + Cursor)');
    console.log('─'.repeat(60));

    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);

        const startTimeStr = formatForOdoo(sevenDaysAgo);
        const endTimeStr = formatForOdoo(now);

        console.log(`  Date range: ${startTimeStr} to ${endTimeStr}`);

        // Get initial records in date range
        const dateDomain = [
            '&',
            ['write_date', '>=', startTimeStr],
            ['write_date', '<', endTimeStr],
        ];

        const dateRecords = await searchRecords(uid, dateDomain, 'write_date asc, id asc', 1);

        if (dateRecords.length === 0) {
            console.log('  ⚠️  No records in date range');
        } else {
            const cursor = dateRecords[0];
            console.log(`  Using cursor in date range: write_date='${cursor.write_date}', id=${cursor.id}`);

            // Combined domain: date bounds AND cursor
            const combinedDomain = [
                '&',
                '&',
                ['write_date', '>=', startTimeStr],
                ['write_date', '<', endTimeStr],
                '|',
                ['write_date', '>', cursor.write_date],
                '&',
                ['write_date', '=', cursor.write_date],
                ['id', '>', cursor.id],
            ];

            const combinedRecords = await searchRecords(uid, combinedDomain, 'write_date asc, id asc', 5);
            const count = await searchCount(uid, combinedDomain);

            console.log(`  ✓ Combined domain works!`);
            console.log(`  Retrieved ${combinedRecords.length} records (total: ${count})`);

            // Verify records are in date range AND after cursor
            for (const record of combinedRecords) {
                const inDateRange = record.write_date >= startTimeStr && record.write_date < endTimeStr;
                const afterCursor =
                    (record.write_date > cursor.write_date) ||
                    (record.write_date === cursor.write_date && record.id > cursor.id);

                if (!inDateRange) {
                    console.log(`  ✗ Record ${record.id} outside date range`);
                } else if (!afterCursor) {
                    console.log(`  ✗ Record ${record.id} not after cursor`);
                } else {
                    console.log(`  ✓ Record ${record.id}: ${record.write_date} (in range & after cursor)`);
                }
            }
        }
        console.log();
    } catch (error) {
        console.error(`✗ Combined domain FAILED:`, error.message);
        console.log();
    }

    console.log('═'.repeat(60));
    console.log('VALIDATION COMPLETE');
    console.log('═'.repeat(60));
    console.log('\nIf all tests passed, the cursor implementation is ready for use.');
}

main().catch(console.error);
