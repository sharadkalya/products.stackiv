import { OdooInvoice } from '@/models/odooInvoice.model';

/**
 * Invoice Dashboard Service
 * 
 * Handles all invoice performance data aggregations using MongoDB pipelines.
 * Only considers posted invoices (state = 'posted').
 * All calculations done at database level for performance.
 */

interface InvoiceKPIs {
    totalInvoicedAmount: number;
    totalInvoicedMTD: number;
    totalPaidAmount: number;
    totalOutstandingAmount: number;
    invoicesCount: number;
}

interface MonthlyInvoicingTrend {
    month: string;
    amount: number;
}

interface PaidVsUnpaid {
    paid: number;
    unpaid: number;
}

interface TopCustomerByInvoice {
    partnerId: number;
    partnerName: string;
    invoicedAmount: number;
    invoicesCount: number;
}

interface InvoiceDashboardData {
    kpis: InvoiceKPIs;
    charts: {
        monthlyInvoicingTrend: MonthlyInvoicingTrend[];
        paidVsUnpaid: PaidVsUnpaid;
        topCustomers: TopCustomerByInvoice[];
    };
}

export class InvoiceDashboardService {
    /**
     * Get comprehensive invoice dashboard data
     */
    static async getInvoiceDashboard(
        userId: string,
        from: Date,
        to: Date,
    ): Promise<InvoiceDashboardData> {
        // Execute all aggregations in parallel for performance
        const [kpis, monthlyInvoicingTrend, paidVsUnpaid, topCustomers] = await Promise.all([
            this.calculateKPIs(userId, from, to),
            this.getMonthlyInvoicingTrend(userId, to),
            this.getPaidVsUnpaid(userId, from, to),
            this.getTopCustomers(userId, from, to),
        ]);

        return {
            kpis,
            charts: {
                monthlyInvoicingTrend,
                paidVsUnpaid,
                topCustomers,
            },
        };
    }

    /**
     * Calculate all invoice KPIs using parallel aggregations
     */
    private static async calculateKPIs(
        userId: string,
        from: Date,
        to: Date,
    ): Promise<InvoiceKPIs> {
        const now = new Date();
        const last30DaysDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Get start of month for MTD based on 'to' date
        const startOfMonth = new Date(to.getFullYear(), to.getMonth(), 1);

        // Execute all KPI calculations in parallel
        const [
            totalInvoicedAmount,
            totalInvoicedMTD,
            totalPaidAmount,
            totalOutstandingAmount,
            invoicesCount,
        ] = await Promise.all([
            this.calculateTotalInvoiced(userId, last30DaysDate, now),
            this.calculateTotalInvoiced(userId, startOfMonth, to),
            this.calculatePaidAmount(userId, from, to),
            this.calculateOutstandingAmount(userId, from, to),
            this.countInvoices(userId, from, to),
        ]);

        return {
            totalInvoicedAmount: Math.round(totalInvoicedAmount * 100) / 100,
            totalInvoicedMTD: Math.round(totalInvoicedMTD * 100) / 100,
            totalPaidAmount: Math.round(totalPaidAmount * 100) / 100,
            totalOutstandingAmount: Math.round(totalOutstandingAmount * 100) / 100,
            invoicesCount,
        };
    }

    /**
     * Calculate total invoiced amount for a date range
     * Only considers posted invoices (state = 'posted')
     * Uses invoice_date if available, else create_date
     */
    private static async calculateTotalInvoiced(
        userId: string,
        from: Date,
        to: Date,
    ): Promise<number> {
        const result = await OdooInvoice.aggregate([
            {
                $match: {
                    userId,
                    state: 'posted',
                },
            },
            {
                $addFields: {
                    effectiveDate: {
                        $ifNull: ['$invoiceDate', '$createDate'],
                    },
                },
            },
            {
                $match: {
                    effectiveDate: { $gte: from, $lte: to },
                },
            },
            {
                $group: {
                    _id: null,
                    totalInvoiced: { $sum: '$amountTotal' },
                },
            },
        ]);

        return result[0]?.totalInvoiced || 0;
    }

    /**
     * Calculate total paid amount
     * Paid = invoices with paymentState = 'paid' or where amountResidual = 0
     */
    private static async calculatePaidAmount(
        userId: string,
        from: Date,
        to: Date,
    ): Promise<number> {
        const result = await OdooInvoice.aggregate([
            {
                $match: {
                    userId,
                    state: 'posted',
                },
            },
            {
                $addFields: {
                    effectiveDate: {
                        $ifNull: ['$invoiceDate', '$createDate'],
                    },
                },
            },
            {
                $match: {
                    effectiveDate: { $gte: from, $lte: to },
                    $or: [
                        { paymentState: 'paid' },
                        { amountResidual: 0 },
                    ],
                },
            },
            {
                $group: {
                    _id: null,
                    totalPaid: { $sum: '$amountTotal' },
                },
            },
        ]);

        return result[0]?.totalPaid || 0;
    }

