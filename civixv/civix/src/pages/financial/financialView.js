import { headerView } from '../headerView.js';
import { SESSION_KEYS } from '../../utils/constants.js';

// تمت إعادة إضافة هذا الثابت لأنه يتم استيراده في ملفات أخرى
export const DUMMY_FINANCIAL_PROJECTS = [
    {
        id: 1,
        project_id: 1,
        project_title: 'مشروع تجريبي',
        companies: { companies_name: 'جهة تنفيذ تجريبية' },
        Contract_id: 'C-DEMO-001',
        contract_value: '1,000,000',
        paid: '400,000',
        remaining: '600,000'
    },
];

// بيانات تجريبية للتفويضات
export const DUMMY_DELEGATIONS = [
    {
        id: 1,
        number: 'T-001',
        date: '2023-10-01',
        value: 100000,
        projects: [
            { id: 101, name: 'مشروع تجريبي 1', value: 20000 },
            { id: 102, name: 'مشروع تجريبي 2', value: 30000 }
        ]
    },
    {
        id: 2,
        number: 'T-002',
        date: '2023-11-15',
        value: 50000,
        projects: []
    }
];

// دالة وهمية لمحاكاة جلب المشاريع للقائمة المنسدلة
const getAllProjectsForSelect = () => [
    { id: 101, name: 'مشروع تجريبي 1' },
    { id: 102, name: 'مشروع تجريبي 2' },
    { id: 103, name: 'تطوير البنية التحتية' },
    { id: 104, name: 'صيانة المباني' },
];

