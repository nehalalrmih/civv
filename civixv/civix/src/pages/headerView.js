import { authGuard } from '../features/auth/authGuard.js';

export const headerView = {
    render: () => `
<header class="header">
    <div class="menu-container">
        <div class="menu-icon" id="menuToggle">
            <span></span><span></span><span></span>
        </div>
        <div class="header-title">
            جهاز تنفيذ مشروعات الإسكان والمرافق - مكتب الزاوية
        </div>
        <div class="dropdown-menu" id="dropdownMenu">
            <a href="#" id="logoutBtn"><i class="fa-solid fa-right-to-bracket"></i> تسجيل الخروج</a>
        </div>
    </div>
    <div class="logo">
        <img src="./public/images/Exclude.png" alt="الشعار">
    </div>
</header>
    `,

    init: () => {
        const menuToggle = document.getElementById('menuToggle');
        const dropdownMenu = document.getElementById('dropdownMenu');
        const logoutBtn = document.getElementById('logoutBtn');

        if (menuToggle && dropdownMenu) {
            menuToggle.onclick = (e) => {
                e.stopPropagation();
                menuToggle.classList.toggle('active');
                dropdownMenu.classList.toggle('active');
            };
        }

        if (logoutBtn) {
            logoutBtn.onclick = (e) => {
                e.preventDefault();
                authGuard.logout();
            };
        }

        // Close dropdown when clicking outside
        const closeDropdown = (e) => {
            if (dropdownMenu && menuToggle) {
                if (!menuToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
                    dropdownMenu.classList.remove('active');
                    menuToggle.classList.remove('active');
                }
            }
        };
        window.addEventListener('click', closeDropdown);
        
        // Return cleanup function if needed
        return () => window.removeEventListener('click', closeDropdown);
    }
};
