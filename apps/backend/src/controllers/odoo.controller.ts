import { Request, Response } from 'express';
import { OdooConnectionSchema } from 'shared-types';

import {
    getOdooConnectionByUserId,
    getOdooSyncStatus,
    testOdooConnectionXmlRpc,
    updateSyncStatus,
    updateUserOrgName,
    upsertOdooConnection,
    upsertOdooSyncStatus,
} from '@/services/odoo.service';
import { formatZodError } from '@/utils/formatError';
import { badRequest, internalError } from '@/utils/response';

export const getStatus = async (req: Request, res: Response) => {
    try {
        // Get user ID from authenticated request
        const userId = req.user?.firebaseUid;
        if (!userId) {
            badRequest(res, 'User not authenticated');
            return;
        }

        // Get sync status from database
        const syncStatus = await getOdooSyncStatus(userId);

        if (!syncStatus) {
            res.status(200).json({
                exists: false,
                status: null,
            });
            return;
        }

        res.status(200).json({
            exists: true,
            status: {
                userId: syncStatus.userId,
                connectionInfoAvailable: syncStatus.connectionInfoAvailable,
                syncStatus: syncStatus.syncStatus,
                lastSyncStartedAt: syncStatus.lastSyncStartedAt,
                lastSyncCompletedAt: syncStatus.lastSyncCompletedAt,
                lastSyncFailedAt: syncStatus.lastSyncFailedAt,
                createdAt: syncStatus.createdAt,
                updatedAt: syncStatus.updatedAt,
            },
        });
    } catch (error) {
        console.error('Error in getStatus:', error);
        internalError(res, 'Internal server error');
    }
};

export const initDashboard = async (req: Request, res: Response) => {
    try {
        // Get user ID from authenticated request
        const userId = req.user?.firebaseUid;
        if (!userId) {
            badRequest(res, 'User not authenticated');
            return;
        }

        // Update sync status to pending and set lastSyncStartedAt
        await updateSyncStatus(userId, 'pending', {
            lastSyncStartedAt: new Date(),
        });

        res.status(200).json({
            message: 'sync will begin',
        });
    } catch (error) {
        console.error('Error in initDashboard:', error);
        internalError(res, 'Internal server error');
    }
};

export const getDashboard = async (req: Request, res: Response) => {
    try {
        // Get user ID from authenticated request
        const userId = req.user?.firebaseUid;
        if (!userId) {
            badRequest(res, 'User not authenticated');
            return;
        }

        res.status(200).json({
            message: 'dashboard in progress',
        });
    } catch (error) {
        console.error('Error in getDashboard:', error);
        internalError(res, 'Internal server error');
    }
};

export const testConnection = async (req: Request, res: Response) => {
    try {
        // Validate request body
        const result = OdooConnectionSchema.safeParse(req.body);

        if (!result.success) {
            const errors = formatZodError(result.error);
            badRequest(res, 'Invalid request', { errors });
            return;
        }

        const { odooUrl, dbName, username, password } = result.data;

        // Get user ID from authenticated request
        const userId = req.user?.firebaseUid;
        if (!userId) {
            badRequest(res, 'User not authenticated');
            return;
        }

        // Test the Odoo connection
        const connectionResult = await testOdooConnectionXmlRpc(
            odooUrl,
            dbName,
            username,
            password,
        );

        // Return response (don't save anything)
        res.status(200).json({
            success: connectionResult.success,
            message: connectionResult.message,
            status: connectionResult.success ? 'success' : 'fail',
        });
    } catch (error) {
        console.error('Error in testConnection:', error);
        internalError(res, 'Internal server error');
    }
};

export const getConnection = async (req: Request, res: Response) => {
    try {
        // Get user ID from authenticated request
        const userId = req.user?.firebaseUid;
        if (!userId) {
            badRequest(res, 'User not authenticated');
            return;
        }

        // Get connection details from database
        const connection = await getOdooConnectionByUserId(userId);

        if (!connection) {
            res.status(200).json({
                exists: false,
                connection: null,
            });
            return;
        }

        // Return connection details (excluding password)
        res.status(200).json({
            exists: true,
            connection: {
                orgName: connection.orgName,
                odooUrl: connection.odooUrl,
                dbName: connection.dbName,
                username: connection.username,
                status: connection.status,
                lastConnectionTestAt: connection.lastConnectionTestAt,
            },
        });
    } catch (error) {
        console.error('Error in getConnection:', error);
        internalError(res, 'Internal server error');
    }
};

export const saveConnection = async (req: Request, res: Response) => {
    try {
        // Validate request body
        const result = OdooConnectionSchema.safeParse(req.body);

        if (!result.success) {
            const errors = formatZodError(result.error);
            badRequest(res, 'Invalid request', { errors });
            return;
        }

        const { orgName, status } = result.data;

        // Get user ID from authenticated request
        const userId = req.user?.firebaseUid;
        if (!userId) {
            badRequest(res, 'User not authenticated');
            return;
        }

        // Save connection details with provided status or default to pending
        await upsertOdooConnection(userId, result.data, status || 'pending');

        // Update user's organization name
        await updateUserOrgName(userId, orgName);

        // Create or update sync status
        await upsertOdooSyncStatus(userId, true, 'not_started');

        // Return response
        res.status(200).json({
            success: true,
            message: 'Connection details saved successfully',
        });
    } catch (error) {
        console.error('Error in saveConnection:', error);
        internalError(res, 'Internal server error');
    }
};
