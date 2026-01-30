import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

export const getStudents = () => api.get('/students');
export const uploadFile = (formData) => api.post('/upload', formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});
export const forceScrape = (rollNumber) => api.post(`/scrape/${rollNumber}`);
export const scrapeAll = () => api.post('/scrape-all');
export const downloadExcel = () => api.get('/export', { responseType: 'blob' });

export default api;
