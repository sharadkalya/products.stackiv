import { AuthRedirect } from '@hosts/components/AuthRedirect';

import Signup from './components/Signup';

export default async function Login() {
    return (
        <AuthRedirect>
            <div className="signupPage">
                <div className="tabs tabs-lift flex">
                    <Signup />
                </div>
            </div>
        </AuthRedirect>
    );
}
