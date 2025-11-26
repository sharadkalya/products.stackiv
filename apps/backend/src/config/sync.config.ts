/**
 * Odoo Sync Engine Configuration
 * 
 * This file contains all configurable constants for the Odoo sync engine.
 * Modify these values to adjust sync behavior without changing core logic.
 */

export const SYNC_CONFIG = {
    /**
     * Maximum number of records to fetch in a single Odoo API call
     * v2: Used for ID-based pagination limit
     */
    LIMIT_PER_CALL: 200,

    /**
     * Maximum number of attempts for a failed batch before marking it as permanently failed
     */
    MAX_BATCH_ATTEMPTS: 4,

    /**
     * Number of days to look back for the initial sync
     * E.g., 90 means sync data from the last 90 days
     * Set to 3 for testing purposes
     */
    INITIAL_SYNC_RANGE_DAYS: 3,

    /**
     * Fixed time window size in hours for each batch
     * v2: Windows are now fixed and never shrink or adapt
     */
    WINDOW_HOURS: 24,

    /**
     * Delay between API calls in milliseconds to avoid rate limiting
     */
    API_CALL_DELAY_MS: 1000,

    /**
     * Cron schedule for running sync checks
     * Format: every 10 seconds
     * Change to run every 30 seconds, etc. by modifying the value
     */
    CRON_SCHEDULE: '*/10 * * * * *',

    /**
     * Number of users to process concurrently in each cron cycle
     * Higher = faster processing but more memory usage
     * Lower = slower but more memory efficient
     * Recommended: 10-20 for most deployments
     */
    CONCURRENT_USER_LIMIT: 10,

    /**
     * List of Odoo modules supported for synchronization
     * Only these modules will be synced from Odoo
     */
    SUPPORTED_MODULES: [
        'sale.order',      // Sales Orders
        'sale.order.line', // Sales Order Lines
        'account.move',    // Invoices
        'res.partner',     // Contacts/Partners
        'hr.employee',     // Employees
    ] as const,

    /**
     * Cleanup configuration for old batch records
     */
    CLEANUP: {
        /**
         * Enable automatic cleanup of old completed batches
         */
        ENABLED: false,

        /**
         * Number of days to keep completed batch records
         * Batches older than this will be deleted
         */
        RETENTION_DAYS: 30,

        /**
         * Cron schedule for cleanup job
         * Format: every day at 2:00 AM
         */
        SCHEDULE: '0 0 2 * * *',
    },
} as const;

/**
 * Type for supported module names
 */
export type SupportedModule = (typeof SYNC_CONFIG.SUPPORTED_MODULES)[number];

/**
 * Module display names for logging and UI
 */
export const MODULE_DISPLAY_NAMES: Record<SupportedModule, string> = {
    'sale.order': 'Sales Orders',
    'sale.order.line': 'Sales Order Lines',
    'account.move': 'Invoices',
    'res.partner': 'Contacts',
    'hr.employee': 'Employees',
};

/**
 * Mapping of Odoo module names to MongoDB collection names
 */
export const MODULE_TO_COLLECTION: Record<SupportedModule, string> = {
    'sale.order': 'odoosaleorders',
    'sale.order.line': 'odoosaleorderlines',
    'account.move': 'odooinvoices',
    'res.partner': 'odoocontacts',
    'hr.employee': 'odooemployees',
};
