import { headerView } from '../headerView.js';
import { projectsService, filterProjectsLocally } from '../../features/projects/projectsService.js';
import { SESSION_KEYS } from '../../utils/constants.js';
import { appStore } from '../../store/appStore.js';
import { showToast } from '../../ui/toast.js';

function navigateToProjectDetails(projectId) {
    const returnHash = (window.location.hash && window.location.hash !== '#')
        ? window.location.hash : '#/facilities';
    sessionStorage.setItem(SESSION_KEYS.PROJECT_DETAILS_CONTEXT, JSON.stringify({ readonly: false, returnHash }));
    window.location.hash = `#/projects/${projectId}`;
}

const STATUS_MAP = {
    not_started: '<span style="color:#6c757d;font-weight:bold;">لم يبدأ</span>',
    in_progress:  '<span style="color:#007bff;font-weight:bold;">جاري</span>',
    stopped:      '<span style="color:#dc3545;font-weight:bold;">متوقف</span>',
    finished:     '<span style="color:#28a745;font-weight:bold;">منتهي</span>',
};

const DEPARTMENTS = [
    { value: 'المرافق',                        label: 'المرافق',                        icon: 'fa-solid fa-wrench',              color: '#e8f4fd', iconColor: '#2196f3' },
    { value: 'الدراسات والتصاميم',             label: 'الدراسات والتصاميم',             icon: 'fa-solid fa-drafting-compass',    color: '#f3e8fd', iconColor: '#9c27b0' },
    { value: 'الإسكان',                        label: 'الإسكان',                        icon: 'fa-solid fa-house',               color: '#e8fdf0', iconColor: '#4caf50' },
    { value: 'المشروعات',                      label: 'المشروعات',                      icon: 'fa-solid fa-diagram-project',     color: '#fdf3e8', iconColor: '#ff9800' },
    { value: 'الموارد البشرية',                label: 'الموارد البشرية',                icon: 'fa-solid fa-users',               color: '#fde8e8', iconColor: '#f44336' },
    { value: 'التخطيط والمتابعة والتوثيق',     label: 'التخطيط والمتابعة والتوثيق',     icon: 'fa-solid fa-chart-gantt',         color: '#e8f0fd', iconColor: '#3f51b5' },
    { value: 'المراجعة الداخلية',              label: 'المراجعة الداخلية',              icon: 'fa-solid fa-magnifying-glass-chart', color: '#fdfce8', iconColor: '#8BC34A' },
    { value: 'الشؤون المالية',                 label: 'الشؤون المالية',                 icon: 'fa-solid fa-coins',               color: '#e8fdf8', iconColor: '#009688' },
    { value: 'الشؤون القانونية',               label: 'الشؤون القانونية',               icon: 'fa-solid fa-scale-balanced',      color: '#fde8f5', iconColor: '#e91e63' },
];

