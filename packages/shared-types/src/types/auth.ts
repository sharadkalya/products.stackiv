export interface IEmailAuthPayload {
    email: string;
    password: string;
}

export type AuthStatus = 'pending' | 'verified' | 'rejected';

export interface ISignupResult {
    success: boolean;
    requiresEmailVerification?: boolean;
    message?: string;
    user?: {
        uid: string;
        email: string | null;
        status?: AuthStatus;
    };
}
