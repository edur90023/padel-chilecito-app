import axios from 'axios';

// Decide la URL base dependiendo del entorno (desarrollo o producción)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Configura la URL base para todas las peticiones de la API
axios.defaults.baseURL = `${API_BASE_URL}/api`;


// --- Interceptor de Petición (Request) ---
// Añade el token de autorización a cada petición saliente
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
// Maneja los errores globales, como las sesiones expiradas (error 401)
axios.interceptors.response.use(
    (response) => {
        // Si la respuesta es exitosa, simplemente la devuelve
        return response;
    },
    (error) => {
        // Si el servidor responde con un error 401 (Unauthorized)...
        if (error.response && error.response.status === 401) {
            // 1. Eliminamos el token inválido del almacenamiento
            localStorage.removeItem('token');

            // 2. Redirigimos al usuario a la página de login
            window.location.href = '/login';

            // Opcional: Podrías mostrar un mensaje al usuario
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
        }

        // Para cualquier otro error, simplemente lo devolvemos
        return Promise.reject(error);
    }
);

export default axios;