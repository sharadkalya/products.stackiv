export const ODOO_CONNECTION_STATUS = {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAIL: 'fail',
} as const;

export const ODOO_FORM_LABELS = {
    ORG_NAME: 'Organization Name',
    ODOO_URL: 'Odoo URL',
    DB_NAME: 'Database Name',
    USERNAME: 'Username/Email',
    PASSWORD: 'Password',
} as const;

export const ODOO_FORM_PLACEHOLDERS = {
    ORG_NAME: 'What should we call you?',
    ODOO_URL: 'https://your-instance.odoo.com',
    DB_NAME: 'your-database-name',
    USERNAME: 'admin@example.com',
    PASSWORD: '••••••••',
} as const;

export const ODOO_MESSAGES = {
    TEST_CONNECTION_SUCCESS: 'Connection successful! Your Odoo credentials are valid.',
    TEST_CONNECTION_FAIL: 'Connection failed. Please check your credentials and try again.',
    TEST_CONNECTION_ERROR: 'An error occurred while testing the connection.',
    TESTING_CONNECTION: 'Testing connection...',
} as const;
