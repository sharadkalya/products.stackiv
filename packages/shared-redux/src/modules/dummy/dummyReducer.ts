import { DummyInterface } from "./dummySlice";

export const handleDummyPending = (state: DummyInterface) => {
    state.pending = true;
    state.error = null;
};

export const handleDummyRejected = (state: DummyInterface, action: { payload: unknown }) => {
    state.pending = false;
    state.error = action.payload;
};

export const handleDummySuccess = (state: DummyInterface, action: { payload: unknown }) => {
    state.pending = false;
    state.error = null;
    state.data = action?.payload;
};
