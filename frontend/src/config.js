// configuration.js
// This file automatically selects the correct API URL based on the environment

const config = {
    // Vercel uses import.meta.env.VITE_API_URL if defined in the dashboard
    // Otherwise, it falls back to localhost for local development
    API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
};

export default config;
