import axios from 'axios';
import { API_BASE_URL } from '../config';
import { User } from 'shared-types';
import { SignupPayload } from 'shared-types';

export async function signup(payload: SignupPayload): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/auth/signup`, payload);
    return response.data as User;
}
