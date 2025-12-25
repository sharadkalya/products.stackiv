import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function clearData() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

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

    for (const col of collections) {
        const result = await mongoose.connection.db.collection(col).deleteMany({});
        console.log(`✓ Cleared ${col}: ${result.deletedCount} docs`);
    }

    // Reset sync status to restart from beginning
    const status = await mongoose.connection.db.collection('odoosyncstatuses').findOne({});
    if (status) {
        await mongoose.connection.db.collection('odoosyncbatches').deleteMany({});
        console.log('✓ Cleared all sync batches');
        await mongoose.connection.db.collection('odoosyncstatuses').updateMany({}, { $set: { status: 'idle', currentBatchId: null } });
        console.log('✓ Reset sync statuses to idle');
    }

    await mongoose.disconnect();
    console.log('✓ Done - ready for fresh sync with comprehensive fields');
}

clearData().catch(console.error);
