import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import { selectAuthUser } from "../auth/authSelector";

export const updateActiveQueryAction = createAction(
    "ask/updateActiveQueryAction",
    (query) => ({ payload: { query } })
);

export const updateIngestTextAction = createAction(
    "ask/updateIngestTextAction",
    (text) => ({ payload: { text } })
);

export const resetSummaryAction = createAction("ask/resetSummaryAction");


import type { RootState } from "../../store"; // adjust the import path as needed
import { askIngestTextApi, askHistoryApi, loadInteractionApi } from "shared-api";

export const ingestTextAction = createAsyncThunk(
    'ask/ingestTextAction',
    async ({ text, userId }: { text: string, userId?: string | null }, { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        let { firebaseUid } = selectAuthUser(state) ?? {};

        try {
            const res = await askIngestTextApi({
                text,
                userId: firebaseUid ?? userId
            });
            const data = await res.json();
            if (!res.ok) {
                return rejectWithValue(data);
            }
            return data;
        } catch (error) {
            return rejectWithValue(error);
        }
    },
);

export const loadInteractionAction = createAsyncThunk(
    'ask/loadInteractionAction',
    async ({ interactionId }: { interactionId: string }, { rejectWithValue }) => {
        try {
            const res = await loadInteractionApi({ interactionId });
            const data = await res.json();
            if (!res.ok) {
                return rejectWithValue({});
            }
            return data;
        } catch {
            return rejectWithValue({});
        }
    },
);

export const fetchHistoryAction = createAsyncThunk(
    'ask/fetchHistoryAction',
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        const { firebaseUid } = selectAuthUser(state) ?? {};

        // Get userId from Redux auth or fallback to localStorage
        let userId = firebaseUid;
        if (!userId && typeof window !== 'undefined') {
            const storedUserId = localStorage.getItem('userId');
            userId = storedUserId || undefined;
        }

        if (!userId) {
            return rejectWithValue('No userId available');
        }

        try {
            const res = await askHistoryApi({ userId });
            const data = await res.json();
            if (!res.ok) {
                return rejectWithValue(data);
            }
            return data;
        } catch (error) {
            return rejectWithValue(error);
        }
    },
);
