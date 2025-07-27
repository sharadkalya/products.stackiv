import jwt from 'jsonwebtoken';
import { User, UserRoles } from 'shared-types'; // Adjust this path based on your project structure

const FALLBACK_SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
const JWT_EXPIRES_IN = '1d';

export function generateAuthToken(user: User): string {
    const JWT_SECRET = process.env.JWT_SECRET_KEY || FALLBACK_SECRET;

    const payload = {
        firebaseUid: user.firebaseUid,
        email: user.email,
        roles: user.roles,
    };

    // Sign the token with expiration
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}

export function verifyAuthToken(token: string): { firebaseUid: string; email: string } {
    const JWT_SECRET = process.env.JWT_SECRET_KEY || FALLBACK_SECRET;

    // jwt.verify throws if token is invalid or expired
    const decoded = jwt.verify(token, JWT_SECRET);

    // Cast to expected payload shape (you can extend as needed)
    return decoded as { firebaseUid: string; email: string, roles: UserRoles };
}
