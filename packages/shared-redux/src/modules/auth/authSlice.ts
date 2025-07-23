import { createSlice } from '@reduxjs/toolkit';
import { signupAction } from './authActions';
import { User } from 'shared-types';

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

function handleSignupPending(state: AuthState) {
    state.loading = true;
    state.error = null;
}

function handleSignupFulfilled(state: AuthState, action: { payload: User }) {
    state.loading = false;
    state.user = action.payload;
}

function handleSignupRejected(state: AuthState, action: { payload: any }) {
    state.loading = false;
    state.error = action.payload as string;
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(signupAction.pending, handleSignupPending)
            .addCase(signupAction.fulfilled, handleSignupFulfilled)
            .addCase(signupAction.rejected, handleSignupRejected);
    },
});

export default authSlice.reducer;
