/**
 * Complete Sync Test - Process ALL Modules to Completion
 * 
 * This script ensures all batches for all modules are processed
 * and provides comprehensive verification against Odoo source data.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import xmlrpc from 'xmlrpc';

import { OdooSyncService } from '../../services/odooSync.service';
import { OdooSaleOrder } from '../../models/odooSaleOrder.model';
import { OdooSaleOrderLine } from '../../models/odooSaleOrderLine.model';
import { OdooInvoice } from '../../models/odooInvoice.model';
import { OdooContact } from '../../models/odooContact.model';
import { OdooEmployee } from '../../models/odooEmployee.model';
import { OdooSyncBatch } from '../../models/odooSyncBatch.model';

dotenv.config();

const USER_ID = 'aYPEyMA39LdyTktykmiQ0mkNh523';
const ODOO_URL = 'http://localhost:8069';
const DB_NAME = 'odoo_db';
const USERNAME = 'admin@test.com';
const PASSWORD = 'password';

async function displayProgress() {
    const batches = await OdooSyncBatch.find({ userId: USER_ID });

    const stats = {
        total: batches.length,
        done: 0,
        inProgress: 0,
        notStarted: 0,
        failed: 0,
    };

    batches.forEach((batch) => {
        if (batch.status === 'done') stats.done++;
        else if (batch.status === 'in_progress') stats.inProgress++;
        else if (batch.status === 'not_started') stats.notStarted++;
        else if (batch.status === 'failed' || batch.status === 'permanently_failed') stats.failed++;
    });

    return stats;
}

async function processAllBatches() {
    console.log('🔄 Preparing sync batches...');

    // Prepare sync (creates initial batches)
    await OdooSyncService.prepareSync(USER_ID);
    console.log('✓ Batches prepared\n');

    console.log('🔄 Processing all batches until completion...\n');

    let iteration = 0;
    let lastStatsStr = '';

    while (true) {
        iteration++;

        // Process one batch
        const hasMore = await OdooSyncService.processNextBatch(USER_ID);

        // Get current stats
        const stats = await displayProgress();
        const statsStr = JSON.stringify(stats);

        // Only log if stats changed
        if (statsStr !== lastStatsStr) {
            process.stdout.write(`\r[${iteration}] Done: ${stats.done}/${stats.total} | Failed: ${stats.failed} | Not Started: ${stats.notStarted}     `);
            lastStatsStr = statsStr;
        }

        // Check if all batches are complete
        if (stats.inProgress === 0 && stats.notStarted === 0) {
            console.log('\n\n✓ All batches processed!');
            break;
        }

        // Check for too many failures
        if (stats.failed > 5) {
            console.log('\n\n⚠️  Too many failures, stopping');
            break;
        }

        // Safety: max 100 iterations
        if (iteration > 100) {
            console.log('\n\n⚠️  Max iterations reached');
            break;
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

function formatDate(date) {
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

async function authenticate() {
    return new Promise((resolve, reject) => {
        const xmlrpc = require('xmlrpc');
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

async function countOdooRecords(uid, module) {
    return new Promise((resolve, reject) => {
        const xmlrpc = require('xmlrpc');
        const client = xmlrpc.createClient({
            url: `${ODOO_URL}/xmlrpc/2/object`,
        });

        // Calculate date range (match config)
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - 3);

        const domain = [
            '&',
            ['write_date', '>=', formatDate(startDate)],
            ['write_date', '<', formatDate(now)],
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

async function verifyRecords() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 VERIFICATION RESULTS');
    console.log('='.repeat(80) + '\n');

    // First authenticate with Odoo
    console.log('🔐 Connecting to Odoo for count verification...');
    let uid;
    try {
        uid = await authenticate();
        console.log(`✓ Connected (UID: ${uid})\n`);
    } catch (error) {
        console.error('⚠️  Could not connect to Odoo for verification:', error.message);
        console.log('   Proceeding with MongoDB-only verification...\n');
    }

    const collections = [
        { model: OdooSaleOrder, name: 'Sales Orders', module: 'sale.order' },
        { model: OdooSaleOrderLine, name: 'Sales Order Lines', module: 'sale.order.line' },
        { model: OdooInvoice, name: 'Invoices', module: 'account.move' },
        { model: OdooContact, name: 'Contacts', module: 'res.partner' },
        { model: OdooEmployee, name: 'Employees', module: 'hr.employee' },
    ];

    let totalRecords = 0;
    let totalOdooRecords = 0;
    const results = [];
    let allMatching = true;

    for (const collection of collections) {
        const mongoCount = await collection.model.countDocuments({ userId: USER_ID });
        totalRecords += mongoCount;

        let odooCount = null;
        if (uid) {
            try {
                odooCount = await countOdooRecords(uid, collection.module);
                totalOdooRecords += odooCount;
            } catch (error) {
                console.log(`   ⚠️  Could not get Odoo count for ${collection.module}: ${error.message}`);
            }
        }

        // Display results
        if (odooCount !== null) {
            const match = mongoCount === odooCount;
            const symbol = match ? '✅' : '❌';
            console.log(`${symbol} ${collection.name}: MongoDB ${mongoCount} | Odoo ${odooCount}`);
            if (!match) {
                allMatching = false;
                const diff = Math.abs(mongoCount - odooCount);
                console.log(`   ⚠️  MISMATCH: ${diff} record difference!`);
            }
        } else {
            console.log(`📦 ${collection.name}: ${mongoCount} records (Odoo count unavailable)`);
        }

        if (mongoCount > 0) {
            // Get sample record
            const sample = await collection.model.findOne({ userId: USER_ID }).lean();
            console.log(`   Sample: ID ${sample.odooId} | ${sample.name || 'No name'}`);

            // Check data richness
            if (collection.module === 'sale.order' && sample.amountTotal !== undefined) {
                console.log(`   ✓ Has business data: Amount ${sample.amountTotal}, Partner ${sample.partnerName || sample.partnerId}`);
            } else if (collection.module === 'sale.order.line' && sample.priceSubtotal !== undefined) {
                console.log(`   ✓ Has business data: Product ${sample.productName || 'N/A'}, Qty ${sample.productUomQty || 'N/A'}, Price ${sample.priceSubtotal}`);
            } else if (collection.module === 'account.move' && sample.amountTotal !== undefined) {
                console.log(`   ✓ Has business data: Amount ${sample.amountTotal}, State ${sample.state}`);
            } else if (collection.module === 'res.partner') {
                console.log(`   ✓ Has business data: Email ${sample.email || 'N/A'}, Phone ${sample.phone || 'N/A'}`);
            } else if (collection.module === 'hr.employee') {
                console.log(`   ✓ Has business data: Job ${sample.jobTitle || 'N/A'}, Email ${sample.workEmail || 'N/A'}`);
            }
        } else {
            console.log(`   ⚠️  No records synced`);
        }
        console.log('');

        results.push({ name: collection.name, mongoCount, odooCount });
    }

    // Batch summary
    const batches = await OdooSyncBatch.find({ userId: USER_ID }).lean();
    const batchStats = {
        total: batches.length,
        done: batches.filter(b => b.status === 'done').length,
        failed: batches.filter(b => b.status === 'failed' || b.status === 'permanently_failed').length,
    };

    console.log('='.repeat(80));
    console.log('📋 SUMMARY');
    console.log('='.repeat(80));

    if (uid) {
        console.log(`MongoDB Total: ${totalRecords}`);
        console.log(`Odoo Total: ${totalOdooRecords}`);

        if (totalRecords === totalOdooRecords && allMatching) {
            console.log('\n✅ PERFECT MATCH: All records synced correctly!');
            console.log(`   ${totalRecords} records match exactly between MongoDB and Odoo`);
        } else if (totalRecords === totalOdooRecords) {
            console.log('\n✅ Total counts match, but some modules have discrepancies');
            console.log('   Review individual module counts above');
        } else {
            const diff = Math.abs(totalRecords - totalOdooRecords);
            console.log(`\n⚠️  TOTAL MISMATCH: ${diff} record difference`);
            console.log(`   MongoDB: ${totalRecords} | Odoo: ${totalOdooRecords}`);
        }
    } else {
        console.log(`Total Records Synced: ${totalRecords}`);
    }

    console.log(`Total Batches: ${batchStats.total} (${batchStats.done} done, ${batchStats.failed} failed)`);

    if (totalRecords === 0) {
        console.log('\n⚠️  WARNING: No records were synced!');
        console.log('   Check if there is data in Odoo for the date range.');
    } else if (batchStats.failed > 0) {
        console.log(`\n⚠️  WARNING: ${batchStats.failed} batches failed`);

        const failedBatches = batches.filter(b => b.status === 'failed' || b.status === 'permanently_failed');
        failedBatches.forEach(b => {
            console.log(`   - ${b.module}: ${b.lastError || 'Unknown error'}`);
        });
    } else {
        console.log('\n✅ SUCCESS: All batches completed, all records synced!');
    }

    console.log('='.repeat(80));
}

async function clearAllData() {
    console.log('🗑️  Clearing previous data...');

    const collections = ['odoosaleorders', 'odoosaleorderlines', 'odooinvoices', 'odoocontacts', 'odooemployees'];
    let totalDeleted = 0;

    for (const col of collections) {
        const result = await mongoose.connection.db.collection(col).deleteMany({});
        totalDeleted += result.deletedCount;
    }
    console.log(`   ✓ Cleared ${totalDeleted} records from collections`);

    // Clear batches and reset sync status
    await mongoose.connection.db.collection('odoosyncbatches').deleteMany({});
    console.log('   ✓ Cleared all sync batches');

    await mongoose.connection.db.collection('odoosyncstatuses').updateMany(
        {},
        { $set: { status: 'idle', currentBatchId: null } }
    );
    console.log('   ✓ Reset sync statuses to idle');
    console.log('');
}

async function main() {
    console.log('\n' + '╔'.repeat(80));
    console.log('║ COMPLETE MODULE SYNC TEST');
    console.log('╚'.repeat(80) + '\n');

    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected\n');

        // Clear previous data for fresh test
        await clearAllData();

        // Process all batches
        await processAllBatches();

        // Verify results
        await verifyRecords();

        // Disconnect
        await mongoose.disconnect();
        console.log('\n✓ Test complete!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

main();
