/**
 * Check actual write_date values in Odoo
 */

import xmlrpc from 'xmlrpc';

const ODOO_URL = 'http://localhost:8069';
const DB_NAME = 'odoo_db';
const USERNAME = 'admin@test.com';
const PASSWORD = 'password';

async function checkOdooDates() {
    const commonClient = xmlrpc.createClient({ host: 'localhost', port: 8069, path: '/xmlrpc/2/common' });
    const objectClient = xmlrpc.createClient({ host: 'localhost', port: 8069, path: '/xmlrpc/2/object' });

    // Authenticate
    const uid = await new Promise((resolve, reject) => {
        commonClient.methodCall('authenticate', [DB_NAME, USERNAME, PASSWORD, {}], (err, uid) => {
            if (err) reject(err);
            else resolve(uid);
        });
    });

    console.log('✓ Authenticated as uid:', uid);

    // Fetch first 5 sale orders with their write_date
    console.log('\n📊 Fetching sale.order records...\n');

    const records = await new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            DB_NAME,
            uid,
            PASSWORD,
            'sale.order',
            'search_read',
            [
                [], // No filters - get all records
                ['id', 'name', 'write_date', 'create_date']
            ],
            { limit: 10, order: 'write_date desc' }
        ], (err, records) => {
            if (err) reject(err);
            else resolve(records);
        });
    });

    console.log(`Found ${records.length} records:\n`);

    records.forEach(record => {
        console.log(`ID: ${record.id}`);
        console.log(`  Name: ${record.name}`);
        console.log(`  Write Date: ${record.write_date}`);
        console.log(`  Create Date: ${record.create_date}`);
        console.log('');
    });

    // Get total count
    const count = await new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            DB_NAME,
            uid,
            PASSWORD,
            'sale.order',
            'search_count',
            [[]]
        ], (err, count) => {
            if (err) reject(err);
            else resolve(count);
        });
    });

    console.log(`\nTotal sale.order records: ${count}`);
}

checkOdooDates().catch(console.error);
