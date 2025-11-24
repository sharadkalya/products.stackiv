import { Request, Response } from 'express';
import { OdooConnectionSchema } from 'shared-types';

import {
    getOdooConnectionByUserId,
    testOdooConnectionXmlRpc,
    updateUserOrgName,
    upsertOdooConnection,
} from '@/services/odoo.service';
import { formatZodError } from '@/utils/formatError';
import { badRequest, internalError } from '@/utils/response';

export const testConnection = async (req: Request, res: Response) => {
    try {
        // Validate request body
        const result = OdooConnectionSchema.safeParse(req.body);

        if (!result.success) {
            const errors = formatZodError(result.error);
            badRequest(res, 'Invalid request', { errors });
            return;
        }

        const { orgName, odooUrl, dbName, username, password } = result.data;

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

        // Determine status based on test result
        const status = connectionResult.success ? 'success' : 'fail';

        // Store connection details in database (always, regardless of success/failure)
        await upsertOdooConnection(userId, result.data, status);

        // Update user's organization name (always, as user provided it)
        await updateUserOrgName(userId, orgName);

        // Return response
        res.status(200).json({
            success: connectionResult.success,
            message: connectionResult.message,
            status,
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
