import { getDashboardData } from 'shared-api';

import LogoutButton from '@common/LogoutButton';
import { getServerCookies } from '@hosts/utils/cookiesUtil';
import { logMsg } from '@hosts/utils/logUtility';

export default async function Dashboard() {
    const cookie = await getServerCookies();
    try {
        const res = await getDashboardData(cookie);
        logMsg('Home component', 'Respone of dashboard', res);
    } catch (error) {
        logMsg('Home component', 'Respone of dashboard', error);
    }

    return (
        <div>
            Dashboard coming soon
            <div className='flex items-center justify-center full-width'>
                <LogoutButton />
            </div>
        </div>
    );
}
