import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { OdooSyncService } from './src/services/odooSync.service';
import { OdooSyncBatch } from './src/models/odooSyncBatch.model';
import { OdooEmployee } from './src/models/odooEmployee.model';
import { OdooSaleOrder } from './src/models/odooSaleOrder.model';
import { OdooInvoice } from './src/models/odooInvoice.model';
import { OdooContact } from './src/models/odooContact.model';

dotenv.config();

const USER_ID = 'aYPEyMA39LdyTktykmiQ0mkNh523';

async function runIncrementalSync() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Count records before for all modules
    const beforeCounts = {
        saleOrders: await OdooSaleOrder.countDocuments({ userId: USER_ID }),
        invoices: await OdooInvoice.countDocuments({ userId: USER_ID }),
        contacts: await OdooContact.countDocuments({ userId: USER_ID }),
        employees: await OdooEmployee.countDocuments({ userId: USER_ID }),
    };
    
    console.log('📊 Records before:');
    console.log(`  Sales Orders: ${beforeCounts.saleOrders}`);
    console.log(`  Invoices: ${beforeCounts.invoices}`);
    console.log(`  Contacts: ${beforeCounts.contacts}`);
    console.log(`  Employees: ${beforeCounts.employees}`);
    console.log('');

    // Generate incremental batches
    console.log('🔄 Generating incremental batches...');
    const batchesCreated = await OdooSyncService.generateIncrementalBatches(USER_ID);
    console.log(`✓ Created ${batchesCreated} incremental batches\n`);

    if (batchesCreated === 0) {
        console.log('⚠️  No batches created - may not be time yet or already exists');
        await mongoose.disconnect();
        return;
    }

    // Show the new batches
    const newBatches = await OdooSyncBatch.find({
        userId: USER_ID,
        status: 'not_started'
    }).sort({ createdAt: -1 }).limit(10);

    console.log('📦 New batches created:');
    newBatches.forEach(b => {
        console.log(`  - ${b.module}: ${b.startTime.toISOString()} → ${b.endTime.toISOString()}`);
    });
    console.log('');

    // Process the batches
    console.log('🔄 Processing incremental batches...\n');
    for (let i = 0; i < 20; i++) {
        const hasMore = await OdooSyncService.processNextBatch(USER_ID);
        
        if (!hasMore) {
            console.log('\n✓ All incremental batches processed!');
            break;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Count records after for all modules
    const afterCounts = {
        saleOrders: await OdooSaleOrder.countDocuments({ userId: USER_ID }),
        invoices: await OdooInvoice.countDocuments({ userId: USER_ID }),
        contacts: await OdooContact.countDocuments({ userId: USER_ID }),
        employees: await OdooEmployee.countDocuments({ userId: USER_ID }),
    };
    
    console.log('\n📊 Records after:');
    console.log(`  Sales Orders: ${afterCounts.saleOrders} (${afterCounts.saleOrders > beforeCounts.saleOrders ? '+' : ''}${afterCounts.saleOrders - beforeCounts.saleOrders})`);
    console.log(`  Invoices: ${afterCounts.invoices} (${afterCounts.invoices > beforeCounts.invoices ? '+' : ''}${afterCounts.invoices - beforeCounts.invoices})`);
    console.log(`  Contacts: ${afterCounts.contacts} (${afterCounts.contacts > beforeCounts.contacts ? '+' : ''}${afterCounts.contacts - beforeCounts.contacts})`);
    console.log(`  Employees: ${afterCounts.employees} (${afterCounts.employees > beforeCounts.employees ? '+' : ''}${afterCounts.employees - beforeCounts.employees})`);
    
    // Show changes summary
    const totalChanges = 
        Math.abs(afterCounts.saleOrders - beforeCounts.saleOrders) +
        Math.abs(afterCounts.invoices - beforeCounts.invoices) +
        Math.abs(afterCounts.contacts - beforeCounts.contacts) +
        Math.abs(afterCounts.employees - beforeCounts.employees);
    
    if (totalChanges > 0) {
        console.log(`\n✅ Total records changed: ${totalChanges}`);
        
        // Show recently updated records
        console.log('\n📋 Recently updated records:');
        
        const recentEmployee = await OdooEmployee.findOne({ userId: USER_ID })
            .sort({ updatedAt: -1 })
            .limit(1);
        if (recentEmployee) {
            console.log(`  Employee: ${recentEmployee.name} (${recentEmployee.workEmail || 'N/A'})`);
        }
        
        const recentContact = await OdooContact.findOne({ userId: USER_ID })
            .sort({ updatedAt: -1 })
            .limit(1);
        if (recentContact) {
            console.log(`  Contact: ${recentContact.name} (${recentContact.email || 'N/A'})`);
        }
    } else {
        console.log('\n⚠️  No records changed in incremental sync');
    }

    await mongoose.disconnect();
}

runIncrementalSync().catch(console.error);
