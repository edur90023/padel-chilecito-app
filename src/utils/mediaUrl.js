import { API_BASE_URL } from '../api/axiosConfig';

export const resolveMediaUrl = (url) => {
    if (typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('/uploads/') && API_BASE_URL) {
        return `${API_BASE_URL}${trimmed}`;
    }
    return trimmed;
};
