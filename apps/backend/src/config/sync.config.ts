/**
 * Odoo Sync Engine Configuration
 * 
 * This file contains all configurable constants for the Odoo sync engine.
 * Modify these values to adjust sync behavior without changing core logic.
 */

export const SYNC_CONFIG = {
    /**
     * Maximum number of records to fetch in a single Odoo API call
     */
    LIMIT_PER_CALL: 1000,

    /**
     * Maximum number of attempts for a failed batch before marking it as permanently failed
     */
    MAX_BATCH_ATTEMPTS: 4,

    /**
     * Number of days to look back for the initial sync
     * E.g., 90 means sync data from the last 90 days
     */
    INITIAL_SYNC_RANGE_DAYS: 2,

    /**
     * Minimum time window size in minutes
     * If a batch window becomes smaller than this, the data is too dense
     */
    MIN_WINDOW_MINUTES: 1,

    /**
     * Maximum time window size in hours
     * Each batch starts with this window size
     */
    MAX_WINDOW_HOURS: 24,

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
     * List of Odoo modules supported for synchronization
     * Only these modules will be synced from Odoo
     */
    SUPPORTED_MODULES: [
        'sale.order',      // Sales Orders
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
    'account.move': 'Invoices',
    'res.partner': 'Contacts',
    'hr.employee': 'Employees',
};

/**
 * Mapping of Odoo module names to MongoDB collection names
 */
export const MODULE_TO_COLLECTION: Record<SupportedModule, string> = {
    'sale.order': 'odoosaleorders',
    'account.move': 'odooinvoices',
    'res.partner': 'odoocontacts',
    'hr.employee': 'odooemployees',
};
