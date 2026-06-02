import { headerView } from '../headerView.js';

/**
 * طبقة العرض لصفحة لوحة التحكم (Dashboard UI View)
 */
export const dashboardView = {
    render: () => `
${headerView.render()}

<main class="main-content">
    <div class="dashboard-layout">
        <div class="departments-panel">
            <div class="panel-header">
                <h1>أقسام الجهاز</h1>
                <span class="dept-count-badge" id="deptCount">0 أقسام</span>
            </div>
            <div class="departments-grid" id="deptGrid"></div>
            <div class="vision-section">
                <div class="vision-card">
                    <h2><i class="fa-solid fa-eye"></i> رؤيتنا</h2>
                    <p>أن نكون الهيئة الرائدة في تطوير بنية تحتية سكنية ومرافق مستدامة تعزز جودة الحياة، وتبني مجتمعات عصرية تواكب المعايير الدولية مع الحفاظ على التراث والقيم البيئية.</p>
                </div>
            </div>
        </div>

        <div class="stats-panel">
            <div class="stats-overview-card">
                <div class="stats-overview-label">إجمالي المشاريع</div>
                <div class="stats-overview-number" id="totalCount"><span>مشروع</span> 0</div>
                <div class="stats-overview-sub">تحديث آخر: اليوم <i class="fa-solid fa-rotate" style="margin-right:4px;font-size:0.7rem;"></i></div>
            </div>
            <div class="status-cards">
                <div class="status-card ongoing">
                    <div class="status-indicator"><i class="fa-solid fa-spinner"></i></div>
                    <div class="status-info">
                        <div class="label">المشاريع الجارية</div>
                        <div class="number" id="ongoingCount" data-target="0">0</div>
                    </div>
                    <div class="status-percent">
                        <div class="pct" id="ongoingPct">0%</div>
                        <div class="pct-label">من الإجمالي</div>
                    </div>
                </div>
                <div class="status-card stopped">
                    <div class="status-indicator"><i class="fa-solid fa-pause"></i></div>
                    <div class="status-info">
                        <div class="label">المشاريع المتوقفة</div>
                        <div class="number" id="stoppedCount" data-target="0">0</div>
                    </div>
                    <div class="status-percent">
                        <div class="pct" id="stoppedPct">0%</div>
                        <div class="pct-label">من الإجمالي</div>
                    </div>
                </div>
                <div class="status-card pending">
                    <div class="status-indicator"><i class="fa-solid fa-clock"></i></div>
                    <div class="status-info">
                        <div class="label">لم تبدأ بعد</div>
                        <div class="number" id="pendingCount" data-target="0">0</div>
                    </div>
                    <div class="status-percent">
                        <div class="pct" id="pendingPct">0%</div>
                        <div class="pct-label">من الإجمالي</div>
                    </div>
                </div>
            </div>

            <div class="chart-section">
                <div class="chart-section-title">
                    <i class="fa-solid fa-chart-pie"></i>
                    توزيع حالة المشاريع
                </div>
                <div class="chart-wrapper">
                    <div class="chart-canvas-wrap">
                        <canvas id="donutChart" width="160" height="160"></canvas>
                        <div class="chart-center-label">
                            <div class="ccl-num" id="chartCenterNum">0</div>
                            <div class="ccl-txt">مشروع</div>
                        </div>
                    </div>
                    <div class="chart-legend">
                        <div class="legend-item">
                            <div class="legend-dot sky"></div>
                            <span class="legend-text">جارية</span>
                            <span class="legend-val" id="legendOngoing">0</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot muted"></div>
                            <span class="legend-text">متوقفة</span>
                            <span class="legend-val" id="legendStopped">0</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot violet"></div>
                            <span class="legend-text">لم تبدأ</span>
                            <span class="legend-val" id="legendPending">0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>

<!-- Modal -->
<div class="modal-overlay" id="deptModal">
    <div class="modal-box">
        <button class="modal-close" id="closeModal">&times;</button>
        <h2 id="modalTitle">اسم القسم</h2>
        <hr>
        <p id="modalDesc">سيظهر الشرح هنا...</p>
        <button class="modal-btn" id="modalBtn">الانتقال إلى القسم</button>
    </div>
</div>
    `,
    getElements: () => ({
        deptGrid: document.getElementById('deptGrid'),
        deptCount: document.getElementById('deptCount'),
        totalCount: document.getElementById('totalCount'),
        ongoingCount: document.getElementById('ongoingCount'),
        stoppedCount: document.getElementById('stoppedCount'),
        pendingCount: document.getElementById('pendingCount'),
        ongoingPct: document.getElementById('ongoingPct'),
        stoppedPct: document.getElementById('stoppedPct'),
        pendingPct: document.getElementById('pendingPct'),
        legendOngoing: document.getElementById('legendOngoing'),
        legendStopped: document.getElementById('legendStopped'),
        legendPending: document.getElementById('legendPending'),
        chartCenterNum: document.getElementById('chartCenterNum'),
        donutChart: document.getElementById('donutChart'),
        modal: document.getElementById('deptModal'),
        modalTitle: document.getElementById('modalTitle'),
        modalDesc: document.getElementById('modalDesc'),
        closeModal: document.getElementById('closeModal'),
        modalBtn: document.getElementById('modalBtn'),
    }),
    renderDepartments: (deptGrid, departments, onCardClick) => {
        deptGrid.innerHTML = '';
        departments.forEach(dept => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<h3>${dept.name}</h3><span>التفاصيل &larr;</span>`;
            card.onclick = () => onCardClick(dept);
            deptGrid.appendChild(card);
        });
    },
    showModal: (elements, dept, onBtnClick) => {
        elements.modalTitle.textContent = dept.name;
        elements.modalDesc.textContent = dept.desc;
        
        if (dept.link && dept.link !== '#') {
            elements.modalBtn.style.display = 'block';
            elements.modalBtn.textContent = 'الانتقال إلى ' + dept.name;
            elements.modalBtn.onclick = onBtnClick;
        } else {
            elements.modalBtn.style.display = 'none';
        }
        
        elements.modal.classList.add('active');
    },
    hideModal: (elements) => {
        elements.modal.classList.remove('active');
    }
};
