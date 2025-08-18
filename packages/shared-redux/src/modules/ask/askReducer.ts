import { AskStateInterface } from "./askSlice";

export const handleActiveQuery = (state: AskStateInterface, action: { payload: Record<string, any> }) => {
    const { payload: { query } } = action;
    state.activeSession.query = query;
}
