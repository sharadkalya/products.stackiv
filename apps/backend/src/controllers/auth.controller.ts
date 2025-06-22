import { Request, Response } from 'express';
import { SignupApiSchema, User as BaseUser, UserRoles } from 'shared-types';

import { createUser, findUserByFirebaseUid } from '@/services/auth.service';
import { formatZodError } from '@/utils/formatError';
import { badRequest, internalError } from '@/utils/response';

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

        if (result.data.role.includes(UserRoles.Admin)) {
            badRequest(res, 'Admin role is not allowed');
            return;
        }

        const userToCreate: BaseUser = {
            ...result.data,
            emailVerified: false,
        };
        await createUser(userToCreate);
        res.status(201).json({ message: 'User signed up successfully' });
        return;
    } catch (error) {
        console.error('Error in signup:', error);
        internalError(res, 'Internal server error');
        return;
    }
};
