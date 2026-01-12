#!/usr/bin/env node
/**
 * Comprehensive Dashboard Verification Script
 * Tests: MongoDB, Invoice Service, Sales Service, Dashboard API
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models directly
const { OdooInvoice } = require('./src/models/odooInvoice.model');
const { OdooSaleOrder } = require('./src/models/odooSaleOrder.model');

async function verifyDatabase() {
    console.log('='.repeat(60));
    console.log('🗄️  DATABASE VERIFICATION');
    console.log('='.repeat(60));

    try {
        await mongoose.connect(process.env.MONGODB_URI);
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

            // Sample invoice
            const sample = await OdooInvoice.findOne({ state: 'posted' });
            console.log('\n   Sample Posted Invoice:');
            console.log(`   - Name: ${sample.name}`);
            console.log(`   - Partner: ${sample.partnerName}`);
            console.log(`   - Amount: $${sample.amountTotal?.toLocaleString()}`);
            console.log(`   - State: ${sample.state}`);
            console.log(`   - Payment State: ${sample.paymentState}`);
            console.log(`   - Amount Residual: $${sample.amountResidual?.toLocaleString()}`);
            console.log(`   - Invoice Date: ${sample.invoiceDate || 'N/A'}`);
            console.log(`   - User ID: ${sample.userId}`);
        }

        // Check sale orders
        const totalOrders = await OdooSaleOrder.countDocuments();
        const confirmedOrders = await OdooSaleOrder.countDocuments({
            state: { $in: ['sale', 'done'] }
        });

        console.log('\n📋 Sale Order Data:');
        console.log(`   Total orders: ${totalOrders}`);
        console.log(`   Confirmed orders: ${confirmedOrders}`);

        if (confirmedOrders > 0) {
            const sampleOrder = await OdooSaleOrder.findOne({
                state: { $in: ['sale', 'done'] }
            });
            console.log('\n   Sample Confirmed Order:');
            console.log(`   - Name: ${sampleOrder.name}`);
            console.log(`   - Partner: ${sampleOrder.partnerName}`);
            console.log(`   - Amount: $${sampleOrder.amountTotal?.toLocaleString()}`);
            console.log(`   - State: ${sampleOrder.state}`);
            console.log(`   - Date: ${sampleOrder.dateOrder}`);
            console.log(`   - User ID: ${sampleOrder.userId}`);
        }

        return true;
    } catch (error) {
        console.error('❌ Database Error:', error.message);
        return false;
    }
}

async function testInvoiceService() {
    console.log('\n' + '='.repeat(60));
    console.log('💰 INVOICE SERVICE VERIFICATION');
    console.log('='.repeat(60));

    try {
        // Get sample user ID from invoices
        const sampleInvoice = await OdooInvoice.findOne({ state: 'posted' });
        if (!sampleInvoice) {
            console.log('⚠️  No posted invoices found');
            return false;
        }

        const userId = sampleInvoice.userId;
        console.log(`\n🔍 Testing with User ID: ${userId}\n`);

        // Import service
        const { InvoiceDashboardService } = require('./src/services/invoices/invoiceDashboard.service');

        // Test date range (last 30 days)
        const to = new Date();
        const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

        console.log(`📅 Date Range: ${from.toISOString().split('T')[0]} to ${to.toISOString().split('T')[0]}\n`);

        // Get invoice dashboard data
        const startTime = Date.now();
        const invoiceData = await InvoiceDashboardService.getInvoiceDashboard(userId, from, to);
        const duration = Date.now() - startTime;

        console.log('✅ Invoice Service Response:\n');
        console.log('📊 KPIs:');
        console.log(`   - Total Invoiced (30d): $${invoiceData.kpis.totalInvoicedAmount.toLocaleString()}`);
        console.log(`   - MTD Invoiced: $${invoiceData.kpis.totalInvoicedMTD.toLocaleString()}`);
        console.log(`   - Total Paid: $${invoiceData.kpis.totalPaidAmount.toLocaleString()}`);
        console.log(`   - Total Outstanding: $${invoiceData.kpis.totalOutstandingAmount.toLocaleString()}`);
        console.log(`   - Invoice Count: ${invoiceData.kpis.invoicesCount}`);

        console.log('\n📈 Charts:');
        console.log(`   - Monthly Trend: ${invoiceData.charts.monthlyInvoicingTrend.length} months`);
        console.log(`   - Top Customers: ${invoiceData.charts.topCustomers.length} customers`);
        console.log(`   - Paid vs Unpaid: $${invoiceData.charts.paidVsUnpaid.paid.toLocaleString()} / $${invoiceData.charts.paidVsUnpaid.unpaid.toLocaleString()}`);

        if (invoiceData.charts.topCustomers.length > 0) {
            console.log('\n   Top Customer:');
            const top = invoiceData.charts.topCustomers[0];
            console.log(`   - ${top.partnerName}`);
            console.log(`   - Invoiced: $${top.invoicedAmount.toLocaleString()}`);
            console.log(`   - Invoices: ${top.invoicesCount}`);
        }

        console.log(`\n⏱️  Query Time: ${duration}ms`);

        return true;
    } catch (error) {
        console.error('❌ Invoice Service Error:', error.message);
        console.error(error.stack);
        return false;
    }
}

async function testSalesService() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SALES SERVICE VERIFICATION');
    console.log('='.repeat(60));

    try {
        // Get sample user ID
        const sampleOrder = await OdooSaleOrder.findOne({ state: { $in: ['sale', 'done'] } });
        if (!sampleOrder) {
            console.log('⚠️  No confirmed orders found');
            return false;
        }

        const userId = sampleOrder.userId;
        console.log(`\n🔍 Testing with User ID: ${userId}\n`);

        // Import service
        const { SalesDashboardService } = require('./src/services/salesDashboard.service');

        // Test date range
        const to = new Date();
        const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

        console.log(`📅 Date Range: ${from.toISOString().split('T')[0]} to ${to.toISOString().split('T')[0]}\n`);

        // Get sales dashboard data
        const startTime = Date.now();
        const salesData = await SalesDashboardService.getSalesDashboard(userId, from, to);
        const duration = Date.now() - startTime;

        console.log('✅ Sales Service Response:\n');
        console.log('📊 KPIs:');
        console.log(`   - Total Sales (30d): $${salesData.kpis.totalSalesLast30Days.toLocaleString()}`);
        console.log(`   - MTD Sales: $${salesData.kpis.totalSalesMTD.toLocaleString()}`);
        console.log(`   - Growth: ${salesData.kpis.salesGrowthPercentage.toFixed(2)}%`);
        console.log(`   - Avg Order Value: $${salesData.kpis.averageOrderValue.toLocaleString()}`);
        console.log(`   - Confirmed Orders: ${salesData.kpis.confirmedOrdersCount}`);

        console.log('\n📈 Charts:');
        console.log(`   - Monthly Trend: ${salesData.charts.monthlySalesTrend.length} months`);
        console.log(`   - Top Customers: ${salesData.charts.topCustomers.length} customers`);
        console.log(`   - Top Products: ${salesData.charts.topProducts.length} products`);

        if (salesData.charts.topCustomers.length > 0) {
            console.log('\n   Top Customer:');
            const top = salesData.charts.topCustomers[0];
            console.log(`   - ${top.partnerName}`);
            console.log(`   - Revenue: $${top.revenue.toLocaleString()}`);
            console.log(`   - Orders: ${top.ordersCount}`);
        }

        console.log(`\n⏱️  Query Time: ${duration}ms`);

        return true;
    } catch (error) {
        console.error('❌ Sales Service Error:', error.message);
        console.error(error.stack);
        return false;
    }
}

async function testCombinedDashboard() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 COMBINED DASHBOARD VERIFICATION');
    console.log('='.repeat(60));

    try {
        // Get sample user ID
        const sampleOrder = await OdooSaleOrder.findOne({ state: { $in: ['sale', 'done'] } });
        if (!sampleOrder) {
            console.log('⚠️  No data found');
            return false;
        }

        const userId = sampleOrder.userId;
        console.log(`\n🔍 Testing with User ID: ${userId}\n`);

        // Import both services
        const { SalesDashboardService } = require('./src/services/salesDashboard.service');
        const { InvoiceDashboardService } = require('./src/services/invoices/invoiceDashboard.service');

        // Test parallel execution
        const to = new Date();
        const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

        console.log('🚀 Executing sales and invoice queries in parallel...\n');

        const startTime = Date.now();
        const [salesData, invoicesData] = await Promise.all([
            SalesDashboardService.getSalesDashboard(userId, from, to),
            InvoiceDashboardService.getInvoiceDashboard(userId, from, to),
        ]);
        const duration = Date.now() - startTime;

        // Construct combined response
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
        console.log('   - sales.kpis:', Object.keys(combinedData.sales.kpis).join(', '));
        console.log('   - sales.charts:', Object.keys(combinedData.sales.charts).join(', '));
        console.log('   - invoices:', Object.keys(combinedData.invoices).join(', '));
        console.log('   - invoices.kpis:', Object.keys(combinedData.invoices.kpis).join(', '));
        console.log('   - invoices.charts:', Object.keys(combinedData.invoices.charts).join(', '));

        console.log('\n📊 Quick Summary:');
        console.log(`   Sales (30d): $${combinedData.sales.kpis.totalSalesLast30Days.toLocaleString()}`);
        console.log(`   Invoiced (30d): $${combinedData.invoices.kpis.totalInvoicedAmount.toLocaleString()}`);
        console.log(`   Paid: $${combinedData.invoices.kpis.totalPaidAmount.toLocaleString()}`);
        console.log(`   Outstanding: $${combinedData.invoices.kpis.totalOutstandingAmount.toLocaleString()}`);

        console.log(`\n⏱️  Total Query Time (Parallel): ${duration}ms`);

        return true;
    } catch (error) {
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
        invoiceService: false,
        salesService: false,
        combinedDashboard: false,
    };

    try {
        // Test 1: Database
        results.database = await verifyDatabase();

        // Test 2: Invoice Service
        results.invoiceService = await testInvoiceService();

        // Test 3: Sales Service
        results.salesService = await testSalesService();

        // Test 4: Combined Dashboard
        results.combinedDashboard = await testCombinedDashboard();

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📋 VERIFICATION SUMMARY');
        console.log('='.repeat(60));
        console.log('');
        console.log(`${results.database ? '✅' : '❌'} Database Connection & Data`);
        console.log(`${results.invoiceService ? '✅' : '❌'} Invoice Service`);
        console.log(`${results.salesService ? '✅' : '❌'} Sales Service`);
        console.log(`${results.combinedDashboard ? '✅' : '❌'} Combined Dashboard`);

        const allPassed = Object.values(results).every(r => r);

        console.log('\n' + '='.repeat(60));
        if (allPassed) {
            console.log('✅ ALL VERIFICATIONS PASSED!');
        } else {
            console.log('❌ SOME VERIFICATIONS FAILED');
        }
        console.log('='.repeat(60));
        console.log('');

        await mongoose.connection.close();
        process.exit(allPassed ? 0 : 1);

    } catch (error) {
        console.error('\n❌ Fatal Error:', error.message);
        console.error(error.stack);
        await mongoose.connection.close();
        process.exit(1);
    }
}

main();
