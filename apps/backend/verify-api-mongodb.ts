import mongoose from 'mongoose';
import { config } from 'dotenv';
import { OdooInvoice } from './src/models/odooInvoice.model';
import { OdooSaleOrder } from './src/models/odooSaleOrder.model';
import { OdooSaleOrderLine } from './src/models/odooSaleOrderLine.model';

config();

const API_RESPONSE = {
    "sales": {
        "kpis": {
            "totalSalesLast30Days": 1192567.85,
            "totalSalesMTD": 0,
            "salesGrowthPercentage": 324.46,
            "averageOrderValue": 3871.97,
            "confirmedOrdersCount": 308
        },
        "charts": {
            "monthlySalesTrend": [
                { "month": "2025-07", "revenue": 269875.26 },
                { "month": "2025-08", "revenue": 350550.02 },
                { "month": "2025-09", "revenue": 371496.82 },
                { "month": "2025-10", "revenue": 376300.43 },
                { "month": "2025-11", "revenue": 266090.32 },
                { "month": "2025-12", "revenue": 1219100.85 }
            ]
        }
    },
    "invoices": {
        "kpis": {
            "totalInvoicedAmount": 171529.88,
            "totalInvoicedMTD": 0,
            "totalPaidAmount": 170565.8,
            "totalOutstandingAmount": 964.08,
            "invoicesCount": 55
        },
        "charts": {
            "monthlyInvoicingTrend": [
                { "month": "2025-07", "amount": 36870.83 },
                { "month": "2025-08", "amount": 50937.13 },
                { "month": "2025-09", "amount": 51538.44 },
                { "month": "2025-10", "amount": 47196.16 },
                { "month": "2025-11", "amount": 27440.5 },
                { "month": "2025-12", "amount": 180845.3 }
            ],
            "paidVsUnpaid": {
                "paid": 170565.8,
                "unpaid": 964.08
            }
        }
    }
};

