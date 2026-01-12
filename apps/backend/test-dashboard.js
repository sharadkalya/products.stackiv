#!/usr/bin/env node
/**
 * Test script for Dashboard API
 * 
 * Usage:
 *   node test-dashboard.js
 * 
 * Prerequisites:
 *   - Backend server running on port 3000
 *   - Valid session cookie
 *   - Odoo sync completed
 */

const BASE_URL = 'http://localhost:3000';

async function testDashboard() {
    console.log('🧪 Testing Dashboard API...\n');

    try {
        // Test 1: Basic dashboard fetch
        console.log('1️⃣  Testing basic dashboard fetch...');
        const response = await fetch(`${BASE_URL}/api/odoo/dashboard`, {
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Failed:', error);
            return;
        }

        const result = await response.json();
        console.log('✅ Success!');
        console.log('Response structure:');
        console.log(JSON.stringify(result, null, 2));

        // Verify structure
        const data = result.data;
        console.log('\n2️⃣  Verifying response structure...');

        const checks = [
            { path: 'meta', exists: !!data?.meta },
            { path: 'meta.from', exists: !!data?.meta?.from },
            { path: 'meta.to', exists: !!data?.meta?.to },
            { path: 'meta.currency', exists: !!data?.meta?.currency },
            { path: 'sales', exists: !!data?.sales },
            { path: 'sales.kpis', exists: !!data?.sales?.kpis },
            { path: 'sales.charts', exists: !!data?.sales?.charts },
            { path: 'invoices', exists: !!data?.invoices },
            { path: 'invoices.kpis', exists: !!data?.invoices?.kpis },
            { path: 'invoices.charts', exists: !!data?.invoices?.charts },
        ];

        let allPassed = true;
        checks.forEach(({ path, exists }) => {
            const status = exists ? '✅' : '❌';
            console.log(`${status} ${path}: ${exists ? 'Found' : 'Missing'}`);
            if (!exists) allPassed = false;
        });

        if (allPassed) {
            console.log('\n✅ All structure checks passed!');
        } else {
            console.log('\n❌ Some structure checks failed!');
        }

        // Display sample data
        console.log('\n3️⃣  Sample Data:\n');
        console.log('📊 Sales KPIs:');
        console.log(`   - Total Sales (30d): $${data.sales.kpis.totalSalesLast30Days.toLocaleString()}`);
        console.log(`   - MTD Sales: $${data.sales.kpis.totalSalesMTD.toLocaleString()}`);
        console.log(`   - Growth: ${data.sales.kpis.salesGrowthPercentage.toFixed(2)}%`);
        console.log(`   - Avg Order: $${data.sales.kpis.averageOrderValue.toLocaleString()}`);
        console.log(`   - Orders: ${data.sales.kpis.confirmedOrdersCount}`);

        console.log('\n💰 Invoice KPIs:');
        console.log(`   - Total Invoiced (30d): $${data.invoices.kpis.totalInvoicedAmount.toLocaleString()}`);
        console.log(`   - MTD Invoiced: $${data.invoices.kpis.totalInvoicedMTD.toLocaleString()}`);
        console.log(`   - Paid: $${data.invoices.kpis.totalPaidAmount.toLocaleString()}`);
        console.log(`   - Outstanding: $${data.invoices.kpis.totalOutstandingAmount.toLocaleString()}`);
        console.log(`   - Count: ${data.invoices.kpis.invoicesCount}`);

        console.log('\n📈 Charts:');
        console.log(`   - Monthly Sales Trend: ${data.sales.charts.monthlySalesTrend.length} months`);
        console.log(`   - Top Customers: ${data.sales.charts.topCustomers.length} customers`);
        console.log(`   - Top Products: ${data.sales.charts.topProducts.length} products`);
        console.log(`   - Monthly Invoicing: ${data.invoices.charts.monthlyInvoicingTrend.length} months`);
        console.log(`   - Top Invoice Customers: ${data.invoices.charts.topCustomers.length} customers`);
        console.log(`   - Paid/Unpaid: $${data.invoices.charts.paidVsUnpaid.paid.toLocaleString()} / $${data.invoices.charts.paidVsUnpaid.unpaid.toLocaleString()}`);

        // Test 2: Date range query
        console.log('\n4️⃣  Testing date range query...');
        const from = '2025-12-01';
        const to = '2025-12-31';
        const rangeResponse = await fetch(`${BASE_URL}/api/odoo/dashboard?from=${from}&to=${to}`, {
            credentials: 'include',
        });

        if (rangeResponse.ok) {
            const rangeResult = await rangeResponse.json();
            console.log(`✅ Date range query successful`);
            console.log(`   From: ${rangeResult.data.meta.from}`);
            console.log(`   To: ${rangeResult.data.meta.to}`);
        } else {
            console.log('❌ Date range query failed');
        }

        console.log('\n✅ Dashboard API test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('\n💡 Make sure:');
        console.error('   - Backend server is running on port 3000');
        console.error('   - You have a valid session cookie');
        console.error('   - Odoo sync has completed');
    }
}

// Run the test
testDashboard();
