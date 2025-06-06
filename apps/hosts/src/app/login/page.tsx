"use client";
import EmailLogin from "./components/EmailLogin";
import PhoneLogin from "./components/PhoneLogin";
import { LOGIN_WITH_EMAIL, LOGIN_WITH_PHONE } from "./constants";
import { useTranslation } from "shared-i18n";

export default function Login() {
    const { t } = useTranslation();
    return (
        <div className="loginSignupPage">
            <div className="tabs tabs-lift">
                <input
                    type="radio"
                    name="loginMethod"
                    className="tab"
                    aria-label={t("loginWithEmailaa")}
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
