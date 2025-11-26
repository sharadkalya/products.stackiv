import { getServerTranslation } from 'shared-i18n/server';

import EmailLogin from './components/EmailLogin';
import PhoneLogin from './components/PhoneLogin';

export default async function Login() {
    const { t } = await getServerTranslation('en');

    return (
        <div className="loginSignupPage">
            <div className="tabs tabs-lift flex">
                <input
                    type="radio"
                    name="loginMethod"
                    className="tab w-1/2"
                    aria-label={t('loginWithEmail')}
                    defaultChecked
                />
                <div className="tab-content bg-base-100 border-base-300 p-6">
                    <EmailLogin />
                </div>

                <input
                    type="radio"
                    name="loginMethod"
                    className="tab w-1/2"
                    aria-label={t('loginWithPhone')}
                />
                <div className="tab-content bg-base-100 border-base-300 p-6">
                    <PhoneLogin />
                </div>
            </div>
        </div>
    );
}
