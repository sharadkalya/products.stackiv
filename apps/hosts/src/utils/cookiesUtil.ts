import { cookies } from 'next/headers';

export async function getServerCookies(): Promise<string> {
    const cookieStore = await cookies();
    const authorization = cookieStore.get('Authorization');
    return authorization ? `Authorization=${authorization.value}` : '';
}
