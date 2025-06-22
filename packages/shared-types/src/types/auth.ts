export interface IEmailAuthPayload {
    email: string;
    password: string;
}

export type AuthStatus = 'pending' | 'verified' | 'rejected';

export interface ISignupResult {
    success: boolean;
    emailVerified?: boolean;
    message: string;
    user?: {
        uid: string;
        email: string | null;
    };
}
