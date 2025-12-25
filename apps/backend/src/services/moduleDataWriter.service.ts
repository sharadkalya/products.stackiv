import { SupportedModule } from '@/config/sync.config';
import { OdooAccount } from '@/models/odooAccount.model';
import { OdooCompany } from '@/models/odooCompany.model';
import { OdooContact } from '@/models/odooContact.model';
import { OdooEmployee } from '@/models/odooEmployee.model';
import { OdooInvoice } from '@/models/odooInvoice.model';
import { OdooInvoiceLine } from '@/models/odooInvoiceLine.model';
import { OdooJournal } from '@/models/odooJournal.model';
import { OdooLead } from '@/models/odooLead.model';
import { OdooProduct } from '@/models/odooProduct.model';
import { OdooProductCategory } from '@/models/odooProductCategory.model';
import { OdooSaleOrder } from '@/models/odooSaleOrder.model';
import { OdooSaleOrderLine } from '@/models/odooSaleOrderLine.model';
import { OdooUser } from '@/models/odooUser.model';
import { OdooPurchaseOrder } from '@/models/oodooPurchaseOrder.model';
import { OdooPurchaseOrderLine } from '@/models/oodooPurchaseOrderLine.model';
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
            case 'res.company':
                await this.upsertCompanies(userId, records);
                break;
            case 'res.partner':
                await this.upsertContacts(userId, records);
                break;
            case 'res.users':
                await this.upsertUsers(userId, records);
                break;
            case 'hr.employee':
                await this.upsertEmployees(userId, records);
                break;
            case 'product.product':
                await this.upsertProducts(userId, records);
                break;
            case 'product.category':
                await this.upsertProductCategories(userId, records);
                break;
            case 'crm.lead':
                await this.upsertLeads(userId, records);
                break;
            case 'sale.order':
                await this.upsertSaleOrders(userId, records);
                break;
            case 'sale.order.line':
                await this.upsertSaleOrderLines(userId, records);
                break;
            case 'account.move':
                await this.upsertInvoices(userId, records);
                break;
            case 'account.move.line':
                await this.upsertInvoiceLines(userId, records);
                break;
            case 'purchase.order':
                await this.upsertPurchaseOrders(userId, records);
                break;
            case 'purchase.order.line':
                await this.upsertPurchaseOrderLines(userId, records);
                break;
            case 'account.journal':
                await this.upsertJournals(userId, records);
                break;
            case 'account.account':
                await this.upsertAccounts(userId, records);
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
     * Upsert sale order lines
     */
    private static async upsertSaleOrderLines(userId: string, records: any[]): Promise<void> {
        const bulkOps = records.map((record) => ({
            updateOne: {
                filter: { userId, odooId: record.id },
                update: {
                    $set: {
                        userId,
                        odooId: record.id,
                        name: record.name || '',
                        orderId: Array.isArray(record.order_id) ? record.order_id[0] : record.order_id,
                        orderName: Array.isArray(record.order_id) ? record.order_id[1] : undefined,
                        orderPartnerId: Array.isArray(record.order_partner_id) ? record.order_partner_id[0] : record.order_partner_id,
                        orderPartnerName: Array.isArray(record.order_partner_id) ? record.order_partner_id[1] : undefined,
                        sequence: record.sequence,
                        productId: Array.isArray(record.product_id) ? record.product_id[0] : record.product_id,
                        productName: Array.isArray(record.product_id) ? record.product_id[1] : undefined,
                        productTemplateId: Array.isArray(record.product_template_id) ? record.product_template_id[0] : record.product_template_id,
                        productUomQty: record.product_uom_qty,
                        productUom: Array.isArray(record.product_uom) ? record.product_uom[1] : undefined,
                        qtyDelivered: record.qty_delivered,
                        qtyInvoiced: record.qty_invoiced,
                        qtyToInvoice: record.qty_to_invoice,
                        priceUnit: record.price_unit,
                        priceSubtotal: record.price_subtotal,
                        priceTotal: record.price_total,
                        priceTax: record.price_tax,
                        discount: record.discount,
                        state: record.state,
                        invoiceStatus: record.invoice_status,
                        currency: Array.isArray(record.currency_id) ? record.currency_id[1] : undefined,
                        companyId: Array.isArray(record.company_id) ? record.company_id[0] : record.company_id,
                        companyName: Array.isArray(record.company_id) ? record.company_id[1] : undefined,
                        salesmanId: Array.isArray(record.salesman_id) ? record.salesman_id[0] : record.salesman_id,
                        salesmanName: Array.isArray(record.salesman_id) ? record.salesman_id[1] : undefined,
                        writeDate: parseOdooDate(record.write_date),
                        createDate: parseOdooDate(record.create_date),
                        rawData: record,
                    },
                },
                upsert: true,
            },
        }));

        if (bulkOps.length > 0) {
            await OdooSaleOrderLine.bulkWrite(bulkOps);
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

    /**
     * Upsert companies
     */
    private static async upsertCompanies(userId: string, records: any[]): Promise<void> {
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
                        website: record.website,
                        vat: record.vat,
                        street: record.street,
                        street2: record.street2,
                        city: record.city,
                        stateId: Array.isArray(record.state_id) ? record.state_id[0] : record.state_id,
                        stateName: Array.isArray(record.state_id) ? record.state_id[1] : undefined,
                        zip: record.zip,
                        countryId: Array.isArray(record.country_id) ? record.country_id[0] : record.country_id,
                        countryName: Array.isArray(record.country_id) ? record.country_id[1] : undefined,
                        currencyId: Array.isArray(record.currency_id) ? record.currency_id[0] : record.currency_id,
                        currencyName: Array.isArray(record.currency_id) ? record.currency_id[1] : undefined,
                        parentId: Array.isArray(record.parent_id) ? record.parent_id[0] : record.parent_id,
                        parentName: Array.isArray(record.parent_id) ? record.parent_id[1] : undefined,
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
            await OdooCompany.bulkWrite(bulkOps);
        }
    }

    /**
     * Upsert users
     */
    private static async upsertUsers(userId: string, records: any[]): Promise<void> {
        const bulkOps = records.map((record) => ({
            updateOne: {
                filter: { userId, odooId: record.id },
                update: {
                    $set: {
                        userId,
                        odooId: record.id,
                        name: record.name || '',
                        login: record.login,
                        email: record.email,
                        partnerId: Array.isArray(record.partner_id) ? record.partner_id[0] : record.partner_id,
                        partnerName: Array.isArray(record.partner_id) ? record.partner_id[1] : undefined,
                        companyId: Array.isArray(record.company_id) ? record.company_id[0] : record.company_id,
                        companyName: Array.isArray(record.company_id) ? record.company_id[1] : undefined,
                        lang: record.lang,
                        tz: record.tz,
                        active: record.active !== false,
                        notificationType: record.notification_type,
                        writeDate: parseOdooDate(record.write_date),
                        createDate: parseOdooDate(record.create_date),
                        rawData: record,
                    },
                },
                upsert: true,
            },
        }));

        if (bulkOps.length > 0) {
            await OdooUser.bulkWrite(bulkOps);
        }
    }

    /**
     * Upsert products
     */
    private static async upsertProducts(userId: string, records: any[]): Promise<void> {
        const bulkOps = records.map((record) => ({
            updateOne: {
                filter: { userId, odooId: record.id },
                update: {
                    $set: {
                        userId,
                        odooId: record.id,
                        name: record.name || '',
                        productTmplId: Array.isArray(record.product_tmpl_id) ? record.product_tmpl_id[0] : record.product_tmpl_id,
                        defaultCode: record.default_code,
                        barcode: record.barcode,
                        type: record.type,
                        detailedType: record.detailed_type,
                        categId: Array.isArray(record.categ_id) ? record.categ_id[0] : record.categ_id,
                        categName: Array.isArray(record.categ_id) ? record.categ_id[1] : undefined,
                        listPrice: record.list_price,
                        standardPrice: record.standard_price,
                        currencyId: Array.isArray(record.currency_id) ? record.currency_id[0] : record.currency_id,
                        currencyName: Array.isArray(record.currency_id) ? record.currency_id[1] : undefined,
                        saleOk: record.sale_ok,
                        purchaseOk: record.purchase_ok,
                        qtyAvailable: record.qty_available,
                        virtualAvailable: record.virtual_available,
                        uomId: Array.isArray(record.uom_id) ? record.uom_id[0] : record.uom_id,
                        uomName: Array.isArray(record.uom_id) ? record.uom_id[1] : undefined,
                        uomPoId: Array.isArray(record.uom_po_id) ? record.uom_po_id[0] : record.uom_po_id,
                        uomPoName: Array.isArray(record.uom_po_id) ? record.uom_po_id[1] : undefined,
                        tracking: record.tracking,
                        active: record.active !== false,
                        companyId: Array.isArray(record.company_id) ? record.company_id[0] : record.company_id,
                        companyName: Array.isArray(record.company_id) ? record.company_id[1] : undefined,
                        weight: record.weight,
                        volume: record.volume,
                        description: record.description,
                        descriptionSale: record.description_sale,
                        descriptionPurchase: record.description_purchase,
                        writeDate: parseOdooDate(record.write_date),
                        createDate: parseOdooDate(record.create_date),
                        rawData: record,
                    },
                },
                upsert: true,
            },
        }));

        if (bulkOps.length > 0) {
            await OdooProduct.bulkWrite(bulkOps);
        }
    }

    /**
     * Upsert product categories
     */
    private static async upsertProductCategories(userId: string, records: any[]): Promise<void> {
        const bulkOps = records.map((record) => ({
            updateOne: {
                filter: { userId, odooId: record.id },
                update: {
                    $set: {
                        userId,
                        odooId: record.id,
                        name: record.name || '',
                        completeName: record.complete_name,
                        parentId: Array.isArray(record.parent_id) ? record.parent_id[0] : record.parent_id,
                        parentName: Array.isArray(record.parent_id) ? record.parent_id[1] : undefined,
                        parentPath: record.parent_path,
                        writeDate: parseOdooDate(record.write_date),
                        createDate: parseOdooDate(record.create_date),
                        rawData: record,
                    },
                },
                upsert: true,
            },
        }));

        if (bulkOps.length > 0) {
            await OdooProductCategory.bulkWrite(bulkOps);
        }
    }

    /**
     * Upsert CRM leads
     */
    private static async upsertLeads(userId: string, records: any[]): Promise<void> {
        const bulkOps = records.map((record) => ({
            updateOne: {
                filter: { userId, odooId: record.id },
                update: {
                    $set: {
                        userId,
                        odooId: record.id,
                        name: record.name || '',
                        type: record.type,
                        active: record.active !== false,
                        partnerId: Array.isArray(record.partner_id) ? record.partner_id[0] : record.partner_id,
                        partnerName: Array.isArray(record.partner_id) ? record.partner_id[1] : record.partner_name,
                        contactName: record.contact_name,
                        emailFrom: record.email_from,
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
                        stageId: Array.isArray(record.stage_id) ? record.stage_id[0] : record.stage_id,
                        stageName: Array.isArray(record.stage_id) ? record.stage_id[1] : undefined,
                        probability: record.probability,
                        expectedRevenue: record.expected_revenue,
                        proratedRevenue: record.prorated_revenue,
                        recurringRevenue: record.recurring_revenue,
                        recurringPlan: record.recurring_plan,
                        dateDeadline: record.date_deadline ? parseOdooDate(record.date_deadline) : undefined,
                        dateClosed: record.date_closed ? parseOdooDate(record.date_closed) : undefined,
                        dateOpen: record.date_open ? parseOdooDate(record.date_open) : undefined,
                        userIdOdoo: Array.isArray(record.user_id) ? record.user_id[0] : record.user_id,
                        userIdName: Array.isArray(record.user_id) ? record.user_id[1] : undefined,
                        teamId: Array.isArray(record.team_id) ? record.team_id[0] : record.team_id,
                        teamName: Array.isArray(record.team_id) ? record.team_id[1] : undefined,
                        companyId: Array.isArray(record.company_id) ? record.company_id[0] : record.company_id,
                        companyName: Array.isArray(record.company_id) ? record.company_id[1] : undefined,
                        priority: record.priority,
                        description: record.description,
                        writeDate: parseOdooDate(record.write_date),
                        createDate: parseOdooDate(record.create_date),
                        rawData: record,
                    },
                },
                upsert: true,
            },
        }));

        if (bulkOps.length > 0) {
            await OdooLead.bulkWrite(bulkOps);
        }
    }

    /**
     * Upsert invoice lines
     */
    private static async upsertInvoiceLines(userId: string, records: any[]): Promise<void> {
        const bulkOps = records.map((record) => ({
            updateOne: {
                filter: { userId, odooId: record.id },
                update: {
                    $set: {
                        userId,
                        odooId: record.id,
                        name: record.name || '',
                        moveId: Array.isArray(record.move_id) ? record.move_id[0] : record.move_id,
                        moveName: Array.isArray(record.move_id) ? record.move_id[1] : record.move_name,
                        partnerId: Array.isArray(record.partner_id) ? record.partner_id[0] : record.partner_id,
                        partnerName: Array.isArray(record.partner_id) ? record.partner_id[1] : undefined,
                        accountId: Array.isArray(record.account_id) ? record.account_id[0] : record.account_id,
                        accountName: Array.isArray(record.account_id) ? record.account_id[1] : undefined,
                        debit: record.debit,
                        credit: record.credit,
                        balance: record.balance,
                        amountCurrency: record.amount_currency,
                        currencyId: Array.isArray(record.currency_id) ? record.currency_id[0] : record.currency_id,
                        currencyName: Array.isArray(record.currency_id) ? record.currency_id[1] : undefined,
                        productId: Array.isArray(record.product_id) ? record.product_id[0] : record.product_id,
                        productName: Array.isArray(record.product_id) ? record.product_id[1] : undefined,
                        productUomId: Array.isArray(record.product_uom_id) ? record.product_uom_id[0] : record.product_uom_id,
                        productUomName: Array.isArray(record.product_uom_id) ? record.product_uom_id[1] : undefined,
                        quantity: record.quantity,
                        taxBaseAmount: record.tax_base_amount,
                        companyId: Array.isArray(record.company_id) ? record.company_id[0] : record.company_id,
                        companyName: Array.isArray(record.company_id) ? record.company_id[1] : undefined,
                        journalId: Array.isArray(record.journal_id) ? record.journal_id[0] : record.journal_id,
                        journalName: Array.isArray(record.journal_id) ? record.journal_id[1] : undefined,
                        date: record.date ? parseOdooDate(record.date) : undefined,
                        dateMaturity: record.date_maturity ? parseOdooDate(record.date_maturity) : undefined,
                        reconciled: record.reconciled,
                        amountResidual: record.amount_residual,
                        amountResidualCurrency: record.amount_residual_currency,
                        writeDate: parseOdooDate(record.write_date),
                        createDate: parseOdooDate(record.create_date),
                        rawData: record,
                    },
                },
                upsert: true,
            },
        }));

        if (bulkOps.length > 0) {
            await OdooInvoiceLine.bulkWrite(bulkOps);
        }
    }

    /**
     * Upsert purchase orders
     */
    private static async upsertPurchaseOrders(userId: string, records: any[]): Promise<void> {
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
                        partnerRef: record.partner_ref,
                        state: record.state,
                        dateOrder: record.date_order ? parseOdooDate(record.date_order) : undefined,
                        dateApprove: record.date_approve ? parseOdooDate(record.date_approve) : undefined,
                        datePlanned: record.date_planned ? parseOdooDate(record.date_planned) : undefined,
                        amountUntaxed: record.amount_untaxed,
                        amountTax: record.amount_tax,
                        amountTotal: record.amount_total,
                        currencyId: Array.isArray(record.currency_id) ? record.currency_id[0] : record.currency_id,
                        currencyName: Array.isArray(record.currency_id) ? record.currency_id[1] : undefined,
                        companyId: Array.isArray(record.company_id) ? record.company_id[0] : record.company_id,
                        companyName: Array.isArray(record.company_id) ? record.company_id[1] : undefined,
                        userIdOdoo: Array.isArray(record.user_id) ? record.user_id[0] : record.user_id,
                        userIdName: Array.isArray(record.user_id) ? record.user_id[1] : undefined,
                        invoiceCount: record.invoice_count,
                        invoiceStatus: record.invoice_status,
                        destAddressId: Array.isArray(record.dest_address_id) ? record.dest_address_id[0] : record.dest_address_id,
                        destAddressName: Array.isArray(record.dest_address_id) ? record.dest_address_id[1] : undefined,
                        pickingTypeId: Array.isArray(record.picking_type_id) ? record.picking_type_id[0] : record.picking_type_id,
                        pickingTypeName: Array.isArray(record.picking_type_id) ? record.picking_type_id[1] : undefined,
                        paymentTermId: Array.isArray(record.payment_term_id) ? record.payment_term_id[0] : record.payment_term_id,
                        paymentTermName: Array.isArray(record.payment_term_id) ? record.payment_term_id[1] : undefined,
                        fiscalPositionId: Array.isArray(record.fiscal_position_id) ? record.fiscal_position_id[0] : record.fiscal_position_id,
                        fiscalPositionName: Array.isArray(record.fiscal_position_id) ? record.fiscal_position_id[1] : undefined,
                        notes: record.notes,
                        origin: record.origin,
                        writeDate: parseOdooDate(record.write_date),
                        createDate: parseOdooDate(record.create_date),
                        rawData: record,
                    },
                },
                upsert: true,
            },
        }));

        if (bulkOps.length > 0) {
            await OdooPurchaseOrder.bulkWrite(bulkOps);
        }
    }

    /**
     * Upsert purchase order lines
     */
    private static async upsertPurchaseOrderLines(userId: string, records: any[]): Promise<void> {
        const bulkOps = records.map((record) => ({
            updateOne: {
                filter: { userId, odooId: record.id },
                update: {
                    $set: {
                        userId,
                        odooId: record.id,
                        name: record.name || '',
                        orderId: Array.isArray(record.order_id) ? record.order_id[0] : record.order_id,
                        orderName: Array.isArray(record.order_id) ? record.order_id[1] : undefined,
                        partnerId: Array.isArray(record.partner_id) ? record.partner_id[0] : record.partner_id,
                        partnerName: Array.isArray(record.partner_id) ? record.partner_id[1] : undefined,
                        sequence: record.sequence,
                        productId: Array.isArray(record.product_id) ? record.product_id[0] : record.product_id,
                        productName: Array.isArray(record.product_id) ? record.product_id[1] : undefined,
                        productUom: Array.isArray(record.product_uom) ? record.product_uom[0] : record.product_uom,
                        productUomName: Array.isArray(record.product_uom) ? record.product_uom[1] : undefined,
                        productQty: record.product_qty,
                        qtyReceived: record.qty_received,
                        qtyInvoiced: record.qty_invoiced,
                        priceUnit: record.price_unit,
                        priceSubtotal: record.price_subtotal,
                        priceTotal: record.price_total,
                        priceTax: record.price_tax,
                        datePlanned: record.date_planned ? parseOdooDate(record.date_planned) : undefined,
                        dateOrder: record.date_order ? parseOdooDate(record.date_order) : undefined,
                        currencyId: Array.isArray(record.currency_id) ? record.currency_id[0] : record.currency_id,
                        currencyName: Array.isArray(record.currency_id) ? record.currency_id[1] : undefined,
                        companyId: Array.isArray(record.company_id) ? record.company_id[0] : record.company_id,
                        companyName: Array.isArray(record.company_id) ? record.company_id[1] : undefined,
                        state: record.state,
                        writeDate: parseOdooDate(record.write_date),
                        createDate: parseOdooDate(record.create_date),
                        rawData: record,
                    },
                },
                upsert: true,
            },
        }));

        if (bulkOps.length > 0) {
            await OdooPurchaseOrderLine.bulkWrite(bulkOps);
        }
    }

    /**
     * Upsert journals
     */
    private static async upsertJournals(userId: string, records: any[]): Promise<void> {
        const bulkOps = records.map((record) => ({
            updateOne: {
                filter: { userId, odooId: record.id },
                update: {
                    $set: {
                        userId,
                        odooId: record.id,
                        name: record.name || '',
                        code: record.code,
                        type: record.type,
                        active: record.active !== false,
                        currencyId: Array.isArray(record.currency_id) ? record.currency_id[0] : record.currency_id,
                        currencyName: Array.isArray(record.currency_id) ? record.currency_id[1] : undefined,
                        companyId: Array.isArray(record.company_id) ? record.company_id[0] : record.company_id,
                        companyName: Array.isArray(record.company_id) ? record.company_id[1] : undefined,
                        sequence: record.sequence,
                        writeDate: parseOdooDate(record.write_date),
                        createDate: parseOdooDate(record.create_date),
                        rawData: record,
                    },
                },
                upsert: true,
            },
        }));

        if (bulkOps.length > 0) {
            await OdooJournal.bulkWrite(bulkOps);
        }
    }

    /**
     * Upsert accounts
     */
    private static async upsertAccounts(userId: string, records: any[]): Promise<void> {
        const bulkOps = records.map((record) => ({
            updateOne: {
                filter: { userId, odooId: record.id },
                update: {
                    $set: {
                        userId,
                        odooId: record.id,
                        name: record.name || '',
                        code: record.code,
                        accountType: record.account_type,
                        deprecated: record.deprecated,
                        reconcile: record.reconcile,
                        currencyId: Array.isArray(record.currency_id) ? record.currency_id[0] : record.currency_id,
                        currencyName: Array.isArray(record.currency_id) ? record.currency_id[1] : undefined,
                        companyId: Array.isArray(record.company_id) ? record.company_id[0] : record.company_id,
                        companyName: Array.isArray(record.company_id) ? record.company_id[1] : undefined,
                        groupId: Array.isArray(record.group_id) ? record.group_id[0] : record.group_id,
                        groupName: Array.isArray(record.group_id) ? record.group_id[1] : undefined,
                        note: record.note,
                        writeDate: parseOdooDate(record.write_date),
                        createDate: parseOdooDate(record.create_date),
                        rawData: record,
                    },
                },
                upsert: true,
            },
        }));

        if (bulkOps.length > 0) {
            await OdooAccount.bulkWrite(bulkOps);
        }
    }
}
