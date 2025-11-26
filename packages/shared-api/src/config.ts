// Configuration for API endpoints
// Using relative path so requests go through Next.js proxy (same origin)
// This ensures cookies are properly shared between frontend and backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
