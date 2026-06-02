import { apiClient } from '../../services/apiClient.js';

/**
 * خدمات المشاريع (Projects Service)
 * Relative paths only — base URL comes from apiClient / constants.
 */
function unwrapProjectPayload(response) {
    if (response == null) return null;
    if (typeof response !== 'object') return response;
    if (response.data != null && typeof response.data === 'object' && !Array.isArray(response.data)) {
        return response.data;
    }
    return response;
}

function unwrapProjectList(response) {
    if (response == null) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.projects)) return response.projects;
    return [];
}

/** اسم المشرف من أشكال الاستجابة المختلفة */
export function getSupervisorDisplayName(project) {
    if (!project || typeof project !== 'object') return '';
    const s = project.Supervisor;
    if (typeof s === 'string') return s;
    return (
        s?.Supervisor_name ||
        s?.supervisor_name ||
        project.supervisor_name ||
        project.Supervisor_name ||
        ''
    );
}

/**
 * تصفية محلية: اسم المشروع، رقم العقد، المشرف
 */
export function filterProjectsLocally(projects, query) {
    const q = String(query).trim();
    if (!q) return projects || [];
    const lower = q.toLowerCase();
    const list = projects || [];
    return list.filter((p) => {
        const title = (p.project_title || p.name || '').toLowerCase();
        const contract = String(p.Contract_id || p.contract_id || '').toLowerCase();
        const sup = String(getSupervisorDisplayName(p)).toLowerCase();
        return (
            title.includes(lower) ||
            contract.includes(lower) ||
            sup.includes(lower) ||
            String(p.id || p.project_id || '').includes(q)
        );
    });
}

export const projectsService = {
    getAll: async () => {
        // في دالة getAll
         const raw = await apiClient.get('/project/projectget');
        return unwrapProjectList(raw);
    },

    getById: async (id) => {
        // في دالة update
              return await apiClient.post(`/project/projectUpdate/${id}`, data);
    },

    /** Alias used by views — same as `getAll`. */
    getAllProjects: async () => {
        // في دالة update
            return await apiClient.post(`/project/projectUpdate/${id}`, data);
    },

    /** Alias used by views — returns a single project object or null. */
    getProjectById: async (id) => {
        // في دالة delete
         return await apiClient.delete(`/project/projectUpdate/${encodeURIComponent(id)}`);
        return unwrapProjectPayload(raw);
    },

    /**
     * بحث عبر السيرفر (يُنفَّذ على الـ API): رقم العقد أو اسم المشروع أو اسم المشرف.
     * يُفترض أن يفسّر الخادم المعامل `search` على هذه الحقول معاً.
     * للتوافق مع سيرفرات تستخدم اسم معامل آخر، يُرسل أيضاً `q`.
     */
    search: async (query) => {
        const q = String(query).trim();
        if (!q) return projectsService.getAll();

        const params = new URLSearchParams();
        params.set('search', q);
        params.set('q', q);

        const raw = await apiClient.get(`/project/projectget?${params.toString()}`);
        return unwrapProjectList(raw);
    },

    create: async (data) => {
        const raw = await apiClient.post('/project/projectcreate', data);
        return unwrapProjectPayload(raw);
    },

    update: async (id, data) => {
        return await apiClient.post(`/project/projectUpdate/${id}`, data);
    },

    delete: async (id) => {
        return await apiClient.delete(`/project/projectUpdate/${encodeURIComponent(id)}`);
    },
};
