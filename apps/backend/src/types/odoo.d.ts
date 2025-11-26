import { Request } from 'express';

export interface GetConnectionRequest extends Request {
    user?: {
        firebaseUid: string;
    };
}
