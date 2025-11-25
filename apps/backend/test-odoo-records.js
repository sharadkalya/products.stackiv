/**
 * Test Script 1: Read Through Odoo Records
 * 
 * This script connects to Odoo and counts records for each module
 * in the last 3 days to verify what data is available.
 */

const xmlrpc = require('xmlrpc');
require('dotenv').config();

const ODOO_URL = 'http://localhost:8069';
const DB_NAME = 'odoo_db';
const USERNAME = 'admin@test.com';
const PASSWORD = 'password';

const MODULES = [
    { name: 'sale.order', display: 'Sales Orders' },
    { name: 'account.move', display: 'Invoices' },
    { name: 'res.partner', display: 'Contacts' },
    { name: 'hr.employee', display: 'Employees' },
];

function formatDate(date) {
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

async function authenticate() {
    return new Promise((resolve, reject) => {
        const client = xmlrpc.createClient({
            url: `${ODOO_URL}/xmlrpc/2/common`,
        });

        client.methodCall('authenticate', [DB_NAME, USERNAME, PASSWORD, {}], (error, uid) => {
            if (error) {
                reject(error);
            } else {
                resolve(uid);
            }
        });
    });
}

async function countRecords(uid, module, startDate, endDate) {
    return new Promise((resolve, reject) => {
        const client = xmlrpc.createClient({
            url: `${ODOO_URL}/xmlrpc/2/object`,
        });

        const domain = [
            '&',
            ['write_date', '>=', formatDate(startDate)],
            ['write_date', '<', formatDate(endDate)],
        ];

        client.methodCall(
            'execute_kw',
            [DB_NAME, uid, PASSWORD, module, 'search_count', [domain], {}],
            (error, count) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(count);
                }
            }
        );
    });
}

async function getRecordDetails(uid, module, startDate, endDate, limit = 5) {
    return new Promise((resolve, reject) => {
        const client = xmlrpc.createClient({
            url: `${ODOO_URL}/xmlrpc/2/object`,
        });

        const domain = [
            '&',
            ['write_date', '>=', formatDate(startDate)],
            ['write_date', '<', formatDate(endDate)],
        ];

        const fields = ['id', 'display_name', 'write_date', 'create_date'];

        client.methodCall(
            'execute_kw',
            [DB_NAME, uid, PASSWORD, module, 'search_read', [domain, fields], { limit, order: 'write_date desc' }],
            (error, records) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(records);
                }
            }
        );
    });
}

async function main() {
    console.log('\n=== ODOO RECORDS TEST ===\n');
    console.log(`Odoo URL: ${ODOO_URL}`);
    console.log(`Database: ${DB_NAME}`);
    console.log(`Username: ${USERNAME}\n`);

    try {
        // Authenticate
        console.log('🔐 Authenticating...');
        const uid = await authenticate();
        console.log(`✓ Authenticated with UID: ${uid}\n`);

        // Calculate date range (last 3 days)
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - 3);

        console.log(`📅 Date Range: ${formatDate(startDate)} to ${formatDate(now)}\n`);
        console.log('─'.repeat(80));

        // Test each module
        for (const module of MODULES) {
            console.log(`\n📊 ${module.display} (${module.name})`);
            console.log('─'.repeat(80));

            try {
                // Count records
                const count = await countRecords(uid, module.name, startDate, now);
                console.log(`   Total records: ${count}`);

                if (count > 0) {
                    // Get sample records
                    const records = await getRecordDetails(uid, module.name, startDate, now, 3);
                    console.log(`\n   Sample records (showing ${Math.min(3, records.length)}):`);
                    records.forEach((record, index) => {
                        console.log(`   ${index + 1}. ID: ${record.id} | ${record.display_name}`);
                        console.log(`      Created: ${record.create_date}`);
                        console.log(`      Modified: ${record.write_date}`);
                    });
                } else {
                    console.log('   ⚠️  No records found in the last 3 days');
                }
            } catch (error) {
                console.error(`   ❌ Error: ${error.message}`);
            }
        }

        console.log('\n' + '─'.repeat(80));
        console.log('\n✓ Odoo records test complete!\n');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

main();
