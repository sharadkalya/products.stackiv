import { createAsyncThunk } from '@reduxjs/toolkit';
import { signup, login } from 'shared-api';
import { LoginPayload, SignupPayload, User } from 'shared-types';

// Async thunk for signup
export const signupAction = createAsyncThunk('auth/signup', async (payload: SignupPayload, thunkAPI) => {
    try {
        const user = await signup(payload);
        return user;
    } catch (error: any) {
        return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
});

export const loginAction = createAsyncThunk('auth/login', async (payload: LoginPayload, thunkAPI) => {
    try {
        const user = await login(payload);
        return user;
    } catch (error: any) {
        return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
});
