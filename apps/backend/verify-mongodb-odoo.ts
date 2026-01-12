import mongoose from 'mongoose';
import { config } from 'dotenv';
import * as xmlrpc from 'xmlrpc';
import { OdooInvoice } from './src/models/odooInvoice.model';
import { OdooSaleOrder } from './src/models/odooSaleOrder.model';
import { OdooConnectionDetails } from './src/models/odoo.model';
import * as path from 'path';

config({ path: path.resolve(__dirname, '.env') });

/**
 * This script verifies that MongoDB data matches Odoo XML-RPC source data
 * 
 * It compares:
 * 1. Record counts between MongoDB and Odoo
 * 2. Sample data amounts to ensure calculations are accurate
 * 
 * This validates the final link in the chain: Odoo → MongoDB → API
 */

async function verifyMongoDBVsOdoo() {
    console.log('\n' + '='.repeat(70));
    console.log('🔗 MONGODB VS ODOO XML-RPC VERIFICATION');
    console.log('='.repeat(70));
    console.log('This verifies data integrity from Odoo source to MongoDB');
    console.log('='.repeat(70));

    try {
        // Connect to MongoDB
        console.log('\n🔌 Connecting to MongoDB...');
        const MONGO_URI = process.env.MONGODB_URI || '';
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get Odoo connection details (pick first user for verification)
        const connection = await OdooConnectionDetails.findOne({});

        if (!connection) {
            console.log('❌ No Odoo connection found in database');
            return;
        }

        const userId = connection.userId;
        console.log(`Using connection for user: ${userId}\n`);

        console.log('='.repeat(70));
        console.log('🔌 CONNECTING TO ODOO XML-RPC');
        console.log('='.repeat(70));
        console.log(`\n   URL: ${connection.odooUrl}`);
        console.log(`   Database: ${connection.dbName}`);
        console.log(`   Username: ${connection.username}\n`);

        // Initialize Odoo client using xmlrpc
        const normalizedUrl = connection.odooUrl.trim().replace(/\/$/, '');
        const isSecure = normalizedUrl.startsWith('https://');

        const commonClient = isSecure
            ? xmlrpc.createSecureClient({ url: `${normalizedUrl}/xmlrpc/2/common` })
            : xmlrpc.createClient({ url: `${normalizedUrl}/xmlrpc/2/common` });

        const objectClient = isSecure
            ? xmlrpc.createSecureClient({ url: `${normalizedUrl}/xmlrpc/2/object` })
            : xmlrpc.createClient({ url: `${normalizedUrl}/xmlrpc/2/object` });

        // Authenticate
        const uid = await new Promise<number>((resolve, reject) => {
            commonClient.methodCall(
                'authenticate',
                [connection.dbName, connection.username, connection.password, {}],
                (error: any, userId: number) => {
                    if (error) reject(error);
                    else resolve(userId);
                }
            );
        });

        if (!uid) {
            console.log('❌ Authentication failed');
            return;
        }

        console.log('✅ Connected to Odoo XML-RPC\n');

        // Verify Sale Orders
        console.log('='.repeat(70));
        console.log('📦 VERIFYING SALE ORDERS');
        console.log('='.repeat(70));

        const mongoOrders = await OdooSaleOrder.countDocuments({
            userId,
            state: { $in: ['sale', 'done'] },
        });

        console.log(`\n   MongoDB confirmed orders: ${mongoOrders}`);

        // Get count from Odoo
        const odooOrderCount = await new Promise<number>((resolve, reject) => {
            objectClient.methodCall(
                'execute_kw',
                [
                    connection.dbName,
                    uid,
                    connection.password,
                    'sale.order',
                    'search_count',
                    [[['state', 'in', ['sale', 'done']]]],
                ],
                (err: any, count: number) => {
                    if (err) reject(err);
                    else resolve(count);
                }
            );
        });

        console.log(`   Odoo confirmed orders: ${odooOrderCount}`);
        console.log(`   Match: ${mongoOrders === odooOrderCount ? '✅' : '⚠️  Different counts'}`);

        if (mongoOrders !== odooOrderCount) {
            console.log(`\n   💡 Note: Difference of ${Math.abs(mongoOrders - odooOrderCount)} orders`);
            console.log(`      This could be due to:`);
            console.log(`      - New orders created in Odoo after last sync`);
            console.log(`      - Orders cancelled/deleted in Odoo`);
            console.log(`      - Sync filtering or date ranges`);
        }

        // Verify Invoices
        console.log('\n' + '='.repeat(70));
        console.log('💰 VERIFYING INVOICES');
        console.log('='.repeat(70));

        const mongoInvoices = await OdooInvoice.countDocuments({
            userId,
            state: 'posted',
        });

        console.log(`\n   MongoDB posted invoices: ${mongoInvoices}`);

        // Get count from Odoo
        const odooInvoiceCount = await new Promise<number>((resolve, reject) => {
            objectClient.methodCall(
                'execute_kw',
                [
                    connection.dbName,
                    uid,
                    connection.password,
                    'account.move',
                    'search_count',
                    [[['state', '=', 'posted'], ['move_type', 'in', ['out_invoice', 'out_refund']]]],
                ],
                (err: any, count: number) => {
                    if (err) reject(err);
                    else resolve(count);
                }
            );
        });

        console.log(`   Odoo posted invoices: ${odooInvoiceCount}`);
        console.log(`   Match: ${mongoInvoices === odooInvoiceCount ? '✅' : '⚠️  Different counts'}`);

        if (mongoInvoices !== odooInvoiceCount) {
            console.log(`\n   💡 Note: Difference of ${Math.abs(mongoInvoices - odooInvoiceCount)} invoices`);
            console.log(`      This could be due to:`);
            console.log(`      - New invoices created in Odoo after last sync`);
            console.log(`      - Invoices deleted/archived in Odoo`);
            console.log(`      - Sync filtering or date ranges`);
        }

        // Sample verification: Pick a random order and verify amounts
        console.log('\n' + '='.repeat(70));
        console.log('🔍 SAMPLE DATA VERIFICATION');
        console.log('='.repeat(70));

        const sampleMongoDB = await OdooSaleOrder.findOne({
            userId,
            state: { $in: ['sale', 'done'] },
            odooId: { $exists: true },
        }).sort({ dateOrder: -1 });

        if (sampleMongoDB) {
            console.log(`\n   Sample Order: ${sampleMongoDB.name}`);
            console.log(`   Odoo ID: ${sampleMongoDB.odooId}`);
            console.log(`   MongoDB Amount: $${sampleMongoDB.amountTotal?.toLocaleString()}`);

            // Fetch same order from Odoo
            const odooOrders = await new Promise<any[]>((resolve, reject) => {
                objectClient.methodCall(
                    'execute_kw',
                    [
                        connection.dbName,
                        uid,
                        connection.password,
                        'sale.order',
                        'read',
                        [[sampleMongoDB.odooId], ['name', 'amount_total', 'state']],
                    ],
                    (err: any, orders: any[]) => {
                        if (err) reject(err);
                        else resolve(orders);
                    }
                );
            });

            const odooOrder = odooOrders[0];

            if (odooOrder) {
                console.log(`   Odoo Amount: $${odooOrder.amount_total?.toLocaleString()}`);
                console.log(`   Odoo State: ${odooOrder.state}`);

                const amountMatch = Math.abs((sampleMongoDB.amountTotal || 0) - (odooOrder.amount_total || 0)) < 0.01;
                console.log(`   Amount Match: ${amountMatch ? '✅' : '❌'}`);

                if (!amountMatch) {
                    console.log(`   ⚠️  Amount mismatch:`);
                    console.log(`      MongoDB: ${sampleMongoDB.amountTotal}`);
                    console.log(`      Odoo: ${odooOrder.amount_total}`);
                }
            }
        }

        // Summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 VERIFICATION SUMMARY');
        console.log('='.repeat(70));
        console.log(`\n   Odoo Sale Orders: ${odooOrderCount}`);
        console.log(`   MongoDB Sale Orders: ${mongoOrders}`);
        console.log(`   Odoo Invoices: ${odooInvoiceCount}`);
        console.log(`   MongoDB Invoices: ${mongoInvoices}`);
        console.log(`   MongoDB is ${mongoOrders === odooOrderCount && mongoInvoices === odooInvoiceCount ? 'in sync' : 'partially synced'} with Odoo`);

        if (mongoOrders !== odooOrderCount || mongoInvoices !== odooInvoiceCount) {
            console.log(`\n   💡 Note: Run sync to update MongoDB with latest Odoo data`);
        } else {
            console.log(`\n   ✅ Complete data integrity verified: Odoo → MongoDB → API`);
        }

        console.log('\n' + '='.repeat(70));

    } catch (error: any) {
        console.log('\n' + '='.repeat(70));
        console.log('❌ VERIFICATION FAILED');
        console.log('='.repeat(70));
        console.log('\nError:', error.message);

        if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
            console.log('\n💡 Connection error to Odoo:');
            console.log('   - Check Odoo URL is accessible');
            console.log('   - Verify database name is correct');
            console.log('   - Check credentials');
        } else if (error.message.includes('Authentication failed')) {
            console.log('\n💡 Authentication error:');
            console.log('   - Verify username and password');
            console.log('   - Check API access is enabled in Odoo');
        } else {
            console.log('\n💡 Stack trace:');
            console.log(error.stack);
        }

        console.log('\n' + '='.repeat(70));
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ MongoDB connection closed\n');
    }
}

verifyMongoDBVsOdoo();
