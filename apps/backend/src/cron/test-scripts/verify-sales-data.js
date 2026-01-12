/**
 * Verify sales data in MongoDB and test aggregations
 * 
 * This script connects directly to MongoDB to verify:
 * 1. Sale orders exist
 * 2. Data quality is good
 * 3. Aggregations produce expected results
 * 
 * Run: npx tsx src/cron/test-scripts/verify-sales-data.js
 */

/* eslint-disable no-console */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function verifySalesData() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    try {
        // Get a sample user ID
        const sampleUser = await mongoose.connection.db
            .collection('odoosaleorders')
            .findOne({}, { projection: { userId: 1 } });

        if (!sampleUser) {
            console.log('❌ No sale orders found in database');
            console.log('💡 Run a sync first to populate data\n');
            await mongoose.disconnect();
            return;
        }

        const userId = sampleUser.userId;
        console.log(`🔍 Testing with userId: ${userId}\n`);

        // 1. Count total sale orders
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 DATABASE OVERVIEW');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const totalOrders = await mongoose.connection.db
            .collection('odoosaleorders')
            .countDocuments({ userId });
        console.log(`Total Sale Orders: ${totalOrders}`);

        const confirmedOrders = await mongoose.connection.db
            .collection('odoosaleorders')
            .countDocuments({ userId, state: { $in: ['sale', 'done'] } });
        console.log(`Confirmed Orders: ${confirmedOrders}`);

        const totalLines = await mongoose.connection.db
            .collection('odoosaleorderlines')
            .countDocuments({ userId });
        console.log(`Total Sale Order Lines: ${totalLines}\n`);

        // 2. Check date range of orders
        const dateRange = await mongoose.connection.db
            .collection('odoosaleorders')
            .aggregate([
                { $match: { userId } },
                {
                    $group: {
                        _id: null,
                        minDate: { $min: '$dateOrder' },
                        maxDate: { $max: '$dateOrder' },
                    },
                },
            ])
            .toArray();

        if (dateRange[0]) {
            console.log('Date Range:');
            console.log(`  Oldest Order: ${new Date(dateRange[0].minDate).toISOString().split('T')[0]}`);
            console.log(`  Newest Order: ${new Date(dateRange[0].maxDate).toISOString().split('T')[0]}\n`);
        }

        // 3. Check states distribution
        console.log('Order States:');
        const states = await mongoose.connection.db
            .collection('odoosaleorders')
            .aggregate([
                { $match: { userId } },
                { $group: { _id: '$state', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ])
            .toArray();

        states.forEach((s) => {
            console.log(`  ${s._id || 'null'}: ${s.count}`);
        });
        console.log('');

        // 4. Test KPI calculations
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📈 KPI CALCULATIONS (Last 30 Days)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Total Sales Last 30 Days
        const salesResult = await mongoose.connection.db
            .collection('odoosaleorders')
            .aggregate([
                {
                    $match: {
                        userId,
                        state: { $in: ['sale', 'done'] },
                        dateOrder: { $gte: last30Days, $lte: now },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: '$amountTotal' },
                        avgOrderValue: { $avg: '$amountTotal' },
                        count: { $sum: 1 },
                    },
                },
            ])
            .toArray();

        if (salesResult[0]) {
            console.log(`Total Sales: $${salesResult[0].totalSales?.toFixed(2) || 0}`);
            console.log(`Average Order Value: $${salesResult[0].avgOrderValue?.toFixed(2) || 0}`);
            console.log(`Confirmed Orders: ${salesResult[0].count}`);
        } else {
            console.log('No sales in last 30 days');
        }
        console.log('');

        // 5. Test Monthly Trend
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 MONTHLY SALES TREND (Last 6 Months)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyTrend = await mongoose.connection.db
            .collection('odoosaleorders')
            .aggregate([
                {
                    $match: {
                        userId,
                        state: { $in: ['sale', 'done'] },
                        dateOrder: { $gte: sixMonthsAgo, $lte: now },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$dateOrder' },
                            month: { $month: '$dateOrder' },
                        },
                        revenue: { $sum: '$amountTotal' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ])
            .toArray();

        if (monthlyTrend.length > 0) {
            monthlyTrend.forEach((month) => {
                const monthStr = `${month._id.year}-${String(month._id.month).padStart(2, '0')}`;
                console.log(`${monthStr}: $${month.revenue.toFixed(2)} (${month.count} orders)`);
            });
        } else {
            console.log('No data for monthly trend');
        }
        console.log('');

        // 6. Test Top Customers
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👥 TOP 5 CUSTOMERS (Last 30 Days)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const topCustomers = await mongoose.connection.db
            .collection('odoosaleorders')
            .aggregate([
                {
                    $match: {
                        userId,
                        state: { $in: ['sale', 'done'] },
                        dateOrder: { $gte: last30Days, $lte: now },
                        partnerId: { $exists: true, $ne: null },
                    },
                },
                {
                    $group: {
                        _id: '$partnerId',
                        partnerName: { $first: '$partnerName' },
                        revenue: { $sum: '$amountTotal' },
                        ordersCount: { $sum: 1 },
                    },
                },
                { $sort: { revenue: -1 } },
                { $limit: 5 },
            ])
            .toArray();

        if (topCustomers.length > 0) {
            topCustomers.forEach((customer, i) => {
                console.log(
                    `${i + 1}. ${customer.partnerName || 'Unknown'}: $${customer.revenue.toFixed(2)} (${customer.ordersCount} orders)`,
                );
            });
        } else {
            console.log('No customer data available');
        }
        console.log('');

        // 7. Test Top Products
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🏷️  TOP 5 PRODUCTS (Last 30 Days)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Get order IDs from last 30 days
        const recentOrderIds = await mongoose.connection.db
            .collection('odoosaleorders')
            .find(
                {
                    userId,
                    state: { $in: ['sale', 'done'] },
                    dateOrder: { $gte: last30Days, $lte: now },
                },
                { projection: { odooId: 1 } },
            )
            .toArray();

        const orderIdsList = recentOrderIds.map((o) => o.odooId);

        if (orderIdsList.length > 0) {
            const topProducts = await mongoose.connection.db
                .collection('odoosaleorderlines')
                .aggregate([
                    {
                        $match: {
                            userId,
                            orderId: { $in: orderIdsList },
                            productId: { $exists: true, $ne: null },
                            state: { $in: ['sale', 'done'] },
                        },
                    },
                    {
                        $group: {
                            _id: '$productId',
                            productName: { $first: '$productName' },
                            revenue: { $sum: '$priceSubtotal' },
                            quantitySold: { $sum: '$productUomQty' },
                        },
                    },
                    { $sort: { revenue: -1 } },
                    { $limit: 5 },
                ])
                .toArray();

            if (topProducts.length > 0) {
                topProducts.forEach((product, i) => {
                    console.log(
                        `${i + 1}. ${product.productName || 'Unknown'}: $${product.revenue.toFixed(2)} (${product.quantitySold.toFixed(0)} units)`,
                    );
                });
            } else {
                console.log('No product data available');
            }
        } else {
            console.log('No orders in last 30 days to analyze products');
        }
        console.log('');

        // 8. Data quality check
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ DATA QUALITY CHECK');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const nullDateOrders = await mongoose.connection.db
            .collection('odoosaleorders')
            .countDocuments({ userId, dateOrder: null });
        console.log(`Orders with null dateOrder: ${nullDateOrders}`);

        const nullAmountOrders = await mongoose.connection.db
            .collection('odoosaleorders')
            .countDocuments({ userId, amountTotal: null });
        console.log(`Orders with null amountTotal: ${nullAmountOrders}`);

        const nullStateOrders = await mongoose.connection.db
            .collection('odoosaleorders')
            .countDocuments({ userId, state: null });
        console.log(`Orders with null state: ${nullStateOrders}`);

        console.log('');

        if (nullDateOrders === 0 && nullAmountOrders === 0 && nullStateOrders === 0) {
            console.log('✅ All critical fields are populated!');
        } else {
            console.log('⚠️  Some orders have missing critical fields');
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ VERIFICATION COMPLETE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('💡 Next steps:');
        console.log('   1. Start the backend server: yarn dev');
        console.log('   2. Get your JWT token from browser cookies');
        console.log('   3. Update test-sales-dashboard.js with the token');
        console.log('   4. Run: npx tsx src/cron/test-scripts/test-sales-dashboard.js\n');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verifySalesData();
