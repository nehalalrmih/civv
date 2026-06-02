/**
 * مستخلص — نموذج موحّد وواجهة عرض/إضافة
 *
 * @typedef {Object} ExtractItem
 * @property {string|number} [id] — معرّف الخادم إن وُجد
 * @property {string} title — النص المعروض
 */

/**
 * يحوّل أي شكل شائع من الـ API إلى ExtractItem.
 * @param {object|null|undefined} raw
 * @param {number} index
 * @returns {ExtractItem}
 */
export function normalizeExtract(raw, index = 0) {
    if (raw == null || typeof raw !== 'object') {
        return { title: `المستخلص رقم ${index + 1}`, attachments: [] };
    }
    const title =
        raw.title ?? `المستخلص رقم ${raw.extract_number ?? index + 1}`;
        raw.name ??
        raw.extract_title ??
        raw.extractTitle ??
        raw.label ??
        `المستخلص رقم ${index + 1}`;
    const id = raw.id ?? raw.extract_id ?? raw.extractId;
    const attachments = Array.isArray(raw.attachments) ? raw.attachments : [];
    const base = { title: String(title), attachments };
    return id != null && id !== '' ? { id, ...base } : base;
}

/**
 * يقبل مصفوفة أو كائن مشروع يحوي extracts / Extracts.
 * @param {unknown} source
 * @returns {ExtractItem[]}
 */
export function normalizeExtractList(source) {
    if (source == null) return [];
    let arr;
    if (Array.isArray(source)) {
        arr = source;
    } else if (typeof source === 'object') {
        arr = source.extracts ?? source.Extracts ?? [];
    } else {
        return [];
    }
    if (!Array.isArray(arr)) return [];
    return arr.map((item, i) => normalizeExtract(item, i));
}

/**
 * عنصر جديد للعرض المحلي قبل الحفظ على الخادم.
 * @param {number} listLength طول القائمة الحالية
 * @returns {ExtractItem}
 */
export function createNewExtractItem(listLength) {
    const n = typeof listLength === 'number' && listLength >= 0 ? listLength : 0;
    return { title: `مستخلص جديد ${n + 1}` };
}

/**
 * يعرض قائمة المستخلصات داخل حاوية.
 * @param {HTMLElement|null} container
 * @param {ExtractItem[]} items
 */
export function renderExtractsList(container, items) {
    if (!container) return;
    container.innerHTML = '';
    const list = Array.isArray(items) ? items : [];

    if (list.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'extract-item extract-item--empty';
        empty.textContent = 'لا توجد مستخلصات';
        container.appendChild(empty);
        return;
    }

    list.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'extract-item';
        div.dataset.extractIndex = String(i);
        const resolvedExtractId = item.id ?? item.extract_id ?? item.extractId ?? null;
        if (resolvedExtractId != null && resolvedExtractId !== '') {
            div.dataset.extractId = String(resolvedExtractId);
        }
        div.textContent = item.title;
        if (resolvedExtractId != null && resolvedExtractId !== '') {
            div.addEventListener('click', () => {
                window.location.hash = `#/extracts/${encodeURIComponent(resolvedExtractId)}`;
            });
        }
        container.appendChild(div);
    });
}

/**
 * ربط زر «إضافة مستخلص» (المعرّف الموصى به: #addExtractBtn).
 * @param {object} options
 * @param {() => HTMLElement|null|undefined} options.getButton
 * @param {() => HTMLElement|null|undefined} options.getContainer — عادة #extractsList
 * @param {() => ExtractItem[]} options.getExtracts
 * @param {(next: ExtractItem[]) => void} options.setExtracts
 */
export function bindAddExtractButton(options) {
    const { getButton, getContainer, getExtracts, setExtracts } = options;
    if (typeof getButton !== 'function' || typeof setExtracts !== 'function') return;

    const btn = getButton();
    if (!btn) return;

    btn.onclick = () => {
        const current = Array.isArray(getExtracts()) ? [...getExtracts()] : [];
        const next = [...current, createNewExtractItem(current.length)];
        setExtracts(next);
        const container = typeof getContainer === 'function' ? getContainer() : null;
        renderExtractsList(container, next);
    };
}