export const financialView = {
    // لتخزين التفويض الحالي للتعديل عليه
    currentDelegation: null,

    render: () => `
 ${headerView.render()}

<div class="main-wrapper">
    <aside class="sidebar">
        <div class="sidebar-header">قسم المالية</div>

        <button class="sidebar-btn" id="btn-view-projects" type="button">
            <i class="fa-solid fa-building"></i>
            <span>المشاريع</span>
        </button>
        
        <button class="sidebar-btn" id="btn-view-delegations" type="button">
            <i class="fa-solid fa-file-signature"></i>
            <span>التفويضات المالية</span>
        </button>
    </aside>

    <main class="content" id="financial-main-content">
        <div class="financial-top-bar">
            <button type="button" class="financial-icon-btn financial-icon-btn--back financial-back-btn--hidden" id="btn-financial-back" aria-label="العودة للإحصائيات" title="العودة للإحصائيات">
                <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </button>
            <button type="button" class="financial-icon-btn" id="btn-financial-home" aria-label="لوحة الرئيسية" title="لوحة الرئيسية">
                <i class="fa-solid fa-house" aria-hidden="true"></i>
            </button>
        </div>

        <section class="financial-stats-region" id="financial-stats-region" aria-label="الإحصائيات المالية">
            <h2 class="financial-stats-heading">الإحصائيات المالية</h2>
            <div class="dashboard-grid" id="dashboard-stats"></div>
        </section>

        <!-- قسم سجل المشاريع -->
        <div id="view-projects" class="view-section">
            <h2 style="margin-top: 0; color: var(--primary-color); margin-bottom: 20px;"> المشاريع</h2>
            
            <div class="finance-search-bar">
                <input type="text" id="projectSearch" placeholder="ابحث برقم العقد أو اسم المشروع أو اسم المشرف..." autocomplete="off">
                <button type="button" id="projectSearchBtn" aria-label="بحث"><i class="fa-solid fa-magnifying-glass"></i></button>
            </div>

            <div class="status-message" id="projectsStatus"></div>

            <div class="table-container">
                <table class="projects-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th>م</th>
                            <th style="width: 35%">اسم المشروع</th>
                            <th>رقم العقد</th>
                            <th>الجهة المنفذة</th>
                            <th>قيمة العقد</th>
                            <th>المدفوع</th>
                            <th>المتبقي</th>
                        </tr>
                    </thead>
                    <tbody id="projectsTableBody"></tbody>
                </table>
            </div>
        </div>

        <!-- قسم قائمة التفويضات -->
        <div id="view-delegations" class="view-section">
            <h2 style="margin-top: 0; color: var(--primary-color); margin-bottom: 20px;"> سجل التفويضات</h2>
            
            <div class="table-container">
                <table class="projects-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th>رقم التفويض</th>
                            <th>تاريخ التفويض</th>
                            <th>قيمة التفويض</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="delegationsTableBody">
                        <!-- سيتم تعبئته بواسطة JS -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- قسم تفاصيل التفويض (المشاريع التابعة) -->
        <div id="view-delegation-details" class="view-section" style="display:none;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <button id="btn-back-to-delegations" class="btn-secondary" style="padding: 8px 15px; border-radius:4px; cursor:pointer; border:none; background:#6c757d; color:white;">
                    <i class="fa-solid fa-arrow-right"></i> عودة للقائمة
                </button>
                <h2 style="margin:0; color: var(--primary-color);">تفاصيل التفويض: <span id="detail-del-number"></span></h2>
            </div>

            <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:20px; display:flex; gap:20px; flex-wrap:wrap;">
                <div>
                    <strong>قيمة التفويض الإجمالية:</strong> <span id="detail-total-value" style="color:green; font-weight:bold;"></span> د.ل
                </div>
                <div>
                    <strong>المتبقي من التفويض:</strong> <span id="detail-remaining-value" style="color:red; font-weight:bold;"></span> د.ل
                </div>
            </div>

            <div class="table-container" style="margin-bottom:30px;">
                <h3 style="margin-bottom:10px;">المشاريع التابعة للتفويض</h3>
                <table class="projects-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th>اسم المشروع</th>
                            <th>قيمة التفويض للمشروع</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="delegationProjectsTableBody"></tbody>
                </table>
            </div>

            <!-- نموذج إضافة مشروع للتفويض -->
            <div style="background:#e9ecef; padding:20px; border-radius:8px; border:1px solid #dee2e6;">
                <h4 style="margin-top:0;">إضافة مشروع للتفويض</h4>
                <div style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap;">
                    <div style="flex:1; min-width:250px;">
                        <label style="display:block; font-size:13px; margin-bottom:5px;">اختر المشروع</label>
                        <select id="addProjectSelect" style="width:100%; padding:10px; border-radius:4px; border:1px solid #ccc;">
                            <option value="">-- اختر مشروعاً --</option>
                            <!-- يتم ملؤها بالجافاسكربت -->
                        </select>
                    </div>
                    <div style="width:200px;">
                        <label style="display:block; font-size:13px; margin-bottom:5px;">قيمة التفويض (د.ل)</label>
                        <input type="number" id="addProjectValue" placeholder="0.00" style="width:100%; padding:10px; border-radius:4px; border:1px solid #ccc;">
                    </div>
                    <button id="btnAddProjectToDelegation" class="btn-primary" style="padding:10px 20px; border-radius:4px; border:none; cursor:pointer; background:#0056b3; color:white;">
                        إضافة
                    </button>
                </div>
            </div>
        </div>

    </main>
</div>
    `,

    getElements: () => ({
        mainContent: document.getElementById('financial-main-content'),
        statsRegion: document.getElementById('financial-stats-region'),
        btnFinancialHome: document.getElementById('btn-financial-home'),
        btnFinancialBack: document.getElementById('btn-financial-back'),
        btnProjects: document.getElementById('btn-view-projects'),
        btnDelegations: document.getElementById('btn-view-delegations'),
        viewProjects: document.getElementById('view-projects'),
        viewDelegations: document.getElementById('view-delegations'),
        viewDelegationDetails: document.getElementById('view-delegation-details'),
        projectSearch: document.getElementById('projectSearch'),
        projectSearchBtn: document.getElementById('projectSearchBtn'),
        delegationSearch: document.getElementById('delegationSearch'),
        delegationSearchBtn: document.getElementById('delegationSearchBtn'),
        projectsTableBody: document.getElementById('projectsTableBody'),
        projectsStatus: document.getElementById('projectsStatus'),
        dashboardStats: document.getElementById('dashboard-stats'),
        delegationsTableBody: document.getElementById('delegationsTableBody'),
        detailDelNumber: document.getElementById('detail-del-number'),
        detailTotalValue: document.getElementById('detail-total-value'),
        detailRemainingValue: document.getElementById('detail-remaining-value'),
        delegationProjectsTableBody: document.getElementById('delegationProjectsTableBody'),
        btnBackToDelegations: document.getElementById('btn-back-to-delegations'),
        addProjectSelect: document.getElementById('addProjectSelect'),
        addProjectValue: document.getElementById('addProjectValue'),
        btnAddProjectToDelegation: document.getElementById('btnAddProjectToDelegation'),
    }),

    setFinancialDetailMode: (elements, isDetail) => {
        if (isDetail) {
            elements.statsRegion?.classList.add('financial-stats-region--hidden');
            elements.mainContent?.classList.add('content--financial-detail');
            elements.btnFinancialBack?.classList.remove('financial-back-btn--hidden');
        } else {
            elements.statsRegion?.classList.remove('financial-stats-region--hidden');
            elements.mainContent?.classList.remove('content--financial-detail');
            elements.btnFinancialBack?.classList.add('financial-back-btn--hidden');
        }
    },

    showStatsView: (elements) => {
        const views = [elements.viewProjects, elements.viewDelegations, elements.viewDelegationDetails].filter(Boolean);
        const btns = [elements.btnProjects, elements.btnDelegations].filter(Boolean);
        views.forEach((v) => v.style.display = 'none');
        btns.forEach((b) => b.classList.remove('active'));
        financialView.setFinancialDetailMode(elements, false);
    },

    showView: (viewId, elements) => {
        const views = [elements.viewProjects, elements.viewDelegations, elements.viewDelegationDetails].filter(Boolean);
        const btns = [elements.btnProjects, elements.btnDelegations].filter(Boolean);
        
        views.forEach((v) => v.style.display = 'none');
        btns.forEach((b) => b.classList.remove('active'));

        let isDetail = false;
        if (viewId === 'projects') {
            elements.viewProjects.style.display = 'block';
            elements.btnProjects.classList.add('active');
            isDetail = true;
        } else if (viewId === 'delegations') {
            elements.viewDelegations.style.display = 'block';
            elements.btnDelegations.classList.add('active');
            financialView.renderDelegationsList();
            isDetail = true;
        } else if (viewId === 'delegation-details') {
            elements.viewDelegationDetails.style.display = 'block';
            isDetail = true;
        }

        financialView.setFinancialDetailMode(elements, isDetail);
    },

    renderDashboardStats: (stats) => {
        const elements = financialView.getElements();
        if (!elements.dashboardStats) return;

        const totalBudgetRaw = parseFloat(String(stats.totalBudget).replace(/,/g, '')) || 0;
        const totalPaidRaw = parseFloat(String(stats.totalPaid).replace(/,/g, '')) || 0;
        const totalRemainingRaw = parseFloat(String(stats.totalRemaining).replace(/,/g, '')) || 0;
        const paymentPercent = totalBudgetRaw > 0 ? Math.round((totalPaidRaw / totalBudgetRaw) * 100) : 0;
        const delegationPercent = 0;

        elements.dashboardStats.innerHTML = `
            <div class="stat-card blue">
                <div class="stat-header">
                    <h3 class="stat-title">إجمالي ميزانية المشاريع</h3>
                    <div class="stat-icon"><i class="fa-solid fa-sack-dollar"></i></div>
                </div>
                <div class="stat-value count-up" data-target="${totalBudgetRaw}">${stats.totalBudget}</div>
                <div class="stat-desc">دينار ليبي</div>
            </div>

            <div class="stat-card green">
                <div class="stat-header">
                    <h3 class="stat-title">نسبة الدفعات المنجزة</h3>
                    <div class="stat-icon"><i class="fa-solid fa-chart-pie"></i></div>
                </div>
                <div class="chart-container">
                    <div class="circle-chart" style="--percent: ${paymentPercent}%;">
                        <span class="circle-text">${paymentPercent}%</span>
                    </div>
                    <div>
                        <div class="stat-value count-up" data-target="${totalPaidRaw}">${stats.totalPaid}</div>
                        <div class="stat-desc">تم دفعها</div>
                    </div>
                </div>
            </div>

            <div class="stat-card orange">
                <div class="stat-header">
                    <h3 class="stat-title">إجمالي التفويضات</h3>
                    <div class="stat-icon"><i class="fa-solid fa-money-check-dollar"></i></div>
                </div>
                <div class="chart-container">
                    <div class="circle-chart" style="--percent: ${delegationPercent}%; --primary-color: var(--accent-orange);">
                        <span class="circle-text">${delegationPercent}%</span>
                    </div>
                    <div>
                        <div class="stat-value count-up" data-target="0">0</div>
                        <div class="stat-desc">دينار ليبي</div>
                    </div>
                </div>
            </div>

            <div class="stat-card purple">
                <div class="stat-header">
                    <h3 class="stat-title">المتبقي المستحق</h3>
                    <div class="stat-icon"><i class="fa-solid fa-wallet"></i></div>
                </div>
                <div class="stat-value count-up" data-target="${totalRemainingRaw}">${stats.totalRemaining}</div>
                <div class="stat-desc">دينار ليبي</div>
            </div>
        `;

        runCounterAnimation();
    },

    renderProjectsLoading: () => {
        const tbody = document.getElementById('projectsTableBody');
        if (!tbody) return;
        tbody.innerHTML = `
            <tr class="table-loading-row">
                <td colspan="7">
                    <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                    جاري تحميل المشاريع...
                </td>
            </tr>`;
    },

    renderProjects: (projects) => {
        const tbody = document.getElementById('projectsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        if (!projects || projects.length === 0) {
            tbody.innerHTML =
                '<tr class="table-empty-row"><td colspan="7">لا توجد مشاريع لعرضها. جرّب تعديل البحث أو تحديث الصفحة.</td></tr>';
            return;
        }

        projects.forEach((p, index) => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            
            const title = p.project_title || p.name || '—';
            const implementer = p.companies?.companies_name || p.implementer || '—';
            const contractId = p.Contract_id || p.contract_id || '—';
            const contractValue = p.Contract_value || p.contract_value || '0';
            const paid = p.paid || '0';
            const remaining = p.remaining || '0';

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td style="text-align:right; font-weight:700; color: var(--primary-color);">${title}</td>
                <td>${contractId}</td>
                <td>${implementer}</td>
                <td style="font-weight:bold">${contractValue}</td>
                <td style="color:var(--accent-green)">${paid}</td>
                <td style="color:var(--accent-red)">${remaining}</td>
            `;

            tr.onclick = () => {
                const id = p.id || p.project_id;
                if (!id) return;
                sessionStorage.setItem(
                    SESSION_KEYS.PROJECT_DETAILS_CONTEXT,
                    JSON.stringify({ readonly: true, returnHash: '#/financial' }),
                );
                window.location.hash = `#/projects/${id}`;
            };
            
            tbody.appendChild(tr);
        });
    },

    renderDelegationsList: () => {
        const tbody = financialView.getElements().delegationsTableBody;
        tbody.innerHTML = '';
        
        DUMMY_DELEGATIONS.forEach(d => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            
            tr.innerHTML = `
                <td>${d.number}</td>
                <td id="val-cell-${d.id}">${d.value.toLocaleString()}</td>
                <td>${d.date}</td>
                <td>
                    <button class="icon-btn" onclick="financialView.editDelegationValue(event, ${d.id})" title="تعديل القيمة"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn delete" onclick="financialView.deleteDelegation(event, ${d.id})" title="حذف"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;

            tr.onclick = (e) => {
                if(!e.target.closest('button')) {
                    financialView.openDelegationDetails(d.id);
                }
            };

            tbody.appendChild(tr);
        });
    },

    editDelegationValue: (event, id) => {
        event.stopPropagation();
        const cell = document.getElementById(`val-cell-${id}`);
        const delegation = DUMMY_DELEGATIONS.find(d => d.id === id);
        const currentVal = delegation.value;

        cell.innerHTML = `
            <input type="number" id="edit-input-${id}" value="${currentVal}" style="width:100px; padding:5px; text-align:center;">
            <button onclick="financialView.saveDelegationValue(${id})" style="margin-right:5px; background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-check"></i></button>
        `;
    },

    saveDelegationValue: (id) => {
        const input = document.getElementById(`edit-input-${id}`);
        const newVal = parseFloat(input.value);
        const delegation = DUMMY_DELEGATIONS.find(d => d.id === id);
        
        if (!isNaN(newVal)) {
            delegation.value = newVal;
            financialView.renderDelegationsList();
            if(financialView.currentDelegation && financialView.currentDelegation.id === id) {
                financialView.renderDelegationDetails(delegation);
            }
        } else {
            alert('القيمة غير صحيحة');
        }
    },

    deleteDelegation: (event, id) => {
        event.stopPropagation();
        if(confirm('هل أنت متأكد من حذف هذا التفويض؟')) {
            const idx = DUMMY_DELEGATIONS.findIndex(d => d.id === id);
            if (idx > -1) {
                DUMMY_DELEGATIONS.splice(idx, 1);
                financialView.renderDelegationsList();
            }
        }
    },

    openDelegationDetails: (id) => {
        const delegation = DUMMY_DELEGATIONS.find(d => d.id === id);
        if (!delegation) return;
        
        financialView.currentDelegation = delegation;
        financialView.showView('delegation-details', financialView.getElements());
        financialView.renderDelegationDetails(delegation);
    },

    renderDelegationDetails: (delegation) => {
        const el = financialView.getElements();
        
        el.detailDelNumber.textContent = delegation.number;
        el.detailTotalValue.textContent = delegation.value.toLocaleString();

        const projectsTotal = delegation.projects.reduce((sum, p) => sum + (p.value || 0), 0);
        const remaining = delegation.value - projectsTotal;
        
        el.detailRemainingValue.textContent = remaining.toLocaleString();
        el.detailRemainingValue.style.color = remaining < 0 ? 'red' : (remaining === 0 ? 'gray' : 'green');

        el.delegationProjectsTableBody.innerHTML = '';
        if (delegation.projects.length === 0) {
            el.delegationProjectsTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">لا توجد مشاريع مضافة لهذا التفويض</td></tr>';
        } else {
            delegation.projects.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${p.name}</td>
                    <td>${p.value.toLocaleString()}</td>
                    <td>
                        <button class="icon-btn delete" onclick="financialView.removeProjectFromDelegation(${p.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                el.delegationProjectsTableBody.appendChild(tr);
            });
        }

        el.addProjectSelect.innerHTML = '<option value="">-- اختر مشروعاً --</option>';
        const allProjects = getAllProjectsForSelect();
        
        allProjects.forEach(proj => {
            const isAdded = delegation.projects.some(dp => dp.id === proj.id);
            if (!isAdded) {
                const opt = document.createElement('option');
                opt.value = proj.id;
                opt.textContent = proj.name;
                el.addProjectSelect.appendChild(opt);
            }
        });
        
        el.addProjectValue.value = '';
    },

    addProjectToDelegation: () => {
        const el = financialView.getElements();
        const projectId = parseInt(el.addProjectSelect.value);
        const value = parseFloat(el.addProjectValue.value);
        
        if (!projectId || isNaN(value) || value <= 0) {
            alert('يرجى اختيار مشروع وإدخال قيمة صحيحة');
            return;
        }

        const allProjects = getAllProjectsForSelect();
        const projectToAdd = allProjects.find(p => p.id === projectId);

        if (projectToAdd && financialView.currentDelegation) {
            financialView.currentDelegation.projects.push({
                id: projectToAdd.id,
                name: projectToAdd.name,
                value: value
            });

            financialView.renderDelegationDetails(financialView.currentDelegation);
        }
    },

    removeProjectFromDelegation: (projectId) => {
        if (!financialView.currentDelegation) return;
        
        if(confirm('حذف هذا المشروع من التفويض؟')) {
            financialView.currentDelegation.projects = financialView.currentDelegation.projects.filter(p => p.id !== projectId);
            financialView.renderDelegationDetails(financialView.currentDelegation);
        }
    },

    showLoading: () => {
        const status = document.getElementById('projectsStatus');
        if (status) {
            status.textContent = 'جاري تحميل البيانات...';
            status.className = 'status-message status-loading';
            status.style.display = 'block';
        }
    },

    hideStatus: () => {
        const status = document.getElementById('projectsStatus');
        if (status) status.style.display = 'none';
    }
};

function runCounterAnimation() {
    const counters = document.querySelectorAll('.count-up');
    counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-target')) || 0;
        const duration = 1500;
        const startTime = performance.now();

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            
            const current = eased * target;
            counter.innerText = Math.round(current).toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                counter.innerText = target.toLocaleString();
            }
        };
        requestAnimationFrame(updateCounter);
    });
}