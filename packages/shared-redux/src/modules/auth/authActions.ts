import { createAsyncThunk } from '@reduxjs/toolkit';
import { signup } from 'shared-api';
import { SignupPayload, User } from 'shared-types';

// Async thunk for signup
export const signupAction = createAsyncThunk('auth/signup', async (payload: SignupPayload, thunkAPI) => {
    try {
        const user = await signup(payload);
        return user;
    } catch (error: any) {
        return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
});
