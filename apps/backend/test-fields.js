const xmlrpc = require('xmlrpc');

const url = 'http://localhost:8069';
const db = 'odoo_db';
const username = 'admin@test.com';
const password = 'password';

const MODULE_FIELDS = {
    'sale.order': ['id', 'name', 'display_name', 'state', 'date_order', 'partner_id', 'amount_total', 'currency_id'],
    'account.move': ['id', 'name', 'display_name', 'move_type', 'state', 'partner_id', 'amount_total', 'invoice_date'],
    'res.partner': ['id', 'name', 'display_name', 'email', 'phone', 'street', 'city', 'country_id', 'vat'],
    'hr.employee': ['id', 'name', 'display_name', 'work_email', 'work_phone', 'department_id', 'job_title']
};

console.log('=== Testing Field Fetch ===\n');

const commonClient = xmlrpc.createClient({ url: url + '/xmlrpc/2/common' });

commonClient.methodCall('authenticate', [db, username, password, {}], (err, uid) => {
    if (err) {
        console.error('Authentication failed:', err.message);
        process.exit(1);
    }

    console.log('✓ Authenticated\n');

    const objectClient = xmlrpc.createClient({ url: url + '/xmlrpc/2/object' });
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const domain = [
        '&',
        ['write_date', '>=', fiveDaysAgo.toISOString().replace('T', ' ').substring(0, 19)],
        ['write_date', '<', now.toISOString().replace('T', ' ').substring(0, 19)]
    ];

    async function testModule(moduleName, fields) {
        return new Promise((resolve, reject) => {
            objectClient.methodCall('execute_kw', [
                db, uid, password,
                moduleName, 'search_read',
                [domain, fields],
                { limit: 1, order: 'write_date asc' }
            ], (err2, records) => {
                if (err2) reject(err2);
                else resolve(records);
            });
        });
    }

    (async () => {
        for (const [moduleName, fields] of Object.entries(MODULE_FIELDS)) {
            try {
                console.log(`Testing ${moduleName}...`);
                const records = await testModule(moduleName, fields);

                if (records.length > 0) {
                    console.log('✓ Success! Sample record:');
                    console.log(JSON.stringify(records[0], null, 2));
                } else {
                    console.log('⚠️  No records found');
                }
                console.log('');

            } catch (error) {
                console.error(`❌ Error with ${moduleName}:`, error.message);
                console.log('');
            }
        }

        console.log('✓ All modules tested!');
        process.exit(0);
    })();
});
