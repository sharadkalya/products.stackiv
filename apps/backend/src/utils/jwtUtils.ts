import jwt from 'jsonwebtoken';
import { User, UserRoles } from 'shared-types'; // Adjust import path as needed

const FALLBACK_SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
const JWT_ACCESS_EXPIRES_IN = '30m';       // 30 minutes for access token
const JWT_REFRESH_EXPIRES_IN = '7d';       // 7 days for refresh token

const JWT_SECRET = process.env.JWT_SECRET_KEY || FALLBACK_SECRET;

export function generateAuthToken(user: Partial<User>): string {
    const payload = {
        firebaseUid: user.firebaseUid,
        email: user.email,
        roles: user.roles,
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_ACCESS_EXPIRES_IN,
    });
}

export function generateRefreshToken(user: User): string {
    // Usually refresh token has minimal info to identify user
    const payload = {
        firebaseUid: user.firebaseUid,
        email: user.email,
        roles: user.roles,
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
    });
}

export function verifyAuthToken(token: string): { firebaseUid: string; email: string; roles: UserRoles[] } {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as { firebaseUid: string; email: string; roles: UserRoles[] };
}
