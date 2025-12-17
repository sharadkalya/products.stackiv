/**
 * Test 2024 Data Sync
 * 
 * The Odoo test data is from December 11, 2024.
 * This script creates batches for that date range explicitly.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { OdooSyncService } from '../../services/odooSync.service';
import { OdooSaleOrder } from '../../models/odooSaleOrder.model';
import { OdooSaleOrderLine } from '../../models/odooSaleOrderLine.model';
import { OdooInvoice } from '../../models/odooInvoice.model';
import { OdooContact } from '../../models/odooContact.model';
import { OdooEmployee } from '../../models/odooEmployee.model';
import { OdooSyncBatch } from '../../models/odooSyncBatch.model';
import { SYNC_CONFIG } from '../../config/sync.config';

dotenv.config();

const USER_ID = 'aYPEyMA39LdyTktykmiQ0mkNh523';

async function clearData() {
    console.log('🗑️  Clearing previous data...');

    const saleOrders = await OdooSaleOrder.deleteMany({ userId: USER_ID });
    const saleOrderLines = await OdooSaleOrderLine.deleteMany({ userId: USER_ID });
    const invoices = await OdooInvoice.deleteMany({ userId: USER_ID });
    const contacts = await OdooContact.deleteMany({ userId: USER_ID });
    const employees = await OdooEmployee.deleteMany({ userId: USER_ID });

    const total = saleOrders.deletedCount + saleOrderLines.deletedCount + invoices.deletedCount + contacts.deletedCount + employees.deletedCount;

    console.log(`   ✓ Cleared ${total} records from collections`);

    await OdooSyncBatch.deleteMany({ userId: USER_ID });
    console.log('   ✓ Cleared all sync batches\n');
}

async function createBatchesFor2024Data() {
    console.log('🔄 Creating batches for December 11, 2025...\n');

    // Dec 11, 2025 data - CSV imports all have write_date on Dec 11, 2025
    const startTime = new Date('2025-12-11T00:00:00Z');
    const endTime = new Date('2025-12-12T00:00:00Z');

    const modules = [
        { name: 'sale.order', displayName: 'Sales Orders' },
        { name: 'sale.order.line', displayName: 'Sales Order Lines' },
        { name: 'account.move', displayName: 'Invoices' },
        { name: 'res.partner', displayName: 'Contacts' },
        { name: 'hr.employee', displayName: 'Employees' }
    ];

    for (const module of modules) {
        await OdooSyncBatch.create({
            userId: USER_ID,
            module: module.name,
            startTime,
            endTime,
            status: 'not_started',
            batchType: 'incremental_sync'
        });
        console.log(`   ✓ Created batch for ${module.displayName} (Dec 11, 2025)`);
    }

    console.log('\n✓ Batches created\n');
}

async function processAllBatches() {
    console.log('🔄 Processing the 5 batches (one per module)...\n');

    const EXPECTED_BATCHES = 5; // sale.order, sale.order.line, account.move, res.partner, hr.employee

    for (let i = 0; i < EXPECTED_BATCHES; i++) {
        console.log(`\n[${i + 1}/${EXPECTED_BATCHES}] Processing batch...`);

        const hasMore = await OdooSyncService.processNextBatch(USER_ID);

        if (!hasMore) {
            console.log(`⚠️  No more batches available after ${i + 1} batches`);
            break;
        }
    }

    console.log('\n\n✓ All 5 initial batches processed!');
}

async function verifyCounts() {
    console.log('\n📊 Final Counts:\n');

    const saleOrders = await OdooSaleOrder.countDocuments({ userId: USER_ID });
    const saleOrderLines = await OdooSaleOrderLine.countDocuments({ userId: USER_ID });
    const invoices = await OdooInvoice.countDocuments({ userId: USER_ID });
    const contacts = await OdooContact.countDocuments({ userId: USER_ID });
    const employees = await OdooEmployee.countDocuments({ userId: USER_ID });

    console.log(`   Sale Orders: ${saleOrders}`);
    console.log(`   Sale Order Lines: ${saleOrderLines}`);
    console.log(`   Invoices: ${invoices}`);
    console.log(`   Contacts: ${contacts}`);
    console.log(`   Employees: ${employees}`);
    console.log(`   TOTAL: ${saleOrders + saleOrderLines + invoices + contacts + employees}`);

    // Check for duplicates
    console.log('\n🔍 Checking for duplicates...\n');

    const checkDuplicates = async (Model, name) => {
        const total = await Model.countDocuments({ userId: USER_ID });
        const unique = await Model.distinct('id', { userId: USER_ID });
        const duplicates = total - unique.length;

        if (duplicates > 0) {
            console.log(`   ⚠️  ${name}: ${duplicates} duplicates (${total} total, ${unique.length} unique)`);
        } else {
            console.log(`   ✓ ${name}: No duplicates (${total} records)`);
        }
    };

    await checkDuplicates(OdooSaleOrder, 'Sale Orders');
    await checkDuplicates(OdooSaleOrderLine, 'Sale Order Lines');
    await checkDuplicates(OdooInvoice, 'Invoices');
    await checkDuplicates(OdooContact, 'Contacts');
    await checkDuplicates(OdooEmployee, 'Employees');
}

async function main() {
    try {
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║ DEC 11, 2025 DATA SYNC TEST                                  ║');
        console.log('╚══════════════════════════════════════════════════════════════╝\n');

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stayinn');
        console.log('✓ Connected\n');

        await clearData();
        await createBatchesFor2024Data();
        await processAllBatches();
        await verifyCounts();

        console.log('\n✅ Test completed!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

main();
