import Image from 'next/image';
import { useTranslation } from 'shared-i18n';

export default function SocialLogin() {
    const { t } = useTranslation();
    return (
        <div className="socialLogin w-full">
            <p className='text-center mb-4'>{t('loginWithSocial')}</p>
            <div className='flex gap-2 justify-center'>
                <button className="btn">
                    <Image
                        src="icons/google.svg"
                        alt="Google logo"
                        width={20}
                        height={20}
                        className="dark:invert"
                    />
                </button>
                <button className="btn">
                    <Image
                        src="icons/fb.svg"
                        alt="Facebook logo"
                        width={20}
                        height={20}
                        className="dark:invert"
                    />
                </button>
            </div>
        </div>
    );
}
