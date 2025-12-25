import { MongoClient } from 'mongodb';
import * as xmlrpc from 'xmlrpc';
import dotenv from 'dotenv';

dotenv.config();

const ODOO_URL = 'http://localhost:8069';
const ODOO_DB = 'odoo_db';
const ODOO_USERNAME = 'admin@test.com';
const ODOO_PASSWORD = 'password';
const MONGODB_URI = process.env.MONGODB_URI;

// Module mapping
const MODULES = [
    { name: 'Companies', odoo: 'res.company', collection: 'odoocompanies' },
    { name: 'Contacts', odoo: 'res.partner', collection: 'odoocontacts' },
    { name: 'Users', odoo: 'res.users', collection: 'odoousers' },
    { name: 'Employees', odoo: 'hr.employee', collection: 'odooemployees' },
    { name: 'Products', odoo: 'product.product', collection: 'odooproducts' },
    { name: 'Product Categories', odoo: 'product.category', collection: 'odooproductcategories' },
    { name: 'CRM Leads', odoo: 'crm.lead', collection: 'odooleads' },
    { name: 'Sales Orders', odoo: 'sale.order', collection: 'odoosaleorders' },
    { name: 'Sale Order Lines', odoo: 'sale.order.line', collection: 'odoosaleorderlines' },
    { name: 'Invoices', odoo: 'account.move', collection: 'odooinvoices' },
    { name: 'Invoice Lines', odoo: 'account.move.line', collection: 'odooinvoicelines' },
    { name: 'Purchase Orders', odoo: 'purchase.order', collection: 'odoopurchaseorders' },
    { name: 'Purchase Order Lines', odoo: 'purchase.order.line', collection: 'odoopurchaseorderlines' },
    { name: 'Journals', odoo: 'account.journal', collection: 'odoojournals' },
    { name: 'Accounts', odoo: 'account.account', collection: 'odooaccounts' },
];

async function authenticateOdoo() {
    return new Promise((resolve, reject) => {
        const client = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/common` });
        client.methodCall('authenticate', [ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {}], (error, userId) => {
            if (error) reject(error);
            else resolve(userId);
        });
    });
}

async function getOdooCount(userId, model) {
    return new Promise((resolve, reject) => {
        const client = xmlrpc.createClient({ url: `${ODOO_URL}/xmlrpc/2/object` });
        client.methodCall('execute_kw', [
            ODOO_DB,
            userId,
            ODOO_PASSWORD,
            model,
            'search_count',
            [[]]
        ], (error, count) => {
            if (error) resolve(0); // Return 0 if module doesn't exist
            else resolve(count);
        });
    });
}

async function verifySync() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              ODOO SYNC VERIFICATION REPORT                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI environment variable not set');
        return;
    }

    // Connect to MongoDB
    const mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db('stayinn');

    // Authenticate with Odoo
    let userId;
    try {
        userId = await authenticateOdoo();
    } catch (error) {
        console.error('❌ Failed to connect to Odoo:', error.message);
        await mongoClient.close();
        return;
    }

    console.log('Module                    │ Odoo  │ MongoDB │ Status');
    console.log('──────────────────────────┼───────┼─────────┼─────────');

    let totalOdoo = 0;
    let totalMongo = 0;
    let matched = 0;

    for (const module of MODULES) {
        const odooCount = await getOdooCount(userId, module.odoo);
        const mongoCount = await db.collection(module.collection).countDocuments();

        totalOdoo += odooCount;
        totalMongo += mongoCount;

        const status = odooCount === mongoCount ? '✅' : (mongoCount > 0 ? '⚠️ ' : '  ');
        if (odooCount === mongoCount && odooCount > 0) matched++;

        const namePadded = module.name.padEnd(25);
        const odooPadded = odooCount.toString().padStart(5);
        const mongoPadded = mongoCount.toString().padStart(7);

        console.log(`${namePadded} │ ${odooPadded} │ ${mongoPadded} │ ${status}`);
    }

    console.log('──────────────────────────┼───────┼─────────┼─────────');
    const totalPadded = 'TOTAL'.padEnd(25);
    const totalOdooPadded = totalOdoo.toString().padStart(5);
    const totalMongoPadded = totalMongo.toString().padStart(7);
    console.log(`${totalPadded} │ ${totalOdooPadded} │ ${totalMongoPadded} │`);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log(`║ Modules in sync: ${matched}/${MODULES.length}`.padEnd(61) + '║');
    console.log(`║ Total records synced: ${totalMongo}/${totalOdoo}`.padEnd(61) + '║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    await mongoClient.close();
}

verifySync().catch(console.error);
