import { SupportedModule } from '@/config/sync.config';
import { OdooContact } from '@/models/odooContact.model';
import { OdooEmployee } from '@/models/odooEmployee.model';
import { OdooInvoice } from '@/models/odooInvoice.model';
import { OdooSaleOrder } from '@/models/odooSaleOrder.model';
import { parseOdooDate } from '@/utils/time';

/**
 * Module Data Writer Service
 * 
 * Handles upserting Odoo data into module-specific MongoDB collections
 */
export class ModuleDataWriterService {
    /**
     * Upsert records into the appropriate module collection
     * 
     * @param userId - User ID
     * @param module - Odoo module name
     * @param records - Array of Odoo records
     */
    static async upsertRecords(
        userId: string,
        module: SupportedModule,
        records: any[],
    ): Promise<void> {
        switch (module) {
            case 'sale.order':
                await this.upsertSaleOrders(userId, records);
                break;
            case 'account.move':
                await this.upsertInvoices(userId, records);
                break;
            case 'res.partner':
                await this.upsertContacts(userId, records);
                break;
            case 'hr.employee':
                await this.upsertEmployees(userId, records);
                break;
            default:
                throw new Error(`Unsupported module: ${module}`);
        }
    }

    /**
     * Upsert sale orders
     */
    private static async upsertSaleOrders(userId: string, records: any[]): Promise<void> {
        const bulkOps = records.map((record) => ({
            updateOne: {
                filter: { userId, odooId: record.id },
                update: {
                    $set: {
                        userId,
                        odooId: record.id,
                        name: record.name || '',
                        partnerId: Array.isArray(record.partner_id) ? record.partner_id[0] : record.partner_id,
                        partnerName: Array.isArray(record.partner_id) ? record.partner_id[1] : undefined,
                        dateOrder: record.date_order ? parseOdooDate(record.date_order) : undefined,
                        amountTotal: record.amount_total,
                        amountUntaxed: record.amount_untaxed,
                        amountTax: record.amount_tax,
                        state: record.state,
                        currency: Array.isArray(record.currency_id) ? record.currency_id[1] : undefined,
                        writeDate: parseOdooDate(record.write_date),
                        createDate: parseOdooDate(record.create_date),
                        rawData: record,
                    },
                },
                upsert: true,
            },
        }));

        if (bulkOps.length > 0) {
            await OdooSaleOrder.bulkWrite(bulkOps);
        }
    }

    /**
     * Upsert invoices
     */
    private static async upsertInvoices(userId: string, records: any[]): Promise<void> {
        const bulkOps = records.map((record) => ({
            updateOne: {
                filter: { userId, odooId: record.id },
                update: {
                    $set: {
                        userId,
                        odooId: record.id,
                        name: record.name || '',
                        partnerId: Array.isArray(record.partner_id) ? record.partner_id[0] : record.partner_id,
                        partnerName: Array.isArray(record.partner_id) ? record.partner_id[1] : undefined,
                        invoiceDate: record.invoice_date ? parseOdooDate(record.invoice_date) : undefined,
                        invoiceDateDue: record.invoice_date_due ? parseOdooDate(record.invoice_date_due) : undefined,
                        amountTotal: record.amount_total,
                        amountUntaxed: record.amount_untaxed,
                        amountTax: record.amount_tax,
                        amountResidual: record.amount_residual,
                        state: record.state,
                        moveType: record.move_type,
                        currency: Array.isArray(record.currency_id) ? record.currency_id[1] : undefined,
                        paymentState: record.payment_state,
                        writeDate: parseOdooDate(record.write_date),
                        createDate: parseOdooDate(record.create_date),
                        rawData: record,
                    },
                },
                upsert: true,
            },
        }));

        if (bulkOps.length > 0) {
            await OdooInvoice.bulkWrite(bulkOps);
        }
    }

    /**
     * Upsert contacts
     */
    private static async upsertContacts(userId: string, records: any[]): Promise<void> {
        const bulkOps = records.map((record) => ({
            updateOne: {
                filter: { userId, odooId: record.id },
                update: {
                    $set: {
                        userId,
                        odooId: record.id,
                        name: record.name || '',
                        email: record.email,
                        phone: record.phone,
                        mobile: record.mobile,
                        street: record.street,
                        street2: record.street2,
                        city: record.city,
                        stateId: Array.isArray(record.state_id) ? record.state_id[0] : record.state_id,
                        stateName: Array.isArray(record.state_id) ? record.state_id[1] : undefined,
                        zip: record.zip,
                        countryId: Array.isArray(record.country_id) ? record.country_id[0] : record.country_id,
                        countryName: Array.isArray(record.country_id) ? record.country_id[1] : undefined,
                        website: record.website,
                        isCompany: record.is_company,
                        companyType: record.company_type,
                        parentId: Array.isArray(record.parent_id) ? record.parent_id[0] : record.parent_id,
                        parentName: Array.isArray(record.parent_id) ? record.parent_id[1] : undefined,
                        writeDate: parseOdooDate(record.write_date),
                        createDate: parseOdooDate(record.create_date),
                        rawData: record,
                    },
                },
                upsert: true,
            },
        }));

        if (bulkOps.length > 0) {
            await OdooContact.bulkWrite(bulkOps);
        }
    }

    /**
     * Upsert employees
     */
    private static async upsertEmployees(userId: string, records: any[]): Promise<void> {
        const bulkOps = records.map((record) => ({
            updateOne: {
                filter: { userId, odooId: record.id },
                update: {
                    $set: {
                        userId,
                        odooId: record.id,
                        name: record.name || '',
                        workEmail: record.work_email,
                        workPhone: record.work_phone,
                        mobile: record.mobile_phone,
                        jobTitle: record.job_title,
                        departmentId: Array.isArray(record.department_id) ? record.department_id[0] : record.department_id,
                        departmentName: Array.isArray(record.department_id) ? record.department_id[1] : undefined,
                        managerId: Array.isArray(record.parent_id) ? record.parent_id[0] : record.parent_id,
                        managerName: Array.isArray(record.parent_id) ? record.parent_id[1] : undefined,
                        companyId: Array.isArray(record.company_id) ? record.company_id[0] : record.company_id,
                        companyName: Array.isArray(record.company_id) ? record.company_id[1] : undefined,
                        workLocation: record.work_location,
                        active: record.active !== false,
                        writeDate: parseOdooDate(record.write_date),
                        createDate: parseOdooDate(record.create_date),
                        rawData: record,
                    },
                },
                upsert: true,
            },
        }));

        if (bulkOps.length > 0) {
            await OdooEmployee.bulkWrite(bulkOps);
        }
    }
}
