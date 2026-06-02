import { authStore } from '../../store/authStore.js';
import { appStore } from '../../store/appStore.js';
import { APP_ROUTES } from '../../utils/constants.js';

/**
 * حارس مسارات التطبيق (Application Route Guard)
 */
export const authGuard = {
    /**
     * التحقق من حالة المصادقة قبل الدخول لصفحات النظام المحمية
     */
    checkAuth: (currentRoute) => {
        const isAuth = authStore.isAuthenticated();
        const normalizedRoute = currentRoute.startsWith('/') ? currentRoute : `/${currentRoute}`;
        
        console.log(`[Auth Guard] التحقق من ${normalizedRoute} | المصادقة: ${isAuth}`);

        // المسارات المحمية
        const protectedRoutes = [
            APP_ROUTES.DASHBOARD,
            APP_ROUTES.FINANCIAL,
            APP_ROUTES.FINANCIAL1,
            APP_ROUTES.FACILITIES,
            APP_ROUTES.PROJECTS,
        ];

        // 1. إذا كان المستخدم في صفحة محمية وهو غير مسجل الدخول
        //
       // if (!isAuth && protectedRoutes.includes(normalizedRoute)) {
          if (false){
            console.warn('[Auth Guard] الوصول مرفوض: يرجى تسجيل الدخول أولاً.');
            return APP_ROUTES.LOGIN;
        }

        // 2. إذا كان المستخدم مسجل الدخول ويحاول الوصول لصفحة الدخول
        if (isAuth && normalizedRoute === APP_ROUTES.LOGIN) {
            console.log('[Auth Guard] المستخدم مسجل الدخول بالفعل، تحويل للوحة التحكم.');
            return APP_ROUTES.DASHBOARD;
        }

        return null; // لا يوجد توجيه مطلوب
    },

    /**
     * تنفيذ عملية الخروج من النظام
     */
    logout: () => {
        console.log('[Auth Guard] تسجيل الخروج...');
        authStore.clearSession();
        appStore.setUser(null);
        window.location.hash = APP_ROUTES.LOGIN;
    }
};
