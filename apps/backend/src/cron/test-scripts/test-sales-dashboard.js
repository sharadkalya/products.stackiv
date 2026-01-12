/**
 * Test script for Sales Dashboard endpoint
 * 
 * Usage:
 * 1. Ensure backend server is running
 * 2. Update JWT_TOKEN with a valid token
 * 3. Run: npx tsx src/cron/test-scripts/test-sales-dashboard.js
 */

/* eslint-disable no-console */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJlYmFzZVVpZCI6ImFZUEV5TUEzOUxkeVRrdHlrbWlRMG1rTmg1MjMiLCJlbWFpbCI6InNoYXJhZGthbHlhQGdtYWlsLmNvbSIsInJvbGVzIjpbImhvc3QiXSwiaWF0IjoxNzY3Mjc2ODE1LCJleHAiOjE3NjcyNzg2MTV9.Ufw80ClH2a-Dsx62DDWLHdHZ8VjWpDOwu4ObKXDIU0s';

async function testSalesDashboard() {
    console.log('🧪 Testing Sales Dashboard Endpoint\n');

    try {
        // Test 1: Default (last 30 days)
        console.log('📊 Test 1: Default date range (last 30 days)');
        const response1 = await axios.get(`${API_BASE_URL}/api/odoo/dashboard`, {
            headers: {
                Cookie: `Authorization=${JWT_TOKEN}`,
            },
            withCredentials: true,
        });

        console.log('✅ Status:', response1.status);
        console.log('📈 KPIs:', JSON.stringify(response1.data.data.kpis, null, 2));
        console.log('📅 Date Range:', response1.data.data.meta.from, 'to', response1.data.data.meta.to);
        console.log('📊 Monthly Trend Points:', response1.data.data.charts.monthlySalesTrend.length);
        console.log('👥 Top Customers:', response1.data.data.charts.topCustomers.length);
        console.log('🏷️  Top Products:', response1.data.data.charts.topProducts.length);
        console.log('');

        // Test 2: Custom date range (last 90 days)
        console.log('📊 Test 2: Custom date range (last 90 days)');
        const to = new Date();
        const from = new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);

        const response2 = await axios.get(
            `${API_BASE_URL}/api/odoo/dashboard?from=${from.toISOString()}&to=${to.toISOString()}`,
            {
                headers: {
                    Cookie: `Authorization=${JWT_TOKEN}`,
                },
                withCredentials: true,
            },
        );

        console.log('✅ Status:', response2.status);
        console.log('📈 Total Sales (90 days):', response2.data.data.kpis.totalSalesLast30Days);
        console.log('📊 Growth:', response2.data.data.kpis.salesGrowthPercentage, '%');
        console.log('');

        // Test 3: Performance check
        console.log('⏱️  Test 3: Performance check');
        const startTime = Date.now();
        await axios.get(`${API_BASE_URL}/api/odoo/dashboard`, {
            headers: {
                Cookie: `Authorization=${JWT_TOKEN}`,
            },
            withCredentials: true,
        });
        const endTime = Date.now();
        console.log('✅ Response time:', endTime - startTime, 'ms');
        console.log('');

        // Display sample data
        console.log('📋 Sample Chart Data:');
        console.log('');
        console.log('Monthly Trend (last 3 months):');
        response1.data.data.charts.monthlySalesTrend.slice(-3).forEach((item) => {
            console.log(`  ${item.month}: $${item.revenue.toLocaleString()}`);
        });
        console.log('');

        console.log('Top 3 Customers:');
        response1.data.data.charts.topCustomers.slice(0, 3).forEach((customer, i) => {
            console.log(`  ${i + 1}. ${customer.partnerName}: $${customer.revenue.toLocaleString()} (${customer.ordersCount} orders)`);
        });
        console.log('');

        console.log('Top 3 Products:');
        response1.data.data.charts.topProducts.slice(0, 3).forEach((product, i) => {
            console.log(`  ${i + 1}. ${product.productName}: $${product.revenue.toLocaleString()} (${product.quantitySold} units)`);
        });
        console.log('');

        console.log('✅ All tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            console.error('⚠️  Authentication failed. Please update JWT_TOKEN in the script.');
        }
    }
}

testSalesDashboard();
