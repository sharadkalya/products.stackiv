import { createSlice } from '@reduxjs/toolkit';
import { signupAction } from './authActions';
import { User } from 'shared-types';
import { handleSignupFulfilled, handleSignupPending, handleSignupRejected } from './authReducer';

export interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(signupAction.pending, handleSignupPending)
            .addCase(signupAction.fulfilled, handleSignupFulfilled)
            .addCase(signupAction.rejected, handleSignupRejected);
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
