import Signup from './components/Signup';

export default async function Login() {
    return (
        <div className="signupPage">
            <div className="tabs tabs-lift flex">
                <Signup />
            </div>
        </div>
    );
}
