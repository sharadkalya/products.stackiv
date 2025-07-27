import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRoles } from 'shared-types';

export interface JwtPayload {
    firebaseUid: string;
    email: string;
    roles?: UserRoles;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const token = req?.cookies?.Authorization ?? '';

    if (!token) {
        res.status(401).json({ message: 'Authorization token missing' });
        return;
    }

    const JWT_SECRET = process.env.JWT_SECRET_KEY as string;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token', err });
        return;
    }
};
