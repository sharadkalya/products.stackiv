import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { UserRoles } from 'shared-types';

export interface AuthenticatedRequest extends Request {
    user: JwtPayload & {
        email: string;
        firebaseUid: string;
        roles?: UserRoles;
    };
}
