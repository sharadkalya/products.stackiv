import { Request, Response } from 'express';

import { internalError } from '@/utils/response';

export const getDummy = async (req: Request, res: Response): Promise<void> => {
    try {
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 1500);
        });
        res.status(200).json({
            message: 'This service takes 1-3s to respond',
        });
        return;
    } catch {
        internalError(res);
        return;
    }
};
