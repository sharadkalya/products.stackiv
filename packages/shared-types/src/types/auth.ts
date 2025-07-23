import { UserRoles } from './user';
export interface SignupPayload {
    email: string;
    roles: UserRoles[];
    firebaseUid: string;
    emailVerified: boolean;
    password: string,
}
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
