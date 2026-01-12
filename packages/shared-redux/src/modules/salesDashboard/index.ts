import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
    CombinedDashboardData,
    SalesKPIs,
    MonthlySalesTrend,
    TopCustomer,
    TopProduct,
    InvoiceKPIs,
    MonthlyInvoicingTrend,
    PaidVsUnpaid,
    TopCustomerByInvoice,
} from 'shared-types';

import type { RootState } from '../../store';

// Re-export types for backward compatibility
export type {
    SalesKPIs,
    MonthlySalesTrend,
    TopCustomer,
    TopProduct,
    InvoiceKPIs,
    MonthlyInvoicingTrend,
    PaidVsUnpaid,
    TopCustomerByInvoice,
};

export interface SalesDashboardState {
    data: CombinedDashboardData | null;
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
}

const initialState: SalesDashboardState = {
    data: null,
    loading: false,
    error: null,
    lastFetched: null,
};

// Async thunk to fetch dashboard data
export const fetchSalesDashboard = createAsyncThunk(
    'salesDashboard/fetch',
    async ({ from, to }: { from?: string; to?: string } = {}, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams();
            if (from) params.append('from', from);
            if (to) params.append('to', to);

            const queryString = params.toString();
            const url = `/api/odoo/dashboard${queryString ? `?${queryString}` : ''}`;

            const response = await fetch(url, {
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.message || 'Failed to fetch dashboard data');
            }

            const result = await response.json();
            return result.data as CombinedDashboardData;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Network error');
        }
    },
);

// Slice
const salesDashboardSlice = createSlice({
    name: 'salesDashboard',
    initialState,
    reducers: {
        clearDashboard: (state) => {
            state.data = null;
            state.error = null;
            state.lastFetched = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSalesDashboard.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSalesDashboard.fulfilled, (state, action: PayloadAction<CombinedDashboardData>) => {
                state.loading = false;
                state.data = action.payload;
                state.lastFetched = Date.now();
                state.error = null;
            })
            .addCase(fetchSalesDashboard.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

// Actions
export const { clearDashboard, clearError } = salesDashboardSlice.actions;

// Selectors - Sales
export const selectSalesDashboard = (state: RootState) => state.salesDashboard?.data;
export const selectSalesDashboardLoading = (state: RootState) => state.salesDashboard?.loading;
export const selectSalesDashboardError = (state: RootState) => state.salesDashboard?.error;
export const selectSalesKPIs = (state: RootState) => state.salesDashboard?.data?.sales?.kpis;
export const selectMonthlySalesTrend = (state: RootState) => state.salesDashboard?.data?.sales?.charts.monthlySalesTrend;
export const selectTopCustomers = (state: RootState) => state.salesDashboard?.data?.sales?.charts.topCustomers;
export const selectTopProducts = (state: RootState) => state.salesDashboard?.data?.sales?.charts.topProducts;
export const selectDashboardMeta = (state: RootState) => state.salesDashboard?.data?.meta;

// Selectors - Invoices
export const selectInvoiceKPIs = (state: RootState) => state.salesDashboard?.data?.invoices?.kpis;
export const selectMonthlyInvoicingTrend = (state: RootState) => state.salesDashboard?.data?.invoices?.charts.monthlyInvoicingTrend;
export const selectPaidVsUnpaid = (state: RootState) => state.salesDashboard?.data?.invoices?.charts.paidVsUnpaid;
export const selectTopCustomersByInvoice = (state: RootState) => state.salesDashboard?.data?.invoices?.charts.topCustomers;

// Reducer
export default salesDashboardSlice.reducer;
