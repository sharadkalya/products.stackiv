const xmlrpc = require('xmlrpc');

const url = 'http://localhost:8069';
const db = 'odoo_db';
const username = 'admin@test.com';
const password = 'password';

const modules = [
    { name: 'sale.order', displayName: 'Sales Orders' },
    { name: 'account.move', displayName: 'Invoices' },
    { name: 'res.partner', displayName: 'Contacts' },
    { name: 'hr.employee', displayName: 'Employees' }
];

console.log('=== Discovering Odoo Fields ===\n');

const commonClient = xmlrpc.createClient({ url: url + '/xmlrpc/2/common' });

commonClient.methodCall('authenticate', [db, username, password, {}], (err, uid) => {
    if (err) {
        console.error('Authentication failed:', err.message);
        process.exit(1);
    }

    console.log('✓ Authenticated\n');

    const objectClient = xmlrpc.createClient({ url: url + '/xmlrpc/2/object' });

    async function getFields(moduleName) {
        return new Promise((resolve, reject) => {
            objectClient.methodCall('execute_kw', [
                db, uid, password,
                moduleName, 'fields_get',
                [],
                { attributes: ['string', 'type', 'required', 'readonly'] }
            ], (err2, result) => {
                if (err2) reject(err2);
                else resolve(result);
            });
        });
    }

    (async () => {
        for (const module of modules) {
            console.log(`\n========== ${module.displayName} (${module.name}) ==========`);

            try {
                const fields = await getFields(module.name);
                const fieldNames = Object.keys(fields);

                console.log(`Total fields: ${fieldNames.length}\n`);

                // Categorize fields
                const core = [];
                const relations = [];
                const computed = [];
                const metadata = [];
                const binary = [];
                const other = [];

                fieldNames.forEach(fname => {
                    const field = fields[fname];

                    if (['id', 'display_name', 'name', 'create_date', 'write_date', '__last_update'].includes(fname)) {
                        metadata.push({ name: fname, ...field });
                    } else if (field.type === 'binary' || fname.includes('image')) {
                        binary.push({ name: fname, ...field });
                    } else if (field.type === 'many2one' || field.type === 'many2many' || field.type === 'one2many') {
                        relations.push({ name: fname, ...field });
                    } else if (field.readonly && field.type === 'float' || field.type === 'integer') {
                        computed.push({ name: fname, ...field });
                    } else {
                        core.push({ name: fname, ...field });
                    }
                });

                console.log('CORE FIELDS (string, text, selection, boolean, date, float, integer):');
                core.slice(0, 30).forEach(f => {
                    console.log(`  - ${f.name} (${f.type})${f.required ? ' [required]' : ''} - ${f.string}`);
                });
                if (core.length > 30) console.log(`  ... and ${core.length - 30} more`);

                console.log('\nRELATIONAL FIELDS (many2one, many2many, one2many):');
                relations.slice(0, 20).forEach(f => {
                    console.log(`  - ${f.name} (${f.type}) - ${f.string}`);
                });
                if (relations.length > 20) console.log(`  ... and ${relations.length - 20} more`);

                console.log('\nBINARY/IMAGE FIELDS (skipped):');
                binary.slice(0, 10).forEach(f => {
                    console.log(`  - ${f.name} (${f.type})`);
                });
                if (binary.length > 10) console.log(`  ... and ${binary.length - 10} more`);

            } catch (error) {
                console.error('Error:', error.message);
            }
        }

        process.exit(0);
    })();
});
