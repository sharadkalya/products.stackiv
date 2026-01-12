import mongoose from 'mongoose';
import { config } from 'dotenv';
import { OdooInvoice } from './src/models/odooInvoice.model';
import { OdooSaleOrder } from './src/models/odooSaleOrder.model';
import { InvoiceDashboardService } from './src/services/invoices/invoiceDashboard.service';
import { SalesDashboardService } from './src/services/salesDashboard.service';

config();

async function verifyDatabase() {
    console.log('='.repeat(60));
    console.log('🗄️  DATABASE VERIFICATION');
    console.log('='.repeat(60));

    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('✅ MongoDB Atlas connected\n');

        // Check invoices
        const totalInvoices = await OdooInvoice.countDocuments();
        const postedInvoices = await OdooInvoice.countDocuments({ state: 'posted' });

        console.log('📄 Invoice Data:');
        console.log(`   Total invoices: ${totalInvoices}`);
        console.log(`   Posted invoices: ${postedInvoices}`);

        if (postedInvoices > 0) {
            const paidCount = await OdooInvoice.countDocuments({
                state: 'posted',
                $or: [
                    { paymentState: 'paid' },
                    { amountResidual: 0 }
                ]
            });

            const unpaidCount = await OdooInvoice.countDocuments({
                state: 'posted',
                paymentState: { $ne: 'paid' },
                amountResidual: { $gt: 0 }
            });

            console.log(`   Paid invoices: ${paidCount}`);
            console.log(`   Unpaid invoices: ${unpaidCount}`);

            const sample = await OdooInvoice.findOne({ state: 'posted' });
            console.log('\n   Sample Posted Invoice:');
            console.log(`   - Name: ${sample!.name}`);
            console.log(`   - Partner: ${sample!.partnerName}`);
            console.log(`   - Amount: $${sample!.amountTotal?.toLocaleString()}`);
            console.log(`   - State: ${sample!.state}`);
            console.log(`   - Payment State: ${sample!.paymentState}`);
            console.log(`   - User ID: ${sample!.userId}`);
        }

        // Check sale orders
        const totalOrders = await OdooSaleOrder.countDocuments();
        const confirmedOrders = await OdooSaleOrder.countDocuments({
            state: { $in: ['sale', 'done'] }
        });

        console.log('\n📋 Sale Order Data:');
        console.log(`   Total orders: ${totalOrders}`);
        console.log(`   Confirmed orders: ${confirmedOrders}`);

        return true;
    } catch (error: any) {
        console.error('❌ Database Error:', error.message);
        return false;
    }
}

async function testCombinedDashboard() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 COMBINED DASHBOARD VERIFICATION');
    console.log('='.repeat(60));

    try {
        const sampleOrder = await OdooSaleOrder.findOne({ state: { $in: ['sale', 'done'] } });
        if (!sampleOrder) {
            console.log('⚠️  No data found');
            return false;
        }

        const userId = sampleOrder.userId;
        console.log(`\n🔍 Testing with User ID: ${userId}\n`);

        const to = new Date();
        const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

        console.log('🚀 Executing sales and invoice queries in parallel...\n');

        const startTime = Date.now();
        const [salesData, invoicesData] = await Promise.all([
            SalesDashboardService.getSalesDashboard(userId, from, to),
            InvoiceDashboardService.getInvoiceDashboard(userId, from, to),
        ]);
        const duration = Date.now() - startTime;

        const combinedData = {
            meta: salesData.meta,
            sales: {
                kpis: salesData.kpis,
                charts: salesData.charts,
            },
            invoices: invoicesData,
        };

        console.log('✅ Combined Dashboard Response Structure:\n');
        console.log('📦 Response Keys:', Object.keys(combinedData).join(', '));
        console.log('   - meta:', Object.keys(combinedData.meta).join(', '));
        console.log('   - sales:', Object.keys(combinedData.sales).join(', '));
        console.log('   - invoices:', Object.keys(combinedData.invoices).join(', '));

        console.log('\n📊 Sales KPIs:');
        console.log(`   - Total (30d): $${combinedData.sales.kpis.totalSalesLast30Days.toLocaleString()}`);
        console.log(`   - MTD: $${combinedData.sales.kpis.totalSalesMTD.toLocaleString()}`);
        console.log(`   - Growth: ${combinedData.sales.kpis.salesGrowthPercentage.toFixed(2)}%`);
        console.log(`   - Orders: ${combinedData.sales.kpis.confirmedOrdersCount}`);

        console.log('\n💰 Invoice KPIs:');
        console.log(`   - Total (30d): $${combinedData.invoices.kpis.totalInvoicedAmount.toLocaleString()}`);
        console.log(`   - MTD: $${combinedData.invoices.kpis.totalInvoicedMTD.toLocaleString()}`);
        console.log(`   - Paid: $${combinedData.invoices.kpis.totalPaidAmount.toLocaleString()}`);
        console.log(`   - Outstanding: $${combinedData.invoices.kpis.totalOutstandingAmount.toLocaleString()}`);
        console.log(`   - Count: ${combinedData.invoices.kpis.invoicesCount}`);

        console.log('\n📈 Charts:');
        console.log(`   - Sales Trend: ${combinedData.sales.charts.monthlySalesTrend.length} months`);
        console.log(`   - Invoice Trend: ${combinedData.invoices.charts.monthlyInvoicingTrend.length} months`);
        console.log(`   - Top Customers (Sales): ${combinedData.sales.charts.topCustomers.length}`);
        console.log(`   - Top Customers (Invoice): ${combinedData.invoices.charts.topCustomers.length}`);
        console.log(`   - Paid/Unpaid: $${combinedData.invoices.charts.paidVsUnpaid.paid.toLocaleString()} / $${combinedData.invoices.charts.paidVsUnpaid.unpaid.toLocaleString()}`);

        console.log(`\n⏱️  Total Query Time (Parallel): ${duration}ms`);

        return true;
    } catch (error: any) {
        console.error('❌ Combined Dashboard Error:', error.message);
        console.error(error.stack);
        return false;
    }
}

async function main() {
    console.log('\n');
    console.log('╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(10) + 'DASHBOARD VERIFICATION SUITE' + ' '.repeat(20) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    console.log('\n');

    const results = {
        database: false,
        combinedDashboard: false,
    };

    try {
        results.database = await verifyDatabase();
        results.combinedDashboard = await testCombinedDashboard();

        console.log('\n' + '='.repeat(60));
        console.log('📋 VERIFICATION SUMMARY');
        console.log('='.repeat(60));
        console.log('');
        console.log(`${results.database ? '✅' : '❌'} Database Connection & Data`);
        console.log(`${results.combinedDashboard ? '✅' : '❌'} Combined Dashboard (Sales + Invoices)`);

        const allPassed = Object.values(results).every(r => r);

        console.log('\n' + '='.repeat(60));
        if (allPassed) {
            console.log('✅ ALL VERIFICATIONS PASSED!');
            console.log('\n💡 The dashboard API is ready to serve:');
            console.log('   GET /api/odoo/dashboard');
            console.log('   Response: { meta, sales, invoices }');
        } else {
            console.log('❌ SOME VERIFICATIONS FAILED');
        }
        console.log('='.repeat(60));
        console.log('');

        await mongoose.connection.close();
        process.exit(allPassed ? 0 : 1);

    } catch (error: any) {
        console.error('\n❌ Fatal Error:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

main();
