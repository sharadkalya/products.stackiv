import { customAlphabet } from 'nanoid';

/**
 * Generates a unique user ID using Nano ID
 * @returns {string} A unique identifier string
 */
export const generateUserId = (): string => {
    const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 12);
    return nanoid();
};

/**
 * Generates a unique guest user ID using Nano ID with 'guest_' prefix
 * @returns {string} A unique identifier string prefixed with 'guest_'
 */
export const generateGuestUserId = (): string => {
    const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 12);
    return `guest_${nanoid()}`;
};
