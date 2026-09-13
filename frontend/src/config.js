// API and WebSocket base URLs
// In development, defaults to localhost:8000
// In production (Vercel), configure via VITE_API_URL and VITE_WS_URL in environment settings

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

const defaultWsUrl = API_BASE_URL.replace(/^http/, 'ws');
const rawWsUrl = import.meta.env.VITE_WS_URL || defaultWsUrl;
export const WS_BASE_URL = rawWsUrl.replace(/\/+$/, '');
