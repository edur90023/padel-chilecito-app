import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Configura la URL base y un timeout amplio para tolerar el arranque en frío de Render
axios.defaults.baseURL = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';
axios.defaults.timeout = 55000;

// --- Seguimiento global de peticiones para detectar servidor en reposo ---
let pendingRequests = 0;
let slowLoading = false;
let startedAt = null;
let slowTimer = null;
const listeners = new Set();

const notifyListeners = () => {
    const state = {
        active: slowLoading && pendingRequests > 0,
        startedAt
    };
    listeners.forEach((cb) => {
        try {
            cb(state);
        } catch (e) {
            // Ignorar errores en suscriptores
        }
    });
};

export const subscribeServerWakeup = (callback) => {
    listeners.add(callback);
    callback({
        active: slowLoading && pendingRequests > 0,
        startedAt
    });
    return () => listeners.delete(callback);
};

const trackRequestStart = () => {
    if (pendingRequests === 0) {
        startedAt = Date.now();
        if (slowTimer) clearTimeout(slowTimer);
        slowTimer = setTimeout(() => {
            if (pendingRequests > 0) {
                slowLoading = true;
                notifyListeners();
            }
        }, 1800);
    }
    pendingRequests += 1;
};

const trackRequestEnd = () => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    if (pendingRequests === 0) {
        if (slowTimer) {
            clearTimeout(slowTimer);
            slowTimer = null;
        }
        if (slowLoading) {
            slowLoading = false;
            notifyListeners();
        }
        startedAt = null;
    }
};

// Pre-calentamiento silencioso al abrir la aplicación
export const wakeUpServer = () => {
    const keepAliveUrl = API_BASE_URL ? `${API_BASE_URL}/keep-alive` : '/keep-alive';
    axios.get(keepAliveUrl, {
        baseURL: '',
        timeout: 60000,
        skipWakeupBanner: true
    }).catch(() => {
        // Silencioso: las peticiones reales mostrarán el cartel si hiciera falta
    });
};

// --- Interceptor de Petición (Request) ---
axios.interceptors.request.use(
    (config) => {
        if (!config.skipWakeupBanner && !config._tracked) {
            config._tracked = true;
            trackRequestStart();
        }
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        if (error?.config?._tracked) {
            error.config._tracked = false;
            trackRequestEnd();
        }
        return Promise.reject(error);
    }
);

// --- Interceptor de Respuesta (Response) con reintento automático en arranque ---
axios.interceptors.response.use(
    (response) => {
        if (response?.config?._tracked) {
            response.config._tracked = false;
            trackRequestEnd();
        }
        return response;
    },
    async (error) => {
        const config = error?.config;

        // Reintentar automáticamente GET si Render está despertando (sin respuesta, timeout o 502/503/504)
        const status = error?.response?.status;
        const isTransient = !error?.response || error.code === 'ECONNABORTED' || [502, 503, 504].includes(status);
        const isGet = (config?.method || 'get').toLowerCase() === 'get';

        if (config && isGet && isTransient && !config.skipWakeupBanner) {
            config._retryCount = config._retryCount || 0;
            if (config._retryCount < 2) {
                config._retryCount += 1;
                await new Promise((resolve) => setTimeout(resolve, 2500));
                return axios(config);
            }
        }

        if (config?._tracked) {
            config._tracked = false;
            trackRequestEnd();
        }

        if (error.response && error.response.status === 401) {
            const isLoginRequest = error.config && error.config.url && error.config.url.includes('/auth/login');
            if (!isLoginRequest) {
                localStorage.removeItem('token');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default axios;