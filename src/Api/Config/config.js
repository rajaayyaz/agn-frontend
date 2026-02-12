// Resolve BASE_URL safely for browser builds.
// - Vite: set VITE_API_URL in your .env and it will be available as import.meta.env.VITE_API_URL
// - Create-React-App: REACT_APP_API_URL would be injected at build time (process.env)
// - For runtime overrides you can set window.__env = { REACT_APP_API_URL: '...' } before the app loads
const getBaseUrl = () => {
  // 1) Vite-style import.meta.env
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch (e) {
    // ignore
  }

  // 2) process.env fallback (access via globalThis to avoid ReferenceError in some browsers)
  try {
    const proc = typeof globalThis !== 'undefined' ? globalThis['process'] : undefined;
    if (proc && proc.env && proc.env.REACT_APP_API_URL) {
      return proc.env.REACT_APP_API_URL;
    }
  } catch (e) {
    // ignore
  }

  // 3) runtime override via window (set before the bundle loads)
  try {
    if (typeof window !== 'undefined' && window.__env && window.__env.REACT_APP_API_URL) {
      return window.__env.REACT_APP_API_URL;
    }
  } catch (e) {
    // ignore
  }

  // default
  return 'http://localhost:8000';
};

const CONFIG = {
  BASE_URL: getBaseUrl(),
};

// Debug: Log the BASE_URL on initialization
console.log('🔧 API Configuration:', CONFIG.BASE_URL);

export default CONFIG;
