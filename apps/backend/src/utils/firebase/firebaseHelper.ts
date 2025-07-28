import { admin } from './firebaseAdminInit';

export async function verifyFirebaseToken(idToken: string) {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        if (!decodedToken.email_verified) {
            throw new Error('Email not verified');
        }

        return decodedToken;
    } catch (err) {
        console.error('Error verifying Firebase token:', err);
        throw new Error('Invalid or expired Firebase token');
    }
}
