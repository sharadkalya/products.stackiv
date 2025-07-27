import { Request, Response } from 'express';
import { SignupApiSchema, User as BaseUser, UserRoles, loginSchema } from 'shared-types';

import { createUser, findUserByFirebaseUid, updateUserByFirebaseUid } from '@/services/auth.service';
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

        const userToUpdate: Partial<BaseUser> = {
            emailVerified: true,
        };
        const user = await updateUserByFirebaseUid(result.data.firebaseUid, userToUpdate);
        if (user && user.email) {
            const token = generateAuthToken(user);
            res.setHeader('Authorization', `Bearer ${token}`);
            res.cookie('Authorization', token, {
                httpOnly: true, // recommended for security
                secure: false,  // set to true in production with HTTPS
                sameSite: 'lax', // or 'strict' depending on your needs
                path: '/',
            });
            res.status(200).json({ message: 'User logged in successfully', user });
            return;
        } else {
            unauthorized(res, 'User not found');
        }
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
