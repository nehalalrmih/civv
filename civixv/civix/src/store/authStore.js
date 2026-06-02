import { STORAGE_KEYS } from '../utils/constants.js';

/**
 * مخزن بيانات المصادقة (Authentication Data Store)
 * Token is persisted under STORAGE_KEYS.AUTH_TOKEN ('userToken'); value is access_token from API.
 */
export const authStore = {
    setToken: (accessToken) => {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
    },

    getToken: () => {
        return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    },

    clearSession: () => {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    },

    isAuthenticated: () => {
        return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    },
};
