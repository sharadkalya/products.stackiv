import xmlrpc from 'xmlrpc';

const client = xmlrpc.createClient({ host: 'localhost', port: 8069, path: '/xmlrpc/2/common' });
const objClient = xmlrpc.createClient({ host: 'localhost', port: 8069, path: '/xmlrpc/2/object' });

client.methodCall('authenticate', ['odoo_db', 'admin@test.com', 'password', {}], (err, uid) => {
    if (err) { console.error(err); return; }
    console.log(`Authenticated as uid: ${uid}\n`);

    objClient.methodCall('execute_kw', [
        'odoo_db', uid, 'password',
        'sale.order', 'search_read',
        [[['write_date', '>=', '2025-12-11 00:00:00'], ['write_date', '<', '2025-12-12 00:00:00']]],
        { fields: ['id', 'write_date'], limit: 30, order: 'id asc' }
    ], (err, records) => {
        if (err) { console.error(err); return; }
        console.log(`Found ${records.length} records from Dec 11, 2025:\n`);
        records.forEach(r => console.log(`  id=${r.id}, write_date=${r.write_date}`));

        // Find the most common timestamp
        const timestamps = {};
        records.forEach(r => {
            timestamps[r.write_date] = (timestamps[r.write_date] || 0) + 1;
        });

        console.log('\nTimestamp frequency:');
        Object.entries(timestamps).sort((a, b) => b[1] - a[1]).forEach(([ts, count]) => {
            console.log(`  ${ts}: ${count} records`);
        });
    });
});
