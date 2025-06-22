import { Request, Response } from 'express';
import { SignupApiSchema } from 'shared-types';

export const signup = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = SignupApiSchema.safeParse(req.body);
        console.log('result success', result.success);

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required.' });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ message: 'Password must be at least 6 characters.' });
            return;
        }

        // TODO: check if user exists, hash password, save user in DB

        res.status(201).json({ message: 'User signed up successfully' });
        return;
    } catch (error) {
        console.error('Error in signup:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
    }
};
