import { apiClient } from '../../services/apiClient.js';

/**
 * خدمات الشؤون المالية (Finance Service)
 * Relative paths only — confirm resource names against backend Swagger.
 */
export const financeService = {
    getBudgets: async () => {
        return await apiClient.get('/finance/budgets');
    },

    getTransactions: async () => {
        return await apiClient.get('/finance/transactions');
    },
};
