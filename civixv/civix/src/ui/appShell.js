/**
 * تهيئة عناصر الواجهة العامة (Toast + Loader hosts)
 */
import { showToast } from './toast.js';

let wired = false;

export function ensureAppShell() {
    if (typeof document === 'undefined') return;

    if (!document.getElementById('toast-host')) {
        const host = document.createElement('div');
        host.id = 'toast-host';
        host.className = 'toast-host';
        host.setAttribute('aria-live', 'polite');
        document.body.appendChild(host);
    }

    if (!wired) {
        wired = true;
        window.addEventListener('online', () => {
            showToast('تم استعادة الاتصال بالشبكة', 'success', { duration: 3000 });
        });
        window.addEventListener('offline', () => {
            showToast('لا يوجد اتصال بالإنترنت', 'warning', { duration: 6000 });
        });
    }
}