    /**
     * Calculate total outstanding amount
     * Outstanding = sum of amountResidual for unpaid/partial invoices
     */
    private static async calculateOutstandingAmount(
        userId: string,
        from: Date,
        to: Date,
    ): Promise<number> {
        const result = await OdooInvoice.aggregate([
            {
                $match: {
                    userId,
                    state: 'posted',
                },
            },
            {
                $addFields: {
                    effectiveDate: {
                        $ifNull: ['$invoiceDate', '$createDate'],
                    },
                },
            },
            {
                $match: {
                    effectiveDate: { $gte: from, $lte: to },
                    amountResidual: { $gt: 0 },
                },
            },
            {
                $group: {
                    _id: null,
                    totalOutstanding: { $sum: '$amountResidual' },
                },
            },
        ]);

        return result[0]?.totalOutstanding || 0;
    }

    /**
     * Count posted invoices
     */
    private static async countInvoices(
        userId: string,
        from: Date,
        to: Date,
    ): Promise<number> {
        return await OdooInvoice.aggregate([
            {
                $match: {
                    userId,
                    state: 'posted',
                },
            },
            {
                $addFields: {
                    effectiveDate: {
                        $ifNull: ['$invoiceDate', '$createDate'],
                    },
                },
            },
            {
                $match: {
                    effectiveDate: { $gte: from, $lte: to },
                },
            },
            {
                $count: 'total',
            },
        ]).then((result) => result[0]?.total || 0);
    }

    /**
     * Get monthly invoicing trend for last 6 months
     */
    private static async getMonthlyInvoicingTrend(
        userId: string,
        to: Date,
    ): Promise<MonthlyInvoicingTrend[]> {
        // Calculate 6 months back from 'to' date
        const sixMonthsAgo = new Date(to);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const result = await OdooInvoice.aggregate([
            {
                $match: {
                    userId,
                    state: 'posted',
                },
            },
            {
                $addFields: {
                    effectiveDate: {
                        $ifNull: ['$invoiceDate', '$createDate'],
                    },
                },
            },
            {
                $match: {
                    effectiveDate: { $gte: sixMonthsAgo, $lte: to },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$effectiveDate' },
                        month: { $month: '$effectiveDate' },
                    },
                    amount: { $sum: '$amountTotal' },
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
                    amount: { $round: ['$amount', 2] },
                },
            },
        ]);

        return result;
    }

    /**
     * Get paid vs unpaid breakdown
     */
    private static async getPaidVsUnpaid(
        userId: string,
        from: Date,
        to: Date,
    ): Promise<PaidVsUnpaid> {
        const result = await OdooInvoice.aggregate([
            {
                $match: {
                    userId,
                    state: 'posted',
                },
            },
            {
                $addFields: {
                    effectiveDate: {
                        $ifNull: ['$invoiceDate', '$createDate'],
                    },
                },
            },
            {
                $match: {
                    effectiveDate: { $gte: from, $lte: to },
                },
            },
            {
                $group: {
                    _id: null,
                    paid: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ['$paymentState', 'paid'] },
                                        { $eq: ['$amountResidual', 0] },
                                    ],
                                },
                                '$amountTotal',
                                0,
                            ],
                        },
                    },
                    unpaid: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ['$paymentState', 'paid'] },
                                        { $gt: ['$amountResidual', 0] },
                                    ],
                                },
                                '$amountTotal',
                                0,
                            ],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    paid: { $round: ['$paid', 2] },
                    unpaid: { $round: ['$unpaid', 2] },
                },
            },
        ]);

        return result[0] || { paid: 0, unpaid: 0 };
    }

    /**
     * Get top 5 customers by invoiced amount
     */
    private static async getTopCustomers(
        userId: string,
        from: Date,
        to: Date,
    ): Promise<TopCustomerByInvoice[]> {
        const result = await OdooInvoice.aggregate([
            {
                $match: {
                    userId,
                    state: 'posted',
                },
            },
            {
                $addFields: {
                    effectiveDate: {
                        $ifNull: ['$invoiceDate', '$createDate'],
                    },
                },
            },
            {
                $match: {
                    effectiveDate: { $gte: from, $lte: to },
                    partnerId: { $exists: true, $ne: null },
                },
            },
            {
                $group: {
                    _id: '$partnerId',
                    partnerName: { $first: '$partnerName' },
                    invoicedAmount: { $sum: '$amountTotal' },
                    invoicesCount: { $sum: 1 },
                },
            },
            {
                $sort: { invoicedAmount: -1 },
            },
            {
                $limit: 5,
            },
            {
                $project: {
                    _id: 0,
                    partnerId: '$_id',
                    partnerName: 1,
                    invoicedAmount: { $round: ['$invoicedAmount', 2] },
                    invoicesCount: 1,
                },
            },
        ]);

        return result;
    }
}
