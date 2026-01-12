import mongoose from 'mongoose';
import { OdooSaleOrder } from '@/models/odooSaleOrder.model';
import { OdooSaleOrderLine } from '@/models/odooSaleOrderLine.model';
import { OdooContact } from '@/models/odooContact.model';

async function main() {
    await mongoose.connect('mongodb://localhost:27017/stayinn');
    const USER_ID = 'aYPEyMA39LdyTktykmiQ0mkNh523';

    console.log('Checking Sale Orders...');
    const total = await OdooSaleOrder.countDocuments({ userId: USER_ID });
    const uniqueIds = await OdooSaleOrder.distinct('id', { userId: USER_ID });
    console.log(`  Total: ${total}, Unique IDs: ${uniqueIds.length}`);
    if (total === uniqueIds.length) {
        console.log('  ✓ No duplicates!');
    } else {
        console.log(`  ⚠️  ${total - uniqueIds.length} duplicate records`);
    }

    console.log('\nChecking Sale Order Lines...');
    const totalLines = await OdooSaleOrderLine.countDocuments({ userId: USER_ID });
    const uniqueLineIds = await OdooSaleOrderLine.distinct('id', { userId: USER_ID });
    console.log(`  Total: ${totalLines}, Unique IDs: ${uniqueLineIds.length}`);
    if (totalLines === uniqueLineIds.length) {
        console.log('  ✓ No duplicates!');
    } else {
        console.log(`  ⚠️  ${totalLines - uniqueLineIds.length} duplicate records`);
    }

    console.log('\nChecking Contacts...');
    const totalContacts = await OdooContact.countDocuments({ userId: USER_ID });
    const uniqueContactIds = await OdooContact.distinct('id', { userId: USER_ID });
    console.log(`  Total: ${totalContacts}, Unique IDs: ${uniqueContactIds.length}`);
    if (totalContacts === uniqueContactIds.length) {
        console.log('  ✓ No duplicates!');
    } else {
        console.log(`  ⚠️  ${totalContacts - uniqueContactIds.length} duplicate records`);
    }

    process.exit(0);
}

main();
