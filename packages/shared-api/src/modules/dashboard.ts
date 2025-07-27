import axios from 'axios';
import { API_BASE_URL } from '../config';

export async function getDashboardData(cookie?: string): Promise<any> {
    const headers = cookie ? { Cookie: cookie } : {};
    const response = await axios.get(`${API_BASE_URL}/dashboard`, {
        headers,
        withCredentials: true,
    });
    return response.data;
}
