import axios from 'axios';
import { API_BASE_URL } from '../config';
import { LoginPayload, User } from 'shared-types';
import { SignupPayload } from 'shared-types';

export async function signup(payload: SignupPayload): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/auth/signup`, payload);
    return response.data as User;
}

export async function login(payload: LoginPayload): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, payload, { withCredentials: true });
    return response.data as User;
}

export async function loginViaGoogle(payload: LoginPayload): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/auth/loginViaGoogle`, payload, { withCredentials: true });
    return response.data as User;
}


export async function logout() {
    const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
    return response.data;
}
