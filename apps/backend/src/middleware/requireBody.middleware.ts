import { Request, Response, NextFunction } from 'express';

import { badRequest } from '@/utils/response';

export const requireBody = (req: Request, res: Response, next: NextFunction) => {
    if (req && req.body) {
        return next();
    }
    badRequest(res, undefined, {
        error: {
            message: 'Request body missing',
        },
    });
    return;
};
