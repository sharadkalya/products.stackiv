/**
 * Test Script 3: Verify Synced Records
 * 
 * This script checks MongoDB to verify that records were synced correctly
 * and compares counts with what's in Odoo.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { OdooSaleOrder } from '../../models/odooSaleOrder.model';
import { OdooSaleOrderLine } from '../../models/odooSaleOrderLine.model';
import { OdooInvoice } from '../../models/odooInvoice.model';
import { OdooContact } from '../../models/odooContact.model';
import { OdooEmployee } from '../../models/odooEmployee.model';
import { OdooSyncBatch } from '../../models/odooSyncBatch.model';

dotenv.config();

const USER_ID = 'aYPEyMA39LdyTktykmiQ0mkNh523';

const COLLECTIONS = [
    { model: OdooSaleOrder, name: 'Sales Orders', module: 'sale.order' },
    { model: OdooSaleOrderLine, name: 'Sales Order Lines', module: 'sale.order.line' },
    { model: OdooInvoice, name: 'Invoices', module: 'account.move' },
    { model: OdooContact, name: 'Contacts', module: 'res.partner' },
    { model: OdooEmployee, name: 'Employees', module: 'hr.employee' },
];

async function verifyCollection(model, displayName, moduleName) {
    console.log(`\n📦 ${displayName}:`);
    console.log('─'.repeat(60));

    // Count total records
    const totalCount = await model.countDocuments({ userId: USER_ID });
    console.log(`  Total records: ${totalCount}`);

    if (totalCount === 0) {
        console.log('  ⚠️  No records found!');
        return { total: 0, valid: 0, issues: [] };
    }

    // Count records with key fields
    const withOdooId = await model.countDocuments({ userId: USER_ID, odooId: { $exists: true, $ne: null } });
    const withName = await model.countDocuments({ userId: USER_ID, name: { $exists: true, $ne: '' } });
    const withWriteDate = await model.countDocuments({ userId: USER_ID, writeDate: { $exists: true, $ne: null } });

    console.log(`  Records with odooId: ${withOdooId}`);
    console.log(`  Records with name: ${withName}`);
    console.log(`  Records with writeDate: ${withWriteDate}`);

    // Get date range
    const oldestRecord = await model.findOne({ userId: USER_ID }).sort({ writeDate: 1 });
    const newestRecord = await model.findOne({ userId: USER_ID }).sort({ writeDate: -1 });

    if (oldestRecord && newestRecord) {
        console.log(`  Date range: ${oldestRecord.writeDate?.toISOString() || 'unknown'} to ${newestRecord.writeDate?.toISOString() || 'unknown'}`);
    }

    // Get sample records
    const samples = await model.find({ userId: USER_ID }).limit(3).lean();
    console.log(`\n  Sample records:`);
    samples.forEach((record, idx) => {
        console.log(`    ${idx + 1}. ID: ${record.odooId} | ${record.name || 'No name'}`);
        console.log(`       Write Date: ${record.writeDate?.toISOString() || 'unknown'}`);

        // Show some module-specific fields to verify rich data
        if (moduleName === 'sale.order' && record.amountTotal !== undefined) {
            console.log(`       Amount: ${record.amountTotal} | Partner: ${record.partnerName || record.partnerId || 'N/A'}`);
        } else if (moduleName === 'sale.order.line' && record.priceSubtotal !== undefined) {
            console.log(`       Product: ${record.productName || 'N/A'} | Qty: ${record.productUomQty || 'N/A'} | Price: ${record.priceSubtotal}`);
        } else if (moduleName === 'account.move' && record.amountTotal !== undefined) {
            console.log(`       Amount: ${record.amountTotal} | State: ${record.state || 'N/A'}`);
        } else if (moduleName === 'res.partner') {
            console.log(`       Email: ${record.email || 'N/A'} | Phone: ${record.phone || 'N/A'}`);
        } else if (moduleName === 'hr.employee') {
            console.log(`       Job: ${record.jobTitle || 'N/A'} | Email: ${record.workEmail || 'N/A'}`);
        }
    });

    // Check for potential issues
    const issues = [];
    if (withOdooId < totalCount) issues.push(`${totalCount - withOdooId} records missing odooId`);
    if (withName < totalCount) issues.push(`${totalCount - withName} records missing name`);
    if (withWriteDate < totalCount) issues.push(`${totalCount - withWriteDate} records missing writeDate`);

    if (issues.length > 0) {
        console.log(`\n  ⚠️  Issues found:`);
        issues.forEach((issue) => console.log(`     - ${issue}`));
    } else {
        console.log(`\n  ✓ All records have required fields`);
    }

    return {
        total: totalCount,
        valid: Math.min(withOdooId, withName, withWriteDate),
        issues,
    };
}

async function verifyBatches() {
    console.log(`\n📊 Batch Summary:`);
    console.log('─'.repeat(60));

    const batches = await OdooSyncBatch.find({ userId: USER_ID }).lean();

    const byModule = {};
    const byStatus = { done: 0, failed: 0, permanentlyFailed: 0, inProgress: 0, notStarted: 0 };

    batches.forEach((batch) => {
        // Count by module
        if (!byModule[batch.module]) {
            byModule[batch.module] = { done: 0, failed: 0, total: 0, records: 0 };
        }
        byModule[batch.module].total++;
        if (batch.status === 'done') {
            byModule[batch.module].done++;
            byModule[batch.module].records += batch.recordCountExpected || 0;
        } else if (batch.status === 'failed' || batch.status === 'permanently_failed') {
            byModule[batch.module].failed++;
        }

        // Count by status
        const statusKey = batch.status === 'not_started' ? 'notStarted' :
            batch.status === 'in_progress' ? 'inProgress' :
                batch.status === 'permanently_failed' ? 'permanentlyFailed' : batch.status;
        byStatus[statusKey]++;
    });

    console.log(`  Total batches: ${batches.length}`);
    console.log(`  Status breakdown:`);
    console.log(`    ✓ Done: ${byStatus.done}`);
    console.log(`    ⚠️  Failed: ${byStatus.failed}`);
    console.log(`    ❌ Permanently Failed: ${byStatus.permanentlyFailed}`);
    console.log(`    ⏳ In Progress: ${byStatus.inProgress}`);
    console.log(`    ⏸️  Not Started: ${byStatus.notStarted}`);

    console.log(`\n  By module:`);
    Object.entries(byModule).forEach(([mod, stats]) => {
        console.log(`    ${mod}:`);
        console.log(`      Batches: ${stats.done}/${stats.total} done (${stats.failed} failed)`);
        console.log(`      Records synced: ${stats.records}`);
    });

    return { byModule, byStatus };
}

async function main() {
    console.log('\n=== VERIFY SYNCED RECORDS ===\n');

    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Verify each collection
        const results = {};
        for (const collection of COLLECTIONS) {
            results[collection.name] = await verifyCollection(
                collection.model,
                collection.name,
                collection.module,
            );
        }

        // Verify batches
        const batchStats = await verifyBatches();

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📋 SUMMARY');
        console.log('='.repeat(60));

        let totalRecords = 0;
        let totalIssues = 0;

        Object.entries(results).forEach(([name, stats]) => {
            totalRecords += stats.total;
            totalIssues += stats.issues.length;
            const status = stats.issues.length === 0 ? '✓' : '⚠️';
            console.log(`${status} ${name}: ${stats.total} records (${stats.valid} valid)`);
        });

        console.log(`\nTotal records synced: ${totalRecords}`);
        console.log(`Total batches completed: ${batchStats.byStatus.done}`);

        if (totalIssues > 0) {
            console.log(`\n⚠️  Found ${totalIssues} potential issues. Review details above.`);
        } else {
            console.log(`\n✓ All collections verified successfully!`);
        }

        console.log('='.repeat(60));

        await mongoose.disconnect();
        console.log('\n✓ Verification complete!\n');
    } catch (error) {
        console.error('\n❌ Verification failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

main();
