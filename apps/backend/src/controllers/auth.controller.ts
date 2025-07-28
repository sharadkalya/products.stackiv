import { Request, Response } from 'express';
import { SignupApiSchema, User as BaseUser, UserRoles, loginSchema } from 'shared-types';

import { createUser, findUserByFirebaseUid, updateUserByFirebaseUid } from '@/services/auth.service';
import { verifyFirebaseToken } from '@/utils/firebase/firebaseHelper';
import { formatZodError } from '@/utils/formatError';
import { generateAuthToken } from '@/utils/jwtUtils';
import { badRequest, internalError, unauthorized } from '@/utils/response';

export const signup = async (req: Request, res: Response) => {
    try {
        const result = SignupApiSchema.safeParse(req.body);

        if (!result.success) {
            const errors = formatZodError(result.error);
            badRequest(res, 'Invalid request', { errors });
            return;
        }

        const existingUser = await findUserByFirebaseUid(result.data.firebaseUid);
        if (existingUser) {
            badRequest(res, 'User already exists');
            return;
        }

        if (result.data.roles.includes(UserRoles.Admin)) {
            badRequest(res, 'Admin role is not allowed');
            return;
        }

        const userToCreate: BaseUser = {
            ...result.data,
            emailVerified: false,
        };
        await createUser(userToCreate);
        res.status(201).json({ message: 'User signed up successfully' });
    } catch (error) {
        console.error('Error in signup:', error);
        internalError(res, 'Internal server error');
        return;
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const result = loginSchema.safeParse(req.body);

        if (!result.success) {
            const errors = formatZodError(result.error);
            badRequest(res, 'Invalid request', { errors });
            return;
        }

        const { firebaseAccessToken } = result.data;

        // Verify Firebase token asynchronously and get decoded token
        let decodedToken;
        try {
            decodedToken = await verifyFirebaseToken(firebaseAccessToken);
        } catch (err) {
            console.log(err);
            unauthorized(res, 'Invalid or expired Firebase token');
            return;
        }

        const { uid, email, email_verified: emailVerified } = decodedToken;

        if (!emailVerified) {
            unauthorized(res, 'Email not verified');
            return;
        }

        // Update user emailVerified status in DB
        const userToUpdate: Partial<BaseUser> = { emailVerified: true };
        const user = await updateUserByFirebaseUid(uid, userToUpdate);

        if (!user || !user.email || user.email !== email) {
            unauthorized(res, 'User not found or email mismatch');
            return;
        }

        // Generate your backend JWT token
        const token = generateAuthToken(user);

        // Set the token as an HttpOnly cookie and Authorization header
        res.setHeader('Authorization', `Bearer ${token}`);
        res.cookie('Authorization', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // enable in prod with HTTPS
            sameSite: 'lax',
            path: '/',
        });

        res.status(200).json({ message: 'User logged in successfully', user });
        return;
    } catch (error) {
        console.error('Error in login:', error);
        internalError(res, 'Internal server error');
        return;
    }
};

export const logout = async (req: Request, res: Response) => {
    // Clear the 'Authorization' cookie
    res.clearCookie('Authorization', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
    });

    res.status(200).json({ message: 'Logged out successfully' });
};
