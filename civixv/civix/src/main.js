import { ensureAppShell } from './ui/appShell.js';
import { APP_ROUTES } from './utils/constants.js';
import { authGuard } from './features/auth/authGuard.js';
import { loginView } from './pages/login/loginView.js';
import { loginController } from './pages/login/login.js';
import { dashboardView } from './pages/dashboard/dashboardView.js';
import { dashboardController } from './pages/dashboard/dashboard.js';
import { financialView } from './pages/financial/financialView.js';
import { financialController } from './pages/financial/financial.js';
import { facilitiesView } from './pages/facilities/facilitiesView.js';
import { facilitiesController } from './pages/facilities/facilities.js';
import { projectsView } from './pages/projects/projectsView.js';
import { projectDetailsView } from './pages/financial/projectDetailsView.js';
import { extractsController } from './features/extracts/extractsController.js';

const appRoot = document.getElementById('app-root');
const pageStyle = document.getElementById('page-style');

console.log('[Main] التطبيق بدأ التحميل...');

async function router() {
    const currentHash = window.location.hash;
    const hash = currentHash.replace('#', '') || APP_ROUTES.LOGIN;

    console.log(`[Router] التنقل إلى: ${hash}`);

    const redirectPath = authGuard.checkAuth(hash);
    if (redirectPath) {
        const newHash = `#${redirectPath}`;
        if (window.location.hash !== newHash) {
            console.log(`[Router] إعادة توجيه من ${hash} إلى ${redirectPath}`);
            window.location.hash = newHash;
        }
        return;
    }

    if (appRoot) {
        appRoot.innerHTML = '';
    } else {
        console.error('[Router] لم يتم العثور على عنصر #app-root');
        return;
    }

    try {
        if (hash === APP_ROUTES.LOGIN) {
            await renderLoginPage();
        } else if (hash === APP_ROUTES.DASHBOARD) {
            await renderDashboardPage();
        } else if (hash === APP_ROUTES.FINANCIAL) {
            await renderFinancialPage();
        } else if (hash === APP_ROUTES.FACILITIES) {
            await renderFacilitiesPage();
        } else if (hash === APP_ROUTES.PROJECTS) {
            await renderProjectsPage();
        } else if (hash.startsWith('/projects/') && !hash.includes('/extracts/')) {
            // صفحة تفاصيل المشروع: /projects/123
            const projectId = hash.replace('/projects/', '').split('/')[0];
            await renderProjectDetailsPage(projectId);
        } else if (hash.startsWith('/projects/') && hash.includes('/extracts/')) {
            // صفحة تفاصيل المستخلص: /projects/123/extracts/456
            const parts = hash.split('/');
            const extractId = parts[parts.length - 1];
            await renderExtractDetailsPage(extractId);
        } else {
            console.warn(`[Router] مسار غير معروف: ${hash}، العودة لصفحة الدخول.`);
            window.location.hash = APP_ROUTES.LOGIN;
        }
    } catch (error) {
        console.error('[Router] خطأ أثناء تحميل الصفحة:', error);
        appRoot.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">
            <h3>حدث خطأ في تحميل الصفحة</h3>
            <p>${error.message}</p>
            <button onclick="window.location.hash='${APP_ROUTES.LOGIN}'">العودة للرئيسية</button>
        </div>`;
    }
}

async function renderLoginPage() {
    if (pageStyle) pageStyle.href = './public/styles/login.css';
    appRoot.innerHTML = loginView.render();
    loginController.init();
}

async function renderDashboardPage() {
    if (pageStyle) pageStyle.href = './public/styles/dashboard.css';
    appRoot.innerHTML = dashboardView.render();
    dashboardController.init();
}

async function renderFinancialPage() {
    if (pageStyle) pageStyle.href = './public/styles/financial.css';
    appRoot.innerHTML = financialView.render();
    await financialController.init();
}

async function renderFacilitiesPage() {
    if (pageStyle) pageStyle.href = './public/styles/facilities.css';
    appRoot.innerHTML = facilitiesView.render();
    await facilitiesController.init();
}

async function renderProjectsPage() {
    if (pageStyle) pageStyle.href = './public/styles/facilities.css';
    appRoot.innerHTML = projectsView.render();
    await projectsView.init();
}

async function renderProjectDetailsPage(projectId) {
    if (pageStyle) pageStyle.href = './public/styles/financial.css';
    appRoot.innerHTML = projectDetailsView.render();
    await projectDetailsView.init(projectId);
}

async function renderExtractDetailsPage(extractId) {
    if (pageStyle) pageStyle.href = './public/styles/extract.css';
    if (!extractId) return;
    await extractsController.initExtractDetails(extractId);
}

window.addEventListener('hashchange', router);

window.addEventListener('DOMContentLoaded', () => {
    ensureAppShell();
    router();
});
