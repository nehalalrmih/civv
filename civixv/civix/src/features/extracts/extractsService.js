import { apiClient } from '../../services/apiClient.js';

export const DUMMY_EXTRACT = {
    id: 1,
    title: 'المستخلص رقم 1',
    total_previous_work: 250000,
    previous_deductions: 15000,
    current_work: 80000,
    discounts: {
        final_guarantee: 3000,
        performance_guarantee: 2000,
        total_discounts: 5000,
        delay_penalty: 0,
        storage_costs: 0,
    },
    net_payment: {
        net_amount_number: 60000,
        net_amount_words: 'ستون الف دينار فقط لا غير',
    },
};

const fallbackById = new Map([[String(DUMMY_EXTRACT.id), { ...DUMMY_EXTRACT }]]);

function firstDefined(...values) {
    for (const v of values) {
        if (v !== undefined && v !== null) return v;
    }
    return undefined;
}

function normalizeAttachments(raw) {
    if (raw == null) return [];
    if (!Array.isArray(raw)) return [];
    return raw.map((a) => {
        if (a == null || typeof a !== 'object') return { name: 'مرفق', link: '' };
        const name = a.name ?? a.file_name ?? a.filename ?? 'مرفق';
        const link = a.link ?? a.url ?? a.file_url ?? a.href ?? '';
        return { ...a, name: String(name), link: link != null ? String(link) : '' };
    });
}

function normalizeExtract(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};

    const id = firstDefined(
        source.id,
        source.extract_id,
        source.extractId,
        source.Extract_id,
        source.ExtractId,
    );
    const extractNumber = firstDefined(source.extract_number, source.number, source.extractNo, id);

    return {
        ...source,
        id,
        extract_number: extractNumber,
        number: extractNumber,
        title:
            source.title ||
            `المستخلص رقم ${extractNumber ?? id ?? ''}`.trim() ||
            'مستخلص',

        total_previous_work: firstDefined(
            source.total_previous_work,
            source.previous,
            source.previous_value,
            source.totalPreviousWork,
        ),
        previous_deductions: firstDefined(
            source.previous_deductions,
            source.totelopp_value,
            source.total_previous_deductions,
            source.previousDeductions,
        ),
        current_work: firstDefined(
            source.current_work,
            source.extract_value,
            source.currentValue,
            source.currentWork,
        ),

        previous: source.previous,
        totelopp_value: source.totelopp_value,
        extract_value: source.extract_value,
        dues_value: source.dues_value,
        Financial_completion_rate: source.Financial_completion_rate,

        discounts: {
            final_guarantee: firstDefined(
                source.final_guarantee,
                source.discounts?.final_guarantee,
                source.finalGuarantee,
            ),
            performance_guarantee: firstDefined(
                source.performance_guarantee,
                source.discounts?.performance_guarantee,
                source.performanceGuarantee,
            ),
            total_discounts: firstDefined(
                source.total_discounts,
                source.discounts?.total_discounts,
                source.totalDiscounts,
            ),
            delay_penalty: firstDefined(
                source.delay_penalty,
                source.discounts?.delay_penalty,
                source.delayPenalty,
            ),
            storage_costs: firstDefined(
                source.storage_costs,
                source.discounts?.storage_costs,
                source.storageCosts,
            ),
        },

        net_payment: {
            net_amount_number: firstDefined(
                source.net_amount_number,
                source.net_payment?.net_amount_number,
                source.dues_value,
                source.netAmountNumber,
            ),
            net_amount_words: firstDefined(
                source.net_amount_words,
                source.net_payment?.net_amount_words,
                source.netAmountWords,
                '',
            ),
        },

        attachments: normalizeAttachments(source.attachments),
    };
}

function unwrapExtractList(response) {
    if (response == null) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    return [];
}

export const extractsService = {
    getByProjectId: async (projectId) => {
        const response = await apiClient.get(`/Extract/get`);
        const list = unwrapExtractList(response);
        const filtered = list.filter((item) => String(item.project_id) === String(projectId));
        return filtered.map(normalizeExtract);
    },

    getById: async (id, projectId) => {
        try {
            const direct = await apiClient.get(`/Extract/extractget/${encodeURIComponent(id)}`);
            if (direct != null) {
                const payload =
                    direct?.data && !Array.isArray(direct.data) ? direct.data : direct;
                const normalized = normalizeExtract(payload);
                if (normalized?.id != null) {
                    fallbackById.set(String(normalized.id), normalized);
                }
                return normalized;
            }
        } catch {
            /* fallback to project/all list */
        }

        if (projectId != null && String(projectId).trim() !== '') {
            try {
                const list = await extractsService.getByProjectId(projectId);
                const found = list.find((e) => String(e.id) === String(id));
                if (found) return found;
            } catch {
                /* fallback to full list lookup */
            }
        }
        try {
            const response = await apiClient.get(`/Extract/get`);
            const list = unwrapExtractList(response);
            const raw = list.find((item) => String(item.id) === String(id));
            return raw ? normalizeExtract(raw) : fallbackById.get(String(id)) ?? null;
        } catch {
            return fallbackById.get(String(id)) ?? null;
        }
    },
    create: async (projectId, data) => {
      try {
       const response = await apiClient.post(`/Extract/post`,
         {
          extract_number: String(data.extract_number),
          extract_date: data.extract_date,
          extract_value: Number(data.extract_value),
          is_posted: true,
	          project_id: Number(projectId),
	         }
	       );

        const payload = response?.data ?? response;
        return normalizeExtract(payload);

    } catch (err) {
        console.log('CREATE EXTRACT ERROR:', err.response?.data || err.message);
        throw err;
    }
},
       update: async (id, data) => {
        try {
        const payload = {
            extract_number: data.extract_number,
            extract_date: data.extract_date,
            extract_value: Number(data.extract_value),
            project_id: data.project_id,
            is_posted: data.is_posted ?? true,
        };

        const response = await apiClient.put(
            `/Extract/update/${encodeURIComponent(id)}`,
            payload
        );

        const normalized = normalizeExtract(response?.data ?? response);

        fallbackById.set(String(normalized.id), normalized);

        return normalized;

    } catch (err) {
        console.log('UPDATE ERROR:', err.response?.data || err.message);
        throw err;
    }
},

    delete: async (id) => {
        return await apiClient.delete(`/Extract/delete/${encodeURIComponent(id)}`);
    },
};
