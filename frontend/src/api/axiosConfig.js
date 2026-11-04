import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Configura la URL base para todas las peticiones de la API
axios.defaults.baseURL = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';


// --- Interceptor de Petición (Request) ---
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- Interceptor de Respuesta (Response) ---
axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            const isLoginRequest = error.config && error.config.url && error.config.url.includes('/auth/login');
            // Si la petición no es de login y hay token vencido, limpiar token
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