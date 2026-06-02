// src/services/apiClient.js
import { apiRequest } from './apiRequest.js';

/**
 * واجهة متوافقة مع الكود السابق: ترمي خطأ عند فشل الطلب، وتعيد البيانات عند النجاح.
 * جميع الطلبات تمر عبر apiRequest (معالجة موحّدة + تحميل عام).
 *
 * @param {string} endpoint
 * @param {Parameters<typeof apiRequest>[1]} [options]
 */
async function exec(endpoint, options = {}) {
    const result = await apiRequest(endpoint, options);
    if (!result.ok) {
        const err = new Error(result.error || 'فشل الطلب');
        err.status = result.status;
        err.code = result.code;
        err.data = result.data;
        throw err;
    }
    return result.data;
}

export {
    apiRequest,
    API_NETWORK_ERROR_MESSAGE,
    API_OFFLINE_MESSAGE,
} from './apiRequest.js';

export const apiClient = {
    get: (endpoint, options = {}) => exec(endpoint, { ...options, method: 'GET' }),

    post: (endpoint, body = null, options = {}) =>
        exec(endpoint, {
            ...options,
            method: 'POST',
            ...(body != null ? { body } : {}),
        }),

    put: (endpoint, body, options = {}) =>
        exec(endpoint, { ...options, method: 'PUT', body }),

    delete: (endpoint, options = {}) => exec(endpoint, { ...options, method: 'DELETE' }),
};
