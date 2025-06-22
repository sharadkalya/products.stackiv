// utils/response.ts
import { Response } from 'express';

export function sendResponse(res: Response, status: number, message: string, data?: any) {
    const payload: Record<string, any> = { message };
    if (data !== undefined) {
        payload.data = data;
    }
    return res.status(status).json(payload);
}

export const ok = (res: Response, message = 'OK', data?: any) =>
    sendResponse(res, 200, message, data);

export const created = (res: Response, message = 'Created', data?: any) =>
    sendResponse(res, 201, message, data);

export const badRequest = (res: Response, message = 'Bad Request', data?: any) =>
    sendResponse(res, 400, message, data);

export const unauthorized = (res: Response, message = 'Unauthorized', data?: any) =>
    sendResponse(res, 401, message, data);

export const forbidden = (res: Response, message = 'Forbidden', data?: any) =>
    sendResponse(res, 403, message, data);

export const internalError = (res: Response, message = 'Internal Server Error', data?: any) =>
    sendResponse(res, 500, message, data);
