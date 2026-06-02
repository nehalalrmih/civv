import { APP_ROUTES, DEPARTMENTS } from '../../utils/constants.js';
import { dashboardView } from './dashboardView.js';
import { headerView } from '../headerView.js';

export const dashboardController = {
    init: async () => {
        headerView.init();
        const elements = dashboardView.getElements();
        
        // البيانات
        const deptList = Object.entries(DEPARTMENTS).map(([name, desc]) => {
            let link = '#';
            if (name === 'الشؤون المالية') link = '#' + APP_ROUTES.FINANCIAL;
            if (name === 'المرافق') link = '#' + APP_ROUTES.FACILITIES;
            if (name === 'المشروعات') link = '#' + APP_ROUTES.PROJECTS;
            return { name, desc, link };
        });

        const statsData = { total: 82, ongoing: 47, stopped: 12, pending: 23 };

        // تحديث عدد الأقسام
        if (elements.deptCount) {
            elements.deptCount.textContent = `${deptList.length} أقسام`;
        }

        // رندر الأقسام
        dashboardView.renderDepartments(elements.deptGrid, deptList, (dept) => {
            dashboardView.showModal(elements, dept, () => {
                if (dept.link && dept.link !== '#') {
                    window.location.hash = dept.link;
                }
            });
        });

        // إغلاق المودال
        if (elements.closeModal) {
            elements.closeModal.onclick = () => dashboardView.hideModal(elements);
        }
        if (elements.modal) {
            elements.modal.onclick = (e) => {
                if (e.target === elements.modal) dashboardView.hideModal(elements);
            };
        }

        // الأنيميشن والعدادات
        const startAnimations = () => {
            // العدادات
            animateCounter(elements.ongoingCount, statsData.ongoing);
            animateCounter(elements.stoppedCount, statsData.stopped);
            animateCounter(elements.pendingCount, statsData.pending);
            
            // تحديث النسب المئوية
            const updatePct = (el, val) => {
                if (el) el.textContent = Math.round((val / statsData.total) * 100) + '%';
            };
            updatePct(elements.ongoingPct, statsData.ongoing);
            updatePct(elements.stoppedPct, statsData.stopped);
            updatePct(elements.pendingPct, statsData.pending);

            // تحديث الأرقام الثابتة
            if (elements.totalCount) elements.totalCount.innerHTML = `<span>مشروع</span> ${statsData.total}`;
            if (elements.legendOngoing) elements.legendOngoing.textContent = statsData.ongoing;
            if (elements.legendStopped) elements.legendStopped.textContent = statsData.stopped;
            if (elements.legendPending) elements.legendPending.textContent = statsData.pending;

            // أنيميشن التشارت
            animateChart(elements, statsData);
        };

        setTimeout(startAnimations, 500);
    }
};

function animateCounter(el, target) {
    if (!el) return;
    let current = 0;
    const duration = 1500;
    const startTime = performance.now();

    const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        current = Math.round(eased * target);
        el.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };
    requestAnimationFrame(step);
}

function animateChart(elements, statsData) {
    const canvas = elements.donutChart;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const chartColors = ['#0ea5e9', '#cbd5e1', '#a78bfa'];
    let start = null;
    const duration = 1500;

    function drawDonut(progress) {
        const dpr = window.devicePixelRatio || 1;
        const size = 160;

        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.scale(dpr, dpr);

        const cx = size / 2;
        const cy = size / 2;
        const outerR = Math.max(1, size / 2 - 4);
        const innerR = Math.max(1, outerR * 0.62);

        ctx.clearRect(0, 0, size, size);

        const slices = [
            { value: statsData.ongoing, color: chartColors[0] },
            { value: statsData.stopped, color: chartColors[1] },
            { value: statsData.pending, color: chartColors[2] }
        ];

        let startAngle = -Math.PI / 2;
        const gap = 0.04;

        slices.forEach((slice, i) => {
            const sliceAngle = (slice.value / statsData.total) * Math.PI * 2 * progress;
            const endAngle = startAngle + sliceAngle - gap;

            if (sliceAngle > gap) {
                ctx.beginPath();
                ctx.arc(cx, cy, outerR, startAngle, endAngle);
                ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
                ctx.closePath();
                ctx.fillStyle = slice.color;

                if (i === 0) {
                    ctx.shadowColor = slice.color;
                    ctx.shadowBlur = 10 * progress;
                } else {
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                }

                ctx.fill();
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }
            startAngle += sliceAngle;
        });
    }

    function step(timestamp) {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        drawDonut(eased);
        if (elements.chartCenterNum) {
            elements.chartCenterNum.textContent = Math.round(statsData.total * eased);
        }

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}
