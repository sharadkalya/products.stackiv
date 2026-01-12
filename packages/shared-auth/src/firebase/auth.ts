import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
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

        // Send email verification
        await sendEmailVerification(user);

        return {
            success: true,
            emailVerified: false,
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
        const accessToken = await user.getIdToken();
        return {
            success: true,
            emailVerified: user.emailVerified,
            message: 'verificationEmailSent',
            user: {
                uid: user.uid,
                email: user.email,
                accessToken,
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

export async function firebaseLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

export async function signInViaGoogle(): Promise<ISignupResult> {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const accessToken = await user.getIdToken();

        return {
            success: true,
            emailVerified: user.emailVerified,
            message: 'loginSuccess',
            user: {
                uid: user.uid,
                email: user.email,
                accessToken,
            },
        };
    } catch (error: any) {
        console.error('Error in signInViaGoogle:', error);

        if (error?.message?.includes('popup-closed-by-user')) {
            return {
                success: false,
                message: 'popupClosedByUser',
            };
        }
        return {
            success: false,
            message: error.message ?? 'couldntLoginUser',
        };
    }
}

/**
 * Resends email verification to a user
 * User must be signed in to resend verification email
 *
 * @param {IEmailAuthPayload} payload - email and password
 * @returns {Promise<ISignupResult>}
 */
export async function resendVerificationEmail(payload: IEmailAuthPayload): Promise<ISignupResult> {
    try {
        const { email, password } = payload;

        // Sign in user first
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (user.emailVerified) {
            return {
                success: true,
                emailVerified: true,
                message: 'emailAlreadyVerified',
            };
        }

        // Send verification email
        await sendEmailVerification(user);

        return {
            success: true,
            emailVerified: false,
            message: 'verificationEmailResent',
        };
    } catch (error: any) {
        console.error('Error in resendVerificationEmail:', error);

        if (error?.message?.includes('invalid-credential')) {
            return {
                success: false,
                message: 'invalidCredentials',
            };
        }

        return {
            success: false,
            message: error.message ?? 'couldntResendEmail',
        };
    }
}

/**
 * Sends a password reset email to the user
 *
 * @param {string} email - User's email address
 * @returns {Promise<ISignupResult>}
 */
export async function sendPasswordReset(email: string): Promise<ISignupResult> {
    try {
        await sendPasswordResetEmail(auth, email);

        return {
            success: true,
            message: 'passwordResetEmailSent',
        };
    } catch (error: any) {
        console.error('Error in sendPasswordReset:', error);

        if (error?.message?.includes('user-not-found')) {
            return {
                success: false,
                message: 'userNotFound',
            };
        }

        if (error?.message?.includes('invalid-email')) {
            return {
                success: false,
                message: 'invalidEmailError',
            };
        }

        return {
            success: false,
            message: error.message ?? 'couldntSendResetEmail',
        };
    }
}
