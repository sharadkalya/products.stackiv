/**
 * Quick test to verify which fields exist for sale.order
 */

const xmlrpc = require('xmlrpc');

const ODOO_URL = 'http://localhost:8069';
const DB_NAME = 'odoo_db';
const USERNAME = 'admin@test.com';
const PASSWORD = 'password';

async function authenticate() {
    return new Promise((resolve, reject) => {
        const client = xmlrpc.createClient({
            url: `${ODOO_URL}/xmlrpc/2/common`,
        });
        client.methodCall('authenticate', [DB_NAME, USERNAME, PASSWORD, {}], (error, uid) => {
            if (error) reject(error);
            else resolve(uid);
        });
    });
}

async function testFields(uid, fields) {
    return new Promise((resolve, reject) => {
        const client = xmlrpc.createClient({
            url: `${ODOO_URL}/xmlrpc/2/object`,
        });

        const domain = [['id', '>', 0]];

        client.methodCall(
            'execute_kw',
            [DB_NAME, uid, PASSWORD, 'sale.order', 'search_read', [domain, fields], { limit: 1 }],
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
    console.log('Testing fields...\n');

    const uid = await authenticate();
    console.log('✓ Authenticated\n');

    // Test sale.order fields
    console.log('sale.order:');
    const saleOrderFields = ['picking_ids', 'delivery_count', 'signed_by', 'signed_on'];
    for (const field of saleOrderFields) {
        try {
            await testFields(uid, ['id', field]);
            console.log(`  ✓ ${field}`);
        } catch (error) {
            console.log(`  ✗ ${field}`);
        }
    }

    // Test account.move fields
    console.log('\naccount.move:');
    const invoiceFields = [
        'payment_id', 'l10n_in_gst_treatment', 'l10n_in_state_id',
        'invoice_payment_term_id', 'invoice_payment_ref', 'payment_reference',
        'invoice_origin', 'invoice_source_email', 'invoice_partner_display_name',
        'to_check'
    ];
    const invoiceClient = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/object` });
    for (const field of invoiceFields) {
        try {
            await new Promise((resolve, reject) => {
                invoiceClient.methodCall(
                    'execute_kw',
                    [DB_NAME, uid, PASSWORD, 'account.move', 'search_read', [[['id', '>', 0]], ['id', field]], { limit: 1 }],
                    (error) => { if (error) reject(error); else resolve(); }
                );
            });
            console.log(`  ✓ ${field}`);
        } catch (error) {
            console.log(`  ✗ ${field}`);
        }
    }

    // Test res.partner fields
    console.log('\nres.partner:');
    const partnerFields = [
        'partner_latitude', 'partner_longitude', 'property_account_position_id',
        'property_payment_term_id', 'property_supplier_payment_term_id',
        'property_account_receivable_id', 'property_account_payable_id'
    ];
    const partnerClient = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/object` });
    for (const field of partnerFields) {
        try {
            await new Promise((resolve, reject) => {
                partnerClient.methodCall(
                    'execute_kw',
                    [DB_NAME, uid, PASSWORD, 'res.partner', 'search_read', [[['id', '>', 0]], ['id', field]], { limit: 1 }],
                    (error) => { if (error) reject(error); else resolve(); }
                );
            });
            console.log(`  ✓ ${field}`);
        } catch (error) {
            console.log(`  ✗ ${field}`);
        }
    }

    // Test hr.employee fields
    console.log('\nhr.employee:');
    const employeeFields = [
        'identification_id', 'passport_id', 'work_permit_expiration_date',
        'visa_no', 'visa_expire', 'certificate', 'study_field', 'study_school',
        'emergency_contact', 'emergency_phone', 'km_home_work', 'bank_account_id'
    ];
    const employeeClient = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/object` });
    for (const field of employeeFields) {
        try {
            await new Promise((resolve, reject) => {
                employeeClient.methodCall(
                    'execute_kw',
                    [DB_NAME, uid, PASSWORD, 'hr.employee', 'search_read', [[['id', '>', 0]], ['id', field]], { limit: 1 }],
                    (error) => { if (error) reject(error); else resolve(); }
                );
            });
            console.log(`  ✓ ${field}`);
        } catch (error) {
            console.log(`  ✗ ${field}`);
        }
    }
}

main().catch(console.error);
