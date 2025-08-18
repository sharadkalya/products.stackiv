import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../store';

// Select the ask domain
const selectAskDomain = (state: RootState) => state.ask;

// Create a memoized selector for active session
export const selectActiveSession = createSelector(
    [selectAskDomain],
    (askState) => askState.activeSession
);

// If you need to select additional session details, you can create more specific selectors
export const selectActiveSessionId = createSelector(
    [selectActiveSession],
    (activeSession) => activeSession?.id
);

export const selectIsSessionActive = createSelector(
    [selectActiveSession],
    (activeSession) => !!activeSession
);

// Create a selector for query text
export const selectAskQuery = createSelector(
    [selectActiveSession],
    (activeSession) => activeSession.query || ''
);
