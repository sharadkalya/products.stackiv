import { Request, Response, NextFunction } from 'express';

const ADMIN_SECRET_TOKEN = 'ADMIN_SECRET_TOKEN';
const ADMIN_USERNAME = 'stackiv';
const ADMIN_PASSWORD = 'Password!';

/**
 * Middleware to verify admin secret token
 */
export function verifyAdminToken(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['x-admin-token'] as string;

    if (!token || token !== ADMIN_SECRET_TOKEN) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Invalid or missing admin token',
        });
    }

    next();
}

/**
 * Admin login endpoint
 */
export function adminLogin(req: Request, res: Response) {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token: ADMIN_SECRET_TOKEN,
        });
    }

    return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
    });
}
