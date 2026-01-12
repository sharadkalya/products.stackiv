import { connectDB } from '@/db';
import { OdooSaleOrder } from '@/models/odooSaleOrder.model';

async function checkMTD() {
    await connectDB();

    // First, find actual userId in database
    const sample = await OdooSaleOrder.findOne({ state: 'sale' }).select('userId');
    const actualUserId = sample?.userId;

    console.log('Found userId in database:', actualUserId);
    console.log('');

    if (!actualUserId) {
        console.log('❌ No sale orders found in database');
        process.exit(1);
    }

    // Check December 2025
    const startOfDec2025 = new Date('2025-12-01T00:00:00Z');
    const endOfDec2025 = new Date('2025-12-11T23:59:59Z');

    console.log('Checking December 2025 MTD data...');
    console.log('Start:', startOfDec2025.toISOString());
    console.log('End:', endOfDec2025.toISOString());
    console.log('');

    const result = await OdooSaleOrder.aggregate([
        {
            $match: {
                userId: actualUserId,
                state: { $in: ['sale', 'done'] },
                dateOrder: { $gte: startOfDec2025, $lte: endOfDec2025 },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amountTotal' },
                count: { $sum: 1 },
            },
        },
    ]);

    console.log('December 2025 MTD Result:', result);

    if (result.length > 0) {
        console.log('');
        console.log('✅ Total Sales in December 2025 (through Dec 11):', result[0].total);
        console.log('✅ Total Orders in December 2025:', result[0].count);
    } else {
        console.log('❌ No December 2025 data found');
    }

    process.exit(0);
}

checkMTD();
