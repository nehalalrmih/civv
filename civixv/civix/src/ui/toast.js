/**
 * نظام تنبيهات موحّد — استبدال alert()
 * الأنواع: success | error | warning | info
 */

const HOST_ID = 'toast-host';
const DEFAULT_MS = 4500;

const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info',
};

function ensureHost() {
    let host = document.getElementById(HOST_ID);
    if (!host) {
        host = document.createElement('div');
        host.id = HOST_ID;
        host.className = 'toast-host';
        host.setAttribute('aria-live', 'polite');
        document.body.appendChild(host);
    }
    return host;
}

/**
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} [type='info']
 * @param {{ duration?: number }} [opts]
 */
export function showToast(message, type = 'info', opts = {}) {
    const text = message == null ? '' : String(message);
    if (!text) return;

    const t = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
    const host = ensureHost();
    const duration = typeof opts.duration === 'number' ? opts.duration : DEFAULT_MS;

    const el = document.createElement('div');
    el.className = `toast toast--${t}`;
    el.setAttribute('role', t === 'error' ? 'alert' : 'status');

    const icon = document.createElement('i');
    icon.className = `toast__icon fa-solid ${icons[t]}`;
    icon.setAttribute('aria-hidden', 'true');

    const msg = document.createElement('div');
    msg.className = 'toast__msg';
    msg.textContent = text;

    el.appendChild(icon);
    el.appendChild(msg);
    host.appendChild(el);

    const remove = () => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
        el.style.transition = 'opacity 0.2s, transform 0.2s';
        setTimeout(() => el.remove(), 220);
    };

    const tid = setTimeout(remove, duration);
    el.addEventListener('click', () => {
        clearTimeout(tid);
        remove();
    });
}
