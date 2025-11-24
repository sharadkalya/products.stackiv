import { z } from 'zod';

export type OdooConnectionStatus = 'pending' | 'success' | 'fail';

export interface OdooConnectionDetails {
    userId: string;
    orgName: string;
    odooUrl: string;
    dbName: string;
    username: string;
    password: string;
    status: OdooConnectionStatus;
    lastConnectionTestAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export const OdooConnectionSchema = z.object({
    orgName: z.string().min(1, 'Organization name is required'),
    odooUrl: z.string().url('Please enter a valid URL'),
    dbName: z.string().min(1, 'Database name is required'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

export type OdooConnectionPayload = z.infer<typeof OdooConnectionSchema>;

export interface OdooTestConnectionResponse {
    success: boolean;
    message: string;
    status: OdooConnectionStatus;
}

export interface OdooConnectionResponse {
    exists: boolean;
    connection: {
        orgName: string;
        odooUrl: string;
        dbName: string;
        username: string;
        status: OdooConnectionStatus;
        lastConnectionTestAt?: Date;
    } | null;
}
