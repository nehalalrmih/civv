import { headerView } from '../headerView.js';
import { projectsService } from '../../features/projects/projectsService.js';
import { extractsService } from '../../features/extracts/extractsService.js';
import { SESSION_KEYS } from '../../utils/constants.js';
import { showToast } from '../../ui/toast.js';

function readDetailsContext() {
    try {
        const raw = sessionStorage.getItem(SESSION_KEYS.PROJECT_DETAILS_CONTEXT);
        if (!raw) return { readonly: true, returnHash: '#/financial' };
        const parsed = JSON.parse(raw);
        return {
            readonly: parsed.readonly !== false ? Boolean(parsed.readonly) : false,
            returnHash: typeof parsed.returnHash === 'string' ? parsed.returnHash : '#/financial',
        };
    } catch {
        return { readonly: true, returnHash: '#/financial' };
    }
}

export const projectDetailsView = {
    currentProject: null,
    currentExtract: null,
    detailsReadonly: true,
    returnHash: '#/financial',
    currentProjectId: null,

    render: () => `
${headerView.render()}

<main class="main-content project-details-page" id="projectDetailsRoot">
    <div class="project-details-toolbar">
        <button class="back-btn" id="backToFinancialBtn" type="button">
            <i class="fa-solid fa-arrow-right"></i> العودة
        </button>
    </div>
    
    <h1 class="project-title" id="projectName">تحميل بيانات المشروع...</h1>
    
    <div class="project-grid" id="projectGrid"></div>
    
    <div class="section-head extracts-section-head">
        <h2 class="section-title">المستخلصات</h2>
        <button type="button" class="add-btn hide-when-readonly" id="addExtractBtn">
            <i class="fa-solid fa-plus"></i> إضافة مستخلص
        </button>
    </div>
    <div id="extractsList" class="extracts-container">
        <p class="empty-hint">لا توجد مستخلصات لهذا المشروع</p>
    </div>

    <div class="modal" id="extractModal">
        <div class="modal-content">
            <span class="close-modal" id="closeExtractModal">&times;</span>
            <h2 id="extractModalTitle" style="color: var(--primary-color); margin-bottom: 20px;">إضافة مستخلص</h2>
            
            <div style="text-align: right;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">رقم المستخلص</label>
                    <input id="modal_extract_number" placeholder="أدخل رقم المستخلص" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">تاريخ المستخلص</label>
                    <input type="date" id="modal_extract_date" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">البيان / العنوان</label>
                    <input id="modal_extract_title" placeholder="وصف مختصر للمستخلص" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">قيمة المستخلص</label>
                    <input id="modal_extract_amount" type="number" placeholder="أدخل القيمة" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button type="button" class="btn-primary" id="saveExtractBtn" style="flex: 1;">حفظ</button>
                    <button type="button" id="closeExtractModalBtn" style="flex: 1; background: #95a5a6; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer;">إلغاء</button>
                </div>
            </div>
        </div>
    </div>
</main>
    `,

    getElements: () => ({
        root: document.getElementById('projectDetailsRoot'),
        projectName: document.getElementById('projectName'),
        projectGrid: document.getElementById('projectGrid'),
        extractsList: document.getElementById('extractsList'),
        backBtn: document.getElementById('backToFinancialBtn'),
        addExtractBtn: document.getElementById('addExtractBtn'),
        extractModal: document.getElementById('extractModal'),
        closeExtractModal: document.getElementById('closeExtractModal'),
        closeExtractModalBtn: document.getElementById('closeExtractModalBtn'),
        saveExtractBtn: document.getElementById('saveExtractBtn'),
        extractModalTitle: document.getElementById('extractModalTitle'),
        modalExtractNumber: document.getElementById('modal_extract_number'),
        modalExtractDate: document.getElementById('modal_extract_date'),
        modalExtractTitle: document.getElementById('modal_extract_title'),
        modalExtractAmount: document.getElementById('modal_extract_amount'),
    }),

    applyReadonlyLayout: (readonly, elements) => {
        const root = elements.root || document.getElementById('projectDetailsRoot');
        if (root) {
            root.classList.toggle('project-details--readonly', readonly);
        }
        document.querySelectorAll('.hide-when-readonly').forEach((el) => {
            el.style.display = readonly ? 'none' : '';
        });
    },

    init: async (projectId) => {
        headerView.init();
        const ctx = readDetailsContext();
        projectDetailsView.detailsReadonly = ctx.readonly;
        projectDetailsView.returnHash = ctx.returnHash;
        projectDetailsView.currentProjectId = projectId;

        const elements = projectDetailsView.getElements();
        projectDetailsView.applyReadonlyLayout(ctx.readonly, elements);

        if (elements.backBtn) {
            elements.backBtn.onclick = () => {
                window.location.hash = ctx.returnHash.startsWith('#')
                    ? ctx.returnHash
                    : `#${ctx.returnHash}`;
            };
        }

        try {
            const project = await projectsService.getById(projectId);
            const flat =
                project && typeof project === 'object' && project.data != null && !Array.isArray(project.data)
                    ? project.data
                    : project;
            projectDetailsView.currentProject = flat;
            projectDetailsView.renderProjectData(flat, elements);
            await projectDetailsView.loadExtracts(projectId, elements);
        } catch (error) {
            console.error('Error loading project:', error);
            if (elements.projectName) {
                elements.projectName.textContent = 'خطأ في تحميل بيانات المشروع';
            }
        }

        if (!ctx.readonly) {
            if (elements.addExtractBtn) {
                elements.addExtractBtn.onclick = () => projectDetailsView.openExtractModal(projectId);
            }
            if (elements.closeExtractModal) {
                elements.closeExtractModal.onclick = () => projectDetailsView.closeExtractModal();
            }
            if (elements.closeExtractModalBtn) {
                elements.closeExtractModalBtn.onclick = () => projectDetailsView.closeExtractModal();
            }
            if (elements.saveExtractBtn) {
                elements.saveExtractBtn.onclick = () => projectDetailsView.saveExtract(projectId);
            }
            if (elements.extractModal) {
                elements.extractModal.onclick = (e) => {
                    if (e.target === elements.extractModal) projectDetailsView.closeExtractModal();
                };
            }
        }
    },

    renderProjectData: (project, elements) => {
        if (!project) return;

        const title = project.project_title || project.name || 'تفاصيل المشروع';
        if (elements.projectName) {
            elements.projectName.textContent = title;
        }

        const fields = [
            { label: 'رقم العقد', value: project.Contract_id || project.contract_id || '—' },
            { label: 'الجهة المنفذة', value: project.companies?.companies_name || '—' },
            { label: 'المشرف', value: project.Supervisor?.Supervisor_name || '—' },
            { label: 'قيمة العقد', value: project.Contract_value || '—' },
            { label: 'قيمة الأمر التعديلي', value: project.Contractvalue_edite || '—' },
            { label: 'حالة المشروع', value: project.state || '—' },
            { label: 'مدة التنفيذ', value: project.duration || '—' },
            { label: 'تاريخ التعاقد', value: project.signing_contract || project.contract_date || '—' },
            { label: 'تاريخ استلام الموقع', value: project.delivery_date || project.start_date || '—' },
            { label: 'تاريخ الانتهاء', value: project.finished_date || project.end_date || '—' },
            {
                label: 'نسبة الإنجاز',
                value: project.Achievement_percentage ? `${project.Achievement_percentage}%` : '—',
            },
        ];

        if (elements.projectGrid) {
            elements.projectGrid.innerHTML = fields
                .map(
                    (field) => `
                <div class="project-cell">
                    <div class="cell-title">${field.label}</div>
                    <div class="cell-value">${field.value}</div>
                </div>
            `,
                )
                .join('');
        }
    },

    loadExtracts: async (projectId, elements) => {
        try {
            const extracts = await extractsService.getByProjectId(projectId);
            projectDetailsView.renderExtracts(extracts, elements, projectId);
        } catch (error) {
            console.error('Error loading extracts:', error);
        }
    },

    renderExtracts: (extracts, elements, projectId) => {
        if (!elements.extractsList) return;
        const readonly = projectDetailsView.detailsReadonly;

        if (!extracts || extracts.length === 0) {
            elements.extractsList.innerHTML =
                '<p class="empty-hint">لا توجد مستخلصات لهذا المشروع</p>';
            return;
        }

        elements.extractsList.innerHTML = extracts
            .map((e, i) => {
                const exId = e.id ?? i;
                const detailsHash = `#/projects/${projectId}/extracts/${exId}`;
                const titleText = e.title || `مستخلص ${e.extract_number ?? i + 1}`;
                const amount =
                    e.extract_value != null
                        ? String(e.extract_value)
                        : e.amount != null
                          ? String(e.amount)
                          : '—';
                return `
            <div class="extract-item">
                <div class="extract-item-main">
                    <strong>المستخلص رقم ${e.extract_number ?? i + 1}</strong>
                    <p class="extract-item-sub">${titleText}</p>
                    <span class="extract-item-meta">القيمة: ${amount}</span>
                </div>
                <div class="extract-item-actions">
                    <button type="button" class="edit-btn extract-view-btn" data-extract-id="${exId}" title="عرض التفاصيل">
                        <i class="fa-solid fa-eye"></i> عرض
                    </button>
                    ${
                        readonly
                            ? ''
                            : `
                    <button type="button" class="edit-btn extract-edit-btn" data-extract-id="${exId}" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                    <button type="button" class="delete-btn extract-del-btn" data-extract-id="${exId}" title="حذف"><i class="fa-solid fa-trash"></i></button>`
                    }
                </div>
            </div>`;
            })
            .join('');

        elements.extractsList.querySelectorAll('.extract-view-btn').forEach((btn) => {
            btn.onclick = (ev) => {
                ev.stopPropagation();
                const id = btn.getAttribute('data-extract-id');
                window.location.hash = `#/projects/${projectId}/extracts/${id}`;
            };
        });

        if (!readonly) {
            elements.extractsList.querySelectorAll('.extract-edit-btn').forEach((btn) => {
                btn.onclick = (ev) => {
                    ev.stopPropagation();
                    const extractId = btn.getAttribute('data-extract-id');
                    const extract = extracts.find((ex) => String(ex.id) === String(extractId));
                    projectDetailsView.openExtractModal(projectId, extract);
                };
            });

            elements.extractsList.querySelectorAll('.extract-del-btn').forEach((btn) => {
                btn.onclick = (ev) => {
                    ev.stopPropagation();
                    const extractId = btn.getAttribute('data-extract-id');
                    projectDetailsView.deleteExtract(extractId, projectId);
                };
            });
        }
    },

    openExtractModal: (projectId, extract = null) => {
        const elements = projectDetailsView.getElements();
        const modal = elements.extractModal;
        const title = elements.extractModalTitle;
        const numberInput = elements.modalExtractNumber;
        const dateInput = elements.modalExtractDate;
        const titleInput = elements.modalExtractTitle;
        const amountInput = elements.modalExtractAmount;

        if (modal) modal.classList.add('active');
        const today = new Date().toISOString().slice(0, 10);

        if (extract) {
            title.textContent = 'تعديل مستخلص';
            numberInput.value = extract.extract_number ?? '';
            dateInput.value = (extract.extract_date || '').toString().slice(0, 10) || today;
            titleInput.value = extract.title || '';
            const val = extract.extract_value ?? extract.amount ?? '';
            amountInput.value = val !== '' ? val : '';
            projectDetailsView.currentExtract = extract;
        } else {
            title.textContent = 'إضافة مستخلص';
            numberInput.value = '';
            dateInput.value = today;
            titleInput.value = '';
            amountInput.value = '';
            projectDetailsView.currentExtract = null;
        }
    },

    closeExtractModal: () => {
        const elements = projectDetailsView.getElements();
        if (elements.extractModal) {
            elements.extractModal.classList.remove('active');
        }
    },

    saveExtract: async (projectId) => {
        const elements = projectDetailsView.getElements();
        const extractValue = Number(elements.modalExtractAmount.value);
        const payload = {
            extract_number: elements.modalExtractNumber.value,
            extract_date: elements.modalExtractDate.value || new Date().toISOString().slice(0, 10),
            extract_value: extractValue,
            title: elements.modalExtractTitle.value,
            project_id: Number(projectId),
        };

        if (!payload.extract_number || Number.isNaN(payload.extract_value)) {
            showToast('يرجى إدخال رقم المستخلص وقيمة صحيحة', 'warning');
            return;
        }

        try {
            if (projectDetailsView.currentExtract) {
                await extractsService.update(projectDetailsView.currentExtract.id, payload);
                showToast('تم التحديث بنجاح', 'success');
            } else {
                await extractsService.create(projectId, payload);
                showToast('تمت الإضافة بنجاح', 'success');
            }
            projectDetailsView.closeExtractModal();
            await projectDetailsView.loadExtracts(projectId, elements);
        } catch (error) {
            console.error('Save error:', error);
            showToast('حدث خطأ أثناء الحفظ', 'error');
        }
    },

    deleteExtract: async (extractId, projectId) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستخلص؟')) return;
        try {
            await extractsService.delete(extractId);
            showToast('تم الحذف بنجاح', 'success');
            const elements = projectDetailsView.getElements();
            await projectDetailsView.loadExtracts(projectId, elements);
        } catch (error) {
            console.error('Delete error:', error);
            showToast('فشل في الحذف', 'error');
        }
    },
};
