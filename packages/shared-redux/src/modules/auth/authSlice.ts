import { createSlice } from '@reduxjs/toolkit';
import { signupAction, loginAction, loginViaGoogleAction } from './authActions';
import { User } from 'shared-types';
import {
    handleSignupFulfilled,
    handleSignupPending,
    handleSignupRejected,
    handleLoginFulfilled,
    handleLoginPending,
    handleLoginRejected,
    handleLoginViaGoogleFulfilled,
    handleLoginViaGooglePending,
    handleLoginViaGoogleRejected
} from './authReducer';

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
        setUser: (state, action) => {
            state.user = action.payload;
            state.loading = false;
            state.error = null;
        },
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
            .addCase(signupAction.rejected, handleSignupRejected)
            .addCase(loginAction.pending, handleLoginPending)
            .addCase(loginAction.fulfilled, handleLoginFulfilled)
            .addCase(loginAction.rejected, handleLoginRejected)
            .addCase(loginViaGoogleAction.pending, handleLoginViaGooglePending)
            .addCase(loginViaGoogleAction.fulfilled, handleLoginViaGoogleFulfilled)
            .addCase(loginViaGoogleAction.rejected, handleLoginViaGoogleRejected);
    },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
