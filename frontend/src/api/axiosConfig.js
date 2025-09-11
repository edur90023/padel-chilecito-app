import axios from 'axios';

// Usamos la variable de entorno de Vite para la URL de la API
export const API_BASE_URL = import.meta.env.VITE_API_URL;

// Configura la URL base para todas las peticiones de la API
axios.defaults.baseURL = `${API_BASE_URL}/api`;


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
            localStorage.removeItem('token');
            window.location.href = '/login';
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
        }
        return Promise.reject(error);
    }
);

export default axios;