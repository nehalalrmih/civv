// src/services/apiRequest.js
import { BASE_API_URL, STORAGE_KEYS } from '../utils/constants.js';
import { showLoader, hideLoader } from '../ui/loader.js';

/** رسالة عند تعذر الوصول للسيرفر */
export const API_NETWORK_ERROR_MESSAGE =
    'تعذر الاتصال بالخادم. تحقق من الشبكة أو إعدادات الخادم (CORS / العنوان).';

export const API_OFFLINE_MESSAGE =
    'لا يوجد اتصال بالإنترنت. تحقق من الشبكة وحاول مرة أخرى.';

function normalizeEndpoint(endpoint) {
    if (endpoint == null || typeof endpoint !== 'string') {
        throw new Error('API request requires a valid endpoint string');
    }
    const trimmed = endpoint.trim();
    if (!trimmed) throw new Error('API endpoint cannot be empty');
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function buildFullUrl(endpoint) {
    const base = BASE_API_URL.replace(/\/+$/, '');
    return `${base}${normalizeEndpoint(endpoint)}`;
}

function isLikelyNetworkFailure(error) {
    if (!error) return false;
    if (error.name === 'TypeError') return true;
    if (typeof error.message !== 'string') return false;
    const m = error.message.toLowerCase();
    return (
        m.includes('failed to fetch') ||
        m.includes('networkerror') ||
        m.includes('load failed') ||
        m.includes('network request failed')
    );
}

function prepareBody(body) {
    if (body === null || body === undefined) {
        return { serialized: undefined, useJsonContentType: false };
    }
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
        return { serialized: body, useJsonContentType: false };
    }
    if (typeof Blob !== 'undefined' && body instanceof Blob) {
        return { serialized: body, useJsonContentType: false };
    }
    if (typeof body === 'string') {
        return { serialized: body, useJsonContentType: false };
    }
    return { serialized: JSON.stringify(body), useJsonContentType: true };
}

async function parseSuccessBody(response, parseAs) {
    if (parseAs === 'blob') return response.blob();
    if (parseAs === 'text') return response.text();
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function parseErrorBody(response) {
    const text = await response.text();
    if (!text) return { message: `HTTP ${response.status}` };
    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
}

function messageFromErrorPayload(data) {
    if (data == null) return null;
    if (typeof data === 'string') return data;
    if (typeof data !== 'object') return String(data);
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
    if (data.detail != null) {
        if (Array.isArray(data.detail)) {
            return data.detail
                .map((d) =>
                    typeof d === 'object' && d !== null && 'msg' in d ? d.msg : JSON.stringify(d),
                )
                .join('; ');
        }
        return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    }
    return null;
}

/**
 * طلب API مركزي — استجابة موحّدة + معالجة أخطاء + دعم وضع عدم الاتصال.
 *
 * @typedef {{ ok: true, data: unknown, status: number }} ApiSuccess
 * @typedef {{ ok: false, error: string, status?: number, code: string, data?: unknown }} ApiFailure
 * @param {string} endpoint
 * @param {RequestInit & { body?: unknown, parseAs?: 'json'|'blob'|'text', skipLoader?: boolean, maxRetries?: number }} [options]
 * @returns {Promise<ApiSuccess | ApiFailure>}
 */
export async function apiRequest(endpoint, options = {}) {
    const path = normalizeEndpoint(endpoint);
    const fullUrl = buildFullUrl(endpoint);
    const method = String(options.method || 'GET').toUpperCase();
    const parseAs = options.parseAs ?? 'json';
    const skipLoader = options.skipLoader === true;
    const maxGetRetries =
        typeof options.maxRetries === 'number' ? options.maxRetries : method === 'GET' ? 1 : 0;

    const {
        parseAs: _parseAs,
        maxRetries: _maxRetries,
        skipLoader: _skipLoader,
        body,
        method: _methodOpt,
        ...fetchOptions
    } = options;
    const { serialized, useJsonContentType } = prepareBody(body);

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return { ok: false, error: API_OFFLINE_MESSAGE, code: 'OFFLINE' };
    }

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const headers = { ...(fetchOptions.headers || {}) };

    if (useJsonContentType && serialized !== undefined) {
        headers['Content-Type'] = 'application/json';
    }
    const isLoginRoute = path === '/auth/login' || path.startsWith('/auth/login?');
    if (token && !isLoginRoute) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!skipLoader) showLoader();

    const run = async (attempt = 0) => {
        try {
            const response = await fetch(fullUrl, {
                ...fetchOptions,
                method,
                headers,
                body: serialized,
            });

            if (!response.ok) {
                const errData = await parseErrorBody(response);
                const msg =
                    messageFromErrorPayload(errData) ||
                    (typeof errData === 'string' ? errData : null) ||
                    `HTTP ${response.status}`;
                console.error(`[API] ${method} ${path}:`, msg);
                return {
                    ok: false,
                    error: typeof msg === 'string' ? msg : JSON.stringify(msg),
                    status: response.status,
                    code: 'HTTP',
                    data: errData,
                };
            }

            const data = await parseSuccessBody(response, parseAs === 'json' ? 'json' : parseAs);
            return { ok: true, data, status: response.status };
        } catch (error) {
            if (method === 'GET' && attempt < maxGetRetries && isLikelyNetworkFailure(error)) {
                await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
                return run(attempt + 1);
            }

            if (isLikelyNetworkFailure(error)) {
                console.error(`[API] ${method} ${path}:`, error?.message || error);
                return { ok: false, error: API_NETWORK_ERROR_MESSAGE, code: 'NETWORK' };
            }

            const msg = error instanceof Error ? error.message : String(error);
            console.error(`[API] ${method} ${path}:`, msg);
            return { ok: false, error: msg, code: 'UNKNOWN' };
        }
    };

    try {
        return await run(0);
    } finally {
        if (!skipLoader) hideLoader();
    }
}
