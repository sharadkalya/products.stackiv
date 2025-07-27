import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    user: JwtPayload & {
        email: string;
        firebaseUid: string;
        roles: string[];
    };
}
