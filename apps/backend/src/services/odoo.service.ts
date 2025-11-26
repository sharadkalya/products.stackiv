import { OdooConnectionPayload, OdooConnectionStatus, SyncStatus } from 'shared-types';
import * as xmlrpc from 'xmlrpc';

import { OdooConnectionDetails } from '@/models/odoo.model';
import { OdooSyncStatus } from '@/models/odooSyncStatus.model';
import { User } from '@/models/user.model';

/**
 * Test Odoo connection using XML-RPC
 */
export const testOdooConnectionXmlRpc = async (
    odooUrl: string,
    dbName: string,
    username: string,
    password: string,
): Promise<{ success: boolean; userId?: number; message: string }> => {
    return new Promise((resolve) => {
        try {
            // Normalize the URL and determine if it's HTTP or HTTPS
            const normalizedUrl = odooUrl.trim().replace(/\/$/, ''); // Remove trailing slash
            const isSecure = normalizedUrl.startsWith('https://');

            // Create appropriate XML-RPC client based on protocol
            const commonClient = isSecure
                ? xmlrpc.createSecureClient({
                    url: `${normalizedUrl}/xmlrpc/2/common`,
                })
                : xmlrpc.createClient({
                    url: `${normalizedUrl}/xmlrpc/2/common`,
                });

            // Authenticate with Odoo
            commonClient.methodCall(
                'authenticate',
                [dbName, username, password, {}],
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
                            message: 'Invalid credentials. Please check your username and password.',
                        });
                        return;
                    }

                    resolve({
                        success: true,
                        userId: userId as number,
                        message: 'Connection successful!',
                    });
                },
            );
        } catch (error) {
            resolve({
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        }
    });
};

/**
 * Create or update Odoo connection details
 */
export const upsertOdooConnection = async (
    userId: string,
    connectionData: OdooConnectionPayload,
    status: OdooConnectionStatus,
) => {
    // Find existing connection for this user
    const existingConnection = await OdooConnectionDetails.findOne({ userId });

    const connectionDetails = {
        userId,
        orgName: connectionData.orgName,
        odooUrl: connectionData.odooUrl,
        dbName: connectionData.dbName,
        username: connectionData.username,
        password: connectionData.password, // TODO: Encrypt this in production
        status,
        lastConnectionTestAt: new Date(),
    };

    if (existingConnection) {
        // Update existing connection
        return await OdooConnectionDetails.findOneAndUpdate(
            { userId },
            connectionDetails,
            { new: true },
        );
    } else {
        // Create new connection
        return await OdooConnectionDetails.create(connectionDetails);
    }
};

/**
 * Update user's organization name
 */
export const updateUserOrgName = async (userId: string, orgName: string) => {
    return await User.findOneAndUpdate(
        { firebaseUid: userId },
        { orgName },
        { new: true },
    );
};

/**
 * Get Odoo connection details for a user
 */
export const getOdooConnectionByUserId = async (userId: string) => {
    return await OdooConnectionDetails.findOne({ userId });
};

/**
 * Get or create Odoo sync status for a user
 */
export const getOdooSyncStatus = async (userId: string) => {
    return await OdooSyncStatus.findOne({ userId });
};

/**
 * Create or update Odoo sync status
 */
export const upsertOdooSyncStatus = async (
    userId: string,
    connectionInfoAvailable: boolean,
    syncStatus: SyncStatus | null = null,
) => {
    const existingStatus = await OdooSyncStatus.findOne({ userId });

    const statusData = {
        userId,
        connectionInfoAvailable,
        syncStatus,
    };

    if (existingStatus) {
        return await OdooSyncStatus.findOneAndUpdate(
            { userId },
            statusData,
            { new: true },
        );
    } else {
        return await OdooSyncStatus.create(statusData);
    }
};

/**
 * Update sync status field
 */
export const updateSyncStatus = async (
    userId: string,
    syncStatus: SyncStatus,
    additionalFields?: Partial<{
        lastSyncStartedAt: Date;
        lastSyncCompletedAt: Date;
        lastSyncFailedAt: Date;
    }>,
) => {
    return await OdooSyncStatus.findOneAndUpdate(
        { userId },
        {
            syncStatus,
            ...additionalFields,
        },
        { new: true },
    );
};
