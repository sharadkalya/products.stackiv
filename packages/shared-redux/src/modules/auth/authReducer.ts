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

function handleLoginPending(state: AuthState) {
    state.loading = true;
    state.error = null;
}

function handleLoginFulfilled(state: AuthState, action: { payload: User }) {
    state.loading = false;
    state.user = action.payload;
}

function handleLoginRejected(state: AuthState, action: { payload: any }) {
    state.loading = false;
    state.error = action.payload as string;
}

function handleLoginViaGooglePending(state: AuthState) {
    state.loading = true;
    state.error = null;
}

function handleLoginViaGoogleFulfilled(state: AuthState, action: { payload: User }) {
    state.loading = false;
    state.user = action.payload;
}

function handleLoginViaGoogleRejected(state: AuthState, action: { payload: any }) {
    state.loading = false;
    state.error = action.payload as string;
}


// Export handlers and initialState for use in the slice file
export {
    initialState,
    handleSignupPending,
    handleSignupFulfilled,
    handleSignupRejected,
    handleLoginPending,
    handleLoginFulfilled,
    handleLoginRejected,
    handleLoginViaGooglePending,
    handleLoginViaGoogleFulfilled,
    handleLoginViaGoogleRejected
};
