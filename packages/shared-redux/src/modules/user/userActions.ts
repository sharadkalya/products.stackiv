import { createAsyncThunk } from '@reduxjs/toolkit';
import { User } from 'shared-types';

const fetchUser = async function (userId: string): Promise<User> {
    return fetch(`https://jsonplaceholder.typicode.com/users/${userId}`)
        .then((response) => response.json())
        .then((json) => json);
};

export const fetchUserThunk = createAsyncThunk<User, string>(
    'user/fetchUser',
    async (userId, thunkAPI) => {
        try {
            const user = await fetchUser(userId);
            return user;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.message ?? 'Failed to fetch user');
        }
    }
);
