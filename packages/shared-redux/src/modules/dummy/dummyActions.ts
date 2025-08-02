import { createAsyncThunk } from "@reduxjs/toolkit";
import { dummyApi } from "shared-api";

export const dummyAction = createAsyncThunk(
    'dummy/getDummy',
    async () => {
        try {
            const res = await dummyApi();
            console.log('action res', res);
            return res.data;
        } catch (error) {
            console.log('error in dummyApi', error);
        }
    },
);
