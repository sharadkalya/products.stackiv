export * from "./schemas";
export interface User {
    uid: string;
    email: string;
    name?: string;
    isEmailVerified: boolean;
    role: "host" | "guest";
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface SignupPayload extends LoginPayload {
    name: string;
}

export type AuthMethod = "email" | "google" | "phone";

export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    message?: string;
}
