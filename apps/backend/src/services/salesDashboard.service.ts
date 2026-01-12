import { OdooSaleOrder } from '@/models/odooSaleOrder.model';
import { OdooSaleOrderLine } from '@/models/odooSaleOrderLine.model';

/**
 * Sales Dashboard Service
 * 
 * Handles all sales performance data aggregations using MongoDB pipelines.
 * All calculations done at database level for performance.
 */

interface SalesKPIs {
    totalSalesLast30Days: number;
    totalSalesMTD: number;
    salesGrowthPercentage: number;
    averageOrderValue: number;
    confirmedOrdersCount: number;
}

interface MonthlySalesTrend {
    month: string;
    revenue: number;
}

interface TopCustomer {
    partnerId: number;
    partnerName: string;
    revenue: number;
    ordersCount: number;
}

interface TopProduct {
    productId: number;
    productName: string;
    revenue: number;
    quantitySold: number;
}

interface SalesDashboardData {
    meta: {
        from: string;
        to: string;
        currency: string;
    };
    kpis: SalesKPIs;
    charts: {
        monthlySalesTrend: MonthlySalesTrend[];
        topCustomers: TopCustomer[];
        topProducts: TopProduct[];
    };
}

export class SalesDashboardService {
    /**
     * Get comprehensive sales dashboard data
     */
    static async getSalesDashboard(
        userId: string,
        from?: Date,
        to?: Date,
    ): Promise<SalesDashboardData> {
        // Default to last 30 days if not provided
        const toDate = to || new Date();
        const fromDate = from || new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Execute all aggregations in parallel for performance
        const [kpis, monthlySalesTrend, topCustomers, topProducts] = await Promise.all([
            this.calculateKPIs(userId, fromDate, toDate),
            this.getMonthlySalesTrend(userId, toDate),
            this.getTopCustomers(userId, fromDate, toDate),
            this.getTopProducts(userId, fromDate, toDate),
        ]);

        return {
            meta: {
                from: fromDate.toISOString(),
                to: toDate.toISOString(),
                currency: 'USD', // TODO: Get from user's company settings
            },
            kpis,
            charts: {
                monthlySalesTrend,
                topCustomers,
                topProducts,
            },
        };
    }

    /**
     * Calculate all KPIs using parallel aggregations
     */
    private static async calculateKPIs(
        userId: string,
        from: Date,
        to: Date,
    ): Promise<SalesKPIs> {
        const now = new Date();
        const last30DaysDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Get start of month for MTD based on 'to' date (not current system date)
        const startOfMonth = new Date(to.getFullYear(), to.getMonth(), 1);

        // Calculate previous period for growth comparison
        const periodDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
        const previousPeriodFrom = new Date(from.getTime() - periodDays * 24 * 60 * 60 * 1000);
        const previousPeriodTo = from;

        // Execute all KPI calculations in parallel
        const [
            totalSalesLast30Days,
            totalSalesMTD,
            currentPeriodSales,
            previousPeriodSales,
            averageOrderValue,
            confirmedOrdersCount,
        ] = await Promise.all([
            this.calculateTotalSales(userId, last30DaysDate, now),
            this.calculateTotalSales(userId, startOfMonth, to),
            this.calculateTotalSales(userId, from, to),
            this.calculateTotalSales(userId, previousPeriodFrom, previousPeriodTo),
            this.calculateAverageOrderValue(userId, from, to),
            this.calculateConfirmedOrdersCount(userId, from, to),
        ]);

        // Calculate growth percentage
        const salesGrowthPercentage =
            previousPeriodSales > 0
                ? ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100
                : 0;

        return {
            totalSalesLast30Days: Math.round(totalSalesLast30Days * 100) / 100,
            totalSalesMTD: Math.round(totalSalesMTD * 100) / 100,
            salesGrowthPercentage: Math.round(salesGrowthPercentage * 100) / 100,
            averageOrderValue: Math.round(averageOrderValue * 100) / 100,
            confirmedOrdersCount,
        };
    }

    /**
     * Calculate total sales for a date range
     * Only considers confirmed orders (state = 'sale' or 'done')
     */
    private static async calculateTotalSales(
        userId: string,
        from: Date,
        to: Date,
    ): Promise<number> {
        const result = await OdooSaleOrder.aggregate([
            {
                $match: {
                    userId,
                    state: { $in: ['sale', 'done'] },
                    dateOrder: { $gte: from, $lte: to },
                },
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$amountTotal' },
                },
            },
        ]);

