import { apiClient } from '../../services/apiClient.js';

/**
 * خدمات الملحقات والملفات (Attachments Service)
 * Paths are relative to BASE_API_URL — align field name `file` with backend Swagger if different.
 */
function unwrapAttachmentList(response) {
    if (response == null) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    return [];
}

export const attachmentsService = {
    /**
     * @param {File|Blob|FormData} fileOrForm — use FormData if your API expects custom field names
     */
    upload: async (fileOrForm) => {
        const body =
            typeof FormData !== 'undefined' && fileOrForm instanceof FormData
                ? fileOrForm
                : (() => {
                      const fd = new FormData();
                      fd.append('file', fileOrForm);
                      return fd;
                  })();
        return await apiClient.post('/attachments/attachments/upload', body);
    },

    uploadForExtract: async (extract, file) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('extract_id', String(extract.id));
        return await apiClient.post('/attachments/attachments/upload', fd);
    },

    listByExtract: async (extract_id) => {
        try {
            const raw = await apiClient.get(`/attachments/attachments/${encodeURIComponent(extract_id)}`);
            return unwrapAttachmentList(raw);
        } catch {
            return [];
        }
    },

    /** Returns a Blob; use URL.createObjectURL(blob) for downloads. */

    delete: async (id) => {
        return await apiClient.delete(`/attachments/attachments/${encodeURIComponent(id)}`);
    },
};
