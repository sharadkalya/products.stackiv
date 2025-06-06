import EmailLogin from './components/EmailLogin';
import PhoneLogin from './components/PhoneLogin';
import { LOGIN_WITH_PHONE } from './constants';
import { getServerTranslation } from 'shared-i18n/server';


export default async function Login() {
    const t = await getServerTranslation('en');
    return (
        <div className="loginSignupPage">
            <div className="tabs tabs-lift">
                <input
                    type="radio"
                    name="loginMethod"
                    className="tab"
                    aria-label={t('loginWithEmail')}
                    defaultChecked
                />
                <div className="tab-content bg-base-100 border-base-300 p-6">
                    <EmailLogin />
                </div>

                <input
                    type="radio"
                    name="loginMethod"
                    className="tab"
                    aria-label={LOGIN_WITH_PHONE}
                />
                <div className="tab-content bg-base-100 border-base-300 p-6">
                    <PhoneLogin />
                </div>
            </div>
        </div>
    );
}
