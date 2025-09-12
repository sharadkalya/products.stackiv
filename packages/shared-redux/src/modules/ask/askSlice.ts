import { createSlice } from "@reduxjs/toolkit";
import { ingestTextAction, updateActiveQueryAction, updateIngestTextAction, resetSummaryAction, fetchHistoryAction, loadInteractionAction } from "./askActions";
import { handleActiveQuery, handleIngestTextPending, handleIngestTextRejected, handleIngestTextSuccess, handleUpdateIngestTextInput, handleResetSummary, handleFetchHistoryPending, handleFetchHistoryRejected, handleFetchHistorySuccess, handleLoadInteractionPending, handleLoadInteractionRejected, handleLoadInteractionSuccess } from "./askReducer";

export interface AskStateInterface {
    error: null | string;
    pending: boolean;
    history: {
        items: Array<{ interactionId: string; title: string; }>;
        loading: boolean;
        error: string | null;
    };
    activeSession: {
        id: string;
        userId?: string;
        chat: Record<string, any>;
        summary: Record<string, any>;
        qna: Record<string, any>;
        query: string;
        text: string; // This is for user input in textarea
        originalText?: string; // This stores the loaded interaction text for display
        pending?: boolean;
        error?: any;
        ingestedData?: any;
    }
}

const initialState: AskStateInterface = {
    error: null,
    pending: false,
    history: {
        items: [],
        loading: false,
        error: null,
    },
    activeSession: {
        id: '',
        userId: undefined,
        chat: {},
        summary: {},
        qna: {},
        query: '',
        text: '',
    }
}

export const askSlice = createSlice({
    name: "askSlice",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(updateActiveQueryAction, handleActiveQuery);
        builder.addCase(updateIngestTextAction, handleUpdateIngestTextInput);
        builder.addCase(resetSummaryAction, handleResetSummary);
        builder.addCase(ingestTextAction.pending, handleIngestTextPending);
        builder.addCase(ingestTextAction.rejected, handleIngestTextRejected);
        builder.addCase(ingestTextAction.fulfilled, handleIngestTextSuccess);
        builder.addCase(fetchHistoryAction.pending, handleFetchHistoryPending);
        builder.addCase(fetchHistoryAction.rejected, handleFetchHistoryRejected);
        builder.addCase(fetchHistoryAction.fulfilled, handleFetchHistorySuccess);
        builder.addCase(loadInteractionAction.pending, handleLoadInteractionPending);
        builder.addCase(loadInteractionAction.rejected, handleLoadInteractionRejected);
        builder.addCase(loadInteractionAction.fulfilled, handleLoadInteractionSuccess);
    }
});

export default askSlice.reducer;
