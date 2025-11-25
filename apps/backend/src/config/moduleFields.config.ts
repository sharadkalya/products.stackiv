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

        // Delivery
        'picking_ids', // Delivery orders
        'delivery_count',

        // Signature
        'require_signature',
        'require_payment',
        'signed_by',
        'signed_on',
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
        'invoice_origin', // Source document
        'invoice_payment_ref', // Payment reference
        'narration', // Terms and conditions
        'invoice_line_ids', // Invoice lines

        // Payment
        'payment_reference', // Payment reference
        'invoice_payment_term_id', // Payment terms
        'amount_paid', // Amount paid

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
        'property_payment_term_id', // Payment terms
        'property_account_position_id', // Fiscal position
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

        // Identification
        'identification_id', // ID number
        'passport_id', // Passport number
        'ssnid', // SSN
        'permit_no', // Work permit number

        // Banking
        'bank_account_id', // Bank account

        // Emergency contact
        'emergency_contact',
        'emergency_phone',

        // Company and resource
        'company_id',
        'resource_id', // Resource
        'user_id', // Related user

        // Timezone
        'tz', // Timezone

        // Notes
        'notes', // Notes
        'additional_note',

        // Vehicle
        'vehicle', // Company vehicle

        // Certificates
        'certificate', // Certificate level
        'study_field', // Field of study
        'study_school', // School

        // Contract info
        'visa_no', // Visa number
        'visa_expire', // Visa expiry

        // Distance and travel
        'km_home_work', // Distance home-work
    ],
};
