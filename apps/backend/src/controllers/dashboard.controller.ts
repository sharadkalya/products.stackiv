import { Request, Response } from 'express';

import { AuthenticatedRequest } from '@/types/auth';

export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as unknown as AuthenticatedRequest).user;

        res.status(200).json({
            message: `Welcome to your dashboard, ${user.email}!`,
            data: {
                recentActivity: ['Logged in', 'Viewed stats', 'Updated profile'],
            },
        });
        return;
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
    }
};
