import * as xmlrpc from 'xmlrpc';

import { MODULE_FIELDS } from '@/config/moduleFields.config';
import { SYNC_CONFIG, SupportedModule } from '@/config/sync.config';
import { formatForOdoo } from '@/utils/time';

export interface OdooConnection {
    odooUrl: string;
    dbName: string;
    username: string;
    password: string;
}

export interface OdooAuthResult {
    success: boolean;
    userId?: number;
    message: string;
}

/**
 * Odoo Client Service
 * 
 * Thin wrapper around existing odoo.service.ts RPC logic
 * Provides methods for sync engine to interact with Odoo
 */
export class OdooClientService {
    /**
     * Test connection to Odoo instance
     */
    static async testConnection(conn: OdooConnection): Promise<OdooAuthResult> {
        return new Promise((resolve) => {
            try {
                const normalizedUrl = conn.odooUrl.trim().replace(/\/$/, '');
                const isSecure = normalizedUrl.startsWith('https://');

                const commonClient = isSecure
                    ? xmlrpc.createSecureClient({
                        url: `${normalizedUrl}/xmlrpc/2/common`,
                    })
                    : xmlrpc.createClient({
                        url: `${normalizedUrl}/xmlrpc/2/common`,
                    });

                commonClient.methodCall(
                    'authenticate',
                    [conn.dbName, conn.username, conn.password, {}],
                    (error: any, userId: any) => {
                        if (error) {
                            resolve({
                                success: false,
                                message: `Authentication failed: ${error.message || 'Unknown error'}`,
                            });
                            return;
                        }

                        if (!userId || typeof userId !== 'number') {
                            resolve({
                                success: false,
                                message: 'Invalid credentials',
                            });
                            return;
                        }

                        resolve({
                            success: true,
                            userId: userId as number,
                            message: 'Connection successful',
                        });
                    },
                );
            } catch (error) {
                resolve({
                    success: false,
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
    }

    /**
     * Get list of installed modules from Odoo
     */
    static async getInstalledModules(conn: OdooConnection): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.authenticateAndExecute(
                conn,
                'ir.module.module',
                'search_read',
                [
                    [['state', '=', 'installed']],
                    ['name'],
                ],
                (error: any, modules: any) => {
                    if (error) {
                        reject(new Error(`Failed to fetch installed modules: ${error.message}`));
                        return;
                    }

                    const moduleNames = modules.map((m: any) => m.name);
                    resolve(moduleNames);
                },
            );
        });
    }

    /**
     * Count records in a module within a time window
     */
    static async countRecords(
        conn: OdooConnection,
        module: SupportedModule,
        startTime: Date,
        endTime: Date,
    ): Promise<number> {
        return new Promise((resolve, reject) => {
            const domain = [
                '&',
                ['write_date', '>', formatForOdoo(startTime)],
                ['write_date', '<=', formatForOdoo(endTime)],
            ];

            this.authenticateAndExecute(
                conn,
                module,
                'search_count',
                [domain],
                (error: any, count: any) => {
                    if (error) {
                        reject(new Error(`Failed to count records: ${error.message}`));
                        return;
                    }

                    resolve(count as number);
                },
            );
        });
    }

    /**
     * Fetch records from a module within a time window
     */
    static async fetchRecords(
        conn: OdooConnection,
        module: SupportedModule,
        startTime: Date,
        endTime: Date,
        limit: number,
    ): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const domain = [
                '&',
                ['write_date', '>=', formatForOdoo(startTime)],
                ['write_date', '<', formatForOdoo(endTime)],
            ];

            // Fetch module-specific fields defined in moduleFields.config.ts
            // This ensures we get all business-critical data for each module
            const fields: string[] = MODULE_FIELDS[module] || [
                'id',
                'display_name',
                'name',
                'create_date',
                'write_date',
            ];

            this.authenticateAndExecute(
                conn,
                module,
                'search_read',
                [domain, fields],
                { limit, order: 'write_date asc' },
                (error: any, records: any) => {
                    if (error) {
                        reject(new Error(`Failed to fetch records: ${error.message}`));
                        return;
                    }

                    resolve(records as any[]);
                },
            );
        });
    }

    /**
     * v3: Fetch ALL records for a window using ID-based pagination
     * 
     * PROVEN APPROACH: Simple id > lastId cursor with 'id asc' ordering
     * - Handles timestamp bursts (100+ records with same write_date)
     * - Zero duplicates, no data loss
     * - Works for CSV imports and normal data
     * 
     * @param conn - Odoo connection
     * @param module - Odoo module to query
     * @param startTime - Window start time (can include buffer)
     * @param endTime - Window end time
     * @returns All records in the window
     * 
     * Features:
     * - ID-based pagination: id > lastId
     * - Ordered by 'id asc' for deterministic results
     * - Loops until no more records
     * - Respects API_CALL_DELAY_MS between calls
     * - No deduplication needed (proven by tests)
     */
    static async fetchAllRecordsForWindowWithCursor(
        conn: OdooConnection,
        module: SupportedModule,
        startTime: Date,
        endTime: Date,
    ): Promise<any[]> {
        const allRows: any[] = [];
        let lastId = 0;
        const limit = SYNC_CONFIG.LIMIT_PER_CALL;

        // Fetch module-specific fields
        const fields: string[] = MODULE_FIELDS[module] || [
            'id',
            'display_name',
            'name',
            'create_date',
            'write_date',
        ];

        const startTimeStr = formatForOdoo(startTime);
        const endTimeStr = formatForOdoo(endTime);

        let iterationCount = 0;
        const MAX_ITERATIONS = 10000; // Safety limit

        while (true) {
            iterationCount++;

            if (iterationCount > MAX_ITERATIONS) {
                console.error(`[OdooClient] Hit max iterations (${MAX_ITERATIONS}), breaking to prevent infinite loop`);
                console.error(`[OdooClient] Last ID: ${lastId}`);
                console.error(`[OdooClient] Total fetched: ${allRows.length}`);
                break;
            }

            // Build simple domain: write_date range AND id > lastId
            const domain = [
                '&',
                '&',
                ['write_date', '>', startTimeStr],
                ['write_date', '<=', endTimeStr],
                ['id', '>', lastId],
            ];

            if (iterationCount <= 3 || iterationCount % 100 === 0) {
                console.log(`[OdooClient] Page ${iterationCount}: id > ${lastId}, fetched ${allRows.length} total`);
            }

            const rows = await new Promise<any[]>((resolve, reject) => {
                this.authenticateAndExecute(
                    conn,
                    module,
                    'search_read',
                    [domain, fields],
                    { limit, order: 'id asc' }, // CRITICAL: Order by ID ascending
                    (error: any, records: any) => {
                        if (error) {
                            reject(new Error(`Failed to fetch records: ${error.message}`));
                            return;
                        }
                        resolve(records as any[]);
                    },
                );
            });

            // No more records, we're done
            if (rows.length === 0) {
                break;
            }

            // Accumulate records
            allRows.push(...rows);

            // Update cursor to last ID in this batch
            lastId = Math.max(...rows.map((row: any) => row.id));

            // Respect API rate limiting
            if (SYNC_CONFIG.API_CALL_DELAY_MS > 0) {
                await new Promise((resolve) => setTimeout(resolve, SYNC_CONFIG.API_CALL_DELAY_MS));
            }
        }

        console.log(`[OdooClient] Completed: ${allRows.length} records fetched in ${iterationCount} pages`);
        return allRows;
    }

    /**
     * v2: Fetch ALL records for a fixed time window using ID-based pagination
     * This is the canonical implementation per v2 spec section 5
     * 
     * @returns All records in the window, fetched via stable ID pagination
     * @throws Error if any API call fails
     * 
     * Features:
     * - ID-based pagination (id > lastId)
     * - Ordered by id asc for deterministic results
     * - In-memory only, never writes to DB
     * - Loops until no more records
     * - Respects API_CALL_DELAY_MS between calls
     */
    static async fetchAllRecordsForWindow(
        conn: OdooConnection,
        module: SupportedModule,
        startTime: Date,
        endTime: Date,
    ): Promise<any[]> {
        const allRows: any[] = [];
        let lastId = 0;
        const limit = SYNC_CONFIG.LIMIT_PER_CALL;

        // Fetch module-specific fields
        const fields: string[] = MODULE_FIELDS[module] || [
            'id',
            'display_name',
            'name',
            'create_date',
            'write_date',
        ];

        while (true) {
            // Domain filter: write_date in range AND id > lastId
            const domain = [
                '&',
                '&',
                ['write_date', '>', formatForOdoo(startTime)],
                ['write_date', '<=', formatForOdoo(endTime)],
                ['id', '>', lastId],
            ];

            const rows = await new Promise<any[]>((resolve, reject) => {
                this.authenticateAndExecute(
                    conn,
                    module,
                    'search_read',
                    [domain, fields],
                    { limit, order: 'id asc' },
                    (error: any, records: any) => {
                        if (error) {
                            reject(new Error(`Failed to fetch records: ${error.message}`));
                            return;
                        }
                        resolve(records as any[]);
                    },
                );
            });

            // No more records, we're done
            if (rows.length === 0) {
                break;
            }

            // Accumulate records
            allRows.push(...rows);

            // Update lastId to the maximum ID in this batch
            lastId = Math.max(...rows.map((row: any) => row.id));

            // Respect API rate limiting
            if (SYNC_CONFIG.API_CALL_DELAY_MS > 0) {
                await new Promise((resolve) => setTimeout(resolve, SYNC_CONFIG.API_CALL_DELAY_MS));
            }
        }

        return allRows;
    }

    /**
     * Helper: Authenticate and execute an Odoo RPC method
     */
    private static authenticateAndExecute(
        conn: OdooConnection,
        model: string,
        method: string,
        args: any[],
        kwargs: Record<string, any> | ((_error: any, _result: any) => void),
        callback?: (_error: any, _result: any) => void,
    ): void {
        // Handle overloaded signature: if kwargs is a function, it's actually the callback
        const actualKwargs = typeof kwargs === 'function' ? {} : kwargs;
        const actualCallback = typeof kwargs === 'function' ? kwargs : callback!;

        const normalizedUrl = conn.odooUrl.trim().replace(/\/$/, '');
        const isSecure = normalizedUrl.startsWith('https://');

        // Step 1: Authenticate
        const commonClient = isSecure
            ? xmlrpc.createSecureClient({
                url: `${normalizedUrl}/xmlrpc/2/common`,
            })
            : xmlrpc.createClient({
                url: `${normalizedUrl}/xmlrpc/2/common`,
            });

        commonClient.methodCall(
            'authenticate',
            [conn.dbName, conn.username, conn.password, {}],
            (authError: any, userId: any) => {
                if (authError || !userId) {
                    actualCallback(authError || new Error('Authentication failed'), null);
                    return;
                }

                // Step 2: Execute method
                const objectClient = isSecure
                    ? xmlrpc.createSecureClient({
                        url: `${normalizedUrl}/xmlrpc/2/object`,
                    })
                    : xmlrpc.createClient({
                        url: `${normalizedUrl}/xmlrpc/2/object`,
                    });

                objectClient.methodCall(
                    'execute_kw',
                    [conn.dbName, userId, conn.password, model, method, args, actualKwargs],
                    actualCallback as any,
                );
            },
        );
    }
}
