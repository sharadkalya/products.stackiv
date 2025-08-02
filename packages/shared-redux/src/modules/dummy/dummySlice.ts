import { createSlice } from "@reduxjs/toolkit";
import { dummyAction } from "./dummyActions";
import { handleDummyPending, handleDummyRejected, handleDummySuccess } from "./dummyReducer";

export interface DummyInterface {
    data?: unknown;
    pending: boolean;
    error?: unknown;
}
const initialState: DummyInterface = {
    data: null,
    pending: false,
    error: null,
};

export const dummySlice = createSlice({
    name: "dummy",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(dummyAction.pending, handleDummyPending);
        builder.addCase(dummyAction.rejected, handleDummyRejected);
        builder.addCase(dummyAction.fulfilled, handleDummySuccess);
    }
});
