import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import { ISignupResult, IEmailAuthPayload } from "shared-types";
import { auth } from './init';

/**
 * Signs up a new user using email and password, and sends an email verification.
 * 
 * @param {IEmailAuthPayload} payload - An object containing the user's email and password.
 * @returns {Promise<ISignupResult>} A promise that resolves to an object containing the signup result.
 * 
 * The result object includes a `success` boolean, an optional `emailVerified` boolean indicating
 * whether the email is verified, a `message` string, and an optional `user` object containing the
 * user's UID and email. In case of an error, the message indicates the type of error, such as 
 * 'emailAlreadyInUse' or 'couldntCreateUser'.
 */
export async function signUpWithEmailPassword(payload: IEmailAuthPayload): Promise<ISignupResult> {
    try {
        const { email, password } = payload;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('user', user);

        // Send email verification
        await sendEmailVerification(user);

        return {
            success: true,
            emailVerified: true,
            message: 'verificationEmailSent',
            user: {
                uid: user.uid,
                email: user.email,
            },
        };
    } catch (error: any) {
        console.log('error in signupWithEmailPassword', error);
        if (error?.message?.includes('email-already-in-use')) {
            return {
                success: false,
                message: 'emailAlreadyInUse',
            };
        }
        return {
            success: false,
            message: error.message ?? 'couldntCreateUser',
        };
    }
}

/**
 * Signs in a user with the given email and password and sends an email verification
 * if the user is not verified.
 *
 * @param {IEmailAuthPayload} payload
 * @returns {Promise<ISignupResult>}
 */
export async function signInWithEmailPassword(payload: IEmailAuthPayload): Promise<ISignupResult> {
    try {
        const { email, password } = payload;
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        if (!user.emailVerified) {
            await sendEmailVerification(user);
        }
        return {
            success: true,
            emailVerified: user.emailVerified,
            message: 'verificationEmailSent',
            user: {
                uid: user.uid,
                email: user.email,
            },
        };
    } catch (error: any) {
        if (error?.message?.includes?.('invalid-credential')) {
            return {
                success: false,
                message: 'invalidCredentials',
            };
        }
        return {
            success: false,
            message: error.message ?? 'couldntLoginUser',
        };
    }
}
