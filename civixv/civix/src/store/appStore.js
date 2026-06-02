/**
 * مخزن خفيف للتطبيق — بدون مكتبات خارجية.
 * الحالة: projects, stats, user — مع اشتراك بسيط للتحديثات اليدوية.
 */

const state = {
    projects: null,
    stats: null,
    user: null,
};

const listeners = new Set();

function snapshot() {
    return {
        projects: state.projects,
        stats: state.stats,
        user: state.user,
    };
}

function notify() {
    const snap = snapshot();
    listeners.forEach((fn) => {
        try {
            fn(snap);
        } catch (e) {
            console.error('[appStore] listener error', e);
        }
    });
}

export const appStore = {
    getState: () => snapshot(),

    setProjects(projects) {
        state.projects = projects;
        notify();
    },

    setStats(stats) {
        state.stats = stats;
        notify();
    },

    /** @param {object|null} user */
    setUser(user) {
        state.user = user;
        notify();
    },

    /**
     * @param {(s: ReturnType<typeof snapshot>) => void} fn
     * @returns {() => void} إلغاء الاشتراك
     */
    subscribe(fn) {
        if (typeof fn !== 'function') return () => {};
        listeners.add(fn);
        return () => listeners.delete(fn);
    },
};