async function verifySalesData() {
    console.log('='.repeat(70));
    console.log('📊 VERIFYING SALES DATA AGAINST MONGODB');
    console.log('='.repeat(70));

    const sampleOrder = await OdooSaleOrder.findOne({ state: { $in: ['sale', 'done'] } });
    const userId = sampleOrder!.userId;

    const to = new Date('2026-01-02T06:29:24.844Z');
    const from = new Date('2025-12-03T06:29:24.844Z');

    console.log(`\n🔍 Testing User: ${userId}`);
    console.log(`📅 Date Range: ${from.toISOString()} to ${to.toISOString()}\n`);

    // 1. Verify total sales last 30 days
    const salesResult = await OdooSaleOrder.aggregate([
        {
            $match: {
                userId,
                state: { $in: ['sale', 'done'] },
                dateOrder: { $gte: from, $lte: to },
            },
        },
        {
            $group: {
                _id: null,
                totalSales: { $sum: '$amountTotal' },
                count: { $sum: 1 },
                avgOrderValue: { $avg: '$amountTotal' },
            },
        },
    ]);

    const dbTotal = Math.round((salesResult[0]?.totalSales || 0) * 100) / 100;
    const dbCount = salesResult[0]?.count || 0;
    const dbAvg = Math.round((salesResult[0]?.avgOrderValue || 0) * 100) / 100;
    const apiTotal = API_RESPONSE.sales.kpis.totalSalesLast30Days;
    const apiCount = API_RESPONSE.sales.kpis.confirmedOrdersCount;
    const apiAvg = API_RESPONSE.sales.kpis.averageOrderValue;

    console.log('1️⃣  Total Sales (Last 30 Days):');
    console.log(`   MongoDB:  $${dbTotal.toLocaleString()}`);
    console.log(`   API:      $${apiTotal.toLocaleString()}`);
    console.log(`   Match:    ${dbTotal === apiTotal ? '✅' : '❌'}`);

    console.log('\n2️⃣  Confirmed Orders Count:');
    console.log(`   MongoDB:  ${dbCount}`);
    console.log(`   API:      ${apiCount}`);
    console.log(`   Match:    ${dbCount === apiCount ? '✅' : '❌'}`);

    console.log('\n3️⃣  Average Order Value:');
    console.log(`   MongoDB:  $${dbAvg.toLocaleString()}`);
    console.log(`   API:      $${apiAvg.toLocaleString()}`);
    console.log(`   Match:    ${dbAvg === apiAvg ? '✅' : '❌'}`);

    // 2. Verify December 2025 sales
    const decStart = new Date('2025-12-01T00:00:00.000Z');
    const decEnd = new Date('2025-12-31T23:59:59.999Z');

    const decResult = await OdooSaleOrder.aggregate([
        {
            $match: {
                userId,
                state: { $in: ['sale', 'done'] },
                dateOrder: { $gte: decStart, $lte: decEnd },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amountTotal' },
            },
        },
    ]);

    const dbDecTotal = Math.round((decResult[0]?.total || 0) * 100) / 100;
    const apiDecTotal = 1219100.85;

    console.log('\n4️⃣  December 2025 Sales:');
    console.log(`   MongoDB:  $${dbDecTotal.toLocaleString()}`);
    console.log(`   API:      $${apiDecTotal.toLocaleString()}`);
    console.log(`   Match:    ${dbDecTotal === apiDecTotal ? '✅' : '❌'}`);

    // 3. Verify top customer (Escobar and Sons)
    const topCustomer = await OdooSaleOrder.aggregate([
        {
            $match: {
                userId,
                state: { $in: ['sale', 'done'] },
                dateOrder: { $gte: from, $lte: to },
                partnerId: 107,
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
    ]);

    if (topCustomer.length > 0) {
        const dbRevenue = Math.round(topCustomer[0].revenue * 100) / 100;
        const apiRevenue = 18564.93;

        console.log('\n5️⃣  Top Customer (Escobar and Sons):');
        console.log(`   MongoDB:  $${dbRevenue.toLocaleString()} (${topCustomer[0].ordersCount} orders)`);
        console.log(`   API:      $${apiRevenue.toLocaleString()} (3 orders)`);
        console.log(`   Match:    ${dbRevenue === apiRevenue ? '✅' : '❌'}`);
    }

    return {
        totalSales: dbTotal === apiTotal,
        ordersCount: dbCount === apiCount,
        avgOrder: dbAvg === apiAvg,
        decemberSales: dbDecTotal === apiDecTotal,
    };
}

async function verifyInvoiceData() {
    console.log('\n' + '='.repeat(70));
    console.log('💰 VERIFYING INVOICE DATA AGAINST MONGODB');
    console.log('='.repeat(70));

    const sampleInvoice = await OdooInvoice.findOne({ state: 'posted' });
    const userId = sampleInvoice!.userId;

    const to = new Date('2026-01-02T06:29:24.844Z');
    const from = new Date('2025-12-03T06:29:24.844Z');

    console.log(`\n🔍 Testing User: ${userId}\n`);

    // 1. Verify total invoiced last 30 days
    const invoiceResult = await OdooInvoice.aggregate([
        {
            $match: {
                userId,
                state: 'posted',
            },
        },
        {
            $addFields: {
                effectiveDate: {
                    $ifNull: ['$invoiceDate', '$createDate'],
                },
            },
        },
        {
            $match: {
                effectiveDate: { $gte: from, $lte: to },
            },
        },
        {
            $group: {
                _id: null,
                totalInvoiced: { $sum: '$amountTotal' },
                count: { $sum: 1 },
            },
        },
    ]);

    const dbTotal = Math.round((invoiceResult[0]?.totalInvoiced || 0) * 100) / 100;
    const dbCount = invoiceResult[0]?.count || 0;
    const apiTotal = API_RESPONSE.invoices.kpis.totalInvoicedAmount;
    const apiCount = API_RESPONSE.invoices.kpis.invoicesCount;

    console.log('1️⃣  Total Invoiced (Last 30 Days):');
    console.log(`   MongoDB:  $${dbTotal.toLocaleString()}`);
    console.log(`   API:      $${apiTotal.toLocaleString()}`);
    console.log(`   Match:    ${dbTotal === apiTotal ? '✅' : '❌'}`);

    console.log('\n2️⃣  Invoice Count:');
    console.log(`   MongoDB:  ${dbCount}`);
    console.log(`   API:      ${apiCount}`);
    console.log(`   Match:    ${dbCount === apiCount ? '✅' : '❌'}`);

    // 2. Verify paid amount
    const paidResult = await OdooInvoice.aggregate([
        {
            $match: {
                userId,
                state: 'posted',
            },
        },
        {
            $addFields: {
                effectiveDate: {
                    $ifNull: ['$invoiceDate', '$createDate'],
                },
            },
        },
        {
            $match: {
                effectiveDate: { $gte: from, $lte: to },
                $or: [
                    { paymentState: 'paid' },
                    { amountResidual: 0 },
                ],
            },
        },
        {
            $group: {
                _id: null,
                totalPaid: { $sum: '$amountTotal' },
            },
        },
    ]);

    const dbPaid = Math.round((paidResult[0]?.totalPaid || 0) * 100) / 100;
    const apiPaid = API_RESPONSE.invoices.kpis.totalPaidAmount;

    console.log('\n3️⃣  Total Paid:');
    console.log(`   MongoDB:  $${dbPaid.toLocaleString()}`);
    console.log(`   API:      $${apiPaid.toLocaleString()}`);
    console.log(`   Match:    ${dbPaid === apiPaid ? '✅' : '❌'}`);

    // 3. Verify outstanding amount
    const outstandingResult = await OdooInvoice.aggregate([
        {
            $match: {
                userId,
                state: 'posted',
            },
        },
        {
            $addFields: {
                effectiveDate: {
                    $ifNull: ['$invoiceDate', '$createDate'],
                },
            },
        },
        {
            $match: {
                effectiveDate: { $gte: from, $lte: to },
                amountResidual: { $gt: 0 },
            },
        },
        {
            $group: {
                _id: null,
                totalOutstanding: { $sum: '$amountResidual' },
            },
        },
    ]);

    const dbOutstanding = Math.round((outstandingResult[0]?.totalOutstanding || 0) * 100) / 100;
    const apiOutstanding = API_RESPONSE.invoices.kpis.totalOutstandingAmount;

    console.log('\n4️⃣  Total Outstanding:');
    console.log(`   MongoDB:  $${dbOutstanding.toLocaleString()}`);
    console.log(`   API:      $${apiOutstanding.toLocaleString()}`);
    console.log(`   Match:    ${dbOutstanding === apiOutstanding ? '✅' : '❌'}`);

    // 4. Verify December 2025 invoices
    const decStart = new Date('2025-12-01T00:00:00.000Z');
    const decEnd = new Date('2025-12-31T23:59:59.999Z');

    const decResult = await OdooInvoice.aggregate([
        {
            $match: {
                userId,
                state: 'posted',
            },
        },
        {
            $addFields: {
                effectiveDate: {
                    $ifNull: ['$invoiceDate', '$createDate'],
                },
            },
        },
        {
            $match: {
                effectiveDate: { $gte: decStart, $lte: decEnd },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amountTotal' },
            },
        },
    ]);

    const dbDecTotal = Math.round((decResult[0]?.total || 0) * 100) / 100;
    const apiDecTotal = 180845.3;

    console.log('\n5️⃣  December 2025 Invoices:');
    console.log(`   MongoDB:  $${dbDecTotal.toLocaleString()}`);
    console.log(`   API:      $${apiDecTotal.toLocaleString()}`);
    console.log(`   Match:    ${dbDecTotal === apiDecTotal ? '✅' : '❌'}`);

    // 5. Verify paid vs unpaid adds up
    const totalCheck = Math.round((dbPaid + dbOutstanding) * 100) / 100;

    console.log('\n6️⃣  Paid + Outstanding = Total:');
    console.log(`   Paid:        $${dbPaid.toLocaleString()}`);
    console.log(`   Outstanding: $${dbOutstanding.toLocaleString()}`);
    console.log(`   Sum:         $${totalCheck.toLocaleString()}`);
    console.log(`   Total:       $${dbTotal.toLocaleString()}`);
    console.log(`   Match:       ${totalCheck === dbTotal ? '✅' : '❌'}`);

    return {
        totalInvoiced: dbTotal === apiTotal,
        invoiceCount: dbCount === apiCount,
        paidAmount: dbPaid === apiPaid,
        outstandingAmount: dbOutstanding === apiOutstanding,
        decemberInvoices: dbDecTotal === apiDecTotal,
        sumCheck: totalCheck === dbTotal,
    };
}

async function verifyRawData() {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 SPOT CHECK: RAW DATA SAMPLES');
    console.log('='.repeat(70));

    const sampleOrder = await OdooSaleOrder.findOne({ state: { $in: ['sale', 'done'] } });
    const userId = sampleOrder!.userId;

    // Check a few random orders
    const randomOrders = await OdooSaleOrder.find({
        userId,
        state: { $in: ['sale', 'done'] },
    }).limit(3).sort({ dateOrder: -1 });

    console.log('\n📋 Sample Sale Orders:');
    randomOrders.forEach((order, i) => {
        console.log(`\n   ${i + 1}. ${order.name}`);
        console.log(`      Partner: ${order.partnerName}`);
        console.log(`      Amount: $${order.amountTotal?.toLocaleString()}`);
        console.log(`      State: ${order.state}`);
        console.log(`      Date: ${order.dateOrder ? order.dateOrder.toISOString().split('T')[0] : 'N/A'}`);
    });

    // Check a few random invoices
    const randomInvoices = await OdooInvoice.find({
        userId,
        state: 'posted',
    }).limit(3).sort({ invoiceDate: -1 });

    console.log('\n\n💰 Sample Invoices:');
    randomInvoices.forEach((invoice, i) => {
        console.log(`\n   ${i + 1}. ${invoice.name}`);
        console.log(`      Partner: ${invoice.partnerName}`);
        console.log(`      Amount: $${invoice.amountTotal?.toLocaleString()}`);
        console.log(`      State: ${invoice.state}`);
        console.log(`      Payment: ${invoice.paymentState}`);
        console.log(`      Residual: $${invoice.amountResidual?.toLocaleString()}`);
        console.log(`      Date: ${invoice.invoiceDate ? invoice.invoiceDate.toISOString().split('T')[0] : 'N/A'}`);
    });
}

async function main() {
    console.log('\n');
    console.log('╔' + '═'.repeat(68) + '╗');
    console.log('║' + ' '.repeat(15) + 'DATA VERIFICATION: API vs MongoDB' + ' '.repeat(20) + '║');
    console.log('╚' + '═'.repeat(68) + '╝');
    console.log('\n');

    try {
        await mongoose.connect(process.env.MONGODB_URI!);

        const salesResults = await verifySalesData();
        const invoiceResults = await verifyInvoiceData();
        await verifyRawData();

        console.log('\n' + '='.repeat(70));
        console.log('📊 VERIFICATION SUMMARY');
        console.log('='.repeat(70));
        console.log('\n✅ Sales Data:');
        console.log(`   - Total Sales (30d):      ${salesResults.totalSales ? '✅' : '❌'} Match`);
        console.log(`   - Orders Count:           ${salesResults.ordersCount ? '✅' : '❌'} Match`);
        console.log(`   - Avg Order Value:        ${salesResults.avgOrder ? '✅' : '❌'} Match`);
        console.log(`   - December 2025 Sales:    ${salesResults.decemberSales ? '✅' : '❌'} Match`);

        console.log('\n💰 Invoice Data:');
        console.log(`   - Total Invoiced (30d):   ${invoiceResults.totalInvoiced ? '✅' : '❌'} Match`);
        console.log(`   - Invoice Count:          ${invoiceResults.invoiceCount ? '✅' : '❌'} Match`);
        console.log(`   - Paid Amount:            ${invoiceResults.paidAmount ? '✅' : '❌'} Match`);
        console.log(`   - Outstanding Amount:     ${invoiceResults.outstandingAmount ? '✅' : '❌'} Match`);
        console.log(`   - December 2025 Invoices: ${invoiceResults.decemberInvoices ? '✅' : '❌'} Match`);
        console.log(`   - Paid + Outstanding:     ${invoiceResults.sumCheck ? '✅' : '❌'} Match`);

        const allMatch = Object.values(salesResults).every(v => v) &&
            Object.values(invoiceResults).every(v => v);

        console.log('\n' + '='.repeat(70));
        if (allMatch) {
            console.log('✅ ALL DATA VERIFIED: API MATCHES MONGODB EXACTLY');
            console.log('\n💡 Next Step: Verify MongoDB data matches Odoo XML-RPC source');
        } else {
            console.log('❌ MISMATCH DETECTED: Some values do not match');
        }
        console.log('='.repeat(70));
        console.log('');

        await mongoose.connection.close();
        process.exit(allMatch ? 0 : 1);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        await mongoose.connection.close();
        process.exit(1);
    }
}

main();