        return result[0]?.totalSales || 0;
    }

    /**
     * Calculate average order value
     */
    private static async calculateAverageOrderValue(
        userId: string,
        from: Date,
        to: Date,
    ): Promise<number> {
        const result = await OdooSaleOrder.aggregate([
            {
                $match: {
                    userId,
                    state: { $in: ['sale', 'done'] },
                    dateOrder: { $gte: from, $lte: to },
                },
            },
            {
                $group: {
                    _id: null,
                    avgOrderValue: { $avg: '$amountTotal' },
                },
            },
        ]);

        return result[0]?.avgOrderValue || 0;
    }

    /**
     * Count confirmed orders
     */
    private static async calculateConfirmedOrdersCount(
        userId: string,
        from: Date,
        to: Date,
    ): Promise<number> {
        return await OdooSaleOrder.countDocuments({
            userId,
            state: { $in: ['sale', 'done'] },
            dateOrder: { $gte: from, $lte: to },
        });
    }

    /**
     * Get monthly sales trend for last 6 months
     */
    private static async getMonthlySalesTrend(
        userId: string,
        to: Date,
    ): Promise<MonthlySalesTrend[]> {
        // Calculate 6 months back from 'to' date
        const sixMonthsAgo = new Date(to);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const result = await OdooSaleOrder.aggregate([
            {
                $match: {
                    userId,
                    state: { $in: ['sale', 'done'] },
                    dateOrder: { $gte: sixMonthsAgo, $lte: to },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$dateOrder' },
                        month: { $month: '$dateOrder' },
                    },
                    revenue: { $sum: '$amountTotal' },
                },
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 },
            },
            {
                $project: {
                    _id: 0,
                    month: {
                        $concat: [
                            { $toString: '$_id.year' },
                            '-',
                            {
                                $cond: [
                                    { $lt: ['$_id.month', 10] },
                                    { $concat: ['0', { $toString: '$_id.month' }] },
                                    { $toString: '$_id.month' },
                                ],
                            },
                        ],
                    },
                    revenue: { $round: ['$revenue', 2] },
                },
            },
        ]);

        return result;
    }

    /**
     * Get top 5 customers by revenue
     */
    private static async getTopCustomers(
        userId: string,
        from: Date,
        to: Date,
    ): Promise<TopCustomer[]> {
        const result = await OdooSaleOrder.aggregate([
            {
                $match: {
                    userId,
                    state: { $in: ['sale', 'done'] },
                    dateOrder: { $gte: from, $lte: to },
                    partnerId: { $exists: true, $ne: null },
                },
            },
            {
                $group: {
                    _id: '$partnerId',
                    partnerName: { $first: '$partnerName' },
                    revenue: { $sum: '$amountTotal' },
                    ordersCount: { $sum: 1 },
                },
            },
            {
                $sort: { revenue: -1 },
            },
            {
                $limit: 5,
            },
            {
                $project: {
                    _id: 0,
                    partnerId: '$_id',
                    partnerName: 1,
                    revenue: { $round: ['$revenue', 2] },
                    ordersCount: 1,
                },
            },
        ]);

        return result;
    }

    /**
     * Get top 5 products by revenue using sale order lines
     */
    private static async getTopProducts(
        userId: string,
        from: Date,
        to: Date,
    ): Promise<TopProduct[]> {
        // First, get sale orders in the date range to filter lines
        const orderIds = await OdooSaleOrder.find(
            {
                userId,
                state: { $in: ['sale', 'done'] },
                dateOrder: { $gte: from, $lte: to },
            },
            { odooId: 1 },
        ).lean();

        const orderIdsList = orderIds.map((order) => order.odooId);

        if (orderIdsList.length === 0) {
            return [];
        }

        const result = await OdooSaleOrderLine.aggregate([
            {
                $match: {
                    userId,
                    orderId: { $in: orderIdsList },
                    productId: { $exists: true, $ne: null },
                    state: { $in: ['sale', 'done'] },
                },
            },
            {
                $group: {
                    _id: '$productId',
                    productName: { $first: '$productName' },
                    revenue: { $sum: '$priceSubtotal' },
                    quantitySold: { $sum: '$productUomQty' },
                },
            },
            {
                $sort: { revenue: -1 },
            },
            {
                $limit: 5,
            },
            {
                $project: {
                    _id: 0,
                    productId: '$_id',
                    productName: 1,
                    revenue: { $round: ['$revenue', 2] },
                    quantitySold: { $round: ['$quantitySold', 2] },
                },
            },
        ]);

        return result;
    }
}
