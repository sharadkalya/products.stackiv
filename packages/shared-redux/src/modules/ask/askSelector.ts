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
    (activeSession) => !!activeSession && !!(activeSession.id || activeSession.text)
);

// Check if session has processable content
export const selectHasSessionContent = createSelector(
    [selectActiveSession],
    (activeSession) => !!activeSession && (!!activeSession.id || !!activeSession.text?.trim() || !!activeSession.originalText?.trim())
);

// Check if session has been processed (has interaction ID)
export const selectHasProcessedSession = createSelector(
    [selectActiveSession],
    (activeSession) => !!activeSession && !!activeSession.id
);

// Create a selector for query text
export const selectAskQuery = createSelector(
    [selectActiveSession],
    (activeSession) => activeSession.query || ''
);

// Create a selector for reading ingested text
export const selectIngestedText = createSelector(
    [selectActiveSession],
    (activeSession) => activeSession.text || ''
);

// History selectors
export const selectHistory = createSelector(
    [selectAskDomain],
    (askState) => askState.history
);

export const selectHistoryItems = createSelector(
    [selectHistory],
    (history) => history.items
);

export const selectHistoryLoading = createSelector(
    [selectHistory],
    (history) => history.loading
);

export const selectHistoryError = createSelector(
    [selectHistory],
    (history) => history.error
);
