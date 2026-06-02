import { apiClient } from '../../services/apiClient.js';

export const authService = {
    login: async ({ username, password }) => {
        const params = new URLSearchParams({ username, password });
        const result = await apiClient.post(`/auth/login?${params.toString()}`, null, {
            skipLoader: true,
        });
        return result;
    },
};