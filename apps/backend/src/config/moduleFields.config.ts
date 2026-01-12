/**
 * Odoo Module Field Definitions
 *
 * This file contains the field lists for each supported Odoo module.
 * Fields are carefully selected to include business-critical data while
 * excluding binary data, computed fields that may cause errors, and
 * internal system fields.
 */

import { SupportedModule } from './sync.config';

/**
 * Field definitions for each Odoo module
 */
export const MODULE_FIELDS: Record<SupportedModule, string[]> = {
    'res.company': [
        // Core identification
        'id',
        'name',
        'display_name',
        'create_date',
        'write_date',

        // Status
        'active',

        // Contact information
        'email',
        'phone',
        'website',
        'vat', // Tax ID

        // Address
        'street',
        'street2',
        'city',
        'state_id',
        'zip',
        'country_id',

        // Currency and financial
        'currency_id',

        // Parent company
        'parent_id',

        // Company registry
        'company_registry',

        // Report footer
        'report_header',
        'report_footer',
    ],

    'res.users': [
        // Core identification
        'id',
        'name',
        'display_name',
        'create_date',
        'write_date',

        // Status
        'active',

        // Login information
        'login',
        'email',

        // Partner relation
        'partner_id', // Related partner

        // Company
        'company_id',
        'company_ids', // Allowed companies

        // Groups and access
        'groups_id', // Security groups

        // Language and timezone
        'lang',
        'tz',

        // Signature
        'signature',

        // Notification
        'notification_type', // email, inbox
    ],

    'product.product': [
        // Core identification
        'id',
        'name',
        'display_name',
        'create_date',
        'write_date',

        // Status
        'active',

        // Product template
        'product_tmpl_id',

        // Type and category
        'type', // consu, service, product
        'categ_id', // Product category
        'detailed_type', // consu, service, product

        // Pricing
        'list_price', // Sales price
        'standard_price', // Cost
        'currency_id',

        // Sales
        'sale_ok', // Can be sold
        'purchase_ok', // Can be purchased

        // Inventory
        'default_code', // Internal reference/SKU
        'barcode',
        'qty_available', // Quantity on hand
        'virtual_available', // Forecasted quantity

        // Product attributes
        'product_template_attribute_value_ids',

        // Unit of measure
        'uom_id', // Unit of measure
        'uom_po_id', // Purchase unit of measure

        // Tracking
        'tracking', // none, lot, serial

        // Company
        'company_id',

        // Taxes
        'taxes_id', // Customer taxes
        'supplier_taxes_id', // Vendor taxes

        // Description
        'description',
        'description_sale',
        'description_purchase',

        // Weight and volume
        'weight',
        'volume',
    ],

    'product.category': [
        // Core identification
        'id',
        'name',
        'display_name',
        'create_date',
        'write_date',

        // Hierarchy
        'parent_id',
        'parent_path',
        'complete_name',

        // Accounting
        'property_account_income_categ_id', // Income account
        'property_account_expense_categ_id', // Expense account

        // Costing method
        'property_cost_method', // standard, fifo, average

        // Valuation
        'property_valuation', // manual_periodic, real_time
    ],

    'crm.lead': [
        // Core identification
        'id',
        'name', // Opportunity name
        'display_name',
        'create_date',
        'write_date',

        // Status
        'active',
        'type', // lead or opportunity
        'stage_id', // Pipeline stage
        'probability', // Success probability

        // Partner information
        'partner_id', // Customer
        'partner_name',
        'contact_name',
        'email_from',
        'phone',
        'mobile',

        // Address
        'street',
        'street2',
        'city',
        'state_id',
        'zip',
        'country_id',

        // Expected revenue
        'expected_revenue',
        'prorated_revenue',
        'recurring_revenue',
        'recurring_plan', // Monthly, yearly

        // Dates
        'date_deadline', // Expected closing
        'date_closed', // Closed date
        'date_open', // Qualified date

        // Assignment
        'user_id', // Salesperson
        'team_id', // Sales team

        // Company
        'company_id',

        // Source
        'source_id', // Lead source
        'medium_id', // Medium
        'campaign_id', // Campaign

        // Priority
        'priority', // 0-3 stars

        // Description
        'description',

        // Tags
        'tag_ids',

        // Lost reason
        'lost_reason_id',

        // Won/Lost
        'date_conversion', // Lead to opportunity date
    ],

    'account.move.line': [
        // Core identification
        'id',
        'name', // Label
        'display_name',
        'create_date',
        'write_date',

        // Move reference
        'move_id', // Journal entry
        'move_name', // Journal entry number

        // Partner
        'partner_id',

        // Account
        'account_id', // Account

        // Amounts
        'debit', // Debit amount
        'credit', // Credit amount
        'balance', // Balance (debit - credit)
        'amount_currency', // Amount in foreign currency
        'currency_id', // Currency

        // Product
        'product_id',
        'product_uom_id', // Unit of measure
        'quantity', // Quantity

        // Analytic
        'analytic_distribution', // Analytic distribution

        // Tax
        'tax_ids', // Taxes
        'tax_line_id', // Originating tax
        'tax_base_amount', // Base amount for tax

        // Company and journal
        'company_id',
        'journal_id',

        // Date
        'date', // Entry date
        'date_maturity', // Due date

        // Reconciliation
        'reconciled', // Fully reconciled
        'amount_residual', // Residual amount
        'amount_residual_currency', // Residual in foreign currency

        // Sale/Purchase order link
    ],

    'purchase.order': [
        // Core identification
        'id',
        'name', // PO number
        'display_name',
        'create_date',
        'write_date',

        // Status
        'state', // draft, sent, to approve, purchase, done, cancel
        'date_order', // Order date
        'date_approve', // Confirmation date
        'date_planned', // Expected arrival

        // Vendor information
        'partner_id', // Vendor
        'partner_ref', // Vendor reference

        // Financial
        'amount_untaxed',
        'amount_tax',
        'amount_total',
        'currency_id',

        // Order lines
        'order_line', // Purchase order lines

        // Company and user
        'company_id',
        'user_id', // Purchaser

        // Invoicing
        'invoice_ids',
        'invoice_count',
        'invoice_status', // to invoice, invoiced, no

        // Delivery
        'dest_address_id', // Delivery address
        'picking_type_id', // Operation type

        // Payment terms
        'payment_term_id',

        // Fiscal position
        'fiscal_position_id',

        // Notes
        'notes',

        // Origin
        'origin', // Source document
    ],

    'purchase.order.line': [
        // Core identification
        'id',
        'name', // Description
        'display_name',
        'create_date',
        'write_date',

        // Order reference
        'order_id', // Purchase order
        'partner_id', // Vendor
        'sequence',

        // Product
        'product_id',
        'product_uom', // Unit of measure
        'product_qty', // Quantity
        'qty_received', // Received quantity
        'qty_invoiced', // Invoiced quantity

        // Pricing
        'price_unit',
        'price_subtotal',
        'price_total',
        'price_tax',

        // Dates
        'date_planned', // Scheduled date
        'date_order', // Order date

        // Financial
        'currency_id',
        'company_id',

        // Status
        'state', // draft, sent, to approve, purchase, done, cancel

        // Taxes
        'taxes_id',
    ],

    'account.journal': [
        // Core identification
        'id',
        'name',
        'display_name',
        'create_date',
        'write_date',

        // Status
        'active',

        // Journal details
        'code', // Short code
        'type', // sale, purchase, cash, bank, general

        // Currency
        'currency_id',

        // Company
        'company_id',

        // Sequences
        'sequence', // Display order

        // Alias
        'alias_id', // Email alias
    ],

    'account.account': [
        // Core identification
        'id',
        'name',
        'display_name',
        'create_date',
        'write_date',

        // Status
        'deprecated', // Deprecated account

        // Account details
        'code', // Account code
        'account_type', // Account type

        // Reconciliation
        'reconcile', // Allow reconciliation

        // Currency
        'currency_id',

        // Company
        'company_id',

        // Tax
        'tax_ids', // Default taxes

        // Tags
        'tag_ids',

        // Group
        'group_id', // Account group

        // Notes
        'note',
    ],

    'sale.order': [
        // Core identification
        'id',
        'name',
        'display_name',
        'create_date',
        'write_date',

        // Status and dates
        'state', // draft, sent, sale, done, cancel
        'date_order', // Order date
        'validity_date', // Expiration date
        'commitment_date', // Delivery date
        'locked',

        // Customer information
        'partner_id', // Customer (many2one -> res.partner)
        'partner_invoice_id', // Invoice address
        'partner_shipping_id', // Delivery address
        'client_order_ref', // Customer reference

        // Financial
        'amount_untaxed', // Subtotal
        'amount_tax', // Tax amount
        'amount_total', // Total
        'currency_id', // Currency
        'pricelist_id', // Pricelist

        // Order details
        'order_line', // Order lines (one2many)
        'note', // Terms and conditions
        'origin', // Source document
        'reference', // Payment reference

        // Company and user
        'company_id',
        'user_id', // Salesperson
        'team_id', // Sales team

        // Payment
        'payment_term_id', // Payment terms
        'fiscal_position_id', // Fiscal position

        // Invoicing
        'invoice_ids', // Related invoices
        'invoice_count',
        'invoice_status', // to invoice, invoiced, no

        // Signature and payment
        'require_signature',
        'require_payment',
        'signed_by',
        'signed_on',
    ],

    'sale.order.line': [
        // Core identification
        'id',
        'name', // Description
        'display_name',
        'create_date',
        'write_date',

        // Order reference
        'order_id', // Sale order (many2one -> sale.order)
        'order_partner_id', // Customer from order
        'sequence', // Line sequence/position

        // Product information
        'product_id', // Product (many2one -> product.product)
        'product_template_id', // Product template
        'product_uom_qty', // Quantity
        'product_uom', // Unit of measure
        'qty_delivered', // Delivered quantity
        'qty_invoiced', // Invoiced quantity
        'qty_to_invoice', // Quantity to invoice

        // Pricing
        'price_unit', // Unit price
        'price_subtotal', // Subtotal without tax
        'price_total', // Total with tax
        'price_tax', // Tax amount
        'discount', // Discount percentage

        // Financial
        'currency_id', // Currency
        'company_id', // Company

        // Status
        'state', // draft, sale, done, cancel
        'invoice_status', // to invoice, invoiced, upselling

        // Product details
        'customer_lead', // Delivery lead time
        'is_expense', // Is expense
        'is_downpayment', // Is down payment

        // Related documents
        'invoice_lines', // Related invoice lines

        // Salesperson
        'salesman_id', // Salesperson
    ],

    'account.move': [
        // Core identification
        'id',
        'name', // Invoice number
        'display_name',
        'create_date',
        'write_date',

        // Type and status
        'move_type', // entry, out_invoice, out_refund, in_invoice, in_refund, out_receipt, in_receipt
        'state', // draft, posted, cancel
        'payment_state', // not_paid, in_payment, paid, partial, reversed, invoicing_legacy
        'date', // Invoice date
        'invoice_date', // Invoice date
        'invoice_date_due', // Due date

        // Partner information
        'partner_id', // Customer/Vendor
        'commercial_partner_id', // Commercial entity
        'partner_shipping_id', // Delivery address
        'partner_bank_id', // Bank account

        // Financial amounts
        'amount_untaxed', // Subtotal
        'amount_tax', // Tax
        'amount_total', // Total
        'amount_residual', // Amount due
        'amount_untaxed_signed', // Untaxed in company currency
        'amount_total_signed', // Total in company currency
        'currency_id', // Currency

        // Invoice details
        'ref', // Vendor reference
        'narration', // Terms and conditions
        'invoice_line_ids', // Invoice lines

        // Company and journal
        'company_id',
        'journal_id', // Journal
        'fiscal_position_id', // Fiscal position

        // User and team
        'invoice_user_id', // Salesperson
        'team_id', // Sales team

        // Related documents
        'invoice_incoterm_id', // Incoterm
        'auto_post', // Auto-post setting

        // QR code
        'qr_code_method',
        'display_qr_code',
    ],

    'res.partner': [
        // Core identification
        'id',
        'name',
        'display_name',
        'complete_name',
        'create_date',
        'write_date',

        // Type and status
        'active',
        'type', // contact, invoice, delivery, other, private
        'is_company',
        'company_type', // company or person
        'parent_id', // Related company
        'parent_name',

        // Contact information
        'email',
        'phone',
        'mobile',
        'website',

        // Address
        'street',
        'street2',
        'city',
        'state_id', // State/Province
        'zip',
        'country_id', // Country
        'country_code',

        // Business information
        'function', // Job position
        'title', // Title (Mr, Mrs, etc.)
        'vat', // Tax ID
        'company_registry', // Company ID
        'industry_id', // Industry

        // Financial
        'credit_limit',

        // Company relation
        'company_id',
        'user_id', // Salesperson
        'team_id', // Sales team

        // Language and timezone
        'lang', // Language
        'tz', // Timezone

        // Banking
        'bank_ids', // Bank accounts

        // Tags and categorization
        'category_id', // Tags

        // Internal
        'ref', // Internal reference
        'comment', // Notes

        // Child contacts
        'child_ids', // Contact list

        // Customer/Vendor flags
        'customer_rank', // Is customer
        'supplier_rank', // Is vendor
    ],

    'hr.employee': [
        // Core identification
        'id',
        'name',
        'display_name',
        'create_date',
        'write_date',

        // Status
        'active',
        'hr_presence_state', // present, absent, to_define

        // Personal information
        'gender',
        'birthday',
        'place_of_birth',
        'country_of_birth',
        'marital',
        'spouse_complete_name',
        'spouse_birthdate',
        'children',

        // Contact information
        'work_email',
        'work_phone',
        'mobile_phone',

        // Address (private)
        'private_street',
        'private_street2',
        'private_city',
        'private_state_id',
        'private_zip',
        'private_country_id',

        // Work information
        'address_id', // Work address
        'work_location_id', // Work location
        'work_contact_id', // Work contact

        // Job details
        'department_id', // Department
        'job_id', // Job position
        'job_title', // Job title
        'parent_id', // Manager
        'coach_id', // Coach

        // Employment
        'employee_type', // employee, student, trainee, contractor, freelance
        'resource_calendar_id', // Working hours

        // Identification (basic fields only - many don't exist in this Odoo version)
        'ssnid', // SSN
        'permit_no', // Work permit number

        // Company and resource
        'company_id',
        'resource_id', // Resource
        'user_id', // Related user

        // Timezone
        'tz', // Timezone

        // Notes
        'notes', // Notes
        'additional_note',
    ],
};
