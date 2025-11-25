import * as xmlrpc from 'xmlrpc';

import { MODULE_FIELDS } from '@/config/moduleFields.config';
import { SupportedModule } from '@/config/sync.config';
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
                ['write_date', '>=', formatForOdoo(startTime)],
                ['write_date', '<', formatForOdoo(endTime)],
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
