import { headerView } from '../headerView.js';
import { extractsService } from '../../features/extracts/extractsService.js';
import { attachmentsService } from '../../features/attachments/attachmentsService.js';
import { showToast } from '../../ui/toast.js';

let currentExtract = null;
let currentExtractId = null;
let currentLoadToken = 0;
let editBuffer = {}; // ✅ buffer للتعديلات
let currentAttachments = [];

/* =========================
   Helpers
========================= */

function formatValue(value) {
    if (value == null || value === '') return '—';
    return String(value);
}

function setFieldValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = formatValue(value);
}

/* =========================
   Render
========================= */

function normalizeAttachmentRow(a, idx) {
    return {
        id: a.id ?? a.attachment_id ?? a.pk ?? idx,
        name:
            a.name ||
            a.file_name ||
            a.filename ||
            a.title ||
            a.document_name ||
            `مرفق ${idx + 1}`,
        url: a.url || a.file_url || a.download_url || null,
    };
}

function renderAttachments(attachments) {
    const container = document.getElementById('extractAttachmentsList');
    if (!container) return;

    if (!attachments || attachments.length === 0) {
        container.innerHTML = '<p class="empty-hint">لا توجد مرفقات لهذا المستخلص</p>';
        return;
    }

    container.innerHTML = attachments
        .map((attachment, idx) => {
            const row = normalizeAttachmentRow(attachment, idx);
            const viewBtn = row.url
                ? `<a class="attachment-open-btn" href="${row.url}" target="_blank" rel="noopener noreferrer">عرض</a>`
                : '<span class="attachment-no-link">لا رابط مباشر</span>';

            return `
                <div class="attachment-row">
                    <span class="attachment-name"><i class="fa-solid fa-paperclip"></i> ${row.name}</span>
                    <span class="attachment-actions">${viewBtn}</span>
                </div>
            `;
        })
        .join('');
}

async function loadAttachments() {
    if (!currentExtractId) return;

    try {
        currentAttachments = await attachmentsService.listByExtract(currentExtractId);
        renderAttachments(currentAttachments);
    } catch (err) {
        console.error('LOAD ATTACHMENTS ERROR:', err);
    }
}

function renderData(extract) {
    if (!extract) return;

    setFieldValue(
        'extractTitle',
        extract.title || `المستخلص رقم ${extract.extract_number ?? extract.id}`,
    );

    setFieldValue('date', extract.extract_date);
    setFieldValue('executedValue', extract.Executed_value);
    setFieldValue('previous', extract.previous);
    setFieldValue('currentExtract', extract.extract_value);

    setFieldValue('finalGuarantee', extract.opponent_value_2);
    setFieldValue('performanceGuarantee', extract.opponent_value_5);

    setFieldValue('totalOpp', extract.totelopp_value);
    setFieldValue('netValue', extract.totelextract_value);

    setFieldValue(
        'netAmountWords',
        extract.Financial_completion_rate != null
            ? `${(extract.Financial_completion_rate).toFixed(2)}%`
            : '—'
    );
}

/* =========================
   Bind Editable Fields
========================= */

function bindEditableFields() {
    const items = document.querySelectorAll('[data-field]');

    items.forEach((item) => {
        item.onclick = () => {
            if (!document.body.classList.contains('edit-mode')) return;

            const field = item.dataset.field;
            const valueEl = item.querySelector('p');

            if (!valueEl) return;

            const oldValue = valueEl.textContent || '';

            // منع تكرار input
            if (item.querySelector('input')) return;

            const input = document.createElement('input');
            input.value = oldValue;
            input.style.width = '100%';

            valueEl.replaceWith(input);
            input.focus();

            input.onblur = () => {
                const newValue = input.value;

                // حفظ في البفر
                editBuffer[field] = newValue;

                const p = document.createElement('p');
                p.textContent = newValue || '—';

                input.replaceWith(p);
            };
        };
    });
}

/* =========================
   Buttons
========================= */

