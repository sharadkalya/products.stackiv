import { createAction } from "@reduxjs/toolkit";

export const updateActiveQueryAction = createAction(
    "ask/updateActiveQueryAction",
    (query) => ({ payload: { query } })
);
