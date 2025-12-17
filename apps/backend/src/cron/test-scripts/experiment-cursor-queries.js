/**
 * Experiment: Test Different Cursor Query Approaches
 * 
 * Purpose: Understand why cursor pagination fails on timestamp bursts
 * 
 * We'll test:
 * 1. Current OR-based cursor domain
 * 2. Simple AND-based domain (id > X within date range)
 * 3. Two-step fetch (get IDs, then fetch by ID list)
 * 4. Different ordering strategies
 */

import xmlrpc from 'xmlrpc';

const ODOO_URL = 'http://localhost:8069';
const DB_NAME = 'odoo_db';
const USERNAME = 'admin@test.com';
const PASSWORD = 'password';

const commonClient = xmlrpc.createClient({ host: 'localhost', port: 8069, path: '/xmlrpc/2/common' });
const objectClient = xmlrpc.createClient({ host: 'localhost', port: 8069, path: '/xmlrpc/2/object' });

async function authenticate() {
    return new Promise((resolve, reject) => {
        commonClient.methodCall('authenticate', [DB_NAME, USERNAME, PASSWORD, {}], (err, uid) => {
            if (err) reject(err);
            else resolve(uid);
        });
    });
}

async function searchRead(uid, module, domain, fields, options = {}) {
    return new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            DB_NAME,
            uid,
            PASSWORD,
            module,
            'search_read',
            [domain, fields],
            options
        ], (err, records) => {
            if (err) reject(err);
            else resolve(records);
        });
    });
}

