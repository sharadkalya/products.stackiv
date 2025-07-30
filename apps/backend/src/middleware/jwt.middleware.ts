import { Request, Response, NextFunction } from 'express';
import { UserRoles } from 'shared-types';

import { AuthenticatedRequest } from '@/types/auth';
import { commonCookieOptions } from '@/utils/cookiesHelper';
import { generateAuthToken, verifyAuthToken } from '@/utils/jwtUtils';

export interface JwtPayload {
    firebaseUid: string;
    email: string;
    roles?: UserRoles;
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies?.Authorization;
    const refreshToken = req.cookies?.RefreshToken;

    if (!accessToken) {
        res.status(401).json({ message: 'Authorization token missing' });
        return;
    }

    try {
        const user = verifyAuthToken(accessToken);
        (req as AuthenticatedRequest).user = user;
        return next();
    } catch (err) {
        console.error('Authorization token issue - attempting with refresh token', err);
        // Access token invalid or expired
        if (!refreshToken) {
            res.clearCookie('Authorization', commonCookieOptions);
            res.status(401).json({ message: 'Invalid or expired token' });
            return;
        }

        try {
            // Verify refresh token
            const refreshUser = verifyAuthToken(refreshToken);

            // Generate new access token
            const newAccessToken = generateAuthToken(refreshUser);

            // Set new access token cookie
            res.cookie('Authorization', newAccessToken, commonCookieOptions);

            (req as AuthenticatedRequest).user = refreshUser;
            return next();
        } catch (refreshErr) {
            console.error('Refresh token error or expired', refreshErr);
            // Refresh token invalid or expired
            res.clearCookie('Authorization', commonCookieOptions);
            res.clearCookie('RefreshToken', commonCookieOptions);
            res.status(401).json({ message: 'Invalid or expired token' });
            return;
        }
    }
};
