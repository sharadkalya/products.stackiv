'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { signInViaGoogle } from 'shared-auth';
import { useTranslation } from 'shared-i18n';
import { AppDispatch, loginViaGoogleAction } from 'shared-redux';
import { ISignupResult, LoginPayload } from 'shared-types';

export default function SocialLogin() {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

    const forwardResponse = async (res: ISignupResult) => {
        const { success, emailVerified, user } = res;
        if (success && emailVerified && user && user.email && user.accessToken) {
            const action: LoginPayload = {
                email: user.email,
                firebaseUid: user.uid,
                firebaseAccessToken: user.accessToken,
                password: 'ignorePassword',
            };
            await dispatch(loginViaGoogleAction(action));
            router.replace('/');
        }

    };

    const googleSignIn = async () => {
        const res = await signInViaGoogle();
        forwardResponse(res);
    };

    return (
        <div className="socialLogin w-full">
            <p className='text-center mb-4'>{t('loginWithSocial')}</p>
            <div className='flex gap-2 justify-center'>
                <button className="btn" onClick={googleSignIn}>
                    <Image
                        src="icons/google.svg"
                        alt="Google logo"
                        width={20}
                        height={20}
                        className="dark:invert"
                    />
                </button>
                {/* <button className="btn">
                    <Image
                        src="icons/fb.svg"
                        alt="Facebook logo"
                        width={20}
                        height={20}
                        className="dark:invert"
                    />
                </button> */}
            </div>
        </div>
    );
}
