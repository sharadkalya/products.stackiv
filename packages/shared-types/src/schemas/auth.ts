import { z } from 'zod';

// Define the login schema
export const loginSchema = z.object({
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
export type TSignupSchema = z.infer<typeof signupSchema>;

// API Schema
export const SignupApiSchema = z.object({
    email: z.string().email(),
    role: z.string(),
    password: z.string().min(6),
    uuid: z.string()
});