async function runExperiment() {
    console.log('🧪 CURSOR DOMAIN EXPERIMENT\n');

    const uid = await authenticate();
    console.log(`✓ Authenticated as uid: ${uid}\n`);

    // Target: sale.order.line with timestamp burst
    const MODULE = 'sale.order.line';
    const FIELDS = ['id', 'name', 'write_date'];
    const LIMIT = 200;

    // Date range where burst occurs
    const START_TIME = '2025-12-11 00:00:00';
    const END_TIME = '2025-12-12 00:00:00';

    console.log('='.repeat(70));
    console.log('EXPERIMENT 1: Current OR-based Cursor Domain');
    console.log('='.repeat(70));

    // First page - no cursor
    console.log('\n📄 Page 1: Initial fetch (no cursor)');
    const domain1 = [
        '&',
        ['write_date', '>=', START_TIME],
        ['write_date', '<', END_TIME]
    ];

    console.log('Domain:', JSON.stringify(domain1));
    const page1 = await searchRead(uid, MODULE, domain1, FIELDS, {
        limit: LIMIT,
        order: 'write_date asc, id asc'
    });

    console.log(`✓ Fetched ${page1.length} records`);
    console.log(`  First: id=${page1[0].id}, write_date=${page1[0].write_date}`);
    console.log(`  Last:  id=${page1[page1.length - 1].id}, write_date=${page1[page1.length - 1].write_date}`);

    const lastRecord = page1[page1.length - 1];
    const cursorDate = lastRecord.write_date;
    const cursorId = lastRecord.id;

    console.log(`\n📄 Page 2: With cursor (date='${cursorDate}', id=${cursorId})`);

    // Current approach: OR-based domain
    const domain2 = [
        '&',
        '&',
        ['write_date', '>=', START_TIME],
        ['write_date', '<', END_TIME],
        '|',
        ['write_date', '>', cursorDate],
        '&',
        ['write_date', '=', cursorDate],
        ['id', '>', cursorId]
    ];

    console.log('Domain:', JSON.stringify(domain2));
    const page2 = await searchRead(uid, MODULE, domain2, FIELDS, {
        limit: LIMIT,
        order: 'write_date asc, id asc'
    });

    console.log(`✓ Fetched ${page2.length} records`);
    if (page2.length > 0) {
        console.log(`  First: id=${page2[0].id}, write_date=${page2[0].write_date}`);
        console.log(`  Last:  id=${page2[page2.length - 1].id}, write_date=${page2[page2.length - 1].write_date}`);

        // Check for duplicates
        const page1Ids = new Set(page1.map(r => r.id));
        const duplicates = page2.filter(r => page1Ids.has(r.id));
        console.log(`  ⚠️  ${duplicates.length} duplicates from page 1`);
        if (duplicates.length > 0) {
            console.log(`  Duplicate IDs: ${duplicates.slice(0, 10).map(r => r.id).join(', ')}...`);
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('EXPERIMENT 2: Simple AND Domain (id > cursor within date range)');
    console.log('='.repeat(70));

    console.log(`\n📄 Page 2 Alternative: Simple AND domain (id > ${cursorId})`);

    const domain2Alt = [
        '&',
        '&',
        ['write_date', '>=', START_TIME],
        ['write_date', '<', END_TIME],
        ['id', '>', cursorId]
    ];

    console.log('Domain:', JSON.stringify(domain2Alt));
    const page2Alt = await searchRead(uid, MODULE, domain2Alt, FIELDS, {
        limit: LIMIT,
        order: 'id asc'  // Order by ID only
    });

    console.log(`✓ Fetched ${page2Alt.length} records`);
    if (page2Alt.length > 0) {
        console.log(`  First: id=${page2Alt[0].id}, write_date=${page2Alt[0].write_date}`);
        console.log(`  Last:  id=${page2Alt[page2Alt.length - 1].id}, write_date=${page2Alt[page2Alt.length - 1].write_date}`);

        // Check for duplicates
        const page1Ids = new Set(page1.map(r => r.id));
        const duplicates = page2Alt.filter(r => page1Ids.has(r.id));
        console.log(`  ⚠️  ${duplicates.length} duplicates from page 1`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('EXPERIMENT 3: Order by ID only (ignore write_date ordering)');
    console.log('='.repeat(70));

    console.log('\n📄 Page 1: Ordered by ID asc');
    const page1IdOrder = await searchRead(uid, MODULE, domain1, FIELDS, {
        limit: LIMIT,
        order: 'id asc'
    });

    console.log(`✓ Fetched ${page1IdOrder.length} records`);
    console.log(`  First: id=${page1IdOrder[0].id}, write_date=${page1IdOrder[0].write_date}`);
    console.log(`  Last:  id=${page1IdOrder[page1IdOrder.length - 1].id}, write_date=${page1IdOrder[page1IdOrder.length - 1].write_date}`);

    const lastId = page1IdOrder[page1IdOrder.length - 1].id;

    console.log(`\n📄 Page 2: id > ${lastId}, ordered by ID asc`);
    const domain2IdOrder = [
        '&',
        '&',
        ['write_date', '>=', START_TIME],
        ['write_date', '<', END_TIME],
        ['id', '>', lastId]
    ];

    const page2IdOrder = await searchRead(uid, MODULE, domain2IdOrder, FIELDS, {
        limit: LIMIT,
        order: 'id asc'
    });

    console.log(`✓ Fetched ${page2IdOrder.length} records`);
    if (page2IdOrder.length > 0) {
        console.log(`  First: id=${page2IdOrder[0].id}, write_date=${page2IdOrder[0].write_date}`);
        console.log(`  Last:  id=${page2IdOrder[page2IdOrder.length - 1].id}, write_date=${page2IdOrder[page2IdOrder.length - 1].write_date}`);

        // Check for duplicates
        const page1Ids = new Set(page1IdOrder.map(r => r.id));
        const duplicates = page2IdOrder.filter(r => page1Ids.has(r.id));
        console.log(`  ⚠️  ${duplicates.length} duplicates from page 1`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log('\nWhich approach works best for timestamp bursts?');
    console.log('1. OR-based cursor (current): Complex domain, may confuse Odoo');
    console.log('2. Simple AND with id > cursor: Simpler, but loses write_date ordering');
    console.log('3. ID-only ordering: Most reliable, but not chronological\n');
}

runExperiment().catch(console.error);
