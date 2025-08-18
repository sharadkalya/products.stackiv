import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './modules/auth/authSlice';
import askReducer from './modules/ask/askSlice';


// Combine reducers explicitly
const rootReducer = combineReducers({
    auth: authReducer,
    ask: askReducer,
});

// Get RootState from combined reducer
export type RootState = ReturnType<typeof rootReducer>;

// Allow partial preloaded state
export function makeStore(preloadedState?: Partial<RootState>) {
    return configureStore({
        reducer: rootReducer,
        preloadedState,
        devTools: process.env.NODE_ENV !== 'production',
    });
}

export const store = makeStore();

// Export typed store and dispatch
export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
