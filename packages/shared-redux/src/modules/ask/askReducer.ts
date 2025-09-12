import { AskStateInterface } from "./askSlice";

export const handleActiveQuery = (state: AskStateInterface, action: { payload: Record<string, any> }) => {
    const { payload: { query } } = action;
    state.activeSession.query = query;
}

export const handleUpdateIngestTextInput = (state: AskStateInterface, action: { payload: Record<string, any> }) => {
    const { payload: { text } } = action;
    state.activeSession.text = text;
}

export const handleIngestTextPending = (state: AskStateInterface) => {
    state.activeSession.pending = true;
    state.activeSession.error = null;
}

export const handleIngestTextRejected = (state: AskStateInterface, action: { payload?: any }) => {
    console.log('handleIngestTextRejected rejected', action);
    state.activeSession.pending = false;
    state.activeSession.error = action?.payload?.data;
}

export const handleIngestTextSuccess = (state: AskStateInterface, action: { payload?: any }) => {
    const { payload } = action;
    state.activeSession.pending = false;
    state.activeSession.error = null;
    state.activeSession.ingestedData = payload;

    // Store the processed text as originalText for display purposes
    state.activeSession.originalText = state.activeSession.text;

    // Lift interactionId and userId to activeSession level for easier access
    if (payload?.data?.interactionId) {
        state.activeSession.id = payload.data.interactionId;
    }
    if (payload?.data?.userId) {
        state.activeSession.userId = payload.data.userId;
    }
}

export const handleResetSummary = (state: AskStateInterface) => {
    state.activeSession.summary = {};
}

export const handleFetchHistoryPending = (state: AskStateInterface) => {
    state.history.loading = true;
    state.history.error = null;
}

export const handleFetchHistoryRejected = (state: AskStateInterface, action: { payload?: any }) => {
    state.history.loading = false;
    state.history.error = action?.payload || 'Failed to fetch history';
}

export const handleFetchHistorySuccess = (state: AskStateInterface, action: { payload?: any }) => {
    state.history.loading = false;
    state.history.error = null;
    state.history.items = action.payload || [];
}

export const handleLoadInteractionPending = (state: AskStateInterface) => {
    state.pending = true;
    state.error = null;
}

export const handleLoadInteractionRejected = (state: AskStateInterface) => {
    state.pending = false;
    state.error = 'Failed to load interaction';
}

export const handleLoadInteractionSuccess = (state: AskStateInterface, action: { payload?: any }) => {
    state.pending = false;
    state.error = null;

    // Update the active session with the loaded interaction data
    if (action.payload) {
        const { text, userId, interactionId, title } = action.payload;

        state.activeSession = {
            id: interactionId,
            userId: userId,
            chat: {},
            summary: {},
            qna: {},
            query: '',
            text: '', // Don't populate textarea when loading interaction
            originalText: text || '', // Store the loaded text separately for display
            pending: false,
            error: null,
            ingestedData: {
                data: {
                    userId: userId,
                    interactionId: interactionId,
                    title: title
                }
            }
        };
    }
}
