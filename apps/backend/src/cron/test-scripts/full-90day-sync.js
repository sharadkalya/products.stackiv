import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { OdooSyncService } from '../../services/odooSync.service.ts';
import { OdooSyncStatus } from '../../models/odooSyncStatus.model.ts';
import { OdooSyncBatch } from '../../models/odooSyncBatch.model.ts';

dotenv.config();

const TEST_USER_ID = 'aYPEyMA39LdyTktykmiQ0mkNh523';

async function runFullSync() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║ FULL 90-DAY SYNC TEST - ALL 15 MODULES                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Step 1: Prepare sync (creates batches for 90 days)
    console.log('📋 Step 1: Preparing sync (creating batches for last 90 days)...\n');
    await OdooSyncService.prepareSync(TEST_USER_ID);

    const totalBatches = await OdooSyncBatch.countDocuments({ userId: TEST_USER_ID });
    console.log(`✓ Created ${totalBatches} batches\n`);

    // Step 2: Process all batches
    console.log('🔄 Step 2: Processing all batches...\n');

    let processed = 0;
    let batchNumber = 0;

    while (true) {
        const result = await OdooSyncService.processNextBatch(TEST_USER_ID);
        if (!result) break;

        batchNumber++;
        processed++;

        if (batchNumber % 10 === 0) {
            const remaining = await OdooSyncBatch.countDocuments({
                userId: TEST_USER_ID,
                status: 'not_started'
            });
            console.log(`[${batchNumber}/${totalBatches}] Processed ${processed} batches, ${remaining} remaining...`);
        }
    }

    console.log(`\n✓ All batches processed!\n`);

    // Step 3: Check sync status
    const syncStatus = await OdooSyncStatus.findOne({ userId: TEST_USER_ID });
    console.log('📊 Sync Status:');
    console.log(`   Status: ${syncStatus.syncStatus}`);
    console.log(`   Initial Sync Done: ${syncStatus.initialSyncDone}`);
    console.log(`   Has Failed Batches: ${syncStatus.hasFailedBatches || false}`);
    console.log(`   Last Completed Window: ${syncStatus.lastCompletedWindowEnd}\n`);

    // Step 4: Show collection counts
    const collections = [
        { name: 'odoocompanies', label: 'Companies' },
        { name: 'odoocontacts', label: 'Contacts' },
        { name: 'odoousers', label: 'Users' },
        { name: 'odooemployees', label: 'Employees' },
        { name: 'odooproducts', label: 'Products' },
        { name: 'odooproductcategories', label: 'Product Categories' },
        { name: 'odooleads', label: 'CRM Leads' },
        { name: 'odoosaleorders', label: 'Sales Orders' },
        { name: 'odoosaleorderlines', label: 'Sale Order Lines' },
        { name: 'odooinvoices', label: 'Invoices' },
        { name: 'odooinvoicelines', label: 'Invoice Lines' },
        { name: 'odoopurchaseorders', label: 'Purchase Orders' },
        { name: 'odoopurchaseorderlines', label: 'Purchase Order Lines' },
        { name: 'odoojournals', label: 'Journals' },
        { name: 'odooaccounts', label: 'Accounts' }
    ];

    console.log('�� Final Collection Counts:\n');
    let total = 0;

    for (const { name, label } of collections) {
        const count = await mongoose.connection.db.collection(name).countDocuments({});
        console.log(`   ${label.padEnd(25)} ${count.toLocaleString()}`);
        total += count;
    }

    console.log(`\n   TOTAL: ${total.toLocaleString()} records\n`);

    // Step 5: Check for failed batches
    const failedBatches = await OdooSyncBatch.find({
        userId: TEST_USER_ID,
        status: { $in: ['failed', 'permanently_failed'] }
    });

    if (failedBatches.length > 0) {
        console.log('⚠️  Failed Batches:\n');
        for (const batch of failedBatches) {
            console.log(`   Module: ${batch.module}`);
            console.log(`   Window: ${batch.startTime} → ${batch.endTime}`);
            console.log(`   Error: ${batch.lastError}\n`);
        }
    } else {
        console.log('✅ No failed batches!\n');
    }

    await mongoose.disconnect();
    console.log('✓ Sync test completed!');
}

runFullSync().catch(console.error);
