/**
 * تحميل عام أثناء طلبات API — مرجع عدّ (ref-count) لدعم الطلبات المتوازية.
 */

const LOADER_ID = 'global-loader';

let refCount = 0;

function getEl() {
    let el = document.getElementById(LOADER_ID);
    if (!el) {
        el = document.createElement('div');
        el.id = LOADER_ID;
        el.className = 'global-loader';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-busy', 'false');
        el.innerHTML = `
            <div class="global-loader__box">
                <div class="global-loader__spinner" aria-hidden="true"></div>
                <div class="global-loader__text">جاري التحميل...</div>
            </div>`;
        document.body.appendChild(el);
    }
    return el;
}

export function showLoader() {
    refCount += 1;
    const el = getEl();
    el.classList.add('is-active');
    el.setAttribute('aria-busy', 'true');
}

export function hideLoader() {
    refCount = Math.max(0, refCount - 1);
    if (refCount > 0) return;
    const el = document.getElementById(LOADER_ID);
    if (el) {
        el.classList.remove('is-active');
        el.setAttribute('aria-busy', 'false');
    }
}

/** إعادة تعيين حالة التحميل (مثلاً بعد خطأ غير متوقع) */
export function resetLoader() {
    refCount = 0;
    const el = document.getElementById(LOADER_ID);
    if (el) {
        el.classList.remove('is-active');
        el.setAttribute('aria-busy', 'false');
    }
}
