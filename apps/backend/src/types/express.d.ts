import { JwtPayload } from 'jsonwebtoken';
import { UserRoles } from 'shared-types';

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload & {
                email: string;
                firebaseUid: string;
                roles?: UserRoles[];
            };
        }
    }
}
