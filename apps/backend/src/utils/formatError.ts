import { ZodError } from 'zod';

export function formatZodError(error: ZodError) {
    return error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
    }));
}