function bindButtons() {
    const editBtn = document.querySelector('.edit');
    const doneBtn = document.querySelector('.done');

    if (editBtn && doneBtn) {
        editBtn.onclick = () => {
            document.body.classList.add('edit-mode');
            editBtn.style.display = 'none';
            doneBtn.style.display = 'inline-block';
        };

        doneBtn.onclick = async () => {
            document.body.classList.remove('edit-mode');
            doneBtn.style.display = 'none';
            editBtn.style.display = 'inline-block';

            if (!currentExtractId) return;

            try {
                const updated = {
                    ...currentExtract,
                    ...editBuffer
                };

                currentExtract = await extractsService.update(
                    currentExtractId,
                    updated
                );

                renderData(currentExtract);

                // 🔄 reset buffer
                editBuffer = {};

            } catch (err) {
                console.error('UPDATE ERROR:', err.response?.data || err.message);
            }
        };
    }

    const backBtn = document.getElementById('backToFinancialBtn');

    if (backBtn) {
        backBtn.onclick = () => {
            window.history.back();
        };
    }

    const attachBtn = document.querySelector('.attachment');
    if (attachBtn) {
        attachBtn.onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                attachBtn.disabled = true;
                attachBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الاضافة...';

                try {
                    if (!currentExtract || !currentExtract.id) {
                        throw new Error('تعذر الحصول على  المستخلص الحالي');
                    }

                    // رفع الملف للسيرفر مع ربطه بالمستخلص
                    const response = await attachmentsService.uploadForExtract(currentExtract, file);
                    console.log('Upload success:', response);

                    // تنبيه المستخدم بالنجاح
                    showToast('تم رفع المرفق بنجاح', 'success');

                    await loadAttachments();
                } catch (err) {
                    console.error('UPLOAD ERROR:', err);
                    showToast('فشل رفع المرفق: ' + (err.message || 'خطأ غير معروف'), 'error');
                } finally {
                    attachBtn.disabled = false;
                    attachBtn.innerHTML = '<i class="fa-solid fa-paperclip"></i> إضافة مرفق';
                }
            };
            input.click();
        };
    }
}

/* =========================
   Export View
========================= */

export const extractDetailsView = {
    render: () => `
${headerView.render()}

<main class="main-content extract-page">
      
<div class="project-details-toolbar">
    <button class="back-btn" id="backToFinancialBtn">
        <i class="fa-solid fa-arrow-right"></i>
    </button>
</div>

<h1 class="project-title" id="extractTitle">المستخلص رقم</h1>

<div class="grid-container">

    <div class="grid-item" data-field="extract_date">
        <h4>تاريخ المستخلص</h4>
        <p id="date"></p>
    </div>

    <div class="grid-item">
        <h4>إجمالي قيمة الأعمال المنفذة حتى تاريخ الدفعة الحالية</h4>
        <p id="executedValue"></p>
    </div>

    <div class="grid-item">
        <h4>يطرح قيمة الاعمال المنفذة بالدفعة السابقة</h4>
        <p id="previous"></p>
    </div>

    <div class="grid-item" data-field="extract_value">
        <h4>الاعمال المنفذة بهذه الدفعة</h4>
        <p id="currentExtract"></p>
    </div>

</div>

<h2 class="project-title">الخصميات</h2>

<div class="discounts">

    <div class="discount-item" data-field="opponent_value_2">
        <h5>تأمين نهائي</h5>
        <p id="finalGuarantee"></p>
    </div>

    <div class="discount-item" data-field="opponent_value_5">
        <h5>ضمان حسن التنفيذ</h5>
        <p id="performanceGuarantee"></p>
    </div>

</div>

<div class="net-pay">

    <div class="discount-item">
        <h5>إجمالي الخصميات</h5>
        <p id="totalOpp"></p>
    </div>

    <div class="discount-item">
        <h5>الصافي المستحق صرفه بالارقام</h5>
        <p id="netValue"></p>
    </div>

    <div class="discount-item">
        <h5>نسبة الإنجاز</h5>
        <p id="netAmountWords">—</p>
    </div>

</div>

<h2 class="project-title">المرفقات</h2>
<div id="extractAttachmentsList" class="attachments-list"></div>

<div class="buttons">
    <button class="edit">
        <i class="fa-solid fa-pen"></i> تعديل
    </button>

    <button class="done" style="display:none;">
        <i class="fa-solid fa-check"></i> تم
    </button>

    <button class="attachment">
        <i class="fa-solid fa-paperclip"></i> إضافة مرفق
    </button>
</div>

</main>
`,

    init: () => {
        headerView.init();
        bindButtons();
        bindEditableFields();
    },

    loadExtract: async (extractId) => {
        const token = ++currentLoadToken;
        currentExtractId = String(extractId);

        const projectId = sessionStorage.getItem('activeProjectId');
        const extract = await extractsService.getById(extractId, projectId);
        if (token !== currentLoadToken) return;

        if (!extract) {
            console.error('Extract not found:', extractId);
            return;
        }

        currentExtract = extract;
        editBuffer = {}; // ✅ reset عند التحميل
        renderData(extract);
        await loadAttachments();
    },
};