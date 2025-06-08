import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { ISignupResult, IEmailAuthPayload } from "shared-types";
import { auth } from './init';

export async function signUpWithEmailPassword(payload: IEmailAuthPayload): Promise<ISignupResult> {
    try {
        const { email, password } = payload;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Send email verification
        await sendEmailVerification(user);

        return {
            success: true,
            requiresEmailVerification: true,
            message: 'Verification email sent. Please check your inbox.',
            user: {
                uid: user.uid,
                email: user.email,
            },
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message ?? 'Something went wrong',
        };
    }
}
