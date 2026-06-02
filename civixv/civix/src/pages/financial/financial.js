import { financialView } from './financialView.js';
import { projectsView } from '../projects/projectsView.js';
import { headerView } from '../headerView.js';
import { projectsService, filterProjectsLocally } from '../../features/projects/projectsService.js';
import { DUMMY_FINANCIAL_PROJECTS } from './financialView.js';
import { APP_ROUTES } from '../../utils/constants.js';
import { appStore } from '../../store/appStore.js';
import { showToast } from '../../ui/toast.js';

export const financialController = {
    init: async () => {
        headerView.init();
        const elements = financialView.getElements();
        let allProjects = [];

        // منطق التنقل بين التبويبات
        const bindNav = () => {
            if (elements.btnFinancialHome) {
                elements.btnFinancialHome.onclick = () => {
                    window.location.hash = APP_ROUTES.DASHBOARD;
                };
            }
            if (elements.btnFinancialBack) {
                elements.btnFinancialBack.onclick = () => financialView.showStatsView(elements);
            }
            if (elements.btnProjects) {
                elements.btnProjects.onclick = () => financialView.showView('projects', elements);
            }
            if (elements.btnDelegations) {
                elements.btnDelegations.onclick = () => financialView.showView('delegations', elements);
            }
        };
        bindNav();

        // تحميل البيانات
        const loadData = async () => {
            financialView.showLoading();
            financialView.renderProjectsLoading();
            try {
                allProjects = await projectsView.loadProjectsData();
                appStore.setProjects(allProjects);
            } catch (error) {
                console.error('[Financial] Load failed', error);
                const msg =
                    error instanceof Error ? error.message : 'تعذر تحميل المشاريع';
                showToast(`${msg} — عرض بيانات تجريبية مؤقتاً`, 'warning');
                allProjects = DUMMY_FINANCIAL_PROJECTS;
                appStore.setProjects(allProjects);
            }

            financialView.hideStatus();
            financialView.renderProjects(allProjects);
            calculateAndShowStats(allProjects);
        };

        const calculateAndShowStats = (projects) => {
            let totalBudget = 0;
            let totalPaid = 0;

            projects.forEach(p => {
                const val = parseFloat(String(p.Contract_value || p.contract_value || '0').replace(/,/g, '')) || 0;
                const paid = parseFloat(String(p.paid || '0').replace(/,/g, '')) || 0;
                totalBudget += val;
                totalPaid += paid;
            });

            const totalRemaining = totalBudget - totalPaid;

            const stats = {
                totalBudget: totalBudget.toLocaleString(),
                totalPaid: totalPaid.toLocaleString(),
                totalRemaining: totalRemaining.toLocaleString(),
            };
            appStore.setStats(stats);
            financialView.renderDashboardStats(stats);
        };

        await loadData();

        // منطق البحث
        const handleProjectSearch = async () => {
            const query = elements.projectSearch.value.trim();
            if (!query) {
                financialView.renderProjects(allProjects);
                financialView.hideStatus();
                return;
            }

            financialView.showLoading();
            financialView.renderProjectsLoading();
            try {
                const results = await projectsService.search(query);
                financialView.renderProjects(results);
                financialView.hideStatus();
                if (!results?.length) {
                    showToast('لا توجد نتائج مطابقة للبحث', 'info');
                }
            } catch (error) {
                console.warn('[Financial] Server search failed, using local filter', error);
                showToast('تعذر البحث على الخادم — تمت التصفية محلياً (عقد / مشروع / مشرف)', 'warning');
                const filtered = filterProjectsLocally(allProjects, query);
                financialView.renderProjects(filtered);
                financialView.hideStatus();
            }
        };

        if (elements.projectSearchBtn) elements.projectSearchBtn.onclick = handleProjectSearch;
        if (elements.projectSearch) {
            elements.projectSearch.onkeyup = (e) => {
                if (e.key === 'Enter') handleProjectSearch();
            };
        }
    }
};
