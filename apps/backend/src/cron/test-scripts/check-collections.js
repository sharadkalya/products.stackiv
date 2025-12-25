import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function checkCollections() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const collections = [
        'odoocompanies',
        'odoocontacts',
        'odoousers',
        'odooemployees',
        'odooproducts',
        'odooproductcategories',
        'odooleads',
        'odoosaleorders',
        'odoosaleorderlines',
        'odooinvoices',
        'odooinvoicelines',
        'odoopurchaseorders',
        'odoopurchaseorderlines',
        'odoojournals',
        'odooaccounts'
    ];

    console.log('📊 Current MongoDB Collection Counts:\n');
    let total = 0;
    
    for (const col of collections) {
        const count = await mongoose.connection.db.collection(col).countDocuments({});
        if (count > 0) {
            console.log(`   ${col.padEnd(25)} ${count.toLocaleString()}`);
            total += count;
        }
    }
    
    console.log(`\n   TOTAL: ${total.toLocaleString()} records`);

    // Check batches
    const batches = await mongoose.connection.db.collection('odoosyncbatches').countDocuments({});
    const batchesByStatus = await mongoose.connection.db.collection('odoosyncbatches').aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    
    console.log(`\n📦 Sync Batches: ${batches} total`);
    if (batchesByStatus.length > 0) {
        for (const { _id, count } of batchesByStatus) {
            console.log(`   ${_id}: ${count}`);
        }
    }

    await mongoose.disconnect();
}

checkCollections().catch(console.error);
