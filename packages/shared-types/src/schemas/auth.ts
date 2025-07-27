import { z } from 'zod';
import { UserRoles } from '../types';

// Define the login schema
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    firebaseUid: z.string(),
    firebaseAccessToken: z.string(),
});
export const loginFormSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// Define the signup schema
export const signupSchema = z.object({
    email: z.string().email({
        message: 'invalidEmailError',
    }),
    password: z.string().min(6, {
        message: 'passwordMinLengthError',
    }),
    confirmPassword: z.string().min(6, {
        message: 'confirmPasswordMinLengthError',
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'passwordsDontMatchError',
    path: ['confirmPassword'],
});

// Define the types for the login and signup schemas
export type TLoginSchema = z.infer<typeof loginSchema>;
export type TLoginFormSchema = z.infer<typeof loginFormSchema>;
export type TSignupSchema = z.infer<typeof signupSchema>;

// API Schema
export const SignupApiSchema = z.object({
    email: z.string().email(),
    roles: z.array(z.nativeEnum(UserRoles)),
    password: z.string().min(6),
    firebaseUid: z.string()
});
