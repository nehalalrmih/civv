import { authService } from '../../features/auth/authService.js';
import { authStore } from '../../store/authStore.js';
import { appStore } from '../../store/appStore.js';
import { APP_ROUTES } from '../../utils/constants.js';
import { loginView } from './loginView.js';

/**
 * منطق صفحة تسجيل الدخول (Login Page Logic)
 */
export const loginController = {
    init: () => {
        const elements = loginView.getElements();

        if (elements.form) {
            elements.form.addEventListener('submit', (e) => handleLogin(e, elements));
        }
    },
};

async function handleLogin(e, elements) {
    e.preventDefault();

    const credentials = {
        username: elements.username.value.trim(),
        password: elements.password.value.trim(),
    };

    loginView.setLoading(elements);

    try {
        const result = await authService.login(credentials);

        const accessToken = result?.access_token;
        if (!accessToken || typeof accessToken !== 'string') {
            throw new Error('استجابة غير صالحة: لا يوجد access_token');
        }

        loginView.setFeedback(
            elements,
            'تم تسجيل الدخول بنجاح، جاري التوجيه...',
            'green',
            false,
        );
        authStore.setToken(accessToken);
        appStore.setUser({ username: credentials.username, authenticated: true });

        setTimeout(() => {
            window.location.hash = APP_ROUTES.DASHBOARD;
        }, 1200);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء تسجيل الدخول';
        loginView.setFeedback(elements, message, 'red', true);
    }
}
