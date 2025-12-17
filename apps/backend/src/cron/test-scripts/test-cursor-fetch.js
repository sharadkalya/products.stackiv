/**
 * Quick test to debug cursor pagination
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { OdooClientService } from '@/services/odooClient.service';
import { OdooConnectionDetails } from '@/models/odoo.model';

dotenv.config();

const USER_ID = 'aYPEyMA39LdyTktykmiQ0mkNh523';

async function main() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected\n');

    // Get connection details
    const connectionDetails = await OdooConnectionDetails.findOne({ userId: USER_ID });
    if (!connectionDetails) {
        throw new Error('No connection details found');
    }

    const conn = {
        odooUrl: connectionDetails.odooUrl,
        dbName: connectionDetails.dbName,
        username: connectionDetails.username,
        password: connectionDetails.password,
    };

    console.log('🔄 Testing cursor fetch for sale.order...\n');

    const now = new Date();
    const startTime = new Date(now);
    startTime.setDate(now.getDate() - 14); // 14 days ago

    console.log(`Window: ${startTime.toISOString()} to ${now.toISOString()}\n`);

    try {
        const records = await OdooClientService.fetchAllRecordsForWindowWithCursor(
            conn,
            'sale.order',
            startTime,
            now,
        );

        console.log(`\n✓ Successfully fetched ${records.length} records`);

        if (records.length > 0) {
            console.log(`\nFirst record: id=${records[0].id}, write_date=${records[0].write_date}`);
            console.log(`Last record: id=${records[records.length - 1].id}, write_date=${records[records.length - 1].write_date}`);

            // Check for duplicates
            const ids = records.map(r => r.id);
            const uniqueIds = new Set(ids);
            if (ids.length !== uniqueIds.size) {
                console.error(`\n⚠️  DUPLICATES DETECTED! ${ids.length} records but only ${uniqueIds.size} unique IDs`);
            } else {
                console.log(`\n✓ No duplicates: all ${ids.length} records have unique IDs`);
            }
        }
    } catch (error) {
        console.error('\n✗ Error:', error.message);
        console.error(error.stack);
    }

    await mongoose.disconnect();
}

main().catch(console.error);
