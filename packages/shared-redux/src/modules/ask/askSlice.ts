import { createSlice } from "@reduxjs/toolkit";
import { updateActiveQueryAction } from "./askActions";
import { handleActiveQuery } from "./askReducer";

export interface AskStateInterface {
    error: null | string;
    pending: boolean;
    activeSession: {
        id: string;
        chat: Record<string, any>;
        summary: Record<string, any>;
        qna: Record<string, any>;
        query: string;
    }
}

const initialState: AskStateInterface = {
    error: null,
    pending: false,
    activeSession: {
        id: '',
        chat: {},
        summary: {},
        qna: {},
        query: '',
    }
}

export const askSlice = createSlice({
    name: "askSlice",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(updateActiveQueryAction, handleActiveQuery);
    }
});

export default askSlice.reducer;