export const projectsView = {

    render: () => `
        ${headerView.render()}

        <style>
            body { margin:0; padding:0; background:#f4f6f9; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; }

            /* ── Layout ── */
            .main-wrapper { display:flex; gap:20px; padding:20px; max-width:1400px; margin:40px auto 0; align-items:flex-start; }

            .sidebar { width:250px; background:#fff; border:1px solid #e1e4e8; border-radius:12px; box-shadow:0 2px 5px rgba(0,0,0,.05); display:flex; flex-direction:column; overflow:hidden; flex-shrink:0; }
            .sidebar-header { padding:20px; font-size:18px; font-weight:bold; color:var(--primary-color,#2c3e50); border-bottom:1px solid #eee; background:#fafbfc; }
            .sidebar-btn { background:transparent; border:none; border-bottom:1px solid #f5f5f5; padding:15px 20px; text-align:right; cursor:pointer; font-size:15px; color:#555; display:flex; align-items:center; justify-content:space-between; transition:all .2s; width:100%; }
            .sidebar-btn:hover { background:#f0f7ff; color:#0056b3; padding-right:25px; }
            .sidebar-btn.active { background:#e6f0fa; border-right:4px solid #0056b3; }
            .sidebar-btn i { font-size:16px; color:#888; }

            .content { flex:1; background:#fff; padding:25px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); min-height:80vh; }

            .projects-toolbar { background:#fff; padding:15px 20px; margin-bottom:25px; border-radius:8px; border:1px solid #e0e0e0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; }
            .search-bar { position:relative; flex:1; max-width:500px; }
            .search-bar input { width:100%; padding:10px 40px 10px 15px; border:1px solid #ccc; border-radius:6px; font-size:14px; color:#000; box-sizing:border-box; }
            .search-bar input:focus { border-color:#0056b3; outline:none; }
            .search-bar button { position:absolute; left:5px; top:50%; transform:translateY(-50%); border:none; background:#0056b3; color:#fff; border-radius:4px; width:32px; height:32px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
            .add-btn { background:#1a4f8a; color:#fff; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:600; display:flex; align-items:center; gap:8px; }

            .table-box { overflow-x:auto; border:1px solid #e0e0e0; border-radius:8px; }
            .projects-table { width:100%; border-collapse:collapse; font-size:14px; }
            .projects-table thead { background:#f8f9fa; color:#495057; }
            .projects-table th { padding:14px 15px; text-align:right; font-weight:700; border-bottom:2px solid #f1f3fb; }
            .projects-table td { padding:14px 15px; border-bottom:1px solid #e9ecef; color:#000 !important; font-weight:600; vertical-align:middle; }
            .projects-table tr:hover { background:#f8f9fa; }

            /* ── Modal base ── */
            .modal { display:none; position:fixed; z-index:1000; inset:0; background:rgba(0,0,0,.5); align-items:center; justify-content:center; }
            .modal.active { display:flex; }
            .modal-content { background:#fff; padding:30px; border-radius:10px; width:90%; max-width:850px; position:relative; box-shadow:0 5px 15px rgba(0,0,0,.3); max-height:90vh; overflow-y:auto; }
            .close-modal { position:absolute; top:15px; left:20px; font-size:30px; font-weight:bold; cursor:pointer; color:#999; }
            .close-modal:hover { color:#333; }
            .modal-title { margin:0 0 20px; color:#333; border-bottom:1px solid #eee; padding-bottom:10px; }

            /* ── Form ── */
            .form-grid { display:grid; grid-template-columns:1fr 1fr; column-gap:25px; row-gap:20px; }
            .form-group { margin:0; }
            .form-group.full-width { grid-column:span 2; }
            .form-group label { display:block; margin-bottom:8px; font-weight:700; font-size:14px; color:#333; }
            .form-group input[type="text"],
            .form-group input[type="number"],
            .form-group input[type="date"] { width:100%; padding:12px; border:1px solid #ccc; border-radius:6px; font-size:15px; color:#000; font-weight:500; box-sizing:border-box; transition:.2s; }
            .form-group input:focus { border-color:#0056b3; outline:none; box-shadow:0 0 0 3px rgba(0,86,179,.1); }
            .select-style select { width:100%; height:44px; padding:0 15px 0 40px; border:2px solid #bdc3c7; border-radius:6px; font-size:15px; font-weight:500; background:#fff; color:#000; cursor:pointer; appearance:none; background-image:url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg' width%3D'292.4' height%3D'292.4'%3E%3Cpath fill%3D'%23000' d%3D'M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-5 0-9.3 1.8-12.9 5.4A17.6 17.6 0 0 0 0 82.2c0 5 1.8 9.3 5.4 12.9l128 127.9c3.6 3.6 7.8 5.4 12.8 5.4s9.2-1.8 12.8-5.4L287 95c3.5-3.5 5.4-7.8 5.4-12.8 0-5-1.9-9.2-5.5-12.8z'%2F%3E%3C%2Fsvg%3E"); background-repeat:no-repeat; background-position:left 12px center; background-size:10px; transition:.2s; }
            .select-style select:focus { border-color:#0056b3; outline:none; box-shadow:0 0 0 3px rgba(0,86,179,.1); }
            .modal-actions { margin-top:30px; display:flex; justify-content:flex-end; gap:10px; padding-top:20px; border-top:1px solid #eee; }
            .btn-primary   { background:#0056b3; color:#fff; border:none; padding:10px 25px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:14px; }
            .btn-secondary { background:#6c757d; color:#fff; border:none; padding:10px 25px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:14px; }
            .btn-success   { background:#28a745; color:#fff; border:none; padding:10px 22px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:14px; display:flex; align-items:center; gap:7px; }
            .btn-warning   { background:#ffc107; color:#000; border:none; padding:6px 13px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:13px; }
            .btn-danger    { background:#dc3545; color:#fff; border:none; padding:6px 13px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:13px; }

            /* ── Sub table ── */
            .sub-table { width:100%; border-collapse:collapse; }
            .sub-table th, .sub-table td { padding:13px 16px; text-align:right; border-bottom:1px solid #eee; }
            .sub-table th { background:#f0f4fa; color:#333; font-weight:bold; font-size:14px; }
            .sub-table td { color:#000 !important; font-size:14px; }
            .sub-table tr:hover { background:#f8f9fa; }
            .icon-btn { background:none; border:none; cursor:pointer; color:#999; padding:5px; border-radius:4px; transition:.2s; font-size:16px; }
            .icon-btn:hover { color:#d32f2f; background:#ffebee; }

            /* ── Big list modal ── */
            .list-modal-content {
                background:#fff; padding:0; border-radius:12px;
                width:96%; max-width:1100px; position:relative;
                box-shadow:0 8px 30px rgba(0,0,0,.25);
                max-height:92vh; display:flex; flex-direction:column; overflow:hidden;
            }
            .list-modal-header {
                padding:22px 30px; background:#1a4f8a; color:#fff;
                display:flex; justify-content:space-between; align-items:center;
                border-radius:12px 12px 0 0; flex-shrink:0;
            }
            .list-modal-header h2 { margin:0; font-size:22px; }
            .list-modal-header .close-modal { position:static; color:#fff; font-size:28px; line-height:1; }
            .list-modal-header .close-modal:hover { color:#ffe; }
            .list-modal-body { flex:1; overflow-y:auto; padding:25px 30px; }
            .list-modal-footer {
                padding:18px 30px; border-top:1px solid #eee;
                display:flex; justify-content:flex-end;
                background:#fafbfc; border-radius:0 0 12px 12px; flex-shrink:0;
            }

            /* ── Small add/edit modal ── */
            .add-modal-content {
                background:#fff; padding:35px; border-radius:12px;
                width:92%; max-width:560px; position:relative;
                box-shadow:0 5px 20px rgba(0,0,0,.3);
            }
            .add-modal-content .modal-title { font-size:19px; }
            .add-modal-fields { display:flex; flex-direction:column; gap:18px; margin-bottom:5px; }
            .add-modal-fields .form-group { margin:0; }
            .add-modal-fields input[type="text"] {
                width:100%; padding:12px 14px; border:1.5px solid #d0d7de;
                border-radius:8px; font-size:15px; color:#000;
                box-sizing:border-box; transition:.2s;
            }
            .add-modal-fields input[type="text"]:focus { border-color:#0056b3; outline:none; box-shadow:0 0 0 3px rgba(0,86,179,.1); }

            /* ── Custom department select ── */
            .dept-select-wrapper { position:relative; user-select:none; }

            .dept-selected {
                display:flex; align-items:center; justify-content:space-between;
                padding:12px 16px; border:2px solid #d0d7de; border-radius:8px;
                background:#fff; cursor:pointer; font-size:15px; color:#888;
                transition:all .25s; min-height:48px;
            }
            .dept-selected:hover { border-color:#0056b3; background:#f8f9fa; }
            .dept-selected.open  { border-color:#0056b3; border-bottom-left-radius:0; border-bottom-right-radius:0; box-shadow:0 -2px 8px rgba(0,86,179,.08); }
            .dept-selected.has-value { color:#1a1a2e; font-weight:600; }

            .dept-arrow { color:#aaa; font-size:12px; transition:transform .3s; flex-shrink:0; margin-right:8px; }
            .dept-selected.open .dept-arrow { transform:rotate(180deg); color:#0056b3; }

            .dept-dropdown {
                display:none; position:absolute; top:100%; right:0; left:0; z-index:9999;
                background:#fff; border:2px solid #0056b3; border-top:none;
                border-bottom-left-radius:8px; border-bottom-right-radius:8px;
                box-shadow:0 8px 24px rgba(0,86,179,.13); overflow:hidden;
            }
            .dept-dropdown.open { display:block; animation:dropFade .18s ease; }
            @keyframes dropFade { from { opacity:0; transform:translateY(-5px); } to { opacity:1; transform:translateY(0); } }

            .dept-search-wrap {
                display:flex; align-items:center; gap:10px;
                padding:10px 14px; border-bottom:1px solid #eef1f6; background:#f8f9fa;
            }
            .dept-search-icon { color:#bbb; font-size:13px; flex-shrink:0; }
            .dept-search { border:none; outline:none; background:transparent; font-size:14px; color:#333; width:100%; direction:rtl; }
            .dept-search::placeholder { color:#ccc; }

            .dept-options { max-height:230px; overflow-y:auto; }
            .dept-options::-webkit-scrollbar { width:5px; }
            .dept-options::-webkit-scrollbar-thumb { background:#c5cfe0; border-radius:4px; }

            .dept-option {
                display:flex; align-items:center; gap:12px;
                padding:12px 18px; cursor:pointer; font-size:14px; color:#333;
                border-bottom:1px solid #f5f5f5; transition:background .15s; direction:rtl;
            }
            .dept-option:last-child { border-bottom:none; }
            .dept-option:hover { background:#eef4ff; color:#0056b3; }
            .dept-option.selected { background:#e6f0fa; color:#0056b3; font-weight:700; }
            .dept-option.hidden { display:none; }

            .dept-check { margin-right:auto; color:#0056b3; font-size:13px; display:none; }
            .dept-option.selected .dept-check { display:inline; }

            .dept-icon-wrap {
                width:34px; height:34px; border-radius:8px; flex-shrink:0;
                display:flex; align-items:center; justify-content:center; font-size:14px;
            }
            .dept-selected-icon {
                width:28px; height:28px; border-radius:6px; flex-shrink:0;
                display:flex; align-items:center; justify-content:center; font-size:13px;
                margin-left:10px;
            }
        </style>

        <div class="main-wrapper">
            <aside class="sidebar">
                <button class="sidebar-btn" id="openCompaniesModalBtn">
                    <span>الشركات</span><i class="fa-solid fa-building"></i>
                </button>
                <button class="sidebar-btn" id="openEngineersModalBtn">
                    <span>المهندسين المشرفين</span><i class="fa-solid fa-user-tie"></i>
                </button>
            </aside>

            <main class="content">
                <div class="projects-toolbar">
                    <div class="search-bar">
                        <input type="text" id="projectSearch" placeholder="ابحث برقم العقد أو اسم المشروع..." autocomplete="off">
                        <button type="button" id="projectSearchBtn"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>
                    <button class="add-btn" id="openAddModalBtn">
                        <i class="fa-solid fa-plus"></i> إضافة مشروع
                    </button>
                </div>
                <div class="table-box">
                    <table class="projects-table">
                        <thead>
                            <tr>
                                <th style="width:50px;">م</th>
                                <th>اسم المشروع</th>
                                <th>الشركة</th>
                                <th>الحالة</th>
                                <th>الإنجاز</th>
                                <th>القيمة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="projectsTbody"></tbody>
                    </table>
                </div>
            </main>
        </div>

        <!-- ═══════════ PROJECT MODAL ═══════════ -->
        <div class="modal" id="projectModal">
            <div class="modal-content">
                <span class="close-modal" id="closeModalBtn">&times;</span>
                <h2 class="modal-title" id="modalTitle">بيانات المشروع</h2>
                <div class="form-grid">
                    <div class="form-group full-width">
                        <label>اسم المشروع</label>
                        <input type="text" id="modal_name" placeholder="أدخل اسم المشروع الكامل">
                    </div>
                    <div class="form-group">
                        <label>رقم العقد</label>
                        <input type="text" id="modal_contract" placeholder="رقم العقد">
                    </div>
                    <div class="form-group">
                        <label>قيمة العقد (د.ل)</label>
                        <input type="number" id="modal_value" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label>قيمة العقد بعد التعديل (د.ل)</label>
                        <input type="number" id="modal_value_modified" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label>مدة العقد (يوم)</label>
                        <input type="number" id="modal_duration" placeholder="عدد الأيام" min="0">
                    </div>
                    <div class="form-group select-style">
                        <label>الشركة المنفذة</label>
                        <select id="modal_company"><option value="">اختر الشركة...</option></select>
                    </div>
                    <div class="form-group select-style">
                        <label>المهندس المشرف</label>
                        <select id="modal_engineer"><option value="">اختر المهندس...</option></select>
                    </div>
                    <div class="form-group">
                        <label>تاريخ توقيع العقد</label>
                        <input type="date" id="modal_signingDate">
                    </div>
                    <div class="form-group">
                        <label>تاريخ التسليم</label>
                        <input type="date" id="modal_deliveryDate">
                    </div>
                    <div class="form-group">
                        <label>تاريخ الانتهاء</label>
                        <input type="date" id="modal_endDate">
                    </div>
                    <div class="form-group">
                        <label>نسبة الإنجاز الفنية (%)</label>
                        <input type="number" id="modal_progress" min="0" max="100" placeholder="0 - 100">
                    </div>
                    <div class="form-group full-width select-style">
                        <label>حالة المشروع</label>
                        <select id="modal_status">
                            <option value="not_started">لم يبدأ</option>
                            <option value="in_progress">جاري التنفيذ</option>
                            <option value="stopped">متوقف</option>
                            <option value="finished">منتهي</option>
                        </select>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" id="closeModalBtn2">إلغاء</button>
                    <button class="btn-primary" id="saveProjectModalBtn">حفظ البيانات</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ COMPANIES LIST MODAL (big) ═══════════ -->
        <div class="modal" id="companiesModal">
            <div class="list-modal-content">
                <div class="list-modal-header">
                    <h2><i class="fa-solid fa-building" style="margin-left:10px;"></i>سجل الشركات</h2>
                    <span class="close-modal close-companies-btn">&times;</span>
                </div>
                <div class="list-modal-body">
                    <table class="sub-table">
                        <thead>
                            <tr>
                                <th style="width:50px;">#</th>
                                <th>اسم الشركة</th>
                                <th>المالك</th>
                                <th>الهاتف</th>
                                <th style="width:120px;text-align:center;">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="companiesTbody">
                            <tr><td colspan="5" style="text-align:center;padding:20px;">جاري التحميل...</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="list-modal-footer">
                    <button class="btn-success" id="openAddCompanyFormBtn">
                        <i class="fa-solid fa-plus"></i> إضافة شركة
                    </button>
                </div>
            </div>
        </div>

        <!-- ═══════════ ADD / EDIT COMPANY MODAL (small) ═══════════ -->
        <div class="modal" id="addCompanyModal">
            <div class="add-modal-content">
                <span class="close-modal" id="closeAddCompanyModalBtn">&times;</span>
                <h2 class="modal-title" id="addCompanyModalTitle">إضافة شركة جديدة</h2>
                <div class="add-modal-fields">
                    <div class="form-group">
                        <label>اسم الشركة <span style="color:red;">*</span></label>
                        <input type="text" id="newCompanyNameInput" placeholder="أدخل اسم الشركة">
                    </div>
                    <div class="form-group">
                        <label>اسم المالك</label>
                        <input type="text" id="newCompanyOwnerInput" placeholder="أدخل اسم المالك">
                    </div>
                    <div class="form-group">
                        <label>رقم الهاتف</label>
                        <input type="text" id="newCompanyPhoneInput" placeholder="أدخل رقم الهاتف">
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" id="cancelAddCompanyBtn">إلغاء</button>
                    <button class="btn-primary"   id="saveCompanyBtn">حفظ</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ ENGINEERS LIST MODAL (big) ═══════════ -->
        <div class="modal" id="engineersModal">
            <div class="list-modal-content">
                <div class="list-modal-header">
                    <h2><i class="fa-solid fa-user-tie" style="margin-left:10px;"></i>المهندسون المشرفون</h2>
                    <span class="close-modal close-engineers-btn">&times;</span>
                </div>
                <div class="list-modal-body">
                    <table class="sub-table">
                        <thead>
                            <tr>
                                <th style="width:50px;">#</th>
                                <th>اسم المهندس</th>
                                <th>القسم</th>
                                <th style="width:120px;text-align:center;">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="engineersTbody">
                            <tr><td colspan="4" style="text-align:center;padding:20px;">جاري التحميل...</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="list-modal-footer">
                    <button class="btn-success" id="openAddEngineerFormBtn">
                        <i class="fa-solid fa-plus"></i> إضافة مهندس
                    </button>
                </div>
            </div>
        </div>

        <!-- ═══════════ ADD / EDIT ENGINEER MODAL (small) ═══════════ -->
        <div class="modal" id="addEngineerModal">
            <div class="add-modal-content">
                <span class="close-modal" id="closeAddEngineerModalBtn">&times;</span>
                <h2 class="modal-title" id="addEngineerModalTitle">إضافة مهندس جديد</h2>
                <div class="add-modal-fields">
                    <div class="form-group">
                        <label>اسم المهندس <span style="color:red;">*</span></label>
                        <input type="text" id="newEngineerNameInput" placeholder="أدخل الاسم الكامل">
                    </div>
                    <div class="form-group">
                        <label>القسم التابع له</label>
                        <div class="dept-select-wrapper" id="deptSelectWrapper">
                            <input type="hidden" id="newEngineerDeptInput">
                            <div class="dept-selected" id="deptSelected">
                                <span id="deptSelectedText" style="flex:1;">-- اختر القسم --</span>
                                <span class="dept-selected-icon" id="deptSelectedIcon" style="display:none;"></span>
                                <i class="fa-solid fa-chevron-down dept-arrow" id="deptArrow"></i>
                            </div>
                            <div class="dept-dropdown" id="deptDropdown">
                                <div class="dept-search-wrap">
                                    <i class="fa-solid fa-magnifying-glass dept-search-icon"></i>
                                    <input type="text" class="dept-search" id="deptSearchInput" placeholder="بحث في الأقسام...">
                                </div>
                                <div class="dept-options" id="deptOptions"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" id="cancelAddEngineerBtn">إلغاء</button>
                    <button class="btn-primary"   id="saveEngineerBtn">حفظ</button>
                </div>
            </div>
        </div>
    `,

   
    closeModal:      () => document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')),
    closeModalById:  (id) => { const m = document.getElementById(id); if (m) m.classList.remove('active'); },
    $: (id) => document.getElementById(id),

   
    loadDropdowns: async () => {
        const cs = projectsView.$('modal_company');
        const es = projectsView.$('modal_engineer');
        const savedCompany  = cs.value;
        const savedEngineer = es.value;

        cs.innerHTML = '<option value="">اختر الشركة...</option>';
        es.innerHTML = '<option value="">اختر المهندس...</option>';

        try {
            const [companies, engineers] = await Promise.all([
                projectsService.getAllCompanies(),
                projectsService.getAllEngineers(),
            ]);
            (companies || []).forEach(c =>
                cs.insertAdjacentHTML('beforeend', `<option value="${c.id}">${c.companies_name || c.name}</option>`)
            );
            (engineers || []).forEach(e =>
                es.insertAdjacentHTML('beforeend', `<option value="${e.id}">${e.engineers_name || e.name}</option>`)
            );
            cs.value = savedCompany;
            es.value = savedEngineer;
        } catch (err) { console.error('loadDropdowns error', err); }
    },

    loadProjectsData: async (opts = {}) => {
        try {
            const list = (await projectsService.getAll()) || [];
            appStore.setProjects(list);
            return list;
        } catch (err) {
            console.error('Projects load failed', err);
            if (opts.notifyOnError) showToast(err.message || 'تعذر تحميل المشاريع', 'error');
            appStore.setProjects([]);
            return [];
        }
    },

    renderTableLoading: () => {
        const tbody = projectsView.$('projectsTbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...</td></tr>`;
    },

    renderTable: (projects) => {
        const tbody = projectsView.$('projectsTbody');
        if (!tbody) return;
        if (!projects?.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">لا توجد مشاريع مسجلة حالياً</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        projects.forEach((p, i) => {
            const companyName = p.companies?.companies_name || p.companies?.name || p.company_name || p.company || '—';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${i + 1}</td>
                <td style="cursor:pointer;color:var(--primary-color);font-size:15px;">${p.project_title || p.name || 'بدون اسم'}</td>
                <td>${companyName}</td>
                <td>${STATUS_MAP[p.status] || p.status || '—'}</td>
                <td>${p.progress || 0}%</td>
                <td style="font-size:15px;">${Number(p.Contract_value || p.value || 0).toLocaleString()}</td>
                <td>
                    <button class="icon-btn" data-action="edit"   title="تعديل"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn" data-action="delete" title="حذف"><i class="fa-solid fa-trash"></i></button>
                </td>`;
            tr.querySelector('[data-action="edit"]').onclick   = (e) => { e.stopPropagation(); projectsView.openModal(p); };
            tr.querySelector('[data-action="delete"]').onclick = (e) => { e.stopPropagation(); projectsView.handleDelete(p.id); };
            tbody.appendChild(tr);
        });
    },

 
    openModal: async (project = null) => {
        await projectsView.loadDropdowns();
        const $ = projectsView.$;
        if (project) {
            $('modalTitle').innerText       = 'تعديل مشروع';
            $('modal_name').value           = project.project_title  || project.name            || '';
            $('modal_contract').value       = project.Contract_id    || project.contract         || '';
            $('modal_value').value          = project.Contract_value || project.value            || '';
            $('modal_value_modified').value = project.Contract_value_modified                    || '';
            $('modal_duration').value       = project.contract_duration                          || '';
            $('modal_signingDate').value    = project.signing_date   || project.singing_contract || '';
            $('modal_deliveryDate').value   = project.delivery_date                              || '';
            $('modal_endDate').value        = project.end_date       || project.finished_date    || '';
            $('modal_progress').value       = project.progress       || 0;
            $('modal_status').value         = project.status         || 'not_started';
            $('modal_company').value        = project.company_id     || '';
            $('modal_engineer').value       = project.engineer_id    || '';
            $('saveProjectModalBtn').onclick = () => projectsView.handleSave(project.id);
        } else {
            $('modalTitle').innerText = 'إضافة مشروع';
            ['name','contract','value','value_modified','duration','signingDate','deliveryDate','endDate'].forEach(f => $(`modal_${f}`).value = '');
            $('modal_status').value   = 'not_started';
            $('modal_progress').value = 0;
            $('saveProjectModalBtn').onclick = () => projectsView.handleSave();
        }
        $('projectModal').classList.add('active');
    },

    handleSave: async (id = null) => {
        const $ = projectsView.$;
        const payload = {
            project_title:           $('modal_name').value,
            Contract_id:             $('modal_contract').value,
            Contract_value:          $('modal_value').value,
            Contract_value_modified: $('modal_value_modified').value,
            contract_duration:       $('modal_duration').value,
            company_id:              $('modal_company').value,
            engineer_id:             $('modal_engineer').value,
            status:                  $('modal_status').value,
            progress:                $('modal_progress').value,
            signing_date:            $('modal_signingDate').value,
            delivery_date:           $('modal_deliveryDate').value,
            end_date:                $('modal_endDate').value,
        };
        if (!payload.project_title) { showToast('يرجى إدخال اسم المشروع', 'warning'); return; }
        try {
            if (id) { await projectsService.update(id, payload); showToast('تم التحديث', 'success'); }
            else     { await projectsService.create(payload);     showToast('تمت الإضافة', 'success'); }
            projectsView.closeModalById('projectModal');
            projectsView.renderTable(await projectsView.loadProjectsData());
        } catch (err) { console.error(err); showToast(err.message || 'خطأ في الحفظ', 'error'); }
    },

    handleDelete: async (id) => {
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        try {
            await projectsService.delete(id);
            showToast('تم الحذف', 'success');
            projectsView.renderTable(await projectsView.loadProjectsData());
        } catch { showToast('فشل الحذف', 'error'); }
    },

    _deptListenerAttached: false,

    initDeptSelect: () => {
        const selected  = projectsView.$('deptSelected');
        const dropdown  = projectsView.$('deptDropdown');
        const optsCont  = projectsView.$('deptOptions');
        const searchInp = projectsView.$('deptSearchInput');
        const hiddenInp = projectsView.$('newEngineerDeptInput');
        const textSpan  = projectsView.$('deptSelectedText');
        const iconWrap  = projectsView.$('deptSelectedIcon');
        const wrapper   = projectsView.$('deptSelectWrapper');
        if (!selected) return;

   
        optsCont.innerHTML = DEPARTMENTS.map(d => `
            <div class="dept-option" data-value="${d.value}" data-icon="${d.icon}" data-color="${d.color}" data-icon-color="${d.iconColor}">
                <span class="dept-icon-wrap" style="background:${d.color};color:${d.iconColor};">
                    <i class="${d.icon}"></i>
                </span>
                <span style="flex:1;">${d.label}</span>
                <i class="fa-solid fa-check dept-check"></i>
            </div>`).join('');


        selected.onclick = (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('open');
            if (isOpen) {
                projectsView.closeDeptDropdown();
            } else {
                dropdown.classList.add('open');
                selected.classList.add('open');
                searchInp.value = '';
                optsCont.querySelectorAll('.dept-option').forEach(o => o.classList.remove('hidden'));
                setTimeout(() => searchInp.focus(), 60);
            }
        };

        optsCont.onclick = (e) => {
            const opt = e.target.closest('.dept-option');
            if (!opt) return;
            const val       = opt.dataset.value;
            const icon      = opt.dataset.icon;
            const color     = opt.dataset.color;
            const iconColor = opt.dataset.iconColor;

            hiddenInp.value = val;
            textSpan.textContent = val;
            selected.classList.add('has-value');

            iconWrap.innerHTML = `<i class="${icon}"></i>`;
            iconWrap.style.cssText = `display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:6px;background:${color};color:${iconColor};font-size:13px;margin-left:10px;`;

            optsCont.querySelectorAll('.dept-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            projectsView.closeDeptDropdown();
        };

   
        searchInp.oninput = () => {
            const q = searchInp.value.trim().toLowerCase();
            optsCont.querySelectorAll('.dept-option').forEach(opt => {
                opt.classList.toggle('hidden', !opt.dataset.value.toLowerCase().includes(q));
            });
        };

       
        if (!projectsView._deptListenerAttached) {
            document.addEventListener('click', (e) => {
                if (wrapper && !wrapper.contains(e.target)) projectsView.closeDeptDropdown();
            });
            projectsView._deptListenerAttached = true;
        }
    },

    closeDeptDropdown: () => {
        projectsView.$('deptDropdown')?.classList.remove('open');
        projectsView.$('deptSelected')?.classList.remove('open');
    },

    resetDeptSelect: (value = '') => {
        const hiddenInp = projectsView.$('newEngineerDeptInput');
        const textSpan  = projectsView.$('deptSelectedText');
        const selected  = projectsView.$('deptSelected');
        const optsCont  = projectsView.$('deptOptions');
        const iconWrap  = projectsView.$('deptSelectedIcon');
        if (!hiddenInp) return;

        hiddenInp.value = value;
        optsCont?.querySelectorAll('.dept-option').forEach(o => o.classList.remove('selected'));

        if (value) {
            const dept = DEPARTMENTS.find(d => d.value === value);
            textSpan.textContent = value;
            selected.classList.add('has-value');
            if (dept) {
                iconWrap.innerHTML = `<i class="${dept.icon}"></i>`;
                iconWrap.style.cssText = `display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:6px;background:${dept.color};color:${dept.iconColor};font-size:13px;margin-left:10px;`;
            }
            optsCont?.querySelector(`[data-value="${value}"]`)?.classList.add('selected');
        } else {
            textSpan.textContent = '-- اختر القسم --';
            selected.classList.remove('has-value');
            if (iconWrap) iconWrap.style.display = 'none';
        }
    },

    openCompaniesModal: async () => {
        projectsView.$('companiesModal').classList.add('active');
        await projectsView.loadCompaniesData();
    },

    loadCompaniesData: async () => {
        const tbody = projectsView.$('companiesTbody');
        try {
            const companies = await projectsService.getAllCompanies();
            if (!companies?.length) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#666;padding:25px;">لا توجد شركات مسجلة</td></tr>';
                return;
            }
            tbody.innerHTML = companies.map((c, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${c.companies_name || c.name || '—'}</td>
                    <td>${c.owner_name || '—'}</td>
                    <td>${c.phone || '—'}</td>
                    <td>
                        <div style="display:flex;gap:6px;justify-content:center;">
                            <button class="btn-warning"
                                onclick="projectsView.openEditCompanyModal(${c.id},'${(c.companies_name||c.name||'').replace(/'/g,"\\'")}','${(c.owner_name||'').replace(/'/g,"\\'")}','${(c.phone||'').replace(/'/g,"\\'")}')">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn-danger" onclick="projectsView.handleDeleteCompany(${c.id})">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`).join('');
        } catch {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;padding:20px;">خطأ في التحميل</td></tr>';
        }
    },

    openAddCompanyModal: () => {
        const $ = projectsView.$;
        $('addCompanyModalTitle').innerText = 'إضافة شركة جديدة';
        $('newCompanyNameInput').value  = '';
        $('newCompanyOwnerInput').value = '';
        $('newCompanyPhoneInput').value = '';
        $('saveCompanyBtn')._editId = null;
        $('addCompanyModal').classList.add('active');
        setTimeout(() => $('newCompanyNameInput').focus(), 60);
    },

    openEditCompanyModal: (id, name, owner, phone) => {
        const $ = projectsView.$;
        $('addCompanyModalTitle').innerText = 'تعديل بيانات الشركة';
        $('newCompanyNameInput').value  = name;
        $('newCompanyOwnerInput').value = owner;
        $('newCompanyPhoneInput').value = phone;
        $('saveCompanyBtn')._editId = id;
        $('addCompanyModal').classList.add('active');
        setTimeout(() => $('newCompanyNameInput').focus(), 60);
    },

    handleSaveCompany: async () => {
        const $ = projectsView.$;
        const name  = $('newCompanyNameInput').value.trim();
        const owner = $('newCompanyOwnerInput').value.trim();
        const phone = $('newCompanyPhoneInput').value.trim();
        if (!name) { showToast('أدخل اسم الشركة', 'warning'); return; }
        const editId = $('saveCompanyBtn')._editId;
        try {
            if (editId) {
                await projectsService.updateCompany(editId, { companies_name: name, owner_name: owner, phone });
                showToast('تم التحديث', 'success');
            } else {
                await projectsService.createCompany({ companies_name: name, owner_name: owner, phone });
                showToast('تمت الإضافة', 'success');
            }
            projectsView.closeModalById('addCompanyModal');
            await projectsView.loadCompaniesData();
        } catch { showToast('فشلت العملية', 'error'); }
    },

    handleDeleteCompany: async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذه الشركة؟')) return;
        try {
            await projectsService.deleteCompany(id);
            showToast('تم الحذف', 'success');
            await projectsView.loadCompaniesData();
        } catch { showToast('فشل الحذف', 'error'); }
    },

    // ══════════════════════════════════════════════════════════════════
    //  ENGINEERS
    // ══════════════════════════════════════════════════════════════════
    openEngineersModal: async () => {
        projectsView.$('engineersModal').classList.add('active');
        await projectsView.loadEngineersData();
    },

    loadEngineersData: async () => {
        const tbody = projectsView.$('engineersTbody');
        try {
            const engineers = await projectsService.getAllEngineers();
            if (!engineers?.length) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#666;padding:25px;">لا يوجد مهندسون مسجلون</td></tr>';
                return;
            }
            tbody.innerHTML = engineers.map((e, i) => {
                const dept = DEPARTMENTS.find(d => d.value === (e.department || ''));
                const deptBadge = dept
                    ? `<span style="display:inline-flex;align-items:center;gap:6px;background:${dept.color};color:${dept.iconColor};padding:4px 10px;border-radius:20px;font-size:13px;font-weight:600;">
                           <i class="${dept.icon}"></i>${dept.label}
                       </span>`
                    : (e.department || '—');
                return `
                <tr>
                    <td>${i + 1}</td>
                    <td>${e.engineers_name || e.name || '—'}</td>
                    <td>${deptBadge}</td>
                    <td>
                        <div style="display:flex;gap:6px;justify-content:center;">
                            <button class="btn-warning"
                                onclick="projectsView.openEditEngineerModal(${e.id},'${(e.engineers_name||e.name||'').replace(/'/g,"\\'")}','${(e.department||'').replace(/'/g,"\\'")}')">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn-danger" onclick="projectsView.handleDeleteEngineer(${e.id})">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
        } catch {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;padding:20px;">خطأ في التحميل</td></tr>';
        }
    },

    openAddEngineerModal: () => {
        const $ = projectsView.$;
        $('addEngineerModalTitle').innerText = 'إضافة مهندس جديد';
        $('newEngineerNameInput').value = '';
        $('saveEngineerBtn')._editId = null;
        $('addEngineerModal').classList.add('active');
        setTimeout(() => {
            projectsView.initDeptSelect();
            projectsView.resetDeptSelect('');
            $('newEngineerNameInput').focus();
        }, 60);
    },

    openEditEngineerModal: (id, name, dept) => {
        const $ = projectsView.$;
        $('addEngineerModalTitle').innerText = 'تعديل بيانات المهندس';
        $('newEngineerNameInput').value = name;
        $('saveEngineerBtn')._editId = id;
        $('addEngineerModal').classList.add('active');
        setTimeout(() => {
            projectsView.initDeptSelect();
            projectsView.resetDeptSelect(dept);
            $('newEngineerNameInput').focus();
        }, 60);
    },

    handleSaveEngineer: async () => {
        const $ = projectsView.$;
        const name = $('newEngineerNameInput').value.trim();
        const dept = $('newEngineerDeptInput').value;
        if (!name) { showToast('أدخل اسم المهندس', 'warning'); return; }
        const editId = $('saveEngineerBtn')._editId;
        try {
            if (editId) {
                await projectsService.updateEngineer(editId, { engineers_name: name, department: dept });
                showToast('تم التحديث', 'success');
            } else {
                await projectsService.createEngineer({ engineers_name: name, department: dept });
                showToast('تمت الإضافة', 'success');
            }
            projectsView.closeModalById('addEngineerModal');
            await projectsView.loadEngineersData();
        } catch { showToast('فشلت العملية', 'error'); }
    },

    handleDeleteEngineer: async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا المهندس؟')) return;
        try {
            await projectsService.deleteEngineer(id);
            showToast('تم الحذف', 'success');
            await projectsView.loadEngineersData();
        } catch { showToast('فشل الحذف', 'error'); }
    },

    init: async () => {
        headerView.init();
        const $ = projectsView.$;

        $('openAddModalBtn').onclick = () => projectsView.openModal();
        $('closeModalBtn').onclick   = () => projectsView.closeModalById('projectModal');
        $('closeModalBtn2').onclick  = () => projectsView.closeModalById('projectModal');
        $('projectModal').onclick    = (e) => { if (e.target.id === 'projectModal') projectsView.closeModalById('projectModal'); };

    
        const handleSearch = async () => {
            const query = $('projectSearch').value.trim();
            if (!query) return projectsView.renderTable(await projectsView.loadProjectsData());
            projectsView.renderTableLoading();
            try { projectsView.renderTable(await projectsService.search(query)); }
            catch { projectsView.renderTable(filterProjectsLocally(appStore.getState().projects || [], query)); }
        };
        $('projectSearchBtn').onclick = handleSearch;
        $('projectSearch').onkeyup   = (e) => { if (e.key === 'Enter') handleSearch(); };

        $('openCompaniesModalBtn').onclick = () => projectsView.openCompaniesModal();

        document.querySelector('.close-companies-btn').onclick =
            () => projectsView.closeModalById('companiesModal');
        $('companiesModal').onclick = (e) => {
            if (e.target.id === 'companiesModal') projectsView.closeModalById('companiesModal');
        };

        $('openAddCompanyFormBtn').onclick    = () => projectsView.openAddCompanyModal();
        $('closeAddCompanyModalBtn').onclick  = () => projectsView.closeModalById('addCompanyModal');
        $('cancelAddCompanyBtn').onclick      = () => projectsView.closeModalById('addCompanyModal');
        $('addCompanyModal').onclick = (e) => {
            if (e.target.id === 'addCompanyModal') projectsView.closeModalById('addCompanyModal');
        };
        $('saveCompanyBtn').onclick = () => projectsView.handleSaveCompany();


        $('openEngineersModalBtn').onclick = () => projectsView.openEngineersModal();

        document.querySelector('.close-engineers-btn').onclick =
            () => projectsView.closeModalById('engineersModal');
        $('engineersModal').onclick = (e) => {
            if (e.target.id === 'engineersModal') projectsView.closeModalById('engineersModal');
        };

        $('openAddEngineerFormBtn').onclick   = () => projectsView.openAddEngineerModal();
        $('closeAddEngineerModalBtn').onclick = () => projectsView.closeModalById('addEngineerModal');
        $('cancelAddEngineerBtn').onclick     = () => projectsView.closeModalById('addEngineerModal');
        $('addEngineerModal').onclick = (e) => {
            if (e.target.id === 'addEngineerModal') projectsView.closeModalById('addEngineerModal');
        };
        $('saveEngineerBtn').onclick = () => projectsView.handleSaveEngineer();

        // Initial load
        projectsView.renderTableLoading();
        projectsView.renderTable(await projectsView.loadProjectsData({ notifyOnError: true }));
    },
};